'use client';

import React, { useState, useMemo } from 'react';
import { IRAN_PROVINCES } from '@/lib/provinces';
import { normalizePhoneNumber, isValidIranianMobile } from '@/lib/sms';

interface Address {
  id: string;
  title: string;
  recipientName: string;
  phoneNumber: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  isDefault: boolean;
}

const toPersianDigits = (num: number | string) =>
  String(num).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

export default function AddressesManager({ 
  initialAddresses, 
  defaultRecipient 
}: { 
  initialAddresses: Address[];
  defaultRecipient?: { name?: string | null; phoneNumber?: string | null } | null;
}) {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('منزل');
  const [recipientName, setRecipientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Available cities based on selected province
  const availableCities = useMemo(() => {
    if (!province) return [];
    const found = IRAN_PROVINCES.find((p) => p.name === province);
    return found ? found.cities : [];
  }, [province]);

  const openNewModal = () => {
    setEditingId(null);
    setTitle('منزل');
    setRecipientName(defaultRecipient?.name || '');
    setPhoneNumber(defaultRecipient?.phoneNumber || '');
    setProvince('');
    setCity('');
    setAddress('');
    setPostalCode('');
    setIsDefault(addresses.length === 0);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (addr: Address) => {
    setEditingId(addr.id);
    setTitle(addr.title);
    setRecipientName(addr.recipientName);
    setPhoneNumber(addr.phoneNumber);
    setProvince(addr.province);
    setCity(addr.city);
    setAddress(addr.address);
    setPostalCode(addr.postalCode);
    setIsDefault(addr.isDefault);
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim()) {
      setError('نام و نام خانوادگی تحویل‌گیرنده الزامی است.');
      return;
    }
    const cleanPhone = normalizePhoneNumber(phoneNumber);
    if (!phoneNumber.trim() || !isValidIranianMobile(cleanPhone)) {
      setError('شماره تماس تحویل‌گیرنده نامعتبر است (مثال: ۰۹۱۲۳۴۵۶۷۸۹).');
      return;
    }
    if (!province.trim()) {
      setError('لطفاً استان تحویل سفارش را انتخاب کنید.');
      return;
    }
    if (!city.trim()) {
      setError('لطفاً شهر تحویل سفارش را انتخاب کنید.');
      return;
    }
    if (!address.trim() || address.trim().length < 8) {
      setError('نشانی پستی دقیق الزامی است (حداقل ۸ حرف).');
      return;
    }
    const cleanPostal = postalCode.replace(/[^\d]/g, '');
    if (!cleanPostal || cleanPostal.length !== 10) {
      setError('کد پستی باید دقیقاً ۱۰ رقمی باشد.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = '/api/user/addresses';
      const method = editingId ? 'PUT' : 'POST';
      const payload = {
        id: editingId,
        title: title.trim() || 'منزل',
        recipientName: recipientName.trim(),
        phoneNumber: cleanPhone,
        province: province.trim(),
        city: city.trim(),
        address: address.trim(),
        postalCode: cleanPostal,
        isDefault
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'خطا در ثبت آدرس');
      }

      // Refresh list
      const listRes = await fetch('/api/user/addresses');
      const listData = await listRes.json();
      if (listData?.addresses) {
        setAddresses(listData.addresses);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'خطا در ذخیره آدرس');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این آدرس اطمینان دارید؟')) return;
    try {
      const res = await fetch('/api/user/addresses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setAddresses(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch('/api/user/addresses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isDefault: true })
      });
      if (res.ok) {
        setAddresses(prev => prev.map(a => ({
          ...a,
          isDefault: a.id === id
        })));
      }
    } catch (err) {
      console.error('Set default error', err);
    }
  };

  return (
    <div className="space-y-5 font-sans" dir="rtl">
      {/* Header with Add Button */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>📍</span>
            <span>آدرس‌های تحویل سفارش</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            آدرس‌های ذخیره شده جهت ارسال سریع مرسوله‌های صنایع دستی
          </p>
        </div>

        <button
          type="button"
          onClick={openNewModal}
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-xs transition-colors cursor-pointer"
        >
          <span className="text-base font-black">+</span>
          <span>افزودن آدرس جدید</span>
        </button>
      </div>

      {/* Address Cards List */}
      {addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between ${
                addr.isDefault
                  ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-sm'
                  : 'border-slate-200/80 shadow-xs'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <span>🏠</span>
                    <span>{addr.title}</span>
                  </span>

                  {addr.isDefault ? (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                      آدرس پیش‌فرض
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-[11px] font-bold text-slate-400 hover:text-teal-700 transition-colors"
                    >
                      انتخاب به عنوان پیش‌فرض
                    </button>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {addr.province}، {addr.city}، {addr.address}
                </p>

                <div className="pt-2 text-xs text-slate-500 space-y-1">
                  <div>
                    تحویل‌گیرنده: <span className="font-bold text-slate-800">{addr.recipientName}</span>
                  </div>
                  <div>
                    شماره تماس: <span className="font-bold text-slate-800 font-mono">{toPersianDigits(addr.phoneNumber)}</span>
                  </div>
                  {addr.postalCode && (
                    <div>
                      کد پستی: <span className="font-bold text-slate-800 font-mono">{toPersianDigits(addr.postalCode)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <button
                  type="button"
                  onClick={() => openEditModal(addr)}
                  className="text-teal-700 hover:text-teal-900 transition-colors cursor-pointer"
                >
                  ویرایش آدرس
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(addr.id)}
                  className="text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-100 text-slate-500 flex items-center justify-center text-3xl">
            📍
          </div>
          <h3 className="font-black text-slate-800 text-base">هنوز هیچ آدرسی ثبت نکرده‌اید!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            با ثبت آدرس، مراحل ثبت و پرداخت سفارش‌های شما بسیار سریع‌تر انجام می‌شود.
          </p>
          <button
            type="button"
            onClick={openNewModal}
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-sm transition-colors cursor-pointer"
          >
            <span>+ ثبت اولین آدرس</span>
          </button>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-black text-slate-900 text-base">
                {editingId ? 'ویرایش آدرس' : 'افزودن آدرس جدید'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* عنوان آدرس (تنها فیلد اختیاری) */}
              <div>
                <label htmlFor="addressTitle" className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان آدرس <span className="text-slate-400 font-normal text-[11px]">(اختیاری)</span>:
                </label>
                <input
                  type="text"
                  id="addressTitle"
                  name="addressTitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: منزل، محل کار"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:border-teal-600 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="name" className="block text-xs font-bold text-slate-700 mb-1">
                    نام و نام خانوادگی تحویل‌گیرنده <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    autoComplete="name"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="مثال: علی رضایی"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:border-teal-600 bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="tel" className="block text-xs font-bold text-slate-700 mb-1">
                    شماره تماس تحویل‌گیرنده <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="tel"
                    id="tel"
                    name="tel"
                    autoComplete="tel"
                    dir="ltr"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="09123456789"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:border-teal-600 text-center font-mono bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="province" className="block text-xs font-bold text-slate-700 mb-1">
                    استان <span className="text-red-500">*</span>:
                  </label>
                  <select
                    id="province"
                    name="address-level1"
                    autoComplete="address-level1"
                    value={province}
                    onChange={(e) => {
                      const newProv = e.target.value;
                      setProvince(newProv);
                      const targetProv = IRAN_PROVINCES.find((p) => p.name === newProv);
                      if (targetProv && targetProv.cities.length > 0) {
                        setCity(targetProv.cities[0]);
                      } else {
                        setCity('');
                      }
                    }}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:border-teal-600 bg-white cursor-pointer"
                  >
                    <option value="">انتخاب استان...</option>
                    {IRAN_PROVINCES.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="city" className="block text-xs font-bold text-slate-700 mb-1">
                    شهر <span className="text-red-500">*</span>:
                  </label>
                  <select
                    id="city"
                    name="address-level2"
                    autoComplete="address-level2"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={!province || availableCities.length === 0}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:border-teal-600 bg-white disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
                  >
                    <option value="">{province ? 'انتخاب شهر...' : 'ابتدا استان را انتخاب کنید'}</option>
                    {availableCities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-xs font-bold text-slate-700 mb-1">
                  نشانی پستی دقیق (خیابان، کوچه، پلاک، واحد) <span className="text-red-500">*</span>:
                </label>
                <textarea
                  id="address"
                  name="street-address"
                  autoComplete="street-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  required
                  placeholder="خیابان شهید مطهری، کوچه بهار، پلاک ۱۲، واحد ۲"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:border-teal-600 bg-white"
                />
              </div>

              <div>
                <label htmlFor="postalCode" className="block text-xs font-bold text-slate-700 mb-1">
                  کد پستی (۱۰ رقم) <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  id="postalCode"
                  name="postal-code"
                  autoComplete="postal-code"
                  dir="ltr"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="1234567890"
                  maxLength={10}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:border-teal-600 text-center font-mono bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isDefaultCheckbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="isDefaultCheckbox" className="text-xs font-bold text-slate-700 cursor-pointer">
                  انتخاب به عنوان آدرس پیش‌فرض
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'در حال ذخیره...' : 'ذخیره آدرس'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
