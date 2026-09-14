'use client';

import React, { useState } from 'react';
import SpecialtyTagInput, { Specialty } from '@/app/components/SpecialtyTagInput';
import { useRouter } from 'next/navigation';

export default function ArtistAddProductPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  
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
  const [aiLoading, setAiLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAiLoading(true);
    try {
      const base64 = await fileToBase64(file);
      setImage(base64);

      const response = await fetch('/api/ai/extract-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Data: base64.split(',')[1],
          mimeType: file.type
        })
      });

      if (!response.ok) throw new Error('خطا در هوش مصنوعی');
      
      const data = await response.json();
      
      setTitle(data.title || '');
      setDescription(data.description || '');
      if (data.estimatedPrice) setPrice(String(data.estimatedPrice));
      setSeoMetaTitle(data.seoMetaTitle || '');
      setSeoMetaDesc(data.seoMetaDesc || '');
      setSeoKeywords(data.seoKeywords || '');
      
    } catch (error) {
      alert('متاسفانه پردازش تصویر با مشکل مواجه شد. لطفا فرم را دستی پر کنید.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSubmitLoading(true);
    try {
      // artistId is omitted here, the backend will read it from cookies
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          price,
          specialties: specialties.map(s => s.id),
          seoMetaTitle,
          seoMetaDesc,
          seoKeywords,
          image
        })
      });

      if (!res.ok) throw new Error('Error creating product');
      
      alert('محصول با موفقیت ثبت شد و در انتظار تایید ادمین قرار گرفت!');
      router.push('/artist-panel/products');
    } catch (error) {
      alert('خطا در ثبت محصول');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto" dir="rtl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">ثبت اثر جدید</h2>
          <p className="text-slate-500 mt-1 text-sm">محصولات پس از ثبت نیاز به تایید مدیریت دارند.</p>
        </div>
        <button onClick={() => router.back()} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm transition-colors">
          بازگشت به لیست
        </button>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-2xl mb-8 w-fit">
        <button 
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'ai' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <span className="text-lg">✨</span> ثبت سریع با هوش مصنوعی
        </button>
        <button 
          onClick={() => setActiveTab('manual')}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'manual' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          ثبت دستی (سنتی)
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden p-6 md:p-8">
        
        {activeTab === 'ai' && (
          <div className="mb-10 pb-10 border-b border-slate-100">
            <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${aiLoading ? 'border-teal-300 bg-teal-50' : 'border-slate-300 hover:border-teal-400 bg-slate-50 hover:bg-teal-50/30'}`}>
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">📸</div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">عکس محصول را آپلود کنید</h3>
                <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                  هوش مصنوعی به صورت خودکار تصویر محصول را آنالیز کرده و اطلاعات را پر می‌کند.
                </p>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAiUpload}
                  className="hidden" 
                  id="ai-upload"
                  disabled={aiLoading}
                />
                <label 
                  htmlFor="ai-upload" 
                  className={`inline-block px-6 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${aiLoading ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 text-white shadow-md hover:shadow-lg'}`}
                >
                  {aiLoading ? 'در حال پردازش هوش مصنوعی...' : 'انتخاب تصویر و پردازش'}
                </label>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">عنوان اثر <span className="text-red-500">*</span></label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-50 outline-none transition-all" required />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">قیمت پایه (تومان)</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-teal-500 outline-none" placeholder="مثلا: 5000000" />
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
              {submitLoading ? 'در حال ثبت...' : 'ارسال برای تایید'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
