import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  // Behind Render's proxy: req.ip must hold the real client IP
  // (X-Forwarded-For), not the proxy's. Audit traces store it.
  app.set('trust proxy', 1);

  // Express's default limit (100 KB) falls short for the admin panel's bulk
  // import (up to 500 offers per request).
  app.useBodyParser('json', { limit: '5mb' });
  app.useBodyParser('urlencoded', { extended: true, limit: '5mb' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Always-allowed origins (production). CORS compares only the origin
  // (scheme + host), with no path or trailing slash.
  const defaultOrigins = [
    'https://tu-chamba.corpsc.com',
    'https://admin-chamba.corpsc.com',
  ];
  const envOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const origins = [...new Set([...defaultOrigins, ...envOrigins])];
  app.enableCors({
    origin: (origin, cb) => {
      // Allows tools without an origin (curl) and any localhost in development.
      if (!origin || origins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
        cb(null, true);
      } else {
        cb(new Error('Origen no permitido por CORS'), false);
      }
    },
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Tu Chamba API')
    .setDescription('API del portal de empleos Tu Chamba')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`API en http://localhost:${port}/api`);
  console.log(`Swagger en http://localhost:${port}/docs`);
}
bootstrap();
