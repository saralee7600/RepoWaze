import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { GOOGLE_AUDIENCE } from './auth.constants';
import { GoogleJwksService } from './google-jwks.service';
import { GoogleTokenVerifierService } from './google-token-verifier.service';

/** Registers `AuthGuard` globally: every endpoint requires a valid token. */
@Module({
  providers: [
    {
      provide: GOOGLE_AUDIENCE,
      inject: [ConfigService],
      // Fail fast at startup: without an audience every token would have to be rejected anyway.
      useFactory: (config: ConfigService) =>
        config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
    },
    GoogleJwksService,
    GoogleTokenVerifierService,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AuthModule {}
