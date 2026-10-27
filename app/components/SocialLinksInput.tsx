import React from 'react';

export type SocialPlatform = 'instagram' | 'twitter' | 'telegram' | 'bale';

export const platformMeta: Record<SocialPlatform, { name: string; prefix: string; placeholder: string }> = {
  instagram: {
    name: 'اینستاگرام',
    prefix: 'https://instagram.com/',
    placeholder: 'https://instagram.com/username یا @username'
  },
  telegram: {
    name: 'تلگرام',
    prefix: 'https://t.me/',
    placeholder: 'https://t.me/username یا @username'
  },
  bale: {
    name: 'پیام‌رسان بله',
    prefix: 'https://ble.ir/',
    placeholder: 'https://ble.ir/username یا @username'
  },
  twitter: {
    name: 'ایکس (توییتر)',
    prefix: 'https://x.com/',
    placeholder: 'https://x.com/username یا @username'
  }
};

interface SocialLinksInputProps {
  socialLinks: Partial<Record<SocialPlatform, string>>;
  onChange: (links: Partial<Record<SocialPlatform, string>>) => void;
}

export function SocialIcon({ platform }: { platform: SocialPlatform }) {
  switch (platform) {
    case 'instagram':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-600">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
      );
    case 'twitter':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-slate-900">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      );
    case 'telegram':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-500">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      );
    case 'bale':
      return (
        <img 
          src="/icons/bale.png" 
          alt="بله" 
          className="w-5 h-5 rounded-full object-contain shrink-0" 
        />
      );
    default:
      return null;
  }
}

export default function SocialLinksInput({ socialLinks, onChange }: SocialLinksInputProps) {
  const allPlatforms: SocialPlatform[] = ['instagram', 'telegram', 'bale', 'twitter'];
  
  // Available platforms are those not yet in socialLinks
  const availablePlatforms = allPlatforms.filter(p => typeof socialLinks[p] === 'undefined');

  const handleAdd = (platform: SocialPlatform) => {
    // Add platform with empty username so YOUR_USERNAME hint is displayed
    onChange({ ...socialLinks, [platform]: '' });
  };

  const handleRemove = (platform: SocialPlatform) => {
    const newLinks = { ...socialLinks };
    delete newLinks[platform];
    onChange(newLinks);
  };

  const getUsername = (url: string | undefined, prefix: string) => {
    if (!url) return '';
    if (url.startsWith(prefix)) {
      return url.slice(prefix.length);
    }
    return url.replace(/^@/, '');
  };

  return (
    <div className="space-y-4">
      {Object.entries(socialLinks).map(([platform, url]) => {
        const plat = platform as SocialPlatform;
        const meta = platformMeta[plat];
        if (!meta) return null;

        const currentUsername = getUsername(url, meta.prefix);

        return (
          <div key={platform} className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 shadow-xs">
            {/* Logo and Name Badge */}
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 min-w-[125px] shrink-0">
              <SocialIcon platform={plat} />
              <span className="text-xs font-bold text-slate-700">{meta.name}</span>
            </div>

            {/* URL Input with prefix and YOUR_USERNAME hint */}
            <div className="flex-1 flex items-center bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono dir-ltr focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100 transition-all overflow-hidden" dir="ltr">
              <span className="text-slate-400 select-none text-xs sm:text-sm shrink-0">{meta.prefix}</span>
              <input 
                type="text" 
                value={currentUsername} 
                onChange={e => {
                  let raw = e.target.value;
                  // If pasted full URL, extract handle
                  if (raw.startsWith(meta.prefix)) {
                    raw = raw.slice(meta.prefix.length);
                  }
                  raw = raw.replace(/^@/, '');
                  const fullUrl = raw.trim() ? `${meta.prefix}${raw.trim()}` : '';
                  onChange({ ...socialLinks, [plat]: fullUrl });
                }}
                className="flex-1 bg-transparent border-none outline-none text-slate-800 text-xs sm:text-sm font-mono placeholder:text-slate-400 placeholder:italic px-1 min-w-[100px]" 
                dir="ltr" 
                placeholder="YOUR_USERNAME"
              />
            </div>

            {/* Remove button */}
            <button 
              type="button" 
              onClick={() => handleRemove(plat)}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
              title={`حذف ${meta.name}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
            </button>
          </div>
        );
      })}

      {availablePlatforms.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-500 font-medium">افزودن لینک:</span>
          {availablePlatforms.map(p => {
            const meta = platformMeta[p];
            return (
              <button
                key={p}
                type="button"
                onClick={() => handleAdd(p)}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 hover:border-teal-500 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-teal-700 transition-all shadow-xs"
              >
                <SocialIcon platform={p} />
                <span>+ {meta.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
