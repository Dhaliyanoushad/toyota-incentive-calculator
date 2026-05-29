import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Get the token from cookies
  const token = request.cookies.get('token')?.value;

  // 2. Define path classifications
  const isAdminPath = pathname.startsWith('/admin');
  const isOfficerPath = pathname.startsWith('/officer');
  const isLoginPath = pathname === '/login';

  // 3. Handle public home page: redirect to login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 4. Handle route checks
  if (token) {
    try {
      // Decode JWT payload (second part of the JWT) without native crypto (edge runtime safe)
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token structure');
      }

      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const payload = JSON.parse(jsonPayload);

      // Verify expiration (exp is in seconds, Date.now() in milliseconds)
      const isExpired = payload.exp * 1000 < Date.now();

      if (isExpired) {
        // Clear expired token and redirect to login
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('token');
        return response;
      }

      // Check Role-Based Access Control (RBAC)
      if (isLoginPath) {
        if (payload.role === 'admin') {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        } else {
          return NextResponse.redirect(new URL('/officer/dashboard', request.url));
        }
      }

      if (isAdminPath && payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/officer/dashboard', request.url));
      }

      if (isOfficerPath && payload.role !== 'officer') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }

    } catch (e) {
      console.error('Middleware decode error:', e);
      // In case of invalid token, clear it and redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }
  } else {
    // If NO token, prevent accessing protected pages
    if (isAdminPath || isOfficerPath) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// Config to specify exactly which paths should be intercepted
export const config = {
  matcher: [
    '/',
    '/login',
    '/admin/:path*',
    '/officer/:path*',
  ],
};
