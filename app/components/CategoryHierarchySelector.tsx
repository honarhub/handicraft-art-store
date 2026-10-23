'use client';

import React, { useState, useEffect } from 'react';

export type SpecialtyItem = {
  id: string;
  name: string;
  isApproved?: boolean;
  parentId?: string | null;
};

export type MasterCategory = {
  id: string;
  name: string;
  children: SpecialtyItem[];
};

interface CategoryHierarchySelectorProps {
  selectedSpecialties: SpecialtyItem[];
  onChange: (specialties: SpecialtyItem[]) => void;
  allowCustomInput?: boolean;
  label?: string;
  helperText?: string;
}

export default function CategoryHierarchySelector({
  selectedSpecialties,
  onChange,
  allowCustomInput = true,
  label = 'دسته‌بندی و تخصص‌های هنری اثر',
  helperText = 'دسته‌بندی اصلی و تخصص‌های متناظر با اثر را انتخاب کنید. امکان انتخاب چند تخصص وجود دارد.'
}: CategoryHierarchySelectorProps) {
  const [categories, setCategories] = useState<MasterCategory[]>([]);
  const [activeMasterId, setActiveMasterId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [customName, setCustomName] = useState('');
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);

  useEffect(() => {
    fetch('/api/specialties?hierarchy=true')
      .then(res => res.json())
      .then((data: MasterCategory[]) => {
        setCategories(data);
        if (data.length > 0) {
          setActiveMasterId(data[0].id);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load category hierarchy', err);
        setLoading(false);
      });
  }, []);

  const isSelected = (id: string) => {
    return selectedSpecialties.some(s => s.id === id);
  };

  const toggleSpecialty = (specialty: SpecialtyItem) => {
    if (isSelected(specialty.id)) {
      onChange(selectedSpecialties.filter(s => s.id !== specialty.id));
    } else {
      onChange([...selectedSpecialties, specialty]);
    }
  };

  const removeSpecialty = (id: string) => {
    onChange(selectedSpecialties.filter(s => s.id !== id));
  };

  const handleCreateCustom = async () => {
    if (!customName.trim()) return;
    setIsSubmittingCustom(true);
    try {
      const res = await fetch('/api/specialties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: customName.trim() })
      });
      if (res.ok) {
        const newSpec: SpecialtyItem = await res.json();
        if (!isSelected(newSpec.id)) {
          onChange([...selectedSpecialties, newSpec]);
        }
        setCustomName('');
      } else {
        alert('خطا در ثبت تخصص جدید');
      }
    } catch (e) {
      alert('خطا در ارتباط با سرور');
    } finally {
      setIsSubmittingCustom(false);
    }
  };

  const activeMaster = categories.find(c => c.id === activeMasterId) || categories[0];

  // فیلتر کردن جستجو در میان تمام زیرمجموعه‌ها
  const searchResults = searchQuery.trim()
    ? categories.flatMap(cat =>
        cat.children
          .filter(child => child.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
          .map(child => ({ ...child, parentName: cat.name }))
      )
    : [];

  return (
    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200" dir="rtl">
      <div className="mb-3">
        <label className="block text-sm font-bold text-slate-800 mb-1">{label}</label>
        <p className="text-xs text-slate-500">{helperText}</p>
      </div>

      {/* Selected Tags Display */}
      <div className="mb-4">
        <div className="text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
          <span>تخصص‌های انتخاب‌شده:</span>
          <span className="bg-purple-100 text-purple-800 text-[11px] font-black px-2 py-0.5 rounded-full">
            {selectedSpecialties.length} مورد
          </span>
        </div>

        {selectedSpecialties.length === 0 ? (
          <div className="text-xs text-slate-400 italic py-2 px-3 bg-white rounded-xl border border-dashed border-slate-300 text-center">
            هنوز تخصصی برای این محصول انتخاب نشده است. از لیست زیر تخصص مورد نظر را برگزینید.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 p-2.5 bg-white rounded-xl border border-slate-200 min-h-[46px] items-center">
            {selectedSpecialties.map(item => (
              <span
                key={item.id}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  item.isApproved === false
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-purple-100 text-purple-800 border border-purple-200'
                }`}
              >
                <span>{item.name}</span>
                {item.isApproved === false && (
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-1 rounded">در انتظار</span>
                )}
                <button
                  type="button"
                  onClick={() => removeSpecialty(item.id)}
                  className="hover:text-rose-600 focus:outline-none cursor-pointer pr-1"
                  title="حذف"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Search Input for fast lookup */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="جستجوی سریع بین تمام تخصص‌ها (مثلاً: خاتم‌کاری، رنگ‌روغن)..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 text-sm font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-6 text-center text-xs text-slate-500 font-bold">در حال دریافت درخت دسته‌بندی‌ها...</div>
      ) : searchQuery.trim() ? (
        /* Search Results View */
        <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4">
          <div className="text-xs font-bold text-slate-700 mb-2">
            نتایج جستجو برای &quot;{searchQuery}&quot; ({searchResults.length} مورد):
          </div>
          {searchResults.length === 0 ? (
            <div className="text-xs text-slate-400 py-3 text-center">
              هیچ تخصصی با این عنوان یافت نشد.
              {allowCustomInput && (
                <div className="mt-2">
                  می‌توانید آن را به عنوان تخصص جدید در بخش پایین ثبت فرمایید.
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {searchResults.map(item => {
                const active = isSelected(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleSpecialty(item)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      active
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-purple-400 hover:bg-purple-50/50'
                    }`}
                  >
                    <span>{active ? '✓' : '+'}</span>
                    <span>{item.name}</span>
                    <span className={`text-[10px] ${active ? 'text-purple-200' : 'text-slate-400'}`}>
                      ({item.parentName})
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* 2-Level Interactive Hierarchy */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-4">
          {/* Master Categories Horizontal Scroll / Grid */}
          <div className="p-3 bg-slate-100/70 border-b border-slate-200">
            <div className="text-[11px] font-black text-slate-500 mb-2">
              ۱. دسته‌بندی والد (کلیک جهت مشاهده تخصص‌ها):
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map(cat => {
                const isCurrent = activeMaster?.id === cat.id;
                // آیا محصول گزینه‌ای در این دسته دارد؟
                const selectedCount = cat.children.filter(c => isSelected(c.id)).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveMasterId(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      isCurrent
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {selectedCount > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                          isCurrent ? 'bg-purple-800 text-white' : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {selectedCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subcategories (Children) Chips */}
          <div className="p-4">
            <div className="text-[11px] font-black text-slate-600 mb-2.5 flex items-center justify-between">
              <span>۲. زیرمجموعه‌ها و سبک‌های «{activeMaster?.name}»:</span>
              <span className="text-[11px] font-normal text-slate-400">
                (کلیک برای انتخاب یا حذف)
              </span>
            </div>

            {activeMaster?.children.length === 0 ? (
              <div className="text-xs text-slate-400 py-3 text-center">
                هنوز زیرمجموعه‌ای برای این دسته ثبت نشده است.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {activeMaster?.children.map(child => {
                  const active = isSelected(child.id);
                  return (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => toggleSpecialty(child)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        active
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/40'
                      }`}
                    >
                      <span>{active ? '✓' : '+'}</span>
                      <span>{child.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Specialty Creator (Unlisted art types) */}
      {allowCustomInput && (
        <div className="pt-3 border-t border-slate-200">
          <div className="text-xs font-bold text-slate-700 mb-1.5">
            تخصص مد نظرتان در لیست نیست؟ هنر جدید پیشنهاد دهید:
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="نام هنر یا تخصص پیشنهادی (به عنوان زیرمجموعه سایر هنرهای دستی)..."
              className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:border-purple-500 outline-none"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreateCustom();
                }
              }}
            />
            <button
              type="button"
              onClick={handleCreateCustom}
              disabled={isSubmittingCustom || !customName.trim()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmittingCustom ? 'در حال ثبت...' : '+ افزودن'}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            * تخصص‌های جدید به صورت خودکار در دسته «سایر هنرهای دستی و دکوراتیو» قرار گرفته و پس از بازبینی ادمین تایید می‌شوند.
          </p>
        </div>
      )}
    </div>
  );
}
