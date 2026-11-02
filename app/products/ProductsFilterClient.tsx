'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';

interface SpecialtyChild {
  id: string;
  name: string;
  _count?: { products: number };
}

interface SpecialtyGroup {
  id: string;
  name: string;
  children?: SpecialtyChild[];
}

interface ArtistItem {
  id: string;
  brandName?: string | null;
  province?: string | null;
  city?: string | null;
  user?: {
    name?: string | null;
    image?: string | null;
  } | null;
}

interface ProductsFilterClientProps {
  initialQ: string;
  initialSpecialty: string;
  initialArtist: string;
  initialSort: string;
  initialMax: number;
  initialPreOrder?: boolean;
  initialInStock?: boolean;
  maxPossiblePrice: number;
  specialties: SpecialtyGroup[];
  artists: ArtistItem[];
}

type SortOption = 'newest' | 'price_asc' | 'price_desc';

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'جدیدترین آثار',
  price_asc: 'ارزان‌ترین',
  price_desc: 'گران‌ترین'
};

export default function ProductsFilterClient({ 
  initialQ, 
  initialSpecialty, 
  initialArtist, 
  initialSort, 
  initialMax, 
  initialPreOrder = false,
  initialInStock = false,
  maxPossiblePrice, 
  specialties, 
  artists 
}: ProductsFilterClientProps) {
  const router = useRouter();
  
  // Filter States
  const [q, setQ] = useState(initialQ);
  const [specialty, setSpecialty] = useState(initialSpecialty);
  const [artistId, setArtistId] = useState(initialArtist);
  const [sort, setSort] = useState<SortOption>((initialSort as SortOption) || 'newest');
  const [maxPrice, setMaxPrice] = useState(initialMax);
  const [preOrderOnly, setPreOrderOnly] = useState(Boolean(initialPreOrder));
  const [inStockOnly, setInStockOnly] = useState(Boolean(initialInStock));

  // Live Search States for Dropdowns / Bottom Sheets (Type to Filter)
  const [specialtySearch, setSpecialtySearch] = useState('');
  const [artistSearch, setArtistSearch] = useState('');

  // Mobile Bottom Sheets
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isAllFiltersOpen, setIsAllFiltersOpen] = useState(false);
  const [isPriceOpen, setIsPriceOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isArtistOpen, setIsArtistOpen] = useState(false);

  // Desktop Dropdowns
  const [isDesktopSpecialtyOpen, setIsDesktopSpecialtyOpen] = useState(false);
  const [isDesktopArtistOpen, setIsDesktopArtistOpen] = useState(false);

  const desktopSpecialtyRef = useRef<HTMLDivElement>(null);
  const desktopArtistRef = useRef<HTMLDivElement>(null);

  const [debouncedQ] = useDebounce(q, 450);
  const [debouncedMax] = useDebounce(maxPrice, 450);
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when mobile bottom sheet is open
  useEffect(() => {
    const isAnySheetOpen = isSortOpen || isAllFiltersOpen || isPriceOpen || isCategoryOpen || isArtistOpen;
    if (isAnySheetOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSortOpen, isAllFiltersOpen, isPriceOpen, isCategoryOpen, isArtistOpen]);

  // Close desktop dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (desktopSpecialtyRef.current && !desktopSpecialtyRef.current.contains(event.target as Node)) {
        setIsDesktopSpecialtyOpen(false);
      }
      if (desktopArtistRef.current && !desktopArtistRef.current.contains(event.target as Node)) {
        setIsDesktopArtistOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync with URL params
  useEffect(() => {
    if (!mounted) return;
    
    const params = new URLSearchParams();
    if (debouncedQ) params.set('q', debouncedQ);
    if (specialty) params.set('specialty', specialty);
    if (artistId) params.set('artist', artistId);
    if (sort !== 'newest') params.set('sort', sort);
    if (debouncedMax < maxPossiblePrice) params.set('maxPrice', debouncedMax.toString());
    if (preOrderOnly) params.set('preOrder', 'true');
    if (inStockOnly) params.set('inStock', 'true');
    
    router.push(`/products?${params.toString()}`, { scroll: false });
  }, [debouncedQ, specialty, artistId, sort, debouncedMax, preOrderOnly, inStockOnly, router, mounted, maxPossiblePrice]);

  const clearFilters = () => {
    setQ('');
    setSpecialty('');
    setArtistId('');
    setSort('newest');
    setMaxPrice(maxPossiblePrice);
    setPreOrderOnly(false);
    setInStockOnly(false);
    setIsSortOpen(false);
    setIsAllFiltersOpen(false);
    setIsPriceOpen(false);
    setIsCategoryOpen(false);
    setIsArtistOpen(false);
  };

  // Determine active filters
  const hasActiveFilters = Boolean(
    q.trim() !== '' ||
    specialty !== '' ||
    artistId !== '' ||
    sort !== 'newest' ||
    maxPrice < maxPossiblePrice ||
    preOrderOnly ||
    inStockOnly
  );

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (q.trim()) count++;
    if (specialty) count++;
    if (artistId) count++;
    if (preOrderOnly) count++;
    if (inStockOnly) count++;
    if (maxPrice < maxPossiblePrice) count++;
    return count;
  }, [q, specialty, artistId, preOrderOnly, inStockOnly, maxPrice, maxPossiblePrice]);

  // Selected Specialty Display Name
  const selectedSpecialtyName = useMemo(() => {
    if (!specialty) return 'همه دسته‌بندی‌ها';
    for (const group of specialties) {
      if (group.id === specialty) return group.name;
      const child = group.children?.find(c => c.id === specialty);
      if (child) return `${child.name} (${group.name})`;
    }
    return 'همه دسته‌بندی‌ها';
  }, [specialty, specialties]);

  // Selected Artist Display Name
  const selectedArtistName = useMemo(() => {
    if (!artistId) return 'همه هنرمندان';
    const found = artists.find(a => a.id === artistId);
    return found?.user?.name || found?.brandName || 'هنرمند انتخاب‌شده';
  }, [artistId, artists]);

  // Live Filter Specialties by User Type
  const filteredSpecialties = useMemo(() => {
    if (!specialtySearch.trim()) return specialties;
    const s = specialtySearch.trim().toLowerCase();
    return specialties
      .map(group => {
        const parentMatches = group.name.toLowerCase().includes(s);
        const matchingChildren = group.children?.filter(c => c.name.toLowerCase().includes(s)) || [];
        if (parentMatches) return group;
        if (matchingChildren.length > 0) return { ...group, children: matchingChildren };
        return null;
      })
      .filter(Boolean) as SpecialtyGroup[];
  }, [specialties, specialtySearch]);

  // Live Filter Artists by User Type
  const filteredArtists = useMemo(() => {
    if (!artistSearch.trim()) return artists;
    const s = artistSearch.trim().toLowerCase();
    return artists.filter(a => {
      const name = a.user?.name?.toLowerCase() || '';
      const brand = a.brandName?.toLowerCase() || '';
      const location = `${a.province || ''} ${a.city || ''}`.toLowerCase();
      return name.includes(s) || brand.includes(s) || location.includes(s);
    });
  }, [artists, artistSearch]);

  return (
    <div dir="rtl" className="w-full">
      {/* =========================================================================
          1. MOBILE HORIZONTAL FILTER BAR (Like Digikala, Torob, Airbnb)
          Visible on mobile/tablet (block lg:hidden)
          ========================================================================= */}
      <div className="block lg:hidden mb-6 space-y-3">
        {/* Search Input on Mobile */}
        <div className="relative">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجوی عنوان اثر یا دسته‌بندی..."
            className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 focus:border-emerald-500 rounded-2xl py-3 pr-11 pl-10 text-xs font-medium outline-none shadow-xs transition-all focus:ring-2 focus:ring-emerald-200/50"
          />
          <span className="absolute right-3.5 top-3.5 text-slate-400 text-sm pointer-events-none">🔍</span>
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              className="absolute left-3 top-3 w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-xs transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Horizontal Row of Buttons (Pills):
            1. مرتب‌سازی (جدیدترین، ارزان‌ترین...)
            2. فیلترها (همه فیلترها + بج تعداد)
            3. امکان پیش‌سفارش (تاگل سریع)
            4. محدوده قیمت (اسلایدر قیمت)
            5. موجود در انبار (تاگل سریع)
            6. دسته‌بندی‌ها (با تایپ و جستجوی سریع)
            7. هنرمند (با تایپ و جستجوی سریع)
        */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-hide -mx-1 px-1">
          {/* Button 1: Sort */}
          <button
            type="button"
            onClick={() => setIsSortOpen(true)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              sort !== 'newest'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="21" y1="10" x2="7" y2="10"></line>
              <line x1="21" y1="6" x2="3" y2="6"></line>
              <line x1="21" y1="14" x2="11" y2="14"></line>
              <line x1="21" y1="18" x2="15" y2="18"></line>
            </svg>
            <span>{SORT_LABELS[sort]}</span>
          </button>

          {/* Button 2: All Filters (Drawer Trigger) */}
          <button
            type="button"
            onClick={() => setIsAllFiltersOpen(true)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeFiltersCount > 0
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            <span>فیلترها</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-emerald-700 text-[10px] font-black flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Button 3: Pre-Order (Fast Toggle Pill) */}
          <button
            type="button"
            onClick={() => setPreOrderOnly(prev => !prev)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              preOrderOnly
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-800'
            }`}
          >
            <span>{preOrderOnly ? '✓' : '✨'}</span>
            <span>امکان پیش‌سفارش</span>
          </button>

          {/* Button 4: Price Range Modal */}
          <button
            type="button"
            onClick={() => setIsPriceOpen(true)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              maxPrice < maxPossiblePrice
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>💰</span>
            <span>
              {maxPrice < maxPossiblePrice 
                ? `تا ${maxPrice.toLocaleString('fa-IR')} تومان`
                : 'محدوده قیمت'}
            </span>
          </button>

          {/* Button 5: In Stock (Fast Toggle Pill) */}
          <button
            type="button"
            onClick={() => setInStockOnly(prev => !prev)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              inStockOnly
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
          >
            <span>{inStockOnly ? '✓' : '📦'}</span>
            <span>فقط کالاهای موجود</span>
          </button>

          {/* Button 6: Categories (with Live Search/Type) */}
          <button
            type="button"
            onClick={() => {
              setSpecialtySearch('');
              setIsCategoryOpen(true);
            }}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              specialty
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>📁</span>
            <span>{specialty ? selectedSpecialtyName : 'دسته‌بندی'}</span>
          </button>

          {/* Button 7: Artists (with Live Search/Type) */}
          <button
            type="button"
            onClick={() => {
              setArtistSearch('');
              setIsArtistOpen(true);
            }}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              artistId
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>🎨</span>
            <span>{artistId ? selectedArtistName : 'فیلتر هنرمند'}</span>
          </button>
        </div>

        {/* Active Filters Dismissible Pills (Mobile) */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
            <span className="text-[11px] font-bold text-slate-400">فیلترهای فعال:</span>

            {q && (
              <span className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-800 px-2.5 py-1 rounded-xl text-[11px] font-bold shadow-2xs">
                <span>جستجو: {q}</span>
                <button type="button" onClick={() => setQ('')} className="text-slate-400 hover:text-red-500 cursor-pointer">✕</button>
              </span>
            )}

            {specialty && (
              <span className="inline-flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-900 px-2.5 py-1 rounded-xl text-[11px] font-bold shadow-2xs">
                <span>دسته‌بندی: {selectedSpecialtyName}</span>
                <button type="button" onClick={() => setSpecialty('')} className="text-purple-400 hover:text-red-500 cursor-pointer">✕</button>
              </span>
            )}

            {artistId && (
              <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-900 px-2.5 py-1 rounded-xl text-[11px] font-bold shadow-2xs">
                <span>هنرمند: {selectedArtistName}</span>
                <button type="button" onClick={() => setArtistId('')} className="text-blue-400 hover:text-red-500 cursor-pointer">✕</button>
              </span>
            )}

            {inStockOnly && (
              <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-900 px-2.5 py-1 rounded-xl text-[11px] font-bold shadow-2xs">
                <span>فقط موجود</span>
                <button type="button" onClick={() => setInStockOnly(false)} className="text-emerald-500 hover:text-red-500 cursor-pointer">✕</button>
              </span>
            )}

            {preOrderOnly && (
              <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1 rounded-xl text-[11px] font-bold shadow-2xs">
                <span>پیش‌سفارش</span>
                <button type="button" onClick={() => setPreOrderOnly(false)} className="text-amber-500 hover:text-red-500 cursor-pointer">✕</button>
              </span>
            )}

            {maxPrice < maxPossiblePrice && (
              <span className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-800 px-2.5 py-1 rounded-xl text-[11px] font-bold shadow-2xs">
                <span>تا {maxPrice.toLocaleString('fa-IR')} تومان</span>
                <button type="button" onClick={() => setMaxPrice(maxPossiblePrice)} className="text-slate-400 hover:text-red-500 cursor-pointer">✕</button>
              </span>
            )}

            <button
              type="button"
              onClick={clearFilters}
              className="text-[11px] font-bold text-red-600 hover:text-red-700 underline mr-auto cursor-pointer"
            >
              پاک کردن همه
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          2. DESKTOP SIDEBAR FILTERS (Visible on lg: screens)
          Features searchable category & searchable artist with live typing!
          ========================================================================= */}
      <div className="hidden lg:block bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <h3 className="font-black text-slate-900 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            <span>فیلترهای پیشرفته</span>
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

        {/* Text Search */}
        <div>
          <label className="block text-sm font-bold text-slate-900 mb-2">جستجو در آثار</label>
          <div className="relative">
            <input 
              type="text" 
              value={q} 
              onChange={e => setQ(e.target.value)} 
              placeholder="نام اثر، متریال یا سبک..." 
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm transition-all"
            />
            <span className="absolute left-3 top-3.5 text-slate-400 text-sm">🔍</span>
          </div>
        </div>

        {/* Searchable Category/Specialty Dropdown (Desktop) */}
        <div className="relative" ref={desktopSpecialtyRef}>
          <label className="block text-sm font-bold text-slate-900 mb-2">دسته‌بندی (تخصص)</label>
          
          <button
            type="button"
            onClick={() => {
              setIsDesktopSpecialtyOpen(!isDesktopSpecialtyOpen);
              setSpecialtySearch('');
            }}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 bg-white text-right flex items-center justify-between text-sm transition-all cursor-pointer"
          >
            <span className={`truncate font-bold ${specialty ? 'text-slate-900' : 'text-slate-500'}`}>
              {selectedSpecialtyName}
            </span>
            <svg 
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDesktopSpecialtyOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDesktopSpecialtyOpen && (
            <div className="absolute z-30 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-80 overflow-y-auto p-2 divide-y divide-slate-100">
              {/* Type-to-search input inside dropdown */}
              <div className="pb-2">
                <input
                  type="text"
                  value={specialtySearch}
                  onChange={e => setSpecialtySearch(e.target.value)}
                  placeholder="تایپ کنید: سفال، مینا، خاتم..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-500"
                  autoFocus
                />
              </div>

              {/* Reset to all categories */}
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setSpecialty('');
                    setIsDesktopSpecialtyOpen(false);
                  }}
                  className={`w-full text-right px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    !specialty ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>همه دسته‌بندی‌ها</span>
                  {!specialty && <span className="text-emerald-600 font-bold">✓</span>}
                </button>
              </div>

              {/* Filtered categories list */}
              <div className="pt-1 space-y-1">
                {filteredSpecialties.length === 0 ? (
                  <p className="text-center py-4 text-xs text-slate-400">دسته‌بندی با این عنوان یافت نشد.</p>
                ) : (
                  filteredSpecialties.map(group => {
                    const isParentSelected = specialty === group.id;
                    return (
                      <div key={group.id} className="py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSpecialty(group.id);
                            setIsDesktopSpecialtyOpen(false);
                          }}
                          className={`w-full text-right px-3 py-2 rounded-xl text-xs font-black transition flex items-center justify-between cursor-pointer ${
                            isParentSelected
                              ? 'bg-purple-700 text-white shadow-xs'
                              : 'text-slate-900 bg-slate-50 hover:bg-purple-50 hover:text-purple-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={isParentSelected ? 'text-white' : 'text-purple-600'}>📁</span>
                            <span>{group.name}</span>
                          </div>
                          {isParentSelected && <span>✓</span>}
                        </button>

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
                                    setIsDesktopSpecialtyOpen(false);
                                  }}
                                  className={`w-full text-right px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                                    isChildSelected
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'text-slate-700 hover:bg-slate-100/70 hover:text-slate-900'
                                  }`}
                                >
                                  <span className="flex items-center gap-1.5">
                                    <span className="text-slate-400">↳</span>
                                    <span>{child.name}</span>
                                    {child._count?.products !== undefined && (
                                      <span className="text-[10px] text-slate-400 font-semibold">({child._count.products})</span>
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
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Searchable Artist Dropdown with Type-to-Search (Desktop) */}
        <div className="relative" ref={desktopArtistRef}>
          <label className="block text-sm font-bold text-slate-900 mb-2">هنرمند</label>
          
          <button
            type="button"
            onClick={() => {
              setIsDesktopArtistOpen(!isDesktopArtistOpen);
              setArtistSearch('');
            }}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 bg-white text-right flex items-center justify-between text-sm transition-all cursor-pointer"
          >
            <span className={`truncate font-bold ${artistId ? 'text-slate-900' : 'text-slate-500'}`}>
              {selectedArtistName}
            </span>
            <svg 
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDesktopArtistOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDesktopArtistOpen && (
            <div className="absolute z-30 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-80 overflow-y-auto p-2 divide-y divide-slate-100">
              {/* Type-to-search artist input */}
              <div className="pb-2">
                <input
                  type="text"
                  value={artistSearch}
                  onChange={e => setArtistSearch(e.target.value)}
                  placeholder="تایپ نام یا برند هنرمند..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-500"
                  autoFocus
                />
              </div>

              {/* All Artists Option */}
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setArtistId('');
                    setIsDesktopArtistOpen(false);
                  }}
                  className={`w-full text-right px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    !artistId ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>همه هنرمندان</span>
                  {!artistId && <span className="text-emerald-600 font-bold">✓</span>}
                </button>
              </div>

              {/* Filtered Artists List */}
              <div className="pt-1 space-y-1">
                {filteredArtists.length === 0 ? (
                  <p className="text-center py-4 text-xs text-slate-400">هنرمندی با این نام یافت نشد.</p>
                ) : (
                  filteredArtists.map(artist => {
                    const isSelected = artistId === artist.id;
                    const name = artist.user?.name || artist.brandName || 'هنرمند بی‌نام';
                    return (
                      <button
                        key={artist.id}
                        type="button"
                        onClick={() => {
                          setArtistId(artist.id);
                          setIsDesktopArtistOpen(false);
                        }}
                        className={`w-full text-right px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                          isSelected ? 'bg-blue-50 text-blue-900 border border-blue-200' : 'text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-[10px] font-bold text-slate-600">
                            {artist.user?.image ? (
                              <img src={artist.user.image} alt={name} className="w-full h-full object-cover" />
                            ) : (
                              name.charAt(0)
                            )}
                          </div>
                          <div className="truncate">
                            <span className="block truncate font-bold">{name}</span>
                            {artist.brandName && artist.user?.name && (
                              <span className="block text-[10px] text-slate-400 font-normal truncate">برند: {artist.brandName}</span>
                            )}
                          </div>
                        </div>
                        {isSelected && <span className="text-blue-600 font-bold shrink-0">✓</span>}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sort (Desktop) */}
        <div>
          <label className="block text-sm font-bold text-slate-900 mb-2">مرتب‌سازی بر اساس</label>
          <select 
            value={sort} 
            onChange={e => setSort(e.target.value as SortOption)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm bg-white text-slate-900 font-semibold cursor-pointer"
          >
            <option value="newest">جدیدترین</option>
            <option value="price_asc">ارزان‌ترین</option>
            <option value="price_desc">گران‌ترین</option>
          </select>
        </div>

        {/* In-Stock Toggle Switch (Desktop) */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900">فقط کالاهای موجود</span>
              <span className="text-[11px] text-slate-400">آثار آماده ارسال در انبار</span>
            </div>
            <button 
              type="button"
              dir="ltr"
              onClick={() => setInStockOnly(prev => !prev)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${inStockOnly ? 'bg-emerald-600' : 'bg-slate-300'}`}
              title={inStockOnly ? 'نمایش همه آثار' : 'فیلتر فقط آثار موجود'}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  inStockOnly ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Pre-Order Toggle Switch (Desktop) */}
        <div className="pt-1">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900">امکان پیش‌سفارش</span>
              <span className="text-[11px] text-slate-400">آثار قابل سفارش ساخت</span>
            </div>
            <button 
              type="button"
              dir="ltr"
              onClick={() => setPreOrderOnly(prev => !prev)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${preOrderOnly ? 'bg-amber-600' : 'bg-slate-300'}`}
              title={preOrderOnly ? 'نمایش همه آثار' : 'فیلتر آثار دارای امکان پیش‌سفارش'}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  preOrderOnly ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Price Range Slider (Desktop - Numbers Correctly Aligned) */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-bold text-slate-900">محدوده قیمت</label>
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              تا {maxPrice.toLocaleString('fa-IR')} تومان
            </span>
          </div>
          <div className="space-y-2">
            <input 
              type="range" 
              min="0" 
              max={maxPossiblePrice} 
              step="500000"
              value={maxPrice} 
              onChange={e => setMaxPrice(parseInt(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
              dir="ltr"
            />
            {/* LTR Labels: 0 on LEFT, Max on RIGHT */}
            <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium" dir="ltr">
              <span>۰ تومان</span>
              <span>{maxPossiblePrice.toLocaleString('fa-IR')} تومان</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. MOBILE BOTTOM SHEETS (DRAWERS)
          ========================================================================= */}

      {/* 3a. SORT SHEET */}
      {isSortOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in" onClick={() => setIsSortOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl p-6 z-10 animate-in slide-in-from-bottom-5 duration-200">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <span>⇅</span>
                <span>مرتب‌سازی آثار بر اساس</span>
              </h3>
              <button type="button" onClick={() => setIsSortOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 font-bold">✕</button>
            </div>
            <div className="space-y-2">
              {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => {
                const isSelected = sort === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSort(key);
                      setIsSortOpen(false);
                    }}
                    className={`w-full py-3.5 px-4 text-right rounded-2xl flex items-center justify-between text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      isSelected ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{SORT_LABELS[key]}</span>
                    {isSelected && <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3b. PRICE SHEET */}
      {isPriceOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in" onClick={() => setIsPriceOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl p-6 z-10 animate-in slide-in-from-bottom-5 duration-200 space-y-5">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto" />
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <span>💰</span>
                <span>فیلتر محدوده قیمت</span>
              </h3>
              <button type="button" onClick={() => setIsPriceOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 font-bold">✕</button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-xs font-bold text-slate-600">حداکثر قیمت انتخابی:</span>
                <span className="text-sm font-black text-emerald-700 bg-white px-3 py-1 rounded-xl shadow-2xs border border-slate-200">
                  {maxPrice.toLocaleString('fa-IR')} تومان
                </span>
              </div>

              <input 
                type="range" 
                min="0" 
                max={maxPossiblePrice} 
                step="500000"
                value={maxPrice} 
                onChange={e => setMaxPrice(parseInt(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-2.5 bg-slate-200 rounded-lg appearance-none"
                dir="ltr"
              />

              <div className="flex justify-between items-center text-xs text-slate-500 font-medium" dir="ltr">
                <span>۰ تومان</span>
                <span>{maxPossiblePrice.toLocaleString('fa-IR')} تومان</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setMaxPrice(maxPossiblePrice);
                  setIsPriceOpen(false);
                }}
                className="px-4 py-3 rounded-2xl text-xs font-bold text-slate-600 hover:text-red-600 transition-colors"
              >
                حذف فیلتر قیمت
              </button>
              <button
                type="button"
                onClick={() => setIsPriceOpen(false)}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-2xl shadow-lg shadow-emerald-600/20 transition-all text-center"
              >
                اعمال قیمت
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3c. CATEGORIES SHEET WITH LIVE SEARCH/TYPE */}
      {isCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in" onClick={() => setIsCategoryOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col z-10 animate-in slide-in-from-bottom-5 duration-200">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-3" />
            <div className="flex items-center justify-between px-6 pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <span>📁</span>
                <span>انتخاب دسته‌بندی و تخصص</span>
              </h3>
              <button type="button" onClick={() => setIsCategoryOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 font-bold">✕</button>
            </div>

            {/* Live Search Input */}
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <div className="relative">
                <input
                  type="text"
                  value={specialtySearch}
                  onChange={e => setSpecialtySearch(e.target.value)}
                  placeholder="تایپ نام تخصص: سفالگری، قلمزنی، گلیم..."
                  className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl py-2.5 pr-9 pl-8 text-xs font-medium outline-none focus:border-emerald-500"
                  autoFocus
                />
                <span className="absolute right-3 top-2.5 text-slate-400 text-xs">🔍</span>
                {specialtySearch && (
                  <button type="button" onClick={() => setSpecialtySearch('')} className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs">✕</button>
                )}
              </div>
            </div>

            {/* Categories List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setSpecialty('');
                  setIsCategoryOpen(false);
                }}
                className={`w-full text-right px-4 py-3 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  !specialty ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>همه دسته‌بندی‌ها</span>
                {!specialty && <span className="text-emerald-600 font-bold">✓</span>}
              </button>

              {filteredSpecialties.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">هیچ دسته‌بندی با این عنوان یافت نشد.</p>
              ) : (
                filteredSpecialties.map(group => {
                  const isParentSelected = specialty === group.id;
                  return (
                    <div key={group.id} className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSpecialty(group.id);
                          setIsCategoryOpen(false);
                        }}
                        className={`w-full text-right px-3.5 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-between cursor-pointer ${
                          isParentSelected
                            ? 'bg-purple-700 text-white shadow-xs'
                            : 'text-slate-900 bg-slate-100 hover:bg-purple-50 hover:text-purple-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>📁</span>
                          <span>{group.name}</span>
                        </div>
                        {isParentSelected && <span>✓</span>}
                      </button>

                      {group.children && group.children.length > 0 && (
                        <div className="pr-4 pl-1 pt-1 space-y-1">
                          {group.children.map(child => {
                            const isChildSelected = specialty === child.id;
                            return (
                              <button
                                key={child.id}
                                type="button"
                                onClick={() => {
                                  setSpecialty(child.id);
                                  setIsCategoryOpen(false);
                                }}
                                className={`w-full text-right px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                                  isChildSelected
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <span>↳ {child.name}</span>
                                {isChildSelected && <span className="text-emerald-700">✓</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3d. ARTISTS SHEET WITH LIVE SEARCH/TYPE */}
      {isArtistOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in" onClick={() => setIsArtistOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col z-10 animate-in slide-in-from-bottom-5 duration-200">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-3" />
            <div className="flex items-center justify-between px-6 pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <span>🎨</span>
                <span>فیلتر بر اساس هنرمند</span>
              </h3>
              <button type="button" onClick={() => setIsArtistOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 font-bold">✕</button>
            </div>

            {/* Live Search Input */}
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <div className="relative">
                <input
                  type="text"
                  value={artistSearch}
                  onChange={e => setArtistSearch(e.target.value)}
                  placeholder="تایپ نام یا برند هنرمند..."
                  className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl py-2.5 pr-9 pl-8 text-xs font-medium outline-none focus:border-emerald-500"
                  autoFocus
                />
                <span className="absolute right-3 top-2.5 text-slate-400 text-xs">🔍</span>
                {artistSearch && (
                  <button type="button" onClick={() => setArtistSearch('')} className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs">✕</button>
                )}
              </div>
            </div>

            {/* Artists List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  setArtistId('');
                  setIsArtistOpen(false);
                }}
                className={`w-full text-right px-4 py-3 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  !artistId ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>همه هنرمندان</span>
                {!artistId && <span className="text-emerald-600 font-bold">✓</span>}
              </button>

              {filteredArtists.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">هنرمندی با این نام یا مشخصات یافت نشد.</p>
              ) : (
                filteredArtists.map(artist => {
                  const isSelected = artistId === artist.id;
                  const name = artist.user?.name || artist.brandName || 'هنرمند بی‌نام';
                  return (
                    <button
                      key={artist.id}
                      type="button"
                      onClick={() => {
                        setArtistId(artist.id);
                        setIsArtistOpen(false);
                      }}
                      className={`w-full text-right p-3 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                        isSelected ? 'bg-blue-50 text-blue-900 border border-blue-200' : 'text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-600">
                          {artist.user?.image ? (
                            <img src={artist.user.image} alt={name} className="w-full h-full object-cover" />
                          ) : (
                            name.charAt(0)
                          )}
                        </div>
                        <div>
                          <span className="block font-bold text-slate-900">{name}</span>
                          {artist.brandName && (
                            <span className="block text-[10px] text-emerald-700 font-medium">برند: {artist.brandName}</span>
                          )}
                        </div>
                      </div>
                      {isSelected && <span className="text-blue-600 font-bold">✓</span>}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3e. ALL FILTERS BOTTOM SHEET */}
      {isAllFiltersOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in" onClick={() => setIsAllFiltersOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col z-10 animate-in slide-in-from-bottom-5 duration-200">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-3" />
            <div className="flex items-center justify-between px-6 pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <span>🎛️</span>
                <span>فیلترهای کامل آثار</span>
              </h3>
              <button type="button" onClick={() => setIsAllFiltersOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 font-bold">✕</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Toggles */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">فقط کالاهای موجود در انبار</span>
                  <button 
                    type="button"
                    dir="ltr"
                    onClick={() => setInStockOnly(prev => !prev)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ${inStockOnly ? 'bg-emerald-600' : 'bg-slate-300'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${inStockOnly ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
                <div className="h-px bg-slate-200/60 my-1" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">آثار دارای امکان پیش‌سفارش</span>
                  <button 
                    type="button"
                    dir="ltr"
                    onClick={() => setPreOrderOnly(prev => !prev)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ${preOrderOnly ? 'bg-amber-600' : 'bg-slate-300'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${preOrderOnly ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800">محدوده قیمت:</span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">تا {maxPrice.toLocaleString('fa-IR')} تومان</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max={maxPossiblePrice} 
                  step="500000"
                  value={maxPrice} 
                  onChange={e => setMaxPrice(parseInt(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                  dir="ltr"
                />
                <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium" dir="ltr">
                  <span>۰ تومان</span>
                  <span>{maxPossiblePrice.toLocaleString('fa-IR')} تومان</span>
                </div>
              </div>

              {/* Quick links to category and artist sheets */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAllFiltersOpen(false);
                    setIsCategoryOpen(true);
                  }}
                  className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-right flex items-center justify-between text-xs font-bold text-slate-800"
                >
                  <span>📁 دسته‌بندی: <strong className="text-emerald-700">{selectedSpecialtyName}</strong></span>
                  <span className="text-slate-400">تغییر ←</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAllFiltersOpen(false);
                    setIsArtistOpen(true);
                  }}
                  className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-right flex items-center justify-between text-xs font-bold text-slate-800"
                >
                  <span>🎨 هنرمند: <strong className="text-blue-700">{selectedArtistName}</strong></span>
                  <span className="text-slate-400">تغییر ←</span>
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-3 rounded-2xl text-xs font-bold text-slate-600 hover:text-red-600 transition-colors"
              >
                حذف همه
              </button>
              <button
                type="button"
                onClick={() => setIsAllFiltersOpen(false)}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-2xl shadow-lg shadow-emerald-600/20 transition-all text-center"
              >
                مشاهده نتایج
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
