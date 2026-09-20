'use client';
import React, { useState } from 'react';

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('رمز عبور جدید و تکرار آن مطابقت ندارند.');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('رمز عبور جدید باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'خطایی رخ داد.');
      } else {
        setSuccess('رمز عبور با موفقیت تغییر کرد.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 mt-8">
      <h3 className="text-xl font-black text-slate-800 mb-2">تغییر رمز عبور</h3>
      <p className="text-slate-500 mb-6 text-sm">برای امنیت بیشتر، پیشنهاد می‌شود رمز عبور خود را به صورت دوره‌ای تغییر دهید.</p>
      
      {success && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl mb-6 font-bold border border-emerald-100 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          {success}
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-bold border border-red-100 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">رمز عبور فعلی</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 outline-none text-left"
            dir="ltr"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">رمز عبور جدید</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 outline-none text-left"
            dir="ltr"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">تکرار رمز عبور جدید</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 outline-none text-left"
            dir="ltr"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || !currentPassword || !newPassword || !confirmPassword}
          className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-colors disabled:opacity-50 flex items-center gap-2 mt-4"
        >
          {loading ? 'در حال ثبت...' : 'ذخیره رمز عبور جدید'}
        </button>
      </form>
    </div>
  );
}
