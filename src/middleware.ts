import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const DASHBOARD_PREFIXES = [
  '/dashboard',
  '/my-apps',
  '/convert',
  '/verify',
  '/billing',
  '/settings',
];

const ADMIN_PREFIX = '/admin';

function isDashboardPath(pathname: string): boolean {
  return DASHBOARD_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isAdminPath(pathname: string): boolean {
  return pathname === ADMIN_PREFIX || pathname.startsWith(ADMIN_PREFIX + '/');
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isDashboardPath(pathname) && !isAdminPath(pathname)) {
    return NextResponse.next();
  }

  // Check the browser-set auth cookie (written by authStore.setAuth on login).
  // NOT the httpOnly refreshToken — that lives on the backend port and is
  // invisible to Next.js middleware. This cookie is set via document.cookie
  // by the frontend after a successful login or Google OAuth callback.
  // Real security is enforced by the backend API on every request.
  const authCookie = request.cookies.get('solostore-auth')?.value;

  if (!authCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For admin paths: check the role cookie (also set by authStore)
  if (isAdminPath(pathname)) {
    const roleCookie = request.cookies.get('solostore-role')?.value;
    if (roleCookie !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/my-apps/:path*',
    '/convert/:path*',
    '/verify/:path*',
    '/billing/:path*',
    '/settings/:path*',
    '/admin/:path*',
  ],
};
