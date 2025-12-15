import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth'

// Routes that require authentication
const protectedRoutes = ['/admin', '/pos', '/driver', '/dashboard']

// Routes that should redirect authenticated users
const authRoutes = ['/login', '/register']

// Routes accessible to all
const publicRoutes = ['/', '/menu', '/api/auth']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Get token from cookie
  const token = request.cookies.get('auth-token')?.value

  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If accessing auth route with valid token, redirect to dashboard
  if (isAuthRoute && token) {
    try {
      verifyToken(token)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } catch {
      // Invalid token, continue to auth page
    }
  }

  // Verify token for protected routes
  if (isProtectedRoute && token) {
    try {
      verifyToken(token)
    } catch {
      // Invalid token, redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('auth-token')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

