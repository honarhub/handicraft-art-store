'use client';

import React, { useState } from 'react';

export default function StockNotifyButton({ productId }: { productId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [contact, setContact] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact) return;
    
    setStatus('loading');
    try {
      const res = await fetch('/api/stock-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, contact })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا');
      
      setStatus('success');
      setMessage(data.message);
      setTimeout(() => setIsOpen(false), 3000);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'خطایی رخ داد.');
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold py-4 rounded-xl transition-colors border border-amber-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        موجود شد خبر بده
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative" dir="rtl">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <h3 className="text-xl font-black text-slate-800 mb-2">موجود شد خبر بده</h3>
            <p className="text-slate-500 text-sm mb-6">شماره موبایل یا ایمیل خود را وارد کنید تا به محض موجود شدن این اثر به شما اطلاع دهیم.</p>
            
            <form onSubmit={handleSubmit}>
              <input 
                type="text" 
                placeholder="09123456789 یا email@example.com"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all mb-4 text-left"
                dir="ltr"
                required
              />
              {message && (
                <div className={`p-3 rounded-lg mb-4 text-sm font-bold ${status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {message}
                </div>
              )}
              <button 
                type="submit" 
                disabled={status === 'loading'}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {status === 'loading' ? 'در حال ثبت...' : 'ثبت درخواست'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
