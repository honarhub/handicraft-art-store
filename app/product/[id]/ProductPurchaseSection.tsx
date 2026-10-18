'use client';

import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import StockNotifyButton from './StockNotifyButton';

export interface PreOrderTier {
  id: string;
  duration: '1_WEEK' | '2_WEEKS' | '1_MONTH' | '3_MONTHS' | '6_MONTHS';
  label: string;
  priceType: 'PERCENTAGE' | 'FIXED';
  value: number;
  calculatedPrice: number;
  active: boolean;
}

interface ProductPurchaseSectionProps {
  product: {
    id: string;
    title: string;
    basePrice: number;
    imageUrl: string;
    artistName: string;
    stockQuantity: number;
    isPreOrderEnabled: boolean;
    preOrderTiers?: any;
    shippingMode?: string;
    status: string;
  };
}

export default function ProductPurchaseSection({ product }: ProductPurchaseSectionProps) {
  const { addToCart, items, removeFromCart, updateQuantity } = useCart();

  // Terms agreement state for pre-orders
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);

  // Parse pre-order settings and capacity limit
  const rawData = typeof product.preOrderTiers === 'string' 
    ? JSON.parse(product.preOrderTiers || '[]') 
    : (product.preOrderTiers || []);

  const rawTiers: PreOrderTier[] = Array.isArray(rawData) 
    ? rawData 
    : (Array.isArray(rawData?.tiers) ? rawData.tiers : []);

  const hasCapacityLimit: boolean = Boolean(rawData?.hasCapacityLimit);
  const maxCapacity: number | null = rawData?.maxCapacity !== undefined && rawData?.maxCapacity !== null && rawData?.maxCapacity !== ''
    ? Number(rawData.maxCapacity)
    : null;

  const activeTiers = rawTiers.filter(t => t.active);
  const isCapacityFull = hasCapacityLimit && maxCapacity !== null && maxCapacity <= 0;
  const hasActivePreOrder = product.isPreOrderEnabled && activeTiers.length > 0 && !isCapacityFull;

  // Selected mode: 'IN_STOCK' (if available) or 'PRE_ORDER'
  const isOutOfStock = product.stockQuantity <= 0;
  const [purchaseMode, setPurchaseMode] = useState<'IN_STOCK' | 'PRE_ORDER'>(
    isOutOfStock && hasActivePreOrder ? 'PRE_ORDER' : 'IN_STOCK'
  );

  const [selectedTierId, setSelectedTierId] = useState<string>(
    activeTiers[0]?.id || ''
  );

  const selectedTier = activeTiers.find(t => t.id === selectedTierId) || activeTiers[0];

  // Current effective price based on selected mode
  const currentPrice = purchaseMode === 'PRE_ORDER' && selectedTier 
    ? (selectedTier.priceType === 'PERCENTAGE' 
        ? Math.round((product.basePrice * selectedTier.value) / 100) 
        : selectedTier.value)
    : product.basePrice;

  // Available stock limit depending on mode
  const maxAvailableStock = purchaseMode === 'PRE_ORDER'
    ? (hasCapacityLimit && maxCapacity !== null ? maxCapacity : 9999)
    : product.stockQuantity;

  // Check cart status
  const cartItem = items.find(item => item.productId === product.id);
  const currentQuantityInCart = cartItem ? cartItem.quantity : 0;
  const isMaxReached = currentQuantityInCart >= maxAvailableStock;

  const handleAddToCart = () => {
    if (purchaseMode === 'IN_STOCK') {
      if (isOutOfStock || isMaxReached) return;
      addToCart({
        productId: product.id,
        title: product.title,
        price: product.basePrice,
        imageUrl: product.imageUrl,
        artistName: product.artistName,
        maxStock: maxAvailableStock,
        isPreOrder: false
      }, 1);
    } else if (purchaseMode === 'PRE_ORDER' && selectedTier) {
      if (isCapacityFull) {
        alert('ظرفیت پذیرش این سفارش ساخت تکمیل شده است.');
        return;
      }
      if (!isTermsAccepted) {
        setShowTermsError(true);
        return;
      }
      addToCart({
        productId: product.id,
        title: `${product.title} (پیش‌سفارش ${selectedTier.label})`,
        price: currentPrice,
        imageUrl: product.imageUrl,
        artistName: product.artistName,
        maxStock: maxAvailableStock,
        isPreOrder: true,
        tierTitle: selectedTier.label,
        deliveryTime: selectedTier.label
      }, 1);
    }
  };

  const handleRemoveFromCart = () => {
    removeFromCart(product.id);
  };

  if (product.status === 'PENDING') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center flex flex-col items-center gap-4">
        <div className="text-amber-600 bg-amber-100 p-3 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-amber-800 mb-1">در انتظار تایید مدیریت</h3>
          <p className="text-sm text-amber-700">این محصول پس از بازبینی توسط ناظران کیفی برای خرید فعال خواهد شد.</p>
        </div>
        <a href={`/support?productId=${product.id}`} className="bg-white hover:bg-amber-100 text-amber-700 font-bold px-6 py-2.5 rounded-xl border border-amber-200 transition-colors text-sm shadow-sm flex items-center gap-2 mt-2">
          ارتباط با پشتیبانی
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Mode Selector Tabs (If both in-stock and pre-order are possible) */}
      {!isOutOfStock && hasActivePreOrder && (
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setPurchaseMode('IN_STOCK')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
              purchaseMode === 'IN_STOCK'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {product.shippingMode === 'HONARHUB_WAREHOUSE' 
              ? 'خرید فوری (موجود در انبار هنرهاب)' 
              : 'خرید فوری (موجود در کارگاه)'}
          </button>
          <button
            type="button"
            onClick={() => setPurchaseMode('PRE_ORDER')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
              purchaseMode === 'PRE_ORDER'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            ✨ سفارش ساخت اختصاصی
          </button>
        </div>
      )}

      {/* Pre-Order Options Box */}
      {purchaseMode === 'PRE_ORDER' && hasActivePreOrder && (
        <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-5 mb-2">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse"></span>
            <h4 className="font-bold text-purple-900 text-sm md:text-base">انتخاب بازه زمانی ساخت و تحویل اختصاصی</h4>
          </div>
          <p className="text-xs text-purple-700 mb-4 leading-relaxed">
            هنرمند این اثر را با عشق به سفارش شما می‌سازد. با انتخاب بازه‌های طولانی‌تر، از قیمت‌های ویژه کارگاهی بهره‌مند شوید:
          </p>

          {hasCapacityLimit && maxCapacity !== null && (
            <div className="mb-3 flex items-center justify-between bg-white/95 border border-purple-200 px-3.5 py-2 rounded-xl text-xs shadow-2xs">
              <span className="font-bold text-purple-900 flex items-center gap-1.5">
                <span>⏱️</span>
                <span>سقف پذیرش سفارش در کارگاه:</span>
              </span>
              <span className="font-black text-purple-700 bg-purple-100/70 px-2.5 py-0.5 rounded-md">
                تنها {maxCapacity.toLocaleString('fa-IR')} سفارش
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {activeTiers.map((tier) => {
              const tierPrice = tier.priceType === 'PERCENTAGE' 
                ? Math.round((product.basePrice * tier.value) / 100) 
                : tier.value;
              const isSelected = selectedTier?.id === tier.id;

              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setSelectedTierId(tier.id)}
                  className={`flex flex-col p-3 rounded-xl border text-right transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-600/30' 
                      : 'bg-white text-slate-700 border-purple-100 hover:border-purple-300'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-black text-sm">{tier.label}</span>
                    {tier.priceType === 'PERCENTAGE' && tier.value < 100 && (
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-purple-800 text-purple-100' : 'bg-purple-100 text-purple-700'}`}>
                        {100 - tier.value}٪ تخفیف ساخت
                      </span>
                    )}
                  </div>
                  <div className={`text-xs font-semibold ${isSelected ? 'text-purple-100' : 'text-slate-500'}`}>
                    مبلغ نهایی: <span className="font-bold text-sm">{tierPrice.toLocaleString('fa-IR')}</span> تومان
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Price Box */}
      {(!isOutOfStock || purchaseMode === 'PRE_ORDER') ? (
        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="flex flex-col">
            <span className="text-slate-500 text-xs font-bold">
              {purchaseMode === 'PRE_ORDER' ? 'مبلغ پیش‌سفارش با تحویل انتخابی:' : 'قیمت نهایی اثر:'}
            </span>
            {purchaseMode === 'PRE_ORDER' && selectedTier && (
              <span className="text-purple-600 text-[11px] font-bold mt-0.5">
                {selectedTier.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {purchaseMode === 'PRE_ORDER' && product.basePrice > 0 && currentPrice !== product.basePrice && (
              <div className="text-base md:text-lg font-bold text-slate-400 line-through">
                {product.basePrice.toLocaleString('fa-IR')} <span className="text-xs">تومان</span>
              </div>
            )}
            <div className="text-2xl md:text-3xl font-black text-emerald-600">
              {currentPrice.toLocaleString('fa-IR')} <span className="text-sm font-bold text-emerald-800/60">تومان</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center bg-rose-50 p-4 rounded-2xl border border-rose-100">
          <div className="text-rose-600 font-black text-base w-full text-center flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span> در حال حاضر ناموجود
          </div>
        </div>
      )}

      {/* Actions */}
      {(!isOutOfStock || (purchaseMode === 'PRE_ORDER' && hasActivePreOrder)) ? (
        <>
          {currentQuantityInCart > 0 ? (
            <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Stepper with +/- and Trash */}
              <div className="flex items-center justify-between bg-slate-50 border-2 border-slate-200 rounded-2xl p-1.5 sm:w-44 shadow-2xs">
                {/* Increase Button (Left in RTL) */}
                <button
                  type="button"
                  onClick={() => updateQuantity(product.id, currentQuantityInCart + 1)}
                  disabled={currentQuantityInCart >= maxAvailableStock}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 shadow-xs disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-700 transition-all cursor-pointer disabled:cursor-not-allowed"
                  title="افزایش تعداد"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>

                {/* Quantity Number */}
                <div className="flex flex-col items-center justify-center px-2 select-none">
                  <span className="font-black text-lg text-slate-800 leading-none">
                    {currentQuantityInCart.toLocaleString('fa-IR')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold mt-0.5">در سبد خرید</span>
                </div>

                {/* Decrease Button: Trash if 1, Minus if > 1 (Right in RTL) */}
                {currentQuantityInCart === 1 ? (
                  <button
                    type="button"
                    onClick={() => removeFromCart(product.id)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 shadow-xs transition-all cursor-pointer"
                    title="حذف از سبد خرید"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => updateQuantity(product.id, currentQuantityInCart - 1)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white hover:bg-slate-100 text-slate-700 shadow-xs transition-all cursor-pointer"
                    title="کاهش تعداد"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                )}
              </div>

              {/* View in Cart Button */}
              <a 
                href="/cart" 
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-5 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-98"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                <span>مشاهده در سبد خرید</span>
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Terms Agreement Checkbox for Pre-Orders */}
              {purchaseMode === 'PRE_ORDER' && (
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  showTermsError 
                    ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200' 
                    : 'bg-purple-50/70 border-purple-200'
                }`}>
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isTermsAccepted}
                      onChange={(e) => {
                        setIsTermsAccepted(e.target.checked);
                        if (showTermsError) setShowTermsError(false);
                      }}
                      className="mt-0.5 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-700 leading-relaxed">
                      شرایط و قوانین سفارش ساخت اختصاصی را مطالعه نموده و می‌پذیرم.
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowTermsModal(true);
                        }}
                        className="text-purple-700 font-bold underline decoration-purple-300 underline-offset-4 hover:text-purple-900 mr-1 cursor-pointer inline-block"
                      >
                        (مشاهده قوانین)
                      </button>
                    </span>
                  </label>
                  {showTermsError && (
                    <div className="text-[11px] font-bold text-rose-600 mt-2 flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                      <span>جهت ثبت پیش‌سفارش، لطفاً ابتدا تیک پذیرش قوانین را فعال فرمایید.</span>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleAddToCart}
                className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-lg active:scale-98 flex items-center justify-center gap-2 text-white cursor-pointer ${
                  purchaseMode === 'PRE_ORDER'
                    ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/25 ring-2 ring-purple-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                <span>{purchaseMode === 'PRE_ORDER' ? 'ثبت و افزودن پیش‌سفارش به سبد' : 'افزودن به سبد خرید'}</span>
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <StockNotifyButton productId={product.id} />
        </div>
      )}

      {/* Pre-Order Terms Modal */}
      {showTermsModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setShowTermsModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-purple-700 font-black text-base">
                <span className="text-xl">📜</span>
                <span>قوانین و شرایط سفارش ساخت (پیش‌سفارش)</span>
              </div>
              <button 
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-2xl flex items-start gap-2.5 font-medium">
                <span className="text-lg shrink-0">⏱️</span>
                <div>
                  <strong className="font-bold text-amber-950 block mb-1">تفکیک زمان ساخت از زمان ارسال محصول:</strong>
                  بازه زمانی انتخابی شما (مثلاً ۱ هفته، ۱ ماه و...) صرفاً مربوط به مدت زمان لازم جهت تولید، آماده‌سازی و خلق دستی اثر توسط کارگاه هنرمند است. زمان ارسال پستی یا ترابری پس از پایان دوره ساخت آغاز می‌شود و زمان ساخت شامل زمان ارسال مرسوله نمی‌باشد.
                </div>
              </div>

              <div className="space-y-3 pr-1">
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 font-black mt-0.5">•</span>
                  <div>
                    <strong className="font-bold text-slate-800">اصالت و ماهیت صنایع دستی:</strong>
                    آثار سفارشی به صورت تک به تک و با دست توسط هنرمند بازآفرینی می‌شوند؛ لذا وجود جزئیات منحصر‌به‌فرد یا تمایزهای بسیار اندک در بافت اثر نسبت به تصاویر، ویژگی طبیعی و نشانه اصالت هنر دست‌ساز است.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-purple-600 font-black mt-0.5">•</span>
                  <div>
                    <strong className="font-bold text-slate-800">تعهد ساخت و عدم امکان لغو یک‌طرفه:</strong>
                    به دلیل اختصاص مواد اولیه، زمان و انرژی هنرمند، پس از شروع فرآیند ساخت، امکان انصراف یا استرداد وجه یک‌طرفه وجود ندارد.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-purple-600 font-black mt-0.5">•</span>
                  <div>
                    <strong className="font-bold text-slate-800">ضمانت اصالت و سلامت فیزیکی توسط هنرهاب:</strong>
                    پلتفرم هنرهاب سلامت فیزیکی اثر در هنگام تحویل و اصالت مواد اولیه به‌کار رفته را ۱۰۰٪ تضمین می‌نماید.
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-slate-500 text-[11px]">
                برای مطالعه کلیه قوانین و حقوق متقابل، می‌توانید <a href="/terms" target="_blank" className="text-purple-600 underline font-bold">قوانین و مقررات عمومی سایت</a> را نیز بررسی فرمایید.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsTermsAccepted(true);
                  setShowTermsError(false);
                  setShowTermsModal(false);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-colors shadow-md shadow-purple-600/20 cursor-pointer"
              >
                قوانین را مطالعه کردم و می‌پذیرم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
