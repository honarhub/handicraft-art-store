'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toPersianDigits, formatPersianDateTime } from '@/lib/date';
import { isValidIranianCardNumber, getBankInfoByCardNumber } from '@/lib/sms';

interface AdminAccount {
  cardNumber: string | null;
  ownerName: string | null;
  accountNumber: string | null;
  bankTitle: string | null;
  bankSlug: string | null;
  cardId: string | null;
  syncedAt: string | null;
}

interface ArtistItem {
  id: string;
  displayId: number;
  userName: string;
  email: string | null;
  phoneNumber: string | null;
  userImage: string | null;
  brandName: string | null;
  verificationLevel: number;
  nationalId: string | null;
  shebaNumber: string | null;
  cardNumber: string | null;
  cardBankTitle: string | null;
  cardBankSlug: string | null;
  cardId: string | null;
  isHonarhubPayApproved: boolean;
  syncedAt: string | null;
}

interface PaymentLogItem {
  id: string;
  orderId: string | null;
  invoiceNumber: string | null;
  authority: string | null;
  trackingCode: string | null;
  amount: number;
  payableAmount: number | null;
  offsetAmount: number | null;
  status: string;
  gateway: string;
  isSandbox: boolean;
  cardNumber: string | null;
  cardOwnerName: string | null;
  bankTitle: string | null;
  isDirectArtist: boolean;
  errorMessage: string | null;
  createdAt: string;
  paidAt: string | null;
  order?: {
    id: string;
    orderNumber: string | null;
    invoiceNumber: string | null;
    recipientName: string | null;
  } | null;
}

