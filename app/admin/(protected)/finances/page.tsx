'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toPersianDigits, formatPersianDateTime } from '@/lib/date';
import { CommissionSettings } from '@/lib/commission';

interface SettlementRequest {
  id: string;
  amount: number;
  shebaNumber: string;
  status: 'PENDING' | 'PAID' | 'REJECTED';
  trackingCode: string | null;
  adminNote: string | null;
  paidAt: string | null;
  createdAt: string;
  artist: {
    id: string;
    brandName: string | null;
    shebaNumber: string | null;
    balance: number;
    user: {
      name: string | null;
      phoneNumber: string | null;
    };
  };
}

interface Metrics {
  totalOrdersGross: number;
  totalPlatformFeeRevenue: number;
  pendingSettlementsCount: number;
  pendingSettlementsAmount: number;
  completedSettlementsAmount: number;
}

export default function AdminFinancesPage() {
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'SETTLEMENTS' | 'COMMISSION_SETTINGS'>('SETTLEMENTS');
  const [metrics, setMetrics] = useState<Metrics>({
    totalOrdersGross: 0,
    totalPlatformFeeRevenue: 0,
    pendingSettlementsCount: 0,
    pendingSettlementsAmount: 0,
    completedSettlementsAmount: 0,
  });
  const [settlementRequests, setSettlementRequests] = useState<SettlementRequest[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'REJECTED'>('ALL');
  const [copiedShebaId, setCopiedShebaId] = useState<string | null>(null);

  // Commission Settings State
  const [commissionSettings, setCommissionSettings] = useState<CommissionSettings>({
    commissionBronzeRate: 5.0,
    commissionSilverRate: 3.0,
    commissionSilverMonthlySales: 10,
    commissionSilverYearlySales: 50,
    commissionGoldenRate: 1.0,
    commissionGoldenMonthlySales: 30,
    commissionGoldenYearlySales: 200,
    commissionIranZaminRate: 0.0,
    commissionIranZaminMonthlySales: 100,
    specialOfferLaunchActive: true,
    specialOfferLaunchDeadline: '1406/01/01',
    specialOfferLaunchTier: 'GOLDEN',
    specialOfferLaunchRate: 1.0,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState<string | null>(null);

  // Modal
  const [activeModal, setActiveModal] = useState<{
    type: 'APPROVE' | 'REJECT';
    settlement: SettlementRequest;
  } | null>(null);
  const [trackingCode, setTrackingCode] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFinances = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/finances', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.metrics) setMetrics(data.metrics);
        if (data.settlementRequests) setSettlementRequests(data.settlementRequests);
        if (data.commissionSettings) setCommissionSettings(data.commissionSettings);
      }
    } catch (err) {
      console.error('Failed to load admin finances:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFinances();
  }, [fetchFinances]);

  const handleCopySheba = (id: string, sheba: string) => {
    navigator.clipboard.writeText(`IR${sheba}`);
    setCopiedShebaId(id);
    setTimeout(() => setCopiedShebaId(null), 2000);
  };

  const handleProcessSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/admin/finances/settlements/${activeModal.settlement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: activeModal.type === 'APPROVE' ? 'PAID' : 'REJECTED',
          trackingCode: activeModal.type === 'APPROVE' ? trackingCode : undefined,
          adminNote: adminNote || (activeModal.type === 'APPROVE' ? 'واریز با حواله پایا انجام شد.' : 'درخواست رد شد.'),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || 'عملیات با موفقیت انجام شد.');
        setActiveModal(null);
        setTrackingCode('');
        setAdminNote('');
        fetchFinances();
      } else {
        alert(data.error || 'خطا در انجام عملیات');
      }
    } catch (err) {
      console.error('Process settlement error:', err);
      alert('خطا در برقراری ارتباط');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCommissionSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSuccessMsg(null);
    try {
      const res = await fetch('/api/admin/finances/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commissionSettings),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSettingsSuccessMsg('تنظیمات سطوح کارمزد و آفر ویژه با موفقیت ذخیره شد.');
        if (data.settings) setCommissionSettings(data.settings);
        setTimeout(() => setSettingsSuccessMsg(null), 5000);
      } else {
        alert(data.error || 'خطا در ذخیره تنظیمات');
      }
    } catch {
      alert('خطا در ارتباط با سرور');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const filteredRequests = settlementRequests.filter((r) => {
    if (filter === 'ALL') return true;
    return r.status === filter;
  });

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      PENDING: { label: 'در انتظار پرداخت پایا', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
      PAID: { label: 'تسویه و واریز شده', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      REJECTED: { label: 'رد شده (برگشت وجه)', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
    };
    return map[status] || { label: status, cls: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  return (
    <div className="space-y-6 font-sans text-slate-800" dir="rtl">
      {/* Top Header */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-3">
            <span>💰</span>
            <span>مدیریت مالی پلتفرم، تسویه‌حساب و سطوح کارمزد</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            بررسی درآمد کارمزد پلتفرم، بررسی درخواست‌های واریز پایا و تنظیم پارامتریک سطوح کارمزد هنرمندان
          </p>
        </div>

        <button
          onClick={fetchFinances}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-2xl border border-slate-200 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <span>🔄</span>
          <span>بروزرسانی اطلاعات</span>
        </button>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
          <div className="text-xs text-slate-500 font-bold mb-1">حجم کل فروش آثار (ناخالص)</div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {toPersianDigits(metrics.totalOrdersGross.toLocaleString())} <span className="text-xs font-sans text-slate-500">تومان</span>
          </div>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200 p-5 rounded-2xl shadow-xs">
          <div className="text-xs text-emerald-700 font-bold mb-1">درآمد پلتفرم از کارمزدها</div>
          <div className="text-2xl font-black text-emerald-800 font-mono">
            {toPersianDigits(metrics.totalPlatformFeeRevenue.toLocaleString())} <span className="text-xs font-sans text-slate-500">تومان</span>
          </div>
        </div>

        <div className="bg-amber-50/60 border border-amber-200 p-5 rounded-2xl shadow-xs">
          <div className="text-xs text-amber-800 font-bold mb-1 flex items-center justify-between">
            <span>در انتظار تسویه واریز پایا</span>
            {metrics.pendingSettlementsCount > 0 && (
              <span className="text-[10px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                {toPersianDigits(metrics.pendingSettlementsCount)} مورد
              </span>
            )}
          </div>
          <div className="text-2xl font-black text-amber-900 font-mono">
            {toPersianDigits(metrics.pendingSettlementsAmount.toLocaleString())} <span className="text-xs font-sans text-slate-500">تومان</span>
          </div>
        </div>

        <div className="bg-teal-50/60 border border-teal-200 p-5 rounded-2xl shadow-xs">
          <div className="text-xs text-teal-800 font-bold mb-1">کل تسویه‌های واریزشده تاکنون</div>
          <div className="text-2xl font-black text-teal-900 font-mono">
            {toPersianDigits(metrics.completedSettlementsAmount.toLocaleString())} <span className="text-xs font-sans text-slate-500">تومان</span>
          </div>
        </div>
      </div>

      {/* Main Section Tabs */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveSection('SETTLEMENTS')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeSection === 'SETTLEMENTS'
              ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs'
          }`}
        >
          <span>📋</span>
          <span>درخواست‌های تسویه‌حساب و حواله پایا</span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${activeSection === 'SETTLEMENTS' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
            {toPersianDigits(settlementRequests.length)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('COMMISSION_SETTINGS')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeSection === 'COMMISSION_SETTINGS'
              ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs'
          }`}
        >
          <span>⚙️</span>
          <span>تنظیمات سطوح کارمزد هنرمندان و آفر ویژه</span>
          <span className="text-[11px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-black border border-amber-200">
            ۴ سطح + آفر طلایی
          </span>
        </button>
      </div>

      {/* SECTION 1: SETTLEMENTS */}
      {activeSection === 'SETTLEMENTS' && (
        <div className="space-y-4">
          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
            {[
              { key: 'ALL', label: `همه درخواست‌ها (${toPersianDigits(settlementRequests.length)})` },
              { key: 'PENDING', label: `در انتظار واریز (${toPersianDigits(metrics.pendingSettlementsCount)})` },
              { key: 'PAID', label: 'واریز شده' },
              { key: 'REJECTED', label: 'رد شده' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filter === t.key
                    ? 'bg-teal-700 text-white shadow-md'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Settlements Table */}
          <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
            {loading ? (
              <div className="p-12 text-center text-slate-400 font-bold">در حال بارگذاری درخواست‌های تسویه...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                هیچ درخواستی در این وضعیت ثبت نشده است.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-4">هنرمند و حساب</th>
                      <th className="p-4">شماره شبا مقصد</th>
                      <th className="p-4">مبلغ درخواستی</th>
                      <th className="p-4">وضعیت</th>
                      <th className="p-4">کد رهگیری / توضیحات</th>
                      <th className="p-4">تاریخ درخواست</th>
                      <th className="p-4 text-center">عملیات مالی</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRequests.map((req) => {
                      const status = getStatusBadge(req.status);
                      const artistName = req.artist?.brandName || req.artist?.user?.name || 'هنرمند';
                      const artistPhone = req.artist?.user?.phoneNumber || '—';

                      return (
                        <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-slate-900">{artistName}</div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5" dir="ltr">
                              {toPersianDigits(artistPhone)}
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-slate-800 font-bold text-xs" dir="ltr">
                                IR{req.shebaNumber}
                              </span>
                              <button
                                onClick={() => handleCopySheba(req.id, req.shebaNumber)}
                                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-lg border border-slate-200 transition cursor-pointer"
                              >
                                {copiedShebaId === req.id ? 'کپی شد ✓' : 'کپی'}
                              </button>
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="font-black text-emerald-700 text-sm font-mono">
                              {toPersianDigits(req.amount.toLocaleString())}
                            </span>
                            <span className="text-[10px] text-slate-500 mr-1">تومان</span>
                          </td>

                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${status.cls}`}>
                              {status.label}
                            </span>
                          </td>

                          <td className="p-4 text-slate-700">
                            {req.trackingCode ? (
                              <div className="font-mono text-teal-800 font-bold">{req.trackingCode}</div>
                            ) : req.adminNote ? (
                              <div className="text-slate-500 text-[11px]">{req.adminNote}</div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          <td className="p-4 text-slate-500 text-[11px] font-mono">
                            {formatPersianDateTime(req.createdAt)}
                          </td>

                          <td className="p-4 text-center">
                            {req.status === 'PENDING' ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setActiveModal({ type: 'APPROVE', settlement: req })}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl transition text-[11px] cursor-pointer shadow-xs"
                                >
                                  ثبت واریز پایا
                                </button>
                                <button
                                  onClick={() => setActiveModal({ type: 'REJECT', settlement: req })}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-3 py-1.5 rounded-xl transition text-[11px] cursor-pointer"
                                >
                                  رد درخواست
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">اقدام شده</span>
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
        </div>
      )}

      {/* SECTION 2: COMMISSION SETTINGS */}
      {activeSection === 'COMMISSION_SETTINGS' && (
        <form onSubmit={handleSaveCommissionSettings} className="space-y-6">
          {settingsSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs">
              <span>✓</span>
              <span>{settingsSuccessMsg}</span>
            </div>
          )}

          {/* Guide Banner */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl space-y-2 shadow-xs">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span>👑</span>
              <span>راهنمای سطوح هوشمند کارمزد پلتفرم هنرهاب بر اساس عملکرد هنرمندان</span>
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              تمامی مقادیر زیر به صورت پویا (پارامتریک) قابل تغییر هستند. سیستم با تکیه بر تقویم شمسی به صورت خودکار تعداد فروش‌های موفق (پرداخت شده) هر هنرمند را در ماه جاری و سال جاری رصد کرده و کارمزد را بر اساس بالاترین حدنصاب محقق‌شده اعمال می‌کند.
            </p>
          </div>

          {/* The 4 Tiers Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Bronze Tier */}
            <div className="bg-white border border-amber-200 rounded-3xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl font-black">
                    🥉
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">سطح ۱: هنرمند برنزی</h3>
                    <p className="text-[11px] text-slate-500">سطح پیش‌فرض هنگام ثبت‌نام و ورود هنرمند</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                  سطح پایه
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  درصد کارمزد خدمات پلتفرم:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={commissionSettings.commissionBronzeRate}
                    onChange={(e) =>
                      setCommissionSettings({
                        ...commissionSettings,
                        commissionBronzeRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-slate-900 outline-none focus:border-teal-600 focus:bg-white text-left"
                    required
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">٪</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">پیش‌فرض: ۵ درصد</p>
              </div>
            </div>

            {/* 2. Silver Tier */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center text-xl font-black">
                    🥈
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">سطح ۲: هنرمند نقره‌ای</h3>
                    <p className="text-[11px] text-slate-500">ارتقا با فروش ۱۰ عدد در ماه یا ۵۰ عدد در سال</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                  فروش فعال
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                    درصد کارمزد:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={commissionSettings.commissionSilverRate}
                      onChange={(e) =>
                        setCommissionSettings({
                          ...commissionSettings,
                          commissionSilverRate: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-teal-600 focus:bg-white text-left"
                      required
                    />
                    <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">٪</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">پیش‌فرض: ۳٪</p>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                    فروش ماه شمسی:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={commissionSettings.commissionSilverMonthlySales}
                    onChange={(e) =>
                      setCommissionSettings({
                        ...commissionSettings,
                        commissionSilverMonthlySales: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-teal-600 focus:bg-white text-center"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">پیش‌فرض: ۱۰ عدد</p>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                    یا فروش سال شمسی:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={commissionSettings.commissionSilverYearlySales}
                    onChange={(e) =>
                      setCommissionSettings({
                        ...commissionSettings,
                        commissionSilverYearlySales: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-teal-600 focus:bg-white text-center"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">پیش‌فرض: ۵۰ عدد</p>
                </div>
              </div>
            </div>

            {/* 3. Golden Tier */}
            <div className="bg-white border border-yellow-300 rounded-3xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-yellow-100 text-yellow-800 flex items-center justify-center text-xl font-black">
                    🥇
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">سطح ۳: هنرمند طلایی</h3>
                    <p className="text-[11px] text-slate-500">ارتقا با فروش ۳۰ عدد در ماه یا ۲۰۰ عدد در سال</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-xl bg-yellow-50 text-yellow-800 border border-yellow-200">
                  پرفروش و برتر
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                    درصد کارمزد:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={commissionSettings.commissionGoldenRate}
                      onChange={(e) =>
                        setCommissionSettings({
                          ...commissionSettings,
                          commissionGoldenRate: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-teal-600 focus:bg-white text-left"
                      required
                    />
                    <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">٪</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">پیش‌فرض: ۱٪</p>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                    فروش ماه شمسی:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={commissionSettings.commissionGoldenMonthlySales}
                    onChange={(e) =>
                      setCommissionSettings({
                        ...commissionSettings,
                        commissionGoldenMonthlySales: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-teal-600 focus:bg-white text-center"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">پیش‌فرض: ۳۰ عدد</p>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                    یا فروش سال شمسی:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={commissionSettings.commissionGoldenYearlySales}
                    onChange={(e) =>
                      setCommissionSettings({
                        ...commissionSettings,
                        commissionGoldenYearlySales: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-teal-600 focus:bg-white text-center"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">پیش‌فرض: ۲۰۰ عدد</p>
                </div>
              </div>
            </div>

            {/* 4. Iran Zamin Tier */}
            <div className="bg-white border border-emerald-300 rounded-3xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl font-black">
                    👑
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">سطح ۴: هنرمند ایران زمین</h3>
                    <p className="text-[11px] text-slate-500">ارتقا با ۱۰۰ فروش موفق در ۱ ماه شمسی (مدت ۱ ماه)</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                  کارمزد صفر
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                    درصد کارمزد پلتفرم:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={commissionSettings.commissionIranZaminRate}
                      onChange={(e) =>
                        setCommissionSettings({
                          ...commissionSettings,
                          commissionIranZaminRate: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-teal-600 focus:bg-white text-left"
                      required
                    />
                    <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">٪</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">پیش‌فرض: ۰٪ (بدون کارمزد)</p>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                    حداقل فروش در ۱ ماه شمسی:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={commissionSettings.commissionIranZaminMonthlySales}
                    onChange={(e) =>
                      setCommissionSettings({
                        ...commissionSettings,
                        commissionIranZaminMonthlySales: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-teal-600 focus:bg-white text-center"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">پیش‌فرض: ۱۰۰ عدد فروش در ماه</p>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Special Launch Offer */}
          <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border border-amber-300 rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-amber-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl font-black shadow-inner">
                  🎉
                </div>
                <div>
                  <h3 className="font-black text-base text-amber-950">
                    آفر ویژه عضویت هنرهاب (هدیه عضویت تا اول فروردین ۱۴۰۶)
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    کلیه هنرمندانی که تا ۱ فروردین ۱۴۰۶ عضو هنرهاب شوند، مستقیماً هنرمند طلایی با کارمزد ۱٪ محسوب می‌شوند.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={commissionSettings.specialOfferLaunchActive}
                  onChange={(e) =>
                    setCommissionSettings({
                      ...commissionSettings,
                      specialOfferLaunchActive: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-700"></div>
                <span className="mr-3 text-xs font-bold text-slate-800">
                  {commissionSettings.specialOfferLaunchActive ? 'فعال' : 'غیرفعال'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  تاریخ پایان اعتبار آفر (شمسی):
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={commissionSettings.specialOfferLaunchDeadline}
                  onChange={(e) =>
                    setCommissionSettings({
                      ...commissionSettings,
                      specialOfferLaunchDeadline: e.target.value,
                    })
                  }
                  placeholder="1406/01/01"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-center text-amber-900 font-black outline-none focus:border-amber-500"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">فرمت استاندارد: YYYY/MM/DD</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  سطح اعطایی به هنرمندان عضو:
                </label>
                <select
                  value={commissionSettings.specialOfferLaunchTier}
                  onChange={(e) =>
                    setCommissionSettings({
                      ...commissionSettings,
                      specialOfferLaunchTier: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-amber-500"
                >
                  <option value="GOLDEN">هنرمند طلایی (پیش‌فرض)</option>
                  <option value="SILVER">هنرمند نقره‌ای</option>
                  <option value="IRAN_ZAMIN">هنرمند ایران زمین</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">سطحی که به عضو جدید اعطا می‌شود</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  درصد کارمزد تشویقی آفر:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={commissionSettings.specialOfferLaunchRate}
                    onChange={(e) =>
                      setCommissionSettings({
                        ...commissionSettings,
                        specialOfferLaunchRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 outline-none focus:border-amber-500 text-left"
                    required
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">٪</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">پیش‌فرض: ۱٪</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="bg-teal-700 hover:bg-teal-800 text-white font-black text-xs sm:text-sm px-8 py-3.5 rounded-2xl transition shadow-md shadow-teal-700/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isSavingSettings ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>در حال ذخیره...</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>ذخیره کلیه تنظیمات کارمزد و آفر ویژه</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Modal: Process Settlement */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <span>{activeModal.type === 'APPROVE' ? '💳' : '❌'}</span>
                <span>
                  {activeModal.type === 'APPROVE' ? 'ثبت واریز حواله پایا' : 'رد درخواست تسویه حساب'}
                </span>
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-700 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">هنرمند:</span>
                <span className="font-bold text-slate-900">
                  {activeModal.settlement.artist?.brandName || activeModal.settlement.artist?.user?.name || 'هنرمند'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">مبلغ واریزی:</span>
                <span className="font-mono font-black text-emerald-700">
                  {toPersianDigits(activeModal.settlement.amount.toLocaleString())} تومان
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">شماره شبا مقصد:</span>
                <span className="font-mono font-bold text-slate-900" dir="ltr">
                  IR{activeModal.settlement.shebaNumber}
                </span>
              </div>
            </div>

            <form onSubmit={handleProcessSettlement} className="space-y-4">
              {activeModal.type === 'APPROVE' ? (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    کد پیگیری حواله پایا / بانکی:
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    placeholder="مثال: PAYA-981240182"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-center text-slate-900 outline-none focus:border-teal-600 focus:bg-white font-bold"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    علت رد درخواست (جهت اطلاع هنرمند و استرداد موجودی):
                  </label>
                  <textarea
                    rows={3}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="علت رد درخواست را بنویسید (مثلاً شماره شبا مسدود است)..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-teal-600 focus:bg-white"
                    required
                  />
                  <p className="text-[11px] text-amber-700 mt-1">
                    توجه: با رد درخواست، مبلغ به طور خودکار به کیف‌پول هنرمند استرداد داده می‌شود.
                  </p>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 font-bold text-xs py-3 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-sm ${
                    activeModal.type === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  {isSubmitting ? 'در حال ثبت...' : activeModal.type === 'APPROVE' ? 'تایید و ثبت واریز' : 'رد درخواست و بازگشت وجه'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-3 rounded-xl transition-colors cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
