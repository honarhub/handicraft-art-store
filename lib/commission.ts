import prisma from '@/lib/prisma';

export type ArtistTierType = 'BRONZE' | 'SILVER' | 'GOLDEN' | 'IRAN_ZAMIN';

export interface CommissionSettings {
  commissionBronzeRate: number;
  commissionSilverRate: number;
  commissionSilverMonthlySales: number;
  commissionSilverYearlySales: number;
  commissionGoldenRate: number;
  commissionGoldenMonthlySales: number;
  commissionGoldenYearlySales: number;
  commissionIranZaminRate: number;
  commissionIranZaminMonthlySales: number;
  specialOfferLaunchActive: boolean;
  specialOfferLaunchDeadline: string;
  specialOfferLaunchTier: string;
  specialOfferLaunchRate: number;
}

export interface ArtistTierCalculation {
  tier: ArtistTierType;
  tierNameFa: string;
  commissionRate: number;
  monthlySalesCount: number;
  yearlySalesCount: number;
  isSpecialOfferApplied: boolean;
  specialOfferDeadline: string;
  currentPersianMonthName: string;
  currentPersianYear: number;
  currentPersianMonth: number;
  nextTier: {
    tier: ArtistTierType;
    tierNameFa: string;
    monthlyRequired: number;
    yearlyRequired?: number;
    remainingMonthly: number;
    remainingYearly?: number;
  } | null;
}

const PERSIAN_MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

/**
 * Returns Persian (Jalali) year, month (1-12), and day (1-31) in Asia/Tehran timezone.
 */
export function getPersianDateParts(date: Date = new Date()): { year: number; month: number; day: number } {
  try {
    const formatter = new Intl.DateTimeFormat('en-US-u-ca-persian', {
      timeZone: 'Asia/Tehran',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    const parts = formatter.formatToParts(date);
    const res: Record<string, number> = {};
    for (const p of parts) {
      if (p.type === 'year' || p.type === 'month' || p.type === 'day') {
        res[p.type] = parseInt(p.value, 10);
      }
    }
    return {
      year: res.year || 1405,
      month: res.month || 1,
      day: res.day || 1,
    };
  } catch {
    return { year: 1405, month: 8, day: 21 };
  }
}

/**
 * Parses a Shamsi date string like "1406/01/01" into year, month, day.
 */
export function parseShamsiDateString(str: string): { year: number; month: number; day: number } {
  const clean = (str || '1406/01/01').replace(/[^\d/]/g, '');
  const [y, m, d] = clean.split('/').map((s) => parseInt(s, 10));
  return { year: y || 1406, month: m || 1, day: d || 1 };
}

/**
 * Fetches commission settings from SiteSettings or returns default fallback.
 */
export async function getCommissionSettings(): Promise<CommissionSettings> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: 'default' },
  });

  return {
    commissionBronzeRate: settings?.commissionBronzeRate ?? 5.0,
    commissionSilverRate: settings?.commissionSilverRate ?? 3.0,
    commissionSilverMonthlySales: settings?.commissionSilverMonthlySales ?? 10,
    commissionSilverYearlySales: settings?.commissionSilverYearlySales ?? 50,
    commissionGoldenRate: settings?.commissionGoldenRate ?? 1.0,
    commissionGoldenMonthlySales: settings?.commissionGoldenMonthlySales ?? 30,
    commissionGoldenYearlySales: settings?.commissionGoldenYearlySales ?? 200,
    commissionIranZaminRate: settings?.commissionIranZaminRate ?? 0.0,
    commissionIranZaminMonthlySales: settings?.commissionIranZaminMonthlySales ?? 100,
    specialOfferLaunchActive: settings?.specialOfferLaunchActive ?? true,
    specialOfferLaunchDeadline: settings?.specialOfferLaunchDeadline ?? '1406/01/01',
    specialOfferLaunchTier: settings?.specialOfferLaunchTier ?? 'GOLDEN',
    specialOfferLaunchRate: settings?.specialOfferLaunchRate ?? 1.0,
  };
}

/**
 * Calculates successful sales counts and determines the artist's effective tier & commission.
 */
