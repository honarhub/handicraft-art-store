'use client';

import React, { useState } from 'react';
import SpecialtyTagInput, { Specialty } from '../../../components/SpecialtyTagInput';
import SocialLinksInput from '../../../components/SocialLinksInput';

export default function AddArtistPage() {
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiPreview, setAiPreview] = useState<any>(null);
  const [aiError, setAiError] = useState('');
  
  // State for manual form
  const [manualName, setManualName] = useState('');
  const [manualSpecialties, setManualSpecialties] = useState<Specialty[]>([]);
  const [manualBio, setManualBio] = useState('');
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [manualPortfolioUrl, setManualPortfolioUrl] = useState('');
  const [manualSocialLinks, setManualSocialLinks] = useState<any>({});

  // تبدیل فایل به Base64 برای ارسال به سرور
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result); // ارسال کامل base64 با هدر data:image/...
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setAvatarBase64(base64);
    }
  };

  const handleAiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setAiError('');
    setIsProcessing(true);

    try {
      const base64Str = await fileToBase64(file);
      const mimeType = file.type || 'text/plain';
      
      // اگر فایل عکس بود، به عنوان آواتار هم در نظر می‌گیریم
      if (mimeType.startsWith('image/')) {
        setAvatarBase64(base64Str);
      }

      // ارسال به API هوش مصنوعی (نیاز به فرمت بدون هدر دارد)
      const base64Data = base64Str.split(',')[1];
      
      const res = await fetch('/api/ai/extract-artist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Data, mimeType }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'خطای سرور');

      setAiPreview(data);
    } catch (err: any) {
      setAiError(err.message || 'خطایی رخ داد. لطفاً فایلی با فرمت مجاز (PDF, عکس, TXT) انتخاب کنید.');
    } finally {
      setIsProcessing(false);
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
                      type="file" 
                      accept=".txt, .pdf, image/jpeg, image/png, image/webp" 
                      onChange={handleAiUpload}
                      disabled={isProcessing}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait"
                    />
                    <span className="text-5xl mb-4">{isProcessing ? '⏳' : '📄'}</span>
                    <span className="text-indigo-800 font-medium text-sm">
                      {isProcessing ? 'در حال ارتباط با هوش مصنوعی و خواندن فایل...' : 'برای انتخاب فایل کلیک کنید (PDF, عکس, متن)'}
                    </span>
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
                <div className="flex items-center gap-4">
                  {avatarBase64 && <img src={avatarBase64} alt="Preview" className="w-12 h-12 rounded-full object-cover border" />}
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-sm" />
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
    </div>
  );
}
