import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function getRedirectTarget(pathname: string): string {
  if (pathname.startsWith('/admin')) {
    return '/login/admin';
  }
  if (pathname.startsWith('/officer')) {
    return '/login/officer';
  }
  return '/';
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Get the token from cookies
  const token = request.cookies.get('token')?.value;

  // 2. Define path classifications
  const isAdminPath = pathname.startsWith('/admin');
  const isOfficerPath = pathname.startsWith('/officer');
  const isLoginPath = pathname.startsWith('/login');

  // 3. Redirect /login parent page to / if logged out
  if (!token && (pathname === '/login' || pathname === '/login/')) {
    return NextResponse.redirect(new URL('/', request.url));
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
        // Clear expired token. 
        // Redirect to respective login if they are trying to access a protected page.
        // Otherwise, allow them to view the public page and clear the cookie.
        if (isAdminPath || isOfficerPath) {
          const redirectTarget = getRedirectTarget(pathname);
          const response = NextResponse.redirect(new URL(redirectTarget, request.url));
          response.cookies.delete('token');
          return response;
        } else {
          const response = NextResponse.next();
          response.cookies.delete('token');
          return response;
        }
      }

      // Check Role-Based Access Control (RBAC)
      if (isLoginPath || pathname === '/') {
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
      // Clear invalid token.
      // Redirect to respective login if they are trying to access a protected page.
      // Otherwise, allow them to view the public page and clear the cookie.
      if (isAdminPath || isOfficerPath) {
        const redirectTarget = getRedirectTarget(pathname);
        const response = NextResponse.redirect(new URL(redirectTarget, request.url));
        response.cookies.delete('token');
        return response;
      } else {
        const response = NextResponse.next();
        response.cookies.delete('token');
        return response;
      }
    }
  } else {
    // If NO token, prevent accessing protected pages
    if (isAdminPath || isOfficerPath) {
      const redirectTarget = getRedirectTarget(pathname);
      return NextResponse.redirect(new URL(redirectTarget, request.url));
    }
  }

  return NextResponse.next();
}

// Config to specify exactly which paths should be intercepted
export const config = {
  matcher: [
    '/',
    '/login/:path*',
    '/admin/:path*',
    '/officer/:path*',
  ],
};
