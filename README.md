<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).


# 📚 Habit Manager API - Documentación

**Versión:** 1.0.0  
**Framework:** NestJS + TypeScript  
**Base de Datos:** PostgreSQL  
**Arquitectura:** REST API con autenticación JWT  

---

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Características Implementadas](#características-implementadas)
3. [Instalación y Configuración](#instalación-y-configuración)
4. [Variables de Entorno](#variables-de-entorno)
5. [Endpoints de la API](#endpoints-de-la-api)
6. [Autenticación y Seguridad](#autenticación-y-seguridad)
7. [Funcionalidades Pendientes](#funcionalidades-pendientes)
8. [Estructura del Proyecto](#estructura-del-proyecto)

---

## 🎯 Descripción General

API REST desarrollada en NestJS para el proyecto **Habit Manager con IA**. Esta API proporciona servicios de backend para una aplicación móvil híbrida que permite a los usuarios crear, gestionar y analizar sus hábitos con ayuda de inteligencia artificial.

### Tecnologías Principales
- **NestJS** v11 - Framework de Node.js
- **TypeORM** - ORM para PostgreSQL
- **PostgreSQL** - Base de datos relacional
- **JWT** - Autenticación basada en tokens
- **bcrypt** - Hash de contraseñas
- **Nodemailer** - Envío de correos electrónicos
- **OpenAI API** - Análisis y recomendaciones con IA

---

## ✅ Características Implementadas

### 🔐 Autenticación y Seguridad (RF-01)
- ✅ Registro de usuarios con hash de contraseñas (bcrypt)
- ✅ Login con JWT
- ✅ Verificación de email mediante código de 6 dígitos
- ✅ Autenticación de dos factores (2FA) obligatoria
- ✅ Recuperación de contraseña
- ✅ Reenvío de códigos de verificación
- ✅ Registro de intentos de login (IP y User-Agent)
- ✅ Protección de rutas con Guards JWT

### 📝 Gestión de Hábitos (RF-02, RF-03)
- ✅ CRUD completo de hábitos
- ✅ Registro de progreso diario (logs)
- ✅ Dashboard con resumen de hábitos
- ✅ Estadísticas detalladas por hábito
- ✅ Soporte para frecuencias (daily, weekly, monthly)
- ✅ Activación/desactivación de hábitos

### 🧠 Inteligencia Artificial (RF-04, RF-07)
- ✅ Análisis profundo de patrones de cumplimiento
- ✅ Detección de mejores y peores días
- ✅ Cálculo de rachas (actual y más larga)
- ✅ Identificación de tendencias (mejorando/decayendo/estable)
- ✅ Recomendaciones personalizadas con OpenAI GPT-4
- ✅ Mensajes motivacionales adaptativos
- ✅ Sugerencias automáticas inteligentes
- ✅ Historial de recomendaciones

### 🔔 Notificaciones (RF-05)
- ✅ Sistema base de notificaciones
- ✅ Marcado de notificaciones como leídas
- ⚠️ **Pendiente:** Integración con Firebase Cloud Messaging (FCM)

### 🔄 Sincronización Offline (RF-09)
- ✅ Sincronización bidireccional de hábitos y logs
- ✅ Detección y resolución de conflictos
- ✅ Obtención de cambios desde última sincronización
- ✅ Timestamps de sincronización

### 👤 Gestión de Usuarios
- ✅ Perfil de usuario con foto
- ✅ Configuración de preferencias
- ✅ Soporte multilenguaje (es/en)
- ✅ Temas (claro/oscuro)
- ✅ Eliminación de cuenta

---

## 🚀 Instalación y Configuración

### Requisitos Previos
- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm o yarn

### Pasos de Instalación

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd habit_manager_api

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Ejecutar migraciones de base de datos
# (Ejecutar el script SQL habit_ai_v2.sql en PostgreSQL)

# 5. Iniciar el servidor en desarrollo
npm run start:dev

# 6. Iniciar el servidor en producción
npm run build
npm run start:prod
```

---

## 🔧 Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_DATABASE=habit_manager

# JWT
JWT_SECRET=tu_clave_secreta_super_segura
JWT_EXPIRATION=7d

# OpenAI (Opcional - si no se configura, usa mensajes predeterminados)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx

# Servidor de correo (SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=tu_email@gmail.com
MAIL_PASSWORD=tu_app_password
MAIL_FROM="Habit Manager <noreply@habitmanager.com>"

# Configuración general
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:8100

# Seguridad
MAX_VERIFICATION_ATTEMPTS=3
```

---

## 🌐 Endpoints de la API

**Base URL:** `http://localhost:3000/api/v1`

### 🔐 Autenticación (`/auth`)

#### Registro de Usuario
```http
POST /auth/register
```

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123",
  "fullName": "Juan Pérez"
}
```

**Respuesta (201):**
```json
{
  "message": "Usuario registrado. Por favor verifica tu email.",
  "user": {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "fullName": "Juan Pérez",
    "isEmailVerified": false
  },
  "emailSent": true,
  "requiresVerification": true
}
```

---

#### Login
```http
POST /auth/login
```

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

**Respuesta (200) - Si requiere 2FA:**
```json
{
  "requires2FA": true,
  "message": "Se ha enviado un código de verificación a tu email",
  "userId": 1,
  "email": "u******o@ejemplo.com"
}
```

---

#### Verificar 2FA
```http
POST /auth/verify-2fa
```

**Body:**
```json
{
  "userId": 1,
  "code": "123456"
}
```

**Respuesta (200):**
```json
{
  "user": {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "fullName": "Juan Pérez"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login exitoso"
}
```

---

#### Obtener Perfil
```http
GET /auth/profile
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "id": 1,
  "email": "usuario@ejemplo.com",
  "fullName": "Juan Pérez",
  "profilePicture": null,
  "isEmailVerified": true,
  "preferredLanguage": {
    "id": 1,
    "code": "es",
    "name": "Español"
  }
}
```

---

### ✉️ Verificación (`/verification`)

#### Verificar Email
```http
POST /verification/verify-email
```

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "code": "123456"
}
```

**Respuesta (200):**
```json
{
  "message": "Email verificado exitosamente",
  "verified": true
}
```

---

#### Reenviar Código de Verificación
```http
POST /verification/resend-code
```

**Body:**
```json
{
  "email": "usuario@ejemplo.com"
}
```

---

#### Solicitar Recuperación de Contraseña
```http
POST /verification/request-password-reset
```

**Body:**
```json
{
  "email": "usuario@ejemplo.com"
}
```

---

#### Restablecer Contraseña
```http
POST /verification/reset-password
```

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "code": "123456",
  "newPassword": "nuevaContraseña123"
}
```

---

### 📝 Hábitos (`/habits`)

**⚠️ Requiere autenticación JWT en todas las rutas**

#### Crear Hábito
```http
POST /habits
Authorization: Bearer {token}
```

**Body:**
```json
{
  "title": "Meditar",
  "description": "Meditar 10 minutos al día",
  "frequency": "daily",
  "targetCount": 1
}
```

**Respuesta (201):**
```json
{
  "id": 1,
  "title": "Meditar",
  "description": "Meditar 10 minutos al día",
  "frequency": "daily",
  "targetCount": 1,
  "isActive": true,
  "createdAt": "2025-01-15T10:00:00Z"
}
```

---

#### Obtener Todos los Hábitos
```http
GET /habits
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
[
  {
    "id": 1,
    "title": "Meditar",
    "description": "Meditar 10 minutos al día",
    "frequency": "daily",
    "targetCount": 1,
    "isActive": true,
    "createdAt": "2025-01-15T10:00:00Z"
  }
]
```

---

#### Obtener Dashboard
```http
GET /habits/dashboard
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
[
  {
    "id": 1,
    "title": "Meditar",
    "description": "Meditar 10 minutos al día",
    "frequency": "daily",
    "targetCount": 1,
    "todayCompleted": true,
    "todayProgress": 1
  }
]
```

---

#### Obtener Hábito por ID
```http
GET /habits/:id
Authorization: Bearer {token}
```

---

#### Actualizar Hábito
```http
PATCH /habits/:id
Authorization: Bearer {token}
```

**Body:**
```json
{
  "title": "Meditar y respirar",
  "isActive": false
}
```

---

#### Eliminar Hábito
```http
DELETE /habits/:id
Authorization: Bearer {token}
```

---

#### Registrar Progreso Diario
```http
POST /habits/:id/log
Authorization: Bearer {token}
```

**Body:**
```json
{
  "progress": 1,
  "notes": "Me sentí muy bien hoy"
}
```

**Respuesta (201):**
```json
{
  "id": 1,
  "logDate": "2025-01-15",
  "progress": 1,
  "notes": "Me sentí muy bien hoy",
  "completed": true,
  "createdAt": "2025-01-15T20:30:00Z"
}
```

---

#### Obtener Estadísticas
```http
GET /habits/:id/stats?days=30
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "habitId": 1,
  "habitTitle": "Meditar",
  "totalDays": 30,
  "completedDays": 25,
  "completionRate": 83,
  "currentStreak": 7,
  "logs": [...]
}
```

---

### 🧠 Inteligencia Artificial (`/ai`)

**⚠️ Requiere autenticación JWT en todas las rutas**

#### Analizar Patrón de Hábito
```http
GET /ai/analyze/:habitId
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "habitId": 1,
  "habitTitle": "Meditar",
  "analysis": {
    "totalDays": 30,
    "completedDays": 25,
    "completionRate": 83,
    "currentStreak": 7,
    "longestStreak": 12,
    "bestDay": "Martes",
    "worstDay": "Domingo",
    "dayPatterns": {
      "Lunes": { "completed": 4, "total": 4, "rate": 100 },
      "Martes": { "completed": 4, "total": 4, "rate": 100 },
      "Miércoles": { "completed": 3, "total": 4, "rate": 75 },
      "Jueves": { "completed": 4, "total": 4, "rate": 100 },
      "Viernes": { "completed": 3, "total": 4, "rate": 75 },
      "Sábado": { "completed": 4, "total": 5, "rate": 80 },
      "Domingo": { "completed": 3, "total": 5, "rate": 60 }
    },
    "trend": "improving",
    "suggestions": [
      "¡Excelente! Mantienes un 83% de cumplimiento.",
      "Los Domingo son tus días más difíciles. Intenta prepararte la noche anterior."
    ]
  }
}
```

---

#### Generar Recomendación con IA
```http
POST /ai/recommend/:habitId
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "recommendation": "¡Felicidades! Tu racha de 7 días demuestra gran consistencia. Observo que los domingos son más desafiantes con solo 60% de cumplimiento. Te sugiero programar tu meditación justo después del desayuno dominical para aprovechar el momento de calma. ¡Sigue así, estás construyendo un hábito sólido! 🧘‍♂️",
  "analysis": { ... },
  "savedRecommendation": {
    "id": 1,
    "message": "...",
    "category": "pattern_analysis",
    "createdAt": "2025-01-15T21:00:00Z"
  }
}
```

---

#### Obtener Mensaje Motivacional
```http
GET /ai/motivational
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "message": "¡Increíble! 💪 Completaste 3 de 4 hábitos hoy y llevas una racha promedio de 8 días. ¡Sigue adelante, estás creando una versión mejor de ti! ✨",
  "stats": {
    "totalHabits": 4,
    "completedToday": 3,
    "avgStreak": 8
  }
}
```

---

#### Obtener Sugerencias Inteligentes
```http
GET /ai/suggestions
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "suggestions": [
    {
      "habitId": 2,
      "habitTitle": "Hacer ejercicio",
      "type": "low_completion",
      "priority": "high",
      "message": "\"Hacer ejercicio\" tiene solo 35% de cumplimiento. Considera reducir la frecuencia o ajustar el horario.",
      "action": "adjust_frequency"
    },
    {
      "habitId": 1,
      "habitTitle": "Meditar",
      "type": "high_performance",
      "priority": "medium",
      "message": "¡Excelente trabajo con \"Meditar\"! (90% completado). ¿Listo para un nuevo desafío?",
      "action": "increase_challenge"
    }
  ],
  "totalSuggestions": 2
}
```

---

#### Obtener Historial de Recomendaciones
```http
GET /ai/recommendations?limit=10
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
[
  {
    "id": 1,
    "message": "Tu análisis personalizado...",
    "category": "pattern_analysis",
    "habit": {
      "id": 1,
      "title": "Meditar"
    },
    "createdAt": "2025-01-15T21:00:00Z"
  }
]
```

---

### 🔄 Sincronización (`/sync`)

**⚠️ Requiere autenticación JWT en todas las rutas**

#### Sincronizar Datos
```http
POST /sync
Authorization: Bearer {token}
```

**Body:**
```json
{
  "habits": [
    {
      "localId": "local-1",
      "title": "Nuevo hábito offline",
      "frequency": "daily",
      "targetCount": 1,
      "isActive": true,
      "updatedAt": "2025-01-15T10:00:00Z"
    }
  ],
  "logs": [
    {
      "localId": "log-1",
      "habitId": 1,
      "logDate": "2025-01-15",
      "progress": 1,
      "completed": true,
      "updatedAt": "2025-01-15T20:00:00Z"
    }
  ],
  "lastSyncAt": "2025-01-14T10:00:00Z"
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "syncResult": {
    "habits": {
      "created": [
        { "localId": "local-1", "serverId": 5 }
      ],
      "updated": [],
      "conflicts": []
    },
    "logs": {
      "created": [
        { "localId": "log-1", "serverId": 10 }
      ],
      "updated": [],
      "conflicts": []
    },
    "serverChanges": {
      "habits": [],
      "logs": []
    }
  },
  "serverTimestamp": "2025-01-15T22:00:00Z"
}
```

---

#### Obtener Datos del Servidor
```http
GET /sync/server-data?lastSyncAt=2025-01-14T10:00:00Z
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "habits": [...],
  "logs": [...],
  "serverTimestamp": "2025-01-15T22:00:00Z"
}
```

---

### 👤 Usuarios (`/users`)

**⚠️ Requiere autenticación JWT en todas las rutas**

#### Obtener Perfil
```http
GET /users/profile
Authorization: Bearer {token}
```

---

#### Actualizar Perfil
```http
PATCH /users/profile
Authorization: Bearer {token}
```

**Body:**
```json
{
  "fullName": "Juan Carlos Pérez",
  "preferredLanguageId": 1,
  "profilePicture": "https://ejemplo.com/foto.jpg"
}
```

---

#### Obtener Configuración
```http
GET /users/settings
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "id": 1,
  "theme": "dark",
  "notificationEnabled": true,
  "reminderTime": "08:00",
  "weeklySummary": true,
  "lastSyncAt": "2025-01-15T22:00:00Z"
}
```

---

#### Actualizar Configuración
```http
PATCH /users/settings
Authorization: Bearer {token}
```

**Body:**
```json
{
  "theme": "dark",
  "notificationEnabled": false,
  "reminderTime": "09:00"
}
```

---

#### Eliminar Cuenta
```http
DELETE /users/account
Authorization: Bearer {token}
```

---

### 🔔 Notificaciones (`/notifications`)

**⚠️ Requiere autenticación JWT en todas las rutas**

#### Obtener Notificaciones
```http
GET /notifications?unreadOnly=true
Authorization: Bearer {token}
```

---

#### Marcar como Leída
```http
PATCH /notifications/:id/read
Authorization: Bearer {token}
```

---

#### Marcar Todas como Leídas
```http
PATCH /notifications/read-all
Authorization: Bearer {token}
```

---

## 🔒 Autenticación y Seguridad

### JWT Token
Todas las rutas protegidas requieren un token JWT en el header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Flujo de Autenticación

1. **Registro** → Usuario recibe código de verificación por email
2. **Verificar Email** → Usuario confirma código de 6 dígitos
3. **Login** → Sistema envía código 2FA
4. **Verificar 2FA** → Usuario recibe token JWT
5. **Acceso a rutas protegidas** → Incluir token en header

### Seguridad Implementada
- ✅ Hash de contraseñas con bcrypt (salt rounds: 10)
- ✅ Tokens JWT con expiración configurable
- ✅ Verificación de email obligatoria
- ✅ 2FA obligatorio en login
- ✅ Rate limiting de intentos de verificación (máx. 3)
- ✅ Códigos de verificación con expiración (10 minutos)
- ✅ Registro de intentos de login (auditoría)
- ✅ CORS configurado
- ✅ Helmet para headers de seguridad
- ✅ Validación de DTOs con class-validator

---

## ⏳ Funcionalidades Pendientes

### Alta Prioridad
- ⚠️ **Firebase Cloud Messaging (FCM)** - Notificaciones push reales
- ⚠️ **Cron Jobs** - Envío automático de notificaciones y limpieza de códigos expirados
- ⚠️ **Rate Limiting** - Limitar peticiones por IP/usuario
- ⚠️ **Paginación** - Implementar en listados grandes

### Media Prioridad
- 🔜 **OAuth2 Google** - Login con Google
- 🔜 **Exportar datos** - CSV/PDF de estadísticas
- 🔜 **WebSockets** - Sincronización en tiempo real
- 🔜 **Caché** - Redis para mejorar rendimiento
- 🔜 **Tests unitarios y e2e** - Cobertura completa

### Baja Prioridad
- 🔜 **Gamificación** - Sistema de logros y puntos
- 🔜 **Comunidad** - Rankings sociales
- 🔜 **Más idiomas** - Expansión multilenguaje
- 🔜 **Subida de archivos** - AWS S3 para fotos de perfil

---

## 📁 Estructura del Proyecto

```
src/
├── ai/                    # Módulo de IA
│   ├── ai.controller.ts
│   ├── ai.service.ts      # Análisis y recomendaciones con OpenAI
│   └── ai.module.ts
├── auth/                  # Autenticación
│   ├── auth.controller.ts
│   ├── auth.service.ts    # Login, registro, 2FA
│   ├── dto/               # DTOs de autenticación
│   ├── guards/            # JWT Auth Guard
│   └── strategies/        # JWT Strategy
├── email/                 # Servicio de emails
│   ├── email.service.ts   # Nodemailer + templates HTML
│   └── email.module.ts
├── entities/              # Entidades TypeORM
│   ├── user.entity.ts
│   ├── habit.entity.ts
│   ├── habit-log.entity.ts
│   ├── ai-recommendation.entity.ts
│   ├── verification-code.entity.ts
│   ├── login-attempt.entity.ts
│   └── ...
├── habits/                # Gestión de hábitos
│   ├── habits.controller.ts
│   ├── habits.service.ts
│   ├── dto/
│   └── habits.module.ts
├── notifications/         # Notificaciones
│   ├── notifications.controller.ts
│   ├── notifications.service.ts
│   └── notifications.module.ts
├── sync/                  # Sincronización offline
│   ├── sync.controller.ts
│   ├── sync.service.ts
│   └── sync.module.ts
├── users/                 # Gestión de usuarios
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── verification/          # Verificación de códigos
│   ├── verification.controller.ts
│   ├── verification.service.ts
│   └── verification.module.ts
├── app.module.ts          # Módulo raíz
└── main.ts                # Punto de entrada
```

---

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests e2e
npm run test:e2e

# Cobertura
npm run test:cov
```

