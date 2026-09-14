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
  const [image, setImage] = useState<string | null>(null);

  // UI States
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

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
        setImage(data.imageUrl);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      setImage(base64);
    } catch (error) {
      alert('خطا در پردازش تصویر');
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
          image: image?.startsWith('data:') ? image : undefined // Only send if it's a new base64 image
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
            
            <div className="md:col-span-2 flex flex-col md:flex-row gap-6 items-start bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="w-32 h-32 rounded-2xl overflow-hidden bg-slate-200 flex-shrink-0 border border-slate-300">
                {image && <img src={image} alt="Preview" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 mb-2">تصویر اثر</h4>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">برای تغییر تصویر فعلی، عکس جدید را آپلود کنید. توجه کنید که آثار دست‌ساز معمولاً تک‌نسخه هستند بنابراین موجودی به صورت خودکار ۱ در نظر گرفته می‌شود.</p>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  className="hidden" 
                  id="image-upload"
                />
                <label 
                  htmlFor="image-upload" 
                  className="inline-block px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-bold text-sm cursor-pointer transition-colors"
                >
                  تغییر تصویر
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">عنوان اثر <span className="text-red-500">*</span></label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-teal-500 outline-none transition-all" required />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">قیمت پایه (تومان) <span className="text-red-500">*</span></label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-teal-500 outline-none" required />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">تخصص‌های مرتبط</label>
              <SpecialtyTagInput selectedSpecialties={specialties} onChange={setSpecialties} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">توضیحات اثر</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-teal-500 outline-none leading-relaxed" rows={5}></textarea>
            </div>

            <div className="md:col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
              <h4 className="font-black text-slate-800 flex items-center gap-2 mb-4">
                <span className="text-teal-600">🎯</span> سئو (SEO)
              </h4>
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
