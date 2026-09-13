import React from 'react';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export default async function ArtistDashboardPage() {
  const cookieStore = await cookies();
  const artistId = cookieStore.get('artistId')?.value;

  const productsCount = await prisma.product.count({
    where: { artistId, status: 'APPROVED' }
  });

  const pendingCount = await prisma.product.count({
    where: { artistId, status: 'PENDING' }
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h2 className="text-2xl font-black text-slate-800 mb-6">پیشخوان مدیریت آثار</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-2xl">📦</div>
          <div>
            <p className="text-sm text-slate-500 font-medium">آثار تایید شده شما</p>
            <p className="text-2xl font-black text-slate-800">{productsCount}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-2xl">⏳</div>
          <div>
            <p className="text-sm text-slate-500 font-medium">در انتظار تایید ادمین</p>
            <p className="text-2xl font-black text-slate-800">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-2xl">💰</div>
          <div>
            <p className="text-sm text-slate-500 font-medium">مجموع فروش (آزمایشی)</p>
            <p className="text-2xl font-black text-slate-800">۰ <span className="text-sm font-normal text-slate-400">تومان</span></p>
          </div>
        </div>
      </div>
      
      <div className="bg-teal-50 border border-teal-100 rounded-2xl p-6">
        <h3 className="font-bold text-teal-800 mb-2">اطلاعیه مهم سیستم</h3>
        <p className="text-teal-700 text-sm leading-relaxed">
          هنرمند گرامی، تمامی محصولاتی که شما ثبت می‌کنید یا تغییراتی که در پروفایل خود اعمال می‌کنید، ابتدا در وضعیت «در انتظار تایید» قرار می‌گیرند و پس از بررسی توسط تیم داوری و ادمین‌های پلتفرم، در سایت منتشر خواهند شد. در صورت وجود مشکل، دلیل رد شدن به شما گزارش می‌شود.
        </p>
      </div>
    </div>
  );
}