export async function calculateArtistTier(
  artistId: string,
  settings?: CommissionSettings,
  autoUpdateProfile = true
): Promise<ArtistTierCalculation> {
  const resolvedSettings = settings || (await getCommissionSettings());
  const now = new Date();
  const currentPersian = getPersianDateParts(now);

  // 1. Fetch artist details
  const artist = await prisma.artistProfile.findUnique({
    where: { id: artistId },
    select: {
      id: true,
      createdAt: true,
      commissionTier: true,
      commissionRate: true,
    },
  });

  if (!artist) {
    throw new Error('Artist not found');
  }

  // 2. Fetch all successful paid sales for this artist
  const successfulOrderItems = await prisma.orderItem.findMany({
    where: {
      OR: [
        { artistId: artist.id },
        { product: { artistId: artist.id } },
      ],
      order: {
        status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
      },
      itemStatus: { not: 'CANCELLED' },
    },
    select: {
      id: true,
      quantity: true,
      order: {
        select: {
          paidAt: true,
          createdAt: true,
        },
      },
    },
  });

  // 3. Count sales for current Persian month and current Persian year
  let monthlySalesCount = 0;
  let yearlySalesCount = 0;

  for (const item of successfulOrderItems) {
    const saleDate = item.order.paidAt || item.order.createdAt;
    const salePersian = getPersianDateParts(new Date(saleDate));
    const qty = item.quantity || 1;

    if (salePersian.year === currentPersian.year) {
      yearlySalesCount += qty;
      if (salePersian.month === currentPersian.month) {
        monthlySalesCount += qty;
      }
    }
  }

  // 4. Check Special Launch Offer
  // Artists registered on or before deadline qualify for special offer (GOLDEN 1%)
  let isSpecialOfferApplied = false;
  if (resolvedSettings.specialOfferLaunchActive) {
    const deadline = parseShamsiDateString(resolvedSettings.specialOfferLaunchDeadline);
    const artistRegPersian = getPersianDateParts(new Date(artist.createdAt));

    const isBeforeOrOnDeadline =
      artistRegPersian.year < deadline.year ||
      (artistRegPersian.year === deadline.year && artistRegPersian.month < deadline.month) ||
      (artistRegPersian.year === deadline.year &&
        artistRegPersian.month === deadline.month &&
        artistRegPersian.day <= deadline.day);

    if (isBeforeOrOnDeadline) {
      isSpecialOfferApplied = true;
    }
  }

  // 5. Tier Resolution (from highest to lowest)
  let tier: ArtistTierType = 'BRONZE';
  let commissionRate = resolvedSettings.commissionBronzeRate;

  // A. Check Iran Zamin: 100 sales in current solar month => 0% commission for the month
  if (monthlySalesCount >= resolvedSettings.commissionIranZaminMonthlySales) {
    tier = 'IRAN_ZAMIN';
    commissionRate = resolvedSettings.commissionIranZaminRate;
  }
  // B. Check Golden: 30 monthly sales OR 200 yearly sales OR Special Launch Offer
  else if (
    monthlySalesCount >= resolvedSettings.commissionGoldenMonthlySales ||
    yearlySalesCount >= resolvedSettings.commissionGoldenYearlySales ||
    isSpecialOfferApplied
  ) {
    tier = 'GOLDEN';
    commissionRate = isSpecialOfferApplied
      ? resolvedSettings.specialOfferLaunchRate
      : resolvedSettings.commissionGoldenRate;
  }
  // C. Check Silver: 10 monthly sales OR 50 yearly sales
  else if (
    monthlySalesCount >= resolvedSettings.commissionSilverMonthlySales ||
    yearlySalesCount >= resolvedSettings.commissionSilverYearlySales
  ) {
    tier = 'SILVER';
    commissionRate = resolvedSettings.commissionSilverRate;
  }
  // D. Otherwise Bronze: default 5%
  else {
    tier = 'BRONZE';
    commissionRate = resolvedSettings.commissionBronzeRate;
  }

  // 6. Next Tier Progression Info
  let nextTier = null;
  if (tier === 'BRONZE') {
    nextTier = {
      tier: 'SILVER' as ArtistTierType,
      tierNameFa: 'هنرمند نقره‌ای',
      monthlyRequired: resolvedSettings.commissionSilverMonthlySales,
      yearlyRequired: resolvedSettings.commissionSilverYearlySales,
      remainingMonthly: Math.max(0, resolvedSettings.commissionSilverMonthlySales - monthlySalesCount),
      remainingYearly: Math.max(0, resolvedSettings.commissionSilverYearlySales - yearlySalesCount),
    };
  } else if (tier === 'SILVER') {
    nextTier = {
      tier: 'GOLDEN' as ArtistTierType,
      tierNameFa: 'هنرمند طلایی',
      monthlyRequired: resolvedSettings.commissionGoldenMonthlySales,
      yearlyRequired: resolvedSettings.commissionGoldenYearlySales,
      remainingMonthly: Math.max(0, resolvedSettings.commissionGoldenMonthlySales - monthlySalesCount),
      remainingYearly: Math.max(0, resolvedSettings.commissionGoldenYearlySales - yearlySalesCount),
    };
  } else if (tier === 'GOLDEN') {
    nextTier = {
      tier: 'IRAN_ZAMIN' as ArtistTierType,
      tierNameFa: 'هنرمند ایران زمین',
      monthlyRequired: resolvedSettings.commissionIranZaminMonthlySales,
      remainingMonthly: Math.max(0, resolvedSettings.commissionIranZaminMonthlySales - monthlySalesCount),
    };
  }

  const tierNames: Record<ArtistTierType, string> = {
    BRONZE: 'هنرمند برنزی',
    SILVER: 'هنرمند نقره‌ای',
    GOLDEN: 'هنرمند طلایی',
    IRAN_ZAMIN: 'هنرمند ایران زمین',
  };

  // 7. Update database profile if values changed
  if (
    autoUpdateProfile &&
    (artist.commissionTier !== tier || Math.abs(artist.commissionRate - commissionRate) > 0.01)
  ) {
    await prisma.artistProfile
      .update({
        where: { id: artistId },
        data: {
          commissionTier: tier,
          commissionRate,
        },
      })
      .catch((e) => console.error('Failed to sync artist commission tier in DB:', e));
  }

  return {
    tier,
    tierNameFa: tierNames[tier],
    commissionRate,
    monthlySalesCount,
    yearlySalesCount,
    isSpecialOfferApplied,
    specialOfferDeadline: resolvedSettings.specialOfferLaunchDeadline,
    currentPersianMonthName: PERSIAN_MONTH_NAMES[(currentPersian.month - 1) % 12],
    currentPersianYear: currentPersian.year,
    currentPersianMonth: currentPersian.month,
    nextTier,
  };
}
