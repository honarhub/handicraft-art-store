'use client';

import React from 'react';

export interface PreOrderTier {
  id: string;
  duration: '1_WEEK' | '2_WEEKS' | '1_MONTH' | '3_MONTHS' | '6_MONTHS';
  label: string;
  priceType: 'PERCENTAGE' | 'FIXED';
  value: number;
  calculatedPrice: number;
  active: boolean;
}

export const DEFAULT_PREORDER_TIERS: PreOrderTier[] = [
  { id: '1_WEEK', duration: '1_WEEK', label: 'تحویل ۱ هفته‌ای', priceType: 'PERCENTAGE', value: 95, calculatedPrice: 0, active: false },
  { id: '2_WEEKS', duration: '2_WEEKS', label: 'تحویل ۲ هفته‌ای', priceType: 'PERCENTAGE', value: 90, calculatedPrice: 0, active: false },
  { id: '1_MONTH', duration: '1_MONTH', label: 'تحویل ۱ ماهه', priceType: 'PERCENTAGE', value: 80, calculatedPrice: 0, active: false },
  { id: '3_MONTHS', duration: '3_MONTHS', label: 'تحویل ۳ ماهه', priceType: 'PERCENTAGE', value: 70, calculatedPrice: 0, active: false },
  { id: '6_MONTHS', duration: '6_MONTHS', label: 'تحویل ۶ ماهه', priceType: 'PERCENTAGE', value: 50, calculatedPrice: 0, active: false }
];

interface PreOrderManagerProps {
  basePrice: number;
  isPreOrderEnabled: boolean;
  setIsPreOrderEnabled: (val: boolean) => void;
  tiers: any;
  setTiers: (tiers: any) => void;
}

