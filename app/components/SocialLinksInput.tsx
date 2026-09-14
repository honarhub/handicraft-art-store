import React from 'react';

export type SocialPlatform = 'instagram' | 'twitter' | 'telegram' | 'bale';

const platformNames: Record<SocialPlatform, string> = {
  instagram: 'اینستاگرام',
  twitter: 'توییتر',
  telegram: 'تلگرام',
  bale: 'بله'
};

interface SocialLinksInputProps {
  socialLinks: Partial<Record<SocialPlatform, string>>;
  onChange: (links: Partial<Record<SocialPlatform, string>>) => void;
}

export default function SocialLinksInput({ socialLinks, onChange }: SocialLinksInputProps) {
  const allPlatforms: SocialPlatform[] = ['instagram', 'twitter', 'telegram', 'bale'];
  
  // Available platforms are those not yet in socialLinks
  const availablePlatforms = allPlatforms.filter(p => typeof socialLinks[p] === 'undefined');

  const handleAdd = (platform: SocialPlatform) => {
    onChange({ ...socialLinks, [platform]: '' });
  };

  const handleRemove = (platform: SocialPlatform) => {
    const newLinks = { ...socialLinks };
    delete newLinks[platform];
    onChange(newLinks);
  };

  const handleChange = (platform: SocialPlatform, value: string) => {
    onChange({ ...socialLinks, [platform]: value });
  };

  const formatUrl = (url: string) => {
    if (!url.trim()) return '';
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`;
    }
    return url;
  };

  return (
    <div className="space-y-4">
      {Object.entries(socialLinks).map(([platform, url]) => (
        <div key={platform} className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <div className="w-24 text-sm font-bold text-slate-700 bg-slate-200 py-2 px-3 rounded-lg text-center">
            {platformNames[platform as SocialPlatform]}
          </div>
          <input 
            type="text" 
            value={url} 
            onChange={e => handleChange(platform as SocialPlatform, e.target.value)}
            onBlur={() => handleChange(platform as SocialPlatform, formatUrl(url as string))}
            className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-teal-500 outline-none text-left" 
            dir="ltr" 
            placeholder={`لینک ${platformNames[platform as SocialPlatform]}`}
          />
          <button 
            type="button" 
            onClick={() => handleRemove(platform as SocialPlatform)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="حذف"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
          </button>
        </div>
      ))}

      {availablePlatforms.length > 0 && (
        <div className="flex gap-2">
          <select 
            className="bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm focus:border-teal-500 outline-none"
            onChange={(e) => {
              if (e.target.value) {
                handleAdd(e.target.value as SocialPlatform);
                e.target.value = ""; // reset select
              }
            }}
            defaultValue=""
          >
            <option value="" disabled>+ افزودن شبکه اجتماعی...</option>
            {availablePlatforms.map(p => (
              <option key={p} value={p}>{platformNames[p]}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
