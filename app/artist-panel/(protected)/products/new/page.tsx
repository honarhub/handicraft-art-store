'use client';

import React, { useState, useRef, useEffect } from 'react';
import SpecialtyTagInput, { Specialty } from '@/app/components/SpecialtyTagInput';
import PreOrderManager, { PreOrderTier, DEFAULT_PREORDER_TIERS } from '@/app/components/PreOrderManager';
import ProductImageCropModal from '@/app/components/ProductImageCropModal';
import { useRouter } from 'next/navigation';

export default function ArtistAddProductPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  
  // Data States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [shippingMode, setShippingMode] = useState<'ARTIST_DIRECT' | 'HONARHUB_WAREHOUSE'>('ARTIST_DIRECT');
  const [isPreOrderEnabled, setIsPreOrderEnabled] = useState(false);
  const [preOrderTiers, setPreOrderTiers] = useState<PreOrderTier[]>(DEFAULT_PREORDER_TIERS);
  const [seoMetaTitle, setSeoMetaTitle] = useState('');
  const [seoMetaDesc, setSeoMetaDesc] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [images, setImages] = useState<string[]>([]); // Array of base64 strings
  const [stockQuantity, setStockQuantity] = useState(1);

  // Product Image Crop Modal States
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [pendingCropQueue, setPendingCropQueue] = useState<string[]>([]);

  // Submission Feedback Modal States
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [createdProductTitle, setCreatedProductTitle] = useState('');

  // Helper for price formatting
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const persianToEnglish = (str: string) => {
      return str.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
                .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
    };
    const rawValue = persianToEnglish(e.target.value).replace(/\D/g, '');
    setPrice(rawValue);
  };
  const formattedPrice = price ? Number(price).toLocaleString('fa-IR') : '';

  // UI States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCountdown, setAiCountdown] = useState(90);
  const [aiError, setAiError] = useState('');
  const [aiCompleted, setAiCompleted] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [seoLoading, setSeoLoading] = useState(false);
  const [artistAiEnabled, setArtistAiEnabled] = useState(true);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    fetch('/api/site-settings', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (data && typeof data.artistAiEnabled === 'boolean') {
          setArtistAiEnabled(data.artistAiEnabled);
          if (!data.artistAiEnabled) {
            setActiveTab('manual');
          }
        }
      })
      .catch(() => {});
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleCancelAi = () => {
    isCancelledRef.current = true;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setAiLoading(false);
    setAiError('فرآیند هوش مصنوعی لغو شد.');
  };

  const handleAiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAiError('');
    setAiLoading(true);
    setAiCountdown(90);
    isCancelledRef.current = false;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 90000);

    const timerInterval = setInterval(() => {
      setAiCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      const base64 = await fileToBase64(file);
      setImages([base64]);

      const response = await fetch('/api/ai/extract-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Data: base64.split(',')[1],
          mimeType: file.type
        }),
        signal: controller.signal
      });

      if (!response.ok) throw new Error('خطا در هوش مصنوعی');
      
      const data = await response.json();
      
      setTitle(data.title || '');
      setDescription(data.description || '');
      if (data.estimatedPrice) setPrice(String(data.estimatedPrice));
      setSeoMetaTitle(data.seoMetaTitle || '');
      setSeoMetaDesc(data.seoMetaDesc || '');
      setSeoKeywords(data.seoKeywords || '');
      if (data.stockQuantity !== undefined) setStockQuantity(data.stockQuantity);
      if (data.matchedSpecialties && Array.isArray(data.matchedSpecialties) && data.matchedSpecialties.length > 0) {
        setSpecialties(data.matchedSpecialties);
      }
      
      setAiCompleted(true);
    } catch (error: any) {
      if (isCancelledRef.current) {
        setAiError('فرآیند هوش مصنوعی با موفقیت لغو شد.');
      } else if (error.name === 'AbortError' || controller.signal.aborted) {
        setAiError('زمان پردازش هوش مصنوعی به پایان رسید (بیش از ۹۰ ثانیه). لطفاً دوباره تلاش کرده یا فرم را دستی تکمیل نمایید.');
      } else {
        setAiError('متاسفانه پردازش تصویر با مشکل مواجه شد. لطفاً فرم را دستی تکمیل نمایید.');
      }
    } finally {
      clearTimeout(timeoutId);
      clearInterval(timerInterval);
      setAiLoading(false);
      abortControllerRef.current = null;
      e.target.value = '';
    }
  };

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (images.length + files.length > 5) {
      alert('حداکثر می‌توانید ۵ فایل انتخاب کنید.');
      return;
    }

    const convertedImages: string[] = [];
    const videoFiles: string[] = [];

    for (const file of files) {
      // Check sizes: 5MB for image, 20MB for video
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      if (isImage && file.size > 5 * 1024 * 1024) {
        alert(`فایل ${file.name} بیشتر از ۵ مگابایت است.`);
        continue;
      }
      if (isVideo && file.size > 20 * 1024 * 1024) {
        alert(`فایل ${file.name} بیشتر از ۲۰ مگابایت است.`);
        continue;
      }

      try {
        const base64 = await fileToBase64(file);
        if (isVideo) {
          videoFiles.push(base64);
        } else {
          convertedImages.push(base64);
        }
      } catch (err) {
        console.error('Error converting file', err);
      }
    }

    // Add videos directly
    if (videoFiles.length > 0) {
      setImages(prev => [...prev, ...videoFiles]);
    }

    // If images were selected, trigger rectangular crop modal for the first one and queue remaining
    if (convertedImages.length > 0) {
      const [first, ...rest] = convertedImages;
      setEditingImageIndex(null); // new image mode
      setPendingCropQueue(rest);
      setCropImageSrc(first);
      setCropModalOpen(true);
    }

    e.target.value = '';
  };

  const handleCropComplete = (croppedBase64: string) => {
    if (editingImageIndex !== null) {
      // Replacing existing image
      setImages(prev => {
        const next = [...prev];
        next[editingImageIndex] = croppedBase64;
        return next;
      });
      setEditingImageIndex(null);
      setCropImageSrc(null);
      setCropModalOpen(false);
    } else {
      // Adding newly cropped image
      setImages(prev => [...prev, croppedBase64]);

      // If more images queued from multi-upload, open next one
      if (pendingCropQueue.length > 0) {
        const [nextImage, ...remainingQueue] = pendingCropQueue;
        setPendingCropQueue(remainingQueue);
        setCropImageSrc(nextImage);
        setCropModalOpen(true);
      } else {
        setCropImageSrc(null);
        setCropModalOpen(false);
      }
    }
  };

  const generateSeo = async () => {
    if (!title) {
      alert('ابتدا عنوان محصول را وارد کنید.');
      return;
    }
    setSeoLoading(true);
    try {
      const res = await fetch('/api/ai/generate-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          specialties: specialties.map(s => s.name).join(', ')
        })
      });
      if (!res.ok) throw new Error('خطا');
      const data = await res.json();
      setSeoMetaTitle(data.seoMetaTitle || '');
      setSeoMetaDesc(data.seoMetaDesc || '');
      setSeoKeywords(data.seoKeywords || '');
    } catch (error) {
      alert('تولید سئو با مشکل مواجه شد.');
    } finally {
      setSeoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSubmitStatus('loading');
    setSubmitLoading(true);
    try {
      // artistId is omitted here, the backend will read it from cookies
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          price,
          shippingMode,
          isPreOrderEnabled,
          preOrderTiers,
          specialties: specialties.map(s => s.id),
          seoMetaTitle,
          seoMetaDesc,
          seoKeywords,
          images,
          stockQuantity
        })
      });

      if (!res.ok) throw new Error('Error creating product');
      
      setCreatedProductTitle(title);
      setSubmitStatus('success');
    } catch (error) {
      alert('متاسفانه در ثبت محصول مشکلی پیش آمد. لطفاً دوباره تلاش نمایید.');
      setSubmitStatus('idle');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-4xl mx-auto w-full" dir="rtl">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">ثبت اثر جدید</h2>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">محصولات پس از ثبت نیاز به بررسی و تایید مدیریت دارند.</p>
        </div>
        <button 
          onClick={() => router.back()} 
          className="self-end sm:self-auto bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <span>←</span>
          <span>بازگشت به لیست آثار</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:flex bg-slate-100 p-1.5 rounded-2xl mb-6 sm:mb-8 w-full sm:w-fit gap-1">
        <button 
          type="button"
          onClick={() => setActiveTab('ai')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${activeTab === 'ai' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <span className="text-base sm:text-lg">✨</span>
          <span>ثبت با هوش مصنوعی</span>
          {!artistAiEnabled && (
            <span className="text-[9px] sm:text-[10px] bg-amber-100 text-amber-800 border border-amber-300 font-bold px-1.5 py-0.5 rounded-full">
              غیرفعال
            </span>
          )}
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer text-center ${activeTab === 'manual' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          ثبت دستی (سنتی)
        </button>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-4 sm:p-6 md:p-8">
        
        {activeTab === 'ai' && (
          <div className="mb-10 pb-10 border-b border-slate-100">
            {!artistAiEnabled ? (
              <div className="border-2 border-dashed border-amber-300 bg-amber-50/70 rounded-3xl p-8 text-center max-w-lg mx-auto">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                  ⚠️
                </div>
                <h3 className="text-lg font-black text-amber-950 mb-2">
                  سرویس هوش مصنوعی موقتاً قطع می‌باشد
                </h3>
                <p className="text-amber-800 text-xs sm:text-sm mb-6 leading-relaxed">
                  قابلیت ثبت سریع با هوش مصنوعی موقتاً توسط مدیریت پلتفرم غیرفعال شده است. لطفاً برای ثبت اثر خود، از تب «ثبت دستی (سنتی)» استفاده فرمایید.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('manual')}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm transition-colors shadow-sm"
                >
                  انتقال به ثبت دستی ←
                </button>
              </div>
            ) : (
              <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${aiLoading ? 'border-teal-300 bg-teal-50' : 'border-slate-300 hover:border-teal-400 bg-slate-50 hover:bg-teal-50/30'}`}>
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">📸</div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">عکس محصول را آپلود کنید</h3>
                  <p className="text-slate-500 text-sm mb-2 leading-relaxed">
                    هوش مصنوعی به صورت خودکار تصویر محصول را آنالیز کرده و اطلاعات را پر می‌کند.
                    <br />
                    <span className="text-teal-600 font-bold text-xs mt-2 block">💡 پیشنهاد: برای نمایش بهتر و یکپارچه در سایت، لطفا از تصاویری با نسبت ابعاد ۴:۳ (مثلا ۸۰۰ در ۶۰۰ پیکسل) استفاده کنید.</span>
                  </p>
                  <div className="bg-orange-50 border border-orange-200 text-orange-800 text-xs rounded-lg p-3 mb-6 text-right">
                    <strong>توجه:</strong> تحلیل‌های هوش مصنوعی ممکن است غیردقیق باشد و صرفاً جهت راحتی در ثبت سریع است. هنرمند موظف به بازبینی و ویرایش اطلاعات پیش از ثبت نهایی می‌باشد. ضمناً در این روش فقط تصویر اصلی (۱ عکس) پردازش می‌شود.
                  </div>
                  {aiError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4 mb-4 text-center font-bold">
                      ⚠️ {aiError}
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAiUpload}
                    className="hidden" 
                    id="ai-upload"
                    disabled={aiLoading}
                  />
                  {aiLoading ? (
                    <div className="bg-teal-100/90 border border-teal-300 rounded-2xl p-4 flex flex-col items-center gap-2.5 max-w-xs mx-auto">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 text-teal-900 font-bold text-xs">
                          <span className="w-3.5 h-3.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></span>
                          <span>در حال پردازش هوش مصنوعی...</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCancelAi}
                          className="p-1 hover:bg-teal-200/80 rounded-lg text-teal-800 transition-colors flex items-center gap-1 text-[11px] font-bold"
                          title="انصراف و لغو پردازش"
                        >
                          <span>✕</span>
                          <span>لغو</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-2 w-full">
                        <div className="flex-1 bg-teal-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-teal-600 h-2 rounded-full transition-all duration-1000 ease-linear"
                            style={{ width: `${Math.min(100, Math.max(0, ((90 - aiCountdown) / 90) * 100))}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-teal-900 bg-white/80 px-2 py-0.5 rounded-md shadow-xs">
                          {aiCountdown.toLocaleString('fa-IR')} ثانیه
                        </span>
                      </div>
                    </div>
                  ) : (
                    <label 
                      htmlFor="ai-upload" 
                      className="inline-block px-6 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer bg-teal-600 hover:bg-teal-700 text-white shadow-md hover:shadow-lg"
                    >
                      انتخاب تصویر و پردازش
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {(activeTab === 'manual' || aiCompleted) && (
          <div className="mb-10 pb-10 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">گالری محصول (حداکثر ۵ فایل)</h3>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">
              شما می‌توانید تا ۵ عکس (حداکثر ۵ مگابایت) یا فیلم (حداکثر ۲۰ مگابایت) برای محصول خود آپلود کنید. اولین عکس به عنوان کاور نمایش داده می‌شود.
              <br />
              <span className="text-teal-600 font-bold text-xs mt-2 block">💡 پیشنهاد: برای نمایش بهتر و یکپارچه در صفحات سایت، لطفا از تصاویری با نسبت ابعاد ۴:۳ (مثلا ۸۰۰ در ۶۰۰ پیکسل) استفاده کنید.</span>
            </p>
            <div className="flex flex-wrap gap-4 items-center">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-slate-200 group shadow-2xs">
                  {img.startsWith('data:video') ? (
                    <video src={img} className="w-full h-full object-cover" />
                  ) : (
                    <img src={img} className="w-full h-full object-cover" />
                  )}

                  {/* Primary cover indicator */}
                  {idx === 0 && (
                    <span className="absolute bottom-1 right-1 bg-teal-600/90 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
                      کاور
                    </span>
                  )}

                  {/* Edit / Crop Button (only for images) */}
                  {!img.startsWith('data:video') && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingImageIndex(idx);
                        setCropImageSrc(img);
                        setPendingCropQueue([]);
                        setCropModalOpen(true);
                      }}
                      className="absolute bottom-1 left-1 bg-slate-900/80 hover:bg-teal-600 text-white text-[10px] p-1 rounded-md opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shadow-xs cursor-pointer"
                      title="ویرایش و تنظیم کادربندی مستطیل"
                    >
                      <span>✏️</span>
                    </button>
                  )}

                  {/* Remove Button */}
                  <button 
                    type="button"
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white w-6 h-6 flex items-center justify-center rounded-full opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm text-sm font-bold"
                    title="حذف فایل"
                  >
                    ×
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-teal-600 hover:border-teal-400 hover:bg-teal-50 cursor-pointer transition-all">
                  <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleManualUpload} />
                  <span className="text-3xl">+</span>
                </label>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            
            <div className="md:col-span-2">
              <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-2">عنوان اثر <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-base font-medium focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all shadow-xs" 
                placeholder="مثال: بشقاب میناکاری ۲۵ سانتی‌متری طرح اسلیمی"
                required 
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-2">قیمت پایه (تومان)</label>
              <input 
                type="text" 
                inputMode="numeric"
                value={formattedPrice} 
                onChange={handlePriceChange} 
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-base font-bold focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all shadow-xs" 
                placeholder="مثلا: ۵,۰۰۰,۰۰۰" 
              />
              {price ? (
                <div className="text-xs text-teal-900 font-bold mt-2 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200/70 inline-flex items-center gap-1.5">
                  <span>💰 معادل:</span>
                  <span className="font-black text-teal-700">{Number(price).toLocaleString('fa-IR')} تومان</span>
                </div>
              ) : null}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-2">موجودی آماده ارسال (تعداد) <span className="text-red-500">*</span></label>
              <input 
                type="number" 
                min="0" 
                inputMode="numeric"
                value={stockQuantity} 
                onChange={e => setStockQuantity(Number(e.target.value))} 
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-base font-bold focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all shadow-xs" 
                required 
              />
            </div>

            {/* Shipping Mode */}
            <div className="md:col-span-2 bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200">
              <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">نحوه ارسال سفارش</label>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                ارسال آثار توسط هنرمند به صورت مستقیم از کارگاه انجام می‌شود. ارسال از انبار مرکزی تنها توسط مدیریت سایت قابل فعال‌سازی است.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  className="p-3.5 sm:p-4 rounded-xl border-2 text-right transition-all flex items-start gap-3 border-emerald-500 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20"
                >
                  <span className="text-xl shrink-0">🎨</span>
                  <div>
                    <div className="font-bold text-xs sm:text-sm flex items-center gap-2">
                      <span>ارسال مستقیم از کارگاه هنرمند</span>
                      <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">پیش‌فرض هنرمند</span>
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-600 mt-1">محصول در کارگاه شماست و پس از ثبت سفارش توسط خودتان ارسال می‌گردد.</div>
                  </div>
                </div>

                <div
                  className="p-3.5 sm:p-4 rounded-xl border-2 text-right flex items-start gap-3 border-slate-200 bg-slate-100/70 text-slate-400 cursor-not-allowed opacity-60"
                  title="این گزینه پس از تحویل کالا به انبار مرکزی، صرفاً توسط مدیریت سایت فعال می‌گردد"
                >
                  <span className="text-xl shrink-0 grayscale">📦</span>
                  <div>
                    <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                      <span>ارسال توسط هنرهاب (انبار مرکزی)</span>
                      <span className="bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-normal">غیرفعال برای هنرمند</span>
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-400 mt-1">این گزینه منوط به تحویل کالا به انبار هنرهاب بوده و توسط مدیریت فعال می‌شود.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pre-Order Manager */}
            <div className="md:col-span-2">
              <PreOrderManager
                basePrice={Number(price) || 0}
                isPreOrderEnabled={isPreOrderEnabled}
                setIsPreOrderEnabled={setIsPreOrderEnabled}
                tiers={preOrderTiers}
                setTiers={setPreOrderTiers}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-2">تخصص‌های مرتبط</label>
              <SpecialtyTagInput selectedSpecialties={specialties} onChange={setSpecialties} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-2">توضیحات اثر</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-base font-normal leading-relaxed focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all shadow-xs" 
                rows={5}
                placeholder="توضیحات اثر، ابعاد، تکنیک و متریال ساخت، نحوه نگهداری و داستان خلق اثر..."
              ></textarea>
            </div>

            <div className="md:col-span-2 bg-slate-50/80 p-4 sm:p-6 rounded-2xl border border-slate-200 space-y-4 relative">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
                <div>
                  <h4 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span className="text-teal-600">🎯</span> تنظیمات سئو در گوگل (اختیاری)
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                    این مقادیر به نمایش حرفه‌ای اثر شما در نتایج جستجوی گوگل کمک می‌کند.
                  </p>
                </div>
                {activeTab === 'manual' && (
                  <button 
                    type="button" 
                    onClick={generateSeo}
                    disabled={seoLoading || !title || !artistAiEnabled}
                    className="w-full sm:w-auto bg-teal-100 hover:bg-teal-200 text-teal-800 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    title={!artistAiEnabled ? 'سرویس هوش مصنوعی موقتاً قطع می‌باشد' : undefined}
                  >
                    {seoLoading ? 'در حال تولید...' : !artistAiEnabled ? '✨ هوش مصنوعی (قطع موقت)' : '✨ تولید با هوش مصنوعی'}
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان سئو (SEO Title)</label>
                <input 
                  type="text" 
                  value={seoMetaTitle} 
                  onChange={e => setSeoMetaTitle(e.target.value)} 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all" 
                  placeholder="عنوان نمایشی در گوگل (مثال: خرید گلدان سفالی دست‌ساز)"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">توضیحات سئو (SEO Description)</label>
                <input 
                  type="text" 
                  value={seoMetaDesc} 
                  onChange={e => setSeoMetaDesc(e.target.value)} 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all" 
                  placeholder="توضیح کوتاه ۱ یا ۲ خطی برای نمایش در گوگل..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">کلمات کلیدی سئو (SEO Keywords)</label>
                <input 
                  type="text" 
                  value={seoKeywords} 
                  onChange={e => setSeoKeywords(e.target.value)} 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all" 
                  placeholder="کلمات کلیدی با ویرگول جدا شوند (مثال: سفالگری، میناکاری، صنایع دستی)"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex gap-4">
            <button 
              type="submit" 
              disabled={submitLoading} 
              className="w-full bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-teal-600/20 hover:shadow-teal-600/30 transition-all text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitLoading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>در حال ثبت اثر...</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>ثبت و ارسال اثر برای تایید مدیریت</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <ProductImageCropModal
        isOpen={cropModalOpen}
        imageSrc={cropImageSrc}
        onClose={() => {
          setCropModalOpen(false);
          setCropImageSrc(null);
          setEditingImageIndex(null);
          setPendingCropQueue([]);
        }}
        onCropComplete={handleCropComplete}
      />

      {/* Product Submission Loading & Success Feedback Modal */}
      {submitStatus !== 'idle' && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          dir="rtl"
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200 relative overflow-hidden">
            {submitStatus === 'loading' ? (
              <div className="space-y-4 py-2">
                <div className="w-16 h-16 rounded-2xl bg-teal-50 border-2 border-teal-200 flex items-center justify-center mx-auto text-teal-600 shadow-sm">
                  <span className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></span>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900">
                    اندکی صبر کنید...
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                    در حال آپلود تصاویر، پردازش متادیتا و ارسال محصول شما به سامانه هنرهاب هستیم.
                  </p>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-teal-600 h-full rounded-full animate-pulse w-full"></div>
                </div>
              </div>
            ) : (
              <div className="space-y-5 py-2 animate-in fade-in zoom-in-95 duration-300">
                {/* Success Icon */}
                <div className="w-20 h-20 rounded-3xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto text-4xl shadow-sm">
                  🎉
                </div>

                {/* Title & Status */}
                <div>
                  <span className="inline-block bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black px-3 py-1 rounded-full mb-3">
                    🟡 در انتظار بررسی و تایید ناظران
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900">
                    محصول شما با موفقیت ثبت و ارسال شد!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed font-medium">
                    اثر ارزشمند شما با عنوان <strong className="text-slate-900">«{createdProductTitle}»</strong> با موفقیت در سیستم ثبت گردید. پس از بررسی کیفیت و تایید توسط تیم مدیریت، در فروشگاه و ویترین عمومی شما منتشر خواهد شد.
                  </p>
                </div>

                {/* CTAs */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={() => router.push('/artist-panel/products')}
                    className="flex-1 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>📦</span>
                    <span>مشاهده در مدیریت آثار</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTitle('');
                      setDescription('');
                      setPrice('');
                      setImages([]);
                      setSpecialties([]);
                      setSeoMetaTitle('');
                      setSeoMetaDesc('');
                      setSeoKeywords('');
                      setStockQuantity(1);
                      setSubmitStatus('idle');
                    }}
                    className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>➕</span>
                    <span>ثبت محصول جدید دیگر</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
