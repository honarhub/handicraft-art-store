'use client';

import React from 'react';
import Image from 'next/image';
import { Product, PricingTier } from '../types';
import { DynamicPricing } from './DynamicPricing';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, selectedTier: PricingTier) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const [selectedTier, setSelectedTier] = React.useState<PricingTier | null>(null);

  const handleAddToCart = () => {
    if (selectedTier) {
      onAddToCart(product, selectedTier);
    }
  };

  return (
    <article className="flex flex-col md:flex-row bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 max-w-5xl mx-auto">
      {/* Product Image Section */}
      <div className="relative w-full md:w-1/2 h-64 md:h-auto min-h-[400px] bg-gray-50">
        <Image
          src={product.imageUrl}
          alt={`تصویر ${product.title}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
        <div className="absolute top-4 right-4 flex gap-2">
          {product.tags.map(tag => (
            <span key={tag} className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold rounded-full shadow-sm">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Product Details Section */}
      <div className="w-full md:w-1/2 p-8 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden relative">
            {/* Simple placeholder for artist avatar if no URL */}
            <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-bold">
              {product.artist.name.charAt(0)}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">اثری از هنرمند</p>
            <p className="font-semibold text-gray-900">{product.artist.name}</p>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">{product.title}</h1>
        
        {/* Security Consideration: Using standard React rendering which escapes HTML by default. 
            If rich text is needed later, we must use a sanitizer like DOMPurify before dangerouslySetInnerHTML. */}
        <p className="text-gray-600 leading-relaxed mb-6">
          {product.description}
        </p>

        {/* Dynamic Pricing Module */}
        <div className="mt-auto">
          <DynamicPricing 
            pricingTiers={product.pricingTiers} 
            onSelectTier={(tier) => setSelectedTier(tier)} 
          />
          
          <button
            onClick={handleAddToCart}
            disabled={!selectedTier}
            className={`
              w-full mt-8 py-4 rounded-xl font-bold text-lg transition-all duration-300
              ${selectedTier 
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg hover:-translate-y-0.5' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
            `}
          >
            {selectedTier ? 'افزودن به سبد خرید' : 'لطفاً ابتدا نحوه تحویل را انتخاب کنید'}
          </button>
        </div>
      </div>
    </article>
  );
};
