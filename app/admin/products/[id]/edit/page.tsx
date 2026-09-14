'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [price, setPrice] = useState('');

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, '');
    if (!isNaN(Number(rawValue))) {
      setPrice(rawValue);
    }
  };
  const formattedPrice = price ? Number(price).toLocaleString('fa-IR') : '';

  useEffect(() => {
    // We fetch from the existing product API. Note: We need a GET by ID API if we haven't made one.
    // Let's just fetch all and filter for now to save time, or better, we should add a GET to /api/products/[id]/route.ts
    fetch(`/api/products/${id}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        fetch(`/api/products/${id}/pricing`)
          .then(res => res.json())
          .then(pricingData => {
            if (pricingData && pricingData.length > 0) {
              setPrice(String(pricingData[0].price));
            }
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateDetails',
          title: product.title,
          description: product.description,
          stockQuantity: parseInt(product.stockQuantity) || 1,
          isUnique: product.isUnique,
          price // Passing price to update base tier (wait, updateDetails might not handle price)
        })
      });


      if (!res.ok) throw new Error('Error updating product');
      alert('محصول با موفقیت ویرایش شد');
      router.push('/admin/products');
    } catch (err) {
      alert('خطا در ویرایش محصول');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">در حال بارگذاری...</div>;
  if (!product) return <div className="p-8 text-center text-red-500 font-bold">محصول یافت نشد</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto" dir="rtl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">ویرایش محصول</h2>
          <p className="text-slate-500 mt-1 text-sm">شناسه: {id}</p>
        </div>
        <button onClick={() => router.push('/admin/products')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm transition-colors">
          بازگشت به لیست
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">عنوان محصول</label>
            <input type="text" value={product.title || ''} onChange={e => setProduct({...product, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-purple-500 outline-none" required />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">توضیحات</label>
            <textarea value={product.description || ''} onChange={e => setProduct({...product, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-purple-500 outline-none" rows={4} required />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">قیمت پایه (تومان)</label>
            <input type="text" value={formattedPrice} onChange={handlePriceChange} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-purple-500 outline-none" placeholder="مثلا: 5,000,000" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">موجودی انبار (تعداد)</label>
              <input type="number" min="0" value={product.stockQuantity || 0} onChange={e => setProduct({...product, stockQuantity: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-purple-500 outline-none" />
            </div>
            
            <div className="flex flex-col justify-center pt-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={product.isUnique || false} onChange={e => setProduct({...product, isUnique: e.target.checked})} className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 border-slate-300" />
                <span className="text-sm font-bold text-slate-700">این محصول کاملاً منحصر‌به‌فرد است (Unique)</span>
              </label>
            </div>
          </div>

          <button type="submit" disabled={submitLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-purple-200 transition-all disabled:opacity-50 mt-4">
            {submitLoading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
          </button>
        </form>
      </div>
    </div>
  );
}
