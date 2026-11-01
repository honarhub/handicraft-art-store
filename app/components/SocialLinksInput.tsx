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

  // Track raw user typing per platform so typing '@' or editing is never swallowed
  const [typedInputs, setTypedInputs] = React.useState<Record<string, string>>({});

  const handleAdd = (platform: SocialPlatform) => {
    setTypedInputs(prev => ({ ...prev, [platform]: '' }));
    onChange({ ...socialLinks, [platform]: '' });
  };

  const handleRemove = (platform: SocialPlatform) => {
    const newLinks = { ...socialLinks };
    delete newLinks[platform];
    setTypedInputs(prev => {
      const copy = { ...prev };
      delete copy[platform];
      return copy;
    });
    onChange(newLinks);
  };

  const extractCleanHandle = (val: string, prefix: string) => {
    let raw = val.trim();
    if (raw.startsWith(prefix)) {
      raw = raw.slice(prefix.length);
    } else if (raw.includes(prefix.replace('https://', ''))) {
      const idx = raw.indexOf(prefix.replace('https://', ''));
      raw = raw.slice(idx + prefix.replace('https://', '').length);
    }
    return raw.replace(/^@+/, '');
  };

  const getDisplayValue = (platform: SocialPlatform, url: string | undefined, prefix: string) => {
    if (platform in typedInputs) {
      return typedInputs[platform];
    }
    if (!url) return '';
    if (url.startsWith(prefix)) {
      return url.slice(prefix.length);
    }
    return url;
  };

  const handleInputChange = (plat: SocialPlatform, val: string) => {
    setTypedInputs(prev => ({ ...prev, [plat]: val }));
    const meta = platformMeta[plat];
    if (!meta) return;

    const cleanHandle = extractCleanHandle(val, meta.prefix);
    const fullUrl = cleanHandle ? `${meta.prefix}${cleanHandle}` : '';
    onChange({ ...socialLinks, [plat]: fullUrl });
  };

  return (
    <div className="space-y-4">
      {Object.entries(socialLinks).map(([platform, url]) => {
        const plat = platform as SocialPlatform;
        const meta = platformMeta[plat];
        if (!meta) return null;

        const displayVal = getDisplayValue(plat, url, meta.prefix);
        const cleanHandle = extractCleanHandle(displayVal, meta.prefix);

        return (
          <div key={platform} className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
            {/* Header: Platform Badge + Delete Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                  <SocialIcon platform={plat} />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-800">{meta.name}</span>
              </div>

              {/* Remove button */}
              <button 
                type="button" 
                onClick={() => handleRemove(plat)}
                className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-bold"
                title={`حذف ${meta.name}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                <span>حذف</span>
              </button>
            </div>

            {/* Input row: LTR direction so prefix is on the LEFT on desktop */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white border border-slate-300 rounded-xl overflow-hidden focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all" dir="ltr">
              {/* Prefix (Left side on desktop with border-r, top bar on mobile with border-b) */}
              <div className="bg-slate-100/90 text-slate-600 px-3 py-1.5 sm:py-2.5 border-b sm:border-b-0 sm:border-r border-slate-200 text-xs font-mono select-none flex items-center justify-between sm:justify-start gap-1 shrink-0" dir="ltr">
                <span className="font-bold text-slate-700">{meta.prefix}</span>
                <span className="text-[10px] text-slate-400 sm:hidden">پیشوند</span>
              </div>

              {/* Input for handle / username or pasted full url */}
              <input 
                type="text" 
                value={displayVal} 
                onChange={e => handleInputChange(plat, e.target.value)}
                className="flex-1 px-3 py-2.5 bg-transparent border-none outline-none text-slate-900 text-sm sm:text-base font-mono font-medium placeholder:text-slate-400 placeholder:font-normal placeholder:font-sans text-left" 
                dir="ltr" 
                placeholder="آیدی (مثلاً: art_shams یا @art_shams)"
              />
            </div>

            {/* Helper preview when username is entered */}
            {cleanHandle && (
              <div className="text-[11px] text-teal-700 font-mono flex items-center gap-1.5 px-1 truncate" dir="ltr">
                <span className="text-[10px] font-sans font-bold text-teal-800 shrink-0">🔗 پیش‌نمایش لینک:</span>
                <span className="truncate text-teal-900 font-bold">{meta.prefix}{cleanHandle}</span>
              </div>
            )}
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
