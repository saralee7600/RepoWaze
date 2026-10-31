import {
  createParamDecorator,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import type { AuthenticatedRequest, AuthenticatedUser } from './auth.types';

/** The user `AuthGuard` verified for this request. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    // Unreachable behind the global guard; fail closed if a route is ever left unguarded.
    if (!user) throw new UnauthorizedException('Missing bearer token');
    return user;
  },
);
