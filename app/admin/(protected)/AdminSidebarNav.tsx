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
    // 1. برخط: گوش دادن به رویداد کاستوم برای آپدیت فوری هنگام تغییر توسط ادمین در صفحات
    const handleUpdate = () => {
      fetchCounts();
    };

    window.addEventListener('admin-counts-update', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    // 2. برخط: پولینگ دوره‌ای هر ۵ ثانیه برای دریافت تغییرات بدون رفرش
    const interval = setInterval(fetchCounts, 5000);

    return () => {
      window.removeEventListener('admin-counts-update', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      clearInterval(interval);
    };
  }, [fetchCounts]);

  const navItems = [
    { 
      href: '/admin/dashboard', 
      label: '📊 پیشخوان اصلی' 
    },
    { 
      href: '/admin/artists', 
      label: '🎭 مدیریت هنرمندان', 
      count: counts.pendingArtistsCount, 
      countTitle: 'درخواست‌های ویرایش هنرمندان',
      newCount: counts.newRegistrationsCount,
      newTitle: 'ثبت‌نام جدید در انتظار تایید'
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
