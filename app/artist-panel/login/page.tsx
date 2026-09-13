'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ArtistLoginPage() {
  const [artists, setArtists] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/artists')
      .then(res => res.json())
      .then(data => setArtists(data.filter((a: any) => a.isActive && a.status !== 'DELETED')));
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return alert('لطفاً حساب خود را انتخاب کنید.');
    
    // شبیه‌سازی لاگین با تنظیم کوکی
    document.cookie = `artistId=${selectedId}; path=/; max-age=86400`;
    router.push('/artist-panel/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans p-4" dir="rtl">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🎭</div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">ورود هنرمندان</h1>
          <p className="text-sm text-slate-500 mt-2">به پنل اختصاصی مدیریت آثار خود خوش آمدید.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">حساب کاربری هنرمند</label>
            <select 
              value={selectedId} 
              onChange={e => setSelectedId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-50 outline-none bg-white transition-all"
              required
            >
              <option value="">انتخاب کنید...</option>
              {artists.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-teal-200 transition-all">
            ورود به پنل کاربری
          </button>
        </form>
      </div>
    </div>
  );
}
