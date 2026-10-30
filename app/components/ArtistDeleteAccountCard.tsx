'use client';

import React, { useState, useEffect } from 'react';

export default function ArtistDeleteAccountCard() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deletionRequested, setDeletionRequested] = useState(false);
  const [deletionReason, setDeletionReason] = useState<string | null>(null);
  const [deletionRequestedAt, setDeletionRequestedAt] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [reasonInput, setReasonInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/artist/delete-request', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setDeletionRequested(Boolean(data.deletionRequested));
        setDeletionReason(data.deletionReason);
        setDeletionRequestedAt(data.deletionRequestedAt);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/artist/delete-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reasonInput })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خطا در ثبت درخواست');
      }

      setDeletionRequested(true);
      setDeletionReason(data.deletionReason);
      setDeletionRequestedAt(data.deletionRequestedAt);
      setShowModal(false);
      setReasonInput('');
      setFeedback({ type: 'success', text: data.message });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'خطا در ثبت درخواست' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!window.confirm('آیا از انصراف و لغو درخواست حذف حساب اطمینان دارید؟')) return;
    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/artist/delete-request', {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خطا در لغو درخواست');
      }

      setDeletionRequested(false);
      setDeletionReason(null);
      setDeletionRequestedAt(null);
      setFeedback({ type: 'success', text: data.message });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'خطا در لغو درخواست' });
    } finally {
      setActionLoading(false);
    }
  };

  const formatPersianDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(dateStr));
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 mt-8 text-center text-xs text-slate-400">
        در حال بارگذاری وضعیت حساب...
      </div>
    );
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-red-200 mt-8 relative overflow-hidden">
      <div className="flex items-start justify-between gap-4 flex-col sm:flex-row mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">⚠️</span>
            <h3 className="text-lg font-black text-red-950">ناحیه حساس: حذف کامل حساب کاربری</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
            در صورت تایید درخواست حذف توسط مدیریت، پروفایل هنرمندی و آثار شما به حالت بایگانی درآمده و دسترسی شما به پنل اختصاصی مسدود خواهد شد.
          </p>
        </div>

        {deletionRequested ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-black border border-red-300 shrink-0">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            <span>در انتظار تایید ادمین</span>
          </span>
        ) : null}
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl mb-4 text-xs font-bold border flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          <span>{feedback.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{feedback.text}</span>
        </div>
      )}

      {deletionRequested ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5 text-right space-y-3">
          <div className="flex items-center gap-2 text-red-900 font-black text-sm">
            <span>⏳</span>
            <span>درخواست حذف حساب شما ثبت شده است</span>
          </div>
          <p className="text-xs text-red-800 leading-relaxed">
            درخواست شما در تاریخ <strong className="font-mono">{formatPersianDate(deletionRequestedAt)}</strong> ارسال شده و به کنترل‌پنل ارشد ادمین گزارش شده است. تا زمان تایید نهایی توسط ادمین، می‌توانید در صورت تمایل از درخواست خود انصراف دهید.
          </p>
          {deletionReason && (
            <div className="text-xs bg-white/80 p-3 rounded-xl border border-red-200 text-slate-700">
              <span className="text-slate-400 block text-[11px] mb-0.5">علت قید شده:</span>
              <span>{deletionReason}</span>
            </div>
          )}

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancelRequest}
              disabled={actionLoading}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {actionLoading ? 'در حال ثبت...' : 'انصراف و لغو درخواست حذف'}
            </button>
          </div>
        </div>
      ) : (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-black py-2.5 px-5 rounded-xl text-xs transition-colors shadow-md shadow-red-600/20 cursor-pointer flex items-center gap-2"
          >
            <span>🗑️</span>
            <span>ثبت درخواست حذف حساب کاربری</span>
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in" dir="rtl">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-red-700 font-black text-base">
                <span>⚠️</span>
                <span>تایید درخواست حذف حساب</span>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed space-y-2">
              <p>
                هنرمند گرامی، آیا مطمئن هستید که می‌خواهید درخواست حذف حساب کاربری خود را ثبت نمایید؟
              </p>
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl">
                پس از تایید ادمین، فروشگاه و آثار شما در سایت مخفی شده و حساب شما بایگانی خواهد شد.
              </div>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  علت درخواست حذف (اختیاری):
                </label>
                <textarea
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder="لطفاً دلیل تمایل به حذف حساب را برای بهبود کیفیت خدمات پلتفرم قید بفرمایید..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-slate-50/50 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs transition-colors shadow-md shadow-red-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'در حال ثبت...' : 'تایید و ارسال درخواست به ادمین'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
