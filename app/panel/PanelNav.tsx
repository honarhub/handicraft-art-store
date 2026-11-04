'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
  counts?: {
    orders?: number;
    wishlist?: number;
    addresses?: number;
  };
  isArtist?: boolean;
  isAdmin?: boolean;
}

export default function PanelNav({ counts, isArtist, isAdmin }: Props) {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/panel',
      label: 'پیشخوان',
      icon: '🏛️',
      badge: null,
      exact: true
    },
    {
      href: '/panel/profile',
      label: 'اطلاعات پروفایل',
      icon: '👤',
      badge: null,
      exact: false
    },
    {
      href: '/panel/orders',
      label: 'سفارش‌های من',
      icon: '📦',
      badge: counts?.orders ? counts.orders : null,
      exact: false
    },
    {
      href: '/panel/addresses',
      label: 'آدرس‌های من',
      icon: '📍',
      badge: counts?.addresses ? counts.addresses : null,
      exact: false
    },
    {
      href: '/panel/wishlist',
      label: 'علاقه‌مندی‌ها',
      icon: '🔖',
      badge: counts?.wishlist ? counts.wishlist : null,
      exact: false
    },
  ];

  const isActive = (itemHref: string, exact: boolean) => {
    if (exact) return pathname === itemHref;
    return pathname.startsWith(itemHref);
  };

  return (
    <nav className="w-full font-sans select-none" dir="rtl">
      {/* Mobile Swipeable Tab Bar */}
      <div className="md:hidden flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1 mb-4 border-b border-slate-200/80">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                active
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge !== null && item.badge > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  active ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Desktop Vertical Sidebar Card */}
      <div className="hidden md:block bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-1.5">
        <div className="px-3 py-2 text-xs font-bold text-slate-400">
          منوی حساب کاربری
        </div>

        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                active
                  ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge !== null && item.badge > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                  active ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Role Switchers */}
        {(isArtist || isAdmin) && (
          <div className="pt-4 mt-3 border-t border-slate-100 space-y-1.5">
            <div className="px-3 py-1 text-[11px] font-bold text-slate-400">
              سوییچ به پنل‌های مدیریتی
            </div>

            {isArtist && (
              <Link
                href="/artist-panel/dashboard"
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition-all"
              >
                <span>🎨</span>
                <span>پنل اختصاصی هنرمند</span>
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-purple-50/70 hover:bg-purple-100 text-purple-900 text-xs font-bold transition-all"
              >
                <span>⚡</span>
                <span>پنل مدیریت کل سیستم</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
