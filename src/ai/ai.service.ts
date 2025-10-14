import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { AiRecommendation } from '../entities/ai-recommendation.entity';
import { HabitLog } from '../entities/habit-log.entity';
import { Habit } from '../entities/habit.entity';
import { User } from '../entities/user.entity';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface DayPattern {
  completed: number;
  total: number;
  rate: number;
}

export interface HabitAnalysis {
  totalDays: number;
  completedDays: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  bestDay: string;
  worstDay: string;
  dayPatterns: { [key: string]: DayPattern };
  trend: 'improving' | 'declining' | 'stable';
  suggestions: string[];
}

interface Suggestion {
  habitId: number;
  habitTitle: string;
  type: string;
  priority: string;
  message: string;
  action: string;
}

@Injectable()
export class AiService {
  private openaiApiKey: string | undefined;
  private openaiApiUrl = 'https://api.openai.com/v1/chat/completions';
  private readonly dayNames = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
  ];

  constructor(
    private configService: ConfigService,
    @InjectRepository(Habit)
    private habitRepository: Repository<Habit>,
    @InjectRepository(HabitLog)
    private logRepository: Repository<HabitLog>,
    @InjectRepository(AiRecommendation)
    private recommendationRepository: Repository<AiRecommendation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    this.openaiApiKey = this.configService.get('OPENAI_API_KEY');
  }

  // ========================================
  // RF-04: ANÁLISIS COMPLETO CON IA
  // ========================================

  async analyzeHabitPattern(
    habitId: number,
    userId: number,
  ): Promise<{ habitId: number; habitTitle: string; analysis: HabitAnalysis }> {
    const habit = await this.habitRepository.findOne({
      where: { id: habitId, user: { id: userId } },
    });

    if (!habit) {
      throw new Error('Hábito no encontrado');
    }

    // Obtener logs de los últimos 30 días
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const logs = await this.logRepository.find({
      where: {
        habit: { id: habitId },
        logDate: Between(startDate, endDate),
      },
      order: { logDate: 'ASC' },
    });

    const analysis = this.performDeepAnalysis(logs, habit);

    return {
      habitId,
      habitTitle: habit.title,
      analysis,
    };
  }

  private performDeepAnalysis(logs: HabitLog[], habit: Habit): HabitAnalysis {
    const totalDays = logs.length;
    const completedDays = logs.filter((log) => log.completed).length;
    const completionRate =
      totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

    // Analizar patrones por día de la semana
    const dayPatterns: { [key: string]: DayPattern } = {};

    for (let i = 0; i < 7; i++) {
      dayPatterns[this.dayNames[i]] = { completed: 0, total: 0, rate: 0 };
    }

    logs.forEach((log) => {
      const dayOfWeek = new Date(log.logDate).getDay();
      const dayName = this.dayNames[dayOfWeek];
      dayPatterns[dayName].total++;
      if (log.completed) {
        dayPatterns[dayName].completed++;
      }
    });

    // Calcular tasas
    Object.keys(dayPatterns).forEach((day) => {
      const pattern = dayPatterns[day];
      pattern.rate =
        pattern.total > 0
          ? Math.round((pattern.completed / pattern.total) * 100)
          : 0;
    });

    // Encontrar mejor y peor día
    let bestDay = { name: '', rate: 0 };
    let worstDay = { name: '', rate: 100 };

    Object.entries(dayPatterns).forEach(([day, data]) => {
      if (data.total > 0) {
        if (data.rate > bestDay.rate) {
          bestDay = { name: day, rate: data.rate };
        }
        if (data.rate < worstDay.rate) {
          worstDay = { name: day, rate: data.rate };
        }
      }
    });

    // Calcular rachas
    const streaks = this.calculateStreaks(logs);

    // Detectar tendencia (últimos 15 días vs primeros 15 días)
    const midPoint = Math.floor(logs.length / 2);
    const firstHalf = logs.slice(0, midPoint);
    const secondHalf = logs.slice(midPoint);

    const firstHalfRate =
      firstHalf.length > 0 ? firstHalf.filter((l) => l.completed).length / firstHalf.length : 0;
    const secondHalfRate =
      secondHalf.length > 0 ? secondHalf.filter((l) => l.completed).length / secondHalf.length : 0;

    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (secondHalfRate > firstHalfRate + 0.1) trend = 'improving';
    else if (secondHalfRate < firstHalfRate - 0.1) trend = 'declining';

    // Generar sugerencias basadas en datos
    const suggestions = this.generateDataDrivenSuggestions(
      dayPatterns,
      completionRate,
      trend,
      habit,
    );

    return {
      totalDays,
      completedDays,
      completionRate,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      bestDay: bestDay.name || 'N/A',
      worstDay: worstDay.name || 'N/A',
      dayPatterns,
      trend,
      suggestions,
    };
  }

  private calculateStreaks(logs: HabitLog[]): {
    current: number;
    longest: number;
  } {
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const sortedLogs = [...logs].sort(
      (a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime(),
    );

    // Racha actual
    for (const log of sortedLogs) {
      if (log.completed) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Racha más larga
    logs.forEach((log) => {
      if (log.completed) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    });

    return { current: currentStreak, longest: longestStreak };
  }

  private generateDataDrivenSuggestions(
    dayPatterns: { [key: string]: DayPattern },
    completionRate: number,
    trend: string,
    habit: Habit,
  ): string[] {
    const suggestions: string[] = [];

    // Sugerencia basada en tasa de cumplimiento
    if (completionRate < 50) {
      suggestions.push(
        `Tu tasa de cumplimiento es del ${completionRate}%. Considera reducir la frecuencia de "${habit.frequency}" a algo más manejable.`,
      );
    } else if (completionRate > 80) {
      suggestions.push(
        `¡Excelente! Mantienes un ${completionRate}% de cumplimiento. Podrías considerar aumentar el desafío.`,
      );
    }

    // Sugerencia basada en día de la semana
    const worstDays = Object.entries(dayPatterns)
      .filter(([_, data]) => data.total > 0 && data.rate < 50)
      .map(([day, _]) => day);

    if (worstDays.length > 0) {
      suggestions.push(
        `Los ${worstDays.join(', ')} son tus días más difíciles. Intenta prepararte la noche anterior o ajusta tu horario.`,
      );
    }

    // Sugerencia basada en tendencia
    if (trend === 'declining') {
      suggestions.push(
        'Se detectó una tendencia a la baja en las últimas semanas. ¿Hay algo que esté interfiriendo? Considera ajustar tu enfoque.',
      );
    } else if (trend === 'improving') {
      suggestions.push(
        '¡Estás mejorando! Tu tendencia es positiva. Mantén el impulso.',
      );
    }

    return suggestions;
  }

  // ========================================
  // RF-04: RECOMENDACIÓN CON OPENAI
  // ========================================

  async generateRecommendation(habitId: number, userId: number): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['preferredLanguage'],
    });

    const analysisData = await this.analyzeHabitPattern(habitId, userId);
    const { analysis } = analysisData;

    const language = user?.preferredLanguage?.code || 'es';
    const prompt = this.buildAIPrompt(analysisData, language);

    // Llamar a OpenAI
    const aiRecommendation = await this.callOpenAI(prompt);

    // Guardar recomendación en BD
    const savedRecommendation = await this.recommendationRepository.save({
      user: { id: userId },
      habit: { id: habitId },
      message: aiRecommendation,
      category: 'pattern_analysis',
    });

    return {
      recommendation: aiRecommendation,
      analysis,
      savedRecommendation,
    };
  }

  private buildAIPrompt(
    data: { habitTitle: string; analysis: HabitAnalysis },
    language: string,
  ): string {
    const lang = language === 'es' ? 'español' : 'English';
    const { habitTitle, analysis } = data;

    return `Eres un coach de hábitos experto. Analiza los siguientes datos y proporciona una recomendación personalizada, práctica y motivadora en ${lang}.

**Hábito:** "${habitTitle}"

**Análisis de 30 días:**
- Días completados: ${analysis.completedDays} de ${analysis.totalDays}
- Tasa de cumplimiento: ${analysis.completionRate}%
- Racha actual: ${analysis.currentStreak} días
- Racha más larga: ${analysis.longestStreak} días
- Mejor día: ${analysis.bestDay}
- Peor día: ${analysis.worstDay}
- Tendencia: ${analysis.trend === 'improving' ? 'Mejorando' : analysis.trend === 'declining' ? 'Decayendo' : 'Estable'}

**Sugerencias detectadas:**
${analysis.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Proporciona una recomendación en 3-4 frases que incluya:
1. Reconocimiento específico de sus patrones (menciona días, rachas, tendencias)
2. UNA sugerencia práctica y específica para mejorar
3. Motivación personalizada

Responde SOLO con la recomendación, sin saludos ni despedidas.`;
  }

  // ========================================
  // RF-07: MENSAJES MOTIVACIONALES CON IA
  // ========================================

  async generateMotivationalMessage(userId: number): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['preferredLanguage', 'habits'],
    });

    const habits = await this.habitRepository.find({
      where: { user: { id: userId }, isActive: true },
      relations: ['logs'],
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalHabits = habits.length;
    const completedToday = habits.filter((habit) =>
      habit.logs.some(
        (log) =>
          log.logDate.getTime() === today.getTime() && log.completed,
      ),
    ).length;

    // Calcular racha promedio
    let totalStreak = 0;
    habits.forEach((habit) => {
      const sortedLogs = [...habit.logs].sort(
        (a, b) =>
          new Date(b.logDate).getTime() - new Date(a.logDate).getTime(),
      );
      let streak = 0;
      for (const log of sortedLogs) {
        if (log.completed) streak++;
        else break;
      }
      totalStreak += streak;
    });

    const avgStreak =
      totalHabits > 0 ? Math.round(totalStreak / totalHabits) : 0;

    const language = user?.preferredLanguage?.code || 'es';
    const prompt = this.buildMotivationalPrompt(
      totalHabits,
      completedToday,
      avgStreak,
      language,
    );

    const message = await this.callOpenAI(prompt);

    return {
      message,
      stats: {
        totalHabits,
        completedToday,
        avgStreak,
      },
    };
  }

  private buildMotivationalPrompt(
    totalHabits: number,
    completedToday: number,
    avgStreak: number,
    language: string,
  ): string {
    const lang = language === 'es' ? 'español' : 'English';

    return `Eres un coach motivacional energético y empático. Genera un mensaje inspirador en ${lang} para una persona que:

- Tiene ${totalHabits} hábitos activos
- Ha completado ${completedToday} de ${totalHabits} hábitos hoy
- Tiene una racha promedio de ${avgStreak} días

El mensaje debe:
- Ser breve (2-3 frases máximo)
- Incluir 1-2 emojis relevantes
- Ser personalizado según sus números
- Terminar con una llamada a la acción motivadora

${completedToday === 0 ? 'La persona aún no ha completado nada hoy, motívala a empezar.' : ''}
${completedToday === totalHabits ? '¡La persona completó TODO hoy! Celébralo con entusiasmo.' : ''}

Responde SOLO con el mensaje motivacional, sin explicaciones.`;
  }

  // ========================================
  // SUGERENCIAS AUTOMÁTICAS INTELIGENTES
  // ========================================

  async getSuggestions(userId: number): Promise<any> {
    const habits = await this.habitRepository.find({
      where: { user: { id: userId }, isActive: true },
      relations: ['logs'],
    });

    const suggestions: Suggestion[] = [];

    for (const habit of habits) {
      const logs = habit.logs.slice(-14); // Últimos 14 días
      if (logs.length < 7) continue; // Necesita al menos 1 semana de datos

      const completedLogs = logs.filter((l) => l.completed).length;
      const completionRate = completedLogs / logs.length;

      if (completionRate < 0.4) {
        suggestions.push({
          habitId: habit.id,
          habitTitle: habit.title,
          type: 'low_completion',
          priority: 'high',
          message: `"${habit.title}" tiene solo ${Math.round(completionRate * 100)}% de cumplimiento. Considera reducir la frecuencia o ajustar el horario.`,
          action: 'adjust_frequency',
        });
      }

      if (completionRate > 0.85 && habit.frequency === 'daily') {
        suggestions.push({
          habitId: habit.id,
          habitTitle: habit.title,
          type: 'high_performance',
          priority: 'medium',
          message: `¡Excelente trabajo con "${habit.title}"! (${Math.round(completionRate * 100)}% completado). ¿Listo para un nuevo desafío?`,
          action: 'increase_challenge',
        });
      }

      // Detectar abandono (no hay logs recientes)
      const lastLog = logs[logs.length - 1];
      const daysSinceLastLog = lastLog
        ? Math.floor(
          (new Date().getTime() - new Date(lastLog.logDate).getTime()) /
          (1000 * 60 * 60 * 24),
        )
        : Infinity;

      if (daysSinceLastLog > 3) {
        suggestions.push({
          habitId: habit.id,
          habitTitle: habit.title,
          type: 'abandonment_risk',
          priority: 'high',
          message: `Hace ${daysSinceLastLog} días que no registras "${habit.title}". ¡Retoma hoy mismo!`,
          action: 'resume_habit',
        });
      }
    }

    return {
      suggestions,
      totalSuggestions: suggestions.length,
    };
  }

  // ========================================
  // HISTORIAL DE RECOMENDACIONES
  // ========================================

  async getRecommendationHistory(userId: number, limit: number = 10) {
    return await this.recommendationRepository.find({
      where: { user: { id: userId } },
      relations: ['habit'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // ========================================
  // LLAMADA A OPENAI API
  // ========================================

  private async callOpenAI(prompt: string): Promise<string> {
    if (!this.openaiApiKey) {
      console.warn('OpenAI API Key not configured, using fallback messages');
      return this.generateFallbackMessage();
    }

    try {
      const messages: OpenAIMessage[] = [
        {
          role: 'system',
          content:
            'Eres un coach de hábitos experto, empático y motivador. Proporcionas consejos prácticos y personalizados basados en datos reales.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ];

      console.log('Calling OpenAI with prompt:', prompt); // Debug log

      const response = await fetch(this.openaiApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.7,
          max_tokens: 250,
        }),
      });

      console.log('OpenAI response status:', response.status); // Debug log

      if (!response.ok) {
        console.error(`OpenAI API error: ${response.status}`);
        const errorText = await response.text();
        console.error('OpenAI error response:', errorText);
        return this.generateFallbackMessage();
      }

      const data: OpenAIResponse = await response.json();
      console.log('OpenAI response data:', data); // Debug log
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      return this.generateFallbackMessage();
    }
  }

  private generateFallbackMessage(): string {
    const messages = [
      '¡Sigue así! Cada pequeño paso cuenta en tu camino hacia mejores hábitos. 💪',
      'La constancia es la clave del éxito. ¡Tú puedes lograrlo! 🌟',
      'Recuerda: el progreso, no la perfección. ¡Continúa avanzando! 🚀',
      'Cada día es una nueva oportunidad para mejorar. ¡Adelante! ✨',
      'Los hábitos se construyen un día a la vez. ¡Hoy es tu día! 💫',
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }
}