import { NextResponse } from 'next/server';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/serverAuth';

// In-memory rate limiting to prevent brute-force attacks
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();

    // Check rate limit
    const attempt = loginAttempts.get(ip);
    if (attempt && attempt.lockedUntil > now) {
      const waitSeconds = Math.ceil((attempt.lockedUntil - now) / 1000);
      return NextResponse.json(
        { error: `Too many failed attempts. Account locked for ${waitSeconds} seconds.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { username, password, customCredentials } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Login ID and Password are required.' },
        { status: 400 }
      );
    }

    // Check credentials (either custom or default)
    const validUsername = customCredentials?.username || process.env.ADMIN_USER || 'admin';
    const validPassword = customCredentials?.password || process.env.ADMIN_PASS || 'stock@admin2026';

    const isValid =
      username.trim().toLowerCase() === validUsername.toLowerCase() &&
      password === validPassword;

    if (!isValid) {
      // Record failed attempt
      const currentCount = (attempt?.count || 0) + 1;
      const lockedUntil = currentCount >= 5 ? now + 2 * 60 * 1000 : 0; // lock for 2 min after 5 fails
      loginAttempts.set(ip, { count: currentCount, lockedUntil });

      return NextResponse.json(
        { error: 'Invalid credentials. Access denied.' },
        { status: 401 }
      );
    }

    // Reset rate limit on success
    loginAttempts.delete(ip);

    // Create cryptographic HMAC token
    const token = await createSessionToken(username.trim());

    // Create response with secure HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      user: { username: username.trim(), name: 'Admin / Owner' },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Server authentication error.' },
      { status: 500 }
    );
  }
}
