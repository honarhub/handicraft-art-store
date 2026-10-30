'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface ArtistSidebarNavProps {
  initialUnreadFeedbackCount: number;
  verificationLevel?: number;
}

const MEDAL_THEMES: Record<number, {
  ribbon1: string;
  ribbon2: string;
  stroke: string;
  innerStroke: string;
  textFill: string;
  gradientId: string;
  stops: { offset?: number; color: string }[];
}> = {
  1: {
    ribbon1: '#F59E0B',
    ribbon2: '#D97706',
    stroke: '#B45309',
    innerStroke: '#FEF08A',
    textFill: '#78350F',
    gradientId: 'navMedalYellowGradient',
    stops: [
      { color: '#FDE047' },
      { offset: 0.4, color: '#FBBF24' },
      { offset: 1.0, color: '#D97706' },
    ],
  },
  2: {
    ribbon1: '#3B82F6',
    ribbon2: '#2563EB',
    stroke: '#1D4ED8',
    innerStroke: '#BFDBFE',
    textFill: '#1E3A8A',
    gradientId: 'navMedalBlueGradient',
    stops: [
      { color: '#93C5FD' },
      { offset: 0.4, color: '#60A5FA' },
      { offset: 1.0, color: '#2563EB' },
    ],
  },
  3: {
    ribbon1: '#10B981',
    ribbon2: '#059669',
    stroke: '#047857',
    innerStroke: '#A7F3D0',
    textFill: '#064E3B',
    gradientId: 'navMedalGreenGradient',
    stops: [
      { color: '#6EE7B7' },
      { offset: 0.4, color: '#34D399' },
      { offset: 1.0, color: '#059669' },
    ],
  },
};

function NavMedalLevelIcon({ level }: { level: number }) {
  const currentLvl = level > 0 ? (level > 3 ? 3 : level) : 1;
  const persianNums: Record<number, string> = { 1: '۱', 2: '۲', 3: '۳' };
  const numText = persianNums[currentLvl] || String(currentLvl);
  const theme = MEDAL_THEMES[currentLvl] || MEDAL_THEMES[1];

  return (
    <span 
      className="inline-flex items-center justify-center shrink-0 transition-transform drop-shadow-sm -my-1"
      title={`احراز هویت: سطح ${numText}`}
    >
      <svg width="28" height="34" viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Ribbon */}
        <path d="M8 2L14 10L20 2V12L14 16L8 12V2Z" fill={theme.ribbon1} />
        <path d="M8 2L14 10V16L8 12V2Z" fill={theme.ribbon2} opacity="0.8" />
        {/* Medallion Coin Outer */}
        <circle cx="14" cy="21" r="11" fill={`url(#${theme.gradientId})`} stroke={theme.stroke} strokeWidth="1.5" />
        {/* Inner ring */}
        <circle cx="14" cy="21" r="8.5" stroke={theme.innerStroke} strokeWidth="1" fill="none" opacity="0.8" />
        {/* Number inside medal */}
        <text
          x="14"
          y="25"
          textAnchor="middle"
          fill={theme.textFill}
          fontSize="13"
          fontWeight="900"
          className="select-none font-bold"
          style={{ fontFamily: 'inherit' }}
        >
          {numText}
        </text>
        <defs>
          <linearGradient id={theme.gradientId} x1="5" y1="12" x2="23" y2="30" gradientUnits="userSpaceOnUse">
            {theme.stops.map((s, idx) => (
              <stop key={idx} offset={s.offset} stopColor={s.color} />
            ))}
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
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      href: '/artist-panel/verification',
      label: 'سطوح احراز هویت',
      icon: <NavMedalLevelIcon level={level} />,
    },
    {
      href: '/artist-panel/referrals',
      label: 'دعوت از هنرمندان',
      icon: <span className="text-base">🤝</span>,
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
