'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';

export interface Product {
  id: string;
  title: string;
  imageUrl: string;
  stockQuantity: number;
  isPreOrderEnabled: boolean;
  status: string;
  price?: number | null;
  pricingTiers?: { price: number }[];
  specialties?: { id: string; name: string }[];
  createdAt?: Date | string;
}

interface ArtistProductsGalleryProps {
  products: Product[];
  artistSpecialties?: { id: string; name: string }[];
}

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'in_stock';
type ViewMode = 'grid' | 'large';

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'جدیدترین آثار',
  price_asc: 'ارزان‌ترین',
  price_desc: 'گران‌ترین',
  in_stock: 'موجود در انبار'
};

export default function ArtistProductsGallery({ products = [], artistSpecialties = [] }: ArtistProductsGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyPreOrder, setOnlyPreOrder] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Modals for Mobile Bottom Sheets
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Calculate dynamic maximum price among artist products
  const maxPossiblePrice = useMemo(() => {
    if (!products || products.length === 0) return 10000000;
    const max = Math.max(
      ...products.map(p => p.pricingTiers?.[0]?.price || p.price || 0)
    );
    if (max <= 0) return 10000000;
    const step = max > 10000000 ? 5000000 : 1000000;
    return Math.ceil(max / step) * step;
  }, [products]);

  const [maxPrice, setMaxPrice] = useState<number>(maxPossiblePrice);

  // Sync maxPrice if maxPossiblePrice changes
  useEffect(() => {
    setMaxPrice(maxPossiblePrice);
  }, [maxPossiblePrice]);

  // Lock body scroll when any bottom sheet is open
  useEffect(() => {
    if (isFilterOpen || isSortOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFilterOpen, isSortOpen]);

  // Extract unique specialties from products and artist specialties
  const availableSpecialties = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();

    // Seed with artist specialties
    artistSpecialties.forEach(s => {
      map.set(s.id, { id: s.id, name: s.name, count: 0 });
    });

    // Populate counts and add any from products
    products.forEach(p => {
      p.specialties?.forEach(s => {
        const existing = map.get(s.id);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(s.id, { id: s.id, name: s.name, count: 1 });
        }
      });
    });

    return Array.from(map.values()).filter(s => s.count > 0 || artistSpecialties.some(as => as.id === s.id));
  }, [products, artistSpecialties]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (selectedSpecialty !== 'all') count++;
    if (onlyInStock) count++;
    if (onlyPreOrder) count++;
    if (maxPrice < maxPossiblePrice) count++;
    return count;
  }, [searchQuery, selectedSpecialty, onlyInStock, onlyPreOrder, maxPrice, maxPossiblePrice]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedSpecialty('all');
    setOnlyInStock(false);
    setOnlyPreOrder(false);
    setMaxPrice(maxPossiblePrice);
    setSortOption('newest');
    setIsFilterOpen(false);
    setIsSortOpen(false);
  };

  // Filter and Sort Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Search text
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const matchTitle = product.title.toLowerCase().includes(q);
          const matchSpec = product.specialties?.some(s => s.name.toLowerCase().includes(q));
          if (!matchTitle && !matchSpec) return false;
        }

        // Specialty
        if (selectedSpecialty !== 'all') {
          const hasSpec = product.specialties?.some(s => s.id === selectedSpecialty || s.name === selectedSpecialty);
          if (!hasSpec) return false;
        }

        // In Stock only
        if (onlyInStock && product.stockQuantity <= 0) {
          return false;
        }

        // Pre-order only
        if (onlyPreOrder && !product.isPreOrderEnabled) {
          return false;
        }

        // Price
        const price = product.pricingTiers?.[0]?.price || product.price || 0;
        if (price > 0 && price > maxPrice) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = a.pricingTiers?.[0]?.price || a.price || 0;
        const priceB = b.pricingTiers?.[0]?.price || b.price || 0;

        switch (sortOption) {
          case 'price_asc':
            return priceA - priceB;
          case 'price_desc':
            return priceB - priceA;
          case 'in_stock':
            if (a.stockQuantity > 0 && b.stockQuantity <= 0) return -1;
            if (b.stockQuantity > 0 && a.stockQuantity <= 0) return 1;
            return 0;
          case 'newest':
          default:
            return 0; // Pre-sorted by prisma createdAt desc
        }
      });
  }, [products, searchQuery, selectedSpecialty, onlyInStock, onlyPreOrder, maxPrice, sortOption]);

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
        <div className="text-4xl mb-3 opacity-60">🎨</div>
        <p className="text-slate-500 font-medium text-sm">هنوز اثری توسط این هنرمند در گالری ثبت نشده است.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5" dir="rtl">
      {/* -------------------- 1. SEARCH & CONTROLS HEADER BAR -------------------- */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در نام اثر یا سبک هنری..."
            className="w-full bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:border-emerald-500 rounded-2xl py-3 pr-11 pl-10 text-xs sm:text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-emerald-200/50"
          />
          <span className="absolute right-3.5 top-3.5 text-slate-400 text-sm pointer-events-none">🔍</span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-3 w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-xs transition-colors cursor-pointer"
              title="پاک کردن جستجو"
            >
              ✕
            </button>
          )}
        </div>

        {/* Action Buttons Bar: Filter Button, Sort Button, View Switch, Results Count */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {/* Filter Trigger Button */}
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className={`relative px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeFiltersCount > 0
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              <span>فیلترها</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-emerald-700 font-mono text-[11px] font-black flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sort Trigger Button */}
            <button
              type="button"
              onClick={() => setIsSortOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="21" y1="10" x2="7" y2="10"></line>
                <line x1="21" y1="6" x2="3" y2="6"></line>
                <line x1="21" y1="14" x2="11" y2="14"></line>
                <line x1="21" y1="18" x2="15" y2="18"></line>
              </svg>
              <span className="hidden sm:inline">مرتب‌سازی:</span>
              <span className="text-emerald-700 font-black">{SORT_LABELS[sortOption]}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Grid (2-col) vs Large Card (1-col) */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="نمایش شبکه‌ای (۲ ستونه)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('large')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'large' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="نمایش تکی بزرگ"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                  <line x1="9" y1="21" x2="9" y2="9"></line>
                </svg>
              </button>
            </div>

            {/* Total Results Count */}
            <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">
              {filteredProducts.length} اثر
            </span>
          </div>
        </div>

        {/* -------------------- 2. HORIZONTAL QUICK CATEGORY CHIPS -------------------- */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-hide -mx-1 px-1">
          {/* All */}
          <button
            type="button"
            onClick={() => setSelectedSpecialty('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedSpecialty === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            همه آثار ({products.length})
          </button>

          {/* Quick In-Stock Chip */}
          <button
            type="button"
            onClick={() => setOnlyInStock(prev => !prev)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              onlyInStock
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            <span>{onlyInStock ? '✓' : '📦'}</span>
            <span>فقط کالاهای موجود</span>
          </button>

          {/* Quick Pre-order Chip */}
          <button
            type="button"
            onClick={() => setOnlyPreOrder(prev => !prev)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              onlyPreOrder
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            <span>{onlyPreOrder ? '✓' : '✨'}</span>
            <span>امکان پیش‌سفارش</span>
          </button>

          {/* Artist Specialties Chips */}
          {availableSpecialties.map((spec) => {
            const isSelected = selectedSpecialty === spec.id || selectedSpecialty === spec.name;
            return (
              <button
                key={spec.id}
                type="button"
                onClick={() => setSelectedSpecialty(isSelected ? 'all' : spec.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {spec.name} {spec.count > 0 && `(${spec.count})`}
              </button>
            );
          })}
        </div>

        {/* -------------------- 3. ACTIVE FILTERS PILLS -------------------- */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
            <span className="text-[11px] font-bold text-slate-400">فیلترهای فعال:</span>

            {searchQuery && (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                <span>جستجو: {searchQuery}</span>
                <button type="button" onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-red-500 cursor-pointer">✕</button>
              </span>
            )}

            {selectedSpecialty !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                <span>تخصص: {availableSpecialties.find(s => s.id === selectedSpecialty || s.name === selectedSpecialty)?.name || selectedSpecialty}</span>
                <button type="button" onClick={() => setSelectedSpecialty('all')} className="text-purple-400 hover:text-red-500 cursor-pointer">✕</button>
              </span>
            )}

            {onlyInStock && (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                <span>فقط موجود</span>
                <button type="button" onClick={() => setOnlyInStock(false)} className="text-emerald-500 hover:text-red-500 cursor-pointer">✕</button>
              </span>
            )}

            {onlyPreOrder && (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                <span>امکان پیش‌سفارش</span>
                <button type="button" onClick={() => setOnlyPreOrder(false)} className="text-amber-500 hover:text-red-500 cursor-pointer">✕</button>
              </span>
            )}

            {maxPrice < maxPossiblePrice && (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                <span>قیمت تا {maxPrice.toLocaleString('fa-IR')} تومان</span>
                <button type="button" onClick={() => setMaxPrice(maxPossiblePrice)} className="text-slate-400 hover:text-red-500 cursor-pointer">✕</button>
              </span>
            )}

            <button
              type="button"
              onClick={clearAllFilters}
              className="text-[11px] font-bold text-red-600 hover:text-red-700 underline mr-auto cursor-pointer"
            >
              پاک کردن همه
            </button>
          </div>
        )}
      </div>

      {/* -------------------- 4. PRODUCTS DISPLAY GRID -------------------- */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-6 space-y-3">
          <span className="text-5xl block">🔍</span>
          <h3 className="font-bold text-base text-slate-800">هیچ اثری با مشخصات فیلتر شده یافت نشد!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            می‌توانید فیلترهای اعمال‌شده، بازه قیمت یا عبارت جستجو را تغییر دهید تا آثار هنرمند به شما نمایش داده شوند.
          </p>
          <button
            type="button"
            onClick={clearAllFilters}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>🔄</span>
            <span>مشاهده همه آثار هنرمند</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* 2-Column Mobile Grid, 3-4 Column Desktop */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3.5 sm:gap-6">
          {filteredProducts.map((product) => {
            const isAvailable = product.stockQuantity > 0;
            const isPreOrder = !isAvailable && Boolean(product.isPreOrderEnabled);
            const isOutOfStock = !isAvailable && !product.isPreOrderEnabled;
            const priceValue = product.pricingTiers?.[0]?.price || product.price;

            return (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="group bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/90 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col"
              >
                {/* Image Container with Badges */}
                <div className="aspect-square sm:aspect-[4/5] bg-slate-100 relative overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Out of Stock Overlay */}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center p-2 text-center z-10">
                      <span className="bg-slate-900 text-white font-bold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[10px] sm:text-xs shadow-md">
                        ناموجود
                      </span>
                    </div>
                  )}

                  {/* Pre-Order Badge */}
                  {isPreOrder && (
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
                      <span className="bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold px-2 py-1 sm:px-2.5 sm:py-1 rounded-xl text-[10px] sm:text-xs shadow-md flex items-center gap-1">
                        <span>✨</span>
                        <span>پیش‌سفارش</span>
                      </span>
                    </div>
                  )}

                  {/* Specialty Tag on top-left */}
                  {product.specialties && product.specialties.length > 0 && (
                    <div className="absolute bottom-2 right-2 sm:bottom-2.5 sm:right-2.5 z-10">
                      <span className="bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-xs border border-white/60">
                        {product.specialties[0].name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-3 sm:p-4 flex flex-col justify-between flex-1">
                  <h3 className="font-bold text-slate-900 text-xs sm:text-base line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors mb-2">
                    {product.title}
                  </h3>

                  <div className="mt-auto pt-2 border-t border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    {product.status !== 'APPROVED' ? (
                      <span className="text-emerald-700 font-bold text-xs">بزودی...</span>
                    ) : isOutOfStock ? (
                      <span className="text-slate-400 font-bold text-xs">ناموجود</span>
                    ) : (
                      <div className="flex flex-col">
                        <span className={`font-black text-xs sm:text-base ${isPreOrder ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {priceValue ? Number(priceValue).toLocaleString('fa-IR') + ' تومان' : 'نامشخص'}
                        </span>
                        {isPreOrder && (
                          <span className="text-[9px] sm:text-[10px] text-amber-600 font-bold">سفارش ساخت</span>
                        )}
                      </div>
                    )}
                    <span className="hidden sm:inline-block bg-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-700 text-slate-700 px-3 py-1 rounded-xl text-xs font-bold transition-colors self-end sm:self-auto">
                      مشاهده
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* 1-Column Large Hero Cards */
        <div className="space-y-4">
          {filteredProducts.map((product) => {
            const isAvailable = product.stockQuantity > 0;
            const isPreOrder = !isAvailable && Boolean(product.isPreOrderEnabled);
            const isOutOfStock = !isAvailable && !product.isPreOrderEnabled;
            const priceValue = product.pricingTiers?.[0]?.price || product.price;

            return (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="group bg-white rounded-3xl overflow-hidden border border-slate-200 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row"
              >
                <div className="w-full sm:w-56 aspect-[4/3] sm:aspect-square bg-slate-100 relative overflow-hidden shrink-0">
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center p-2 text-center">
                      <span className="bg-slate-900 text-white font-bold px-3 py-1 rounded-xl text-xs shadow-md">
                        ناموجود
                      </span>
                    </div>
                  )}
                  {isPreOrder && (
                    <div className="absolute top-3 right-3 z-10">
                      <span className="bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-md flex items-center gap-1">
                        <span>✨</span>
                        <span>امکان ثبت پیش‌سفارش</span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 sm:p-6 flex flex-col justify-between flex-1">
                  <div>
                    {product.specialties && product.specialties.length > 0 && (
                      <span className="inline-block bg-emerald-50 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-lg mb-2">
                        {product.specialties[0].name}
                      </span>
                    )}
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg group-hover:text-emerald-700 transition-colors">
                      {product.title}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                    <div>
                      {isOutOfStock ? (
                        <span className="text-slate-400 font-bold text-sm">ناموجود</span>
                      ) : (
                        <div className="flex flex-col">
                          <span className={`font-black text-base sm:text-lg ${isPreOrder ? 'text-amber-700' : 'text-emerald-700'}`}>
                            {priceValue ? Number(priceValue).toLocaleString('fa-IR') + ' تومان' : 'نامشخص'}
                          </span>
                          {isPreOrder && (
                            <span className="text-[11px] text-amber-600 font-bold">امکان ثبت پیش‌سفارش ساخت</span>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="bg-slate-900 text-white group-hover:bg-emerald-600 px-4 py-2 rounded-xl text-xs font-bold transition-colors">
                      مشاهده جزئیات اثر ←
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* -------------------- 5. MOBILE FILTER BOTTOM SHEET (DRAWER) -------------------- */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsFilterOpen(false)}
          />

          {/* Drawer Sheet */}
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col z-10 animate-in slide-in-from-bottom-5 duration-200">
            {/* Grab Handle for Mobile */}
            <div className="sm:hidden pt-3 pb-1 flex justify-center">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎛️</span>
                <h3 className="font-black text-slate-900 text-base">فیلتر آثار هنرمند</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-right">
              {/* Status Toggles: In-stock & Pre-order */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <label className="text-xs font-black text-slate-800 block mb-2">وضعیت آماده‌سازی و سفارش:</label>
                
                {/* In-Stock Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">فقط آثار موجود در کارگاه</span>
                    <span className="text-[10px] text-slate-400">آثاری که آماده ارسال فوری هستند</span>
                  </div>
                  <button
                    type="button"
                    dir="ltr"
                    onClick={() => setOnlyInStock(prev => !prev)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      onlyInStock ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        onlyInStock ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="h-px bg-slate-200/60 my-1" />

                {/* Pre-Order Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">آثار دارای امکان پیش‌سفارش</span>
                    <span className="text-[10px] text-slate-400">هنرمند این اثر را به صورت سفارشی می‌سازد</span>
                  </div>
                  <button
                    type="button"
                    dir="ltr"
                    onClick={() => setOnlyPreOrder(prev => !prev)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      onlyPreOrder ? 'bg-amber-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        onlyPreOrder ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Price Range Slider (Fixed Correct Direction & Labels) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800">محدوده قیمت:</label>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                    تا {maxPrice.toLocaleString('fa-IR')} تومان
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max={maxPossiblePrice}
                  step={maxPossiblePrice > 5000000 ? 500000 : 200000}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                  dir="ltr"
                />

                {/* Min / Max Numbers: 0 on LEFT, Max on RIGHT matching LTR Slider */}
                <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium" dir="ltr">
                  <span>۰ تومان</span>
                  <span>{maxPossiblePrice.toLocaleString('fa-IR')} تومان</span>
                </div>
              </div>

              {/* Specialties / Art Categories */}
              {availableSpecialties.length > 0 && (
                <div className="space-y-2.5">
                  <label className="text-xs font-black text-slate-800 block">دسته‌بندی و سبک هنری:</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSpecialty('all')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedSpecialty === 'all'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      همه سبک‌ها
                    </button>
                    {availableSpecialties.map((spec) => {
                      const isSelected = selectedSpecialty === spec.id || selectedSpecialty === spec.name;
                      return (
                        <button
                          key={spec.id}
                          type="button"
                          onClick={() => setSelectedSpecialty(isSelected ? 'all' : spec.id)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-purple-700 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {spec.name} {spec.count > 0 && `(${spec.count})`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-4 py-3 rounded-2xl text-xs font-bold text-slate-600 hover:text-red-600 transition-colors cursor-pointer shrink-0"
              >
                حذف فیلترها
              </button>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-2xl shadow-lg shadow-emerald-600/20 transition-all text-center cursor-pointer"
              >
                مشاهده نتایج ({filteredProducts.length} اثر)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 6. MOBILE SORT BOTTOM SHEET (DRAWER) -------------------- */}
      {isSortOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsSortOpen(false)}
          />

          {/* Drawer Sheet */}
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col z-10 animate-in slide-in-from-bottom-5 duration-200">
            {/* Grab Handle */}
            <div className="sm:hidden pt-3 pb-1 flex justify-center">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-lg">⇅</span>
                <h3 className="font-black text-slate-900 text-base">مرتب‌سازی آثار بر اساس</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSortOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Sort Options List */}
            <div className="p-4 divide-y divide-slate-100">
              {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => {
                const isSelected = sortOption === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSortOption(key);
                      setIsSortOpen(false);
                    }}
                    className={`w-full py-3.5 px-4 text-right rounded-2xl flex items-center justify-between text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{SORT_LABELS[key]}</span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
