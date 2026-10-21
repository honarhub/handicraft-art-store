'use client';

import React, { useEffect, useState } from 'react';

export default function WishlistIcon() {
  const [count, setCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  const updateCount = () => {
    try {
      const saved = localStorage.getItem('honarhub_wishlist');
      if (saved) {
        const list = JSON.parse(saved);
        if (Array.isArray(list)) {
          setCount(list.length);
          return;
        }
      }
      setCount(0);
    } catch {
      setCount(0);
    }
  };

  useEffect(() => {
    setMounted(true);
    updateCount();

    window.addEventListener('wishlist-updated', updateCount);
    window.addEventListener('storage', updateCount);
    return () => {
      window.removeEventListener('wishlist-updated', updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, []);

  return (
    <a 
      href="/wishlist" 
      className="relative p-2 text-slate-700 hover:text-emerald-600 transition-colors"
      title="محصولات نشان‌شده (علاقه‌مندی‌ها)"
      aria-label="لیست علاقه‌مندی‌ها"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="22" 
        height="22" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
      </svg>
      {mounted && count > 0 && (
        <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm animate-in zoom-in">
          {count.toLocaleString('fa-IR')}
        </span>
      )}
    </a>
  );
}
