'use client';

import React, { useState, useEffect } from 'react';
import SpecialtyTagInput, { Specialty } from '@/app/components/SpecialtyTagInput';
import PreOrderManager, { PreOrderTier, DEFAULT_PREORDER_TIERS } from '@/app/components/PreOrderManager';
import { useRouter, useParams } from 'next/navigation';

export default function ArtistEditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  // Data States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [shippingMode, setShippingMode] = useState<'ARTIST_DIRECT' | 'HONARHUB_WAREHOUSE'>('ARTIST_DIRECT');
  const [isPreOrderEnabled, setIsPreOrderEnabled] = useState(false);
  const [preOrderTiers, setPreOrderTiers] = useState<PreOrderTier[]>(DEFAULT_PREORDER_TIERS);
  const [seoMetaTitle, setSeoMetaTitle] = useState('');
  const [seoMetaDesc, setSeoMetaDesc] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [images, setImages] = useState<string[]>([]); // Array of base64 strings or URLs

  // Helper for price formatting
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const persianToEnglish = (str: string) => {
      return str.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
                .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
    };
    const rawValue = persianToEnglish(e.target.value).replace(/\D/g, '');
    setPrice(rawValue);
  };
  const formattedPrice = price ? Number(price).toLocaleString('fa-IR') : '';

  // UI States
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [seoLoading, setSeoLoading] = useState(false);

  useEffect(() => {
    // Load existing product
    fetch(`/api/products/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Product not found');
        return res.json();
      })
      .then(data => {
        setTitle(data.title || '');
        setDescription(data.description || '');
        setSeoMetaTitle(data.seoMetaTitle || '');
        setSeoMetaDesc(data.seoMetaDesc || '');
        setSeoKeywords(data.seoKeywords || '');
        setShippingMode(data.shippingMode || 'ARTIST_DIRECT');
        setIsPreOrderEnabled(Boolean(data.isPreOrderEnabled));
        if (data.preOrderTiers) {
          const parsed = typeof data.preOrderTiers === 'string' ? JSON.parse(data.preOrderTiers) : data.preOrderTiers;
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPreOrderTiers(parsed);
          }
        }

        if (data.mediaUrls && data.mediaUrls.length > 0) {
          setImages(data.mediaUrls);
        } else if (data.imageUrl) {
          setImages([data.imageUrl]);
        }
        if (data.specialties) setSpecialties(data.specialties);
        
        // Fetch pricing tiers to get price
        fetch(`/api/products/${id}/pricing`)
          .then(res => res.json())
          .then(pricingData => {
            if (pricingData && pricingData.length > 0) {
              setPrice(String(pricingData[0].price));
            }
          })
          .catch(() => {})
          .finally(() => {
            setLoading(false);
          });
      })
      .catch(err => {
        alert('خطا در بارگذاری اطلاعات اثر');
        router.push('/artist-panel/products');
      });
  }, [id, router]);

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

    if (images.length + files.length > 5) {
      alert('حداکثر می‌توانید ۵ فایل انتخاب کنید.');
      return;
    }

    const newImages: string[] = [];
    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      if (isImage && file.size > 5 * 1024 * 1024) {
        alert(`فایل ${file.name} بیشتر از ۵ مگابایت است.`);
        continue;
      }
      if (isVideo && file.size > 20 * 1024 * 1024) {
        alert(`فایل ${file.name} بیشتر از ۲۰ مگابایت است.`);
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

  const generateSeo = async () => {
    if (!title) {
      alert('ابتدا عنوان محصول را وارد کنید.');
      return;
    }
    setSeoLoading(true);
    try {
      const res = await fetch('/api/ai/generate-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          specialties: specialties.map(s => s.name).join(', ')
        })
      });
      if (!res.ok) throw new Error('خطا');
      const data = await res.json();
      setSeoMetaTitle(data.seoMetaTitle || '');
      setSeoMetaDesc(data.seoMetaDesc || '');
      setSeoKeywords(data.seoKeywords || '');
    } catch (error) {
      alert('تولید سئو با مشکل مواجه شد.');
    } finally {
      setSeoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSubmitLoading(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'artistEdit',
          title,
          description,
          price,
          shippingMode,
          isPreOrderEnabled,
          preOrderTiers,
          specialties: specialties.map(s => s.id),
          seoMetaTitle,
          seoMetaDesc,
          seoKeywords,
          images // Send all images (existing URLs + new base64 uploads)
        })
      });

      if (!res.ok) throw new Error('Error updating product');
      
      const resData = await res.json();
      alert(resData.message || 'تغییرات با موفقیت ثبت شد و در انتظار تایید مدیریت قرار گرفت.');
      router.push('/artist-panel/products');
    } catch (error) {
      alert('خطا در ثبت تغییرات');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500 font-bold">در حال بارگذاری اطلاعات...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto" dir="rtl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">ویرایش اثر</h2>
          <p className="text-slate-500 mt-1 text-sm">تغییرات شما پس از تایید مدیریت در سایت اعمال خواهد شد و محصول لایو قطع نخواهد شد.</p>
        </div>
        <button onClick={() => router.back()} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm transition-colors">
          انصراف و بازگشت
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Gallery */}
            <div className="md:col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-slate-800 mb-2">گالری محصول (حداکثر ۵ فایل)</h4>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                شما می‌توانید تا ۵ عکس یا فیلم برای محصول خود قرار دهید. عکس‌های موجود حفظ می‌شوند و می‌توانید عکس جدید اضافه فرمایید.
              </p>
              <div className="flex flex-wrap gap-4 items-center">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 group">
                    {img.startsWith('data:video') || img.endsWith('.mp4') ? (
                      <video src={img} className="w-full h-full object-cover" />
                    ) : (
                      <img src={img} className="w-full h-full object-cover" />
                    )}
                    <button 
                      type="button"
                      onClick={() => setImages(images.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-teal-600 hover:border-teal-400 hover:bg-teal-50 cursor-pointer transition-all">
                    <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleManualUpload} />
                    <span className="text-3xl">+</span>
                  </label>
                )}
              </div>
            </div>

            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">عنوان اثر <span className="text-red-500">*</span></label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-teal-500 outline-none transition-all" required />
            </div>

            {/* Base Price */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">قیمت پایه اثر (تومان) <span className="text-red-500">*</span></label>
              <input type="text" value={formattedPrice} onChange={handlePriceChange} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-teal-500 outline-none" placeholder="مثلا: 5,000,000" required />
            </div>

            {/* Shipping Mode Selector */}
            <div className="md:col-span-2 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <label className="block text-sm font-bold text-slate-800 mb-2">نحوه ارسال سفارش</label>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                مشخص کنید ارسال این کالا مستقیماً توسط کارگاه شما انجام می‌شود یا کالا در انبار مرکزی هنرهاب قرار دارد:
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
                    <div className="text-xs text-slate-500 mt-1">محصول در کارگاه شماست و پس از ثبت سفارش توسط خودتان ارسال می‌گردد.</div>
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
                    <div className="text-xs text-slate-500 mt-1">محصول قبلاً به انبار هنرهاب تحویل داده شده و ارسال فوری توسط هنرهاب انجام می‌شود.</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Pre-Order Manager */}
            <div className="md:col-span-2">
              <PreOrderManager
                basePrice={Number(price) || 0}
                isPreOrderEnabled={isPreOrderEnabled}
                setIsPreOrderEnabled={setIsPreOrderEnabled}
                tiers={preOrderTiers}
                setTiers={setPreOrderTiers}
              />
            </div>

            {/* Specialties */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">تخصص‌ها و سبک‌های دسته‌بندی</label>
              <SpecialtyTagInput selectedSpecialties={specialties} onChange={setSpecialties} />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">توضیحات اثر</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-teal-500 outline-none leading-relaxed" rows={5}></textarea>
            </div>

            {/* SEO */}
            <div className="md:col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4 relative">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-black text-slate-800 flex items-center gap-2">
                    <span className="text-teal-600">🎯</span> سئو (SEO)
                  </h4>
                  <p className="text-xs text-slate-500 mt-2 max-w-xl leading-relaxed">
                    این مقادیر به بهتر دیده شدن محصول شما در گوگل کمک می‌کند و اختیاری است.
                  </p>
                </div>
                <button 
                  type="button" 
                  onClick={generateSeo}
                  disabled={seoLoading || !title}
                  className="bg-teal-100 hover:bg-teal-200 text-teal-700 font-bold px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {seoLoading ? 'در حال تولید...' : '✨ تولید با هوش مصنوعی'}
                </button>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">SEO Title</label>
                <input type="text" value={seoMetaTitle} onChange={e => setSeoMetaTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">SEO Description</label>
                <input type="text" value={seoMetaDesc} onChange={e => setSeoMetaDesc(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">SEO Keywords</label>
                <input type="text" value={seoKeywords} onChange={e => setSeoKeywords(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm outline-none" />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex gap-4">
            <button type="submit" disabled={submitLoading} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-teal-200 transition-all disabled:opacity-50 cursor-pointer">
              {submitLoading ? 'در حال ثبت...' : 'ثبت تغییرات و ارسال برای تایید'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