**⚠️ Nota:** Los tests están pendientes de implementación.

---

## 🐛 Logging y Debugging

```bash
# Modo desarrollo con logs detallados
npm run start:dev

# Modo debug
npm run start:debug
```

La aplicación usa **morgan** para logging HTTP en desarrollo y TypeORM logging para queries SQL.

---

## 📊 Base de Datos

### Tablas Principales
- `users` - Usuarios del sistema
- `user_settings` - Configuración de usuario
- `habits` - Hábitos creados
- `habit_logs` - Registro diario de progreso
- `ai_recommendations` - Recomendaciones generadas
- `verification_codes` - Códigos de verificación (email, 2FA, reset)
- `login_attempts` - Auditoría de logins
- `notifications` - Notificaciones del sistema
- `languages` - Idiomas disponibles

### Migraciones
Actualmente se usa el archivo SQL `habit_ai_v2.sql` para crear el esquema.

**⚠️ Recomendación:** Implementar migraciones con TypeORM para control de versiones.

---

## 🚀 Despliegue

### Opciones Recomendadas
1. **Render** - Deploy automático con PostgreSQL incluido
2. **Railway** - Fácil configuración con variables de entorno
3. **AWS EC2 + RDS** - Mayor control y escalabilidad
4. **Heroku** - Deploy simple (con PostgreSQL addon)

### Checklist de Producción
- [ ] Configurar variables de entorno
- [ ] Usar `synchronize: false` en TypeORM
- [ ] Implementar rate limiting
- [ ] Configurar CORS correctamente
- [ ] Habilitar HTTPS
- [ ] Configurar logs con Winston
- [ ] Implementar health check endpoint
- [ ] Configurar backup de BD

---

## 📝 Notas Importantes

1. **OpenAI API Key**: Si no se configura, el sistema usa mensajes motivacionales predeterminados en lugar de generar recomendaciones con IA.

2. **Códigos de Verificación**: Expiran en 10 minutos y tienen máximo 3 intentos.

3. **2FA Obligatorio**: Todos los logins requieren verificación 2FA por seguridad.

4. **Sincronización**: El sistema detecta conflictos cuando el servidor tiene datos más recientes que el cliente.

5. **Análisis IA**: Requiere al menos 7 días de logs para generar análisis significativo.

---

## 👨‍💻 Autor

**Julio Otero**  
Desarrollador Backend - Habit Manager API

---

## 🤝 Contribución
Abiertas
---

**Estado del Proyecto:** 🟢 En desarrollo activo
