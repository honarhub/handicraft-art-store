'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface ArtistSidebarNavProps {
  initialUnreadFeedbackCount: number;
  verificationLevel?: number;
}

function MedalStarIcon({ level, active }: { level: number; active: boolean }) {
  if (active) {
    return (
      <span
        title={`مدال سطح ${level}: کسب شده`}
        className="inline-flex items-center justify-center transition-transform hover:scale-110 drop-shadow-sm"
      >
        <svg width="18" height="22" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Ribbon */}
          <path d="M7 2L12 8L17 2V9L12 13L7 9V2Z" fill="#F59E0B" />
          <path d="M7 2L12 8V13L7 9V2Z" fill="#D97706" opacity="0.7" />
          {/* Medallion Coin */}
          <circle cx="12" cy="18" r="7.5" fill="url(#goldGradientSidebar)" stroke="#B45309" strokeWidth="1.2" />
          {/* Star in Center */}
          <path d="M12 13.8L13.1 16.3L15.8 16.6L13.8 18.4L14.4 21.1L12 19.6L9.6 21.1L10.2 18.4L8.2 16.6L10.9 16.3L12 13.8Z" fill="#78350F" />
          <defs>
            <linearGradient id="goldGradientSidebar" x1="6" y1="12" x2="18" y2="24" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE047" />
              <stop offset="0.5" stopColor="#FBBF24" />
              <stop offset="1" stopColor="#D97706" />
            </linearGradient>
          </defs>
        </svg>
      </span>
    );
  }

  return (
    <span
      title={`مدال سطح ${level}: قفل`}
      className="inline-flex items-center justify-center opacity-35 grayscale"
    >
      <svg width="18" height="22" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 2L12 8L17 2V9L12 13L7 9V2Z" fill="#6B7280" />
        <circle cx="12" cy="18" r="7.5" fill="#374151" stroke="#6B7280" strokeWidth="1.2" />
        <path d="M12 13.8L13.1 16.3L15.8 16.6L13.8 18.4L14.4 21.1L12 19.6L9.6 21.1L10.2 18.4L8.2 16.6L10.9 16.3L12 13.8Z" fill="#1F2937" />
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

    const interval = setInterval(fetchCounts, 5000);

    return () => {
      window.removeEventListener('artist-counts-update', handleUpdate);
      window.removeEventListener('artist-status-updated', handleStatusUpdate);
      window.removeEventListener('focus', fetchCounts);
      clearInterval(interval);
    };
  }, [fetchCounts]);

  const navItems = [
    {
      href: '/artist-panel/dashboard',
      label: '📊 پیشخوان من',
    },
    {
      href: '/artist-panel/products',
      label: '📦 مدیریت آثار و محصولات',
      badge: unreadCount,
    },
    {
      href: '/artist-panel/profile',
      label: '👤 پروفایل',
    },
    {
      href: '/artist-panel/verification',
      label: '🎖️ سطوح احراز هویت',
      isVerification: true,
    },
    {
      href: '/artist-panel/security',
      label: '🔒 تنظیمات امنیتی',
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
              {item.label}
            </span>

            {/* 3 Medal Icons for Verification Tiers */}
            {item.isVerification && (
              <div 
                className="flex items-center gap-1 bg-teal-950/40 px-2 py-1 rounded-full border border-teal-800/40 shadow-xs" 
                title={`سطح احراز هویت: ${level} از ۳`}
              >
                <MedalStarIcon level={1} active={level >= 1} />
                <MedalStarIcon level={2} active={level >= 2} />
                <MedalStarIcon level={3} active={level >= 3} />
              </div>
            )}

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
