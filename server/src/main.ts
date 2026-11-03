import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { resolveCorsOrigins } from './common/cors-origins';
import { VALIDATION_PIPE_OPTIONS } from './common/validation-options';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // The API sits behind one reverse proxy (e.g. Render). Trusting exactly one
  // hop makes `req.ip` the real client address, which rate limiting relies on.
  app.set('trust proxy', 1);

  app.use(
    helmet({
      // The browser client lives on a different origin and also probes the API
      // with `no-cors` requests, so responses must stay cross-origin readable.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.useGlobalPipes(new ValidationPipe(VALIDATION_PIPE_OPTIONS));
  app.enableCors({
    origin: resolveCorsOrigins(process.env.CORS_ORIGINS),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept'],
    maxAge: 86400,
  });
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
void bootstrap();
