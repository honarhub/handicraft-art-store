import prisma from '@/lib/prisma';

// Generate clean unambiguous alphanumeric code: e.g. HNR-84A2
export function generateRandomCode(prefix = 'HNR'): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomPart = '';
  for (let i = 0; i < 5; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${randomPart}`;
}

/**
 * Ensures an artist has at least `targetCount` referral codes (default 5).
 * Only creates missing codes if the artist currently has fewer than `targetCount`.
 * Never prunes or deletes extra codes, allowing admins to grant additional codes at any time.
 */
export async function ensureArtistReferralCodes(userId: string, targetCount = 5) {
  const existingCodes = await prisma.referralCode.findMany({
    where: { creatorId: userId },
    orderBy: { createdAt: 'asc' }
  });

  const missingCount = targetCount - existingCodes.length;
  if (missingCount > 0) {
    const newCodesToCreate: string[] = [];
    while (newCodesToCreate.length < missingCount) {
      const candidate = generateRandomCode();
      // Avoid duplicates in batch
      if (!newCodesToCreate.includes(candidate)) {
        // Check database uniqueness
        const exists = await prisma.referralCode.findUnique({ where: { code: candidate } });
        if (!exists) {
          newCodesToCreate.push(candidate);
        }
      }
    }

    await prisma.referralCode.createMany({
      data: newCodesToCreate.map(code => ({
        code,
        creatorId: userId,
        isUsed: false
      }))
    });
  }

  return prisma.referralCode.findMany({
    where: { creatorId: userId },
    orderBy: { createdAt: 'asc' },
    include: {
      usedBy: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
          email: true,
          artistProfile: {
            select: { displayId: true, brandName: true }
          }
        }
      }
    }
  });
}

/**
 * Resolves base URL dynamically from the incoming request or environment.
 * Localhost is preserved for local development; in production it strictly defaults to https://honarhub.com.
 */
export function getCanonicalBaseUrl(req?: Request): string {
  if (req) {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    if (host) {
      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        const proto = req.headers.get('x-forwarded-proto') || 'http';
        return `${proto}://${host}`;
      }
      return 'https://honarhub.com';
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (appUrl && (appUrl.includes('localhost') || appUrl.includes('127.0.0.1'))) {
    return appUrl.replace(/\/$/, '');
  }

  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (nextAuthUrl && (nextAuthUrl.includes('localhost') || nextAuthUrl.includes('127.0.0.1'))) {
    return nextAuthUrl.replace(/\/$/, '');
  }

  return 'https://honarhub.com';
}

/**
 * Returns short invite URL (e.g. https://honarhub.com/i/HNR-56235)
 */
export function getShortInviteUrl(code: string, req?: Request): string {
  const baseUrl = getCanonicalBaseUrl(req);
  const cleanCode = encodeURIComponent((code || '').trim().toUpperCase());
  return `${baseUrl}/i/${cleanCode}`;
}

/**
 * Returns canonical full invite URL
 */
export function getFullInviteUrl(code: string, req?: Request): string {
  const baseUrl = getCanonicalBaseUrl(req);
  const cleanCode = encodeURIComponent((code || '').trim().toUpperCase());
  return `${baseUrl}/artist-panel/login?invite=${cleanCode}&tab=register`;
}
