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
  tiers: PreOrderTier[];
  setTiers: (tiers: PreOrderTier[]) => void;
}

export default function PreOrderManager({
  basePrice,
  isPreOrderEnabled,
  setIsPreOrderEnabled,
  tiers,
  setTiers
}: PreOrderManagerProps) {
  // Ensure all 5 standard tiers exist
  const effectiveTiers: PreOrderTier[] = DEFAULT_PREORDER_TIERS.map(def => {
    const existing = tiers?.find(t => t.id === def.id || t.duration === def.duration);
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
    setTiers(updated);
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
        <div className="mt-4 pt-4 border-t border-purple-100 space-y-3">
          <p className="text-xs text-purple-800 font-bold">
            بازه(های) زمانی فعال برای این اثر را انتخاب کرده و قیمت هر بازه را مشخص فرمایید:
          </p>

          <div className="space-y-3">
            {effectiveTiers.map((tier) => (
              <div 
                key={tier.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                  tier.active 
                    ? 'bg-white border-purple-300 shadow-xs' 
                    : 'bg-white/50 border-slate-200 opacity-70'
                }`}
              >
                {/* Checkbox & Label */}
                <label className="flex items-center gap-2.5 cursor-pointer">
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
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <select
                      value={tier.priceType}
                      onChange={(e) => {
                        const newType = e.target.value as 'PERCENTAGE' | 'FIXED';
                        let newValue = tier.value;
                        if (newType === 'FIXED') {
                          // وقتی مبلغ ثابت انتخاب می‌شود، قیمت پایه به عنوان پیش‌فرض قرار می‌گیرد
                          newValue = tier.calculatedPrice > 0 ? tier.calculatedPrice : (basePrice > 0 ? basePrice : 0);
                        } else if (newType === 'PERCENTAGE') {
                          // وقتی درصد انتخاب می‌شود، اگر عدد خیلی بزرگ بود به درصد منطقی تبدیل شود
                          newValue = (basePrice > 0 && tier.value > 200) ? Math.min(100, Math.round((tier.value / basePrice) * 100)) : (tier.value || 90);
                        }
                        updateTier(tier.id, { priceType: newType, value: newValue });
                      }}
                      className="text-xs font-bold border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:border-purple-500 outline-none cursor-pointer"
                    >
                      <option value="PERCENTAGE">درصد از قیمت پایه</option>
                      <option value="FIXED">مبلغ ثابت (تومان)</option>
                    </select>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step={tier.priceType === 'PERCENTAGE' ? 5 : 10000}
                        min={tier.priceType === 'PERCENTAGE' ? 5 : 0}
                        max={tier.priceType === 'PERCENTAGE' ? 200 : undefined}
                        value={tier.value || ''}
                        onChange={(e) => updateTier(tier.id, { value: parseFloat(e.target.value) || 0 })}
                        placeholder={tier.priceType === 'PERCENTAGE' ? 'مثلا ۹۰' : 'مبلغ به تومان'}
                        className="w-28 text-xs font-bold border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-purple-500 outline-none"
                      />
                      <span className="text-xs text-slate-500 font-bold">
                        {tier.priceType === 'PERCENTAGE' ? '٪' : 'تومان'}
                      </span>
                    </div>

                    {/* Calculated preview */}
                    <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                      مبلغ نهایی: {tier.calculatedPrice.toLocaleString('fa-IR')} تومان
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">غیرفعال</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
