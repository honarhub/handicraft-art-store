import React from 'react';
import prisma from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
  // Query comprehensive stats concurrently
  const [
    totalArtists,
    activeArtists,
    pendingArtists,
    totalApprovedProducts,
    pendingProducts,
    outOfStockProducts,
    totalArticles,
    publishedArticles,
    totalSupportMessages,
    unresolvedSupportMessages,
    pendingStockRequests,
    totalSpecialties,
    recentPendingArtists,
    recentPendingProducts,
    recentSupportMessages
  ] = await Promise.all([
    prisma.artistProfile.count({ where: { isDeleted: false } }),
    prisma.artistProfile.count({ where: { isDeleted: false, isApproved: true, isActive: true } }),
    prisma.artistProfile.count({ where: { isDeleted: false, isApproved: false } }),
    prisma.product.count({ where: { status: 'APPROVED', deletedAt: null } }),
    prisma.product.count({ where: { status: 'PENDING', deletedAt: null } }),
    prisma.product.count({ where: { status: 'APPROVED', stockQuantity: 0, deletedAt: null } }),
    prisma.blogPost.count(),
    prisma.blogPost.count({ where: { isPublished: true } }),
    prisma.supportMessage.count(),
    prisma.supportMessage.count({ where: { status: 'PENDING' } }),
    prisma.stockNotification.count({ where: { isNotified: false } }),
    prisma.specialty.count(),
    prisma.artistProfile.findMany({
      where: { isDeleted: false, isApproved: false },
      take: 5,
      orderBy: { id: 'desc' },
      include: { user: true, specialties: true }
    }),
    prisma.product.findMany({
      where: { status: 'PENDING', deletedAt: null },
      take: 5,
      orderBy: { id: 'desc' },
      include: { artist: { include: { user: true } } }
    }),
    prisma.supportMessage.findMany({
      where: { status: 'PENDING' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { product: true }
    })
  ]);

  const todayPersian = new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'full'
  }).format(new Date());

  const totalActionRequired = pendingArtists + pendingProducts + unresolvedSupportMessages + pendingStockRequests;

  return (
    <div className="p-6 md:p-10 space-y-8" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3.5 py-1 rounded-full text-xs font-bold">
                پیشخوان فرماندهی سامانه
              </span>
              <span className="text-slate-400 text-xs font-medium">📅 {todayPersian}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black mt-2 text-white">
              نمای کلی سامانه هنرهاب
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
              گزارش زنده از وضعیت هنرمندان، محصولات، مقالات وبلاگ، موجودی انبار و درخواست‌های پشتیبانی کاربران.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 backdrop-blur-md"
            >
              <span>🌐</span>
              <span>مشاهده سایت</span>
            </Link>
            <Link
              href="/admin/products/new"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-indigo-900/50"
            >
              <span>✨</span>
              <span>ثبت اثر جدید</span>
            </Link>
            <Link
              href="/admin/artists/new"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-emerald-900/50"
            >
              <span>👤</span>
              <span>افزودن هنرمند</span>
            </Link>
          </div>
        </div>

        {/* Action required alert bar */}
        {totalActionRequired > 0 && (
          <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span>توجه: تعداد {totalActionRequired.toLocaleString('fa-IR')} مورد نیازمند بررسی و اقدام فوری شما می‌باشد.</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              {pendingArtists > 0 && <span className="bg-amber-500/20 text-amber-200 px-2.5 py-1 rounded-lg">هنرمندان جدید: {pendingArtists.toLocaleString('fa-IR')}</span>}
              {pendingProducts > 0 && <span className="bg-amber-500/20 text-amber-200 px-2.5 py-1 rounded-lg">محصولات تایید نشده: {pendingProducts.toLocaleString('fa-IR')}</span>}
              {unresolvedSupportMessages > 0 && <span className="bg-rose-500/20 text-rose-200 px-2.5 py-1 rounded-lg">تیکت‌های باز: {unresolvedSupportMessages.toLocaleString('fa-IR')}</span>}
              {pendingStockRequests > 0 && <span className="bg-sky-500/20 text-sky-200 px-2.5 py-1 rounded-lg">درخواست‌های موجودی: {pendingStockRequests.toLocaleString('fa-IR')}</span>}
            </div>
          </div>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Artists */}
        <Link 
          href="/admin/artists" 
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all group flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <span className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
              👤
            </span>
            {pendingArtists > 0 && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                {pendingArtists.toLocaleString('fa-IR')} در انتظار
              </span>
            )}
          </div>
          <div className="mt-4">
            <span className="text-slate-500 text-xs font-bold">کل هنرمندان</span>
            <div className="text-2xl font-black text-slate-800 mt-1">
              {totalArtists.toLocaleString('fa-IR')}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 font-medium">
              <span>فعال: <strong className="text-emerald-600">{activeArtists.toLocaleString('fa-IR')}</strong></span>
              <span className="text-indigo-600 font-bold group-hover:underline">مدیریت ←</span>
            </div>
          </div>
        </Link>

        {/* Card 2: Products */}
        <Link 
          href="/admin/products" 
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all group flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <span className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
              📦
            </span>
            {pendingProducts > 0 && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                {pendingProducts.toLocaleString('fa-IR')} در انتظار
              </span>
            )}
          </div>
          <div className="mt-4">
            <span className="text-slate-500 text-xs font-bold">محصولات فعال</span>
            <div className="text-2xl font-black text-slate-800 mt-1">
              {totalApprovedProducts.toLocaleString('fa-IR')}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 font-medium">
              <span>ناموجود: <strong className={outOfStockProducts > 0 ? "text-rose-600" : "text-slate-600"}>{outOfStockProducts.toLocaleString('fa-IR')}</strong></span>
              <span className="text-emerald-600 font-bold group-hover:underline">مدیریت ←</span>
            </div>
          </div>
        </Link>

        {/* Card 3: Blog */}
        <Link 
          href="/admin/blog" 
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-purple-300 transition-all group flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <span className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
              ✍️
            </span>
            <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-full">
              بلاگ
            </span>
          </div>
          <div className="mt-4">
            <span className="text-slate-500 text-xs font-bold">مقالات وبلاگ</span>
            <div className="text-2xl font-black text-slate-800 mt-1">
              {totalArticles.toLocaleString('fa-IR')}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 font-medium">
              <span>منتشر شده: <strong className="text-purple-600">{publishedArticles.toLocaleString('fa-IR')}</strong></span>
              <span className="text-purple-600 font-bold group-hover:underline">نوشتن ←</span>
            </div>
          </div>
        </Link>

        {/* Card 4: Support */}
        <Link 
          href="/admin/support" 
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-rose-300 transition-all group flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <span className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
              🎧
            </span>
            {unresolvedSupportMessages > 0 && (
              <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
                {unresolvedSupportMessages.toLocaleString('fa-IR')} بی‌پاسخ
              </span>
            )}
          </div>
          <div className="mt-4">
            <span className="text-slate-500 text-xs font-bold">پیام‌های پشتیبانی</span>
            <div className="text-2xl font-black text-slate-800 mt-1">
              {totalSupportMessages.toLocaleString('fa-IR')}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 font-medium">
              <span>در انتظار: <strong className="text-rose-600">{unresolvedSupportMessages.toLocaleString('fa-IR')}</strong></span>
              <span className="text-rose-600 font-bold group-hover:underline">پاسخگویی ←</span>
            </div>
          </div>
        </Link>

        {/* Card 5: Stock Requests */}
        <Link 
          href="/admin/stock-requests" 
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-300 transition-all group flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <span className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
              🔔
            </span>
            {pendingStockRequests > 0 && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                {pendingStockRequests.toLocaleString('fa-IR')} متقاضی
              </span>
            )}
          </div>
          <div className="mt-4">
            <span className="text-slate-500 text-xs font-bold">اطلاع‌رسانی موجودی</span>
            <div className="text-2xl font-black text-slate-800 mt-1">
              {pendingStockRequests.toLocaleString('fa-IR')}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 font-medium">
              <span>درخواست‌های معوق</span>
              <span className="text-amber-600 font-bold group-hover:underline">مشاهده ←</span>
            </div>
          </div>
        </Link>

        {/* Card 6: Specialties */}
        <Link 
          href="/admin/specialties" 
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-teal-300 transition-all group flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <span className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
              🏷️
            </span>
            <span className="bg-teal-100 text-teal-800 text-[10px] font-black px-2 py-0.5 rounded-full">
              دسته‌بندی
            </span>
          </div>
          <div className="mt-4">
            <span className="text-slate-500 text-xs font-bold">تخصص‌های صنایع دستی</span>
            <div className="text-2xl font-black text-slate-800 mt-1">
              {totalSpecialties.toLocaleString('fa-IR')}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 font-medium">
              <span>پوشش دسته‌ها</span>
              <span className="text-teal-600 font-bold group-hover:underline">ویرایش ←</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Main Content Grid: Recent Pending Approvals & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Panel 1: Pending Artists */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-lg">
                  👥
                </span>
                <div>
                  <h3 className="font-black text-slate-800 text-lg">هنرمندان جدید در انتظار تایید</h3>
                  <p className="text-slate-400 text-xs mt-0.5">درخواست‌های عضویت جدید جهت احراز هویت</p>
                </div>
              </div>
              <Link 
                href="/admin/artists" 
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-xl transition-colors"
              >
                مشاهده همه
              </Link>
            </div>

            {recentPendingArtists.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <span className="text-3xl block mb-2">🎉</span>
                <p className="text-slate-600 font-bold text-sm">هیچ درخواستی در صف انتظار تایید هنرمند نیست!</p>
                <span className="text-slate-400 text-xs mt-1 block">تمام پرونده‌های هنرمندان بررسی شده‌اند.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentPendingArtists.map(artist => (
                  <div key={artist.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center text-slate-400">
                        {artist.user?.image ? (
                          <img src={artist.user.image} alt={artist.user.name || ''} className="w-full h-full object-cover" />
                        ) : (
                          <span>👤</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-800 truncate">
                          {artist.user?.name || 'هنرمند بدون نام'}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                          <span>شناسه #{artist.displayId}</span>
                          {artist.specialties.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="truncate">{artist.specialties[0].name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/admin/artists/${artist.id}/edit`}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-colors shrink-0"
                    >
                      بررسی مدارک
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
            <span>تعداد کل درخواست‌های تایید نشده: <strong className="text-slate-800">{pendingArtists.toLocaleString('fa-IR')}</strong></span>
            <Link href="/admin/artists/new" className="text-indigo-600 font-bold hover:underline">
              + ایجاد سریع هنرمند جدید
            </Link>
          </div>
        </div>

        {/* Panel 2: Pending Products */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg">
                  🎨
                </span>
                <div>
                  <h3 className="font-black text-slate-800 text-lg">محصولات نیازمند بررسی و تایید</h3>
                  <p className="text-slate-400 text-xs mt-0.5">آثار ثبت شده توسط هنرمندان در صف انتشار</p>
                </div>
              </div>
              <Link 
                href="/admin/products" 
                className="text-xs font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl transition-colors"
              >
                مشاهده همه
              </Link>
            </div>

            {recentPendingProducts.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <span className="text-3xl block mb-2">✨</span>
                <p className="text-slate-600 font-bold text-sm">هیچ محصولی در انتظار تایید وجود ندارد!</p>
                <span className="text-slate-400 text-xs mt-1 block">تمام آثار هنری در سایت منتشر و بررسی شده‌اند.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentPendingProducts.map(prod => (
                  <div key={prod.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center text-slate-400">
                        {prod.imageUrl ? (
                          <img src={prod.imageUrl} alt={prod.title} className="w-full h-full object-cover" />
                        ) : (
                          <span>🖼️</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-800 truncate">
                          {prod.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                          <span>اثر: {prod.artist?.user?.name || 'هنرمند'}</span>
                          <span>•</span>
                          <span>موجودی: {prod.stockQuantity}</span>
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/admin/products/${prod.id}/edit`}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-colors shrink-0"
                    >
                      بررسی و تایید
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
            <span>تعداد کل محصولات در صف: <strong className="text-slate-800">{pendingProducts.toLocaleString('fa-IR')}</strong></span>
            <Link href="/admin/products/new" className="text-emerald-600 font-bold hover:underline">
              + ثبت اثر جدید با هوش مصنوعی
            </Link>
          </div>
        </div>

        {/* Panel 3: Recent Unresolved Support Tickets */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-lg">
                🎧
              </span>
              <div>
                <h3 className="font-black text-slate-800 text-lg">آخرین تیکت‌ها و پیام‌های پشتیبانی در انتظار پاسخ</h3>
                <p className="text-slate-400 text-xs mt-0.5">پیام‌های ارسال شده توسط کاربران و خریداران</p>
              </div>
            </div>
            <Link 
              href="/admin/support" 
              className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 px-3.5 py-2 rounded-xl transition-colors"
            >
              مدیریت تمام پیام‌ها ({totalSupportMessages.toLocaleString('fa-IR')})
            </Link>
          </div>

          {recentSupportMessages.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <span className="text-3xl block mb-2">💚</span>
              <p className="text-slate-600 font-bold text-sm">هیچ تیکت پشتیبانی بدون پاسخی وجود ندارد!</p>
              <span className="text-slate-400 text-xs mt-1 block">تمامی درخواست‌های کاربران پاسخ داده شده‌اند.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentSupportMessages.map(msg => (
                <div key={msg.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex flex-col justify-between hover:border-rose-300 transition-colors">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-sm text-slate-800">{msg.name}</span>
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        نیازمند پاسخ
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mb-2 font-mono" dir="ltr">
                      {msg.contact}
                    </div>
                    <p className="text-slate-700 text-xs line-clamp-3 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100">
                      {msg.message}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex justify-between items-center text-xs">
                    <span className="text-slate-400 text-[11px]">
                      {new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short' }).format(new Date(msg.createdAt))}
                    </span>
                    <Link
                      href="/admin/support"
                      className="text-rose-600 font-bold hover:underline"
                    >
                      پاسخ ←
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
