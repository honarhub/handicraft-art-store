'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  imageUrl: string;
  artistName: string;
  quantity: number;
  maxStock: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, requestedQuantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
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
        setItems(JSON.parse(savedCart));
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

  const addToCart = (newItem: Omit<CartItem, 'quantity'>, requestedQuantity: number = 1) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find(item => item.productId === newItem.productId);
      
      if (existingItem) {
        // Calculate new quantity, capping at maxStock
        const newQuantity = Math.min(existingItem.quantity + requestedQuantity, existingItem.maxStock);
        return prevItems.map(item => 
          item.productId === newItem.productId 
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        // Add new item, capping at maxStock
        const initialQuantity = Math.min(requestedQuantity, newItem.maxStock);
        return [...prevItems, { ...newItem, quantity: initialQuantity }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.productId === productId) {
        // Ensure quantity is between 1 and maxStock
        const safeQuantity = Math.max(1, Math.min(quantity, item.maxStock));
        return { ...item, quantity: safeQuantity };
      }
      return item;
    }));
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
