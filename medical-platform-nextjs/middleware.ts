// Middleware - NextAuth JWT check for protected routes
// Note: NextAuth uses Node.js APIs (DecompressionStream) which triggers Edge Runtime warnings
// This is a known issue but doesn't affect functionality
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const PROTECTED_PATHS = [
  '/dashboard',
  '/upload',
  '/chat',
  '/qa',
  '/reports',
  '/api/upload',
  '/api/analyze',
  '/api/chat',
  '/api/consultation',
  '/api/qa',
  '/api/reports',
  '/api/pubmed',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  // getToken only reads the JWT cookie - no DB, no Node.js modules, Edge-safe
  // Enforce secure cookies on Vercel/Production to match how NextAuth sets them with the __Secure- prefix
  const isSecureEnv = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' || req.nextUrl.protocol === 'https:';
  
  let token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: isSecureEnv,
  });

  // Fallback for next-auth v5 beta cookie consistency on Vercel Edge Runtime
  if (!token && isSecureEnv) {
    token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: true,
      // @ts-ignore - Fallback for next-auth v5 cookie salt behavior
      salt: '__Secure-authjs.session-token'
    });
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

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
}
