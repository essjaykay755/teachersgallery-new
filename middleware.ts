import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Get the token from cookies
  const session = request.cookies.get('session')?.value;
  
  // Define public paths that don't require authentication
  const publicPaths = ['/', '/login', '/register', '/about', '/faq', '/contact', '/privacy-policy', '/terms'];
  
  // Get user info from a custom header set by the AuthProvider (to be implemented)
  const userTypeHeader = request.headers.get('x-user-type');
  const onboardingCompletedHeader = request.headers.get('x-onboarding-completed');
  
  // Check if the path is public
  const isPublicPath = publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(`${publicPath}/`)
  );
  
  // Redirect unauthenticated users to login
  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If user is authenticated but on a public path like login or register, redirect to dashboard
  if (session && (path === '/login' || path === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If user is authenticated, has a user type but hasn't completed onboarding,
  // and they're trying to access dashboard, redirect to onboarding
  if (
    session && 
    userTypeHeader && 
    onboardingCompletedHeader === 'false' && 
    path.startsWith('/dashboard')
  ) {
    return NextResponse.redirect(
      new URL(`/onboarding/${userTypeHeader}/step1`, request.url)
    );
  }
  
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
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
}; 