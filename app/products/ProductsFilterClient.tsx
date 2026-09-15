'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';

interface ProductsFilterClientProps {
  initialQ: string;
  initialSpecialty: string;
  initialArtist: string;
  initialSort: string;
  initialMax: number;
  maxPossiblePrice: number;
  specialties: { id: string, name: string }[];
  artists: any[];
}

export default function ProductsFilterClient({ initialQ, initialSpecialty, initialArtist, initialSort, initialMax, maxPossiblePrice, specialties, artists }: ProductsFilterClientProps) {
  const router = useRouter();
  
  const [q, setQ] = useState(initialQ);
  const [specialty, setSpecialty] = useState(initialSpecialty);
  const [artistId, setArtistId] = useState(initialArtist);
  const [sort, setSort] = useState(initialSort);
  const [maxPrice, setMaxPrice] = useState(initialMax);

  const [debouncedQ] = useDebounce(q, 500);
  const [debouncedMax] = useDebounce(maxPrice, 500);
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const params = new URLSearchParams();
    if (debouncedQ) params.set('q', debouncedQ);
    if (specialty) params.set('specialty', specialty);
    if (artistId) params.set('artist', artistId);
    if (sort !== 'newest') params.set('sort', sort);
    if (debouncedMax < maxPossiblePrice) params.set('maxPrice', debouncedMax.toString());
    
    router.push(`/products?${params.toString()}`, { scroll: false });
  }, [debouncedQ, specialty, artistId, sort, debouncedMax, router, mounted, maxPossiblePrice]);

  const clearFilters = () => {
    setQ('');
    setSpecialty('');
    setArtistId('');
    setSort('newest');
    setMaxPrice(maxPossiblePrice);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <h3 className="font-black text-slate-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          فیلترها
        </h3>
        <button onClick={clearFilters} className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md transition-colors">
          حذف همه
        </button>
      </div>

      <div className="space-y-6">
        {/* Search */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">جستجو متنی</label>
          <div className="relative">
            <input 
              type="text" 
              value={q} 
              onChange={e => setQ(e.target.value)} 
              placeholder="نام اثر..." 
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm transition-all"
            />
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-3.5 text-slate-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">دسته‌بندی (تخصص)</label>
          <select 
            value={specialty} 
            onChange={e => setSpecialty(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-sm bg-white"
          >
            <option value="">همه دسته‌بندی‌ها</option>
            {specialties.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Artist Filter */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">هنرمند</label>
          <select 
            value={artistId} 
            onChange={e => setArtistId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-sm bg-white"
          >
            <option value="">همه هنرمندان</option>
            {artists.map(a => (
              <option key={a.id} value={a.id}>{a.user?.name || 'هنرمند بی‌نام'}</option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">مرتب‌سازی بر اساس</label>
          <select 
            value={sort} 
            onChange={e => setSort(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-sm bg-white"
          >
            <option value="newest">جدیدترین</option>
            <option value="price_asc">ارزان‌ترین</option>
            <option value="price_desc">گران‌ترین</option>
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-4">حداکثر قیمت (تومان)</label>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                <span>۰</span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{maxPrice.toLocaleString('fa-IR')}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max={maxPossiblePrice} 
                step="500000"
                value={maxPrice} 
                onChange={e => setMaxPrice(parseInt(e.target.value))}
                className="w-full accent-emerald-600"
                dir="ltr"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
