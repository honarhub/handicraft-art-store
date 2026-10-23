'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import PreOrderManager, { PreOrderTier, DEFAULT_PREORDER_TIERS } from '@/app/components/PreOrderManager';
import CategoryHierarchySelector, { SpecialtyItem } from '@/app/components/CategoryHierarchySelector';

export default function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [images, setImages] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<SpecialtyItem[]>([]);
  const [price, setPrice] = useState('');
  const [shippingMode, setShippingMode] = useState<'ARTIST_DIRECT' | 'HONARHUB_WAREHOUSE'>('ARTIST_DIRECT');
  const [isPreOrderEnabled, setIsPreOrderEnabled] = useState(false);
  const [preOrderTiers, setPreOrderTiers] = useState<PreOrderTier[]>(DEFAULT_PREORDER_TIERS);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (images.length + files.length > 8) {
      alert('حداکثر می‌توانید ۸ تصویر برای محصول انتخاب کنید.');
      return;
    }

    const newImages: string[] = [];
    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      if (isImage && file.size > 8 * 1024 * 1024) {
        alert(`فایل ${file.name} بیشتر از ۸ مگابایت است.`);
        continue;
      }
      if (isVideo && file.size > 25 * 1024 * 1024) {
        alert(`فایل ${file.name} بیشتر از ۲۵ مگابایت است.`);
        continue;
      }
      try {
        const base64 = await fileToBase64(file);
        newImages.push(base64);
      } catch (err) {
        console.error('Error converting file', err);
      }
    }
    setImages(prev => [...prev, ...newImages]);
  };

  const makePrimary = (idx: number) => {
    if (idx === 0) return;
    setImages(prev => {
      const copy = [...prev];
      const [selected] = copy.splice(idx, 1);
      return [selected, ...copy];
    });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const persianToEnglish = (str: string) => {
      return str.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
                .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
    };
    const rawValue = persianToEnglish(e.target.value).replace(/\D/g, '');
    setPrice(rawValue);
  };
  const formattedPrice = price ? Number(price).toLocaleString('fa-IR') : '';

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        setShippingMode(data.shippingMode || 'ARTIST_DIRECT');
        setIsPreOrderEnabled(Boolean(data.isPreOrderEnabled));
        if (data.preOrderTiers) {
          const parsed = typeof data.preOrderTiers === 'string' ? JSON.parse(data.preOrderTiers) : data.preOrderTiers;
          if (parsed) {
            setPreOrderTiers(parsed);
          }
        }

        const loadedImages: string[] = [];
        if (data.mediaUrls && Array.isArray(data.mediaUrls) && data.mediaUrls.length > 0) {
          loadedImages.push(...data.mediaUrls);
        } else if (data.imageUrl) {
          loadedImages.push(data.imageUrl);
        }
        setImages(loadedImages);
        if (data.specialties) {
          setSpecialties(data.specialties);
        }

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
    if (images.length === 0) {
      alert('حداقل یک تصویر برای محصول الزامی است.');
      return;
    }
    setSubmitLoading(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateDetails',
          title: product.title,
          description: product.description,
          stockQuantity: parseInt(product.stockQuantity) >= 0 ? parseInt(product.stockQuantity) : 0,
          isUnique: product.isUnique,
          shippingMode,
          isPreOrderEnabled,
          preOrderTiers,
          price,
          images,
          specialties: specialties.map(s => s.id)
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
          <h2 className="text-2xl font-black text-slate-800">ویرایش محصول (پنل مدیریت)</h2>
          <p className="text-slate-500 mt-1 text-sm">شناسه محصول: {id}</p>
        </div>
        <button onClick={() => router.push('/admin/products')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm transition-colors">
          بازگشت به لیست
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Gallery & Image Uploader */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-800 text-sm md:text-base flex items-center gap-2">
                <span>🖼️ تصاویر و رسانه‌های محصول</span>
                <span className="text-xs font-normal text-slate-400">({images.length} از ۸ تصویر)</span>
              </h4>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              تصویر اول به عنوان تصویر اصلی (کاور) محصول در فروشگاه نمایش داده می‌شود. با کلیک بر روی هر عکس می‌توانید آن را به عنوان تصویر اصلی برگزینید یا با دکمه × آن را حذف فرمایید.
            </p>

            <div className="flex flex-wrap gap-4 items-center">
              {images.map((img, idx) => (
                <div 
                  key={idx} 
                  className={`relative w-28 h-28 rounded-2xl overflow-hidden border-2 group transition-all shadow-xs ${
                    idx === 0 ? 'border-purple-600 ring-2 ring-purple-600/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {img.startsWith('data:video') || img.endsWith('.mp4') ? (
                    <video src={img} className="w-full h-full object-cover" />
                  ) : (
                    <img src={img} alt={`تصویر محصول ${idx + 1}`} className="w-full h-full object-cover" />
                  )}

                  {/* Primary Badge */}
                  {idx === 0 && (
                    <span className="absolute bottom-1.5 right-1.5 bg-purple-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
                      کاور اصلی
                    </span>
                  )}

                  {/* Set Primary Button (for non-primary images) */}
                  {idx !== 0 && (
                    <button
                      type="button"
                      onClick={() => makePrimary(idx)}
                      className="absolute bottom-1.5 right-1.5 bg-slate-900/80 hover:bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="انتخاب به عنوان تصویر اصلی"
                    >
                      اصلی کردن
                    </button>
                  )}

                  {/* Remove Button */}
                  <button 
                    type="button"
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    className="absolute top-1.5 left-1.5 bg-rose-500 hover:bg-rose-600 text-white w-6 h-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
                    title="حذف تصویر"
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Upload Button */}
              {images.length < 8 && (
                <label className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-300 hover:border-purple-500 hover:bg-purple-50/50 flex flex-col items-center justify-center text-slate-400 hover:text-purple-600 cursor-pointer transition-all group">
                  <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleManualUpload} />
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1 group-hover:scale-110 transition-transform"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  <span className="text-[11px] font-bold">+ افزودن عکس</span>
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">عنوان محصول</label>
            <input type="text" value={product.title || ''} onChange={e => setProduct({...product, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-purple-500 outline-none" required />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">توضیحات</label>
            <textarea value={product.description || ''} onChange={e => setProduct({...product, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-purple-500 outline-none" rows={4} required />
          </div>

          {/* Art Categories and Specialties Hierarchy Selector */}
          <CategoryHierarchySelector
            selectedSpecialties={specialties}
            onChange={setSpecialties}
            label="دسته‌بندی و سبک‌های هنری اثر"
            helperText="دسته‌بندی والد و تخصص‌های مرتبط با این اثر را انتخاب فرمایید."
          />

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
                <span className="text-sm font-bold text-slate-700">این محصول کاملاً منحصر‌به‌فرد است (تک‌نسخه)</span>
              </label>
            </div>
          </div>

          {/* Shipping Mode Selector */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <label className="block text-sm font-bold text-slate-800 mb-2">نحوه ارسال سفارش</label>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              مشخص کنید ارسال این کالا مستقیماً توسط کارگاه هنرمند انجام می‌شود یا کالا در انبار مرکزی هنرهاب قرار دارد:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShippingMode('ARTIST_DIRECT')}
                className={`p-4 rounded-xl border-2 text-right transition-all flex items-start gap-3 cursor-pointer ${
                  shippingMode === 'ARTIST_DIRECT'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <span className="text-xl">🎨</span>
                <div>
                  <div className="font-bold text-sm">ارسال مستقیم از کارگاه هنرمند</div>
                  <div className="text-xs text-slate-500 mt-1">محصول در کارگاه هنرمند نگهداری شده و با سفارش مشتری ارسال می‌گردد.</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setShippingMode('HONARHUB_WAREHOUSE')}
                className={`p-4 rounded-xl border-2 text-right transition-all flex items-start gap-3 cursor-pointer ${
                  shippingMode === 'HONARHUB_WAREHOUSE'
                    ? 'border-blue-500 bg-blue-50/50 text-blue-950 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <span className="text-xl">📦</span>
                <div>
                  <div className="font-bold text-sm">ارسال توسط هنرهاب (انبار مرکزی)</div>
                  <div className="text-xs text-slate-500 mt-1">محصول در انبار مرکزی هنرهاب موجود است و ارسال سریع دارد.</div>
                </div>
              </button>
            </div>
          </div>

          {/* Pre-Order Manager */}
          <PreOrderManager
            basePrice={Number(price) || 0}
            isPreOrderEnabled={isPreOrderEnabled}
            setIsPreOrderEnabled={setIsPreOrderEnabled}
            tiers={preOrderTiers}
            setTiers={setPreOrderTiers}
          />

          <button type="submit" disabled={submitLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-purple-200 transition-all disabled:opacity-50 mt-4 cursor-pointer">
            {submitLoading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
          </button>
        </form>
      </div>
    </div>
  );
}
