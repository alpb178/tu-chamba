import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express, { Request, Response } from 'express';
import { AppModule } from '../src/app.module';

// Punto de entrada serverless para Vercel.
// A diferencia de src/main.ts, NO llamamos a app.listen(): Vercel invoca
// el handler por request. Cacheamos la app entre invocaciones "calientes".
const expressApp = express();
let initialized: Promise<void> | undefined;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins.length ? origins : true,
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

  await app.init();
}

export default async function handler(req: Request, res: Response) {
  if (!initialized) {
    initialized = bootstrap();
  }
  await initialized;
  expressApp(req, res);
}
