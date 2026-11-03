'use client';

import React, { useState } from 'react';
import LogoutButton from '@/app/components/LogoutButton';
import ArtistSidebarNav from './ArtistSidebarNav';

interface ArtistSidebarProps {
  artist: {
    id: string;
    user: {
      name: string | null;
      image: string | null;
    };
  };
  unreadFeedbackCount: number;
  verificationLevel: number;
  isAdmin: boolean;
}

export default function ArtistSidebar({
  artist,
  unreadFeedbackCount,
  verificationLevel,
  isAdmin
}: ArtistSidebarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Header (< md) */}
      <header className="md:hidden sticky top-0 z-40 bg-teal-950 text-teal-100 border-b border-teal-800/80 shadow-md">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {artist.user.image ? (
              <img 
                src={artist.user.image} 
                alt={artist.user.name || ''} 
                className="w-9 h-9 rounded-full border border-teal-600 object-cover shrink-0" 
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-teal-800 text-white flex items-center justify-center font-black text-xs shrink-0">
                {artist.user.name?.[0] || 'هـ'}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-black text-white leading-tight truncate">
                {artist.user.name || 'هنرمند'}
              </h2>
              <p className="text-[10px] text-teal-400 mt-0.5">پنل اختصاصی هنرمند</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-900 border border-teal-700 hover:bg-teal-800 text-teal-100 text-xs font-bold transition-colors cursor-pointer"
            aria-expanded={mobileMenuOpen}
          >
            {unreadFeedbackCount > 0 && !mobileMenuOpen && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            )}
            <span>{mobileMenuOpen ? 'بستن منو' : 'منوی پنل'}</span>
            <span className="text-sm font-mono">{mobileMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-teal-800/80 bg-teal-950 p-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <ArtistSidebarNav
              initialUnreadFeedbackCount={unreadFeedbackCount}
              verificationLevel={verificationLevel}
              onNavigate={() => setMobileMenuOpen(false)}
            />
            <div className="pt-2 border-t border-teal-800/80 space-y-2">
              {isAdmin && (
                <a 
                  href="/admin" 
                  className="px-4 py-2.5 w-full text-center rounded-xl bg-amber-500 hover:bg-amber-600 transition-colors text-xs text-slate-950 font-black block shadow-sm"
                >
                  👑 ورود به کنترل پنل ارشد
                </a>
              )}
              <a 
                href={`/artist/${artist.id}`} 
                target="_blank" 
                rel="noreferrer"
                className="px-4 py-2.5 w-full text-center rounded-xl border border-teal-700 hover:bg-teal-900 transition-colors text-xs text-teal-300 font-bold block"
              >
                مشاهده صفحه عمومی من
              </a>
              <LogoutButton 
                callbackUrl="/artist-panel/login" 
                className="px-4 py-2.5 w-full text-center rounded-xl hover:bg-red-950/60 border border-red-900/60 text-red-300 transition-colors text-xs font-bold block"
              >
                خروج از حساب
              </LogoutButton>
            </div>
          </div>
        )}
      </header>

      {/* Desktop Persistent Sidebar (>= md) */}
      <aside className="hidden md:flex md:w-64 bg-teal-950 text-teal-100 flex-shrink-0 shadow-xl z-20 flex-col min-h-screen">
        {/* برند و عنوان پنل */}
        <div className="p-5 border-b border-teal-800/80 flex items-center justify-between">
          <div className="text-xl font-black tracking-tight flex items-center select-none" dir="rtl">
            <span className="text-white">هنر</span>
            <span className="bg-[#FF9900] text-black px-1.5 py-0.5 rounded mr-1 text-sm font-black shadow-sm">
              هاب
            </span>
          </div>
          <span className="text-xs font-bold text-teal-400">پنل هنرمندان</span>
        </div>

        {/* کارت پروفایل هنرمند */}
        <div className="p-4 border-b border-teal-800/60 flex items-center gap-3 bg-teal-900/30">
          {artist.user.image ? (
            <img 
              src={artist.user.image} 
              alt={artist.user.name || ''} 
              className="w-10 h-10 rounded-full border-2 border-teal-700 object-cover shrink-0" 
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-teal-800 flex items-center justify-center font-bold text-lg text-white shrink-0">
              {artist.user.name?.[0] || 'هـ'}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-sm font-black text-white tracking-tight truncate">{artist.user.name}</h1>
            <p className="text-[11px] text-teal-400 mt-0.5">پنل اختصاصی هنرمند</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ArtistSidebarNav 
            initialUnreadFeedbackCount={unreadFeedbackCount} 
            verificationLevel={verificationLevel} 
          />
        </div>

        <div className="p-4 border-t border-teal-800/80 space-y-2 mt-auto">
          {isAdmin && (
            <a 
              href="/admin" 
              className="px-4 py-2 w-full text-center rounded-lg bg-amber-500 hover:bg-amber-600 transition-colors text-xs text-slate-900 font-bold block shadow-sm"
            >
              👑 ورود به کنترل پنل ارشد
            </a>
          )}
          <a 
            href={`/artist/${artist.id}`} 
            target="_blank" 
            rel="noreferrer"
            className="px-4 py-2 w-full text-center rounded-lg border border-teal-700 hover:bg-teal-800 transition-colors text-xs text-teal-300 block font-medium"
          >
            مشاهده صفحه عمومی من
          </a>
          <LogoutButton 
            callbackUrl="/artist-panel/login" 
            className="px-4 py-2 w-full text-center rounded-lg hover:bg-red-900/50 text-red-300 transition-colors text-xs font-bold block"
          >
            خروج از حساب
          </LogoutButton>
        </div>
      </aside>
    </>
  );
}
