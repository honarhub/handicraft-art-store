'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';

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
  
  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'crypto'>('bank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cryptoAddress, setCryptoAddress] = useState('');
  
  useEffect(() => {
    setMounted(true);
    // Generate a dummy crypto address for simulation
    setCryptoAddress('0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join(''));
  }, []);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" dir="rtl">
        <div className="bg-white p-8 rounded-3xl shadow-sm text-center max-w-md w-full">
          <div className="text-5xl mb-4">🛒</div>
          <h2 className="text-xl font-bold mb-4">سبد خرید شما خالی است</h2>
          <a href="/products" className="block w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors">
            بازگشت به فروشگاه
          </a>
        </div>
      </div>
    );
  }

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="min-h-screen bg-slate-50 font-sans py-12 px-6" dir="rtl">
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
                <form onSubmit={handleShippingSubmit} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    اطلاعات گیرنده
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">نام و نام خانوادگی</label>
                      <input type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none" placeholder="مثال: علی رضایی" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">شماره موبایل</label>
                      <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none" placeholder="0912..." dir="ltr" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-2">آدرس دقیق پستی</label>
                      <textarea required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none resize-none h-24" placeholder="نام استان، شهر، خیابان، کوچه، پلاک، واحد"></textarea>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-2">کد پستی (۱۰ رقمی)</label>
                      <input type="text" required value={formData.postalCode} onChange={e => setFormData({...formData, postalCode: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none" placeholder="1234567890" dir="ltr" />
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
                          <div className="text-xs text-slate-500 mt-1">پرداخت امن با تمامی کارت‌های عضو شتاب</div>
                        </div>
                        <div className="text-2xl opacity-60">💳</div>
                      </div>
                    </label>

                    {/* Crypto Gateway */}
                    <label className={`block cursor-pointer border-2 rounded-2xl p-4 transition-all ${paymentMethod === 'crypto' ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <div className="flex items-center gap-4">
                        <input type="radio" name="payment" value="crypto" checked={paymentMethod === 'crypto'} onChange={() => setPaymentMethod('crypto')} className="w-5 h-5 text-indigo-600 focus:ring-indigo-500" />
                        <div className="flex-1">
                          <div className="font-bold text-slate-800">پرداخت رمزارزی (Crypto)</div>
                          <div className="text-xs text-slate-500 mt-1">پشتیبانی از USDT (Tether) بر بستر TRC20</div>
                        </div>
                        <div className="text-2xl opacity-60">🪙</div>
                      </div>
                    </label>
                  </div>

                  {paymentMethod === 'crypto' && (
                    <div className="bg-indigo-900 text-white p-6 rounded-2xl mb-8 animate-in fade-in">
                      <div className="text-indigo-200 text-sm mb-2 font-medium">لطفا معادل دلاری مبلغ را به آدرس زیر واریز کنید:</div>
                      <div className="font-mono text-sm sm:text-base break-all bg-indigo-950 p-3 rounded-xl border border-indigo-800 text-emerald-400 select-all mb-4">
                        {cryptoAddress}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-indigo-300">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        در حال بررسی شبکه برای تایید واریز... (شبیه‌سازی)
                      </div>
                    </div>
                  )}

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
                  <div key={item.productId} className="flex items-center gap-3">
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
    </div>
  );
}
