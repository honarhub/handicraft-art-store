import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // Get hostname of request (e.g. admin.localhost:3000, admin.mydomain.com)
  const hostname = request.headers.get('host') || '';

  // 1. Redirect honarhub.ir or www to honarhub.com (ignore localhost)
  if (!hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
    if (hostname.includes('honarhub.ir') || hostname.startsWith('www.')) {
      const cleanHost = hostname.replace(/^www\./, '').replace('honarhub.ir', 'honarhub.com');
      const targetUrl = new URL(request.nextUrl.pathname + request.nextUrl.search, `https://${cleanHost}`);
      return NextResponse.redirect(targetUrl, 308);
    }
  }

  // Define the admin subdomain string (e.g. 'admin')
  const adminSubdomain = 'admin';

  // Check if the current hostname starts with the admin subdomain
  if (hostname.startsWith(`${adminSubdomain}.`)) {
    // If we are already on an /admin path or accessing uploaded static media, don't rewrite
    if (!url.pathname.startsWith('/admin') && !url.pathname.startsWith('/uploads')) {
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
     * Match all request paths except for internal static files and uploaded media:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads (user/artist uploaded media)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|uploads).*)',
  ],
};
