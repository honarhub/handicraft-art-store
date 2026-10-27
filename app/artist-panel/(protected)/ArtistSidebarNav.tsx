'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface ArtistSidebarNavProps {
  initialUnreadFeedbackCount: number;
  verificationLevel?: number;
}

export default function ArtistSidebarNav({ initialUnreadFeedbackCount, verificationLevel = 0 }: ArtistSidebarNavProps) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadFeedbackCount);

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
    // 1. Listen for real-time update when an admin message is acknowledged
    const handleUpdate = () => {
      // Optimistically decrement count for instant feedback
      setUnreadCount(prev => Math.max(0, prev - 1));
      // Sync fresh count from server
      fetchCounts();
    };

    window.addEventListener('artist-counts-update', handleUpdate);
    window.addEventListener('focus', fetchCounts);

    // 2. Poll every 5 seconds to catch new feedback and approvals without reloading
    const interval = setInterval(fetchCounts, 5000);

    return () => {
      window.removeEventListener('artist-counts-update', handleUpdate);
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
      href: '/artist-panel/onboarding',
      label: '🎖️ سطوح احراز هویت',
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
            {item.href === '/artist-panel/onboarding' && (
              <span 
                className="bg-amber-400 text-teal-950 font-black text-xs px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm"
                title={`سطح احراز هویت: ${verificationLevel}`}
              >
                <span>⭐</span>
                <span>{verificationLevel}</span>
              </span>
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
