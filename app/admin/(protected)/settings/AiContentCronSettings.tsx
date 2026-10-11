'use client';

import React, { useState, useEffect } from 'react';

export default function AiContentCronSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Settings
  const [isEnabled, setIsEnabled] = useState(true);
  const [frequency, setFrequency] = useState<'DAILY' | 'TWICE_DAILY' | 'WEEKLY' | 'CUSTOM'>('DAILY');
  const [selectedHour, setSelectedHour] = useState('08');
  const [customCron, setCustomCron] = useState('0 8 * * *');

  useEffect(() => {
    fetch('/api/admin/cron-settings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setIsEnabled(data.isEnabled);
          const sched = data.schedule || '0 8 * * *';
          setCustomCron(sched);

          // Infer frequency
          if (sched === '0 8 * * *') {
            setFrequency('DAILY');
            setSelectedHour('08');
          } else if (sched === '0 9,21 * * *' || sched === '0 8,20 * * *') {
            setFrequency('TWICE_DAILY');
          } else if (sched === '0 8 * * 6' || sched.includes('* * 6') || sched.includes('* * 5')) {
            setFrequency('WEEKLY');
          } else {
            const match = sched.match(/^0\s+(\d{1,2})\s+\*\s+\*\s+\*$/);
            if (match) {
              setFrequency('DAILY');
              setSelectedHour(match[1].padStart(2, '0'));
            } else {
              setFrequency('CUSTOM');
            }
          }
        }
      })
      .catch(err => {
        console.error('Error fetching cron settings:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const getComputedSchedule = () => {
    if (frequency === 'DAILY') {
      return `0 ${parseInt(selectedHour, 10)} * * *`;
    }
    if (frequency === 'TWICE_DAILY') {
      return '0 8,20 * * *';
    }
    if (frequency === 'WEEKLY') {
      return '0 8 * * 6'; // Saturdays (شروع هفته)
    }
    return customCron.trim() || '0 8 * * *';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const schedule = getComputedSchedule();

    try {
      const res = await fetch('/api/admin/cron-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled, schedule })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'تنظیمات کرون‌جاب با موفقیت در فایل vercel.json ذخیره شد.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'خطا در ذخیره تنظیمات' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'خطا در ارتباط با سرور' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestNow = async () => {
    if (!confirm('آیا مایلید همین حالا یک پست تستی توسط هوش مصنوعی جمینای تولید و منتشر شود؟')) return;
    setTesting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/cron/ai-blogger');
      const data = await res.json();
      if (data.success) {
        setMessage({
          type: 'success',
          text: `مقاله جدید "${data.post?.title}" با موفقیت توسط هوش مصنوعی تولید و منتشر شد!`
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'خطا در اجرای نویسنده هوش مصنوعی' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'خطا در فراخوانی سرویس' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center">
        <div className="inline-block animate-spin w-6 h-6 border-3 border-emerald-500 border-t-transparent rounded-full mb-2"></div>
        <p className="text-slate-400 text-xs">در حال بارگذاری تنظیمات Vercel Cron...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm mt-8 font-sans" dir="rtl">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold mb-2 border border-purple-200/60">
            <span>🤖</span> موتور زمان‌بندی Vercel Cron (vercel.json)
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
            تنظیمات تولید محتوای خودکار توسط AI
          </h2>
          <p className="text-slate-500 text-xs md:text-sm mt-1">
            مدیریت زمان‌بندی انتشار مقالات روزانه، اتصال به پلتفرم ابری ورسل و اجرای دستی
          </p>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
          <span className="text-xs font-bold text-slate-700">
            {isEnabled ? 'کرون‌جاب فعال است' : 'کرون‌جاب غیرفعال'}
          </span>
        </div>
      </div>

      {message && (
        <div className={`p-4 my-6 rounded-2xl text-sm font-bold flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <span>{message.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 mt-6">
        {/* Toggle On/Off Switch */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
          <div>
            <h4 className="text-sm font-bold text-slate-800">فعال‌سازی انتشار خودکار مقالات</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              در صورت فعال بودن، ورسل در زمان مقرر اندپوینت <code>/api/cron/ai-blogger</code> را صدا می‌زند.
            </p>
          </div>
          <button
            type="button"
            dir="ltr"
            onClick={() => setIsEnabled(!isEnabled)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isEnabled ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {isEnabled && (
          <div className="space-y-5">
            {/* Frequency Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">دوره‌ی تکرار انتشار:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'DAILY', label: 'روزانه (یکبار در روز)' },
                  { id: 'TWICE_DAILY', label: 'دوبار در روز (صبح و شب)' },
                  { id: 'WEEKLY', label: 'هفتگی (شنبه‌ها)' },
                  { id: 'CUSTOM', label: 'فرمول اختصاصی Cron' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFrequency(item.id as any)}
                    className={`p-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      frequency === item.id
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Hour Selector */}
            {frequency === 'DAILY' && (
              <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h5 className="text-xs font-bold text-slate-800">ساعت اجرای روزانه (به وقت UTC):</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ساعت ۰۸:۰۰ صبح UTC معادل حدود ۱۱:۳۰ صبح به وقت ایران است.
                  </p>
                </div>
                <select
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(e.target.value)}
                  className="px-4 py-2 bg-white border border-purple-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {Array.from({ length: 24 }).map((_, i) => {
                    const h = i.toString().padStart(2, '0');
                    return (
                      <option key={h} value={h}>
                        ساعت {h}:00 UTC
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Custom Cron Input */}
            {frequency === 'CUSTOM' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  فرمت ۵ تکه‌ای کرون‌جاب (Cron Expression):
                </label>
                <input
                  type="text"
                  value={customCron}
                  onChange={(e) => setCustomCron(e.target.value)}
                  placeholder="0 8 * * *"
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl font-mono text-sm dir-ltr text-right focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  فرمت: (دقیقه ساعت روز ماه روز‌هفته) - مثال: <code>0 8 * * *</code>
                </span>
              </div>
            )}

            {/* Preview of vercel.json format */}
            <div className="p-4 bg-slate-900 rounded-2xl text-slate-300 text-xs font-mono dir-ltr overflow-x-auto">
              <span className="text-slate-500 block mb-1 font-sans text-right dir-rtl">// پیش‌نمایش خروجی vercel.json:</span>
              <pre>{JSON.stringify({
                crons: [
                  {
                    path: "/api/cron/ai-blogger",
                    schedule: getComputedSchedule()
                  }
                ]
              }, null, 2)}</pre>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleTestNow}
            disabled={testing}
            className="w-full sm:w-auto px-5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {testing ? (
              <>
                <span className="inline-block animate-spin w-3 h-3 border-2 border-amber-800 border-t-transparent rounded-full"></span>
                <span>در حال تولید مقاله تستی...</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>تست و اجرای فوری نویسنده هوش مصنوعی</span>
              </>
            )}
          </button>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-200 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? 'در حال ذخیره در vercel.json...' : '💾 ذخیره تغییرات vercel.json'}
          </button>
        </div>
      </form>
    </div>
  );
}
