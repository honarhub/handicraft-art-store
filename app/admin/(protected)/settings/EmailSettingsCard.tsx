'use client';

import React, { useState } from 'react';

export interface EmailSettingsProps {
  initialSettings: {
    isEmailServiceActive?: boolean;
    emailIsSandbox?: boolean;
    resendApiKey?: string | null;
    emailFromAddress?: string | null;
    emailFromName?: string | null;
  };
  onSave: (updates: any) => Promise<void>;
}

export default function EmailSettingsCard({ initialSettings, onSave }: EmailSettingsProps) {
  const [isEmailServiceActive, setIsEmailServiceActive] = useState(initialSettings.isEmailServiceActive ?? true);
  const [emailIsSandbox, setEmailIsSandbox] = useState(initialSettings.emailIsSandbox ?? false);
  const [resendApiKey, setResendApiKey] = useState(initialSettings.resendApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [emailFromAddress, setEmailFromAddress] = useState(initialSettings.emailFromAddress || 'no-reply@honarhub.ir');
  const [emailFromName, setEmailFromName] = useState(initialSettings.emailFromName || 'هنرهاب');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Live Test states
  const [testEmail, setTestEmail] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);

  // Sync state when initialSettings loads
  React.useEffect(() => {
    if (initialSettings) {
      if (initialSettings.isEmailServiceActive !== undefined) setIsEmailServiceActive(initialSettings.isEmailServiceActive);
      if (initialSettings.emailIsSandbox !== undefined) setEmailIsSandbox(Boolean(initialSettings.emailIsSandbox));
      if (initialSettings.resendApiKey !== undefined) setResendApiKey(initialSettings.resendApiKey || '');
      if (initialSettings.emailFromAddress !== undefined) setEmailFromAddress(initialSettings.emailFromAddress || 'no-reply@honarhub.ir');
      if (initialSettings.emailFromName !== undefined) setEmailFromName(initialSettings.emailFromName || 'هنرهاب');
    }
  }, [initialSettings]);

  // Standard eye toggle icon
  const renderEyeIcon = (shown: boolean) => {
    if (shown) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
          <line x1="2" y1="2" x2="22" y2="22" />
        </svg>
      );
    }
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  };

  const handleSaveEmailSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      await onSave({
        isEmailServiceActive,
        emailIsSandbox,
        resendApiKey: resendApiKey.trim(),
        emailFromAddress: emailFromAddress.trim(),
        emailFromName: emailFromName.trim()
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch {
      alert('خطا در ذخیره تنظیمات ایمیل');
    } finally {
      setSaving(false);
    }
  };

  const handleRunEmailTest = async () => {
    if (!testEmail.trim() || !testEmail.includes('@')) {
      alert('لطفاً یک آدرس ایمیل معتبر برای دریافت تست وارد کنید.');
      return;
    }

    if (!emailIsSandbox && !resendApiKey.trim()) {
      alert('در حالت عملیاتی، ابتدا باید کلید اختصاصی Resend API Key را وارد و ذخیره کنید. یا محیط را روی «سندباکس (شبیه‌ساز)» قرار دهید.');
      return;
    }

    setTestLoading(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/admin/settings/email-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: testEmail.trim(),
          isSandbox: emailIsSandbox,
          apiKey: resendApiKey.trim(),
          fromEmail: emailFromAddress.trim(),
          fromName: emailFromName.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || 'ایمیل تستی با موفقیت ارسال شد.',
          data: data.data
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'خطا در ارسال ایمیل تستی.'
        });
      }
    } catch {
      setTestResult({
        success: false,
        message: 'خطا در برقراری ارتباط با سرور.'
      });
    } finally {
      setTestLoading(false);
    }
  };

  const isConfigured = Boolean(resendApiKey.trim());

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 mt-8 font-sans" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-2xl shrink-0">
            ✉️
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-lg font-black text-slate-800">سامانه ارسال ایمیل (Resend)</h3>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                isEmailServiceActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}>
                {isEmailServiceActive ? 'سرویس فعال' : 'سرویس متوقف'}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                emailIsSandbox
                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                  : isConfigured
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {emailIsSandbox
                  ? '🧪 محیط سندباکس (Mock بدون نیاز به کلید)'
                  : isConfigured
                  ? '⚡ عملیاتی زنده Resend'
                  : '⚠️ فاقد کلید API عملیاتی'}
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm mt-1.5 leading-relaxed">
              مدیریت سرویس ایمیل‌های تراکنشی پلتفرم (کدهای یکبار مصرف، بازیابی رمز عبور و اعلان‌ها) با قابلیت سوییچ بین سندباکس داخلی و زیرساخت Resend.
            </p>
          </div>
        </div>

        {/* Emergency Kill-Switch Toggle */}
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-700">کلید قطع اضطراری:</span>
          <button
            type="button"
            dir="ltr"
            onClick={() => setIsEmailServiceActive(!isEmailServiceActive)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isEmailServiceActive ? 'bg-emerald-600' : 'bg-red-500'
            }`}
            title={isEmailServiceActive ? 'غیرفعال کردن ارسال ایمیل' : 'فعال کردن ارسال ایمیل'}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isEmailServiceActive ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {!isEmailServiceActive && (
        <div className="mt-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 font-bold flex items-center gap-2">
          <span>⚠️</span>
          <span>
            سرویس ارسال ایمیل موقتاً توسط مدیریت غیرفعال شده است. درخواست‌های ایمیل تا زمان فعال‌سازی مجدد پردازش نخواهند شد.
          </span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveEmailSettings} className="mt-6 space-y-6">
        {/* Environment Mode Selector */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <label className="block text-xs font-black text-slate-800 mb-2">
            محیط وب‌سرویس ایمیل:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setEmailIsSandbox(false)}
              className={`p-3.5 rounded-xl border text-right transition-all flex items-start gap-3 cursor-pointer ${
                !emailIsSandbox
                  ? 'bg-teal-50 border-teal-300 text-teal-950 shadow-sm ring-2 ring-teal-500/20'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <span className="text-2xl shrink-0 mt-0.5">🚀</span>
              <div>
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <span>محیط عملیاتی (Production - Resend)</span>
                  {!emailIsSandbox && <span className="bg-teal-600 text-white text-[10px] px-1.5 py-0.5 rounded-md font-sans">انتخاب‌شده</span>}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  ایمیل واقعی به آدرس کاربر از طریق سرورهای Resend ارسال می‌شود. نیازمند وارد کردن کلید API است.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setEmailIsSandbox(true)}
              className={`p-3.5 rounded-xl border text-right transition-all flex items-start gap-3 cursor-pointer ${
                emailIsSandbox
                  ? 'bg-amber-50 border-amber-300 text-amber-950 shadow-sm ring-2 ring-amber-500/20'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <span className="text-2xl shrink-0 mt-0.5">🧪</span>
              <div>
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <span>محیط سندباکس و شبیه‌ساز (Sandbox / Mock)</span>
                  {emailIsSandbox && <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.5 rounded-md font-sans">انتخاب‌شده</span>}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  بدون نیاز به کلید API یا ثبت دامنه! شبیه‌ساز ماک کدهای تایید را ایجاد کرده و روی کنسول لوکال نمایش می‌دهد.
                </p>
              </div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Resend API Key */}
          <div className="md:col-span-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <span>🔑 کلید اختصاصی API رزند (<span className="font-mono text-teal-700" dir="ltr">re_...</span>)</span>
                {!emailIsSandbox ? (
                  isConfigured ? (
                    <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-sans font-bold">
                      کلید فعال عملیاتی
                    </span>
                  ) : (
                    <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-sans font-bold">
                      نیاز به ورود کلید
                    </span>
                  )
                ) : (
                  <span className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded-full font-sans">
                    در حالت سندباکس نیازی به کلید نیست
                  </span>
                )}
              </label>
              <span className="text-[11px] text-slate-400 font-sans">صادر شده از داشبورد resend.com/api-keys</span>
            </div>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                dir="ltr"
                value={resendApiKey}
                onChange={(e) => setResendApiKey(e.target.value)}
                placeholder={emailIsSandbox ? 'در حالت سندباکس خالی رها کنید یا کلید را وارد نمایید...' : 're_xxxxxxxxxxxxxxxxxxxxxxxx...'}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none text-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                title={showApiKey ? 'مخفی کردن کلید' : 'نمایش کلید'}
              >
                {renderEyeIcon(showApiKey)}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              {emailIsSandbox
                ? 'در وضعیت فعلی (سندباکس)، کدهای احراز هویت به صورت خودکار شبیه‌سازی می‌شوند و نیازی به API Key نیست.'
                : 'این کلید برای ارسال واقعی ایمیل‌ها در محیط عملیاتی الزامی است.'}
            </p>
          </div>

          {/* Sender Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              آدرس ایمیل فرستنده (From Address)
            </label>
            <input
              type="email"
              dir="ltr"
              value={emailFromAddress}
              onChange={(e) => setEmailFromAddress(e.target.value)}
              placeholder="no-reply@honarhub.ir"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-mono text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none text-slate-800"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              پیش‌فرض پیشنهادی: <span className="font-mono font-bold text-slate-600">no-reply@honarhub.ir</span>
            </p>
          </div>

          {/* Sender Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              نام نمایشی فرستنده (Sender Name)
            </label>
            <input
              type="text"
              value={emailFromName}
              onChange={(e) => setEmailFromName(e.target.value)}
              placeholder="هنرهاب"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none text-slate-800 font-bold"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              نامی که در اینباکس ایمیل به عنوان فرستنده نمایش داده می‌شود (مثال: <span className="font-bold text-slate-600">هنرهاب</span>).
            </p>
          </div>
        </div>



        {/* Save button */}
        <div className="flex items-center justify-between pt-2">
          {saveSuccess ? (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              ✓ تنظیمات سرویس ایمیل با موفقیت ذخیره شد
            </span>
          ) : <div />}

          <button
            type="submit"
            disabled={saving}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-8 rounded-xl shadow-md shadow-teal-200 transition-all disabled:opacity-50 text-xs sm:text-sm cursor-pointer"
          >
            {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات ایمیل'}
          </button>
        </div>
      </form>

      {/* Live Test Box */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">🧪</span>
            <h4 className="text-sm font-black text-slate-800">تست زنده ارسال ایمیل</h4>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
            emailIsSandbox
              ? 'bg-amber-100 text-amber-900 border border-amber-200'
              : 'bg-teal-100 text-teal-900 border border-teal-200'
          }`}>
            حالت تست: {emailIsSandbox ? '🟡 سندباکس و شبیه‌ساز (بدون کلید)' : '🟢 عملیاتی زنده Resend'}
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          {emailIsSandbox
            ? 'در حالت سندباکس می‌توانید بدون نیاز به کلید، فرآیند را آزمایش کنید و کد تولیدشده را مشاهده فرمایید:'
            : 'یک آدرس ایمیل وارد کنید تا اتصال وب‌سرویس Resend و قالب گرافیکی HTML به صورت زنده آزمایش شود:'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            dir="ltr"
            placeholder="your-email@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl font-mono text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none text-slate-800 bg-white"
          />
          <button
            type="button"
            onClick={handleRunEmailTest}
            disabled={testLoading || !testEmail.trim()}
            className={`px-6 py-2.5 font-bold rounded-xl text-xs sm:text-sm transition-colors shadow-sm disabled:opacity-50 whitespace-nowrap cursor-pointer ${
              emailIsSandbox
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                : 'bg-teal-600 hover:bg-teal-700 text-white'
            }`}
          >
            {testLoading
              ? 'در حال پردازش...'
              : emailIsSandbox
              ? 'ارسال تست در محیط سندباکس (Mock)'
              : 'ارسال ایمیل تستی با Resend'}
          </button>
        </div>

        {testResult && (
          <div className={`mt-4 p-4 rounded-2xl border text-xs leading-relaxed ${
            testResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}>
            <div className="flex items-center gap-2 font-black mb-1">
              <span>{testResult.success ? '✅ نتیجه تست موفق بود:' : '❌ خطا در ارسال تست:'}</span>
              <span>{testResult.message}</span>
            </div>
            {testResult.data && (
              <div className="mt-2 pt-2 border-t border-emerald-200 flex flex-wrap gap-4 text-[11px] font-mono text-emerald-800" dir="ltr">
                {testResult.data.mode && <span>Mode: {testResult.data.mode}</span>}
                {testResult.data.testCode && <span>Generated OTP: {testResult.data.testCode}</span>}
                {testResult.data.id && <span>Message ID: {testResult.data.id}</span>}
                {testResult.data.from && <span>From: {testResult.data.from}</span>}
                {testResult.data.to && <span>To: {testResult.data.to}</span>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
