'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toPersianDigits, formatPersianDateTime } from '@/lib/date';
import { isValidIranianCardNumber, isValidIranianSheba, getBankInfoByCardNumber } from '@/lib/sms';

interface AdminAccount {
  cardNumber: string | null;
  ownerName: string | null;
  iban: string | null;
  accountNumber?: string | null;
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

interface GatewayExecutionResult {
  executedAt: string;
  isSuccess: boolean;
  statusCode: number;
  message: string;
  cardId?: string;
  error?: string;
  gatewayResponse?: any;
  sentPayload?: any;
  sentHeaders?: any;
  requestUrl?: string;
  requestMethod?: string;
}

export default function HonarHubPayAdminPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ACCOUNTS' | 'LOGS' | 'SETTINGS'>('ACCOUNTS');
  const [config, setConfig] = useState({
    apiKey: '',
    baseUrl: 'https://pay.honarhub.com',
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
    iban: '',
    bankTitle: '',
    bankSlug: '',
    apiKey: '',
  });
  const [savingAdminCard, setSavingAdminCard] = useState(false);
  const [lastGatewayExecution, setLastGatewayExecution] = useState<GatewayExecutionResult | null>(null);

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    apiKey: '',
    baseUrl: 'https://pay.honarhub.com',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Connection Test State
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
  } | null>(null);

  // Search & Filters
  const [searchArtist, setSearchArtist] = useState('');
  const [logFilter, setLogFilter] = useState<'ALL' | 'PAID' | 'FAILED' | 'PENDING'>('ALL');
  const [actionLoadingArtistId, setActionLoadingArtistId] = useState<string | null>(null);
  const [inquiringId, setInquiringId] = useState<string | null>(null);

  // Derived real-time card validation
  const cleanCardDigits = adminForm.cardNumber.replace(/\D/g, '').slice(0, 16);
  const isCardComplete = cleanCardDigits.length === 16;
  const isCardValid = isCardComplete ? isValidIranianCardNumber(cleanCardDigits) : null;
  const detectedBank = getBankInfoByCardNumber(cleanCardDigits);

  // Derived real-time IBAN validation
  const cleanShebaBody = adminForm.iban.replace(/\s+/g, '').toUpperCase().replace(/^IR/i, '').replace(/\D/g, '').slice(0, 24);
  const hasShebaInput = adminForm.iban.trim().length > 0;
  const isShebaComplete = cleanShebaBody.length === 24;
  const isShebaValid = hasShebaInput ? (isShebaComplete ? isValidIranianSheba(`IR${cleanShebaBody}`) : false) : null;

  // Can submit check: Card must be 16 valid digits, and if IBAN entered it must be valid
  const canSubmitAdminCard =
    adminForm.ownerName.trim().length > 0 &&
    isCardComplete &&
    isCardValid === true &&
    (!hasShebaInput || isShebaValid === true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/honarhub-pay', { cache: 'no-store' });
      if (!res.ok) throw new Error('خطا در دریافت اطلاعات درگاه');
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
          iban: data.adminAccount.iban || '',
          bankTitle: data.adminAccount.bankTitle || '',
          bankSlug: data.adminAccount.bankSlug || '',
          apiKey: data.config?.apiKey || '',
        });
      } else {
        setAdminForm((prev) => ({
          ...prev,
          apiKey: data.config?.apiKey || '',
        }));
      }

      setSettingsForm({
        apiKey: data.config?.apiKey || '',
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

  // Test Live Gateway Connection
  const handleTestConnection = async (overrideApiKey?: string) => {
    setTestingConnection(true);
    setConnectionTestResult(null);

    const keyToTest = overrideApiKey || adminForm.apiKey || settingsForm.apiKey;

    try {
      const res = await fetch('/api/admin/honarhub-pay/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': keyToTest.trim(),
        },
        body: JSON.stringify({
          apiKey: keyToTest.trim(),
          baseUrl: settingsForm.baseUrl,
        }),
      });

      const data = await res.json();
      setConnectionTestResult({
        tested: true,
        success: Boolean(data.success),
        message: data.message || (data.success ? 'اتصال به درگاه موفقیت‌آمیز است.' : 'خطای اتصال به درگاه'),
      });
    } catch (err: any) {
      setConnectionTestResult({
        tested: true,
        success: false,
        message: `خطای ارتباط شبکه: ${err.message}`,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Card Number Change Handler with Real-time Formatting
  const handleCardNumberChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 16);
    const bank = getBankInfoByCardNumber(digits);
    setAdminForm((prev) => ({
      ...prev,
      cardNumber: digits,
      bankTitle: bank.title,
      bankSlug: bank.slug,
    }));
  };

  // IBAN Change Handler with Real-time Formatting
  const handleIbanChange = (raw: string) => {
    let clean = raw.trim().toUpperCase().replace(/\s+/g, '');
    if (clean && !clean.startsWith('IR') && /^\d/.test(clean)) {
      clean = 'IR' + clean;
    }
    const digits = clean.replace(/^IR/i, '').replace(/\D/g, '').slice(0, 24);
    const formatted = digits.length > 0 ? `IR${digits}` : clean.startsWith('IR') ? 'IR' : '';
    setAdminForm((prev) => ({
      ...prev,
      iban: formatted,
    }));
  };

  // Submit Request: Send Card to HonarHub Pay (POST /api/v1/admin/cards)
  const handleSendToHonarHubPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitAdminCard) return;

    setSavingAdminCard(true);
    setLastGatewayExecution(null);

    const targetApiKey = (adminForm.apiKey || settingsForm.apiKey || config.apiKey).trim();
    const endpointUrl = `${settingsForm.baseUrl || 'https://pay.honarhub.com'}/api/v1/admin/cards`;

    const requestPayload = {
      cardNumber: cleanCardDigits,
      ownerName: adminForm.ownerName.trim(),
      iban: cleanShebaBody ? `IR${cleanShebaBody}` : undefined,
      bankTitle: adminForm.bankTitle || detectedBank.title,
      bankSlug: adminForm.bankSlug || detectedBank.slug,
      apiKey: targetApiKey,
    };

    const requestHeaders = {
      'Content-Type': 'application/json',
      'x-api-key': targetApiKey,
      'Accept': 'application/json',
    };

    try {
      // Send explicit x-api-key header from browser
      const res = await fetch('/api/admin/honarhub-pay/admin-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': targetApiKey,
        },
        body: JSON.stringify(requestPayload),
      });

      const data = await res.json();

      setLastGatewayExecution({
        executedAt: new Date().toLocaleTimeString('fa-IR'),
        isSuccess: Boolean(data.success && data.isSynced),
        statusCode: data.statusCode || res.status,
        message: data.message || (data.success ? 'کارت با موفقیت در درگاه ثبت گردید.' : (data.error || 'خطا در ثبت کارت')),
        cardId: data.cardId,
        error: data.gatewayError || data.error,
        gatewayResponse: data.gatewayResponse || data,
        sentPayload: data.sentPayload || {
          ownerName: adminForm.ownerName.trim(),
          cardNumber: cleanCardDigits,
          ...(cleanShebaBody ? { iban: `IR${cleanShebaBody}` } : {}),
          bankTitle: adminForm.bankTitle || detectedBank.title,
          bankSlug: adminForm.bankSlug || detectedBank.slug,
        },
        sentHeaders: data.sentHeaders || requestHeaders,
        requestUrl: data.requestUrl || endpointUrl,
        requestMethod: data.requestMethod || 'POST',
      });

      if (data.adminAccount) {
        setAdminAccount(data.adminAccount);
      }
    } catch (err: any) {
      setLastGatewayExecution({
        executedAt: new Date().toLocaleTimeString('fa-IR'),
        isSuccess: false,
        statusCode: 0,
        message: 'خطای شبکه در ارسال درخواست به سرور',
        error: err.message || 'Network error',
        sentHeaders: requestHeaders,
        sentPayload: requestPayload,
        requestUrl: endpointUrl,
        requestMethod: 'POST',
      });
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
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': (settingsForm.apiKey || config.apiKey).trim(),
        },
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
      alert(err.message || 'خطا در انجام عملیات درگاه');
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
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settingsForm.apiKey.trim(),
        },
        body: JSON.stringify({
          apiKey: settingsForm.apiKey.trim(),
          baseUrl: settingsForm.baseUrl.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ذخیره تنظیمات');

      setConfig(data.config);
      setAdminForm((prev) => ({ ...prev, apiKey: data.config.apiKey }));
      setSettingsMsg({ text: data.message || 'تنظیمات درگاه عملیاتی با موفقیت ذخیره شد.', isError: false });
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
      <div className="p-12 text-center text-slate-500 font-bold bg-white rounded-3xl border border-slate-200 shadow-sm" dir="rtl">
        در حال بارگذاری اطلاعات درگاه و حساب‌های هنرهاب پی...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans" dir="rtl">
      
      {/* Top Banner & Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>درگاه پرداخت هوشمند کارت‌به‌کارت و تسویه بلادرنگ</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <span>💳</span>
              <span>مدیریت درگاه پرداخت هنرهاب پی (HonarHub Pay)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
              ارسال مستقیم متد ثبت کارت بانکی به وب‌سرویس{' '}
              <a href="https://pay.honarhub.com/docs" target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold hover:underline font-mono">
                pay.honarhub.com/docs
              </a>
              ، مدیریت کارت پیش‌فرض ادمین برای فاکتورهای پلتفرم و اعطای مجوز تسویه مستقیم به کارت هنرمندان مستقل.
            </p>
          </div>

          {/* Operational Status Badge & Quick Test */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-xs font-black text-emerald-800">
                درگاه عملیاتی فعال (Live)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleTestConnection()}
                disabled={testingConnection}
                className="text-xs bg-white hover:bg-slate-100 text-slate-700 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 border border-slate-300 font-bold shadow-sm cursor-pointer disabled:opacity-50"
                title="بررسی زنده اعتبار کلید وب‌سرویس در درگاه (بدون ایجاد هیچ‌گونه تراکنش یا درگاه تستی)"
              >
                <span>{testingConnection ? '⏳' : '🔑'}</span>
                <span>{testingConnection ? 'در حال بررسی...' : 'بررسی کلید وب‌سرویس'}</span>
              </button>

              <a
                href="https://pay.honarhub.com/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 font-bold shadow-sm"
              >
                <span>📖</span>
                <span>مستندات</span>
              </a>
            </div>
          </div>
        </div>

        {/* Live Test Alert Banner */}
        {connectionTestResult && (
          <div className={`mt-4 p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between ${
            connectionTestResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-center gap-2">
              <span>{connectionTestResult.success ? '✅' : '❌'}</span>
              <span>{connectionTestResult.message}</span>
            </div>
            <button
              onClick={() => setConnectionTestResult(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-normal cursor-pointer"
            >
              ✕ بستن
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 border-t border-slate-200 pt-5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('ACCOUNTS')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'ACCOUNTS'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <span>🏦</span>
            <span>حساب‌ها و تسویه (ادمین و هنرمندان)</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
              activeTab === 'ACCOUNTS' ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {toPersianDigits(artists.length + 1)}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('LOGS')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'LOGS'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <span>📜</span>
            <span>لاگ و تاریخچه تراکنش‌ها</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
              activeTab === 'LOGS' ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {toPersianDigits(paymentLogs.length)}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'SETTINGS'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
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
          <div className="bg-white border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-7 shadow-sm relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-2xl shadow-sm shrink-0">
                  🏛️
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-black text-slate-900">
                      سطر حساب پیش‌فرض پلتفرم (ادمین)
                    </h2>
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      مقصد پیش‌فرض واریز فاکتورها
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed max-w-2xl">
                    تمامی فاکتورهای سبد خرید کاربر که متعلق به هنرمندان مستقل تایید‌شده نباشند، به این کارت واریز می‌شوند. برای تغییر، اطلاعات کارت را وارد و دکمه <strong>«ارسال به هنرهاب پی»</strong> را بزنید تا مستقیماً به آدرس <code className="text-emerald-700 font-mono">POST /api/v1/admin/cards</code> در درگاه ارسال گردد.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditingAdminCard(!isEditingAdminCard)}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer"
                  title="ویرایش و تعویض کارت ادمین"
                >
                  {/* Standard Edit Pencil Icon from Artist Panel */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <span>{isEditingAdminCard ? 'بستن فرم ویرایش' : 'ویرایش و ارسال کارت'}</span>
                </button>
              </div>
            </div>

            {/* Admin Card Details or Edit Form */}
            {isEditingAdminCard ? (
              <form onSubmit={handleSendToHonarHubPay} className="mt-6 pt-6 border-t border-slate-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* 1. Card Number with LIVE Luhn Algorithm Check */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-800">
                        شماره ۱۶ رقمی کارت بانکی ادمین *
                      </label>
                      <span className="text-[10px] font-mono text-slate-500" dir="ltr">
                        {toPersianDigits(cleanCardDigits.length)}/۱۶ رقم
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        dir="ltr"
                        maxLength={19}
                        required
                        value={cleanCardDigits.replace(/(\d{4})(?=\d)/g, '$1 ')}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        placeholder="۶۰۳۷ ۹۹۱۹ ۸۷۶۵ ۴۳۲۱"
                        className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm font-mono text-center text-slate-900 outline-none tracking-widest transition-all ${
                          isCardComplete
                            ? isCardValid
                              ? 'border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/20'
                              : 'border-rose-500 ring-2 ring-rose-100 bg-rose-50/20'
                            : 'border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                        }`}
                      />
                      {/* Live icon inside input */}
                      {isCardComplete && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          {isCardValid ? (
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                              ✓
                            </span>
                          ) : (
                            <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                              ✕
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Instant Feedback Badge */}
                    {isCardComplete ? (
                      isCardValid ? (
                        <div className="flex items-center justify-between text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-xl mt-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">✓</span>
                            <span>شماره کارت معتبر است (تایید شتاب)</span>
                          </div>
                          <span className="text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-200 text-[11px]">
                            🏦 {detectedBank.title}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 bg-rose-50 border border-rose-300 px-3 py-1.5 rounded-xl mt-2">
                          <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">✕</span>
                          <span>شماره کارت نامعتبر است (رقم کنترلی شتاب تایید نشد)</span>
                        </div>
                      )
                    ) : (
                      cleanCardDigits.length >= 6 && (
                        <div className="text-[11px] mt-1.5 font-bold text-emerald-700 flex items-center gap-1">
                          <span>🏦</span>
                          <span>بانک تشخیص داده شده: {detectedBank.title}</span>
                        </div>
                      )
                    )}
                  </div>

                  {/* 2. Owner Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      نام و نام خانوادگی صاحب کارت *
                    </label>
                    <input
                      type="text"
                      required
                      value={adminForm.ownerName}
                      onChange={(e) => setAdminForm({ ...adminForm, ownerName: e.target.value })}
                      placeholder="مثال: عباس رنجبر / مدیریت هنرهاب"
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                    />
                  </div>

                  {/* 3. IBAN with LIVE ISO 7064 Checksum */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-800">
                        شماره شبا (IBAN) - اختیاری
                      </label>
                      {hasShebaInput && (
                        <span className="text-[10px] font-mono text-slate-500" dir="ltr">
                          {toPersianDigits(cleanShebaBody.length)}/۲۴ رقم
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        dir="ltr"
                        value={adminForm.iban}
                        onChange={(e) => handleIbanChange(e.target.value)}
                        placeholder="IR120600000000123456789012"
                        className={`w-full px-4 py-2.5 bg-white border rounded-xl text-xs font-mono text-slate-900 outline-none transition-all ${
                          hasShebaInput
                            ? isShebaComplete
                              ? isShebaValid
                                ? 'border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/20'
                                : 'border-rose-500 ring-2 ring-rose-100 bg-rose-50/20'
                              : 'border-amber-400 bg-amber-50/20'
                            : 'border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                        }`}
                      />
                      {/* Live icon inside input */}
                      {hasShebaInput && isShebaComplete && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          {isShebaValid ? (
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                              ✓
                            </span>
                          ) : (
                            <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                              ✕
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Instant IBAN Feedback Badge */}
                    {hasShebaInput ? (
                      isShebaComplete ? (
                        isShebaValid ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-xl mt-2">
                            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">✓</span>
                            <span>شماره شبا معتبر است (تایید پایا / پل)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 bg-rose-50 border border-rose-300 px-3 py-1.5 rounded-xl mt-2">
                            <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">✕</span>
                            <span>شماره شبا نامعتبر است (رقم کنترلی تایید نشد)</span>
                          </div>
                        )
                      ) : (
                        <div className="text-[11px] text-amber-700 mt-1.5 font-bold">
                          {toPersianDigits(24 - cleanShebaBody.length)} رقم تا تکمیل ۲۴ رقم شماره شبا
                        </div>
                      )
                    ) : (
                      <div className="text-[10px] text-slate-500 mt-1">
                        جهت تسویه‌های مبالغ بالای ۱۵ میلیون تومان از طریق سامانه پل
                      </div>
                    )}
                  </div>

                  {/* 4. API Key Header for this request */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      کلید وب‌سرویس (Header: x-api-key) *
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      required
                      value={adminForm.apiKey}
                      onChange={(e) => setAdminForm({ ...adminForm, apiKey: e.target.value.trim() })}
                      placeholder="hp_5es13yul_mwc2x9qh"
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                    />
                    <div className="text-[10px] text-slate-500 mt-1">
                      این کلید دقیقاً در هدر <code className="text-emerald-700 font-mono font-bold">x-api-key</code> درخواست ارسالی قرار می‌گیرد.
                    </div>
                  </div>

                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-500">
                    با کلیک بر روی دکمه زیر، درخواست ثبت کارت به متد <code className="text-slate-800 font-mono font-bold">POST /api/v1/admin/cards</code> در درگاه ارسال می‌گردد.
                  </div>

                  <div className="flex items-center gap-2 mr-auto">
                    <button
                      type="button"
                      onClick={() => setIsEditingAdminCard(false)}
                      className="text-xs text-slate-600 hover:text-slate-900 px-4 py-2.5 rounded-xl cursor-pointer"
                    >
                      انصراف
                    </button>

                    {/* Exact Requested Button: ارسال به هنرهاب پی */}
                    <button
                      type="submit"
                      disabled={savingAdminCard || !canSubmitAdminCard}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm px-6 py-2.5 rounded-xl transition flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-emerald-600/20"
                    >
                      <span>{savingAdminCard ? '⏳' : '🚀'}</span>
                      <span>{savingAdminCard ? 'در حال ارسال به درگاه...' : 'ارسال به هنرهاب پی'}</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-bold block mb-1">شماره کارت ادمین:</span>
                  <span className="font-mono font-bold text-base text-slate-900 tracking-widest" dir="ltr">
                    {adminAccount?.cardNumber
                      ? adminAccount.cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ')
                      : 'ثبت نشده'}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-bold block mb-1">صاحب حساب و بانک:</span>
                  <span className="font-bold text-xs text-slate-900 block truncate">
                    {adminAccount?.ownerName || 'نامشخص'}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">
                    {adminAccount?.bankTitle || (adminAccount?.cardNumber ? getBankInfoByCardNumber(adminAccount.cardNumber).title : '—')}
                  </span>
                  {adminAccount?.iban && (
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5" dir="ltr">
                      {adminAccount.iban}
                    </span>
                  )}
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-bold block mb-1">شناسه در درگاه هنرهاب پی:</span>
                  <span className="font-mono text-xs font-semibold text-slate-800 block truncate" dir="ltr">
                    {adminAccount?.cardId || 'ثبت در سیستم'}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-bold block mb-1">وضعیت فعال درگاه:</span>
                  {adminAccount?.cardNumber ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                        <span>✓</span>
                        <span>کارت فعال و آماده پرداخت</span>
                      </div>
                      {adminAccount.syncedAt && (
                        <span className="text-[10px] text-slate-500 font-normal">
                          (همگام‌سازی: {formatPersianDateTime(adminAccount.syncedAt)})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-amber-700 font-bold">نیازمند ثبت کارت</span>
                  )}
                </div>
              </div>
            )}

            {/* Real-time Gateway Request & Response Inspector (Always Visible when executed) */}
            {lastGatewayExecution && (
              <div className={`mt-6 p-6 rounded-2xl border transition-all shadow-sm ${
                lastGatewayExecution.isSuccess
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50/80 border-rose-300 text-rose-950'
              }`}>
                {/* Header of Inspector */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                  <div className="flex items-center gap-3">
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-base font-black text-white shrink-0 shadow-sm ${
                      lastGatewayExecution.isSuccess ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}>
                      {lastGatewayExecution.isSuccess ? '✓' : '✕'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm sm:text-base font-black">
                          {lastGatewayExecution.isSuccess
                            ? `تاییدیه ثبت کارت در درگاه هنرهاب پی (HTTP ${lastGatewayExecution.statusCode} OK)`
                            : `پاسخ سرور درگاه هنرهاب پی (HTTP ${lastGatewayExecution.statusCode || 'خطا'})`}
                        </h4>
                        <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold" dir="ltr">
                          زمان ثبت: {lastGatewayExecution.executedAt}
                        </span>
                      </div>
                      <p className="text-xs font-bold mt-1 leading-relaxed">
                        {lastGatewayExecution.message || lastGatewayExecution.error}
                      </p>
                      {lastGatewayExecution.cardId && (
                        <div className="text-xs mt-1 font-mono text-emerald-800">
                          شناسه کارت اختصاص‌یافته در درگاه (cardId): <strong>{lastGatewayExecution.cardId}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        const fullReport = JSON.stringify({
                          status: lastGatewayExecution.statusCode,
                          isSuccess: lastGatewayExecution.isSuccess,
                          executedAt: lastGatewayExecution.executedAt,
                          request: {
                            url: lastGatewayExecution.requestUrl,
                            method: lastGatewayExecution.requestMethod,
                            headers: lastGatewayExecution.sentHeaders,
                            payload: lastGatewayExecution.sentPayload,
                          },
                          response: lastGatewayExecution.gatewayResponse,
                        }, null, 2);
                        navigator.clipboard.writeText(fullReport);
                        alert('گزارش کامل ورودی و خروجی درگاه در کلیپ‌بورد کپی شد.');
                      }}
                      className="text-xs bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <span>📋</span>
                      <span>کپی گزارش کامل</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLastGatewayExecution(null)}
                      className="text-slate-500 hover:text-slate-800 text-xs px-3 py-2 rounded-xl bg-white/60 hover:bg-white border border-slate-200 transition cursor-pointer"
                      title="بستن گزارش"
                    >
                      ✕ بستن
                    </button>
                  </div>
                </div>

                {/* Two Panels: Sent Request (Left) & Gateway Response (Right) */}
                <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs font-mono">
                  
                  {/* Panel 1: Sent Request */}
                  <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between" dir="ltr">
                    <div>
                      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                        <span className="font-bold text-teal-400 text-xs font-sans">
                          ۱. ورودی ارسالی به درگاه (Request)
                        </span>
                        <span className="text-[11px] text-teal-300 font-mono font-bold bg-slate-800 px-2 py-0.5 rounded">
                          {lastGatewayExecution.requestMethod || 'POST'} {lastGatewayExecution.requestUrl || 'https://pay.honarhub.com/api/v1/admin/cards'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-300 mb-1 font-sans font-bold">هدرهای ارسالی (Headers):</div>
                      <pre className="bg-slate-950 p-3 rounded-xl text-[11px] text-amber-300 overflow-x-auto mb-3 border border-slate-800/80 leading-relaxed">
                        {JSON.stringify(lastGatewayExecution.sentHeaders, null, 2)}
                      </pre>

                      <div className="text-[11px] text-slate-300 mb-1 font-sans font-bold">بدنه داده ارسالی (Payload Body):</div>
                      <pre className="bg-slate-950 p-3 rounded-xl text-[11px] text-emerald-300 overflow-x-auto border border-slate-800/80 leading-relaxed">
                        {JSON.stringify(lastGatewayExecution.sentPayload, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* Panel 2: Received Gateway Response */}
                  <div className={`rounded-2xl p-4 shadow-sm flex flex-col justify-between ${
                    lastGatewayExecution.isSuccess
                      ? 'bg-slate-900 text-slate-100'
                      : 'bg-slate-950 text-slate-100'
                  }`} dir="ltr">
                    <div>
                      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                        <span className={`font-bold text-xs font-sans ${
                          lastGatewayExecution.isSuccess ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          ۲. خروجی دریافتی از درگاه (Gateway Response)
                        </span>
                        <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded font-bold ${
                          lastGatewayExecution.isSuccess ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          HTTP {lastGatewayExecution.statusCode}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-300 mb-1 font-sans font-bold">پاسخ سرور درگاه (Response Body):</div>
                      <pre className={`bg-slate-950 p-3 rounded-xl text-[11px] overflow-x-auto max-h-96 border border-slate-800/80 leading-relaxed ${
                        lastGatewayExecution.isSuccess ? 'text-emerald-200' : 'text-rose-200'
                      }`}>
                        {JSON.stringify(lastGatewayExecution.gatewayResponse || { error: lastGatewayExecution.error }, null, 2)}
                      </pre>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* 2. LEVEL 3 ARTISTS LIST & INDEPENDENT SETTLEMENT TOGGLES */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>🎨</span>
                  <span>سطرهای هنرمندان احراز هویت سطح ۳ (واجد شرایط تسویه مستقیم)</span>
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  با زدن تیک تایید، کارت بانکی هنرمند مستقیماً در سیستم تایید شده و در سبد خرید خریداران، برای کالاهای این هنرمند فاکتور مجزا صادر و مستقیماً به کارت او واریز می‌گردد.
                </p>
              </div>

              {/* Search box */}
              <div className="w-full sm:w-64">
                <input
                  type="text"
                  value={searchArtist}
                  onChange={(e) => setSearchArtist(e.target.value)}
                  placeholder="جستجو در نام هنرمند یا کارت..."
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                />
              </div>
            </div>

            {filteredArtists.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                هیچ هنرمندی با احراز هویت سطح ۳ یا ثبت کارت بانکی یافت نشد.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 bg-slate-50 font-bold">
                      <th className="py-3.5 px-3">هنرمند و استودیو</th>
                      <th className="py-3.5 px-3">کد ملی و شبا</th>
                      <th className="py-3.5 px-3">شماره کارت بانکی (۱۶ رقم)</th>
                      <th className="py-3.5 px-3">وضعیت درگاه هنرهاب پی</th>
                      <th className="py-3.5 px-3 text-center">واریز مستقیم (هنرمند مستقل)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {filteredArtists.map((artist) => {
                      const isApproved = artist.isHonarhubPayApproved;
                      const isActionLoading = actionLoadingArtistId === artist.id;
                      const bankInfo = artist.cardNumber ? getBankInfoByCardNumber(artist.cardNumber) : null;

                      return (
                        <tr key={artist.id} className="hover:bg-slate-50/70 transition">
                          
                          {/* Artist Info */}
                          <td className="py-4 px-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                {artist.userImage ? (
                                  <img src={artist.userImage} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-slate-400 text-base">🎨</span>
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-xs">
                                  {artist.userName}
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                  {artist.brandName && (
                                    <span className="text-emerald-700 font-semibold">{artist.brandName}</span>
                                  )}
                                  <span className="font-mono text-[10px]">#{artist.displayId}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* National ID & Sheba */}
                          <td className="py-4 px-3">
                            <div className="text-slate-700 font-mono text-[11px]">
                              کدملی: {artist.nationalId || '—'}
                            </div>
                            <div className="text-slate-500 font-mono text-[10px] mt-0.5" dir="ltr">
                              {artist.shebaNumber ? `IR ${artist.shebaNumber}` : '—'}
                            </div>
                          </td>

                          {/* Card Number & Bank */}
                          <td className="py-4 px-3">
                            {artist.cardNumber ? (
                              <div>
                                <span className="font-mono font-bold text-slate-900 text-xs tracking-wider" dir="ltr">
                                  {artist.cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ')}
                                </span>
                                <div className="text-[10px] text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
                                  <span>🏦</span>
                                  <span>{artist.cardBankTitle || bankInfo?.title || 'عضو شبکه شتاب'}</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-rose-600 font-bold text-[11px]">
                                فاقد شماره کارت
                              </span>
                            )}
                          </td>

                          {/* Gateway Sync Status */}
                          <td className="py-4 px-3">
                            {artist.cardId ? (
                              <div>
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-mono font-bold inline-block">
                                  کارت ثبت‌شده: {artist.cardId.slice(0, 14)}...
                                </span>
                                {artist.syncedAt && (
                                  <div className="text-[10px] text-slate-500 mt-1">
                                    همگام‌سازی: {formatPersianDateTime(artist.syncedAt)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">
                                در انتظار تایید
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
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                              }`}
                            >
                              <span>{isActionLoading ? '⏳' : isApproved ? '✓' : '○'}</span>
                              <span>{isApproved ? 'هنرمند مستقل (واریز مستقیم)' : 'تایید و فعال‌سازی'}</span>
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
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-bold block mb-1">مجموع مبالغ پرداخت‌شده:</span>
              <span className="font-mono font-black text-lg text-emerald-700">
                {toPersianDigits(stats.totalPaidAmount.toLocaleString())} <span className="text-xs text-slate-500">تومان</span>
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-bold block mb-1">پرداخت‌های موفق (PAID):</span>
              <span className="font-mono font-black text-lg text-slate-900">
                {toPersianDigits(stats.paidCount)}
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-bold block mb-1">واریز مستقیم به هنرمند:</span>
              <span className="font-mono font-black text-lg text-teal-700">
                {toPersianDigits(stats.directArtistPaidCount)}
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-bold block mb-1">ناموفق / لغو شده:</span>
              <span className="font-mono font-black text-lg text-rose-600">
                {toPersianDigits(stats.failedCount)}
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>📋</span>
              <span>فهرست رویدادهای درگاه و پرداخت‌ها</span>
            </h3>

            <div className="flex items-center gap-2">
              {(['ALL', 'PAID', 'PENDING', 'FAILED'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setLogFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    logFilter === f
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f === 'ALL' ? 'همه' : f === 'PAID' ? 'موفق' : f === 'PENDING' ? 'در انتظار' : 'ناموفق'}
                </button>
              ))}
            </div>
          </div>

          {/* Logs Table */}
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl border border-slate-200">
              هیچ لاگ پرداختی با این فیلتر ثبت نشده است.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 bg-slate-50 font-bold">
                    <th className="py-3 px-3">سفارش / فاکتور</th>
                    <th className="py-3 px-3">مبلغ پرداختی</th>
                    <th className="py-3 px-3">مقصد واریز</th>
                    <th className="py-3 px-3">شناسه‌های درگاه</th>
                    <th className="py-3 px-3 text-center">وضعیت</th>
                    <th className="py-3 px-3">تاریخ و زمان</th>
                    <th className="py-3 px-3 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredLogs.map((log) => {
                    const isPaid = log.status === 'PAID';
                    const isPending = log.status === 'PENDING';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition">
                        
                        {/* Order & Invoice */}
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-900 text-xs font-mono">
                            {log.order?.orderNumber || log.orderId || 'سفارش مستقیم'}
                          </div>
                          {log.invoiceNumber && (
                            <div className="text-[10px] text-emerald-700 font-mono mt-0.5">
                              فاکتور: {log.invoiceNumber}
                            </div>
                          )}
                        </td>

                        {/* Amount & Offset */}
                        <td className="py-3.5 px-3">
                          <div className="font-mono font-bold text-slate-900 text-xs">
                            {toPersianDigits((log.payableAmount || log.amount).toLocaleString())} تومان
                          </div>
                          {!!log.offsetAmount && log.offsetAmount > 0 && (
                            <span className="text-[10px] text-amber-700 font-mono font-semibold">
                              (آفست: +{toPersianDigits(log.offsetAmount)} تومان)
                            </span>
                          )}
                        </td>

                        {/* Destination */}
                        <td className="py-3.5 px-3">
                          {log.isDirectArtist ? (
                            <span className="text-teal-700 font-bold text-[11px] flex items-center gap-1">
                              <span>🎨</span>
                              <span>کارت هنرمند مستقل</span>
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                              <span>🏛️</span>
                              <span>حساب پیش‌فرض ادمین</span>
                            </span>
                          )}
                          {log.cardNumber && (
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5" dir="ltr">
                              {log.cardNumber.slice(0, 4)} •••• •••• {log.cardNumber.slice(-4)}
                            </div>
                          )}
                        </td>

                        {/* Authority & Tracking */}
                        <td className="py-3.5 px-3">
                          {log.trackingCode && (
                            <div className="font-mono text-xs text-amber-800 font-bold">
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
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : isPending
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {isPaid ? '✓ پرداخت موفق' : isPending ? '⏳ در انتظار واریز' : '✕ ناموفق / منقضی'}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-3 text-slate-500 text-[11px]">
                          {formatPersianDateTime(log.paidAt || log.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-3 text-center">
                          {(log.authority || log.trackingCode) && (
                            <button
                              type="button"
                              disabled={inquiringId === (log.authority || log.trackingCode)}
                              onClick={() => handleInquireStatus(log.authority || log.trackingCode || '')}
                              className="text-[11px] text-slate-700 hover:text-emerald-700 bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-300 transition cursor-pointer shadow-sm"
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
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm max-w-2xl">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-2">
            <span>⚙️</span>
            <span>تنظیمات ارتباط با وب‌سرویس هنرهاب پی</span>
          </h3>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            کلید API اختصاصی خود را که از پنل پذیرندگان هنرهاب پی دریافت کرده‌اید وارد نمایید. این کلید در هدر تمام درخواست‌های تسویه و پرداخت ارسال خواهد شد.
          </p>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                کلید وب‌سرویس پذیرنده (x-api-key) *
              </label>
              <input
                type="text"
                dir="ltr"
                required
                value={settingsForm.apiKey}
                onChange={(e) => setSettingsForm({ ...settingsForm, apiKey: e.target.value.trim() })}
                placeholder="hp_5es13yul_mwc2x9qh"
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                آدرس ریشه وب‌سرویس (Base URL)
              </label>
              <input
                type="url"
                dir="ltr"
                required
                value={settingsForm.baseUrl}
                onChange={(e) => setSettingsForm({ ...settingsForm, baseUrl: e.target.value.trim() })}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
              />
            </div>

            {settingsMsg && (
              <div className={`text-xs font-bold p-3 rounded-xl border ${
                settingsMsg.isError
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                {settingsMsg.text}
              </div>
            )}

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={savingSettings}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {savingSettings ? 'در حال ذخیره‌سازی...' : 'ذخیره تنظیمات درگاه'}
              </button>

              <button
                type="button"
                onClick={() => handleTestConnection(settingsForm.apiKey)}
                disabled={testingConnection}
                className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                title="بررسی اعتبار کلید وب‌سرویس بدون ایجاد هرگونه تراکنش تستی"
              >
                <span>{testingConnection ? '⏳' : '🔑'}</span>
                <span>{testingConnection ? 'در حال بررسی...' : 'بررسی اعتبار کلید وب‌سرویس'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
