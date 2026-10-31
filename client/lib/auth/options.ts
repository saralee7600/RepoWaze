import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { isIdTokenFresh, refreshIdToken } from './google-refresh';
import { LOGIN_PATH } from './paths';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: {
        params: { prompt: 'consent', access_type: 'offline', response_type: 'code' },
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: LOGIN_PATH, error: LOGIN_PATH },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        return {
          ...token,
          idToken: account.id_token,
          refreshToken: account.refresh_token,
          idTokenExpiresAt: (account.expires_at ?? 0) * 1000,
          error: undefined,
        };
      }
      return isIdTokenFresh(token) ? token : refreshIdToken(token);
    },
    session({ session, token }) {
      session.idToken = token.idToken;
      session.error = token.error;
      session.user.id = token.sub ?? '';
      return session;
    },
  },
};
