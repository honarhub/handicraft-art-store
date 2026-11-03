'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function UserNavDropdown() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Automatic Wishlist Synchronization: Sync localStorage guest bookmarks with Database upon login
  useEffect(() => {
    if (session?.user?.id) {
      try {
        const localSaved = localStorage.getItem('honarhub_wishlist');
        const localIds: string[] = localSaved ? JSON.parse(localSaved) : [];

        // Call sync API
        fetch('/api/user/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds: localIds })
        })
          .then((res) => res.json())
          .then((data) => {
            if (data?.success && Array.isArray(data.productIds)) {
              localStorage.setItem('honarhub_wishlist', JSON.stringify(data.productIds));
              window.dispatchEvent(new Event('wishlist-updated'));
            }
          })
          .catch((err) => console.error('Error syncing wishlist with account:', err));
      } catch (e) {
        console.error('Wishlist sync parse error:', e);
      }
    }
  }, [session?.user?.id]);

  // Loading state skeleton
  if (status === 'loading') {
    return (
      <div className="w-24 sm:w-28 h-9 rounded-xl bg-slate-100 animate-pulse border border-slate-200/60" />
    );
  }

  // Guest State: Standard Login Button
  if (!session || !session.user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl shadow-xs transition-all hover:text-emerald-700 active:scale-98"
      >
        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span>ورود / ثبت‌نام</span>
      </Link>
    );
  }

  const user = session.user;
  const displayName = user.name || (user.email ? user.email.split('@')[0] : 'کاربر گرامی');
  const userRole = (user.role as string) || 'USER';
  const isArtist = userRole === 'ARTIST' || userRole === 'ADMIN';
  const isAdmin = userRole === 'ADMIN';

  return (
    <div className="relative font-sans" ref={dropdownRef} dir="rtl">
      {/* User Button Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl shadow-xs transition-all active:scale-98 cursor-pointer select-none"
        aria-expanded={isOpen}
      >
        {/* Down Chevron Arrow (Right/Start side in RTL) */}
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-600' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>

        {/* User Name */}
        <span className="max-w-[100px] sm:max-w-[130px] truncate text-slate-900">
          {displayName}
        </span>

        {/* User Icon Avatar */}
        <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-teal-50 text-teal-700 border border-teal-200/80 flex items-center justify-center shrink-0 text-xs">
          {user.image ? (
            <img src={user.image} alt={displayName} className="w-full h-full rounded-lg object-cover" />
          ) : (
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </span>
      </button>

      {/* Dropdown Menu Modal */}
      {isOpen && (
        <div className="absolute left-0 sm:left-0 top-full mt-2 w-64 sm:w-72 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Top User Info Header - Clicking navigates to Profile */}
          <Link
            href="/panel/profile"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-3 mx-2 rounded-xl bg-slate-50 hover:bg-teal-50/60 border border-slate-100 hover:border-teal-200 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                {displayName.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <div className="font-black text-sm text-slate-900 group-hover:text-teal-800 truncate">
                  {displayName}
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                  {user.email || 'مشاهده و ویرایش پروفایل'}
                </div>
              </div>
            </div>
          </Link>

          {/* Role Status Tag */}
          <div className="px-4 py-1.5 flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>نوع حساب:</span>
            {isAdmin ? (
              <span className="text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                مدیر ارشد
              </span>
            ) : isArtist ? (
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                هنرمند هنرهاب
              </span>
            ) : (
              <span className="text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                خریدار و مجموعه‌دار هنر
              </span>
            )}
          </div>

          <div className="my-1.5 border-t border-slate-100" />

          {/* Primary Customer Links */}
          <div className="px-1.5 space-y-0.5 text-xs sm:text-sm font-bold text-slate-700">
            {/* Orders */}
            <Link
              href="/panel/orders"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-emerald-700 transition-colors"
            >
              <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs shrink-0">
                📦
              </span>
              <span>سفارش‌های من</span>
            </Link>

            {/* Addresses */}
            <Link
              href="/panel/addresses"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-emerald-700 transition-colors"
            >
              <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs shrink-0">
                📍
              </span>
              <span>آدرس‌های من</span>
            </Link>

            {/* Wishlist */}
            <Link
              href="/panel/wishlist"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-emerald-700 transition-colors"
            >
              <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs shrink-0">
                🔖
              </span>
              <span>لیست علاقه‌مندی‌ها</span>
            </Link>

            {/* Customer Panel Hub */}
            <Link
              href="/panel"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-emerald-700 transition-colors"
            >
              <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs shrink-0">
                🏛️
              </span>
              <span>پیشخوان کاربری من</span>
            </Link>
          </div>

          {/* Role Switching Options (Artist / Admin) */}
          {isArtist && (
            <>
              <div className="my-1.5 border-t border-slate-100" />
              <div className="px-1.5 space-y-0.5 text-xs sm:text-sm font-bold text-slate-700">
                <Link
                  href="/artist-panel/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-900 transition-colors"
                >
                  <span className="w-7 h-7 rounded-lg bg-emerald-200/80 text-emerald-800 flex items-center justify-center text-xs shrink-0">
                    🎨
                  </span>
                  <span>ورود به پنل هنرمند</span>
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-purple-50/60 hover:bg-purple-100/70 text-purple-900 transition-colors"
                  >
                    <span className="w-7 h-7 rounded-lg bg-purple-200/80 text-purple-800 flex items-center justify-center text-xs shrink-0">
                      ⚡
                    </span>
                    <span>ورود به پنل مدیریت ارشد</span>
                  </Link>
                )}
              </div>
            </>
          )}

          <div className="my-1.5 border-t border-slate-100" />

          {/* Logout */}
          <div className="px-1.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                signOut({ callbackUrl: '/' });
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs sm:text-sm font-bold transition-colors cursor-pointer text-right"
            >
              <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>خروج از حساب کاربری</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
