'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface ArtistSidebarNavProps {
  initialUnreadFeedbackCount: number;
  verificationLevel?: number;
}

function NavMedalLevelIcon({ level }: { level: number }) {
  const currentLvl = level > 0 ? level : 1;
  const persianNums: Record<number, string> = { 1: '۱', 2: '۲', 3: '۳' };
  const numText = persianNums[currentLvl] || String(currentLvl);

  return (
    <span 
      className="inline-flex items-center justify-center shrink-0 transition-transform drop-shadow-sm -my-1"
      title={`احراز هویت: سطح ${numText}`}
    >
      <svg width="28" height="34" viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Ribbon */}
        <path d="M8 2L14 10L20 2V12L14 16L8 12V2Z" fill="#F59E0B" />
        <path d="M8 2L14 10V16L8 12V2Z" fill="#D97706" opacity="0.8" />
        {/* Medallion Coin Outer */}
        <circle cx="14" cy="21" r="11" fill="url(#navMedalGoldGradient)" stroke="#B45309" strokeWidth="1.5" />
        {/* Inner ring */}
        <circle cx="14" cy="21" r="8.5" stroke="#FEF08A" strokeWidth="1" fill="none" opacity="0.8" />
        {/* Number inside medal */}
        <text
          x="14"
          y="25"
          textAnchor="middle"
          fill="#78350F"
          fontSize="13"
          fontWeight="900"
          className="select-none font-bold"
          style={{ fontFamily: 'inherit' }}
        >
          {numText}
        </text>
        <defs>
          <linearGradient id="navMedalGoldGradient" x1="5" y1="12" x2="23" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FDE047" />
            <stop offset="0.4" stopColor="#FBBF24" />
            <stop offset="1" stopColor="#D97706" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}

export default function ArtistSidebarNav({ initialUnreadFeedbackCount, verificationLevel = 0 }: ArtistSidebarNavProps) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadFeedbackCount);
  const [level, setLevel] = useState<number>(verificationLevel);

  useEffect(() => {
    setLevel(verificationLevel);
  }, [verificationLevel]);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/artist/counts', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.unreadFeedbackCount === 'number') {
          setUnreadCount(data.unreadFeedbackCount);
        }
      }
    } catch {
      // Ignore network glitch
    }
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      setUnreadCount(prev => Math.max(0, prev - 1));
      fetchCounts();
    };

    const handleStatusUpdate = (e: any) => {
      if (e.detail && typeof e.detail.verificationLevel === 'number') {
        setLevel(e.detail.verificationLevel);
      }
    };

    window.addEventListener('artist-counts-update', handleUpdate);
    window.addEventListener('artist-status-updated', handleStatusUpdate);
    window.addEventListener('focus', fetchCounts);

    return () => {
      window.removeEventListener('artist-counts-update', handleUpdate);
      window.removeEventListener('artist-status-updated', handleStatusUpdate);
      window.removeEventListener('focus', fetchCounts);
    };
  }, [fetchCounts]);

  const navItems = [
    {
      href: '/artist-panel/dashboard',
      label: 'پیشخوان من',
      icon: <span className="text-base">📊</span>,
    },
    {
      href: '/artist-panel/products',
      label: 'مدیریت آثار و محصولات',
      icon: <span className="text-base">📦</span>,
      badge: unreadCount,
    },
    {
      href: '/artist-panel/profile',
      label: 'پروفایل',
      icon: <span className="text-base">👤</span>,
    },
    {
      href: '/artist-panel/verification',
      label: 'سطوح احراز هویت',
      icon: <NavMedalLevelIcon level={level} />,
    },
    {
      href: '/artist-panel/security',
      label: 'تنظیمات امنیتی',
      icon: <span className="text-base">🔒</span>,
    },
  ];

  return (
    <nav className="p-4 flex flex-col gap-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/artist-panel/dashboard' && pathname?.startsWith(item.href + '/'));
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-3 rounded-lg font-medium text-sm flex items-center justify-between transition-colors ${
              isActive
                ? 'bg-teal-700 text-white shadow-md'
                : 'hover:bg-teal-800 text-teal-100'
            }`}
          >
            <span className="flex items-center gap-3">
              {item.icon}
              <span>{item.label}</span>
            </span>

            {item.badge !== undefined && item.badge > 0 && (
              <span 
                title={`${item.badge} پیام خوانده نشده از ادمین`} 
                className="bg-amber-400 text-teal-950 font-black text-xs px-2 py-0.5 rounded-full animate-pulse shadow-sm"
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
