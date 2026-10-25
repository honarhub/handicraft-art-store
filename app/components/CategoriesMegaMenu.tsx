'use client';

import React, { useState, useEffect, useRef } from 'react';

export type CategoryChild = {
  id: string;
  name: string;
  productCount?: number;
};

export type MasterCategory = {
  id: string;
  name: string;
  children: CategoryChild[];
};

// Vector icons for handicraft specialties
export function CraftCategoryIcon({ name, className = 'w-5 h-5 text-amber-700' }: { name: string; className?: string }) {
  if (name.includes('نقاشی') || name.includes('خوشنویسی') || name.includes('نگارگری')) {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {/* قلم و لوح خوشنویسی */}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 21l3-1 2 2" />
      </svg>
    );
  }
  if (name.includes('دست بافته') || name.includes('زیرانداز') || name.includes('قالی') || name.includes('گلیم')) {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {/* طرح هندسی قالی و دار بافندگی */}
        <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.8" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9h18M3 15h18M9 3v18M15 3v18" />
        <circle cx="12" cy="12" r="2" strokeWidth="1.5" />
      </svg>
    );
  }
  if (name.includes('رودوزی') || name.includes('نساجی') || name.includes('سوزن') || name.includes('پته')) {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {/* سوزن و نخ گلابتون */}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M14 4l6 6-10 10H6v-4L14 4z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 6l2 2M4 20c2-3 4-1 6-3" />
      </svg>
    );
  }
  if (name.includes('چوب') || name.includes('منبت') || name.includes('خاتم')) {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {/* رگه‌های چوب و مغار منبت */}
        <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="5" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="1.5" strokeWidth="1.5" />
      </svg>
    );
  }
  if (name.includes('فلز') || name.includes('مینا') || name.includes('قلمزنی') || name.includes('ملیله')) {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {/* جام قلم‌زنی و ظرف میناکاری فلزی */}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 2v6m0 0a6 6 0 006 6v2a2 2 0 01-2 2H8a2 2 0 01-2-2v-2a6 6 0 006-6z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16h10M10 22h4" />
      </svg>
    );
  }
  if (name.includes('سفال') || name.includes('سرامیک') || name.includes('آبگینه')) {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {/* کوزه سفالین باستانی */}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 3h6m-5 0v3c0 1.5-2 3-2 6 0 4 3 6 4 6s4-2 4-6c0-3-2-4.5-2-6V3" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 10a4 4 0 00-2 3c0 2 1.5 3 4 3m8-6a4 4 0 012 3c0 2-1.5 3-4 3M9 21h6" />
      </svg>
    );
  }
  if (name.includes('تزیینات') || name.includes('معماری') || name.includes('گچبری') || name.includes('آینه')) {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {/* قوس و طاق معماری اصیل ایرانی */}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 21V10a8 8 0 1116 0v11" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2a8 8 0 00-8 8v11h16V10a8 8 0 00-8-8zM12 6a4 4 0 00-4 4v11h8V10a4 4 0 00-4-4z" />
      </svg>
    );
  }
  if (name.includes('حصیر') || name.includes('سبد') || name.includes('بومی')) {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {/* بافت مشبک حصیر و تاروپود طبیعی */}
        <rect x="3" y="4" width="18" height="16" rx="3" strokeWidth="1.8" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M3 14h18M8 4v16M16 4v16M12 4v16" />
      </svg>
    );
  }
  if (name.includes('زیورآلات') || name.includes('جواهر')) {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {/* گوهر و نگین تراش‌خورده سنتی */}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M6 3h12l4 6-10 12L2 9l4-6z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2 9h20M10 3l2 6 2-6M7 9l5 12 5-12" />
      </svg>
    );
  }
  if (name.includes('چرم') || name.includes('سراجی')) {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {/* چرم دست‌دوز و کوک‌های سنتی */}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 4H8a4 4 0 00-4 4v9a4 4 0 004 4h8a4 4 0 004-4V8a4 4 0 00-4-4z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" strokeDasharray="2 2" d="M7 7h10v11H7z" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    );
  }
  if (name.includes('سنگ') || name.includes('احجام') || name.includes('مجسمه')) {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {/* حجم سنگی تراشیده شده */}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 2l8 5v10l-8 5-8-5V7l8-5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2v20M20 7l-8 5-8-5" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {/* نشان اصالت و ستاره هشت‌پر سنتی ایرانی */}
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 2l2.4 5.6L20 8l-4 4.4 1.2 5.6-5.2-3.2L6.8 18 8 12.4 4 8l5.6-.4L12 2z" />
    </svg>
  );
}

