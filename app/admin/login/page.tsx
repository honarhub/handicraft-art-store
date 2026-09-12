'use client';

import React, { useState } from 'react';

export default function AdminLogin() {
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // در دنیای واقعی: استفاده از signIn('credentials') از NextAuth
    setTimeout(() => {
      window.location.href = '/admin/artists';
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="max-w-md w-full bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/20 mb-6">
            <span className="text-3xl">🛡️</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">ورود به کنترل پنل ارشد</h1>
          <p className="text-slate-400 mt-2 text-sm">فقط مدیران سیستم (Master Admins) مجاز به ورود هستند.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">ایمیل سازمانی</label>
            <input 
              type="email" 
              required
              className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-600"
              placeholder="admin@mydomain.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">رمز عبور امنیتی</label>
            <input 
              type="password" 
              required
              className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-600"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all mt-4 flex items-center justify-center gap-2"
          >
            {loading ? 'در حال بررسی هویت...' : 'ورود امن'}
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-slate-700 text-center">
          <a href="/" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
            &larr; بازگشت به سایت اصلی
          </a>
        </div>
      </div>
    </div>
  );
}
