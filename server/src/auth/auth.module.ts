import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { GOOGLE_AUDIENCE } from './auth.constants';
import { GoogleJwksService } from './google-jwks.service';
import { GoogleTokenVerifierService } from './google-token-verifier.service';

@Module({
  providers: [
    {
      provide: GOOGLE_AUDIENCE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
    },
    GoogleJwksService,
    GoogleTokenVerifierService,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AuthModule {}
