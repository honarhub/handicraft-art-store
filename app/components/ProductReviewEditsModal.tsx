'use client';

import React, { useState } from 'react';

interface ProductReviewEditsModalProps {
  isOpen: boolean;
  product: any;
  onClose: () => void;
  onApprove: (id: string, feedback: string) => Promise<void>;
  onReject: (id: string, feedback: string) => Promise<void>;
}

export default function ProductReviewEditsModal({
  isOpen,
  product,
  onClose,
  onApprove,
  onReject
}: ProductReviewEditsModalProps) {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !product) return null;

  const isEditReview = Boolean(product.hasPendingEdits && product.pendingEdits);
  const edits = product.pendingEdits || {};

  // استخراج تصاویر
  const currentImages: string[] = product.mediaUrls && product.mediaUrls.length > 0 
    ? product.mediaUrls 
    : (product.imageUrl ? [product.imageUrl] : []);

  const proposedImages: string[] = edits.mediaUrls && edits.mediaUrls.length > 0
    ? edits.mediaUrls
    : (edits.imageUrl ? [edits.imageUrl] : []);

  const isTitleChanged = edits.title && edits.title.trim() !== product.title.trim();
  const isDescChanged = edits.description && edits.description.trim() !== (product.description || '').trim();
  const isPriceChanged = edits.price !== undefined && edits.price !== product.price;
  const isImagesChanged = proposedImages.length !== currentImages.length || 
    proposedImages.some((url, i) => url !== currentImages[i]);

  const handleApproveClick = async () => {
    setLoading(true);
    try {
      await onApprove(product.id, feedback);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectClick = async () => {
    if (!feedback.trim()) {
      const confirmNoComment = window.confirm(
        isEditReview
          ? 'پیامی برای هنرمند ثبت نشده است. آیا مایلید بدون ارسال پیام تغییرات را رد کنید؟'
          : 'دلیلی برای رد محصول ثبت نشده است. آیا مایلید بدون ثبت پیام محصول را رد کنید؟'
      );
      if (!confirmNoComment) return;
    }
    setLoading(true);
    try {
      await onReject(product.id, feedback);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg ${
              isEditReview ? 'bg-amber-500/10 text-amber-600' : 'bg-purple-500/10 text-purple-600'
            }`}>
              {isEditReview ? '🔍' : '📦'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-800">
                  {isEditReview ? 'بررسی تغییرات پیشنهادی اثر' : 'بررسی و تایید محصول جدید'}
                </h3>
                <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full font-bold">
                  #{product.displayId}
                </span>
                {!isEditReview && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-2xs">
                    محصول جدید
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                هنرمند: <strong className="text-purple-700">{product.artistName}</strong>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Content Comparison or New Product Details */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          
          {isEditReview ? (
            /* حالت مقایسه تغییرات */
            <>
              {/* مقایسه عکس‌ها */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-slate-800 flex items-center gap-2">
                    🖼️ تصاویر اثر
                  </span>
                  {isImagesChanged ? (
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                      تغییر یافته
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs font-medium">بدون تغییر</span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="text-xs font-bold text-slate-500 mb-2">تصاویر فعلی منتشر شده:</div>
                    <div className="flex flex-wrap gap-2">
                      {currentImages.map((url, idx) => (
                        <a key={idx} href={url} target="_blank" rel="noreferrer">
                          <img src={url} alt={`فعلی ${idx + 1}`} className="w-16 h-16 object-cover rounded-lg border border-slate-200 hover:scale-105 transition" />
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
                    <div className="text-xs font-bold text-emerald-700 mb-2">تصاویر پیشنهادی هنرمند:</div>
                    <div className="flex flex-wrap gap-2">
                      {proposedImages.map((url, idx) => (
                        <a key={idx} href={url} target="_blank" rel="noreferrer">
                          <img src={url} alt={`جدید ${idx + 1}`} className="w-16 h-16 object-cover rounded-lg border border-emerald-300 shadow-2xs hover:scale-105 transition" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* مقایسه عنوان */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-slate-800 flex items-center gap-2">
                    ✏️ عنوان اثر
                  </span>
                  {isTitleChanged ? (
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                      تغییر یافته
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs font-medium">بدون تغییر</span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="text-xs font-bold text-slate-500 mb-1">عنوان قبلی:</div>
                    <div className="font-bold text-slate-800">{product.title}</div>
                  </div>
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
                    <div className="text-xs font-bold text-emerald-700 mb-1">عنوان جدید پیشنهادی:</div>
                    <div className="font-black text-emerald-900">{edits.title || product.title}</div>
                  </div>
                </div>
              </div>

              {/* مقایسه توضیحات */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-slate-800 flex items-center gap-2">
                    📝 توضیحات اثر
                  </span>
                  {isDescChanged ? (
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                      تغییر یافته
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs font-medium">بدون تغییر</span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="text-xs font-bold text-slate-500 mb-1">توضیحات قبلی:</div>
                    <div className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto">
                      {product.description || 'ندارد'}
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
                    <div className="text-xs font-bold text-emerald-700 mb-1">توضیحات جدید پیشنهادی:</div>
                    <div className="text-emerald-950 text-xs leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto font-medium">
                      {edits.description || product.description || 'ندارد'}
                    </div>
                  </div>
                </div>
              </div>

              {/* سایر مشخصات در صورت تغییر */}
              {isPriceChanged && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-slate-800">💰 قیمت پایه</span>
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">تغییر یافته</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <div className="text-xs text-slate-500">قیمت قبلی:</div>
                      <div className="font-bold text-slate-700">{product.price?.toLocaleString('fa-IR')} تومان</div>
                    </div>
                    <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
                      <div className="text-xs text-emerald-700">قیمت جدید:</div>
                      <div className="font-black text-emerald-800">{edits.price?.toLocaleString('fa-IR')} تومان</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* حالت بررسی محصول کاملاً جدید */
            <>
              {/* گالری تصاویر محصول جدید */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block mb-3">🖼️ تصاویر ثبت شده اثر</span>
                <div className="flex flex-wrap gap-3">
                  {currentImages.map((url, idx) => (
                    <a key={idx} href={url} target="_blank" rel="noreferrer" className="relative group">
                      <img src={url} alt={`محصول ${idx + 1}`} className="w-24 h-24 object-cover rounded-xl border border-slate-300 shadow-2xs group-hover:scale-105 transition" />
                      <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md">
                        {idx === 0 ? 'عکس اصلی' : `عکس ${idx + 1}`}
                      </span>
                    </a>
                  ))}
                </div>
              </div>

              {/* مشخصات اصلی */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-500 mb-1">عنوان اثر:</div>
                  <div className="font-black text-slate-800 text-base">{product.title}</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-500 mb-1">قیمت پایه:</div>
                  <div className="font-black text-emerald-700 text-base">
                    {product.price > 0 ? `${product.price.toLocaleString('fa-IR')} تومان` : 'توافقی / نامشخص'}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-500 mb-1">موجودی انبار:</div>
                  <div className="font-bold text-slate-700">{product.stockQuantity ?? 1} عدد</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-500 mb-1">نحوه ارسال:</div>
                  <div className="font-bold text-slate-700">
                    {product.shippingMode === 'HONARHUB_WAREHOUSE' ? '📦 انبار مرکزی هنرهاب' : '🎨 ارسال مستقیم از کارگاه هنرمند'}
                  </div>
                </div>
              </div>

              {/* توضیحات */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-slate-500 mb-2">توضیحات و مشخصات اثر:</div>
                <div className="text-slate-800 text-xs leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {product.description || 'توضیحاتی ثبت نشده است.'}
                </div>
              </div>
            </>
          )}

          {/* فیلد کامنت یا پیام بازخورد برای هنرمند */}
          <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200">
            <label className="block text-xs font-bold text-purple-900 mb-2">
              💬 کامنت یا پیام بازخورد برای هنرمند (اختیاری برای تایید / توضیحی برای رد):
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="توضیح خود در مورد تایید یا دلیل رد اثر/تغییرات را اینجا بنویسید تا هنرمند در پنل خود مشاهده کند..."
              rows={3}
              className="w-full p-3 bg-white border border-purple-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-xs transition"
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50/80">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-100 transition text-sm cursor-pointer"
          >
            انصراف
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleRejectClick}
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-bold transition text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              <span>{isEditReview ? 'رد تغییرات' : 'رد محصول'}</span>
            </button>

            <button
              type="button"
              onClick={handleApproveClick}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>{isEditReview ? 'تایید و اعمال تغییرات' : 'تایید و انتشار محصول'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
