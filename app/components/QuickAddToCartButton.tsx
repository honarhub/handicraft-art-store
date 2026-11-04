'use client';

import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import Link from 'next/link';

interface QuickAddToCartProps {
  product: {
    id: string;
    title: string;
    imageUrl: string;
    artistName: string;
    stockQuantity: number;
    price: number;
    tierTitle?: string;
    isPreOrderEnabled?: boolean;
  };
}

export default function QuickAddToCartButton({ product }: QuickAddToCartProps) {
  const { items, addToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const cartItem = items.find((i) => i.productId === product.id);
  const inCart = Boolean(cartItem);
  const isOutOfStock = product.stockQuantity <= 0;
  const isPreOrder = isOutOfStock && Boolean(product.isPreOrderEnabled);

  if (isOutOfStock && !isPreOrder) {
    return (
      <button
        disabled
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="w-full py-2.5 px-3 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs cursor-not-allowed select-none"
      >
        ناموجود
      </button>
    );
  }

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart(
      {
        productId: product.id,
        title: product.title,
        price: product.price,
        imageUrl: product.imageUrl,
        artistName: product.artistName,
        maxStock: isPreOrder ? 99 : product.stockQuantity,
        tierTitle: product.tierTitle || 'اثر دست‌ساز',
        isPreOrder,
        deliveryTime: isPreOrder ? '۱۰ الی ۲۰ روز کاری' : undefined
      },
      1
    );

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  if (justAdded) {
    return (
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm animate-in fade-in zoom-in-95 duration-150 select-none"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
        </svg>
        <span>به سبد افزوده شد</span>
      </div>
    );
  }

  if (inCart) {
    return (
      <Link
        href="/cart"
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="w-full py-2.5 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs select-none"
        title="مشاهده سبد خرید"
      >
        <svg className="w-3.5 h-3.5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
        </svg>
        <span>در سبد خرید ({cartItem?.quantity})</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleQuickAdd}
      className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98 cursor-pointer select-none ${
        isPreOrder
          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
          : 'bg-slate-900 hover:bg-emerald-600 text-white shadow-slate-900/10'
      }`}
    >
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      <span>{isPreOrder ? 'ثبت سریع پیش‌سفارش' : 'افزودن سریع به سبد'}</span>
    </button>
  );
}
