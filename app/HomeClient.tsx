'use client';

import React from 'react';
import { ProductCard } from './components/ProductCard';
import { Product, PricingTier } from './types';

interface HomeClientProps {
  product: Product;
}

export const HomeClient: React.FC<HomeClientProps> = ({ product }) => {
  const handleAddToCart = (selectedProduct: Product, tier: PricingTier) => {
    alert(`محصول "${selectedProduct.title}" با نحوه تحویل "${tier.title}" (مبلغ: ${tier.price} تومان) به سبد خرید اضافه شد.`);
  };

  return (
    <ProductCard product={product} onAddToCart={handleAddToCart} />
  );
};
