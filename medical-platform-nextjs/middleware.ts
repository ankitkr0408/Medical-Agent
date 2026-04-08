import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/upload') ||
    req.nextUrl.pathname.startsWith('/chat') ||
    req.nextUrl.pathname.startsWith('/qa') ||
    req.nextUrl.pathname.startsWith('/reports') ||
    req.nextUrl.pathname.startsWith('/api/upload') ||
    req.nextUrl.pathname.startsWith('/api/analyze') ||
    req.nextUrl.pathname.startsWith('/api/chat') ||
    req.nextUrl.pathname.startsWith('/api/consultation') ||
    req.nextUrl.pathname.startsWith('/api/qa') ||
    req.nextUrl.pathname.startsWith('/api/reports') ||
    req.nextUrl.pathname.startsWith('/api/pubmed');

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/upload/:path*',
    '/chat/:path*',
    '/qa/:path*',
    '/reports/:path*',
    '/api/upload/:path*',
    '/api/analyze/:path*',
    '/api/chat/:path*',
    '/api/consultation/:path*',
    '/api/qa/:path*',
    '/api/reports/:path*',
    '/api/pubmed/:path*',
  ],
};
