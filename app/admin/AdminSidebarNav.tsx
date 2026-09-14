'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface AdminSidebarNavProps {
  pendingArtistsCount: number;
  pendingProductsCount: number;
  pendingSpecialtiesCount: number;
}

export default function AdminSidebarNav({ pendingArtistsCount, pendingProductsCount, pendingSpecialtiesCount }: AdminSidebarNavProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin/dashboard', label: '📊 پیشخوان اصلی' },
    { href: '/admin/artists', label: '🎭 مدیریت هنرمندان', count: pendingArtistsCount, badgeColor: 'bg-yellow-500 text-yellow-900 shadow-[0_0_8px_rgba(234,179,8,0.5)]' },
    { href: '/admin/products', label: '📦 مدیریت محصولات', count: pendingProductsCount, badgeColor: 'bg-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.5)]' },
    { href: '/admin/specialties', label: '🏷️ مدیریت تخصص‌ها', count: pendingSpecialtiesCount, badgeColor: 'bg-red-500 text-white' },
    { href: '/admin/support', label: '🎧 پشتیبانی و تیکت‌ها' },
    { href: '/admin/stock-requests', label: '🔔 درخواست‌های موجودی' },
  ];

  return (
    <nav className="p-4 flex flex-col gap-2">
      {navItems.map((item) => {
        // Highlight logic
        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
        
        return (
          <Link 
            key={item.href}
            href={item.href} 
            className={`px-4 py-3 rounded-lg font-medium text-sm flex items-center justify-between transition-colors ${
              isActive 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {item.label}
            </div>
            {!!item.count && item.count > 0 && (
              <span className={`${item.badgeColor} text-xs font-bold px-2 py-0.5 rounded-full animate-pulse`}>
                {item.count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
