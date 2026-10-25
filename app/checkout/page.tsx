'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import SiteHeader from '@/app/components/SiteHeader';
import SiteFooter from '@/app/components/SiteFooter';

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // 1: Shipping, 2: Payment
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    postalCode: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'bank'>('bank');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const toEnglishDigits = (str: string) => {
    return str
      .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
      .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50" dir="rtl">
        <SiteHeader />
        <main className="flex-1 w-full flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm text-center max-w-md w-full">
            <div className="text-5xl mb-4">🛒</div>
            <h2 className="text-xl font-bold mb-4">سبد خرید شما خالی است</h2>
            <a href="/products" className="block w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors">
              بازگشت به فروشگاه
            </a>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'لطفاً نام و نام خانوادگی را وارد کنید.';
    }

    const cleanPhone = toEnglishDigits(formData.phone).replace(/\D/g, '');
    if (!cleanPhone) {
      newErrors.phone = 'لطفاً شماره موبایل را وارد کنید.';
    } else if (!/^09\d{9}$/.test(cleanPhone)) {
      newErrors.phone = 'شماره موبایل باید ۱۱ رقم بوده و با ۰۹ شروع شود.';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'لطفاً آدرس دقیق پستی را وارد کنید.';
    }

    const cleanPostal = toEnglishDigits(formData.postalCode).replace(/\D/g, '');
    if (!cleanPostal) {
      newErrors.postalCode = 'لطفاً کد پستی را وارد کنید.';
    } else if (cleanPostal.length !== 10) {
      newErrors.postalCode = 'کد پستی باید دقیقاً ۱۰ رقم باشد.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setFormData(prev => ({
      ...prev,
      phone: cleanPhone,
      postalCode: cleanPostal
    }));
    setStep(2);
  };

  const handlePayment = () => {
    setIsProcessing(true);
    // Simulate API call and payment processing
    setTimeout(() => {
      clearCart();
      const orderId = 'ORD-' + Math.floor(Math.random() * 1000000);
      window.location.href = `/checkout/success?orderId=${orderId}`;
    }, 2500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans" dir="rtl">
      <SiteHeader />
      <main className="flex-1 w-full py-12 px-6">
        <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <a href="/cart" className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            بازگشت به سبد خرید
          </a>
          <h1 className="text-2xl font-black text-slate-800">تکمیل سفارش</h1>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center mb-10">
          <div className="flex items-center w-full max-w-sm">
            <div className={`flex flex-col items-center relative z-10`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'bg-slate-200 text-slate-500'}`}>1</div>
              <div className="absolute top-12 whitespace-nowrap text-xs font-bold text-slate-600">اطلاعات ارسال</div>
            </div>
            <div className={`flex-1 h-1 mx-2 rounded-full ${step >= 2 ? 'bg-emerald-600' : 'bg-slate-200'}`}></div>
            <div className={`flex flex-col items-center relative z-10`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'bg-slate-200 text-slate-500'}`}>2</div>
              <div className="absolute top-12 whitespace-nowrap text-xs font-bold text-slate-600">پرداخت</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 mt-16">
          <div className="lg:w-2/3">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8">
              
              {step === 1 ? (
                // Step 1: Shipping Info
                <form onSubmit={handleShippingSubmit} noValidate className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    اطلاعات گیرنده
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-bold text-slate-700 mb-2">
                        نام و نام خانوادگی <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input 
                        type="text" 
                        id="fullName"
                        name="name"
                        autoComplete="name"
                        value={formData.fullName} 
                        onChange={e => {
                          setFormData({...formData, fullName: e.target.value});
                          if (errors.fullName) setErrors({...errors, fullName: ''});
                        }} 
                        className={`w-full px-4 py-3 rounded-xl border ${errors.fullName ? 'border-red-400 bg-red-50/30' : 'border-slate-300'} focus:border-emerald-500 outline-none transition-all`} 
                        placeholder="مثال: علی رضایی" 
                      />
                      {errors.fullName && (
                        <p className="text-red-500 text-xs font-bold mt-1.5 text-right">{errors.fullName}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-bold text-slate-700 mb-2">
                        شماره موبایل <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input 
                        type="tel" 
                        id="phone"
                        name="tel"
                        autoComplete="tel"
                        value={formData.phone} 
                        onChange={e => {
                          const val = toEnglishDigits(e.target.value).replace(/\D/g, '').slice(0, 11);
                          setFormData({...formData, phone: val});
                          if (errors.phone) setErrors({...errors, phone: ''});
                        }} 
                        onKeyDown={e => {
                          // Allow control keys like backspace, tab, enter, delete, arrows
                          if (['Backspace', 'Tab', 'Enter', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
                          if (e.ctrlKey || e.metaKey) return;
                          if (!/[\d۰-۹٠-٩]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        className={`w-full px-4 py-3 rounded-xl border ${errors.phone ? 'border-red-400 bg-red-50/30' : 'border-slate-300'} focus:border-emerald-500 outline-none text-left font-mono transition-all`} 
                        placeholder="09123456789" 
                        dir="ltr" 
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-xs font-bold mt-1.5 text-right">{errors.phone}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="address" className="block text-sm font-bold text-slate-700 mb-2">
                        آدرس دقیق پستی <span className="text-red-500 font-bold">*</span>
                      </label>
                      <textarea 
                        id="address"
                        name="street-address"
                        autoComplete="street-address"
                        value={formData.address} 
                        onChange={e => {
                          setFormData({...formData, address: e.target.value});
                          if (errors.address) setErrors({...errors, address: ''});
                        }} 
                        className={`w-full px-4 py-3 rounded-xl border ${errors.address ? 'border-red-400 bg-red-50/30' : 'border-slate-300'} focus:border-emerald-500 outline-none resize-none h-24 transition-all`} 
                        placeholder="نام استان، شهر، خیابان، کوچه، پلاک، واحد"
                      ></textarea>
                      {errors.address && (
                        <p className="text-red-500 text-xs font-bold mt-1.5 text-right">{errors.address}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="postalCode" className="block text-sm font-bold text-slate-700 mb-2">
                        کد پستی (۱۰ رقمی) <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input 
                        type="text" 
                        id="postalCode"
                        name="postal-code"
                        autoComplete="postal-code"
                        value={formData.postalCode} 
                        onChange={e => {
                          const val = toEnglishDigits(e.target.value).replace(/\D/g, '').slice(0, 10);
                          setFormData({...formData, postalCode: val});
                          if (errors.postalCode) setErrors({...errors, postalCode: ''});
                        }} 
                        onKeyDown={e => {
                          if (['Backspace', 'Tab', 'Enter', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
                          if (e.ctrlKey || e.metaKey) return;
                          if (!/[\d۰-۹٠-٩]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        className={`w-full px-4 py-3 rounded-xl border ${errors.postalCode ? 'border-red-400 bg-red-50/30' : 'border-slate-300'} focus:border-emerald-500 outline-none text-left font-mono transition-all`} 
                        placeholder="1234567890" 
                        dir="ltr" 
                      />
                      {errors.postalCode && (
                        <p className="text-red-500 text-xs font-bold mt-1.5 text-right">{errors.postalCode}</p>
                      )}
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-800 transition-colors">
                    تایید و ادامه به مرحله پرداخت
                  </button>
                </form>
              ) : (
                // Step 2: Payment
                <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                      انتخاب روش پرداخت
                    </h2>
                    <button onClick={() => setStep(1)} className="text-sm font-bold text-slate-400 hover:text-slate-600">اصلاح آدرس</button>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    {/* Bank Gateway */}
                    <label className={`block cursor-pointer border-2 rounded-2xl p-4 transition-all ${paymentMethod === 'bank' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <div className="flex items-center gap-4">
                        <input type="radio" name="payment" value="bank" checked={paymentMethod === 'bank'} onChange={() => setPaymentMethod('bank')} className="w-5 h-5 text-emerald-600 focus:ring-emerald-500" />
                        <div className="flex-1">
                          <div className="font-bold text-slate-800">درگاه پرداخت بانکی (شتاب)</div>
                          <div className="text-xs text-slate-500 mt-1">پرداخت امن آنلاین با تمامی کارت‌های عضو شتاب</div>
                        </div>
                        <div className="text-2xl opacity-80">💳</div>
                      </div>
                    </label>

                    {/* Crypto Gateway (Disabled) */}
                    <div className="border-2 border-slate-200 bg-slate-50/70 rounded-2xl p-4 opacity-50 cursor-not-allowed select-none">
                      <div className="flex items-center gap-4">
                        <input type="radio" disabled name="payment" value="crypto" className="w-5 h-5 cursor-not-allowed" />
                        <div className="flex-1">
                          <div className="font-bold text-slate-500 flex items-center gap-2">
                            <span>پرداخت رمزارزی (Crypto)</span>
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">به زودی - موقتاً غیرفعال</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1">پشتیبانی از USDT (Tether) بر بستر TRC20</div>
                        </div>
                        <div className="text-2xl opacity-40">🪙</div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handlePayment} 
                    disabled={isProcessing}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3"
                  >
                    {isProcessing ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        درحال انتقال به درگاه...
                      </>
                    ) : (
                      <>پرداخت مبلغ {totalPrice.toLocaleString('fa-IR')} تومان</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:w-1/3">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sticky top-8">
              <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-4">فاکتور شما</h3>
              <div className="space-y-3 mb-6 max-h-48 overflow-y-auto pr-2">
                {items.map(item => (
                  <div key={item.id || `${item.productId}_${item.isPreOrder ? item.tierTitle : 'instock'}`} className="flex items-center gap-3">
                    <img src={item.imageUrl} alt={item.title} className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-800 line-clamp-1">{item.title}</div>
                      <div className="text-xs text-slate-500">{item.quantity} عدد</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-lg">
                <span className="font-bold text-slate-800">جمع کل:</span>
                <span className="font-black text-emerald-600">{totalPrice.toLocaleString('fa-IR')} <span className="text-xs">تومان</span></span>
              </div>
            </div>
          </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
