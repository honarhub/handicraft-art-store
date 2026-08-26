'use client';

import React, { useState } from 'react';

// یک ماک از محصولاتی که منتظر تایید ادمین هستند
const mockPendingProducts = [
  {
    id: 'prod_1',
    title: 'جا فندکی ریک و مورتی',
    artist: 'علی رضایی',
    price: 150000,
    status: 'PENDING',
    date: '2 ساعت پیش',
  },
  {
    id: 'prod_2',
    title: 'بشقاب دیوارکوب میناکاری',
    artist: 'مریم سادات',
    price: 850000,
    status: 'PENDING',
    date: '5 ساعت پیش',
  }
];

export default function MasterAdminDashboard() {
  const [products, setProducts] = useState(mockPendingProducts);

  const handleAction = (id: string, action: 'approve' | 'reject') => {
    const actionText = action === 'approve' ? 'تایید و منتشر' : 'رد کردن';
    const confirm = window.confirm(`آیا از ${actionText} این محصول اطمینان دارید؟`);
    
    if (confirm) {
      setProducts(products.filter(p => p.id !== id));
      alert(`عملیات "${actionText}" با موفقیت روی دیتابیس اعمال شد.`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-gray-800">داشبورد ادمین کل (Master Admin)</h2>
        <p className="text-gray-500 mt-2">محصولاتی که توسط هنرمندان ثبت شده‌اند و در انتظار تایید شما برای انتشار عمومی هستند.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-700">لیست بررسی (Pending Review)</h3>
          <span className="bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full">
            {products.length} مورد جدید
          </span>
        </div>
        
        {products.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            هیچ محصولی در انتظار بررسی نیست. خسته نباشید!
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {products.map((product) => (
              <div key={product.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                <div>
                  <h4 className="font-bold text-lg text-gray-800">{product.title}</h4>
                  <div className="text-sm text-gray-500 mt-1 flex gap-4">
                    <span>هنرمند: <strong>{product.artist}</strong></span>
                    <span>مبلغ پیشنهادی: <strong>{product.price.toLocaleString()} تومان</strong></span>
                    <span>ثبت شده در: {product.date}</span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleAction(product.id, 'reject')}
                    className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 font-medium rounded-lg text-sm transition-colors"
                  >
                    رد / نیاز به اصلاح
                  </button>
                  <button 
                    onClick={() => handleAction(product.id, 'approve')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm transition-colors"
                  >
                    تایید و انتشار عمومی
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6 text-blue-800 text-sm">
        <strong>نکته امنیتی (Soft Delete):</strong> اگر در آینده نیاز به حذف محصولی داشتید، محصول به طور کامل پاک نمی‌شود (مگر با تایید دیتابیس ادمین). فیلد `deletedAt` پر می‌شود و برای همیشه در بایگانی سیستم باقی می‌ماند تا جلوی خطاهای انسانی گرفته شود.
      </div>
    </div>
  );
}
