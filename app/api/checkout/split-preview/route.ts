import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getBankInfoByCardNumber } from '@/lib/sms';

export const dynamic = 'force-dynamic';

export interface CartSplitItem {
  id?: string;
  productId: string;
  title: string;
  price: number;
  imageUrl: string;
  artistName: string;
  quantity: number;
  tierId?: string;
  tierTitle?: string;
}

export interface SplitGroup {
  key: string;
  type: 'DIRECT_ARTIST' | 'ADMIN_DEFAULT';
  artistId?: string;
  displayName: string;
  ownerName: string;
  cardNumberMasked: string | null;
  bankTitle: string | null;
  isDirectSettlement: boolean;
  items: CartSplitItem[];
  totalAmount: number;
  itemsCount: number;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items = [] } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ splits: [], totalOverall: 0 });
    }

    // Get site settings for admin default account
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'default' },
    });

    const adminCard = settings?.adminCardNumber || null;
    const adminMasked = adminCard && adminCard.length >= 16
      ? `${adminCard.slice(0, 4)} •••• •••• ${adminCard.slice(-4)}`
      : 'حساب پیش‌فرض پلتفرم هنرهاب';
    const adminBank = settings?.adminCardBankTitle || (adminCard ? getBankInfoByCardNumber(adminCard).title : 'بانک مهر ایران');

    // Fetch product details with artist verification status
    const productIds = Array.from(new Set(items.map((i: any) => i.productId)));
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        title: true,
        artistId: true,
        artist: {
          select: {
            id: true,
            brandName: true,
            verificationLevel: true,
            isHonarhubPayApproved: true,
            cardNumber: true,
            cardBankTitle: true,
            honarhubPayCardId: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const productMap = new Map<string, typeof products[0]>();
    products.forEach((p) => productMap.set(p.id, p));

    // Groups dictionary: artistId -> SplitGroup, or 'admin_default' -> SplitGroup
    const directGroups: Record<string, SplitGroup> = {};
    const adminGroup: SplitGroup = {
      key: 'admin_default',
      type: 'ADMIN_DEFAULT',
      displayName: 'سایر دست‌سازه‌ها (واریز به حساب مرکزی هنرهاب)',
      ownerName: settings?.adminCardOwnerName || 'مدیریت هنرهاب',
      cardNumberMasked: adminMasked,
      bankTitle: adminBank,
      isDirectSettlement: false,
      items: [],
      totalAmount: 0,
      itemsCount: 0,
    };

    items.forEach((item: CartSplitItem) => {
      const prod = productMap.get(item.productId);
      const artist = prod?.artist;
      const isEligibleDirect = Boolean(
        artist &&
        artist.verificationLevel >= 3 &&
        artist.isHonarhubPayApproved &&
        artist.cardNumber
      );

      const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);

      if (isEligibleDirect && artist) {
        if (!directGroups[artist.id]) {
          const cardClean = artist.cardNumber!.replace(/\D/g, '');
          const cardMasked = `${cardClean.slice(0, 4)} •••• •••• ${cardClean.slice(-4)}`;
          const bank = artist.cardBankTitle || getBankInfoByCardNumber(cardClean).title;
          const displayTitle = artist.brandName
            ? `گالری ${artist.brandName} (${artist.user?.name || ''})`
            : `هنرمند ${artist.user?.name || 'مستقل'}`;

          directGroups[artist.id] = {
            key: `artist_${artist.id}`,
            type: 'DIRECT_ARTIST',
            artistId: artist.id,
            displayName: displayTitle,
            ownerName: artist.user?.name || artist.brandName || 'هنرمند مستقل',
            cardNumberMasked: cardMasked,
            bankTitle: bank,
            isDirectSettlement: true,
            items: [],
            totalAmount: 0,
            itemsCount: 0,
          };
        }

        directGroups[artist.id].items.push(item);
        directGroups[artist.id].totalAmount += lineTotal;
        directGroups[artist.id].itemsCount += Number(item.quantity) || 1;
      } else {
        adminGroup.items.push(item);
        adminGroup.totalAmount += lineTotal;
        adminGroup.itemsCount += Number(item.quantity) || 1;
      }
    });

    const splits: SplitGroup[] = Object.values(directGroups);
    if (adminGroup.items.length > 0) {
      splits.push(adminGroup);
    }

    const totalOverall = splits.reduce((acc, s) => acc + s.totalAmount, 0);

    return NextResponse.json({
      splits,
      totalOverall,
      hasMultipleSplits: splits.length > 1,
    });
  } catch (error: any) {
    console.error('Error generating split preview:', error);
    return NextResponse.json(
      { error: 'خطا در محاسبه تفکیک فاکتورهای سبد خرید: ' + error.message },
      { status: 500 }
    );
  }
}
