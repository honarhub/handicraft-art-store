'use client';
import React from 'react';
import ChangePasswordForm from '@/app/components/ChangePasswordForm';

export default function ArtistSecurityPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto" dir="rtl">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-800">تنظیمات امنیتی</h2>
        <p className="text-slate-500 mt-1 text-sm">مدیریت رمز عبور و امنیت حساب کاربری</p>
      </div>

      <ChangePasswordForm />
    </div>
  );
}
