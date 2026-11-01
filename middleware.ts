import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';

  // Detect incoming traffic on honarhub.ir (or www.honarhub.ir / www.honarhub.com)
  const isIrDomain = host.includes('honarhub.ir');
  const isWww = host.startsWith('www.');

  if (isIrDomain || isWww) {
    const targetUrl = new URL(request.nextUrl.pathname + request.nextUrl.search, 'https://honarhub.com');

    // 308 Permanent Redirect strictly preserves HTTP method (GET, POST, etc.) and full path/query
    return NextResponse.redirect(targetUrl, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for internal static files:
     * - _next/static (static chunks)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
