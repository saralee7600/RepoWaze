import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { safeCallbackUrl } from '@/lib/auth/callback-url';
import { LOGIN_PATH } from '@/lib/auth/paths';

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
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
