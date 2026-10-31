import { UnauthorizedException } from '@nestjs/common';
import { generateKeyPairSync, sign, type KeyObject } from 'node:crypto';
import type { GoogleJwksService } from './google-jwks.service';
import { GoogleTokenVerifierService } from './google-token-verifier.service';

const AUDIENCE = 'test-client-id.apps.googleusercontent.com';
const KID = 'test-key';

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});
const otherKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });

const encode = (value: object) =>
  Buffer.from(JSON.stringify(value)).toString('base64url');

function signToken(
  claims: Record<string, unknown>,
  { key = privateKey, alg = 'RS256' }: { key?: KeyObject; alg?: string } = {},
): string {
  const unsigned = `${encode({ alg, kid: KID })}.${encode(claims)}`;
  const signature = sign('RSA-SHA256', Buffer.from(unsigned), key);
  return `${unsigned}.${signature.toString('base64url')}`;
}

const validClaims = () => ({
  iss: 'https://accounts.google.com',
  aud: AUDIENCE,
  sub: '1234567890',
  email: 'dev@example.com',
  name: 'Dev User',
  exp: Math.floor(Date.now() / 1000) + 3600,
});

describe('GoogleTokenVerifierService', () => {
  let service: GoogleTokenVerifierService;

  beforeEach(() => {
    const jwks = {
      getKey: jest.fn((kid: string) =>
        Promise.resolve(kid === KID ? publicKey : undefined),
      ),
    } as unknown as GoogleJwksService;
    service = new GoogleTokenVerifierService(AUDIENCE, jwks);
  });

  it('accepts a valid token and returns the user', async () => {
    await expect(service.verify(signToken(validClaims()))).resolves.toEqual({
      id: '1234567890',
      email: 'dev@example.com',
      name: 'Dev User',
      picture: undefined,
    });
  });

  it.each([
    ['an expired token', { exp: Math.floor(Date.now() / 1000) - 3600 }],
    ['a token for another audience', { aud: 'someone-else' }],
    ['a token from another issuer', { iss: 'https://evil.example.com' }],
    ['a token without a subject', { sub: undefined }],
  ])('rejects %s', async (_label, override) => {
    const token = signToken({ ...validClaims(), ...override });
    await expect(service.verify(token)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects a token signed with a different key', async () => {
    const token = signToken(validClaims(), { key: otherKeys.privateKey });
    await expect(service.verify(token)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects tokens that are not RS256', async () => {
    const token = signToken(validClaims(), { alg: 'none' });
    await expect(service.verify(token)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it.each(['', 'not-a-jwt', 'a.b', 'a.b.c', 'a.b.c.d'])(
    'rejects malformed token %p',
    async (token) => {
      await expect(service.verify(token)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    },
  );
});
