'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';

interface ProductsFilterClientProps {
  initialQ: string;
  initialSpecialty: string;
  initialArtist: string;
  initialSort: string;
  initialMax: number;
  initialPreOrder?: boolean;
  maxPossiblePrice: number;
  specialties: { id: string, name: string, children?: { id: string, name: string, _count?: { products: number } }[] }[];
  artists: any[];
}

export default function ProductsFilterClient({ 
  initialQ, 
  initialSpecialty, 
  initialArtist, 
  initialSort, 
  initialMax, 
  initialPreOrder = false,
  maxPossiblePrice, 
  specialties, 
  artists 
}: ProductsFilterClientProps) {
  const router = useRouter();
  
  const [q, setQ] = useState(initialQ);
  const [specialty, setSpecialty] = useState(initialSpecialty);
  const [artistId, setArtistId] = useState(initialArtist);
  const [sort, setSort] = useState(initialSort);
  const [maxPrice, setMaxPrice] = useState(initialMax);
  const [preOrderOnly, setPreOrderOnly] = useState(Boolean(initialPreOrder));
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [debouncedQ] = useDebounce(q, 500);
  const [debouncedMax] = useDebounce(maxPrice, 500);
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const params = new URLSearchParams();
    if (debouncedQ) params.set('q', debouncedQ);
    if (specialty) params.set('specialty', specialty);
    if (artistId) params.set('artist', artistId);
    if (sort !== 'newest') params.set('sort', sort);
    if (debouncedMax < maxPossiblePrice) params.set('maxPrice', debouncedMax.toString());
    if (preOrderOnly) params.set('preOrder', 'true');
    
    router.push(`/products?${params.toString()}`, { scroll: false });
  }, [debouncedQ, specialty, artistId, sort, debouncedMax, preOrderOnly, router, mounted, maxPossiblePrice]);

  const clearFilters = () => {
    setQ('');
    setSpecialty('');
    setArtistId('');
    setSort('newest');
    setMaxPrice(maxPossiblePrice);
    setPreOrderOnly(false);
  };

  // Determine whether any filter is actively applied
  const hasActiveFilters = Boolean(
    q.trim() !== '' ||
    specialty !== '' ||
    artistId !== '' ||
    sort !== 'newest' ||
    maxPrice < maxPossiblePrice ||
    preOrderOnly
  );

  // Get display name of selected specialty for button trigger
  const selectedName = useMemo(() => {
    if (!specialty) return 'همه دسته‌بندی‌ها';
    for (const group of specialties) {
      if (group.id === specialty) return group.name;
      const child = group.children?.find(c => c.id === specialty);
      if (child) return `${child.name} (${group.name})`;
    }
    return 'همه دسته‌بندی‌ها';
  }, [specialty, specialties]);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <h3 className="font-black text-slate-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          فیلترها
        </h3>
        {hasActiveFilters && (
          <button 
            type="button"
            onClick={clearFilters} 
            className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            حذف همه
          </button>
        )}
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

        {/* Hierarchical Specialty Filter */}
        <div className="relative" ref={dropdownRef}>
          <label className="block text-sm font-bold text-slate-700 mb-2">دسته‌بندی (تخصص)</label>
          
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 bg-white text-right flex items-center justify-between text-sm transition-all cursor-pointer"
          >
            <span className={`truncate ${specialty ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
              {selectedName}
            </span>
            <svg 
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute z-30 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-80 overflow-y-auto p-1.5 divide-y divide-slate-100">
              {/* Reset to all categories option */}
              <div className="pb-1">
                <button
                  type="button"
                  onClick={() => {
                    setSpecialty('');
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-right px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    !specialty ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>همه دسته‌بندی‌ها</span>
                  {!specialty && <span className="text-emerald-600 font-bold">✓</span>}
                </button>
              </div>

              {/* Parent categories and children */}
              <div className="pt-1 space-y-1">
                {specialties.map(group => {
                  const isParentSelected = specialty === group.id;
                  return (
                    <div key={group.id} className="py-1">
                      {/* Parent category button */}
                      <button
                        type="button"
                        onClick={() => {
                          setSpecialty(group.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-right px-3 py-2 rounded-xl text-xs font-black transition flex items-center justify-between cursor-pointer ${
                          isParentSelected
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-900 bg-slate-50 hover:bg-purple-50 hover:text-purple-700'
                        }`}
                        title={`انتخاب دسته‌بندی ${group.name} (شامل تمام زیرمجموعه‌ها)`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={isParentSelected ? 'text-white' : 'text-purple-600'}>📁</span>
                          <span>{group.name}</span>
                        </div>
                        {isParentSelected && <span>✓</span>}
                      </button>

                      {/* Subcategories */}
                      {group.children && group.children.length > 0 && (
                        <div className="pr-3 pl-1 pt-1 space-y-0.5">
                          {group.children.map(child => {
                            const isChildSelected = specialty === child.id;
                            return (
                              <button
                                key={child.id}
                                type="button"
                                onClick={() => {
                                  setSpecialty(child.id);
                                  setIsDropdownOpen(false);
                                }}
                                className={`w-full text-right px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                                  isChildSelected
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                                }`}
                              >
                                <span className="flex items-center gap-1.5">
                                  <span className="text-slate-300">↳</span>
                                  <span>{child.name}</span>
                                  {child._count?.products !== undefined && (
                                    <span className="text-[10px] text-slate-400 font-normal">({child._count.products} اثر)</span>
                                  )}
                                </span>
                                {isChildSelected && <span className="text-emerald-700">✓</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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

        {/* Pre-Order Only Filter Toggle */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800">امکان پیش‌سفارش</span>
              <span className="text-[11px] text-slate-400">نمایش آثار قابل سفارش ساخت</span>
            </div>
            <button 
              type="button"
              dir="ltr"
              onClick={() => setPreOrderOnly(prev => !prev)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${preOrderOnly ? 'bg-amber-600' : 'bg-slate-300'}`}
              title={preOrderOnly ? 'نمایش همه آثار' : 'فیلتر فقط آثار دارای امکان پیش‌سفارش'}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  preOrderOnly ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
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
