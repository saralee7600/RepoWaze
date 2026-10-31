import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './auth.types';
import type { GoogleTokenVerifierService } from './google-token-verifier.service';

const USER = { id: '42', email: 'dev@example.com' };

function contextFor(authorization?: string) {
  const request = { headers: { authorization } } as AuthenticatedRequest;
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { request, context };
}

describe('AuthGuard', () => {
  const verify = jest.fn();
  const guard = new AuthGuard({
    verify,
  } as unknown as GoogleTokenVerifierService);

  beforeEach(() => {
    verify.mockReset();
    verify.mockResolvedValue(USER);
  });

  it('lets a valid bearer token through and attaches the user', async () => {
    const { request, context } = contextFor('Bearer abc.def.ghi');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verify).toHaveBeenCalledWith('abc.def.ghi');
    expect(request.user).toEqual(USER);
  });

  it.each([undefined, '', 'Bearer ', 'Bearer    ', 'Basic abc', 'abc.def.ghi'])(
    'answers 401 when the header is %p',
    async (header) => {
      const { context } = contextFor(header);

      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(verify).not.toHaveBeenCalled();
    },
  );

  it('propagates the 401 when the token is invalid', async () => {
    verify.mockRejectedValue(new UnauthorizedException());
    const { context } = contextFor('Bearer bad.token.here');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
