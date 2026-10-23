import React from 'react';
import SiteHeader from '@/app/components/SiteHeader';
import SiteFooter from '@/app/components/SiteFooter';

export const metadata = {
  title: 'ورود و ثبت‌نام کاربران | هنر هاب',
  description: 'ورود و عضویت در پلتفرم خرید مستقیم صنایع دستی هنرهاب',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800" dir="rtl">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-600 shadow-inner">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>

          <h1 className="text-2xl font-black text-slate-900 mb-3">
            ورود و عضویت کاربران
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed mb-8">
            بخش حساب کاربری و باشگاه خریداران به زودی در فاز بعدی پلتفرم هنرهاب فعال خواهد شد. شما هم‌اکنون می‌توانید بدون نیاز به ثبت‌نام، آثار را مرور کرده و به سبد خرید خود اضافه نمایید.
          </p>

          <div className="space-y-3">
            <a
              href="/products"
              className="block w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition-all shadow-md"
            >
              مشاهده گالری آثار
            </a>

            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-2">هنرمند هستید و قصد فروش آثار دارید؟</p>
              <a
                href="/artist-panel/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <span>ورود به پنل اختصاصی هنرمندان</span>
                <svg className="w-3.5 h-3.5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
