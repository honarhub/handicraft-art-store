'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from '@/app/components/LogoutButton';

export interface AdminCounts {
  newRegistrationsCount: number;
  pendingArtistsCount: number;
  newProductsCount: number;
  pendingProductEditsCount: number;
  pendingSpecialtiesCount: number;
  pendingSupportCount: number;
  pendingStockRequestsCount: number;
}

interface AdminSidebarNavProps {
  initialCounts: AdminCounts;
}

export default function AdminSidebarNav({ initialCounts }: AdminSidebarNavProps) {
  const pathname = usePathname();
  const [counts, setCounts] = useState<AdminCounts>(initialCounts);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/counts', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCounts(data);
      }
    } catch {
      // Ignore network glitch
    }
  }, []);

  useEffect(() => {
    // 1. Real-time: listen for custom event on admin changes
    const handleUpdate = () => {
      fetchCounts();
    };

    window.addEventListener('admin-counts-update', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    return () => {
      window.removeEventListener('admin-counts-update', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, [fetchCounts]);

  const navItems = [
    { 
      href: '/', 
      label: (
        <span className="flex items-center gap-2.5 font-bold text-amber-300 hover:text-amber-200">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-amber-400">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>صفحه اصلی هنرهاب</span>
        </span>
      ),
      isHome: true
    },
    { 
      href: '/admin/dashboard', 
      label: '📊 پیشخوان اصلی' 
    },
    { 
      href: '/admin/artists', 
      label: (
        <span className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>مدیریت هنرمندان</span>
        </span>
      ), 
      count: counts.pendingArtistsCount, 
      countTitle: 'درخواست‌های ویرایش پروفایل هنرمندان',
      newCount: counts.newRegistrationsCount,
      newTitle: 'درخواست‌های ارتقا، احراز هویت و حذف حساب'
    },
    { 
      href: '/admin/users', 
      label: (
        <span className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>مدیریت کاربران</span>
        </span>
      )
    },
    { 
      href: '/admin/products', 
      label: '📦 مدیریت محصولات', 
      count: counts.pendingProductEditsCount,
      countTitle: 'تغییرات محصول در انتظار تایید',
      newCount: counts.newProductsCount,
      newTitle: 'محصول جدید در انتظار تایید'
    },
    { 
      href: '/admin/specialties', 
      label: '🏷️ مدیریت تخصص‌ها', 
      count: counts.pendingSpecialtiesCount,
      countTitle: 'تخصص‌های در انتظار تایید'
    },
    { 
      href: '/admin/referrals', 
      label: '🤝 کدهای معرف هنرمندان' 
    },
    { 
      href: '/admin/blog', 
      label: '📝 مدیریت وبلاگ و مقالات' 
    },
    { 
      href: '/admin/support', 
      label: '🎧 پشتیبانی و تیکت‌ها',
      count: counts.pendingSupportCount,
      countTitle: 'پیام‌های پشتیبانی در انتظار پاسخ'
    },
    { 
      href: '/admin/online-support', 
      label: '💬 پشتیبانی آنلاین' 
    },
    { 
      href: '/admin/stock-requests', 
      label: '🔔 درخواست‌های موجودی',
      count: counts.pendingStockRequestsCount,
      countTitle: 'درخواست‌های موجودی در انتظار رسیدگی'
    },
    { 
      href: '/admin/settings', 
      label: '⚙️ تنظیمات سایت' 
    },
  ];

  return (
    <nav className="p-4 flex flex-col gap-2 font-sans">
      {navItems.map((item) => {
        // Highlight logic
        const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href + '/'));
        
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
            <div className="flex items-center gap-1.5">
              {!!item.newCount && item.newCount > 0 && (
                <span title={item.newTitle} className="bg-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.5)] text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {item.newCount}
                </span>
              )}
              {!!item.count && item.count > 0 && (
                <span title={item.countTitle} className="bg-yellow-500 text-yellow-900 shadow-[0_0_8px_rgba(234,179,8,0.5)] text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {item.count}
                </span>
              )}
            </div>
          </Link>
        );
      })}

      <div className="mt-8 pt-4 border-t border-slate-800">
        <LogoutButton callbackUrl="/admin/login" className="px-4 py-3 w-full text-right rounded-lg hover:bg-red-900/50 text-red-400 transition-colors text-sm font-medium flex items-center gap-3">
          <span>🚪</span> خروج از کنترل پنل
        </LogoutButton>
      </div>
    </nav>
  );
}