// Default categories fallback
const DEFAULT_CATEGORIES: MasterCategory[] = [
  {
    id: 'cmvkylspy0001tpi87x2rs7c9',
    name: 'نقاشی، نگارگری و خوشنویسی',
    children: [
      { id: 'cmurgd0h50002tpkwzsp8qjav', name: 'مینیاتور', productCount: 0 },
      { id: 'cmurgd0h90004tpkwkblr2401', name: 'تذهیب', productCount: 0 },
      { id: 'cmurgd0h60003tpkw26s3iy32', name: 'خوشنویسی', productCount: 0 },
      { id: 'cmurgd0io0013tpkwkivpdw5y', name: 'نقاشی (رنگ روغن)', productCount: 0 },
      { id: 'cmurgd0iq0014tpkw9gupo4i3', name: 'نقاشی (آبرنگ)', productCount: 0 },
      { id: 'cmurgd0ir0015tpkw931zzsu3', name: 'طراحی (سیاه قلم)', productCount: 0 },
      { id: 'cmurgd0i1000otpkwwcau4mlo', name: 'نقاشی روی شیشه', productCount: 0 },
      { id: 'cmurgd0i3000ptpkwxks16kus', name: 'ویترای', productCount: 0 },
      { id: 'cmurgd0hz000ntpkwct61tj01', name: 'نقاشی روی چرم', productCount: 0 }
    ]
  },
  {
    id: 'cmvkylsrh0005tpi8wql0r5o2',
    name: 'دست بافته ها و زیراندازهای سنتی',
    children: [
      { id: 'cmurgd0hc0006tpkw4jwmo4n9', name: 'قالی بافی', productCount: 0 },
      { id: 'cmurgd0ha0005tpkwuyavw9yb', name: 'گلیم بافی', productCount: 0 },
      { id: 'cmurgd0hd0007tpkwiwctarjo', name: 'جاجیم بافی', productCount: 0 },
      { id: 'cmurgd0ho000ftpkwozywx6b2', name: 'زیلو بافی', productCount: 0 },
      { id: 'cmurgd0hp000gtpkw9ok9auj3', name: 'نمد مالی', productCount: 0 }
    ]
  },
  {
    id: 'cmvkylsso000btpi8cn47rpoy',
    name: 'رودوزی ها و نساجی سنتی',
    children: [
      { id: 'cmurgd0hr000htpkwesyxqho2', name: 'سوزن دوزی', productCount: 0 },
      { id: 'cmurgd0hs000itpkwvz0yt2wo', name: 'پته دوزی', productCount: 0 },
      { id: 'cmurgd0ht000jtpkwccs6qshe', name: 'ترمه بافی', productCount: 0 },
      { id: 'cmurgd0hv000ktpkwoct8av0q', name: 'گلابتون دوزی', productCount: 0 },
      { id: 'cmurgd0hw000ltpkw1t4q4hc6', name: 'چاپ باتیک', productCount: 0 },
      { id: 'cmurgd0i6000rtpkwls5lm4ig', name: 'بافتنی و قلاب بافی', productCount: 0 },
      { id: 'cmurgd0ih000ztpkwzk4sc4p4', name: 'ماکرامه بافی', productCount: 0 }
    ]
  },
  {
    id: 'cmvkylsrx0007tpi8981xmfxd',
    name: 'صنایع دستی چوبی',
    children: [
      { id: 'cmurgd0he0008tpkwwhx9q1muz', name: 'معرق کاری', productCount: 0 },
      { id: 'cmurgd0hg0009tpkwf7avqw6s', name: 'خاتم کاری', productCount: 0 },
      { id: 'cmurgd0hh000atpkw1r3hwhvi', name: 'منبت کاری', productCount: 0 },
      { id: 'cmurgd0in0012tpkw1rory5x7', name: 'کنده کاری', productCount: 0 },
      { id: 'cmurgd0ia000utpkwz9j93zkb', name: 'حکاکی روی چوب', productCount: 0 }
    ]
  },
  {
    id: 'cmvkylssb0009tpi85eacjerd',
    name: 'هنرهای فلزی',
    children: [
      { id: 'cmurgd0hi000btpkw5vms3otw', name: 'مینا کاری', productCount: 1 },
      { id: 'cmurgd0hj000ctpkwzktnrpeg', name: 'ملیله کاری', productCount: 0 },
      { id: 'cmurgd0hl000dtpkwtkza7qlx', name: 'قلمزنی', productCount: 0 },
      { id: 'cmurgd0hm000etpkw2tmfizf0', name: 'فیروزه کوبی', productCount: 0 },
      { id: 'cmurgd0i9000ttpkwi9xb7sua', name: 'حکاکی روی فلز', productCount: 0 },
      { id: 'cmurgd0ix0019tpkwqe8vufcl', name: 'شبکه بری', productCount: 0 }
    ]
  },
  {
    id: 'cmvkylsqn0003tpi88500qka5',
    name: 'سفال، سرامیک و آبگینه',
    children: [
      { id: 'cmurgd0gu0000tpkwdhcz8p3u', name: 'سفالگری', productCount: 1 },
      { id: 'cmurgd0h20001tpkwsfcemqpx', name: 'کاشی کاری', productCount: 0 }
    ]
  },
  {
    id: 'cmvkylsti000ltpi853kqn55z',
    name: 'تزیینات و معماری سنتی',
    children: [
      { id: 'cmurgd0ij0010tpkwj4vtlcg1', name: 'گچبری', productCount: 0 },
      { id: 'cmurgd0il0011tpkwxrbpeb2m', name: 'آینه کاری', productCount: 0 }
    ]
  },
  {
    id: 'cmvkylstc000jtpi8eh0ranqv',
    name: 'حصیر بافی و بافت های بومی',
    children: [
      { id: 'cmurgd0iv0018tpkwnyrqmfe4', name: 'حصیر بافی', productCount: 1 },
      { id: 'cmurgd0iu0017tpkwoik4mixu', name: 'سبد بافی', productCount: 0 }
    ]
  },
  {
    id: 'cmvkylst1000dtpi8hmn90df3',
    name: 'زیورآلات و جواهرسازی سنتی',
    children: [
      { id: 'cmurgd0id000wtpkwujw9x25i', name: 'جواهرسازی سنتی', productCount: 0 }
    ]
  },
  {
    id: 'cmvkylst4000ftpi8lhms00r1',
    name: 'چرم دوزی و سراجی سنتی',
    children: [
      { id: 'cmurgd0ie000xtpkwwpytrsyf', name: 'چرم دوزی دست ساز', productCount: 0 }
    ]
  },
  {
    id: 'cmvkylst7000htpi8hpgy5a19',
    name: 'هنرهای سنگی و احجام',
    children: [
      { id: 'cmurgd0ib000vtpkw78x3vfh5', name: 'حکاکی روی سنگ', productCount: 0 },
      { id: 'cmurgd0i7000stpkwfklwu4ez', name: 'مجسمه سازی', productCount: 0 }
    ]
  },
  {
    id: 'cmvkylstn000ntpi8bycbokka',
    name: 'سایر هنرهای دستی و دکوراتیو',
    children: [
      { id: 'cmurgd0i4000qtpkwgbgsew8a', name: 'رزین کاری', productCount: 0 },
      { id: 'cmurgd0ig000ytpkwad7kazps', name: 'شمع سازی هنری', productCount: 0 },
      { id: 'cmurgd0is0016tpkw9lakgscv', name: 'عروسک سازی سنتی', productCount: 0 },
      { id: 'cmurgd0hy000mtpkws2vz5mnb', name: 'گل آرایی سنتی', productCount: 0 }
    ]
  }
];

