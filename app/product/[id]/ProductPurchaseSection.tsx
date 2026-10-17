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
    status: string;
  };
}

export default function ProductPurchaseSection({ product }: ProductPurchaseSectionProps) {
  const { addToCart, items, removeFromCart } = useCart();

  // Parse active pre-order tiers
  const rawTiers: PreOrderTier[] = Array.isArray(product.preOrderTiers) 
    ? product.preOrderTiers 
    : (typeof product.preOrderTiers === 'string' ? JSON.parse(product.preOrderTiers || '[]') : []);

  const activeTiers = rawTiers.filter(t => t.active);
  const hasActivePreOrder = product.isPreOrderEnabled && activeTiers.length > 0;

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

  // Check cart status
  const cartItem = items.find(item => item.productId === product.id);
  const currentQuantityInCart = cartItem ? cartItem.quantity : 0;
  const isMaxReached = !isOutOfStock && currentQuantityInCart >= product.stockQuantity;

  const handleAddToCart = () => {
    if (purchaseMode === 'IN_STOCK') {
      if (isOutOfStock || isMaxReached) return;
      addToCart({
        productId: product.id,
        title: product.title,
        price: product.basePrice,
        imageUrl: product.imageUrl,
        artistName: product.artistName,
        maxStock: product.stockQuantity,
        isPreOrder: false
      }, 1);
    } else if (purchaseMode === 'PRE_ORDER' && selectedTier) {
      addToCart({
        productId: product.id,
        title: `${product.title} (پیش‌سفارش ${selectedTier.label})`,
        price: currentPrice,
        imageUrl: product.imageUrl,
        artistName: product.artistName,
        maxStock: 99,
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
            خرید فوری (موجود در کارگاه)
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
            <div className="w-full flex gap-3">
              <a 
                href="/cart" 
                className="flex-[2] bg-emerald-100 hover:bg-emerald-200 text-emerald-800 py-3.5 rounded-2xl font-black text-base transition-colors flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                مشاهده در سبد خرید
              </a>
              <button 
                onClick={handleRemoveFromCart} 
                className="flex-[1] bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 py-3.5 rounded-2xl font-bold text-sm transition-colors flex items-center justify-center"
              >
                حذف از سبد
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-lg active:scale-98 flex items-center justify-center gap-2 text-white ${
                purchaseMode === 'PRE_ORDER'
                  ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/25 ring-2 ring-purple-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              <span>{purchaseMode === 'PRE_ORDER' ? 'ثبت و افزودن پیش‌سفارش به سبد' : 'افزودن به سبد خرید'}</span>
            </button>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <StockNotifyButton productId={product.id} />
        </div>
      )}
    </div>
  );
}
