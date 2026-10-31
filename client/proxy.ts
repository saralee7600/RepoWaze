import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { safeCallbackUrl } from '@/lib/auth/callback-url';
import { LOGIN_PATH } from '@/lib/auth/paths';

/**
 * Route guard (the Next.js 16 successor of `middleware.ts`):
 * signed-out visitors are sent to `/login`, signed-in ones are kept away from it.
 */
export async function proxy(request: NextRequest) {
  const { nextUrl } = request;
  const token = await getToken({ req: request });
  const isSignedIn = token !== null && !token.error;

  if (nextUrl.pathname === LOGIN_PATH) {
    if (!isSignedIn) return NextResponse.next();
    const destination = safeCallbackUrl(nextUrl.searchParams.get('callbackUrl'));
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (isSignedIn) return NextResponse.next();

  const loginUrl = new URL(LOGIN_PATH, request.url);
  loginUrl.searchParams.set('callbackUrl', `${nextUrl.pathname}${nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Everything except NextAuth's own endpoints and Next.js static assets.
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