export default function HonarHubPayAdminPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ACCOUNTS' | 'LOGS' | 'SETTINGS'>('ACCOUNTS');
  const [config, setConfig] = useState({
    apiKey: '',
    baseUrl: 'https://pay.honarhub.com',
    isSandbox: true,
  });
  const [adminAccount, setAdminAccount] = useState<AdminAccount | null>(null);
  const [artists, setArtists] = useState<ArtistItem[]>([]);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLogItem[]>([]);
  const [stats, setStats] = useState({
    totalPaidAmount: 0,
    paidCount: 0,
    failedCount: 0,
    pendingCount: 0,
    directArtistPaidCount: 0,
  });

  // Admin Card Edit Form State
  const [isEditingAdminCard, setIsEditingAdminCard] = useState(false);
  const [adminForm, setAdminForm] = useState({
    cardNumber: '',
    ownerName: '',
    accountNumber: '',
    bankTitle: '',
    bankSlug: '',
  });
  const [savingAdminCard, setSavingAdminCard] = useState(false);
  const [adminCardMsg, setAdminCardMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    apiKey: '',
    isSandbox: true,
    baseUrl: 'https://pay.honarhub.com',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Search & Filters
  const [searchArtist, setSearchArtist] = useState('');
  const [logFilter, setLogFilter] = useState<'ALL' | 'PAID' | 'FAILED' | 'PENDING'>('ALL');
  const [actionLoadingArtistId, setActionLoadingArtistId] = useState<string | null>(null);
  const [inquiringId, setInquiringId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/honarhub-pay', { cache: 'no-store' });
      if (!res.ok) throw new Error('خطا در دریافت اطلاعات');
      const data = await res.json();
      setConfig(data.config);
      setAdminAccount(data.adminAccount);
      setArtists(data.artists || []);
      setPaymentLogs(data.paymentLogs || []);
      setStats(data.stats || {});

      // Prefill forms
      if (data.adminAccount) {
        setAdminForm({
          cardNumber: data.adminAccount.cardNumber || '',
          ownerName: data.adminAccount.ownerName || '',
          accountNumber: data.adminAccount.accountNumber || '',
          bankTitle: data.adminAccount.bankTitle || '',
          bankSlug: data.adminAccount.bankSlug || '',
        });
      }
      setSettingsForm({
        apiKey: data.config?.apiKey || '',
        isSandbox: Boolean(data.config?.isSandbox),
        baseUrl: data.config?.baseUrl || 'https://pay.honarhub.com',
      });
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Save Admin Card & Sync with HonarHub Pay
  const handleSaveAdminCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAdminCard(true);
    setAdminCardMsg(null);

    const cleanCard = adminForm.cardNumber.replace(/\D/g, '');
    if (!isValidIranianCardNumber(cleanCard)) {
      setAdminCardMsg({ text: 'شماره کارت ۱۶ رقمی شتاب نامعتبر است (الگوریتم تایید نشد).', isError: true });
      setSavingAdminCard(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/honarhub-pay/admin-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardNumber: cleanCard,
          ownerName: adminForm.ownerName,
          accountNumber: adminForm.accountNumber,
          bankTitle: adminForm.bankTitle,
          bankSlug: adminForm.bankSlug,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ثبت کارت ادمین');

      setAdminAccount(data.adminAccount);
      setAdminCardMsg({ text: data.message || 'کارت ادمین با موفقیت به درگاه متصل شد.', isError: false });
      setIsEditingAdminCard(false);
    } catch (err: any) {
      setAdminCardMsg({ text: err.message || 'خطا در اتصال به درگاه', isError: true });
    } finally {
      setSavingAdminCard(false);
    }
  };

  // Toggle Artist Direct Settlement
  const handleToggleArtist = async (artist: ArtistItem, currentApproved: boolean) => {
    const newStatus = !currentApproved;
    setActionLoadingArtistId(artist.id);

    try {
      const res = await fetch('/api/admin/honarhub-pay/toggle-artist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistId: artist.id,
          approve: newStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در تغییر وضعیت هنرمند');

      // Update in state
      setArtists((prev) =>
        prev.map((a) =>
          a.id === artist.id
            ? {
                ...a,
                isHonarhubPayApproved: data.isHonarhubPayApproved,
                cardId: data.cardId || a.cardId,
                syncedAt: data.syncedAt || a.syncedAt,
              }
            : a
        )
      );
    } catch (err: any) {
      alert(err.message || 'خطا در انجام عملیات');
    } finally {
      setActionLoadingArtistId(null);
    }
  };

  // Save Gateway Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg(null);

    try {
      const res = await fetch('/api/admin/honarhub-pay/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ذخیره تنظیمات');

      setConfig(data.config);
      setSettingsMsg({ text: data.message || 'تنظیمات با موفقیت ذخیره شد.', isError: false });
    } catch (err: any) {
      setSettingsMsg({ text: err.message || 'خطا در ذخیره تنظیمات', isError: true });
    } finally {
      setSavingSettings(false);
    }
  };

  // Inquire Live Status
  const handleInquireStatus = async (identifier: string) => {
    setInquiringId(identifier);
    try {
      const res = await fetch('/api/admin/honarhub-pay/inquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در استعلام');

      alert(`نتیجه استعلام از هنرهاب پی:\nوضعیت: ${data.data.status}\nمبلغ: ${data.data.payableAmountToman?.toLocaleString()} تومان\nشناسه پیگیری: ${data.data.trackingCode || '—'}`);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'خطا در استعلام وضعیت');
    } finally {
      setInquiringId(null);
    }
  };

  const filteredArtists = artists.filter((a) => {
    if (!searchArtist.trim()) return true;
    const term = searchArtist.toLowerCase();
    return (
      a.userName.toLowerCase().includes(term) ||
      (a.brandName && a.brandName.toLowerCase().includes(term)) ||
      (a.cardNumber && a.cardNumber.includes(term))
    );
  });

  const filteredLogs = paymentLogs.filter((log) => {
    if (logFilter === 'ALL') return true;
    return log.status === logFilter;
  });

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 font-bold" dir="rtl">
        در حال بارگذاری اطلاعات درگاه و حساب‌های هنرهاب پی...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans" dir="rtl">
      
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>درگاه پرداخت هوشمند P2P و تسویه بلادرنگ</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>💳</span>
              <span>مدیریت درگاه پرداخت هنرهاب پی (HonarHub Pay)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
              اتصال مستقیم به وب‌سرویس{' '}
              <a href="https://pay.honarhub.com/docs" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline font-mono">
                pay.honarhub.com/docs
              </a>
              ، مدیریت حساب پیش‌فرض ادمین برای فاکتورهای پلتفرم و اعطای مجوز تسویه مستقیم به کارت هنرمندان مستقل.
            </p>
          </div>

          {/* Gateway Status Badge */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-950/70 border border-slate-800 p-4 rounded-2xl">
            <div className="text-right">
              <div className="text-[11px] text-slate-400">وضعیت محیط درگاه:</div>
              <div className="font-mono text-xs font-bold mt-0.5">
                {config.isSandbox ? (
                  <span className="text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                    محیط آزمایشی (سندباکس)
                  </span>
                ) : (
                  <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                    محیط عملیاتی (Live)
                  </span>
                )}
              </div>
            </div>
            <a
              href="https://pay.honarhub.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl transition flex items-center gap-1.5 border border-slate-700 font-bold"
            >
              <span>📖</span>
              <span>مشاهده مستندات فنی</span>
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-8 border-t border-slate-800 pt-6">
          <button
            onClick={() => setActiveTab('ACCOUNTS')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 ${
              activeTab === 'ACCOUNTS'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>🏦</span>
            <span>حساب‌ها و تسویه (ادمین و هنرمندان)</span>
            <span className="bg-slate-900/80 text-xs px-2 py-0.5 rounded-full font-mono">
              {toPersianDigits(artists.length + 1)}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('LOGS')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 ${
              activeTab === 'LOGS'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>📜</span>
            <span>لاگ و تاریخچه تراکنش‌ها</span>
            <span className="bg-slate-900/80 text-xs px-2 py-0.5 rounded-full font-mono">
              {toPersianDigits(paymentLogs.length)}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 ${
              activeTab === 'SETTINGS'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>⚙️</span>
            <span>تنظیمات و کلید وب‌سرویس</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ACCOUNTS & CARDS */}
      {activeTab === 'ACCOUNTS' && (
        <div className="space-y-6">

          {/* 1. ADMIN DEFAULT ACCOUNT ROW */}
          <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center text-2xl shadow-md shrink-0">
                  🏛️
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-black text-white">
                      سطر حساب پیش‌فرض پلتفرم (ادمین)
                    </h2>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      مقصد پیش‌فرض واریز فاکتورها
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-2xl">
                    تمامی فاکتورهای سبد خرید کاربر که متعلق به هنرمندان مستقل تایید‌شده نباشند، به صورت خودکار به این کارت متصل و واریز می‌شوند. ادمین می‌تواند هر زمان این کارت را تغییر دهد تا کارت جدید بلافاصله در وب‌سرویس هنرهاب پی جایگزین شود.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditingAdminCard(!isEditingAdminCard)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm"
                >
                  <span>✏️</span>
                  <span>{isEditingAdminCard ? 'بستن فرم ویرایش' : 'ویرایش و تعویض کارت ادمین'}</span>
                </button>
              </div>
            </div>

            {/* Admin Card Details or Edit Form */}
            {isEditingAdminCard ? (
              <form onSubmit={handleSaveAdminCard} className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    شماره ۱۶ رقمی کارت بانکی ادمین *
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={19}
                    required
                    value={adminForm.cardNumber.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ')}
                    onChange={(e) => setAdminForm({ ...adminForm, cardNumber: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                    placeholder="۶۰۳۷ ۹۹۱۹ ۸۷۶۵ ۴۳۲۱"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-center text-white focus:border-emerald-500 outline-none tracking-widest"
                  />
                  {adminForm.cardNumber.replace(/\D/g, '').length >= 6 && (
                    <div className="text-[11px] mt-1 font-bold text-teal-400">
                      بانک تشخیص داده شده: {getBankInfoByCardNumber(adminForm.cardNumber).title}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    نام و نام خانوادگی صاحب کارت *
                  </label>
                  <input
                    type="text"
                    required
                    value={adminForm.ownerName}
                    onChange={(e) => setAdminForm({ ...adminForm, ownerName: e.target.value })}
                    placeholder="مثال: عباس رنجبر / مدیریت هنرهاب"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    شماره حساب واریزی (اختیاری جهت تطبیق مهر ایران)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={adminForm.accountNumber}
                    onChange={(e) => setAdminForm({ ...adminForm, accountNumber: e.target.value })}
                    placeholder="مثال: ۱۱۱۱۲۲۲۲۳۳۳۳۴۴۴۴۵۵"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-3 flex items-center justify-between pt-2">
                  {adminCardMsg && (
                    <div className={`text-xs font-bold ${adminCardMsg.isError ? 'text-red-400' : 'text-emerald-400'}`}>
                      {adminCardMsg.text}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mr-auto">
                    <button
                      type="button"
                      onClick={() => setIsEditingAdminCard(false)}
                      className="text-xs text-slate-400 hover:text-white px-4 py-2 rounded-xl"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      disabled={savingAdminCard}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
                    >
                      {savingAdminCard ? 'در حال ارسال به درگاه...' : 'ذخیره و همگام‌سازی با هنرهاب پی'}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">شماره کارت ادمین:</span>
                  <span className="font-mono font-bold text-base text-white tracking-widest" dir="ltr">
                    {adminAccount?.cardNumber
                      ? adminAccount.cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ')
                      : 'ثبت نشده'}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">صاحب حساب و بانک:</span>
                  <span className="font-bold text-xs text-slate-200 block truncate">
                    {adminAccount?.ownerName || 'نامشخص'}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-semibold block mt-0.5">
                    {adminAccount?.bankTitle || (adminAccount?.cardNumber ? getBankInfoByCardNumber(adminAccount.cardNumber).title : '—')}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">شناسه در درگاه هنرهاب پی:</span>
                  <span className="font-mono text-xs font-semibold text-slate-300 block truncate" dir="ltr">
                    {adminAccount?.cardId || 'ثبت نشده'}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">وضعیت همگام‌سازی درگاه:</span>
                  {adminAccount?.cardId ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                      <span>✓</span>
                      <span>همگام‌شده</span>
                      {adminAccount.syncedAt && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({formatPersianDateTime(adminAccount.syncedAt)})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-amber-400 font-bold">نیازمند ثبت و اتصال</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. LEVEL 3 ARTISTS LIST & INDEPENDENT SETTLEMENT TOGGLES */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>🎨</span>
                  <span>سطرهای هنرمندان احراز هویت سطح ۳ (واجد شرایط تسویه مستقیم)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  با زدن تیک تایید، کارت بانکی هنرمند مستقیماً در هنرهاب پی ثبت شده و در سبد خرید خریداران، برای کالاهای این هنرمند فاکتور مجزا صادر و مستقیماً به کارت او واریز می‌گردد.
                </p>
              </div>

              {/* Search box */}
              <div className="w-full sm:w-64">
                <input
                  type="text"
                  value={searchArtist}
                  onChange={(e) => setSearchArtist(e.target.value)}
                  placeholder="جستجو در نام هنرمند یا کارت..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            {filteredArtists.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-slate-800/80">
                هیچ هنرمندی با احراز هویت سطح ۳ یا ثبت کارت بانکی یافت نشد.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-3 px-3">هنرمند و استودیو</th>
                      <th className="py-3 px-3">کد ملی و شبا</th>
                      <th className="py-3 px-3">شماره کارت بانکی (۱۶ رقم)</th>
                      <th className="py-3 px-3">وضعیت درگاه هنرهاب پی</th>
                      <th className="py-3 px-3 text-center">واریز مستقیم (هنرمند مستقل)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredArtists.map((artist) => {
                      const isApproved = artist.isHonarhubPayApproved;
                      const isActionLoading = actionLoadingArtistId === artist.id;
                      const bankInfo = artist.cardNumber ? getBankInfoByCardNumber(artist.cardNumber) : null;

                      return (
                        <tr key={artist.id} className="hover:bg-slate-850/60 transition">
                          
                          {/* Artist Info */}
                          <td className="py-4 px-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                                {artist.userImage ? (
                                  <img src={artist.userImage} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-slate-400 text-base">🎨</span>
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-white text-xs">
                                  {artist.userName}
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                  {artist.brandName && (
                                    <span className="text-teal-400 font-semibold">{artist.brandName}</span>
                                  )}
                                  <span className="font-mono text-[10px]">#{artist.displayId}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* National ID & Sheba */}
                          <td className="py-4 px-3">
                            <div className="text-slate-300 font-mono text-[11px]">
                              کدملی: {artist.nationalId || '—'}
                            </div>
                            <div className="text-slate-400 font-mono text-[10px] mt-0.5" dir="ltr">
                              {artist.shebaNumber ? `IR ${artist.shebaNumber}` : '—'}
                            </div>
                          </td>

                          {/* Card Number & Bank */}
                          <td className="py-4 px-3">
                            {artist.cardNumber ? (
                              <div>
                                <span className="font-mono font-bold text-white text-xs tracking-wider" dir="ltr">
                                  {artist.cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ')}
                                </span>
                                <div className="text-[10px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                                  <span>🏦</span>
                                  <span>{artist.cardBankTitle || bankInfo?.title || 'عضو شبکه شتاب'}</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-rose-400 font-bold text-[11px]">
                                فاقد شماره کارت
                              </span>
                            )}
                          </td>

                          {/* Gateway Sync Status */}
                          <td className="py-4 px-3">
                            {artist.cardId ? (
                              <div>
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold inline-block">
                                  کارت ثبت‌شده: {artist.cardId.slice(0, 14)}...
                                </span>
                                {artist.syncedAt && (
                                  <div className="text-[10px] text-slate-500 mt-1">
                                    همگام‌سازی: {formatPersianDateTime(artist.syncedAt)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[11px]">
                                در درگاه ثبت نشده
                              </span>
                            )}
                          </td>

                          {/* Approval Switch / Action */}
                          <td className="py-4 px-3 text-center">
                            <button
                              type="button"
                              disabled={isActionLoading || !artist.cardNumber}
                              onClick={() => handleToggleArtist(artist, isApproved)}
                              className={`relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-40 ${
                                isApproved
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                                  : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              <span>{isActionLoading ? '⏳' : isApproved ? '✓' : '○'}</span>
                              <span>{isApproved ? 'هنرمند مستقل (واریز مستقیم)' : 'تایید و اتصال به درگاه'}</span>
                            </button>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENT LOGS */}
      {activeTab === 'LOGS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-lg space-y-6">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">مجموع مبالغ پرداخت‌شده:</span>
              <span className="font-mono font-black text-lg text-emerald-400">
                {toPersianDigits(stats.totalPaidAmount.toLocaleString())} <span className="text-xs text-slate-400">تومان</span>
              </span>
            </div>
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">پرداخت‌های موفق (PAID):</span>
              <span className="font-mono font-black text-lg text-white">
                {toPersianDigits(stats.paidCount)}
              </span>
            </div>
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">واریز مستقیم به هنرمند:</span>
              <span className="font-mono font-black text-lg text-teal-300">
                {toPersianDigits(stats.directArtistPaidCount)}
              </span>
            </div>
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">ناموفق / لغو شده:</span>
              <span className="font-mono font-black text-lg text-rose-400">
                {toPersianDigits(stats.failedCount)}
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>📋</span>
              <span>فهرست رویدادهای درگاه و پرداخت‌ها</span>
            </h3>

            <div className="flex items-center gap-2">
              {(['ALL', 'PAID', 'PENDING', 'FAILED'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setLogFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    logFilter === f
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {f === 'ALL' ? 'همه' : f === 'PAID' ? 'موفق' : f === 'PENDING' ? 'در انتظار' : 'ناموفق'}
                </button>
              ))}
            </div>
          </div>

          {/* Logs Table */}
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-slate-800/80">
              هیچ لاگ پرداختی با این فیلتر ثبت نشده است.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-3 px-3">سفارش / فاکتور</th>
                    <th className="py-3 px-3">مبلغ پرداختی</th>
                    <th className="py-3 px-3">مقصد واریز</th>
                    <th className="py-3 px-3">شناسه‌های درگاه</th>
                    <th className="py-3 px-3 text-center">وضعیت</th>
                    <th className="py-3 px-3">تاریخ و زمان</th>
                    <th className="py-3 px-3 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredLogs.map((log) => {
                    const isPaid = log.status === 'PAID';
                    const isPending = log.status === 'PENDING';

                    return (
                      <tr key={log.id} className="hover:bg-slate-850/60 transition">
                        
                        {/* Order & Invoice */}
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-white text-xs font-mono">
                            {log.order?.orderNumber || log.orderId || 'سفارش مستقیم'}
                          </div>
                          {log.invoiceNumber && (
                            <div className="text-[10px] text-teal-400 font-mono mt-0.5">
                              فاکتور: {log.invoiceNumber}
                            </div>
                          )}
                        </td>

                        {/* Amount & Offset */}
                        <td className="py-3.5 px-3">
                          <div className="font-mono font-bold text-white text-xs">
                            {toPersianDigits((log.payableAmount || log.amount).toLocaleString())} تومان
                          </div>
                          {!!log.offsetAmount && log.offsetAmount > 0 && (
                            <span className="text-[10px] text-amber-400 font-mono">
                              (آفست: +{toPersianDigits(log.offsetAmount)} تومان)
                            </span>
                          )}
                        </td>

                        {/* Destination */}
                        <td className="py-3.5 px-3">
                          {log.isDirectArtist ? (
                            <span className="text-teal-400 font-semibold text-[11px] flex items-center gap-1">
                              <span>🎨</span>
                              <span>کارت هنرمند مستقل</span>
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                              <span>🏛️</span>
                              <span>حساب پیش‌فرض ادمین</span>
                            </span>
                          )}
                          {log.cardNumber && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5" dir="ltr">
                              {log.cardNumber.slice(0, 4)} •••• •••• {log.cardNumber.slice(-4)}
                            </div>
                          )}
                        </td>

                        {/* Authority & Tracking */}
                        <td className="py-3.5 px-3">
                          {log.trackingCode && (
                            <div className="font-mono text-xs text-amber-300 font-bold">
                              {log.trackingCode}
                            </div>
                          )}
                          {log.authority && (
                            <div className="font-mono text-[10px] text-slate-500 truncate max-w-[150px]">
                              {log.authority}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block ${
                              isPaid
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : isPending
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {isPaid ? '✓ پرداخت موفق' : isPending ? '⏳ در انتظار واریز' : '✕ ناموفق / منقضی'}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                          {formatPersianDateTime(log.paidAt || log.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-3 text-center">
                          {(log.authority || log.trackingCode) && (
                            <button
                              type="button"
                              disabled={inquiringId === (log.authority || log.trackingCode)}
                              onClick={() => handleInquireStatus(log.authority || log.trackingCode || '')}
                              className="text-[11px] text-slate-300 hover:text-emerald-400 bg-slate-800 hover:bg-slate-750 px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
                              title="استعلام بلادرنگ وضعیت فاکتور از درگاه هنرهاب پی"
                            >
                              {inquiringId === (log.authority || log.trackingCode) ? 'در حال استعلام...' : '🔍 استعلام درگاه'}
                            </button>
                          )}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GATEWAY SETTINGS */}
      {activeTab === 'SETTINGS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-lg max-w-2xl">
          <h3 className="text-base font-black text-white flex items-center gap-2 mb-2">
            <span>⚙️</span>
            <span>تنظیمات ارتباط با وب‌سرویس هنرهاب پی</span>
          </h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            کلید API اختصاصی خود را که از پنل پذیرندگان هنرهاب پی دریافت کرده‌اید اینجا وارد کنید.
          </p>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                کلید وب‌سرویس پذیرنده (x-api-key) *
              </label>
              <input
                type="text"
                dir="ltr"
                required
                value={settingsForm.apiKey}
                onChange={(e) => setSettingsForm({ ...settingsForm, apiKey: e.target.value })}
                placeholder="hp_sandbox_test_key_2026"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:border-emerald-500 outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                کلید پیش‌فرض تست سندباکس: <code className="text-emerald-400">hp_sandbox_test_key_2026</code>
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                آدرس ریشه وب‌سرویس (Base URL)
              </label>
              <input
                type="url"
                dir="ltr"
                required
                value={settingsForm.baseUrl}
                onChange={(e) => setSettingsForm({ ...settingsForm, baseUrl: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">حالت آزمایشی (سندباکس)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  در حالت سندباکس، کلیه تراکنش‌ها شبیه‌سازی می‌شوند و پولی جابجا نمی‌شود.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settingsForm.isSandbox}
                onChange={(e) => setSettingsForm({ ...settingsForm, isSandbox: e.target.checked })}
                className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
              />
            </div>

            {settingsMsg && (
              <div className={`text-xs font-bold ${settingsMsg.isError ? 'text-red-400' : 'text-emerald-400'}`}>
                {settingsMsg.text}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
              >
                {savingSettings ? 'در حال ذخیره‌سازی...' : 'ذخیره تنظیمات درگاه'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
