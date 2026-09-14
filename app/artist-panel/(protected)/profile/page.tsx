'use client';

import React, { useState, useEffect } from 'react';

import SpecialtyTagInput, { Specialty } from '@/app/components/SpecialtyTagInput';

export default function ArtistProfilePage() {
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [artist, setArtist] = useState<any>(null);
  const [pendingMode, setPendingMode] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);

  useEffect(() => {
    fetch('/api/artist/profile')
      .then(res => res.json())
      .then(data => {
        setArtist(data);
        if (data.pendingEdits) {
          setPendingMode(true);
          setName(data.pendingEdits.name || data.user?.name || '');
          setBio(data.pendingEdits.bio || data.bio || '');
          setPortfolioUrl(data.pendingEdits.portfolioUrl || data.portfolioUrl || '');
          setImagePreview(data.pendingEdits.image || data.user?.image || null);
          setSpecialties(data.pendingEdits.specialties || data.specialties || []);
        } else {
          setName(data.user?.name || '');
          setBio(data.bio || '');
          setPortfolioUrl(data.portfolioUrl || '');
          setImagePreview(data.user?.image || null);
          setSpecialties(data.specialties || []);
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

  const formatUrl = (url: string) => {
    if (!url.trim()) return '';
    // اگر با http یا https شروع نشده بود، به صورت خودکار https:// را اضافه می‌کنیم
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
          image: imagePreview,
          specialties: specialties // Send the full specialty objects, we'll extract IDs in API if needed
        })
      });

      if (!res.ok) throw new Error('خطا در ثبت تغییرات');
      
      alert('تغییرات شما با موفقیت ثبت شد و در انتظار تایید ادمین قرار گرفت.');
      setPendingMode(true);
      setPortfolioUrl(formattedUrl);
      
      // Clear any previous feedback in the local state
      setArtist({...artist, adminFeedback: null});
    } catch (err) {
      alert('مشکلی پیش آمد، دوباره تلاش کنید.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center font-bold text-slate-500">در حال بارگذاری اطلاعات...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto" dir="rtl">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-800">ویرایش پروفایل هنرمند</h2>
        <p className="text-slate-500 mt-1 text-sm">تغییرات شما پس از تایید توسط ادمین در سایت اعمال خواهد شد.</p>
      </div>

      {artist?.adminFeedback && !pendingMode && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-4 items-start">
          <span className="text-2xl">⚠️</span>
          <div>
            <h4 className="font-bold text-red-800">درخواست ویرایش قبلی شما رد شد!</h4>
            <p className="text-red-700 text-sm mt-1">دلیل ادمین: {artist.adminFeedback}</p>
          </div>
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

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
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
              <label className="block text-sm font-bold text-slate-700 mb-2">لینک پورتفولیو یا شبکه اجتماعی</label>
              <input type="text" value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)} onBlur={() => setPortfolioUrl(formatUrl(portfolioUrl))} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-teal-500 outline-none text-left" dir="ltr" placeholder="instagram.com/myart" />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">تخصص‌ها</label>
              <SpecialtyTagInput selectedSpecialties={specialties} onChange={setSpecialties} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">درباره شما (بیوگرافی)</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-teal-500 outline-none leading-relaxed" placeholder="داستان هنر خود را بنویسید..."></textarea>
            </div>
          </div>

          <button type="submit" disabled={submitLoading} className="w-full mt-8 bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-teal-200 transition-colors disabled:opacity-50">
            {submitLoading ? 'در حال ارسال...' : 'ثبت درخواست تغییرات'}
          </button>
        </form>
      </div>
    </div>
  );
}
