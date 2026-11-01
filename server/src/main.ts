import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { resolveCorsOrigins } from './common/cors-origins';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: resolveCorsOrigins(process.env.CORS_ORIGINS),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept'],
    credentials: true,
    maxAge: 86400,
  });
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
