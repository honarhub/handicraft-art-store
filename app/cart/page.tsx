'use client';

import React, { useState, useEffect } from 'react';
import { useCart, getCartItemId } from '../context/CartContext';
import CartIcon from '../components/CartIcon';
import SiteHeader from '@/app/components/SiteHeader';
import SiteFooter from '@/app/components/SiteFooter';

export default function CartPage() {
  const { items, addToCart, removeFromCart, updateQuantity, totalItems, totalPrice } = useCart();
  const [removedItems, setRemovedItems] = useState<{ [itemKey: string]: { item: any, timeLeft: number, isHovered?: boolean } }>({});

  useEffect(() => {
    const timer = setInterval(() => {
      setRemovedItems(prev => {
        let changed = false;
        const next = { ...prev };
        for (const id in next) {
          if (next[id].isHovered) continue; // توقف شمارش هنگام هاور
          if (next[id].timeLeft <= 1) {
            delete next[id];
            changed = true;
          } else {
            next[id] = { ...next[id], timeLeft: next[id].timeLeft - 1 };
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRemoveRequest = (item: any) => {
    const itemKey = getCartItemId(item);
    removeFromCart(itemKey);
    setRemovedItems(prev => ({
      ...prev,
      [itemKey]: { item, timeLeft: 5, isHovered: false }
    }));
  };

  const handleUndo = (itemKey: string) => {
    const removed = removedItems[itemKey];
    if (removed) {
      addToCart(removed.item, removed.item.quantity);
      setRemovedItems(prev => {
        const next = { ...prev };
        delete next[itemKey];
        return next;
      });
    }
  };

  const handleHover = (itemKey: string, isHovered: boolean) => {
    setRemovedItems(prev => {
      if (!prev[itemKey]) return prev;
      return {
        ...prev,
        [itemKey]: { ...prev[itemKey], isHovered }
      };
    });
  };

  const handleQuantityDecrease = (item: any) => {
    const itemKey = getCartItemId(item);
    if (item.quantity <= 1) {
      handleRemoveRequest(item);
    } else {
      updateQuantity(itemKey, item.quantity - 1);
    }
  };

  // Persistent order of keys so removed items stay in place
  const [orderedKeys, setOrderedKeys] = useState<string[]>([]);

  useEffect(() => {
    setOrderedKeys(prev => {
      const activeKeys = items.map(item => getCartItemId(item));
      const kept = prev.filter(k => activeKeys.includes(k) || Boolean(removedItems[k]));
      const added = activeKeys.filter(k => !kept.includes(k));
      return [...kept, ...added];
    });
  }, [items, removedItems]);

  const isCartEffectivelyEmpty = items.length === 0 && Object.keys(removedItems).length === 0;

  const displayKeys = orderedKeys.length > 0 
    ? orderedKeys 
    : items.map(item => getCartItemId(item));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans" dir="rtl">
      <SiteHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto py-12 px-6 md:px-12">
        <h1 className="text-3xl font-black text-slate-900 mb-8">سبد خرید شما</h1>

        {isCartEffectivelyEmpty ? (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="text-6xl mb-6">🛒</div>
            <h2 className="text-2xl font-bold text-slate-700 mb-4">سبد خرید شما خالی است</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">هیچ محصولی در سبد خرید شما وجود ندارد. به گالری بروید و از آثار هنرمندان دیدن کنید.</p>
            <a href="/products" className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-emerald-600/20">
              گشت و گذار در گالری
            </a>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items */}
            <div className="lg:w-2/3 flex flex-col gap-4">
              {displayKeys.map((itemKey) => {
                const item = items.find(i => getCartItemId(i) === itemKey);
                const removed = removedItems[itemKey];

                if (item) {
                  return (
                    <div key={itemKey} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-col sm:flex-row gap-6 items-center">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      
                      <div className="flex-1 w-full">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <a href={`/product/${item.productId}`} className="text-lg font-bold text-slate-800 hover:text-emerald-600 transition-colors line-clamp-1">
                              {item.title}
                            </a>
                            <div className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                              <span>اثر: {item.artistName}</span>
                              {item.isPreOrder ? (
                                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                                  ⏱️ پیش‌سفارش ساخت ({item.tierTitle || 'سفارشی'})
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                  ⚡ خرید فوری (موجود در کارگاه/انبار)
                                </span>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={() => handleRemoveRequest(item)}
                            className="text-slate-400 hover:text-red-500 p-2 transition-colors rounded-lg hover:bg-red-50 cursor-pointer"
                            title="حذف از سبد"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                          </button>
                        </div>

                        <div className="flex flex-wrap sm:flex-nowrap justify-between items-end sm:items-center mt-6 gap-4">
                          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-1 w-fit">
                            <button 
                              onClick={() => handleQuantityDecrease(item)}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-colors cursor-pointer ${
                                item.quantity === 1 
                                  ? 'text-rose-500 hover:text-rose-600 hover:bg-rose-50' 
                                  : 'text-slate-600'
                              }`}
                              title={item.quantity === 1 ? 'حذف از سبد خرید' : 'کاهش تعداد'}
                            >
                              {item.quantity === 1 ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                              )}
                            </button>
                            <span className="font-bold text-slate-800 w-6 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                              disabled={item.quantity >= item.maxStock}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            </button>
                          </div>
                          
                          <div className="text-left font-black text-emerald-600 text-lg sm:text-xl">
                            {(item.price * item.quantity).toLocaleString('fa-IR')} <span className="text-xs font-bold text-emerald-800/60">تومان</span>
                          </div>
                        </div>
                        {item.quantity >= item.maxStock && (
                           <div className="text-xs text-orange-500 mt-2 font-medium">حداکثر سقف مجاز انتخاب شده است</div>
                        )}
                      </div>
                    </div>
                  );
                }

                if (removed) {
                  const { item: removedItem, isHovered } = removed;
                  return (
                    <div key={itemKey} className="bg-red-50/50 rounded-2xl border border-red-100 p-4 flex flex-col sm:flex-row gap-4 items-center justify-between animate-in fade-in duration-300 relative overflow-hidden">
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="w-12 h-12 rounded-lg overflow-hidden opacity-50 grayscale flex-shrink-0">
                           <img src={removedItem.imageUrl} alt={removedItem.title} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="text-slate-500 line-through text-sm font-bold">{removedItem.title}</div>
                          <div className="text-red-500 font-bold text-xs mt-0.5">از سبد خرید حذف شد</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                        <button 
                          onClick={() => handleUndo(itemKey)}
                          onMouseEnter={() => handleHover(itemKey, true)}
                          onMouseLeave={() => handleHover(itemKey, false)}
                          className="group relative bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-3 shadow-sm overflow-hidden cursor-pointer"
                        >
                          <div className="relative w-6 h-6 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90 text-red-100" viewBox="0 0 36 36">
                              <circle cx="18" cy="18" r="16" fill="none" className="stroke-current" strokeWidth="4" />
                            </svg>
                            <svg className="w-full h-full -rotate-90 absolute top-0 left-0 text-red-500" viewBox="0 0 36 36">
                              <circle 
                                cx="18" cy="18" r="16" fill="none" 
                                className="stroke-current transition-all" 
                                strokeWidth="4" strokeDasharray="100" strokeDashoffset="0" 
                                style={{ 
                                  animation: 'dash 5s linear forwards',
                                  animationPlayState: isHovered ? 'paused' : 'running'
                                }} 
                              />
                            </svg>
                            <style>{`
                              @keyframes dash {
                                to {
                                  stroke-dashoffset: 100;
                                }
                              }
                            `}</style>
                          </div>
                          بازگرداندن
                        </button>
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:w-1/3">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 sticky top-28">
                <h2 className="text-xl font-bold text-slate-800 mb-6">خلاصه سفارش</h2>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-slate-600">
                    <span>مجموع اقلام ({totalItems})</span>
                    <span className="font-bold">{totalPrice.toLocaleString('fa-IR')} تومان</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>هزینه ارسال</span>
                    <span className="font-bold text-emerald-600">رایگان (جشنواره)</span>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-end">
                    <span className="text-lg font-bold text-slate-800">مبلغ قابل پرداخت</span>
                    <div className="text-left">
                      <div className="text-2xl font-black text-emerald-600">{totalPrice.toLocaleString('fa-IR')}</div>
                      <div className="text-xs font-bold text-slate-500">تومان</div>
                    </div>
                  </div>
                </div>

                <a href="/checkout" className={`block w-full text-center py-4 rounded-xl font-bold text-lg transition-transform shadow-xl ${items.length > 0 ? 'bg-slate-900 hover:bg-slate-800 text-white hover:-translate-y-0.5 shadow-slate-900/20' : 'bg-slate-200 text-slate-400 cursor-not-allowed pointer-events-none'}`}>
                  تکمیل سفارش و پرداخت
                </a>
                <div className="mt-4 text-center flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  پرداخت امن با درگاه‌های معتبر و رمزارز
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
