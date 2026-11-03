import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('earnxpress_token')?.value;
  const role = request.cookies.get('earnxpress_role')?.value;

  const isAuth = !!token;
  const isAdminRole =
    role === 'PLATFORM_OWNER' ||
    role === 'SUPER_ADMIN' ||
    role === 'MODERATOR' ||
    role === 'SUPPORT_AGENT';

  // 1. Logged-in users visiting login or register get redirected to their dashboard
  if ((pathname === '/login' || pathname === '/register') && isAuth) {
    if (role === 'WORKER') {
      return NextResponse.redirect(new URL('/worker', request.url));
    }
    if (role === 'BUYER') {
      return NextResponse.redirect(new URL('/buyer', request.url));
    }
    if (isAdminRole) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.redirect(new URL('/tasks', request.url));
  }

  // 2. Protect Worker Portal (/worker/*)
  if (pathname.startsWith('/worker')) {
    if (!isAuth) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Buyers should not access Worker execution portal
    if (role === 'BUYER') {
      return NextResponse.redirect(new URL('/buyer', request.url));
    }
  }

  // 3. Protect Buyer Portal (/buyer/*)
  if (pathname.startsWith('/buyer')) {
    if (!isAuth) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Workers should not access Buyer campaign creation or review queue
    if (role === 'WORKER') {
      return NextResponse.redirect(new URL('/worker', request.url));
    }
  }

  // 4. Protect Admin Portal (/admin/*)
  if (pathname.startsWith('/admin')) {
    if (!isAuth) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Regular Workers and Buyers are strictly forbidden from Admin Portal
    if (!isAdminRole) {
      if (role === 'WORKER') {
        return NextResponse.redirect(new URL('/worker', request.url));
      }
      if (role === 'BUYER') {
        return NextResponse.redirect(new URL('/buyer', request.url));
      }
      return NextResponse.redirect(new URL('/tasks', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/worker/:path*',
    '/buyer/:path*',
    '/admin/:path*',
    '/login',
    '/register',
  ],
};
