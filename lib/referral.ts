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
 * Ensures an artist has up to `targetCount` referral codes (default 3).
 * Only creates missing codes if the artist currently has fewer than `targetCount`.
 * If the artist has excess unused codes beyond `targetCount`, prunes them so the total matches targetCount.
 */
export async function ensureArtistReferralCodes(userId: string, targetCount = 3) {
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
  } else if (existingCodes.length > targetCount) {
    // If the artist has more codes than targetCount (e.g. from previous higher quota),
    // prune excess unused codes while strictly preserving already-used ones.
    const unused = existingCodes.filter(c => !c.isUsed);
    const used = existingCodes.filter(c => c.isUsed);
    const allowedUnused = Math.max(0, targetCount - used.length);
    if (unused.length > allowedUnused) {
      const excessUnused = unused.slice(allowedUnused);
      await prisma.referralCode.deleteMany({
        where: {
          id: { in: excessUnused.map(c => c.id) }
        }
      });
    }
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
