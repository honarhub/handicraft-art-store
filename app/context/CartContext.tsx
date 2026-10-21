'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  id?: string;
  productId: string;
  title: string;
  price: number;
  imageUrl: string;
  artistName: string;
  quantity: number;
  maxStock: number;
  tierId?: string;
  tierTitle?: string;
  isPreOrder?: boolean;
  deliveryTime?: string;
}

export function getCartItemId(item: { productId: string; isPreOrder?: boolean; tierTitle?: string; id?: string }): string {
  if (item.id) return item.id;
  if (item.isPreOrder) {
    return `${item.productId}_preorder_${item.tierTitle || 'default'}`;
  }
  return `${item.productId}_instock`;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }, requestedQuantity?: number) => void;
  removeFromCart: (identifier: string) => void;
  updateQuantity: (identifier: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const savedCart = localStorage.getItem('handicraft_cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          // Normalize existing items to ensure each has an explicit id
          const normalized = parsed.map(item => ({
            ...item,
            id: getCartItemId(item)
          }));
          setItems(normalized);
        }
      } catch (e) {
        console.error('Failed to parse cart from local storage', e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('handicraft_cart', JSON.stringify(items));
    }
  }, [items, isMounted]);

  const addToCart = (newItem: Omit<CartItem, 'quantity'> & { quantity?: number }, requestedQuantity: number = 1) => {
    const itemKey = getCartItemId(newItem);
    setItems((prevItems) => {
      const existingItem = prevItems.find(item => getCartItemId(item) === itemKey);
      
      if (existingItem) {
        // Calculate new quantity, capping at maxStock
        const newQuantity = Math.min(existingItem.quantity + requestedQuantity, existingItem.maxStock);
        return prevItems.map(item => 
          getCartItemId(item) === itemKey 
            ? { ...item, ...newItem, id: itemKey, quantity: newQuantity }
            : item
        );
      } else {
        // Add new item, capping at maxStock
        const initialQuantity = Math.min(requestedQuantity, newItem.maxStock);
        return [...prevItems, { ...newItem, id: itemKey, quantity: initialQuantity }];
      }
    });
  };

  const removeFromCart = (identifier: string) => {
    setItems(prevItems => {
      const exactMatch = prevItems.some(item => getCartItemId(item) === identifier || item.id === identifier);
      if (exactMatch) {
        return prevItems.filter(item => getCartItemId(item) !== identifier && item.id !== identifier);
      }
      return prevItems.filter(item => item.productId !== identifier);
    });
  };

  const updateQuantity = (identifier: string, quantity: number) => {
    setItems(prevItems => {
      const exactMatch = prevItems.some(item => getCartItemId(item) === identifier || item.id === identifier);
      return prevItems.map(item => {
        const matches = exactMatch
          ? (getCartItemId(item) === identifier || item.id === identifier)
          : (item.productId === identifier);
        if (matches) {
          const safeQuantity = Math.max(1, Math.min(quantity, item.maxStock));
          return { ...item, quantity: safeQuantity };
        }
        return item;
      });
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = items.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
