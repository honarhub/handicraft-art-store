import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';

const toPersianDigits = (num: number | string) =>
  String(num).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

export default async function CustomerPanelDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login?callbackUrl=/panel');

  const userId = session.user.id;

  // Concurrent metrics & data fetch
  const [
    user,
    activeOrdersCount,
    deliveredOrdersCount,
    wishlistCount,
    addressesCount,
    recentOrders,
    recentWishlist
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
      }
    }),
    prisma.order.count({
      where: {
        userId,
        status: { in: ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED'] }
      }
    }),
    prisma.order.count({
      where: { userId, status: 'DELIVERED' }
    }),
    prisma.wishlistItem.count({
      where: { userId }
    }),
    prisma.userAddress.count({
      where: { userId }
    }),
    prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                artist: {
                  select: {
                    id: true,
                    brandName: true,
                    user: { select: { name: true } }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    }),
    prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            artist: {
              select: {
                brandName: true,
                user: { select: { name: true } }
              }
            },
            pricingTiers: {
              orderBy: { price: 'asc' },
              take: 1
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 4
    })
  ]);

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'خریدار گرامی');
  const todayPersian = new Intl.DateTimeFormat('fa-IR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const memberSince = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('fa-IR')
    : 'امروز';

  return (
    <div className="space-y-6 font-sans select-none" dir="rtl">
      
      {/* 1. WELCOME HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="absolute top-0 left-0 w-72 h-72 bg-teal-500/10 blur-[90px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-500/10 blur-[90px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-amber-500 via-teal-600 to-emerald-600 text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-lg ring-4 ring-white/10 shrink-0">
              {displayName.charAt(0)}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  سلام، {displayName} 👋
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  عضو باشگاه خریداران
                </span>
              </div>

              <p className="text-xs text-slate-300 font-medium">
                عضویت از: {toPersianDigits(memberSince)} • شماره: {user?.phoneNumber ? toPersianDigits(user.phoneNumber) : 'ثبت‌نشده'}
              </p>

              <div className="pt-1 text-[11px] text-slate-400 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                <span>{todayPersian}</span>
              </div>
            </div>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-black text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-md hover:shadow-teal-500/20 transition-all shrink-0 active:scale-98"
          >
            <span>کاوش در گالری آثار</span>
            <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Metric 1: Active Orders */}
        <Link
          href="/panel/orders"
          className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 hover:border-teal-300 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
              📦
            </span>
            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
              جاری
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {toPersianDigits(activeOrdersCount)}
            </div>
            <div className="text-xs font-bold text-slate-700 mt-0.5">سفارش‌های در حال انجام</div>
          </div>
        </Link>

        {/* Metric 2: Delivered Orders */}
        <Link
          href="/panel/orders"
          className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
              ✨
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              تحویل‌شده
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {toPersianDigits(deliveredOrdersCount)}
            </div>
            <div className="text-xs font-bold text-slate-700 mt-0.5">خریدهای موفق</div>
          </div>
        </Link>

        {/* Metric 3: Wishlist */}
        <Link
          href="/panel/wishlist"
          className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 hover:border-purple-300 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
              🔖
            </span>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
              نشان‌شده
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {toPersianDigits(wishlistCount)}
            </div>
            <div className="text-xs font-bold text-slate-700 mt-0.5">آثار علاقه‌مندی</div>
          </div>
        </Link>

        {/* Metric 4: Addresses */}
        <Link
          href="/panel/addresses"
          className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 hover:border-amber-300 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
              📍
            </span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              ارسال
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {toPersianDigits(addressesCount)}
            </div>
            <div className="text-xs font-bold text-slate-700 mt-0.5">آدرس‌های ثبت شده</div>
          </div>
        </Link>
      </div>

      {/* 3. RECENT ORDERS OR EMPTY STATE */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
            <span>📦</span>
            <span>آخرین سفارش‌های شما</span>
          </h3>
          <Link
            href="/panel/orders"
            className="text-xs font-bold text-teal-600 hover:text-teal-800 transition-colors"
          >
            مشاهده همه سفارش‌ها
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="space-y-3">
            {recentOrders.map((order) => {
              const statusBadge = {
                PENDING: { text: 'در انتظار پرداخت', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
                PAID: { text: 'پرداخت شده / آماده‌سازی', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
                PROCESSING: { text: 'در حال ساخت توسط هنرمند', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
                SHIPPED: { text: 'ارسال با پست پیشتاز', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
                DELIVERED: { text: 'تحویل داده شده', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                CANCELLED: { text: 'لغو شده', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
              }[order.status] || { text: order.status, cls: 'bg-slate-100 text-slate-600 border-slate-200' };

              return (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex -space-x-3 space-x-reverse overflow-hidden">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="w-12 h-12 rounded-xl border-2 border-white overflow-hidden bg-slate-200 relative shrink-0 shadow-xs">
                          {item.product?.imageUrl && (
                            <Image
                              src={item.product.imageUrl}
                              alt={item.product.title}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    <div>
                      <div className="font-black text-sm text-slate-900">
                        سفارش #{order.id.slice(-6).toUpperCase()}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {toPersianDigits(order.items.length)} اثر • {new Date(order.createdAt).toLocaleDateString('fa-IR')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                    <div className="text-left">
                      <div className="font-black text-sm text-slate-900">
                        {toPersianDigits(order.total.toLocaleString())} تومان
                      </div>
                      <span className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusBadge.cls}`}>
                        {statusBadge.text}
                      </span>
                    </div>

                    <Link
                      href={`/panel/orders`}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-colors"
                    >
                      جزئیات
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-14 h-14 mx-auto rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center text-2xl mb-3 shadow-2xs">
              🛍️
            </div>
            <h4 className="font-black text-slate-800 text-sm sm:text-base mb-1">
              هنوز سفارشی ثبت نکرده‌اید!
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mb-4">
              مجموعه‌ای از اصیل‌ترین آثار دست‌ساز اساتید و هنرمندان ایرانی در گالری هنرهاب منتظر شماست.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              <span>مشاهده و خرید آثار گالری</span>
            </Link>
          </div>
        )}
      </div>

      {/* 4. RECENT WISHLIST PREVIEW */}
      {recentWishlist.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <span>🔖</span>
              <span>منتخب آثار نشان‌شده شما</span>
            </h3>
            <Link
              href="/panel/wishlist"
              className="text-xs font-bold text-teal-600 hover:text-teal-800 transition-colors"
            >
              مشاهده همه ({toPersianDigits(wishlistCount)})
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {recentWishlist.map((item) => {
              const p = item.product;
              const lowestPrice = p.pricingTiers?.[0]?.price;
              return (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="group rounded-2xl border border-slate-200/80 bg-slate-50/40 p-2.5 hover:bg-white hover:border-teal-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-100 relative mb-2">
                    {p.imageUrl && (
                      <Image
                        src={p.imageUrl}
                        alt={p.title}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 line-clamp-1 group-hover:text-teal-700">
                      {p.title}
                    </h4>
                    <div className="font-black text-xs text-slate-900 mt-1">
                      {lowestPrice ? `${toPersianDigits(lowestPrice.toLocaleString())} تومان` : 'تماس'}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. COLLECTOR ASSURANCE BANNER */}
      <div className="bg-gradient-to-r from-teal-900 to-slate-950 text-white rounded-3xl p-6 sm:p-7 border border-teal-800/60 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-center sm:text-right">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-white/10 text-teal-300 flex items-center justify-center text-lg shrink-0">
              🏅
            </span>
            <div>
              <div className="font-black text-xs sm:text-sm text-teal-200">ضمانت ۱۰۰٪ اصالت اثر</div>
              <div className="text-[11px] text-slate-400 mt-0.5">شناسنامه دیجیتال و تایید هنرمند</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-white/10 text-amber-300 flex items-center justify-center text-lg shrink-0">
              🎨
            </span>
            <div>
              <div className="font-black text-xs sm:text-sm text-amber-200">ارسال مستقیم از کارگاه</div>
              <div className="text-[11px] text-slate-400 mt-0.5">خرید بدون واسطه از استادکاران</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-white/10 text-emerald-300 flex items-center justify-center text-lg shrink-0">
              🛡️
            </span>
            <div>
              <div className="font-black text-xs sm:text-sm text-emerald-200">بسته‌بندی ایمن و بیمه‌شده</div>
              <div className="text-[11px] text-slate-400 mt-0.5">تحویل سالم تا درب منزل شما</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