export default function CategoriesMegaMenu() {
  const [categories, setCategories] = useState<MasterCategory[]>(DEFAULT_CATEGORIES);
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string>(DEFAULT_CATEGORIES[0].id);
  const [mobileExpandedId, setMobileExpandedId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch categories hierarchy with approved product counts
  useEffect(() => {
    fetch('/api/specialties?hierarchy=true')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: MasterCategory[] = data.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            children: (cat.children || []).map((c: any) => ({
              id: c.id,
              name: c.name,
              productCount: c._count?.products ?? 0
            }))
          }));
          setCategories(mapped);
          if (mapped.length > 0 && !activeCategoryId) {
            setActiveCategoryId(mapped[0].id);
          }
        }
      })
      .catch(() => {
        // Fallback to default categories on network error
      });
  }, []);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Desktop hover handlers
  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 180);
  };

  const activeCategory = categories.find((c) => c.id === activeCategoryId) || categories[0];

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      dir="rtl"
    >
      {/* دکمه ۳ خط افقی (عنوان حذف شده و فقط سه خط شکیل نمایش داده می‌شود) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`p-2 sm:p-2.5 rounded-xl text-slate-800 transition-all cursor-pointer border ${
          isOpen
            ? 'bg-slate-100 border-slate-300 shadow-xs text-emerald-800'
            : 'bg-transparent hover:bg-slate-100/90 border-transparent hover:border-slate-200'
        }`}
        aria-label="منوی دسته‌بندی‌ها"
        aria-expanded={isOpen}
      >
        <svg
          className="w-6 h-6 transition-transform duration-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* مگامنو در دسکتاپ */}
      {isOpen && (
        <div
          className="hidden md:block absolute right-0 top-full mt-3 w-[740px] lg:w-[860px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* نوار سربرگ مگامنو */}
          <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50/90 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-slate-800">دسته‌بندی صنایع دستی و هنرهای ایرانی</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                {categories.length} شاخه اصلی
              </span>
            </div>
            <a
              href="/products"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
            >
              <span>مشاهده تمام آثار گالری</span>
              <svg className="w-3.5 h-3.5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          {/* محتوای مگامنو: دو ستونه (ستون راست شاخه‌های اصلی، ستون چپ زیرمجموعه‌ها) */}
          <div className="flex h-[430px]">
            {/* ستون راست: لیست دسته‌های والد (بدون عدد و همراه با آیکون‌های هنری خطی) */}
            <div className="w-64 bg-slate-50/70 border-l border-slate-200/70 overflow-y-auto py-2 pr-2 pl-1.5 scrollbar-thin">
              {categories.map((cat) => {
                const isActive = cat.id === activeCategoryId;
                return (
                  <div
                    key={cat.id}
                    onMouseEnter={() => setActiveCategoryId(cat.id)}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors duration-150 text-xs font-bold ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800 font-black'
                        : 'text-slate-700 hover:bg-white/80 hover:text-slate-900'
                    }`}
                  >
                    <a
                      href={`/products?specialty=${encodeURIComponent(cat.id)}`}
                      className="flex items-center gap-2.5 flex-1 text-inherit"
                    >
                      <CraftCategoryIcon
                        name={cat.name}
                        className={`w-4 h-4 transition-colors duration-150 ${isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-amber-600'}`}
                      />
                      <span className="line-clamp-1">{cat.name}</span>
                    </a>
                  </div>
                );
              })}
            </div>

            {/* ستون چپ: جزئیات دسته فعال و زیرمجموعه‌ها با نمایش تعداد آثار هر فرزند */}
            <div className="flex-1 p-6 overflow-y-auto bg-white flex flex-col justify-between">
              <div>
                {/* عنوان دسته فعال و دکمه ورود به گالری آن */}
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700 shadow-2xs">
                      <CraftCategoryIcon name={activeCategory.name} className="w-6 h-6 text-amber-700" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900">{activeCategory.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        دست‌سازه‌های اصیل خلق‌شده در هنر {activeCategory.name}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`/products?specialty=${encodeURIComponent(activeCategory.id)}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white text-xs font-bold transition-colors duration-150 shadow-xs"
                  >
                    <span>مشاهده همه</span>
                    <svg className="w-3.5 h-3.5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>

                {/* شبکه زیرمجموعه‌ها همراه با نمایش تعداد آثار هر فرزند */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 block mb-3">زیرمجموعه‌ها و سبک‌ها:</span>
                  {activeCategory.children && activeCategory.children.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      {activeCategory.children.map((child) => (
                        <a
                          key={child.id}
                          href={`/products?specialty=${encodeURIComponent(child.id)}`}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/70 hover:border-emerald-300 bg-slate-50/50 hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-800 transition-colors duration-150 group"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-emerald-500 transition-colors duration-150"></span>
                            <span className="text-xs font-bold group-hover:translate-x-0.5 transition-transform duration-150">
                              {child.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-emerald-700 transition-colors duration-150">
                              {child.productCount !== undefined ? `(${child.productCount} اثر)` : ''}
                            </span>
                            <svg
                              className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 rotate-180 transition-colors duration-150"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-xs font-medium">
                      آثار به صورت مستقیم در دسته‌بندی {activeCategory.name} ثبت شده‌اند.
                    </div>
                  )}
                </div>
              </div>

              {/* بنر کوچک پایین ستون */}
              <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">
                  آیا هنرمند این رشته هستید؟ آثار خود را بدون واسطه در هنرهاب عرضه کنید.
                </span>
                <a
                  href="/artist-panel/login"
                  className="px-2.5 py-1 text-[11px] font-bold text-amber-900 bg-white hover:bg-amber-100 rounded-lg shadow-2xs border border-amber-200 transition-all shrink-0"
                >
                  عضویت هنرمندان
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* منوی آکاردئونی کشویی در موبایل */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex" dir="rtl">
          {/* پس‌زمینه نیمه‌شفاف تار */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* بدنه دراور کشویی از راست */}
          <div className="relative w-5/6 max-w-sm bg-white h-full shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-250">
            {/* سربرگ منوی موبایل */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="text-xl font-black tracking-tight flex items-center select-none">
                  <span className="text-black">هنر</span>
                  <span className="bg-[#FF9900] text-black px-1.5 py-0.5 rounded mr-1 text-base font-black">هاب</span>
                </div>
                <span className="text-xs font-bold text-slate-500 mr-2">دسته‌بندی‌های اصیل</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
                aria-label="بستن منو"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* لیست آکاردئونی دسته‌ها */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {categories.map((cat) => {
                const isExpanded = mobileExpandedId === cat.id;
                return (
                  <div key={cat.id} className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-2xs">
                    {/* ردیف والد آکاردئون */}
                    <div className="flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                      <a
                        href={`/products?specialty=${encodeURIComponent(cat.id)}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2.5 text-xs font-bold text-slate-800 flex-1"
                      >
                        <CraftCategoryIcon name={cat.name} className="w-4 h-4 text-amber-700" />
                        <span>{cat.name}</span>
                      </a>
                      {cat.children && cat.children.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setMobileExpandedId(isExpanded ? null : cat.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 transition-colors"
                          aria-label="باز و بسته کردن زیرمجموعه‌ها"
                        >
                          <svg
                            className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* محتوای بازشونده آکاردئون */}
                    {isExpanded && cat.children && cat.children.length > 0 && (
                      <div className="p-2.5 bg-white border-t border-slate-100 space-y-1 animate-in fade-in duration-150">
                        <a
                          href={`/products?specialty=${encodeURIComponent(cat.id)}`}
                          onClick={() => setIsOpen(false)}
                          className="block px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100/60 transition-colors"
                        >
                          مشاهده همه آثار {cat.name} ←
                        </a>
                        {cat.children.map((sub) => (
                          <a
                            key={sub.id}
                            href={`/products?specialty=${encodeURIComponent(sub.id)}`}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-emerald-700 hover:bg-slate-50 transition-colors"
                          >
                            <span>{sub.name}</span>
                            {sub.productCount !== undefined && (
                              <span className="text-[11px] text-slate-400">({sub.productCount} اثر)</span>
                            )}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* پیوندهای عمومی سایت در موبایل */}
              <div className="pt-4 border-t border-slate-200 space-y-1">
                <div className="text-xs font-black text-slate-400 px-1 mb-2">پیوندهای اصلی</div>
                <a
                  href="/products"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  گالری آثار
                </a>
                <a
                  href="/blog"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  وبلاگ
                </a>
                <a
                  href="/about"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  درباره ما
                </a>
                <a
                  href="/artist-panel/login"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100"
                >
                  پنل هنرمندان
                </a>
                <a
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  پنل ادمین
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
