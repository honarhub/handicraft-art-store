'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toPersianDigits, formatPersianDateTime } from '@/lib/date';

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

  const filteredRequests = settlementRequests.filter((r) => {
    if (filter === 'ALL') return true;
    return r.status === filter;
  });

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      PENDING: { label: 'در انتظار پرداخت پایا', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
      PAID: { label: 'تسویه و واریز شده', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
      REJECTED: { label: 'رد شده (برگشت وجه)', cls: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
    };
    return map[status] || { label: status, cls: 'bg-slate-700 text-slate-300 border-slate-600' };
  };

  return (
    <div className="space-y-6 font-sans" dir="rtl">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <span>💰</span>
            <span>مدیریت مالی پلتفرم و تسویه‌حساب هنرمندان</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            بررسی درآمد کارمزد پلتفرم، بررسی درخواست‌های واریز پایا و تسویه حساب با صاحبان آثار
          </p>
        </div>

        <button
          onClick={fetchFinances}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
        >
          <span>🔄</span>
          <span>بروزرسانی اطلاعات</span>
        </button>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="text-xs text-slate-400 font-bold mb-1">حجم کل فروش آثار (ناخالص)</div>
          <div className="text-2xl font-black text-white font-mono">
            {toPersianDigits(metrics.totalOrdersGross.toLocaleString())} <span className="text-xs font-sans text-slate-400">تومان</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-emerald-900/40 p-5 rounded-2xl">
          <div className="text-xs text-emerald-400 font-bold mb-1">درآمد پلتفرم از کارمزدها</div>
          <div className="text-2xl font-black text-emerald-300 font-mono">
            {toPersianDigits(metrics.totalPlatformFeeRevenue.toLocaleString())} <span className="text-xs font-sans text-slate-400">تومان</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-amber-900/40 p-5 rounded-2xl">
          <div className="text-xs text-amber-400 font-bold mb-1 flex items-center justify-between">
            <span>در انتظار تسویه واریز پایا</span>
            {metrics.pendingSettlementsCount > 0 && (
              <span className="text-[10px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                {toPersianDigits(metrics.pendingSettlementsCount)} مورد
              </span>
            )}
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            {toPersianDigits(metrics.pendingSettlementsAmount.toLocaleString())} <span className="text-xs font-sans text-slate-400">تومان</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="text-xs text-slate-400 font-bold mb-1">کل تسویه‌های واریزشده تاکنون</div>
          <div className="text-2xl font-black text-teal-300 font-mono">
            {toPersianDigits(metrics.completedSettlementsAmount.toLocaleString())} <span className="text-xs font-sans text-slate-400">تومان</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
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
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Settlements Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-bold">در حال بارگذاری درخواست‌های تسویه...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            هیچ درخواستی در این وضعیت ثبت نشده است.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-800/80 text-slate-400 font-bold border-b border-slate-800">
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
              <tbody className="divide-y divide-slate-800/60">
                {filteredRequests.map((req) => {
                  const status = getStatusBadge(req.status);
                  const artistName = req.artist?.brandName || req.artist?.user?.name || 'هنرمند';
                  const artistPhone = req.artist?.user?.phoneNumber || '—';

                  return (
                    <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white">{artistName}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5" dir="ltr">
                          {toPersianDigits(artistPhone)}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-amber-300 font-bold tracking-wider" dir="ltr">
                            IR{req.shebaNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopySheba(req.id, req.shebaNumber)}
                            title="کپی شماره شبا"
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-[10px] cursor-pointer"
                          >
                            {copiedShebaId === req.id ? 'کپی شد ✓' : 'کپی'}
                          </button>
                        </div>
                      </td>

                      <td className="p-4 font-mono font-black text-sm text-emerald-400">
                        {toPersianDigits(req.amount.toLocaleString())} تومان
                      </td>

                      <td className="p-4">
                        <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${status.cls}`}>
                          {status.label}
                        </span>
                      </td>

                      <td className="p-4 text-slate-300 font-mono">
                        {req.trackingCode || req.adminNote || '—'}
                      </td>

                      <td className="p-4 text-slate-400 text-[11px]">
                        {formatPersianDateTime(req.createdAt)}
                      </td>

                      <td className="p-4 text-center">
                        {req.status === 'PENDING' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveModal({ type: 'APPROVE', settlement: req });
                                setTrackingCode('');
                                setAdminNote('');
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              ✓ تایید واریز
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveModal({ type: 'REJECT', settlement: req });
                                setAdminNote('');
                              }}
                              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              ✕ رد
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">نهایی شده</span>
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

      {/* Modal for Approve / Reject */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-black text-base text-white">
                {activeModal.type === 'APPROVE' ? 'تایید حواله و پرداخت پایا' : 'رد درخواست تسویه‌حساب'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-xl text-xs space-y-1">
              <div><span className="text-slate-400">مبلغ تسویه: </span><span className="font-mono font-bold text-emerald-400">{toPersianDigits(activeModal.settlement.amount.toLocaleString())} تومان</span></div>
              <div><span className="text-slate-400">شماره شبا: </span><span className="font-mono text-amber-300 font-bold" dir="ltr">IR{activeModal.settlement.shebaNumber}</span></div>
            </div>

            <form onSubmit={handleProcessSettlement} className="space-y-4">
              {activeModal.type === 'APPROVE' ? (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    شماره پیگیری یا مرجع حواله پایا:
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    placeholder="مثال: PAYA-981240182"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-center text-white outline-none focus:border-teal-500 font-bold"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    علت رد درخواست (جهت اطلاع هنرمند و استرداد موجودی):
                  </label>
                  <textarea
                    rows={3}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="علت رد درخواست را بنویسید (مثلاً شماره شبا مسدود است)..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-teal-500"
                    required
                  />
                  <p className="text-[11px] text-amber-400 mt-1">
                    توجه: با رد درخواست، مبلغ به طور خودکار به کیف‌پول هنرمند استرداد داده می‌شود.
                  </p>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 font-bold text-xs py-3 rounded-xl transition-colors disabled:opacity-50 cursor-pointer ${
                    activeModal.type === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                >
                  {isSubmitting ? 'در حال ثبت...' : activeModal.type === 'APPROVE' ? 'تایید و ثبت واریز' : 'رد درخواست و بازگشت وجه'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-4 py-3 rounded-xl transition-colors cursor-pointer"
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
