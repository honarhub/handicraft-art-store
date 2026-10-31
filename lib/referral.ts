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
 * Canonical URL resolver for emails, SMS, and invites.
 * Prioritizes actual incoming request host (e.g. honarhub.ir).
 * Never exposes 'localhost' in production or outgoing communications.
 */
export function getCanonicalBaseUrl(req?: Request): string {
  if (req) {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      const proto = req.headers.get('x-forwarded-proto') || 'https';
      return `${proto}://${host}`;
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (appUrl && !appUrl.includes('localhost') && !appUrl.includes('127.0.0.1')) {
    return appUrl.replace(/\/$/, '');
  }

  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (nextAuthUrl && !nextAuthUrl.includes('localhost') && !nextAuthUrl.includes('127.0.0.1')) {
    return nextAuthUrl.replace(/\/$/, '');
  }

  return 'https://honarhub.ir';
}
