'use client';

import React, { useState, useRef } from 'react';
import SpecialtyTagInput, { Specialty } from '@/app/components/SpecialtyTagInput';
import SocialLinksInput from '@/app/components/SocialLinksInput';
import AvatarCropModal from '@/app/components/AvatarCropModal';

export default function AddArtistPage() {
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiPreview, setAiPreview] = useState<any>(null);
  const [aiCountdown, setAiCountdown] = useState(90);
  const [aiError, setAiError] = useState('');

  // Crop modal states
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageForCrop, setRawImageForCrop] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isCancelledRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for manual form
  const [manualName, setManualName] = useState('');
  const [manualSpecialties, setManualSpecialties] = useState<Specialty[]>([]);
  const [manualBio, setManualBio] = useState('');
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [manualPortfolioUrl, setManualPortfolioUrl] = useState('');
  const [manualSocialLinks, setManualSocialLinks] = useState<any>({});

  // Convert file to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result); // Full data URL format
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setRawImageForCrop(base64);
      setCropModalOpen(true);
      e.target.value = '';
    }
  };

  const handleCropComplete = (croppedBase64: string) => {
    setAvatarBase64(croppedBase64);
    setCropModalOpen(false);
    setRawImageForCrop(null);
  };

  const handleCancelAi = () => {
    isCancelledRef.current = true;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsProcessing(false);
    setAiError('فرآیند هوش مصنوعی لغو شد.');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setAiError('');
    setIsProcessing(true);
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
      const base64Str = await fileToBase64(file);
      const mimeType = file.type || 'text/plain';
      
      // If uploaded file is an image, set as avatar candidate
      if (mimeType.startsWith('image/')) {
        setAvatarBase64(base64Str);
      }

      // Send to AI extraction endpoint (requires headerless payload)
      const base64Data = base64Str.split(',')[1];
      
      const res = await fetch('/api/ai/extract-artist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Data, mimeType }),
        signal: controller.signal,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'خطای سرور');

      setAiPreview(data);
    } catch (err: any) {
      if (isCancelledRef.current) {
        setAiError('فرآیند هوش مصنوعی با موفقیت لغو شد.');
      } else if (err.name === 'AbortError' || controller.signal.aborted) {
        setAiError('زمان پردازش هوش مصنوعی به پایان رسید (بیش از ۹۰ ثانیه). لطفاً مجدداً تلاش کرده یا اطلاعات را دستی وارد کنید.');
      } else {
        setAiError(err.message || 'خطایی رخ داد. لطفاً فایلی با فرمت مجاز (PDF, عکس, TXT) انتخاب کنید.');
      }
    } finally {
      clearTimeout(timeoutId);
      clearInterval(timerInterval);
      setIsProcessing(false);
      abortControllerRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const submitFinalArtist = async (source: 'ai' | 'manual') => {
    const payload = source === 'ai' ? { ...aiPreview, avatar: avatarBase64 } : {
      name: manualName,
      specialties: manualSpecialties.map(s => s.id),
      bio: manualBio,
      avatar: avatarBase64,
      portfolioUrl: manualPortfolioUrl,
      socialLinks: manualSocialLinks
    };

    try {
      const res = await fetch('/api/artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('خطا در ذخیره‌سازی هنرمند');
      
      alert('پروفایل هنرمند با موفقیت ساخته شد و در دیتابیس ذخیره گردید!');
      window.location.href = '/admin/artists';
    } catch(err) {
      alert('مشکلی در ثبت هنرمند به وجود آمد.');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-800">ثبت هنرمند جدید</h2>
        <p className="text-slate-500 mt-1 text-sm">پروفایل هنرمند را بسازید تا او بتواند وارد پنل خود شود.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* هدر تب‌ها */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => { setActiveTab('ai'); setAiPreview(null); setAvatarBase64(null); }}
            className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${activeTab === 'ai' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            🤖 استخراج با هوش مصنوعی (PDF، عکس، متن)
          </button>
          <button
            onClick={() => { setActiveTab('manual'); setAvatarBase64(null); }}
            className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${activeTab === 'manual' ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            ✍️ ثبت دستی اطلاعات
          </button>
        </div>

        <div className="p-6 md:p-8">
          {activeTab === 'ai' ? (
            <div className="space-y-6">
              {!aiPreview ? (
                <div className="text-center">
                  <h3 className="font-bold text-slate-700 mb-2">رزومه یا معرفی‌نامه هنرمند را آپلود کنید</h3>
                  <p className="text-xs text-slate-500 mb-8">از فایل‌های PDF، عکس (JPG/PNG) یا متن (TXT) پشتیبانی می‌شود.</p>
                  
                  {aiError && <div className="text-red-500 text-sm mb-4 font-bold">{aiError}</div>}
                  
                  <div className="relative border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition-colors">
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept=".txt, .pdf, image/jpeg, image/png, image/webp" 
                      onChange={handleAiUpload}
                      disabled={isProcessing}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait"
                    />
                    {isProcessing ? (
                      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                            <span className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                            <span>در حال پردازش هوش مصنوعی...</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCancelAi}
                            className="p-1 hover:bg-indigo-200/80 rounded-lg text-indigo-800 transition-colors flex items-center gap-1 text-[11px] font-bold"
                            title="انصراف و لغو پردازش"
                          >
                            <span>✕</span>
                            <span>لغو</span>
                          </button>
                        </div>
                        <div className="flex items-center gap-2 w-full">
                          <div className="flex-1 bg-indigo-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-indigo-600 h-2 rounded-full transition-all duration-1000 ease-linear"
                              style={{ width: `${Math.min(100, Math.max(0, ((90 - aiCountdown) / 90) * 100))}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-indigo-900 bg-white/80 px-2 py-0.5 rounded-md shadow-xs">
                            {aiCountdown.toLocaleString('fa-IR')} ثانیه
                          </span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="text-5xl mb-4">📄</span>
                        <span className="text-indigo-800 font-medium text-sm">
                          برای انتخاب فایل کلیک کنید (PDF, عکس, متن)
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="animate-in fade-in zoom-in duration-300">
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl mb-6 text-sm flex gap-2 font-medium">
                    <span>✅</span> اطلاعات با موفقیت توسط هوش مصنوعی استخراج و بهبود یافت. لطفاً بررسی کنید:
                  </div>
                  
                  <div className="space-y-4">
                    {avatarBase64 && (
                      <div className="flex justify-center mb-4">
                        <img src={avatarBase64} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">نام هنرمند</label>
                      <input type="text" value={aiPreview.name || ''} onChange={e => setAiPreview({...aiPreview, name: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none font-bold text-slate-800" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">تخصص‌ها (بهبود یافته)</label>
                      <input type="text" value={aiPreview.specialties || ''} onChange={e => setAiPreview({...aiPreview, specialties: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none text-slate-800" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">بیوگرافی (بهینه‌شده برای سئو و فروش)</label>
                      <textarea value={aiPreview.bio || ''} onChange={e => setAiPreview({...aiPreview, bio: e.target.value})} rows={4} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none text-slate-800 leading-relaxed"></textarea>
                    </div>
                    
                    <button onClick={() => submitFinalArtist('ai')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md mt-4 transition-all">
                      تایید نهایی و ساخت پروفایل هنرمند
                    </button>
                    <button onClick={() => { setAiPreview(null); setAvatarBase64(null); }} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl mt-2 transition-all">
                      انصراف و آپلود فایل دیگر
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); submitFinalArtist('manual'); }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">نام و نام خانوادگی</label>
                  <input type="text" value={manualName} onChange={e => setManualName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">تخصص‌ها</label>
                  <SpecialtyTagInput selectedSpecialties={manualSpecialties} onChange={setManualSpecialties} />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">عکس پروفایل</label>
                <div className="flex flex-wrap items-center gap-4">
                  {avatarBase64 ? (
                    <div className="relative group">
                      <img src={avatarBase64} alt="Preview" className="w-14 h-14 rounded-full object-cover border-2 border-slate-200 shadow-xs" />
                      <button 
                        type="button" 
                        onClick={() => setAvatarBase64(null)}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-5 h-5 rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-sm"
                        title="حذف عکس"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-xl text-slate-400">
                      👤
                    </div>
                  )}
                  <div className="flex-1 min-w-[220px] flex items-center gap-2">
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm" />
                    {avatarBase64 && (
                      <button
                        type="button"
                        onClick={() => {
                          setRawImageForCrop(avatarBase64);
                          setCropModalOpen(true);
                        }}
                        className="shrink-0 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        title="تنظیم کادربندی دایره"
                      >
                        تنظیم کادر
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">لینک سایت شخصی (اختیاری)</label>
                  <input type="text" value={manualPortfolioUrl} onChange={e => setManualPortfolioUrl(e.target.value)} onBlur={() => setManualPortfolioUrl(manualPortfolioUrl ? (manualPortfolioUrl.startsWith('http') ? manualPortfolioUrl : `https://${manualPortfolioUrl}`) : '')} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-left" dir="ltr" placeholder="mywebsite.com" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">شبکه‌های اجتماعی</label>
                  <SocialLinksInput socialLinks={manualSocialLinks} onChange={setManualSocialLinks} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">معرفی‌نامه (بیوگرافی)</label>
                <textarea value={manualBio} onChange={e => setManualBio(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none" rows={4} required></textarea>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all">
                  ساخت دستی پروفایل هنرمند
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Avatar Circular Crop Modal */}
      <AvatarCropModal
        isOpen={cropModalOpen}
        imageSrc={rawImageForCrop}
        onClose={() => {
          setCropModalOpen(false);
          setRawImageForCrop(null);
        }}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
