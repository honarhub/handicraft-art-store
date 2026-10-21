import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ArtistProductFeedbackButton from './ArtistProductFeedbackButton';

export default async function ArtistProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/artist-panel/login');
  
  const artist = await prisma.artistProfile.findUnique({
    where: { userId: session.user.id }
  });
  const artistId = artist?.id;
  
  if (!artistId) redirect('/artist-panel/login');

  const products = await prisma.product.findMany({
    where: { artistId },
    include: { specialties: true, pricingTiers: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800">محصولات من</h2>
          <p className="text-slate-500 mt-1 text-sm">لیست تمامی آثار ثبت شده شما در پلتفرم</p>
        </div>
        <a href="/artist-panel/products/new" className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-colors">
          ثبت اثر جدید
        </a>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-xs">
              <tr>
                <th className="px-6 py-4">کد اثر</th>
                <th className="px-6 py-4">تصویر</th>
                <th className="px-6 py-4">عنوان اثر</th>
                <th className="px-6 py-4">قیمت (تومان)</th>
                <th className="px-6 py-4 text-center">پیش‌سفارش</th>
                <th className="px-6 py-4 text-center">موجودی</th>
                <th className="px-6 py-4 text-center">وضعیت انتشار</th>
                <th className="px-6 py-4 text-center">پیام ادمین</th>
                <th className="px-6 py-4 text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500 font-medium">شما هنوز هیچ اثری ثبت نکرده‌اید.</td>
                </tr>
              ) : products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-black text-slate-800 text-lg">#{product.displayId}</span>
                      <span className="text-xs text-slate-400 font-mono tracking-tighter" title={product.id}>{product.id.substring(0,8)}...</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <img src={product.imageUrl} alt={product.title} className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200" />
                  </td>
                  <td className="px-6 py-4">
                    <a 
                      href={`/product/${product.id}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="font-bold text-slate-800 hover:text-teal-600 transition-colors inline-flex items-center gap-1.5 group"
                      title="مشاهده صفحه محصول در سایت"
                    >
                      <span>{product.title}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-teal-600 transition-colors"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </a>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {product.pricingTiers[0]?.price > 0 ? product.pricingTiers[0].price.toLocaleString() : 'توافقی / نامشخص'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {product.isPreOrderEnabled ? (
                      <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-bold">
                        ✓ فعال
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">ندارد</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-700">
                    {product.stockQuantity ?? 0}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {(product.pendingEdits || product.status === 'PENDING') ? (
                      <span className="bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                        در انتظار تایید ادمین
                      </span>
                    ) : product.status === 'APPROVED' ? (
                      <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-bold">تایید شده</span>
                    ) : (
                      <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-full text-xs font-bold">رد شده</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <ArtistProductFeedbackButton
                      productId={product.id}
                      productTitle={product.title}
                      adminFeedback={product.adminFeedback}
                      adminFeedbackHistory={product.adminFeedbackHistory}
                      adminFeedbackRead={product.adminFeedbackRead}
                      status={product.status}
                    />
                  </td>
                  <td className="px-6 py-4 text-left">
                    <a href={`/artist-panel/products/${product.id}/edit`} title="ویرایش" className="inline-flex text-blue-600 hover:bg-blue-50 w-8 h-8 items-center justify-center rounded-lg transition-colors border border-transparent hover:border-blue-100">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
