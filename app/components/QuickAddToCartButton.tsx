'use client';

import React from 'react';
import { useCart, getCartItemId } from '../context/CartContext';
import { toPersianDigits } from '@/lib/date';

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
  const { items, addToCart, removeFromCart, updateQuantity } = useCart();

  const cartItem = items.find(
    (i) => i.productId === product.id || i.id === product.id || i.id?.startsWith(product.id)
  );
  const inCart = Boolean(cartItem && cartItem.quantity > 0);
  const currentQuantity = cartItem ? cartItem.quantity : 0;
  const cartItemId = cartItem ? getCartItemId(cartItem) : product.id;

  const isOutOfStock = product.stockQuantity <= 0;
  const isPreOrder = isOutOfStock && Boolean(product.isPreOrderEnabled);
  const maxStock = isPreOrder ? 99 : (product.stockQuantity || 1);

  // If out of stock with no pre-order
  if (isOutOfStock && !isPreOrder) {
    return (
      <div
        title="در حال حاضر ناموجود"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="w-8 h-8 rounded-xl bg-slate-100 text-slate-300 flex items-center justify-center cursor-not-allowed select-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
      </div>
    );
  }

  // If already in cart: show + / quantity / trash or minus
  if (inCart) {
    return (
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="inline-flex items-center bg-white border border-emerald-200/90 rounded-xl p-0.5 gap-1 shadow-2xs select-none"
      >
        {/* Plus Button */}
        <button
          type="button"
          disabled={currentQuantity >= maxStock}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (currentQuantity < maxStock) {
              updateQuantity(cartItemId, currentQuantity + 1);
            }
          }}
          title="افزایش تعداد"
          className="w-6 h-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-300 text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-2xs"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Quantity Number */}
        <span className="font-black text-xs text-slate-800 min-w-4 text-center font-mono px-0.5">
          {toPersianDigits(currentQuantity)}
        </span>

        {/* Minus / Trash Button: Trash if 1, Minus if > 1 */}
        {currentQuantity === 1 ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              removeFromCart(cartItemId);
            }}
            title="حذف از سبد خرید"
            className="w-6 h-6 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              updateQuantity(cartItemId, currentQuantity - 1);
            }}
            title="کاهش تعداد"
            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  // Default state: Cart icon button
  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart(
      {
        id: `${product.id}_instock`,
        productId: product.id,
        title: product.title,
        price: product.price,
        imageUrl: product.imageUrl,
        artistName: product.artistName,
        maxStock,
        tierTitle: product.tierTitle || 'اثر دست‌ساز',
        isPreOrder,
        deliveryTime: isPreOrder ? '۱۰ الی ۲۰ روز کاری' : undefined,
      },
      1
    );
  };

  return (
    <button
      type="button"
      onClick={handleQuickAdd}
      title={isPreOrder ? 'ثبت سریع پیش‌سفارش' : 'افزودن به سبد خرید'}
      className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-emerald-600 text-slate-700 hover:text-white flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer group/quickcart"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-transform group-hover/quickcart:scale-110"
      >
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
      </svg>
    </button>
  );
}
