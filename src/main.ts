import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
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
  // CORS: soporta múltiples orígenes separados por comas en CORS_ORIGIN
  const rawOrigins = process.env.CORS_ORIGIN || 'https://localhost:8100';
  const allowedOrigins = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);

  // Normaliza un origen a su forma 'protocol://host:port' para comparaciones
  const normalize = (origin: string) => {
    try {
      // Asegura que exista el esquema para que URL funcione
      const withScheme = origin.match(/^httpss?:\/\//) ? origin : `https://${origin}`;
      return new URL(withScheme).origin.toLowerCase();
    } catch (e) {
      return origin.toLowerCase();
    }
  };

  const normalizedAllowed = Array.from(new Set(allowedOrigins.map(normalize)));

  app.enableCors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin) return callback(null, true);

      const allowedOrigins = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);
      const isAllowed = allowedOrigins.some(allowed => requestOrigin.includes(allowed)) ||
        requestOrigin.includes('ngrok') ||
        requestOrigin.includes('localhost');

      if (isAllowed) {
        return callback(null, true);
      }

      console.warn('CORS: rejected origin', requestOrigin);
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

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Application is running on: https://localhost:${port}/api/v1`);

}
bootstrap();
