'use client';

import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';

export type Specialty = {
  id: string;
  name: string;
  isApproved: boolean;
};

interface SpecialtyTagInputProps {
  selectedSpecialties: Specialty[];
  onChange: (specialties: Specialty[]) => void;
}

export default function SpecialtyTagInput({ selectedSpecialties, onChange }: SpecialtyTagInputProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Specialty[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
    const fetchSuggestions = async () => {
      if (query.trim().length >= 1) {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/specialties?q=${encodeURIComponent(query)}`);
          if (res.ok) {
            const data = await res.json();
            // فیلتر کردن مواردی که قبلاً انتخاب شده‌اند
            const filtered = data.filter((s: Specialty) => !selectedSpecialties.find(sel => sel.id === s.id));
            setSuggestions(filtered);
            setIsOpen(true);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    };
    
    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [query, selectedSpecialties]);

  const addSpecialty = (specialty: Specialty) => {
    if (!selectedSpecialties.find(s => s.id === specialty.id)) {
      onChange([...selectedSpecialties, specialty]);
    }
    setQuery('');
    setIsOpen(false);
  };

  const removeSpecialty = (id: string) => {
    onChange(selectedSpecialties.filter(s => s.id !== id));
  };

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim() !== '') {
      e.preventDefault();
      // بررسی اینکه آیا دقیقاً با چیزی در پیشنهادها مچ است؟
      const exactMatch = suggestions.find(s => s.name === query.trim());
      
      if (exactMatch) {
        addSpecialty(exactMatch);
      } else {
        // ایجاد تخصص جدید
        setIsLoading(true);
        try {
          const res = await fetch('/api/specialties', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: query.trim() })
          });
          if (res.ok) {
            const newSpecialty = await res.json();
            addSpecialty(newSpecialty);
          }
        } catch (error) {
          console.error('Error creating custom specialty', error);
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  return (
    <div className="w-full relative" ref={containerRef} dir="rtl">
      <div className="min-h-[50px] p-2 border border-slate-300 rounded-xl bg-white flex flex-wrap gap-2 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
        {selectedSpecialties.map(specialty => (
          <span 
            key={specialty.id} 
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold ${
              specialty.isApproved 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
            }`}
            title={!specialty.isApproved ? 'این تخصص در انتظار تایید ادمین است' : ''}
          >
            {specialty.name}
            <button 
              type="button" 
              onClick={() => removeSpecialty(specialty.id)}
              className="ml-1 hover:text-red-500 focus:outline-none"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </span>
        ))}
        
        <div className="flex-1 min-w-[150px] relative">
          <input
            type="text"
            className="w-full h-full p-2 outline-none text-slate-700 bg-transparent"
            placeholder={selectedSpecialties.length === 0 ? "تخصص‌ها را تایپ و انتخاب کنید..." : "تخصص دیگری اضافه کنید..."}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
          />
          {isLoading && (
             <div className="absolute left-2 top-2.5">
               <svg className="animate-spin h-5 w-5 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
             </div>
          )}
        </div>
      </div>

      {isOpen && query.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {suggestions.length > 0 ? (
            <ul className="py-1 divide-y divide-slate-100">
              {suggestions.map(specialty => (
                <li 
                  key={specialty.id} 
                  className="px-4 py-3 cursor-pointer hover:bg-emerald-50 text-slate-700 transition-colors"
                  onClick={() => addSpecialty(specialty)}
                >
                  {specialty.name}
                  {!specialty.isApproved && <span className="mr-2 text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded">در انتظار تایید</span>}
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-sm text-slate-500">
              تخصصی با این نام یافت نشد. <br/>
              برای ثبت به عنوان تخصص جدید، دکمه <kbd className="bg-slate-100 px-2 py-1 rounded font-mono font-bold mx-1">Enter</kbd> را بزنید.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
