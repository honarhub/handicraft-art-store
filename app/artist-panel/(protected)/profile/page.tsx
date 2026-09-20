'use client';

import React, { useState, useEffect } from 'react';

import SpecialtyTagInput, { Specialty } from '@/app/components/SpecialtyTagInput';
import SocialLinksInput from '@/app/components/SocialLinksInput';

export default function ArtistProfilePage() {
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [artist, setArtist] = useState<any>(null);
  const [pendingMode, setPendingMode] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [socialLinks, setSocialLinks] = useState<any>({});

  useEffect(() => {
    fetch('/api/artist/profile')
      .then(res => res.json())
      .then(data => {
        setArtist(data);
        if (data.pendingEdits) {
          let edits = data.pendingEdits;
          if (typeof edits === 'string') {
            try {
              edits = JSON.parse(edits);
            } catch {
              edits = {};
            }
          }
          setPendingMode(true);
          setName(edits.name || data.user?.name || '');
          setBio(edits.bio || data.bio || '');
          setPortfolioUrl(edits.portfolioUrl || data.portfolioUrl || '');
          setImagePreview(edits.image || data.user?.image || null);
          setSpecialties(edits.specialties || data.specialties || []);
          setSocialLinks(edits.socialLinks || data.socialLinks || {});
        } else {
          setName(data.user?.name || '');
          setBio(data.bio || '');
          setPortfolioUrl(data.portfolioUrl || '');
          setImagePreview(data.user?.image || null);
          setSpecialties(data.specialties || []);
          setSocialLinks(data.socialLinks || {});
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

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
      setImagePreview(base64);
    } catch (err) {
      alert('خطا در آپلود تصویر');
    }
  };

  const handleAiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setAiError('');
    setAiLoading(true);

    try {
      const base64Str = await fileToBase64(file);
      const mimeType = file.type || 'text/plain';

      const base64Data = base64Str.split(',')[1];
      
      const res = await fetch('/api/ai/extract-artist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Data, mimeType }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'خطای سرور در هوش مصنوعی');

      if (data.name) setName(data.name);
      if (data.bio) setBio(data.bio);
      if (data.specialties) {
        setBio(prev => prev + '\n\nتخصص‌های پیشنهادی هوش مصنوعی: ' + data.specialties);
      }
      
      alert('اطلاعات با موفقیت از فایل استخراج شد. لطفاً فیلدها را بررسی کرده و ذخیره کنید.');
    } catch (err: any) {
      setAiError(err.message || 'خطایی رخ داد. لطفاً فایلی با فرمت مجاز انتخاب کنید.');
    } finally {
      setAiLoading(false);
    }
  };

  const formatUrl = (url: string) => {
    if (!url.trim()) return '';
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`;
    }
    return url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    
    const formattedUrl = formatUrl(portfolioUrl);
    
    try {
      const res = await fetch('/api/artist/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          bio,
          portfolioUrl: formattedUrl,
          socialLinks,
          image: imagePreview,
          specialties
        })
      });

      if (!res.ok) throw new Error('خطا در ثبت تغییرات');
      
      alert('تغییرات شما با موفقیت ثبت شد و در انتظار تایید ادمین قرار گرفت.');
      setPendingMode(true);
      setPortfolioUrl(formattedUrl);
      
      setArtist({...artist, adminFeedback: null});
    } catch (err) {
      alert('مشکلی پیش آمد، دوباره تلاش کنید.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center font-bold text-slate-500">در حال بارگذاری اطلاعات...</div>;

  const artistName = artist?.user?.name || '';
  const supportHref = '/support?message=' + encodeURIComponent('درخواست پیگیری وضعیت اکانت غیرفعال هنرمند\nنام هنرمند: ' + artistName) + '&name=' + encodeURIComponent(artistName);

  return (
    <div className="p-8 max-w-4xl mx-auto" dir="rtl">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-800">ویرایش پروفایل هنرمند</h2>
        <p className="text-slate-500 mt-1 text-sm">تغییرات شما پس از تایید توسط ادمین در سایت اعمال خواهد شد.</p>
      </div>

      {artist?.adminFeedback && !pendingMode && artist?.isActive && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-4 items-start">
          <span className="text-2xl">⚠️</span>
          <div>
            <h4 className="font-bold text-red-800">درخواست ویرایش قبلی شما رد شد!</h4>
            <p className="text-red-700 text-sm mt-1">دلیل ادمین: {artist.adminFeedback}</p>
          </div>
        </div>
      )}

      {!artist?.isActive && artist?.isApproved && (
        <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-4 items-start">
            <span className="text-3xl mt-1">🛑</span>
            <div>
              <h4 className="font-bold text-red-900 text-lg">حساب کاربری شما موقتاً غیرفعال شده است.</h4>
              {artist?.adminFeedback && <p className="text-red-700 font-medium mt-2">دلیل: <span className="font-bold">{artist.adminFeedback}</span></p>}
              <p className="text-red-700 text-sm mt-1">برای پیگیری بیشتر لطفاً با پشتیبانی در ارتباط باشید.</p>
            </div>
          </div>
          <a href={supportHref} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-red-200 transition-colors whitespace-nowrap">
            ارتباط با پشتیبانی
          </a>
        </div>
      )}

      {pendingMode && (
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex gap-4 items-center">
          <span className="text-2xl">⏳</span>
          <div>
            <h4 className="font-bold text-yellow-800">درخواست شما در انتظار تایید است</h4>
            <p className="text-yellow-700 text-sm mt-1">شما قبلا درخواست تغییر پروفایل داده‌اید. تا زمان تایید ادمین صبر کنید یا اگر می‌خواهید، دوباره اطلاعات را ویرایش کرده و مجدد درخواست دهید.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 relative">
        
        {/* AI Auto-Complete Section */}
        <div className="mb-8 p-6 border-2 border-dashed border-teal-200 bg-teal-50/50 rounded-2xl">
          <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
            <div>
              <h3 className="font-bold text-teal-900 text-lg flex items-center gap-2">
                <span className="text-2xl">✨</span> تکمیل خودکار با هوش مصنوعی
              </h3>
              <p className="text-teal-700 text-sm mt-2 leading-relaxed">
                رزومه یا معرفی‌نامه خود را (PDF، عکس، متن) آپلود کنید تا هوش مصنوعی فیلدهای پایین را برای شما پر کند.
              </p>
              {aiError && <p className="text-red-500 text-sm mt-2 font-bold">{aiError}</p>}
            </div>
            <div className="relative">
              <input 
                type="file" 
                accept=".txt, .pdf, image/jpeg, image/png, image/webp" 
                onChange={handleAiUpload}
                disabled={aiLoading || !artist?.isActive}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <button disabled={aiLoading || !artist?.isActive} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-bold transition-colors whitespace-nowrap shadow-sm disabled:opacity-50 disabled:bg-slate-400 flex items-center gap-2">
                {aiLoading ? (
                  <><span>⏳</span> در حال استخراج...</>
                ) : (
                  <><span>📄</span> انتخاب فایل رزومه</>
                )}
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset disabled={!artist?.isActive} className="space-y-6">
          <div className="flex items-center gap-6 mb-8 border-b border-slate-100 pb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl text-slate-400">👤</span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-white border border-slate-200 shadow-sm p-1.5 rounded-full cursor-pointer hover:bg-slate-50">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              </label>
            </div>
            <div>
              <h3 className="font-bold text-slate-800">تصویر پروفایل</h3>
              <p className="text-xs text-slate-500 mt-1">حجم کمتر از 2 مگابایت</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">نام و نام خانوادگی / نام هنری</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-teal-500 outline-none" required />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">لینک سایت شخصی (اختیاری)</label>
              <input type="text" value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)} onBlur={() => setPortfolioUrl(formatUrl(portfolioUrl))} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-teal-500 outline-none text-left" dir="ltr" placeholder="mywebsite.com" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">شبکه‌های اجتماعی</label>
              <SocialLinksInput socialLinks={socialLinks} onChange={setSocialLinks} />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">تخصص‌ها <span className="text-slate-400 font-normal text-xs">(مثل: سفالگری)</span></label>
              <SpecialtyTagInput selectedSpecialties={specialties} onChange={setSpecialties} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">درباره شما (بیوگرافی)</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-teal-500 outline-none leading-relaxed" placeholder="داستان هنر خود را بنویسید..."></textarea>
            </div>
          </div>

          <button type="submit" disabled={submitLoading || pendingMode || !artist?.isActive} className="w-full mt-8 bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-teal-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {submitLoading ? 'در حال ارسال...' : 'ثبت درخواست تغییرات'}
          </button>
          </fieldset>
        </form>

        {(!artist?.isActive) && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 rounded-3xl cursor-not-allowed border border-red-100 flex items-center justify-center">
          </div>
        )}
      </div>
    </div>
  );
}
