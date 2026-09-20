import React from 'react';

export default function SiteFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-16 px-6 md:px-12 border-t border-slate-800" dir="rtl">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div className="md:col-span-2">
          <div className="text-3xl font-black tracking-tighter text-white mb-6">
            هنرآفرین <span className="text-emerald-500">.</span>
          </div>
          <p className="text-slate-400 leading-relaxed max-w-sm">
            بستری تخصصی برای هنرمندان اصیل ایرانی تا آثار دست‌ساز و بی‌بدیل خود را بدون واسطه به دست علاقه‌مندان برسانند.
          </p>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6 tracking-wide">دسترسی سریع</h4>
          <ul className="space-y-4 font-medium text-sm">
            <li><a href="/products" className="hover:text-emerald-400 transition-colors">گالری آثار</a></li>
            <li><a href="/artist-panel/login" className="hover:text-emerald-400 transition-colors">ورود هنرمندان</a></li>
            <li><a href="/about" className="hover:text-emerald-400 transition-colors">درباره ما</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6 tracking-wide">خدمات مشتریان</h4>
          <ul className="space-y-4 font-medium text-sm">
            <li><a href="/support" className="hover:text-emerald-400 transition-colors">ارتباط با پشتیبانی</a></li>
            <li><a href="/terms" className="hover:text-emerald-400 transition-colors">قوانین و مقررات</a></li>
            <li><a href="/admin/login" className="hover:text-emerald-400 transition-colors">ورود مدیران</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium">
        <p>© {new Date().getFullYear()} پلتفرم اختصاصی هنرآفرین. تمامی حقوق محفوظ است.</p>
        <div className="flex gap-4">
          <span className="opacity-50">توسعه یافته با ❤️ برای هنر ایران</span>
        </div>
      </div>
    </footer>
  );
}
