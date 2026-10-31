import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedRequest } from './auth.types';
import { GoogleTokenVerifierService } from './google-token-verifier.service';

const BEARER_PREFIX = 'Bearer ';

/** Rejects (401) every request that doesn't carry a valid Google ID token as a Bearer token. */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly verifier: GoogleTokenVerifierService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;

    if (!header?.startsWith(BEARER_PREFIX)) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = header.slice(BEARER_PREFIX.length).trim();
    if (token === '') throw new UnauthorizedException('Missing bearer token');

    request.user = await this.verifier.verify(token);
    return true;
  }
}
