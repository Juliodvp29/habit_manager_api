import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { readFileSync } from 'fs';
import helmet from 'helmet';
import morgan from 'morgan';
import { AppModule } from './app.module';

async function bootstrap() {
  const httpsOptions = {
    key: readFileSync('./certs/localhost+1-key.pem'),
    cert: readFileSync('./certs/localhost+1.pem'),
  };

  const app = await NestFactory.create(AppModule, { httpsOptions });

  // Security
  app.use(helmet());

  // CORS
  const rawOrigins = process.env.CORS_ORIGIN || 'https://localhost:8100';
  const allowedOrigins = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);

  app.enableCors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin) {
        const isDev = process.env.NODE_ENV === 'development';
        return callback(null, isDev);
      }

      const isDev = process.env.NODE_ENV === 'development';
      const devPatterns = isDev ? ['localhost', 'ngrok'] : [];

      const isAllowed = allowedOrigins.some(allowed => {
        return requestOrigin === allowed || requestOrigin.startsWith(`${allowed}/`);
      }) || devPatterns.some(pattern => requestOrigin.includes(pattern));

      if (isAllowed) {
        return callback(null, true);
      }

      console.warn('⚠️ CORS rejected:', requestOrigin);
      return callback(new Error('CORS origin not allowed'), false);
    },
    credentials: true,
  });

  // Logging
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ========================================
  // 📚 SWAGGER CONFIGURATION
  // ========================================
  const config = new DocumentBuilder()
    .setTitle('Habit Manager API')
    .setDescription('API RESTful para gestión de hábitos con autenticación, notificaciones push y análisis con IA')
    .setVersion('1.0')
    .addTag('auth', 'Endpoints de autenticación y registro')
    .addTag('habits', 'Gestión de hábitos del usuario')
    .addTag('ai', 'Análisis y recomendaciones con IA')
    .addTag('notifications', 'Sistema de notificaciones')
    .addTag('users', 'Perfil y configuración del usuario')
    .addTag('sync', 'Sincronización offline')
    .addTag('fcm', 'Firebase Cloud Messaging - Push Notifications')
    .addTag('verification', 'Códigos de verificación y recuperación')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Ingresa tu token JWT (obtenido del login)',
        name: 'Authorization',
        in: 'header',
      },
      'JWT-auth', // Este es el nombre que usarás en los decoradores
    )
    .addServer('https://localhost:3000/', 'Desarrollo Local (HTTPS)')
    .addServer('http://localhost:3000/', 'Desarrollo Local (HTTP)')
    .addServer('https://api.habitmanager.com/api/v1', 'Producción')
    .setContact(
      'Equipo de Desarrollo',
      'https://habitmanager.com',
      'soporte@habitmanager.com'
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Habit Manager API Docs',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    customCss: `
    .swagger-ui .topbar { 
      background-color: #667eea;
    }
    .swagger-ui .info .title {
      color: #667eea;
      font-size: 2.5rem;
    }
  `,
    swaggerOptions: {
      persistAuthorization: true, // Mantener el token cuando recargues la página
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none', // Colapsar todo por defecto
      filter: true, // Agregar barra de búsqueda
      showCommonExtensions: true,
      tryItOutEnabled: true,
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Application is running on: https://localhost:${port}/api/v1`);
  console.log(`📚 Swagger documentation: https://localhost:${port}/api/docs`);
}

bootstrap();