import React from 'react';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminStockRequestsPage() {
  const requests = await prisma.stockNotification.findMany({
    orderBy: { createdAt: 'desc' },
    include: { product: { include: { artist: { include: { user: true } } } } }
  });

  return (
    <div className="p-8">
      <h2 className="text-2xl font-black text-slate-800 mb-6">درخواست‌های موجودی کالا</h2>
      
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-right">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">مشتری</th>
              <th className="px-6 py-4">محصول</th>
              <th className="px-6 py-4">هنرمند</th>
              <th className="px-6 py-4">وضعیت موجودی فعلی</th>
              <th className="px-6 py-4">تاریخ ثبت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">درخواستی یافت نشد</td>
              </tr>
            ) : (
              requests.map(req => (
                <tr key={req.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-slate-700" dir="ltr">{req.contact}</td>
                  <td className="px-6 py-4">
                    <a href={`/admin/products/${req.product.id}/edit`} className="text-emerald-600 font-bold hover:underline">
                      {req.product.title}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{req.product.artist.user.name || 'بدون نام'}</td>
                  <td className="px-6 py-4">
                    {req.product.stockQuantity > 0 ? (
                      <span className="text-emerald-600 font-bold">موجود شد ({req.product.stockQuantity})</span>
                    ) : (
                      <span className="text-red-500 font-bold">ناموجود</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500" dir="ltr">
                    {new Date(req.createdAt).toLocaleDateString('fa-IR')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
