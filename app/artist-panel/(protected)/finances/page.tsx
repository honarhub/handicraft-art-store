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
}

interface Transaction {
  id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  status: string;
  referenceId: string | null;
  description: string | null;
  createdAt: string;
}

export default function ArtistFinancesPage() {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [commissionRate, setCommissionRate] = useState(10);
  const [shebaNumber, setShebaNumber] = useState('');
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalPaidOut, setTotalPaidOut] = useState(0);
  const [settlementRequests, setSettlementRequests] = useState<SettlementRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'settlements' | 'transactions'>('settlements');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [modalSheba, setModalSheba] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFinances = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/artist/settlements', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance || 0);
        setCommissionRate(data.commissionRate ?? 10);
        setShebaNumber(data.shebaNumber || '');
        setModalSheba(data.shebaNumber || '');
        setTotalEarnings(data.totalEarnings || 0);
        setTotalPaidOut(data.totalPaidOut || 0);
        setSettlementRequests(data.settlementRequests || []);
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to load finances:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFinances();
  }, [fetchFinances]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(requestAmount);
    if (!num || num < 50000) {
      alert('حداقل مبلغ تسویه‌حساب ۵۰٬۰۰۰ تومان است.');
      return;
    }
    if (num > balance) {
      alert('مبلغ درخواستی نمی‌تواند بیشتر از موجودی کیف‌پول باشد.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/artist/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: num,
          shebaNumber: modalSheba,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || 'درخواست تسویه با موفقیت ثبت شد.');
        setIsModalOpen(false);
        setRequestAmount('');
        fetchFinances();
      } else {
        alert(data.error || 'خطا در ثبت درخواست');
      }
    } catch (err) {
      console.error('Settlement submit error:', err);
      alert('خطا در برقراری ارتباط');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSettlementBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      PENDING: { label: 'در انتظار واریز پایا', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
      PAID: { label: 'واریز شده به حساب', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
      REJECTED: { label: 'رد شده (برگشت به کیف‌پول)', cls: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
    };
    return map[status] || { label: status, cls: 'bg-slate-700 text-slate-300 border-slate-600' };
  };

  return (
    <div className="space-y-6 font-sans" dir="rtl">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
            <span>💰</span>
            <span>امور مالی، درآمد و تسویه‌حساب</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            مشاهده موجودی کیف‌پول، درآمد حاصل از فروش آثار و ثبت درخواست واریز به حساب بانکی
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          disabled={balance < 50000}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-md shadow-emerald-900/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>💳</span>
          <span>درخواست تسویه‌حساب جدید</span>
        </button>
      </div>

      {/* 4 Financial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Wallet Balance */}
        <div className="bg-linear-to-br from-emerald-950/60 to-slate-900 border border-emerald-800/40 p-5 rounded-2xl">
          <div className="text-xs text-emerald-400 font-bold mb-1 flex items-center justify-between">
            <span>موجودی کیف‌پول (قابل تسویه)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {toPersianDigits(balance.toLocaleString())} <span className="text-xs text-slate-400 font-sans">تومان</span>
          </div>
        </div>

        {/* Total Sales Earnings */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="text-xs text-slate-400 font-bold mb-1">کل عایدی ناخالص از فروش آثار</div>
          <div className="text-2xl font-black text-white font-mono">
            {toPersianDigits(totalEarnings.toLocaleString())} <span className="text-xs text-slate-400 font-sans">تومان</span>
          </div>
        </div>

        {/* Total Paid Out */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="text-xs text-slate-400 font-bold mb-1">مجموع مبالغ واریز شده به حساب شما</div>
          <div className="text-2xl font-black text-teal-400 font-mono">
            {toPersianDigits(totalPaidOut.toLocaleString())} <span className="text-xs text-slate-400 font-sans">تومان</span>
          </div>
        </div>

        {/* Commission Rate */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="text-xs text-slate-400 font-bold mb-1">کارمزد خدمات پلتفرم هنرهاب</div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {toPersianDigits(commissionRate)}٪
          </div>
        </div>
      </div>

      {/* Sheba Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg">
            🏦
          </div>
          <div>
            <div className="text-slate-400">شماره شبا بانکی ثبت‌شده جهت دریافت حواله پایا:</div>
            <div className="font-mono font-bold text-sm text-amber-300 mt-0.5 tracking-wider" dir="ltr">
              {shebaNumber ? `IR ${shebaNumber}` : 'ثبت نشده (لطفاً شماره شبا را در درخواست وارد کنید)'}
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="text-teal-400 hover:text-teal-300 font-bold underline cursor-pointer"
        >
          تغییر یا ثبت شماره شبا
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('settlements')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'settlements'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          درخواست‌های تسویه‌حساب ({toPersianDigits(settlementRequests.length)})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'transactions'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          ریز تراکنش‌های مالی و واریزها ({toPersianDigits(transactions.length)})
        </button>
      </div>

      {/* Tab 1: Settlements */}
      {activeTab === 'settlements' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          {settlementRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold pb-3">
                    <th className="py-3 px-3">ردیف</th>
                    <th className="py-3 px-3">مبلغ تسویه (تومان)</th>
                    <th className="py-3 px-3">شماره شبا مقصد</th>
                    <th className="py-3 px-3">وضعیت واریز</th>
                    <th className="py-3 px-3">شماره پیگیری پایا</th>
                    <th className="py-3 px-3">تاریخ درخواست</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {settlementRequests.map((req, idx) => {
                    const badge = getSettlementBadge(req.status);
                    return (
                      <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-500">{toPersianDigits(idx + 1)}</td>
                        <td className="py-3 px-3 font-mono font-black text-sm text-white">
                          {toPersianDigits(req.amount.toLocaleString())}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300" dir="ltr">
                          IR{req.shebaNumber}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2.5 py-1 rounded-lg border text-[11px] font-bold ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-amber-300">
                          {req.trackingCode || req.adminNote || '—'}
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          {formatPersianDateTime(req.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 space-y-2">
              <div className="text-3xl">💳</div>
              <p className="text-xs text-slate-400">تاکنون هیچ درخواست تسویه‌حسابی ثبت نکرده‌اید.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Transactions */}
      {activeTab === 'transactions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold pb-3">
                    <th className="py-3 px-3">نوع تراکنش</th>
                    <th className="py-3 px-3">مبلغ (تومان)</th>
                    <th className="py-3 px-3">شرح رویداد مالی</th>
                    <th className="py-3 px-3">شماره مرجع / پیگیری</th>
                    <th className="py-3 px-3">تاریخ و زمان</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {transactions.map((tx) => {
                    const isCredit = tx.type === 'CREDIT';
                    return (
                      <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-bold">
                          {isCredit ? (
                            <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                              + واریز بابت فروش
                            </span>
                          ) : (
                            <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                              - برداشت تسویه‌حساب
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono font-black text-sm">
                          <span className={isCredit ? 'text-emerald-400' : 'text-rose-400'}>
                            {isCredit ? '+' : '-'}{toPersianDigits(tx.amount.toLocaleString())}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300 leading-relaxed max-w-xs">
                          {tx.description || 'تراکنش مالی'}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-400">
                          {tx.referenceId || '—'}
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          {formatPersianDateTime(tx.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 space-y-2">
              <div className="text-3xl">📜</div>
              <p className="text-xs text-slate-400">هنوز هیچ تراکنش مالی در حساب شما ثبت نشده است.</p>
            </div>
          )}
        </div>
      )}

      {/* Settlement Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-black text-base text-white">درخواست تسویه‌حساب جدید</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  مبلغ درخواستی (تومان) <span className="text-red-400">*</span>:
                </label>
                <input
                  type="text"
                  dir="ltr"
                  inputMode="numeric"
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(e.target.value.replace(/\D/g, ''))}
                  placeholder="مثلاً: 250000"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-base font-mono text-center text-white outline-none focus:border-teal-500 font-bold"
                  required
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setRequestAmount(String(Math.floor(balance * 0.5)))}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold py-1.5 rounded-lg border border-slate-700"
                  >
                    ۵۰٪ موجودی
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestAmount(String(balance))}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold py-1.5 rounded-lg border border-slate-700"
                  >
                    کل موجودی ({toPersianDigits(balance.toLocaleString())})
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  شماره شبا بانکی بدون IR (۲۴ رقم) <span className="text-red-400">*</span>:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={24}
                    value={modalSheba}
                    onChange={(e) => setModalSheba(e.target.value.replace(/\D/g, ''))}
                    placeholder="580170000000108291048201"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-center text-amber-300 outline-none focus:border-teal-500 font-bold"
                    required
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">IR</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  واریز مبالغ تسویه از طریق حواله پایا بانک مرکزی در اولین چرخه کاری انجام خواهد شد.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'در حال ثبت درخواست...' : 'تایید و ثبت نهایی درخواست'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
