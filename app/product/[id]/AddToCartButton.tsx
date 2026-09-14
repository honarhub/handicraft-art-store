'use client';

import React from 'react';
import { useCart } from '../../context/CartContext';

interface AddToCartButtonProps {
  product: {
    id: string;
    title: string;
    price: number;
    imageUrl: string;
    artistName: string;
    stockQuantity: number;
  };
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addToCart, items, removeFromCart } = useCart();
  
  // Check if item is already in cart and what quantity
  const cartItem = items.find(item => item.productId === product.id);
  const currentQuantityInCart = cartItem ? cartItem.quantity : 0;
  
  const isOutOfStock = product.stockQuantity === 0;
  const isMaxReached = currentQuantityInCart >= product.stockQuantity;

  const handleAdd = () => {
    if (isOutOfStock || isMaxReached) return;
    
    addToCart({
      productId: product.id,
      title: product.title,
      price: product.price,
      imageUrl: product.imageUrl,
      artistName: product.artistName,
      maxStock: product.stockQuantity
    }, 1);
  };

  const handleRemove = () => {
    removeFromCart(product.id);
  };

  if (isOutOfStock) {
    return (
      <button disabled className="w-full bg-slate-200 text-slate-500 py-4 rounded-xl font-bold text-lg cursor-not-allowed">
        ناموجود
      </button>
    );
  }

  if (currentQuantityInCart > 0) {
    return (
      <div className="w-full flex gap-3">
        <a href="/cart" className="flex-[2] bg-emerald-100 hover:bg-emerald-200 text-emerald-800 py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          در سبد خرید موجود است
        </a>
        <button onClick={handleRemove} className="flex-[1] bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-4 rounded-xl font-bold text-sm transition-colors flex items-center justify-center">
          حذف از سبد
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={handleAdd}
      className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold text-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
      افزودن به سبد خرید
    </button>
  );
}
