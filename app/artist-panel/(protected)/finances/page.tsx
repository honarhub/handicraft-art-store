'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toPersianDigits, formatPersianDateTime } from '@/lib/date';
import { ArtistTierCalculation, CommissionSettings } from '@/lib/commission';

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
  const [commissionRate, setCommissionRate] = useState(5.0);
  const [commissionTier, setCommissionTier] = useState('BRONZE');
  const [tierInfo, setTierInfo] = useState<ArtistTierCalculation | null>(null);
  const [commissionSettings, setCommissionSettings] = useState<CommissionSettings | null>(null);
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
        setCommissionRate(data.commissionRate ?? 5.0);
        setCommissionTier(data.commissionTier || 'BRONZE');
        if (data.tierInfo) setTierInfo(data.tierInfo);
        if (data.commissionSettings) setCommissionSettings(data.commissionSettings);
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
      console.error('Submit settlement error:', err);
      alert('خطا در برقراری ارتباط');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      PENDING: { label: 'در انتظار پرداخت پایا', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
      PAID: { label: 'واریز شده', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      REJECTED: { label: 'رد شده (برگشت به موجودی)', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
    };
    return map[status] || { label: status, cls: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  const tierBadgeInfo: Record<string, { icon: string; name: string; cls: string; borderCls: string }> = {
    BRONZE: {
      icon: '🥉',
      name: 'هنرمند برنزی',
      cls: 'bg-amber-50 text-amber-800 border-amber-200',
      borderCls: 'border-amber-200',
    },
    SILVER: {
      icon: '🥈',
      name: 'هنرمند نقره‌ای',
      cls: 'bg-slate-100 text-slate-700 border-slate-200',
      borderCls: 'border-slate-200',
    },
    GOLDEN: {
      icon: '🥇',
      name: 'هنرمند طلایی',
      cls: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      borderCls: 'border-yellow-200',
    },
    IRAN_ZAMIN: {
      icon: '👑',
      name: 'هنرمند ایران زمین',
      cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      borderCls: 'border-emerald-200',
    },
  };

  const currentBadge = tierBadgeInfo[commissionTier] || tierBadgeInfo.BRONZE;

  return (
    <div className="space-y-6 font-sans text-slate-800" dir="rtl">
      {/* Top Header */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-3">
            <span>💰</span>
            <span>امور مالی، تسویه‌حساب و سطح کارمزد شما</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            مشاهده موجودی کیف‌پول، درخواست حواله پایا، رصد سطح فروش و ارتقای خودکار کارمزد در پلتفرم هنرهاب
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          disabled={balance < 50000}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-6 py-3 rounded-2xl transition-all shadow-md shadow-emerald-700/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
        >
          <span>💳</span>
          <span>درخواست تسویه‌حساب (حواله پایا)</span>
        </button>
      </div>

      {/* Special Launch Offer Banner */}
      {tierInfo?.isSpecialOfferApplied && (
        <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border border-amber-300 p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl font-black shrink-0 shadow-inner">
              🎉
            </div>
            <div>
              <div className="font-black text-sm text-amber-950">
                هدیه عضویت در دوره راه‌اندازی هنرهاب (آفر ویژه تا اول فروردین ۱۴۰۶)
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                شما به عنوان عضو ویژه دوره راه‌اندازی، مستقیماً در سطح <strong className="text-amber-900 font-black">هنرمند طلایی</strong> قرار گرفته‌اید و کارمزد کلیه فروش‌های شما به جای ۵٪ تنها <strong className="text-amber-900 font-black">۱٪</strong> محاسبه می‌شود!
              </p>
            </div>
          </div>
          <span className="text-[11px] font-black px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
            کارمزد ۱٪ ویژه
          </span>
        </div>
      )}

      {/* 4 Financial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Wallet Balance */}
        <div className="bg-emerald-50/60 border border-emerald-200 p-5 rounded-2xl shadow-xs">
          <div className="text-xs text-emerald-800 font-bold mb-1 flex items-center justify-between">
            <span>موجودی کیف‌پول (قابل تسویه)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="text-2xl font-black text-emerald-900 font-mono">
            {toPersianDigits(balance.toLocaleString())} <span className="text-xs text-emerald-700 font-sans">تومان</span>
          </div>
        </div>

        {/* Total Sales Earnings */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
          <div className="text-xs text-slate-500 font-bold mb-1">کل عایدی ناخالص از فروش آثار</div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {toPersianDigits(totalEarnings.toLocaleString())} <span className="text-xs text-slate-400 font-sans">تومان</span>
          </div>
        </div>

        {/* Total Paid Out */}
        <div className="bg-teal-50/60 border border-teal-200 p-5 rounded-2xl shadow-xs">
          <div className="text-xs text-teal-800 font-bold mb-1">مجموع مبالغ تسویه‌شده به حساب شما</div>
          <div className="text-2xl font-black text-teal-900 font-mono">
            {toPersianDigits(totalPaidOut.toLocaleString())} <span className="text-xs text-teal-700 font-sans">تومان</span>
          </div>
        </div>

        {/* Current Commission Tier */}
        <div className={`bg-white border ${currentBadge.borderCls} p-5 rounded-2xl shadow-xs`}>
          <div className="text-xs text-slate-500 font-bold mb-1 flex items-center justify-between">
            <span>سطح فعلی و کارمزد پلتفرم</span>
            <span className="text-sm">{currentBadge.icon}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700 font-mono">
              {toPersianDigits(commissionRate)}٪
            </span>
            <span className="text-xs font-bold text-slate-700">({currentBadge.name})</span>
          </div>
        </div>
      </div>

      {/* Real-time Sales Performance & Upgrade Card */}
      {tierInfo && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>📊</span>
                <span>عملکرد فروش در تقویم شمسی و پیشرفت ارتقای سطح</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                معیار ارزیابی، فروش‌های موفق در ۱ ماه شمسی جاری و ۱ سال شمسی جاری است.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-black px-3.5 py-1.5 rounded-xl border flex items-center gap-1.5 ${currentBadge.cls}`}>
                <span>{currentBadge.icon}</span>
                <span>{currentBadge.name}</span>
                <span>(کارمزد {toPersianDigits(tierInfo.commissionRate)}٪)</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
              <div className="text-xs text-slate-500 mb-1 flex items-center justify-between">
                <span>فروش موفق در ماه جاری ({tierInfo.currentPersianMonthName} {toPersianDigits(tierInfo.currentPersianYear)}):</span>
                <span className="text-xs font-bold text-teal-700">۱ ماه شمسی</span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {toPersianDigits(tierInfo.monthlySalesCount)} <span className="text-xs font-sans text-slate-500">اثر موفق</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
              <div className="text-xs text-slate-500 mb-1 flex items-center justify-between">
                <span>فروش موفق در سال جاری (سال {toPersianDigits(tierInfo.currentPersianYear)}):</span>
                <span className="text-xs font-bold text-teal-700">۱ سال شمسی</span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {toPersianDigits(tierInfo.yearlySalesCount)} <span className="text-xs font-sans text-slate-500">اثر موفق</span>
              </div>
            </div>
          </div>

          {/* Next Tier Roadmap Message */}
          {tierInfo.nextTier ? (
            <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="font-bold text-amber-900 flex items-center gap-2">
                  <span>🚀</span>
                  <span>گام بعدی: ارتقا به {tierInfo.nextTier.tierNameFa}</span>
                </div>
                <div className="text-slate-700">
                  {tierInfo.nextTier.remainingYearly !== undefined ? (
                    <>
                      با ثبت <strong className="text-slate-900 font-bold">{toPersianDigits(tierInfo.nextTier.remainingMonthly)}</strong> فروش دیگر در ماه جاری یا <strong className="text-slate-900 font-bold">{toPersianDigits(tierInfo.nextTier.remainingYearly)}</strong> فروش در سال جاری، سطح شما به صورت خودکار ارتقا خواهد یافت.
                    </>
                  ) : (
                    <>
                      با ثبت <strong className="text-slate-900 font-bold">{toPersianDigits(tierInfo.nextTier.remainingMonthly)}</strong> فروش دیگر در ماه جاری، به سطح افتخاری ایران زمین (کارمزد صفر) ارتقا می‌یابید.
                    </>
                  )}
                </div>
              </div>

              <div className="text-left w-full sm:w-auto">
                <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                  ارتقای خودکار
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2">
              <span>👑</span>
              <span>شما در بالاترین سطح هنرمندان هنرهاب (هنرمند ایران زمین) قرار دارید و کارمزد خدمات شما صفر درصد است!</span>
            </div>
          )}
        </div>
      )}

      {/* Guide: All 4 Tiers Comparison Roadmap */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-xs">
        <div>
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <span>ℹ️</span>
            <span>راهنمای سطوح ۴ گانه کارمزد و شرایط ارتقای خودکار هنرمندان</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            پلتفرم هنرهاب با افزایش حجم فروش شما، به صورت خودکار کارمزد پلتفرم را کاهش می‌دهد تا بیشترین سود خالص به دستان هنرمند برسد.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Bronze Card */}
          <div className={`p-4 rounded-2xl border transition-all ${commissionTier === 'BRONZE' ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-300/40' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🥉</span>
              <span className="text-xs font-black text-amber-800">
                کارمزد {toPersianDigits(commissionSettings?.commissionBronzeRate ?? 5)}٪
              </span>
            </div>
            <h3 className="font-black text-sm text-slate-900">هنرمند برنزی</h3>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              سطح پیش‌فرض هنگام ثبت‌نام و ورود کلیه هنرمندان محترم به پلتفرم هنرهاب.
            </p>
            <div className="mt-3 pt-2 border-t border-slate-200/80 text-[10px] text-slate-500 font-bold">
              شرط ارتقا: شروع فعالیت و فروش آثار
            </div>
          </div>

          {/* Silver Card */}
          <div className={`p-4 rounded-2xl border transition-all ${commissionTier === 'SILVER' ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-300/40' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🥈</span>
              <span className="text-xs font-black text-slate-800">
                کارمزد {toPersianDigits(commissionSettings?.commissionSilverRate ?? 3)}٪
              </span>
            </div>
            <h3 className="font-black text-sm text-slate-900">هنرمند نقره‌ای</h3>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              کاهش کارمزد به ۳٪ برای هنرمندان فعال و دارای فروش مستمر در پلتفرم.
            </p>
            <div className="mt-3 pt-2 border-t border-slate-200/80 text-[10px] text-teal-700 font-bold">
              شرط ارتقا: {toPersianDigits(commissionSettings?.commissionSilverMonthlySales ?? 10)} فروش در ۱ ماه یا {toPersianDigits(commissionSettings?.commissionSilverYearlySales ?? 50)} فروش در ۱ سال شمسی
            </div>
          </div>

          {/* Golden Card */}
          <div className={`p-4 rounded-2xl border transition-all ${commissionTier === 'GOLDEN' ? 'bg-yellow-50 border-yellow-300 ring-2 ring-yellow-300/40' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🥇</span>
              <span className="text-xs font-black text-yellow-800">
                کارمزد {toPersianDigits(commissionSettings?.commissionGoldenRate ?? 1)}٪
              </span>
            </div>
            <h3 className="font-black text-sm text-slate-900">هنرمند طلایی</h3>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              کارمزد فوق‌العاده ۱٪ برای پرفروش‌ترین آثار هنری ایران زمین.
            </p>
            <div className="mt-3 pt-2 border-t border-slate-200/80 text-[10px] text-yellow-800 font-bold">
              شرط ارتقا: {toPersianDigits(commissionSettings?.commissionGoldenMonthlySales ?? 30)} فروش در ۱ ماه یا {toPersianDigits(commissionSettings?.commissionGoldenYearlySales ?? 200)} فروش سالانه (یا هدیه عضویت تا ۱ فروردین ۱۴۰۶)
            </div>
          </div>

          {/* Iran Zamin Card */}
          <div className={`p-4 rounded-2xl border transition-all ${commissionTier === 'IRAN_ZAMIN' ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-300/40' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">👑</span>
              <span className="text-xs font-black text-emerald-800">
                کارمزد {toPersianDigits(commissionSettings?.commissionIranZaminRate ?? 0)}٪
              </span>
            </div>
            <h3 className="font-black text-sm text-slate-900">هنرمند ایران زمین</h3>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              صفر درصد کارمزد! کل درآمد فروش به صورت ۱۰۰٪ خالص به حساب هنرمند تعلق می‌گیرد.
            </p>
            <div className="mt-3 pt-2 border-t border-slate-200/80 text-[10px] text-emerald-700 font-bold">
              شرط ارتقا: {toPersianDigits(commissionSettings?.commissionIranZaminMonthlySales ?? 100)} فروش در ۱ ماه شمسی (به مدت ۱ ماه با امکان تمدید)
            </div>
          </div>
        </div>
      </div>

      {/* Sheba Banner */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg">
            🏦
          </div>
          <div>
            <div className="text-slate-500">شماره شبا بانکی ثبت‌شده جهت دریافت حواله پایا:</div>
            <div className="font-mono font-bold text-sm text-slate-900 mt-0.5 tracking-wider" dir="ltr">
              {shebaNumber ? `IR ${shebaNumber}` : 'ثبت نشده (لطفاً شماره شبا را در درخواست وارد کنید)'}
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="text-teal-700 hover:text-teal-800 font-bold underline cursor-pointer"
        >
          تغییر یا ثبت شماره شبا
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('settlements')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'settlements'
              ? 'bg-teal-700 text-white shadow-md'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          درخواست‌های تسویه‌حساب ({toPersianDigits(settlementRequests.length)})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'transactions'
              ? 'bg-teal-700 text-white shadow-md'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          تراکنش‌های کیف‌پول ({toPersianDigits(transactions.length)})
        </button>
      </div>

      {/* Tab 1: Settlement Requests Table */}
      {activeTab === 'settlements' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-bold">در حال بارگذاری درخواست‌ها...</div>
          ) : settlementRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              شما تاکنون درخواست تسویه‌حسابی ثبت نکرده‌اید. با رسیدن موجودی به حداقل ۵۰٬۰۰۰ تومان می‌توانید درخواست واریز پایا ثبت کنید.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-4">مبلغ تسویه</th>
                    <th className="p-4">شماره شبا مقصد</th>
                    <th className="p-4">وضعیت درخواست</th>
                    <th className="p-4">کد رهگیری بانکی / توضیحات</th>
                    <th className="p-4">تاریخ ثبت</th>
                    <th className="p-4">تاریخ واریز</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {settlementRequests.map((req) => {
                    const status = getStatusBadge(req.status);
                    return (
                      <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-4">
                          <span className="font-black text-slate-900 text-sm font-mono">
                            {toPersianDigits(req.amount.toLocaleString())}
                          </span>
                          <span className="text-[10px] text-slate-500 mr-1">تومان</span>
                        </td>
                        <td className="p-4 font-mono text-slate-800 font-bold" dir="ltr">
                          IR{req.shebaNumber}
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
                        <td className="p-4 text-slate-500 font-mono text-[11px]">
                          {formatPersianDateTime(req.createdAt)}
                        </td>
                        <td className="p-4 text-slate-500 font-mono text-[11px]">
                          {req.paidAt ? formatPersianDateTime(req.paidAt) : '—'}
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

      {/* Tab 2: Transactions Table */}
      {activeTab === 'transactions' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-bold">در حال بارگذاری تراکنش‌ها...</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              هنوز هیچ تراکنشی در کیف‌پول شما ثبت نشده است.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-4">نوع تراکنش</th>
                    <th className="p-4">مبلغ</th>
                    <th className="p-4">شرح تراکنش</th>
                    <th className="p-4">شناسه مرجع</th>
                    <th className="p-4">تاریخ و ساعت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                            tx.type === 'CREDIT'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {tx.type === 'CREDIT' ? 'واریز فروش اثر (+)' : 'برداشت تسویه (-)'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`font-black text-sm font-mono ${
                            tx.type === 'CREDIT' ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {tx.type === 'CREDIT' ? '+' : '-'}{toPersianDigits(tx.amount.toLocaleString())}
                        </span>
                        <span className="text-[10px] text-slate-500 mr-1">تومان</span>
                      </td>
                      <td className="p-4 text-slate-700 font-medium">
                        {tx.description || 'تراکنش مالی'}
                      </td>
                      <td className="p-4 font-mono text-slate-500 text-[11px]">
                        {tx.referenceId || '—'}
                      </td>
                      <td className="p-4 text-slate-500 font-mono text-[11px]">
                        {formatPersianDateTime(tx.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Request Settlement */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <span>💳</span>
                <span>درخواست تسویه‌حساب (حواله پایا به شماره شبا)</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">موجودی قابل تسویه:</span>
                <span className="font-mono font-black text-emerald-700">
                  {toPersianDigits(balance.toLocaleString())} تومان
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">حداقل مبلغ تسویه:</span>
                <span className="font-mono text-slate-700">۵۰٬۰۰۰ تومان</span>
              </div>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  مبلغ درخواستی (تومان):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="50000"
                    max={balance}
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                    placeholder="مثلاً 500000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-slate-900 outline-none focus:border-teal-600 focus:bg-white text-left"
                    required
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">تومان</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRequestAmount(String(balance))}
                  className="text-[11px] text-teal-700 hover:text-teal-800 font-bold mt-1.5 inline-block cursor-pointer"
                >
                  تسویه کل موجودی ({toPersianDigits(balance.toLocaleString())} تومان)
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  شماره شبا مقصد (۲۴ رقم بدون IR):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={26}
                    value={modalSheba}
                    onChange={(e) => setModalSheba(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="120170000000123456789012"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-12 pr-4 py-2.5 text-xs font-mono font-bold text-slate-900 outline-none focus:border-teal-600 focus:bg-white"
                    required
                  />
                  <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">IR</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  مبلغ به این شماره شبا از طریق حواله پایا واریز خواهد شد.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs py-3 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {isSubmitting ? 'در حال ثبت...' : 'ثبت درخواست تسویه'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