export default function PreOrderManager({
  basePrice,
  isPreOrderEnabled,
  setIsPreOrderEnabled,
  tiers,
  setTiers
}: PreOrderManagerProps) {
  // Extract tiers list and capacity limit settings (supports array or object format)
  const rawTiersList: PreOrderTier[] = Array.isArray(tiers)
    ? tiers
    : (tiers && typeof tiers === 'object' && Array.isArray(tiers.tiers) ? tiers.tiers : DEFAULT_PREORDER_TIERS);

  const hasCapacityLimit: boolean = (tiers && typeof tiers === 'object' && !Array.isArray(tiers))
    ? Boolean(tiers.hasCapacityLimit)
    : false;

  const maxCapacity: number | null = (tiers && typeof tiers === 'object' && !Array.isArray(tiers))
    ? (tiers.maxCapacity !== undefined && tiers.maxCapacity !== null && tiers.maxCapacity !== '' ? Number(tiers.maxCapacity) : null)
    : null;

  // Ensure all 5 standard tiers exist
  const effectiveTiers: PreOrderTier[] = DEFAULT_PREORDER_TIERS.map(def => {
    const existing = rawTiersList?.find(t => t.id === def.id || t.duration === def.duration);
    if (existing) {
      const calculated = existing.priceType === 'PERCENTAGE'
        ? Math.round((basePrice * (existing.value || 100)) / 100)
        : (existing.value || basePrice);
      return { ...existing, calculatedPrice: calculated };
    }
    return {
      ...def,
      calculatedPrice: Math.round((basePrice * def.value) / 100)
    };
  });

  const emitUpdate = (newTiers: PreOrderTier[], newHasLimit: boolean, newCapacity: number | null) => {
    setTiers({
      tiers: newTiers,
      hasCapacityLimit: newHasLimit,
      maxCapacity: newCapacity
    });
  };

  const updateTier = (id: string, updates: Partial<PreOrderTier>) => {
    const updated = effectiveTiers.map(t => {
      if (t.id === id) {
        const merged = { ...t, ...updates };
        const calculated = merged.priceType === 'PERCENTAGE'
          ? Math.round((basePrice * (merged.value || 100)) / 100)
          : (merged.value || basePrice);
        return { ...merged, calculatedPrice: calculated };
      }
      return t;
    });
    emitUpdate(updated, hasCapacityLimit, maxCapacity);
  };

  const handleToggleCapacityLimit = (checked: boolean) => {
    const newCap = checked ? (maxCapacity || 5) : null;
    emitUpdate(effectiveTiers, checked, newCap);
  };

  const handleCapacityChange = (valStr: string) => {
    const clean = valStr.replace(/[^0-9]/g, '');
    const num = clean ? parseInt(clean, 10) : 0;
    emitUpdate(effectiveTiers, true, num);
  };

  // Bounds for avoiding typos:
  const maxFixedPrice = basePrice > 0 ? Math.max(basePrice * 5, 20_000_000) : 500_000_000;
  const minFixedPrice = basePrice > 0 ? Math.max(10_000, Math.round(basePrice * 0.05)) : 10_000;

  const handleFixedChange = (tierId: string, inputVal: string) => {
    const cleanDigits = inputVal.replace(/[^0-9]/g, '');
    if (!cleanDigits) {
      updateTier(tierId, { value: 0 });
      return;
    }
    let num = parseInt(cleanDigits, 10);
    // Ceiling protection
    if (num > maxFixedPrice) {
      num = maxFixedPrice;
    }
    updateTier(tierId, { value: num });
  };

  const handleFixedBlur = (tierId: string, currentVal: number) => {
    if (!currentVal || currentVal <= 0) {
      updateTier(tierId, { value: basePrice > 0 ? basePrice : 0 });
      return;
    }
    // Floor protection
    if (currentVal < minFixedPrice) {
      updateTier(tierId, { value: minFixedPrice });
    }
  };

  const handlePercentageChange = (tierId: string, inputVal: string) => {
    const cleanDigits = inputVal.replace(/[^0-9]/g, '');
    if (!cleanDigits) {
      updateTier(tierId, { value: 0 });
      return;
    }
    let num = parseInt(cleanDigits, 10);
    if (num > 200) num = 200;
    updateTier(tierId, { value: num });
  };

  const handlePercentageBlur = (tierId: string, currentVal: number) => {
    if (!currentVal || currentVal < 5) {
      updateTier(tierId, { value: 5 });
    }
  };

  return (
    <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-5 md:p-6 space-y-4">
      {/* Pre-order Main Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg">
            ⏱️
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm md:text-base">قابلیت پیش‌سفارش و ساخت سفارشی</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              امکان سفارش ساخت در بازه‌های ۱ هفته تا ۶ ماه با تخفیف کارگاهی یا قیمت اختصاصی
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            checked={isPreOrderEnabled} 
            onChange={(e) => setIsPreOrderEnabled(e.target.checked)}
            className="sr-only peer" 
          />
          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
        </label>
      </div>

      {isPreOrderEnabled && (
        <div className="mt-4 pt-4 border-t border-purple-100 space-y-4">
          
          {/* Pre-Order Capacity Limit Control */}
          <div className="bg-white/90 p-4 rounded-xl border border-purple-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasCapacityLimit}
                onChange={(e) => handleToggleCapacityLimit(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer"
              />
              <div>
                <span className="font-bold text-xs sm:text-sm text-slate-800 block">
                  محدودیت سقف پذیرش سفارش (ظرفیت کارگاه)
                </span>
                <span className="text-[11px] text-slate-500 font-normal">
                  در صورت فعال‌سازی، پس از تکمیل این تعداد پیش‌سفارش، امکان سفارش‌گیری خودکار بسته می‌شود.
                </span>
              </div>
            </label>

            {hasCapacityLimit ? (
              <div className="flex items-center gap-2 shrink-0 bg-purple-50/60 p-1.5 px-3 rounded-lg border border-purple-200">
                <span className="text-xs text-purple-900 font-bold">سقف تعداد:</span>
                <div className="flex items-center border border-purple-300 rounded-md px-2 py-0.5 bg-white focus-within:ring-1 focus-within:ring-purple-500">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={maxCapacity !== null && maxCapacity > 0 ? maxCapacity : ''}
                    onChange={(e) => handleCapacityChange(e.target.value)}
                    placeholder="۵"
                    className="w-12 text-center text-xs font-bold outline-none"
                  />
                  <span className="text-[10px] text-slate-400 font-bold mr-1">عدد</span>
                </div>
              </div>
            ) : (
              <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-bold shrink-0 text-center">
                ظرفیت نامحدود (بدون سقف عددی)
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-purple-800 pt-1">
            <span className="font-bold">بازه(های) زمانی فعال برای این اثر را انتخاب کرده و قیمت هر بازه را مشخص فرمایید:</span>
            {basePrice > 0 && (
              <span className="text-[11px] text-slate-500">
                (کف قیمت مجاز: {minFixedPrice.toLocaleString('fa-IR')} ت — سقف مجاز: {maxFixedPrice.toLocaleString('fa-IR')} ت)
              </span>
            )}
          </div>

          <div className="space-y-3">
            {effectiveTiers.map((tier) => (
              <div 
                key={tier.id}
                className={`flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                  tier.active 
                    ? 'bg-white border-purple-300 shadow-xs' 
                    : 'bg-white/50 border-slate-200 opacity-70'
                }`}
              >
                {/* Checkbox & Label */}
                <label className="flex items-center gap-2.5 cursor-pointer shrink-0 min-w-[130px]">
                  <input
                    type="checkbox"
                    checked={tier.active}
                    onChange={(e) => updateTier(tier.id, { active: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer"
                  />
                  <span className="font-bold text-sm text-slate-800">{tier.label}</span>
                </label>

                {/* Price configuration (when active) */}
                {tier.active ? (
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
                    {/* Select Dropdown */}
                    <select
                      value={tier.priceType}
                      onChange={(e) => {
                        const newType = e.target.value as 'PERCENTAGE' | 'FIXED';
                        let newValue = tier.value;
                        if (newType === 'FIXED') {
                          newValue = tier.calculatedPrice > 0 ? tier.calculatedPrice : (basePrice > 0 ? basePrice : 0);
                        } else if (newType === 'PERCENTAGE') {
                          newValue = (basePrice > 0 && tier.value > 200) ? Math.min(100, Math.round((tier.value / basePrice) * 100)) : (tier.value || 90);
                        }
                        updateTier(tier.id, { priceType: newType, value: newValue });
                      }}
                      className="w-[145px] shrink-0 text-xs font-bold border border-slate-300 rounded-lg px-2.5 py-2 bg-slate-50 focus:border-purple-500 outline-none cursor-pointer"
                    >
                      <option value="PERCENTAGE">درصد از قیمت پایه</option>
                      <option value="FIXED">مبلغ ثابت (تومان)</option>
                    </select>

                    {/* Price Input with commas for FIXED and step 5 for PERCENTAGE */}
                    <div className="w-[150px] shrink-0 flex items-center justify-between border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={
                          tier.priceType === 'PERCENTAGE'
                            ? (tier.value || '')
                            : (tier.value > 0 ? Number(tier.value).toLocaleString('en-US') : '')
                        }
                        onChange={(e) => {
                          if (tier.priceType === 'PERCENTAGE') {
                            handlePercentageChange(tier.id, e.target.value);
                          } else {
                            handleFixedChange(tier.id, e.target.value);
                          }
                        }}
                        onBlur={() => {
                          if (tier.priceType === 'PERCENTAGE') {
                            handlePercentageBlur(tier.id, tier.value);
                          } else {
                            handleFixedBlur(tier.id, tier.value);
                          }
                        }}
                        placeholder={tier.priceType === 'PERCENTAGE' ? 'مثلا ۹۰' : 'مبلغ به تومان'}
                        className="w-full text-xs font-bold outline-none bg-transparent"
                      />
                      <span className="text-[11px] text-slate-400 font-bold shrink-0 mr-1 select-none">
                        {tier.priceType === 'PERCENTAGE' ? '٪' : 'تومان'}
                      </span>
                    </div>

                    {/* Calculated preview with fixed dimensions */}
                    <div className="w-[185px] shrink-0 text-center text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                      مبلغ نهایی: <span className="font-black text-emerald-700">{tier.calculatedPrice.toLocaleString('fa-IR')}</span> تومان
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">غیرفعال برای این اثر</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
