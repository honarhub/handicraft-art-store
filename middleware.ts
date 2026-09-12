import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // Get hostname of request (e.g. admin.localhost:3000, admin.mydomain.com)
  const hostname = request.headers.get('host') || '';

  // Define the admin subdomain string (e.g. 'admin')
  const adminSubdomain = 'admin';

  // Check if the current hostname starts with the admin subdomain
  if (hostname.startsWith(`${adminSubdomain}.`)) {
    // If we are already on an /admin path, don't rewrite to avoid infinite loops
    if (!url.pathname.startsWith('/admin')) {
      // Rewrite the URL to point to the /admin folder in the Next.js app directory
      url.pathname = `/admin${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
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
};
