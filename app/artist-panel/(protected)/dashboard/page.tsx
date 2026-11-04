import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ArtistDashboardCopyId from './ArtistDashboardCopyId';
import { formatPersianFullDate, formatPersianDate } from '@/lib/date';

const toPersianDigits = (num: number | string) =>
  String(num).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

export default async function ArtistDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/artist-panel/login');

  const artist = await prisma.artistProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phoneNumber: true,
          image: true,
        }
      },
      specialties: true,
    }
  });

  if (!artist) redirect('/artist-panel/login');
  const artistId = artist.id;

  // Concurrent metrics & recent products fetching
  const [
    approvedCount,
    pendingCount,
    rejectedCount,
    totalProductsCount,
    unreadFeedbackCount,
    recentProducts,
    referralCodesCount,
    usedReferralsCount,
  ] = await Promise.all([
    prisma.product.count({
      where: { artistId, status: 'APPROVED', deletedAt: null }
    }),
    prisma.product.count({
      where: { artistId, status: 'PENDING', deletedAt: null }
    }),
    prisma.product.count({
      where: { artistId, status: 'REJECTED', deletedAt: null }
    }),
    prisma.product.count({
      where: { artistId, deletedAt: null }
    }),
    prisma.product.count({
      where: {
        artistId,
        deletedAt: null,
        adminFeedbackRead: false,
        AND: [
          { adminFeedback: { not: null } },
          { adminFeedback: { not: '' } }
        ]
      }
    }),
    prisma.product.findMany({
      where: { artistId, deletedAt: null },
      include: {
        specialties: true,
        pricingTiers: {
          orderBy: { price: 'asc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),
    prisma.referralCode.count({
      where: { creatorId: session.user.id }
    }),
    prisma.referralCode.count({
      where: { creatorId: session.user.id, isUsed: true }
    })
  ]);

  // Today's Persian Date
  const todayPersian = formatPersianFullDate();

  // Profile completion calculation
  const profileChecks = [
    { label: 'نام برند و اطلاعات موقعیت', done: Boolean(artist.brandName && artist.province && artist.city) },
    { label: 'تصویر پروفایل هنرمند', done: Boolean(artist.user.image) },
    { label: 'انتخاب تخصص‌های هنری', done: artist.specialties.length > 0 },
    { label: 'بیوگرافی و معرفی هویت هنری', done: Boolean(artist.bio && artist.bio.trim().length > 10) },
    { label: 'کد ملی و احراز هویت (سطح ۳)', done: Boolean(artist.nationalId) },
    { label: 'شماره شبای بانکی جهت تسویه (سطح ۳)', done: Boolean(artist.shebaNumber) },
  ];
  const completedChecksCount = profileChecks.filter(c => c.done).length;
  const completionPercentage = Math.round((completedChecksCount / profileChecks.length) * 100);

  // Verification Level Details
  const verificationLevel = artist.verificationLevel || 0;
  const tierBadges: Record<number, { title: string; color: string; border: string; bg: string }> = {
    0: { title: 'سطح ۰ • احراز اولیه', color: 'text-slate-600', border: 'border-slate-200', bg: 'bg-slate-100' },
    1: { title: 'سطح ۱ • اطلاعات پایه هنری', color: 'text-amber-800', border: 'border-amber-300', bg: 'bg-amber-50' },
    2: { title: 'سطح ۲ • هویت هنری تایید شده', color: 'text-blue-800', border: 'border-blue-300', bg: 'bg-blue-50' },
    3: { title: 'سطح ۳ • احراز هویت طلایی مالی', color: 'text-emerald-800', border: 'border-emerald-300', bg: 'bg-emerald-50' },
  };
  const currentTier = tierBadges[verificationLevel] || tierBadges[0];

  const artistName = artist.user.name || artist.brandName || 'هنرمند گرامی';
  const initialLetter = artistName.charAt(0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-12 font-sans" dir="rtl">
      
      {/* 1. HERO WELCOME BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white p-6 sm:p-8 md:p-10 shadow-xl border border-slate-800/80">
        {/* Subtle decorative ambient lights */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Artist Identity & Greeting */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              {artist.user.image ? (
                <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl overflow-hidden ring-4 ring-emerald-500/40 shadow-xl relative bg-slate-800">
                  <Image
                    src={artist.user.image}
                    alt={artistName}
                    fill
                    sizes="88px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-tr from-teal-700 via-emerald-600 to-amber-500 flex items-center justify-center text-white text-2xl sm:text-3xl font-black shadow-xl ring-4 ring-emerald-500/30">
                  {initialLetter}
                </div>
              )}
              {verificationLevel >= 2 && (
                <span className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shadow-md border-2 border-slate-900" title="نشان تایید شده">
                  ✓
                </span>
              )}
            </div>

            {/* Info & Badges */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
                  درود، {artistName}
                </h1>
                <ArtistDashboardCopyId displayId={artist.displayId} />
              </div>

              {artist.brandName && artist.brandName !== artist.user.name && (
                <p className="text-teal-300 font-bold text-xs sm:text-sm flex items-center gap-1.5">
                  <span>🎨 استودیوی هنری:</span>
                  <span>{artist.brandName}</span>
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
                {/* Verification Badge */}
                <span className={`px-2.5 py-1 rounded-lg font-bold border ${currentTier.bg} ${currentTier.color} ${currentTier.border} text-[11px]`}>
                  {currentTier.title}
                </span>

                {/* Persian Date */}
                <span className="text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  <span>{todayPersian}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
            <Link
              href="/artist-panel/products/new"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-black text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg hover:shadow-teal-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-center"
            >
              <span className="text-base font-black">+</span>
              <span>ثبت اثر جدید</span>
            </Link>

            <Link
              href={`/artist/${artist.id}`}
              target="_blank"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl transition-all text-center backdrop-blur-md"
            >
              <span>مشاهده گالری عمومی</span>
              <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. ACTIONABLE ALERTS */}
      {/* 2a. Unread Feedback from Admin */}
      {unreadFeedbackCount > 0 && (
        <div className="bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent border border-rose-200 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <span className="relative flex h-3.5 w-3.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
            </span>
            <div>
              <h4 className="font-black text-rose-900 text-sm sm:text-base">
                شما {toPersianDigits(unreadFeedbackCount)} بازخورد داوری از طرف ادمین دارید!
              </h4>
              <p className="text-rose-700 text-xs mt-0.5 font-medium">
                جهت تایید نهایی و نمایش آثارتان در گالری، لطفاً موارد یادداشت شده توسط ادمین را بررسی و اعمال فرمایید.
              </p>
            </div>
          </div>
          <Link
            href="/artist-panel/products"
            className="shrink-0 w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-xs transition-colors text-center"
          >
            مشاهده بازخوردها و اصلاح
          </Link>
        </div>
      )}

      {/* 2b. Profile Inactive Alert */}
      {!artist.isActive && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl shrink-0">
              ⚠️
            </div>
            <div>
              <h4 className="font-black text-amber-900 text-sm sm:text-base">
                فروشگاه شما هنوز در سایت عمومی منتشر نشده است
              </h4>
              <p className="text-amber-700 text-xs mt-0.5 font-medium">
                برای فعال‌سازی نمایش عمومی آثار در پلتفرم، لطفاً پروفایل و اطلاعات پایه خود را تکمیل فرمایید.
              </p>
            </div>
          </div>
          <Link
            href="/artist-panel/profile"
            className="shrink-0 w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-xs transition-colors text-center"
          >
            تکمیل پروفایل
          </Link>
        </div>
      )}

      {/* 3. KEY METRICS STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-5">
        {/* Metric 1: Approved Works */}
        <Link
          href="/artist-panel/products"
          className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
            </span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              فعال
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {toPersianDigits(approvedCount)}
            </div>
            <div className="text-xs font-bold text-slate-700 mt-1">آثار تایید شده</div>
            <div className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">در حال نمایش در گالری</div>
          </div>
        </Link>

        {/* Metric 2: Pending Review */}
        <Link
          href="/artist-panel/products"
          className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 hover:border-amber-300 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </span>
            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
              داوری
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {toPersianDigits(pendingCount)}
            </div>
            <div className="text-xs font-bold text-slate-700 mt-1">در انتظار بررسی</div>
            <div className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">توسط تیم ارزیابی</div>
          </div>
        </Link>

        {/* Metric 3: Rejected / Needs Edit */}
        <Link
          href="/artist-panel/products"
          className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 hover:border-rose-300 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </span>
            <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
              اصلاح
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {toPersianDigits(rejectedCount)}
            </div>
            <div className="text-xs font-bold text-slate-700 mt-1">نیازمند ویرایش</div>
            <div className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">دارای بازخورد ادمین</div>
          </div>
        </Link>

        {/* Metric 4: Referrals */}
        <Link
          href="/artist-panel/referrals"
          className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 hover:border-purple-300 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            </span>
            <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
              معرف
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {toPersianDigits(usedReferralsCount)} <span className="text-xs text-slate-400 font-normal">/ {toPersianDigits(referralCodesCount)}</span>
            </div>
            <div className="text-xs font-bold text-slate-700 mt-1">هنرمندان دعوت‌شده</div>
            <div className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">کدهای معرف فعال شما</div>
          </div>
        </Link>

        {/* Metric 5: Wallet Balance */}
        <div className="col-span-2 md:col-span-1 lg:col-span-1 bg-gradient-to-br from-teal-50 to-emerald-50/50 p-4 sm:p-5 rounded-3xl border border-teal-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            </span>
            <span className="text-[11px] font-bold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-md">
              کیف پول
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-teal-900 tracking-tight">
              {toPersianDigits(artist.balance.toLocaleString())} <span className="text-xs font-normal text-teal-700">تومان</span>
            </div>
            <div className="text-xs font-bold text-teal-800 mt-1">موجودی قابل تسویه</div>
            <div className="text-[11px] text-teal-600/80 mt-0.5">کارمزد پلتفرم: {toPersianDigits(artist.commissionRate)}٪</div>
          </div>
        </div>
      </div>

      {/* 4. TWO-COLUMN CONTENT GRID: Profile Progress & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col (1 Col on Desktop): Profile Completion & Verification Hub */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                <span>🛡️</span>
                <span>وضعیت پرونده هنرمندی</span>
              </h3>
              <span className="font-black text-xs text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-xl">
                {toPersianDigits(completionPercentage)}٪ تکمیل شده
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-medium mb-4">
              با تکمیل ۱۰۰٪ پرونده و ارتقا به سطح ۳، نشان طلایی اصالت به آثار شما افزوده می‌شود.
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-5">
              <div
                className="bg-gradient-to-r from-teal-500 to-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            {/* Checklist */}
            <div className="space-y-2.5">
              {profileChecks.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                  <span className={`font-medium ${item.done ? 'text-slate-700' : 'text-slate-400'}`}>
                    {item.label}
                  </span>
                  {item.done ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                      <span>تکمیل</span>
                      <span>✓</span>
                    </span>
                  ) : (
                    <span className="text-amber-600 font-bold text-[11px]">
                      ناقص
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/artist-panel/verification"
              className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-xs transition-colors"
            >
              <span>مدیریت مدارک و ارتقای سطح</span>
              <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>

        {/* Right Col (2 Cols on Desktop): Quick Actions Hub */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
              <span>⚡</span>
              <span>میز کار و دسترسی‌های سریع</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">اقدامات پرکاربرد</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {/* Action 1 */}
            <Link
              href="/artist-panel/products/new"
              className="p-4 rounded-2xl border border-slate-200 hover:border-teal-400 bg-slate-50/50 hover:bg-teal-50/30 transition-all group flex flex-col justify-between"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center text-lg mb-3 group-hover:scale-105 transition-transform">
                ➕
              </div>
              <div>
                <div className="font-black text-sm text-slate-800 group-hover:text-teal-900">
                  ثبت اثر جدید
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  بارگذاری عکس، قیمت و مشخصات اثر
                </div>
              </div>
            </Link>

            {/* Action 2 */}
            <Link
              href="/artist-panel/products"
              className="p-4 rounded-2xl border border-slate-200 hover:border-teal-400 bg-slate-50/50 hover:bg-teal-50/30 transition-all group flex flex-col justify-between"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-lg mb-3 group-hover:scale-105 transition-transform">
                📦
              </div>
              <div>
                <div className="font-black text-sm text-slate-800 group-hover:text-teal-900">
                  مدیریت آثار
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  ویرایش، موجودی و وضعیت داوری
                </div>
              </div>
            </Link>

            {/* Action 3 */}
            <Link
              href="/artist-panel/referrals"
              className="p-4 rounded-2xl border border-slate-200 hover:border-teal-400 bg-slate-50/50 hover:bg-teal-50/30 transition-all group flex flex-col justify-between"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-lg mb-3 group-hover:scale-105 transition-transform">
                🤝
              </div>
              <div>
                <div className="font-black text-sm text-slate-800 group-hover:text-teal-900">
                  باشگاه معرف‌ها
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  کدهای دعوت و پاداش هنرمندان
                </div>
              </div>
            </Link>

            {/* Action 4 */}
            <Link
              href="/artist-panel/profile"
              className="p-4 rounded-2xl border border-slate-200 hover:border-teal-400 bg-slate-50/50 hover:bg-teal-50/30 transition-all group flex flex-col justify-between"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg mb-3 group-hover:scale-105 transition-transform">
                ✍️
              </div>
              <div>
                <div className="font-black text-sm text-slate-800 group-hover:text-teal-900">
                  ویرایش پروفایل
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  بیوگرافی، داستان هنرمند و شبکه‌ها
                </div>
              </div>
            </Link>

            {/* Action 5 */}
            <Link
              href="/artist-panel/verification"
              className="p-4 rounded-2xl border border-slate-200 hover:border-teal-400 bg-slate-50/50 hover:bg-teal-50/30 transition-all group flex flex-col justify-between"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg mb-3 group-hover:scale-105 transition-transform">
                💳
              </div>
              <div>
                <div className="font-black text-sm text-slate-800 group-hover:text-teal-900">
                  احراز هویت و شبا
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  کارت ملی، شبا و نشان اصالت
                </div>
              </div>
            </Link>

            {/* Action 6 */}
            <Link
              href="/artist-panel/security"
              className="p-4 rounded-2xl border border-slate-200 hover:border-teal-400 bg-slate-50/50 hover:bg-teal-50/30 transition-all group flex flex-col justify-between"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center text-lg mb-3 group-hover:scale-105 transition-transform">
                🔒
              </div>
              <div>
                <div className="font-black text-sm text-slate-800 group-hover:text-teal-900">
                  امنیت و رمز عبور
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  تغییر رمز و نشست‌های فعال
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* 5. RECENT PRODUCTS SHOWCASE */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
              <span>🎨</span>
              <span>آخرین آثار ثبت‌شده شما</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ۵ اثر اخیر ثبت شده در پلتفرم هنرهاب
            </p>
          </div>

          <Link
            href="/artist-panel/products"
            className="text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors flex items-center gap-1"
          >
            <span>مشاهده همه آثار ({toPersianDigits(totalProductsCount)})</span>
            <svg className="w-3.5 h-3.5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
          </Link>
        </div>

        {recentProducts.length > 0 ? (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            {recentProducts.map((p) => {
              const lowestPrice = p.pricingTiers?.[0]?.price;
              const statusBadge = {
                APPROVED: { text: 'تایید شده', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                PENDING: { text: 'در انتظار بررسی', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
                REJECTED: { text: 'نیازمند اصلاح', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
                ARCHIVED: { text: 'بایگانی‌شده', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
              }[p.status] || { text: p.status, cls: 'bg-slate-100 text-slate-600 border-slate-200' };

              return (
                <div key={p.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/60 rounded-xl px-2 transition-colors">
                  {/* Thumbnail & Title */}
                  <div className="flex items-center gap-3.5 min-w-[220px]">
                    <div className="w-13 h-13 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt={p.title}
                          fill
                          sizes="52px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                          بدون عکس
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 line-clamp-1">
                        {p.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {p.specialties?.[0] && (
                          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {p.specialties[0].name}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatPersianDate(p.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Stock */}
                  <div className="hidden sm:block text-left font-sans">
                    <div className="font-black text-sm text-slate-800">
                      {lowestPrice ? `${toPersianDigits(lowestPrice.toLocaleString())} تومان` : 'قیمت تعیین نشده'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      موجودی: {toPersianDigits(p.stockQuantity)} عدد
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${statusBadge.cls}`}>
                      {statusBadge.text}
                    </span>

                    <Link
                      href={`/artist-panel/products/${p.id}/edit`}
                      className="text-xs font-bold text-slate-600 hover:text-teal-700 bg-slate-100 hover:bg-teal-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                    >
                      ویرایش
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-10 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center text-2xl mb-3 shadow-2xs">
              🎨
            </div>
            <h4 className="font-black text-slate-800 text-base mb-1">
              هنوز هیچ اثری ثبت نکرده‌اید!
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mb-4">
              هنرهاب بستری برای معرفی و فروش هنر اصیل شما به سراسر کشور است. همین حالا اولین اثر خود را ثبت کنید.
            </p>
            <Link
              href="/artist-panel/products/new"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              <span>+ ثبت اولین اثر در فروشگاه</span>
            </Link>
          </div>
        )}
      </div>

      {/* 6. PLATFORM GUIDELINES & SELLING TIPS */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center text-base border border-amber-400/30">
            💡
          </span>
          <div>
            <h3 className="font-black text-base text-white">توصیه‌های طلایی هنرهاب برای افزایش فروش آثار</h3>
            <p className="text-xs text-slate-400 mt-0.5">نکاتی که بیشترین تاثیر را بر تصمیم خرید علاقه‌مندان به هنر می‌گذارند</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1.5">
            <h4 className="font-bold text-teal-300 text-xs sm:text-sm flex items-center gap-2">
              <span>📸</span>
              <span>عکاسی در نور طبیعی</span>
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed font-normal">
              آثاری که در نور طبیعی روز و در کنار المان‌های واقعی دکوراسیون عکاسی می‌شوند، تا ۳ برابر شانس خرید بالاتری دارند.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1.5">
            <h4 className="font-bold text-teal-300 text-xs sm:text-sm flex items-center gap-2">
              <span>📖</span>
              <span>روایت داستان خلق اثر</span>
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed font-normal">
              خریداران عاشق شنیدن الهامات شما، نوع متریال دست‌ساز و زمان صرف‌شده هستند. بیوگرافی و توضیحات محصول را با دل و جان بنویسید.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1.5">
            <h4 className="font-bold text-teal-300 text-xs sm:text-sm flex items-center gap-2">
              <span>🏅</span>
              <span>دریافت نشان اصالت سطح ۳</span>
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed font-normal">
              با تکمیل احراز هویت مالی، نشان اعتماد طلایی روی محصولات شما درج شده و مبالغ فروش بدون تاخیر مستقیماً به شبای شما تسویه می‌گردد.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
