'use client';

import React, { useState, useEffect, useRef } from 'react';

export type CategoryChild = {
  id: string;
  name: string;
};

export type MasterCategory = {
  id: string;
  name: string;
  icon?: string;
  children: CategoryChild[];
};

// دسته‌بندی‌های پیش‌فرض برای نمایش آنی بدون تاخیر لودینگ
const DEFAULT_CATEGORIES: MasterCategory[] = [
  {
    id: 'cmvkylspy0001tpi87x2rs7c9',
    name: 'نقاشی، نگارگری و خوشنویسی',
    icon: '🎨',
    children: [
      { id: 'cmurgd0h50002tpkwzsp8qjav', name: 'مینیاتور' },
      { id: 'cmurgd0h90004tpkwkblr2401', name: 'تذهیب' },
      { id: 'cmurgd0h60003tpkw26s3iy32', name: 'خوشنویسی' },
      { id: 'cmurgd0io0013tpkwkivpdw5y', name: 'نقاشی (رنگ روغن)' },
      { id: 'cmurgd0iq0014tpkw9gupo4i3', name: 'نقاشی (آبرنگ)' },
      { id: 'cmurgd0ir0015tpkw931zzsu3', name: 'طراحی (سیاه قلم)' },
      { id: 'cmurgd0i1000otpkwwcau4mlo', name: 'نقاشی روی شیشه' },
      { id: 'cmurgd0i3000ptpkwxks16kus', name: 'ویترای' },
      { id: 'cmurgd0hz000ntpkwct61tj01', name: 'نقاشی روی چرم' }
    ]
  },
  {
    id: 'cmvkylsrh0005tpi8wql0r5o2',
    name: 'دست بافته ها و زیراندازهای سنتی',
    icon: '🧶',
    children: [
      { id: 'cmurgd0hc0006tpkw4jwmo4n9', name: 'قالی بافی' },
      { id: 'cmurgd0ha0005tpkwuyavw9yb', name: 'گلیم بافی' },
      { id: 'cmurgd0hd0007tpkwiwctarjo', name: 'جاجیم بافی' },
      { id: 'cmurgd0ho000ftpkwozywx6b2', name: 'زیلو بافی' },
      { id: 'cmurgd0hp000gtpkw9ok9auj3', name: 'نمد مالی' }
    ]
  },
  {
    id: 'cmvkylsso000btpi8cn47rpoy',
    name: 'رودوزی ها و نساجی سنتی',
    icon: '🪡',
    children: [
      { id: 'cmurgd0hr000htpkwesyxqho2', name: 'سوزن دوزی' },
      { id: 'cmurgd0hs000itpkwvz0yt2wo', name: 'پته دوزی' },
      { id: 'cmurgd0ht000jtpkwccs6qshe', name: 'ترمه بافی' },
      { id: 'cmurgd0hv000ktpkwoct8av0q', name: 'گلابتون دوزی' },
      { id: 'cmurgd0hw000ltpkw1t4q4hc6', name: 'چاپ باتیک' },
      { id: 'cmurgd0i6000rtpkwls5lm4ig', name: 'بافتنی و قلاب بافی' },
      { id: 'cmurgd0ih000ztpkwzk4sc4p4', name: 'ماکرامه بافی' }
    ]
  },
  {
    id: 'cmvkylsrx0007tpi8981xmfxd',
    name: 'صنایع دستی چوبی',
    icon: '🪵',
    children: [
      { id: 'cmurgd0he0008tpkwwhx9q1muz', name: 'معرق کاری' },
      { id: 'cmurgd0hg0009tpkwf7avqw6s', name: 'خاتم کاری' },
      { id: 'cmurgd0hh000atpkw1r3hwhvi', name: 'منبت کاری' },
      { id: 'cmurgd0in0012tpkw1rory5x7', name: 'کنده کاری' },
      { id: 'cmurgd0ia000utpkwz9j93zkb', name: 'حکاکی روی چوب' }
    ]
  },
  {
    id: 'cmvkylssb0009tpi85eacjerd',
    name: 'هنرهای فلزی',
    icon: '⚔️',
    children: [
      { id: 'cmurgd0hi000btpkw5vms3otw', name: 'مینا کاری' },
      { id: 'cmurgd0hj000ctpkwzktnrpeg', name: 'ملیله کاری' },
      { id: 'cmurgd0hl000dtpkwtkza7qlx', name: 'قلمزنی' },
      { id: 'cmurgd0hm000etpkw2tmfizf0', name: 'فیروزه کوبی' },
      { id: 'cmurgd0i9000ttpkwi9xb7sua', name: 'حکاکی روی فلز' },
      { id: 'cmurgd0ix0019tpkwqe8vufcl', name: 'شبکه بری' }
    ]
  },
  {
    id: 'cmvkylsqn0003tpi88500qka5',
    name: 'سفال، سرامیک و آبگینه',
    icon: '🏺',
    children: [
      { id: 'cmurgd0gu0000tpkwdhcz8p3u', name: 'سفالگری' },
      { id: 'cmurgd0h20001tpkwsfcemqpx', name: 'کاشی کاری' }
    ]
  },
  {
    id: 'cmvkylsti000ltpi853kqn55z',
    name: 'تزیینات و معماری سنتی',
    icon: '🏛️',
    children: [
      { id: 'cmurgd0ij0010tpkwj4vtlcg1', name: 'گچبری' },
      { id: 'cmurgd0il0011tpkwxrbpeb2m', name: 'آینه کاری' }
    ]
  },
  {
    id: 'cmvkylstc000jtpi8eh0ranqv',
    name: 'حصیر بافی و بافت های بومی',
    icon: '🧺',
    children: [
      { id: 'cmurgd0iv0018tpkwnyrqmfe4', name: 'حصیر بافی' },
      { id: 'cmurgd0iu0017tpkwoik4mixu', name: 'سبد بافی' }
    ]
  },
  {
    id: 'cmvkylst1000dtpi8hmn90df3',
    name: 'زیورآلات و جواهرسازی سنتی',
    icon: '💍',
    children: [
      { id: 'cmurgd0id000wtpkwujw9x25i', name: 'جواهرسازی سنتی' }
    ]
  },
  {
    id: 'cmvkylst4000ftpi8lhms00r1',
    name: 'چرم دوزی و سراجی سنتی',
    icon: '👜',
    children: [
      { id: 'cmurgd0ie000xtpkwwpytrsyf', name: 'چرم دوزی دست ساز' }
    ]
  },
  {
    id: 'cmvkylst7000htpi8hpgy5a19',
    name: 'هنرهای سنگی و احجام',
    icon: '🗿',
    children: [
      { id: 'cmurgd0ib000vtpkw78x3vfh5', name: 'حکاکی روی سنگ' },
      { id: 'cmurgd0i7000stpkwfklwu4ez', name: 'مجسمه سازی' }
    ]
  },
  {
    id: 'cmvkylstn000ntpi8bycbokka',
    name: 'سایر هنرهای دستی و دکوراتیو',
    icon: '✨',
    children: [
      { id: 'cmurgd0i4000qtpkwgbgsew8a', name: 'رزین کاری' },
      { id: 'cmurgd0ig000ytpkwad7kazps', name: 'شمع سازی هنری' },
      { id: 'cmurgd0is0016tpkw9lakgscv', name: 'عروسک سازی سنتی' },
      { id: 'cmurgd0hy000mtpkws2vz5mnb', name: 'گل آرایی سنتی' }
    ]
  }
];

