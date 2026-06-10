import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());
  app.enableCors({
    origin: (origin, cb) => {
      // Permite herramientas sin origin (curl) y cualquier localhost en desarrollo.
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
