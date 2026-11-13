'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import SpecialtyTagInput from '@/app/components/SpecialtyTagInput';
import type { Specialty } from '@/app/components/SpecialtyTagInput';
import SocialLinksInput from '@/app/components/SocialLinksInput';
import AvatarCropModal from '@/app/components/AvatarCropModal';
import { IRAN_PROVINCES } from '@/lib/provinces';
import {
  isValidIranianNationalId,
  isValidIranianSheba,
  isValidIranianCardNumber,
  getBankInfoByCardNumber
} from '@/lib/sms';

export default function EditArtistPage() {
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // User Profile
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);

  // Artistic & Brand Info
  const [brandName, setBrandName] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [bio, setBio] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [socialLinks, setSocialLinks] = useState<any>({});

  // Verification & KYC Details
  const [verificationLevel, setVerificationLevel] = useState<number>(1);
  const [nationalId, setNationalId] = useState('');
  const [nationalCardImage, setNationalCardImage] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState('');
  const [shebaNumber, setShebaNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Modals for image crop
  const [avatarCropModalOpen, setAvatarCropModalOpen] = useState(false);
  const [rawAvatarForCrop, setRawAvatarForCrop] = useState<string | null>(null);

  const [cardCropModalOpen, setCardCropModalOpen] = useState(false);
  const [rawCardForCrop, setRawCardForCrop] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/artists/${id}`)
      .then(res => res.json())
      .then(data => {
        setName(data.user?.name || '');
        setEmail(data.user?.email || '');
        setPhoneNumber(data.user?.phoneNumber || '');
        if (data.user?.image) {
          setAvatarBase64(data.user.image);
        }

        setBrandName(data.brandName || '');
        setProvince(data.province || '');
        setCity(data.city || '');
        setSpecialties(data.specialties || []);
        setBio(data.bio || '');
        setPortfolioUrl(data.portfolioUrl || '');
        setSocialLinks(data.socialLinks || {});

        setVerificationLevel(data.verificationLevel ?? 1);
        setNationalId(data.nationalId || '');
        setNationalCardImage(data.nationalCardImage || null);
        setBirthDate(data.birthDate || '');
        setShebaNumber(data.shebaNumber || '');
        setCardNumber(data.cardNumber || '');
        setAddress(data.address || '');
        setPostalCode(data.postalCode || '');

        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setRawAvatarForCrop(base64);
      setAvatarCropModalOpen(true);
      e.target.value = '';
    }
  };

  const handleCardImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setRawCardForCrop(base64);
      setCardCropModalOpen(true);
      e.target.value = '';
    }
  };

  const submitEditArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/artists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          name,
          email,
          phoneNumber,
          avatar: avatarBase64,
          brandName,
          province,
          city,
          specialties: specialties.map(s => s.id),
          bio,
          portfolioUrl,
          socialLinks,
          verificationLevel,
          nationalId,
          nationalCardImage,
          birthDate,
          shebaNumber,
          cardNumber,
          address,
          postalCode
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'خطا در بروزرسانی هنرمند');
      }

      alert('تمامی مشخصات و مدارک هنرمند با موفقیت ذخیره و بروزرسانی شد.');
      window.location.href = '/admin/artists';
    } catch (err: any) {
      alert(err.message || 'مشکلی در بروزرسانی هنرمند به وجود آمد.');
    } finally {
      setSubmitting(false);
    }
  };

  const citiesForProvince = IRAN_PROVINCES.find(p => p.name === province)?.cities || [];

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-bold" dir="rtl">در حال دریافت تمامی مشخصات هنرمند...</div>;
  }

  const cleanCard = cardNumber.replace(/\D/g, '');
  const bankInfo = cleanCard.length === 16 ? getBankInfoByCardNumber(cleanCard) : null;

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto font-sans" dir="rtl">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-800">ویرایش کامل اطلاعات هنرمند</h2>
            <span className={`text-xs font-black px-3 py-1 rounded-full ${
              verificationLevel >= 3
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : verificationLevel >= 2
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              سطح {verificationLevel} از ۳
            </span>
          </div>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">
            شما به عنوان ادمین کل، دسترسی ویرایش کامل مشخصات فردی، هویتی، مالی و مدارک این هنرمند را دارید.
          </p>
        </div>
        <a
          href="/admin/artists"
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-colors whitespace-nowrap"
        >
          بازگشت به لیست هنرمندان
        </a>
      </div>

      <form onSubmit={submitEditArtist} className="space-y-8">
        
        {/* SECTION 1: Personal & Contact Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <h3 className="text-base font-black text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <span>👤</span>
            <span>اطلاعات حساب کاربری و تماس</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">نام و نام خانوادگی</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">شماره تلفن همراه</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="09123456789"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-sm font-mono text-left"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">پست الکترونیکی (ایمیل)</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-sm text-left"
                dir="ltr"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-xs font-bold text-slate-700 mb-2">عکس پروفایل هنرمند</label>
            <div className="flex flex-wrap items-center gap-4">
              {avatarBase64 ? (
                <div className="relative group">
                  <img src={avatarBase64} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-slate-200" />
                  <button
                    type="button"
                    onClick={() => setAvatarBase64('')}
                    className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-sm"
                    title="حذف عکس"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-2xl text-slate-400">
                  👤
                </div>
              )}
              <div className="flex-1 min-w-[220px] flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs"
                />
                {avatarBase64 && (
                  <button
                    type="button"
                    onClick={() => {
                      setRawAvatarForCrop(avatarBase64);
                      setAvatarCropModalOpen(true);
                    }}
                    className="shrink-0 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    تنظیم کادر
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Studio, Brand & Artistic Identity */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <h3 className="text-base font-black text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <span>🎨</span>
            <span>اطلاعات استودیو، برند و ویترین هنری</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">نام برند یا استودیو</label>
              <input
                type="text"
                value={brandName}
                onChange={e => setBrandName(e.target.value)}
                placeholder="استودیو هنر..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">استان</label>
              <select
                value={province}
                onChange={e => {
                  const newProv = e.target.value;
                  setProvince(newProv);
                  const firstCity = IRAN_PROVINCES.find(p => p.name === newProv)?.cities[0] || '';
                  setCity(firstCity);
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-sm bg-white"
              >
                <option value="">انتخاب استان...</option>
                {IRAN_PROVINCES.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">شهرستان</label>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                disabled={!province}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-sm bg-white disabled:bg-slate-100"
              >
                <option value="">انتخاب شهر...</option>
                {citiesForProvince.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-xs font-bold text-slate-700 mb-2">تخصص‌های هنری</label>
            <SpecialtyTagInput selectedSpecialties={specialties} onChange={setSpecialties} />
          </div>

          <div className="mt-6">
            <label className="block text-xs font-bold text-slate-700 mb-2">لینک سایت شخصی یا پورتفولیو</label>
            <input
              type="text"
              value={portfolioUrl}
              onChange={e => setPortfolioUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-sm text-left font-mono"
              dir="ltr"
            />
          </div>

          <div className="mt-6">
            <label className="block text-xs font-bold text-slate-700 mb-2">شبکه‌های اجتماعی</label>
            <SocialLinksInput socialLinks={socialLinks} onChange={setSocialLinks} />
          </div>

          <div className="mt-6">
            <label className="block text-xs font-bold text-slate-700 mb-2">بیوگرافی و معرفی هنرمند</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none leading-relaxed text-sm"
              placeholder="درباره سوابق و سبک هنری..."
            />
          </div>
        </div>

        {/* SECTION 3: Identity & Financial KYC (Level 3) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>🪪</span>
              <span>مدارک هویتی، اطلاعات مالی و سطح احراز هویت (سطح ۳)</span>
            </h3>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600">سطح احراز هویت:</label>
              <select
                value={verificationLevel}
                onChange={e => setVerificationLevel(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-emerald-950 font-black text-xs outline-none"
              >
                <option value={0}>سطح ۰ (ثبت‌نام اولیه)</option>
                <option value={1}>سطح ۱ (اطلاعات پایه و استودیو)</option>
                <option value={2}>سطح ۲ (ویترین عمومی تایید شده)</option>
                <option value={3}>سطح ۳ (تسویه حساب و درگاه فعال)</option>
              </select>
            </div>
          </div>

          {/* National Card Image Preview and Upload */}
          <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <label className="block text-xs font-bold text-slate-700 mb-2">تصویر روی کارت ملی هوشمند</label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative w-56 aspect-[1.6/1] rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-200 flex items-center justify-center shrink-0">
                {nationalCardImage ? (
                  <img src={nationalCardImage} alt="National Card" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-slate-400 font-bold">تصویری ثبت نشده</span>
                )}
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl cursor-pointer transition-colors">
                    <span>انتخاب تصویر جدید کارت ملی</span>
                    <input type="file" accept="image/*" onChange={handleCardImageChange} className="hidden" />
                  </label>
                  {nationalCardImage && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setRawCardForCrop(nationalCardImage);
                          setCardCropModalOpen(true);
                        }}
                        className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                      >
                        تنظیم کادر
                      </button>
                      <button
                        type="button"
                        onClick={() => setNationalCardImage('')}
                        className="px-3.5 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-xl transition-colors"
                      >
                        حذف تصویر
                      </button>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  فرمت‌های مجاز JPG و PNG با کیفیت خوانا.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* National ID */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">کد ملی ۱۰ رقمی</label>
                {nationalId && (
                  isValidIranianNationalId(nationalId) ? (
                    <span className="text-[10px] text-emerald-600 font-bold">✓ الگوریتم صحیح</span>
                  ) : (
                    <span className="text-[10px] text-red-500 font-bold">⚠️ ساختار نامعتبر</span>
                  )
                )}
              </div>
              <input
                type="text"
                maxLength={10}
                value={nationalId}
                onChange={e => setNationalId(e.target.value.replace(/\D/g, ''))}
                placeholder="0012345678"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-sm font-mono text-left"
                dir="ltr"
              />
            </div>

            {/* Birth Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">تاریخ تولد (شمسی)</label>
              <input
                type="text"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                placeholder="1370/05/20"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-sm font-mono text-left"
                dir="ltr"
              />
            </div>

            {/* Sheba Number */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">شماره شبا (۲۴ رقم بدون IR)</label>
                {shebaNumber && (
                  isValidIranianSheba(shebaNumber) ? (
                    <span className="text-[10px] text-emerald-600 font-bold">✓ شبا صحیح</span>
                  ) : (
                    <span className="text-[10px] text-red-500 font-bold">⚠️ ساختار نامعتبر</span>
                  )
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  maxLength={24}
                  value={shebaNumber}
                  onChange={e => setShebaNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="980120000000000000000000"
                  className="w-full px-4 py-2.5 pl-10 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-sm font-mono text-left"
                  dir="ltr"
                />
                <span className="absolute left-3 top-2.5 font-mono text-xs font-bold text-slate-400">IR</span>
              </div>
            </div>

            {/* Card Number */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">شماره کارت بانکی (۱۶ رقم)</label>
                {bankInfo && (
                  <span className="text-[10px] text-emerald-600 font-bold">✓ {bankInfo.title}</span>
                )}
              </div>
              <input
                type="text"
                maxLength={19}
                value={cardNumber.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ')}
                onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                placeholder="6037 9919 1234 5678"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-sm font-mono text-left tracking-wider"
                dir="ltr"
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">آدرس کارگاه یا محل سکونت</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="استان، شهر، خیابان، پلاک..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-sm"
              />
            </div>

            {/* Postal Code */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">کد پستی ۱۰ رقمی</label>
              <input
                type="text"
                maxLength={10}
                value={postalCode}
                onChange={e => setPostalCode(e.target.value.replace(/\D/g, ''))}
                placeholder="1234567890"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-sm font-mono text-left"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 px-6 rounded-xl shadow-md transition-all text-sm disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'در حال ذخیره‌سازی تغییرات...' : 'ثبت نهایی تغییرات و ذخیره مشخصات'}
          </button>
          <a
            href="/admin/artists"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-8 rounded-xl transition-all text-center text-sm"
          >
            انصراف
          </a>
        </div>
      </form>

      {/* Avatar Crop Modal */}
      <AvatarCropModal
        isOpen={avatarCropModalOpen}
        imageSrc={rawAvatarForCrop}
        onClose={() => {
          setAvatarCropModalOpen(false);
          setRawAvatarForCrop(null);
        }}
        onCropComplete={croppedBase64 => {
          setAvatarBase64(croppedBase64);
          setAvatarCropModalOpen(false);
          setRawAvatarForCrop(null);
        }}
      />

      {/* National Card Crop Modal */}
      <AvatarCropModal
        isOpen={cardCropModalOpen}
        imageSrc={rawCardForCrop}
        shape="rect"
        aspectRatio={1.58}
        title="تنظیم کادربندی تصویر کارت ملی"
        description="کادر مستطیل را به گونه‌ای تنظیم کنید که تمام سطح و نوشته‌های کارت ملی داخل آن باشد"
        onClose={() => {
          setCardCropModalOpen(false);
          setRawCardForCrop(null);
        }}
        onCropComplete={croppedBase64 => {
          setNationalCardImage(croppedBase64);
          setCardCropModalOpen(false);
          setRawCardForCrop(null);
        }}
      />
    </div>
  );
}
