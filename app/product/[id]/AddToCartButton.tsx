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
  const { addToCart, items } = useCart();
  
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

  if (isOutOfStock) {
    return (
      <button disabled className="flex-1 bg-slate-200 text-slate-500 py-4 rounded-xl font-bold text-lg cursor-not-allowed">
        ناموجود
      </button>
    );
  }

  if (isMaxReached) {
    return (
      <button disabled className="flex-1 bg-emerald-100 text-emerald-700 py-4 rounded-xl font-bold text-lg cursor-not-allowed">
        حداکثر موجودی در سبد شماست
      </button>
    );
  }

  return (
    <button 
      onClick={handleAdd}
      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold text-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
      افزودن به سبد خرید
    </button>
  );
}
