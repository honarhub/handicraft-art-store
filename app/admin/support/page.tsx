import React from 'react';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminSupportPage() {
  const messages = await prisma.supportMessage.findMany({
    orderBy: { createdAt: 'desc' },
    include: { product: true }
  });

  return (
    <div className="p-8">
      <h2 className="text-2xl font-black text-slate-800 mb-6">پشتیبانی و پیام‌های کاربران</h2>
      
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-right">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">فرستنده</th>
              <th className="px-6 py-4">تماس</th>
              <th className="px-6 py-4">پیام</th>
              <th className="px-6 py-4">پیوست</th>
              <th className="px-6 py-4">محصول مرتبط</th>
              <th className="px-6 py-4">تاریخ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {messages.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">پیامی یافت نشد</td>
              </tr>
            ) : (
              messages.map(msg => (
                <tr key={msg.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-slate-700">{msg.name}</td>
                  <td className="px-6 py-4 text-slate-600" dir="ltr">{msg.contact}</td>
                  <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={msg.message}>{msg.message}</td>
                  <td className="px-6 py-4">
                    {msg.attachmentUrl ? (
                      <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className="text-emerald-600 font-bold hover:underline">مشاهده فایل</a>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {msg.product ? (
                      <a href={`/product/${msg.product.id}`} className="text-emerald-600 hover:underline">{msg.product.title}</a>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 text-slate-500" dir="ltr">
                    {new Date(msg.createdAt).toLocaleDateString('fa-IR')}
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
