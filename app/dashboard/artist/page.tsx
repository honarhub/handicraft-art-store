'use client';

import React, { useState } from 'react';

export default function ArtistDashboard() {
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  const [aiFallbackError, setAiFallbackError] = useState(false);
  const [oldPrice, setOldPrice] = useState(100000); // به عنوان نمونه برای تست هشدار قیمت
  const [newPrice, setNewPrice] = useState('');
  const [showPriceWarning, setShowPriceWarning] = useState(false);

  // شبیه‌سازی تلاش برای پردازش فایل با هوش مصنوعی
  const handleAiUpload = (e: React.FormEvent) => {
    e.preventDefault();
    // در اینجا اگر وب‌سرویس پایتون قطع باشد ارور برمی‌گرداند
    // برای نمایش دمو به کاربر، مستقیماً Fallback را اجرا می‌کنیم:
    setAiFallbackError(true);
    setTimeout(() => {
      setActiveTab('manual'); // هدایت خودکار به فرم دستی
    }, 3000);
  };

  // منطق بررسی تغییرات فاحش قیمت (بیش از 30 درصد)
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewPrice(val);
    if (!val) {
      setShowPriceWarning(false);
      return;
    }
    const numericNewPrice = parseInt(val, 10);
    const diffPercentage = Math.abs((numericNewPrice - oldPrice) / oldPrice) * 100;
    
    if (diffPercentage > 30) {
      setShowPriceWarning(true);
    } else {
      setShowPriceWarning(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showPriceWarning) {
      const confirm = window.confirm('هشدار: تغییر قیمت شما بسیار زیاد است! آیا از ثبت این تغییر اطمینان کامل دارید؟');
      if (!confirm) return;
    }
    alert('محصول با موفقیت ثبت شد و در انتظار تایید ادمین کل قرار گرفت.');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* هدر تب‌ها */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${activeTab === 'ai' ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            ✨ ثبت سریع با هوش مصنوعی (ویس/فایل)
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${activeTab === 'manual' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            📝 ثبت فرم دستی (ساده)
          </button>
        </div>

        <div className="p-6 md:p-8">
          {activeTab === 'ai' ? (
            <div className="space-y-6 text-center">
              <h2 className="text-xl font-bold text-gray-800">آپلود صدای شما یا فایل متنی</h2>
              <p className="text-gray-500 text-sm">
                کافیست یک پیام صوتی کوتاه ضبط کنید و ویژگی‌های محصول (نام، رنگ، سایز و قیمت پیشنهادی) را بگویید. هوش مصنوعی فرم را برای شما پر می‌کند!
              </p>
              
              <form onSubmit={handleAiUpload} className="mt-8">
                <div className="border-2 border-dashed border-emerald-300 bg-emerald-50 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-100 transition-colors">
                  <span className="text-4xl mb-4">🎙️ / 📄</span>
                  <span className="text-emerald-800 font-medium">برای انتخاب فایل یا شروع ضبط کلیک کنید</span>
                </div>
                <button type="submit" className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all">
                  پردازش هوشمند
                </button>
              </form>

              {aiFallbackError && (
                <div className="mt-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm animate-pulse">
                  ⚠️ متاسفانه در حال حاضر سرور هوش مصنوعی در دسترس نیست. <br/>
                  شما در حال انتقال به فرم دستی هستید تا کسب‌وکارتان متوقف نشود...
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">نام اثر هنری شما</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="مثلاً: بشقاب میناکاری طرح اسلیمی" required />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">توضیح کوتاه</label>
                <textarea className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" rows={3} placeholder="جنس، ابعاد و داستان پشت این اثر..." required></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">قیمت (تومان)</label>
                <p className="text-xs text-gray-500 mb-2">قیمت قبلی در سیستم: {oldPrice.toLocaleString()} تومان</p>
                <input 
                  type="number" 
                  value={newPrice}
                  onChange={handlePriceChange}
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-colors ${showPriceWarning ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`} 
                  placeholder="قیمت جدید را وارد کنید" 
                  required 
                />
                
                {showPriceWarning && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
                    <span className="text-xl">⚠️</span>
                    <div>
                      <strong>توجه! تغییر قیمت فاحش</strong>
                      <p>مبلغ وارد شده بیش از ۳۰٪ با قیمت قبلی تفاوت دارد. لطفاً عدد را مجدداً بررسی کنید تا از خطای تایپی جلوگیری شود.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md">
                  ثبت نهایی و ارسال برای بررسی
                </button>
                <p className="text-center text-xs text-gray-400 mt-4">
                  * این محصول پس از تایید مدیریت کل در سایت منتشر خواهد شد.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
