'use client';

import React, { useState, useEffect } from 'react';
import SpecialtyTagInput, { Specialty } from '@/app/components/SpecialtyTagInput';
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
  const [seoMetaTitle, setSeoMetaTitle] = useState('');
  const [seoMetaDesc, setSeoMetaDesc] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [images, setImages] = useState<string[]>([]); // Array of base64 strings or URLs

  // Helper for price formatting
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, '');
    if (!isNaN(Number(rawValue))) {
      setPrice(rawValue);
    }
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
          .catch(() => {
             // It's okay if it fails, maybe it has no pricing tiers yet
          })
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
          specialties: specialties.map(s => s.id),
          seoMetaTitle,
          seoMetaDesc,
          seoKeywords,
          images: images.filter(img => img.startsWith('data:')) // Only send new uploads
        })
      });

      if (!res.ok) throw new Error('Error updating product');
      
      alert('تغییرات با موفقیت ثبت شد و اثر در انتظار تایید مدیریت قرار گرفت.');
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
          <p className="text-slate-500 mt-1 text-sm">با هر ویرایش، وضعیت اثر مجدداً به "در انتظار تایید" تغییر می‌کند.</p>
        </div>
        <button onClick={() => router.back()} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm transition-colors">
          انصراف و بازگشت
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="md:col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-slate-800 mb-2">گالری محصول (حداکثر ۵ فایل)</h4>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                شما می‌توانید تا ۵ عکس (حداکثر ۵ مگابایت) یا فیلم (حداکثر ۲۰ مگابایت) برای محصول خود آپلود کنید. اولین عکس به عنوان کاور نمایش داده می‌شود.
                توجه کنید که آثار دست‌ساز معمولاً تک‌نسخه هستند بنابراین موجودی به صورت خودکار ۱ در نظر گرفته می‌شود.
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

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">عنوان اثر <span className="text-red-500">*</span></label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-teal-500 outline-none transition-all" required />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">قیمت پایه (تومان) <span className="text-red-500">*</span></label>
              <input type="text" value={formattedPrice} onChange={handlePriceChange} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-teal-500 outline-none" placeholder="مثلا: 5,000,000" required />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">تخصص‌های مرتبط</label>
              <SpecialtyTagInput selectedSpecialties={specialties} onChange={setSpecialties} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">توضیحات اثر</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-teal-500 outline-none leading-relaxed" rows={5}></textarea>
            </div>

            <div className="md:col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4 relative">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-black text-slate-800 flex items-center gap-2">
                    <span className="text-teal-600">🎯</span> سئو (SEO)
                  </h4>
                  <p className="text-xs text-slate-500 mt-2 max-w-xl leading-relaxed">
                    این مقادیر به بهتر دیده شدن محصول شما در گوگل کمک می‌کند و اختیاری است. در صورتی که دانشی در این زمینه ندارید، روی دکمه هوش مصنوعی کلیک کنید تا متون مناسب برای شما تولید شود.
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
            <button type="submit" disabled={submitLoading} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-teal-200 transition-all disabled:opacity-50">
              {submitLoading ? 'در حال ثبت...' : 'ثبت تغییرات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
