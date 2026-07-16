import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  // Detrás del proxy de Render: req.ip debe traer la IP real del cliente
  // (X-Forwarded-For), no la del proxy. Las trazas de auditoría la guardan.
  app.set('trust proxy', 1);

  // El límite por defecto de Express (100 KB) se queda corto para la
  // importación masiva del panel admin (hasta 500 ofertas por request).
  app.useBodyParser('json', { limit: '5mb' });
  app.useBodyParser('urlencoded', { extended: true, limit: '5mb' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Orígenes permitidos siempre (producción). CORS compara solo el origen
  // (esquema + host), sin ruta ni barra final.
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
