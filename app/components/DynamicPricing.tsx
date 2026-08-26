'use client';

import React, { useState } from 'react';
import { PricingTier } from '../types';

interface DynamicPricingProps {
  pricingTiers: PricingTier[];
  onSelectTier: (tier: PricingTier) => void;
}

export const DynamicPricing: React.FC<DynamicPricingProps> = ({ pricingTiers, onSelectTier }) => {
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);

  const handleSelect = (tier: PricingTier) => {
    if (!tier.isAvailable) return;
    setSelectedTierId(tier.id);
    onSelectTier(tier);
  };

  if (!pricingTiers || pricingTiers.length === 0) {
    return <div className="text-red-500">اطلاعات قیمت‌گذاری موجود نیست.</div>;
  }

  return (
    <div className="flex flex-col gap-4 mt-6">
      <h3 className="text-lg font-semibold text-gray-800">انتخاب زمان تحویل و قیمت:</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pricingTiers.map((tier) => (
          <button
            key={tier.id}
            disabled={!tier.isAvailable}
            onClick={() => handleSelect(tier)}
            aria-pressed={selectedTierId === tier.id}
            className={`
              flex flex-col items-start p-4 border rounded-xl transition-all duration-200 text-right
              ${!tier.isAvailable ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-emerald-500 hover:shadow-md cursor-pointer bg-white'}
              ${selectedTierId === tier.id ? 'border-emerald-600 ring-2 ring-emerald-200 shadow-sm' : 'border-gray-200'}
            `}
          >
            <div className="flex justify-between w-full items-center mb-2">
              <span className="font-bold text-gray-900">{tier.title}</span>
              {selectedTierId === tier.id && (
                <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs">انتخاب شده</span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-4">{tier.description}</p>
            <div className="mt-auto w-full">
              <p className="text-xs text-gray-500 mb-1">زمان تحویل: {tier.deliveryTime}</p>
              <p className="text-xl font-bold text-emerald-700">
                {new Intl.NumberFormat('fa-IR').format(tier.price)} <span className="text-sm font-normal">تومان</span>
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
