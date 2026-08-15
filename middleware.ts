import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'solusi_session';

// Routes that do NOT require authentication
const PUBLIC_ROUTES = ['/login', '/api/auth/login'];

// Static file prefixes to skip
const STATIC_PREFIXES = ['/_next', '/favicon.ico'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets
  if (STATIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));

  // If authenticated user visits login page, redirect to dashboard
  if (isPublicRoute && sessionToken) {
    if (pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // If unauthenticated user visits a protected route, redirect to login
  if (!isPublicRoute && !sessionToken) {
    // For API routes, return 401 JSON instead of redirect
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }
    // For page routes, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon\\.ico).*)',
  ],
};
