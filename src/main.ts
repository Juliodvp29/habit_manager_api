import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import morgan from 'morgan';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());

  // CORS
  // CORS: soporta múltiples orígenes separados por comas en CORS_ORIGIN
  const rawOrigins = process.env.CORS_ORIGIN || 'http://localhost:8100';
  const allowedOrigins = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);

  // Normaliza un origen a su forma 'protocol://host:port' para comparaciones
  const normalize = (origin: string) => {
    try {
      // Asegura que exista el esquema para que URL funcione
      const withScheme = origin.match(/^https?:\/\//) ? origin : `http://${origin}`;
      return new URL(withScheme).origin.toLowerCase();
    } catch (e) {
      return origin.toLowerCase();
    }
  };

  const normalizedAllowed = Array.from(new Set(allowedOrigins.map(normalize)));

  app.enableCors({
    origin: (requestOrigin, callback) => {
      // Si no se envía origin (requests desde herramientas como curl/postman), permitirlo.
      if (!requestOrigin) return callback(null, true);

      const incoming = normalize(requestOrigin);

      // Comparación directa con orígenes normalizados
      if (normalizedAllowed.includes(incoming)) {
        return callback(null, true);
      }

      // Comparación por host:port (acepta variantes como 127.0.0.1 vs localhost)
      try {
        const incomingHost = new URL(requestOrigin).host.toLowerCase();
        const allowedHosts = normalizedAllowed.map(a => new URL(a).host.toLowerCase());
        if (allowedHosts.includes(incomingHost)) {
          return callback(null, true);
        }
      } catch (e) {
        // ignore parsing errors
      }

      // Log para depuración: qué origin llegó y cuáles están permitidos
      console.warn('CORS: rejected origin', { incoming: requestOrigin, normalizedIncoming: incoming, allowed: normalizedAllowed });

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

  console.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);

}
bootstrap();
