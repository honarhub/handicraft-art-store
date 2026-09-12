'use client';

import React, { useState, useEffect, useRef } from 'react';

type SearchResult = {
  id: string;
  type: 'artist' | 'product';
  title: string;
  subtitle: string;
  image?: string;
  url: string;
};

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          if (res.ok) {
            const data = await res.json();
            setResults(data.results || []);
            setIsOpen(true);
          }
        } catch (error) {
          console.error("Search failed", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 400); // Debounce

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative w-full max-w-2xl mx-auto z-50" ref={containerRef} dir="rtl">
      <div className="relative group">
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          )}
        </div>
        
        <input 
          type="text" 
          className="w-full py-4 pr-12 pl-4 text-gray-800 bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/30 transition-all text-lg placeholder-gray-400"
          placeholder="جستجو در هنرمندان، محصولات، تخصص‌ها..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-3 w-full bg-white/95 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <ul className="max-h-96 overflow-y-auto divide-y divide-gray-100/50 p-2">
            {results.map((item, idx) => (
              <li key={`${item.id}-${idx}`}>
                <a href={item.url} className="flex items-center gap-4 p-3 hover:bg-emerald-50/50 rounded-xl transition-colors">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-12 h-12 object-cover rounded-xl shadow-sm border border-gray-100" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200">
                      {item.type === 'artist' ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                      ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-gray-900 font-bold truncate">{item.title}</p>
                    <p className="text-gray-500 text-sm truncate">{item.subtitle}</p>
                  </div>
                  <div className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md font-medium">
                    {item.type === 'artist' ? 'هنرمند' : 'محصول'}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute top-full mt-3 w-full bg-white/95 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl p-6 text-center text-gray-500 animate-in fade-in slide-in-from-top-4 duration-300">
          هیچ نتیجه‌ای برای «<span className="font-bold text-gray-800">{query}</span>» یافت نشد.
        </div>
      )}
    </div>
  );
}
