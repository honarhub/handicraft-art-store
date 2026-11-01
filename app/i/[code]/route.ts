import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * High-performance internal short URL resolver for artist invitation & referral links.
 * Example: https://honarhub.com/i/HNR-56235
 * Redirects seamlessly (307) to:
 * https://honarhub.com/artist-panel/login?invite=HNR-56235&tab=register
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;
  const rawCode = (code || '').trim();

  // Determine base host (preserves localhost in dev, strictly honarhub.com in production)
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  const baseUrl = isLocal ? request.nextUrl.origin : 'https://honarhub.com';

  const destination = new URL(`${baseUrl}/artist-panel/login`);
  destination.searchParams.set('invite', rawCode.toUpperCase());
  destination.searchParams.set('tab', 'register');

  // Forward any additional tracking parameters if present (e.g. ?utm_source=sms)
  request.nextUrl.searchParams.forEach((value, key) => {
    if (key !== 'invite' && key !== 'tab') {
      destination.searchParams.set(key, value);
    }
  });

  return NextResponse.redirect(destination.toString(), 307);
}
