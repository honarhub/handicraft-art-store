import React from 'react';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export default async function ArtistProductsPage() {
  const cookieStore = await cookies();
  const artistId = cookieStore.get('artistId')?.value;

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
                <th className="px-6 py-4">تصویر</th>
                <th className="px-6 py-4">عنوان اثر</th>
                <th className="px-6 py-4">قیمت (تومان)</th>
                <th className="px-6 py-4 text-center">وضعیت انتشار</th>
                <th className="px-6 py-4">بازخورد ادمین</th>
                <th className="px-6 py-4 text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 font-medium">شما هنوز هیچ اثری ثبت نکرده‌اید.</td>
                </tr>
              ) : products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <img src={product.imageUrl} alt={product.title} className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200" />
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">{product.title}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {product.pricingTiers[0]?.price > 0 ? product.pricingTiers[0].price.toLocaleString() : 'توافقی / نامشخص'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {product.status === 'PENDING' && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">در انتظار تایید</span>}
                    {product.status === 'APPROVED' && <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-bold">تایید شده</span>}
                    {product.status === 'REJECTED' && <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold">رد شده</span>}
                  </td>
                  <td className="px-6 py-4 text-xs text-red-600 font-bold">
                    {product.status === 'REJECTED' && product.adminFeedback ? product.adminFeedback : '-'}
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
