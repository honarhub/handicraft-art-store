'use client';

import React, { useState, useEffect } from 'react';

interface SupportMsg {
  id: string;
  name: string;
  contact: string;
  message: string;
  attachmentUrl: string | null;
  status: 'PENDING' | 'RESOLVED';
  createdAt: string;
  product?: { id: string; title: string } | null;
}

export default function AdminSupportPage() {
  const [messages, setMessages] = useState<SupportMsg[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMessages = async () => {
    try {
      const res = await fetch('/api/support', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: 'PENDING' | 'RESOLVED') => {
    const newStatus = currentStatus === 'PENDING' ? 'RESOLVED' : 'PENDING';
    try {
      const res = await fetch('/api/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
        // بروزرسانی برخط تعداد در سایدبار
        window.dispatchEvent(new CustomEvent('admin-counts-update'));
      }
    } catch {
      alert('خطا در تغییر وضعیت تیکت');
    }
  };

  // مرتب‌سازی: تیکت‌های در انتظار بررسی حتما در بالا بیایند
  const sortedMessages = [...messages].sort((a, b) => {
    if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
    if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800">پشتیبانی و پیام‌های کاربران</h2>
          <p className="text-slate-500 text-sm mt-1">مدیریت و پاسخگویی به پیام‌های ارسالی از بخش پشتیبانی سایت</p>
        </div>
      </div>
      
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-right">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">وضعیت</th>
              <th className="px-6 py-4">فرستنده</th>
              <th className="px-6 py-4">تماس</th>
              <th className="px-6 py-4">پیام</th>
              <th className="px-6 py-4">پیوست</th>
              <th className="px-6 py-4">محصول مرتبط</th>
              <th className="px-6 py-4">تاریخ</th>
              <th className="px-6 py-4 text-left">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-400">در حال بارگذاری...</td>
              </tr>
            ) : sortedMessages.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-400">پیامی یافت نشد</td>
              </tr>
            ) : (
              sortedMessages.map(msg => (
                <tr key={msg.id} className={`transition-colors ${msg.status === 'PENDING' ? 'bg-amber-50/40 hover:bg-amber-100/60 border-r-4 border-r-amber-500' : 'hover:bg-slate-50'}`}>
                  <td className="px-6 py-4">
                    {msg.status === 'PENDING' ? (
                      <span className="bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                        در انتظار رسیدگی
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                        رسیدگی شده
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">{msg.name}</td>
                  <td className="px-6 py-4 text-slate-600 font-mono" dir="ltr">{msg.contact}</td>
                  <td className="px-6 py-4 text-slate-600 max-w-xs" title={msg.message}>
                    <div className="whitespace-pre-wrap text-xs leading-relaxed max-h-24 overflow-y-auto">
                      {msg.message}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {msg.attachmentUrl ? (
                      <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className="text-emerald-600 font-bold hover:underline">مشاهده فایل</a>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {msg.product ? (
                      <a href={`/product/${msg.product.id}`} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">{msg.product.title}</a>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs" dir="ltr">
                    {new Date(msg.createdAt).toLocaleDateString('fa-IR')}
                  </td>
                  <td className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleToggleStatus(msg.id, msg.status)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                        msg.status === 'PENDING'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {msg.status === 'PENDING' ? 'علامت‌گذاری به عنوان رسیدگی‌شده' : 'بازگرداندن به در انتظار'}
                    </button>
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
