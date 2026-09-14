'use client';

import React, { useState, useRef } from 'react';

export default function SupportForm({ productId }: { productId?: string }) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [responseMsg, setResponseMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 500 * 1024) {
        alert('حجم فایل نمی‌تواند بیشتر از ۵۰۰ کیلوبایت باشد.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        setFile(null);
      } else {
        setFile(selectedFile);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('contact', contact);
    formData.append('message', message);
    if (productId) formData.append('productId', productId);
    if (file) formData.append('file', file);

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ارسال پیام');
      
      setStatus('success');
      setResponseMsg(data.message);
      setName('');
      setContact('');
      setMessage('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      setStatus('error');
      setResponseMsg(error.message || 'خطای شبکه');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-emerald-50 text-emerald-800 p-8 rounded-2xl text-center border border-emerald-100">
        <div className="text-4xl mb-4">✅</div>
        <h3 className="text-xl font-bold mb-2">پیام شما با موفقیت ثبت شد</h3>
        <a href="/" className="inline-block mt-6 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors text-sm">
          بازگشت به صفحه اصلی
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">نام و نام خانوادگی <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            required 
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all bg-slate-50 focus:bg-white" 
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">شماره تماس یا ایمیل <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            required 
            value={contact}
            onChange={e => setContact(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all bg-slate-50 focus:bg-white text-left" 
            dir="ltr"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">متن پیام <span className="text-red-500">*</span></label>
        <textarea 
          required 
          rows={5}
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all bg-slate-50 focus:bg-white resize-none" 
        ></textarea>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">پیوست فایل (اختیاری)</label>
        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-colors w-full cursor-pointer"
          />
          <div className="text-xs text-slate-400 shrink-0">حداکثر ۵۰۰ کیلوبایت</div>
        </div>
      </div>

      {status === 'error' && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-bold border border-red-100">
          {responseMsg}
        </div>
      )}

      <button 
        type="submit" 
        disabled={status === 'loading'}
        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50 text-lg"
      >
        {status === 'loading' ? 'در حال ارسال...' : 'ارسال پیام'}
      </button>
    </form>
  );
}