const categoryIcons: Record<string, string> = {
  'نقاشی، نگارگری و خوشنویسی': '🎨',
  'دست بافته ها و زیراندازهای سنتی': '🧶',
  'رودوزی ها و نساجی سنتی': '🪡',
  'صنایع دستی چوبی': '🪵',
  'هنرهای فلزی': '⚔️',
  'سفال، سرامیک و آبگینه': '🏺',
  'تزیینات و معماری سنتی': '🏛️',
  'حصیر بافی و بافت های بومی': '🧺',
  'زیورآلات و جواهرسازی سنتی': '💍',
  'چرم دوزی و سراجی سنتی': '👜',
  'هنرهای سنگی و احجام': '🗿',
  'سایر هنرهای دستی و دکوراتیو': '✨',
};

export default function CategoriesMegaMenu() {
  const [categories, setCategories] = useState<MasterCategory[]>(DEFAULT_CATEGORIES);
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string>(DEFAULT_CATEGORIES[0].id);
  const [mobileExpandedId, setMobileExpandedId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // واکشی درخت دسته‌بندی‌ها از سرور
  useEffect(() => {
    fetch('/api/specialties?hierarchy=true')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            icon: categoryIcons[cat.name] || '🎨',
            children: cat.children || []
          }));
          setCategories(mapped);
          if (mapped.length > 0 && !activeCategoryId) {
            setActiveCategoryId(mapped[0].id);
          }
        }
      })
      .catch(() => {
        // در صورت بروز خطا از مقادیر پیش‌فرض استفاده می‌شود
      });
  }, []);

  // بستن منو با کلیک بیرون
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

  // هندلرهای هاور برای دسکتاپ
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
      {/* دکمه منوی همبرگری / آکاردئونی */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-slate-800 transition-all cursor-pointer border ${
          isOpen
            ? 'bg-slate-100 border-slate-300 shadow-xs'
            : 'bg-transparent hover:bg-slate-100/80 border-transparent hover:border-slate-200'
        }`}
        aria-label="منوی دسته‌بندی‌ها"
        aria-expanded={isOpen}
      >
        <svg
          className="w-5 h-5 text-slate-800 transition-transform duration-200"
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
        <span className="text-xs md:text-sm font-bold select-none text-slate-800">
          دسته‌بندی‌ها
        </span>
      </button>

      {/* مگامنو در دسکتاپ (hidden on mobile, flex on md+) */}
      {isOpen && (
        <div
          className="hidden md:block absolute right-0 top-full mt-3 w-[720px] lg:w-[840px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* نوار سربرگ مگامنو */}
          <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50/90 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-slate-800">دسته‌بندی صنایع دستی و هنرهای ایرانی</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                {categories.length} دسته اصیل
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
          <div className="flex h-[420px]">
            {/* ستون راست: لیست دسته‌های والد */}
            <div className="w-64 bg-slate-50/60 border-l border-slate-200/70 overflow-y-auto py-2 pr-2 pl-1 scrollbar-thin">
              {categories.map((cat) => {
                const isActive = cat.id === activeCategoryId;
                return (
                  <div
                    key={cat.id}
                    onMouseEnter={() => setActiveCategoryId(cat.id)}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all text-xs font-bold ${
                      isActive
                        ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/80 font-black'
                        : 'text-slate-700 hover:bg-white/80 hover:text-slate-900'
                    }`}
                  >
                    <a
                      href={`/products?specialty=${encodeURIComponent(cat.id)}`}
                      className="flex items-center gap-2.5 flex-1 text-inherit"
                    >
                      <span className="text-base">{cat.icon || '🎨'}</span>
                      <span className="line-clamp-1">{cat.name}</span>
                    </a>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-200/70 text-slate-500 group-hover:bg-slate-200'
                      }`}
                    >
                      {cat.children?.length || 0}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* ستون چپ: جزئیات دسته فعال و زیرمجموعه‌ها */}
            <div className="flex-1 p-6 overflow-y-auto bg-white flex flex-col justify-between">
              <div>
                {/* عنوان دسته فعال و دکمه ورود به گالری آن */}
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{activeCategory.icon || '🎨'}</span>
                    <div>
                      <h4 className="text-base font-black text-slate-900">{activeCategory.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        دست‌سازه‌های خلق‌شده در هنر {activeCategory.name}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`/products?specialty=${encodeURIComponent(activeCategory.id)}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white text-xs font-bold transition-all shadow-xs"
                  >
                    <span>مشاهده همه</span>
                    <svg className="w-3.5 h-3.5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>

                {/* شبکه زیرمجموعه‌ها */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 block mb-3">زیرمجموعه‌ها و سبک‌ها:</span>
                  {activeCategory.children && activeCategory.children.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      {activeCategory.children.map((child) => (
                        <a
                          key={child.id}
                          href={`/products?specialty=${encodeURIComponent(child.id)}`}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-emerald-200 bg-slate-50/50 hover:bg-emerald-50/40 text-slate-700 hover:text-emerald-800 transition-all group"
                        >
                          <span className="text-xs font-bold group-hover:translate-x-0.5 transition-transform">
                            {child.name}
                          </span>
                          <svg
                            className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 rotate-180 transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
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

      {/* منوی آکاردئونی کشویی در موبایل (md:hidden Drawer) */}
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
                  <span className="text-slate-900">هنر</span>
                  <span className="bg-[#FF9900] text-black px-1.5 py-0.5 rounded mr-1 text-base font-black">هاب</span>
                </div>
                <span className="text-xs font-bold text-slate-500 mr-2">منوی دسته‌بندی‌ها</span>
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
              <div className="text-xs font-black text-slate-400 px-1 mb-2">دسته‌بندی‌های اصیل</div>
              {categories.map((cat) => {
                const isExpanded = mobileExpandedId === cat.id;
                return (
                  <div key={cat.id} className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-2xs">
                    {/* ردیف والد آکاردئون */}
                    <div className="flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                      <a
                        href={`/products?specialty=${encodeURIComponent(cat.id)}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2 text-xs font-bold text-slate-800 flex-1"
                      >
                        <span className="text-base">{cat.icon || '🎨'}</span>
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
                            className="block px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-emerald-700 hover:bg-slate-50 transition-colors"
                          >
                            {sub.name}
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
