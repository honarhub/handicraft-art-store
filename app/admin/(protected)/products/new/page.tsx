'use client';

import React, { useState, useEffect, useRef } from 'react';
import SpecialtyTagInput, { Specialty } from '@/app/components/SpecialtyTagInput';

export default function AddProductPage() {
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  
  // Data States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [artistId, setArtistId] = useState('');
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [seoMetaTitle, setSeoMetaTitle] = useState('');
  const [seoMetaDesc, setSeoMetaDesc] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [image, setImage] = useState<string | null>(null);

  // UI States
  const [artists, setArtists] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCountdown, setAiCountdown] = useState(90);
  const [aiError, setAiError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    // Fetch artists for the dropdown
    fetch('/api/artists')
      .then(res => res.json())
      .then(data => {
        // Filter only active artists
        setArtists(data.filter((a: any) => a.status !== 'DELETED'));
      })
      .catch(err => console.error('Failed to fetch artists:', err));
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleCancelAi = () => {
    isCancelledRef.current = true;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setAiLoading(false);
    setAiError('فرآیند هوش مصنوعی لغو شد.');
  };

  const handleAiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAiError('');
    setAiLoading(true);
    setAiCountdown(90);
    isCancelledRef.current = false;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 90000);

    const timerInterval = setInterval(() => {
      setAiCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      const base64 = await fileToBase64(file);
      setImage(base64);

      const response = await fetch('/api/ai/extract-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Data: base64.split(',')[1],
          mimeType: file.type
        }),
        signal: controller.signal
      });

      if (!response.ok) throw new Error('خطا در هوش مصنوعی');
      
      const data = await response.json();
      
      setTitle(data.title || '');
      setDescription(data.description || '');
      if (data.estimatedPrice) setPrice(String(data.estimatedPrice));
      setSeoMetaTitle(data.seoMetaTitle || '');
      setSeoMetaDesc(data.seoMetaDesc || '');
      setSeoKeywords(data.seoKeywords || '');
      
      if (data.matchedSpecialties && Array.isArray(data.matchedSpecialties) && data.matchedSpecialties.length > 0) {
        setSpecialties(data.matchedSpecialties);
      }
      
    } catch (error: any) {
      if (isCancelledRef.current) {
        setAiError('فرآیند هوش مصنوعی با موفقیت لغو شد.');
      } else if (error.name === 'AbortError' || controller.signal.aborted) {
        setAiError('زمان پردازش هوش مصنوعی به پایان رسید (بیش از ۹۰ ثانیه). لطفاً دوباره تلاش کرده یا فرم را دستی تکمیل نمایید.');
      } else {
        setAiError('متاسفانه پردازش تصویر با مشکل مواجه شد. لطفا فرم را دستی پر کنید.');
      }
    } finally {
      clearTimeout(timeoutId);
      clearInterval(timerInterval);
      setAiLoading(false);
      abortControllerRef.current = null;
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistId) return alert('لطفاً هنرمند صاحب اثر را انتخاب کنید');
    
    setSubmitLoading(true);
    try {
      const res = await fetch('/api/products?isAdmin=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          price,
          artistId,
          specialties: specialties.map(s => s.id), // Just passing IDs for connection
          seoMetaTitle,
          seoMetaDesc,
          seoKeywords,
          image
        })
      });

      if (!res.ok) throw new Error('Error creating product');
      
      alert('محصول با موفقیت ثبت شد!');
      window.location.href = '/admin/products';
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
          <h2 className="text-2xl font-black text-slate-800">ثبت محصول جدید</h2>
          <p className="text-slate-500 mt-1 text-sm">از طریق هوش مصنوعی یا به صورت دستی اطلاعات محصول را وارد کنید.</p>
        </div>
        <a href="/admin/products" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm transition-colors">
          بازگشت به لیست
        </a>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl mb-8 w-fit">
        <button 
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'ai' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <span className="text-lg">✨</span> ثبت سریع با هوش مصنوعی
        </button>
        <button 
          onClick={() => setActiveTab('manual')}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'manual' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          ثبت دستی (سنتی)
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden p-6 md:p-8">
        
        {/* بخش آپلود هوش مصنوعی */}
        {activeTab === 'ai' && (
          <div className="mb-10 pb-10 border-b border-slate-100">
            <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${aiLoading ? 'border-purple-300 bg-purple-50' : 'border-slate-300 hover:border-purple-400 bg-slate-50 hover:bg-purple-50/30'}`}>
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">📸</div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">عکس محصول را آپلود کنید</h3>
                <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                  هوش مصنوعی به صورت خودکار تصویر محصول را آنالیز کرده و عنوان هنری، توضیحات، تگ‌ها و حتی متادیتاهای سئو را برای شما تولید می‌کند.
                </p>
                {aiError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4 mb-4 text-center font-bold">
                    ⚠️ {aiError}
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAiUpload}
                  className="hidden" 
                  id="ai-upload"
                  disabled={aiLoading}
                />
                {aiLoading ? (
                  <div className="bg-purple-100/90 border border-purple-300 rounded-2xl p-4 flex flex-col items-center gap-2.5 max-w-xs mx-auto">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                        <span className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></span>
                        <span>در حال پردازش هوش مصنوعی...</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCancelAi}
                        className="p-1 hover:bg-purple-200/80 rounded-lg text-purple-800 transition-colors flex items-center gap-1 text-[11px] font-bold"
                        title="انصراف و لغو پردازش"
                      >
                        <span>✕</span>
                        <span>لغو</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex-1 bg-purple-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-1000 ease-linear"
                          style={{ width: `${Math.min(100, Math.max(0, ((90 - aiCountdown) / 90) * 100))}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-purple-900 bg-white/80 px-2 py-0.5 rounded-md shadow-xs">
                        {aiCountdown.toLocaleString('fa-IR')} ثانیه
                      </span>
                    </div>
                  </div>
                ) : (
                  <label 
                    htmlFor="ai-upload" 
                    className="inline-block px-6 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg"
                  >
                    انتخاب تصویر و پردازش
                  </label>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* عنوان */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">عنوان محصول <span className="text-red-500">*</span></label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-50 outline-none transition-all" required />
            </div>

            {/* هنرمند */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">هنرمند صاحب اثر <span className="text-red-500">*</span></label>
              <select value={artistId} onChange={e => setArtistId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-purple-500 outline-none bg-white" required>
                <option value="">انتخاب هنرمند...</option>
                {artists.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {/* قیمت */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">قیمت پایه (تومان)</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-purple-500 outline-none" placeholder="مثلا: 5000000" />
            </div>

            {/* تخصص‌ها */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">تخصص‌های مرتبط</label>
              <SpecialtyTagInput selectedSpecialties={specialties} onChange={setSpecialties} />
            </div>

            {/* توضیحات */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">توضیحات معرفی</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-purple-500 outline-none leading-relaxed" rows={5}></textarea>
            </div>

            {/* بخش سئو */}
            <div className="md:col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
              <h4 className="font-black text-slate-800 flex items-center gap-2 mb-4">
                <span className="text-purple-600">🎯</span> تنظیمات سئو (SEO)
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
                <input type="text" value={seoKeywords} onChange={e => setSeoKeywords(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm outline-none" placeholder="کلمات کلیدی با کاما جدا شوند" />
              </div>
            </div>

          </div>

          <div className="pt-6 border-t border-slate-100 flex gap-4">
            <button type="submit" disabled={submitLoading} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-purple-200 transition-all disabled:opacity-50">
              {submitLoading ? 'در حال ثبت...' : 'ذخیره نهایی محصول'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
