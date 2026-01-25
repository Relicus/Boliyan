import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  // 1. Bypass for Localhost / Development
  // This ensures your local development flow is never interrupted
  const hostname = req.headers.get('host') || '';
  if (
    process.env.NODE_ENV === 'development' || 
    hostname.includes('localhost') || 
    hostname.includes('127.0.0.1') ||
    hostname.startsWith('192.168.') // Allow LAN testing without password
  ) {
    return NextResponse.next();
  }

  // 2. Basic Authentication for Vercel/Live
  // Password is '799698' as requested, or can be overridden via SITE_PASSWORD env var
  const validPassword = process.env.SITE_PASSWORD || '799698';
  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    // Decode base64
    const [, pwd] = atob(authValue).split(':');

    if (pwd === validPassword) {
      return NextResponse.next();
    }
  }

  // 3. Prompt for Password if missing or incorrect
  return new NextResponse('Authentication Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Boliyan Private Test"',
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
