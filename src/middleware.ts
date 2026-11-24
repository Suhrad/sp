import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/serverAuth';

const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/manifest.json',
  '/icon.svg',
  '/favicon.ico',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static Next.js assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    PUBLIC_PATHS.includes(pathname)
  ) {
    return NextResponse.next();
  }

  // Read session cookie
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let username: string | null = null;

  if (token) {
    username = await verifySessionToken(token);
  }

  // If unauthenticated, redirect to /login
  if (!username) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
