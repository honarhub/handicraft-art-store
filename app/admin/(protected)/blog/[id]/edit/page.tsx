'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface BlogEditFormProps {
  id?: string; // if undefined, it's a new post
}

export default function BlogEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [postId, setPostId] = useState<string>('');
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [content, setContent] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingInText, setUploadingInText] = useState(false);
  const [tagsStr, setTagsStr] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [specialtyId, setSpecialtyId] = useState('');
  const [specialties, setSpecialties] = useState<{ id: string; name: string }[]>([]);

  // Sample quick craft images
  const sampleImages = [
    { label: 'سفالگری و کوزه', url: '/hero/pottery-vessel.png' },
    { label: 'میناکاری اصفهان', url: '/hero/mina-plate-blue.png' },
    { label: 'میناکاری بشقاب ۲', url: '/hero/mina-plate-blue-2.png' },
    { label: 'قلمزنی و گلاب‌پاش مس', url: '/hero/copper-ewer.png' },
    { label: 'فرش دستباف سرخ', url: '/hero/rug-red-rect.png' },
    { label: 'منبت‌کاری چوب', url: '/hero/wood-carving-panel.png' },
    { label: 'گلیم دست‌ساز', url: '/hero/rug-red-square.png' },
    { label: 'صندوقچه عتیقه خاتم', url: '/hero/antique-chest.png' },
  ];

  useEffect(() => {
    // 1. Fetch specialties list
    fetch('/api/specialties')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data)) setSpecialties(data);
      })
      .catch(console.error);

    // 2. Resolve params
    params.then(({ id }) => {
      setPostId(id);
      if (id === 'new') {
        setIsNew(true);
        setLoading(false);
      } else {
        fetchPostData(id);
      }
    });
  }, [params]);

  const fetchPostData = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/blog/${id}`);
      const data = await res.json();
      if (data.success && data.post) {
        const p = data.post;
        setTitle(p.title || '');
        setSlug(p.slug || '');
        setExcerpt(p.excerpt || '');
        setCoverImage(p.coverImage || '');
        setContent(p.content || '');
        setTagsStr((p.tags || []).join('، '));
        setIsPublished(p.isPublished ?? true);
        setSpecialtyId(p.specialtyId || '');
      } else {
        setError(data.error || 'مقاله یافت نشد');
      }
    } catch (err: any) {
      setError('خطا در دریافت اطلاعات مقاله');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    const tags = tagsStr
      .split(/[,،]/)
      .map(t => t.trim())
      .filter(Boolean);

    const payload = {
      title,
      slug,
      excerpt,
      coverImage: coverImage.trim() || null,
      content,
      tags,
      isPublished,
      specialtyId: specialtyId || null,
    };

    try {
      const url = isNew ? '/api/admin/blog' : `/api/admin/blog/${postId}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('تغییرات با موفقیت ذخیره شد.');
        setTimeout(() => {
          router.push('/admin/blog');
        }, 800);
      } else {
        setError(data.error || 'خطا در ذخیره‌سازی مقاله');
      }
    } catch (err: any) {
      setError('خطا در اتصال به سرور');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadFile = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/blog/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        return data.url;
      } else {
        alert(data.error || 'خطا در آپلود تصویر');
        return null;
      }
    } catch (err) {
      alert('خطا در برقراری ارتباط با سرور آپلود');
      return null;
    }
  };

  const onCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    const url = await handleUploadFile(file);
    if (url) {
      setCoverImage(url);
    }
    setUploadingCover(false);
    e.target.value = '';
  };

  const onInTextFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingInText(true);
    const url = await handleUploadFile(file);
    if (url) {
      const altText = prompt('توضیح کوتاه برای این تصویر (اختیاری):') || title || 'تصویر صنایع دستی';
      insertImageIntoContent(url, altText);
    }
    setUploadingInText(false);
    e.target.value = '';
  };

  const insertImageIntoContent = (imgUrl: string, altText: string) => {
    const imgHtml = `\n<figure class="my-6 text-center">\n  <img src="${imgUrl}" alt="${altText}" class="rounded-2xl max-h-96 mx-auto shadow-md border border-slate-100" />\n  <figcaption class="text-xs text-slate-500 mt-2">${altText}</figcaption>\n</figure>\n`;
    setContent(prev => prev + imgHtml);
  };

  if (loading) {
    return (
      <div className="p-12 text-center font-sans" dir="rtl">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-4"></div>
        <p className="text-slate-500 text-sm">در حال بارگذاری فرم...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto font-sans" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2">
            <Link href="/admin/blog" className="hover:text-emerald-600 transition">مدیریت وبلاگ</Link>
            <span>/</span>
            <span className="text-slate-600">{isNew ? 'مقاله جدید' : 'ویرایش مقاله'}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
            {isNew ? '✍️ نوشتن مقاله جدید' : `✏️ ویرایش: ${title}`}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/blog"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition"
          >
            انصراف و بازگشت
          </Link>
          {!isNew && slug && (
            <a
              href={`/blog/${slug}`}
              target="_blank"
              className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl text-sm border border-amber-200/60 transition"
            >
              👁️ مشاهده در سایت
            </a>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {success && (
        <div className="p-4 mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-bold flex items-center gap-2">
          <span>✅</span> {success}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200/80 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">عنوان مقاله *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: رازهای سر به مهر مینیاتور ایرانی"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-base"
            />
          </div>

          {/* Slug & Specialty Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                نامک یکتا (Slug برای URL)
                <span className="text-xs font-normal text-slate-400 mr-1.5">(اختیاری - خودکار تولید می‌شود)</span>
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="secrets-of-persian-miniature"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dir-ltr text-right"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">دسته‌بندی / هنر مرتبط</label>
              <select
                value={specialtyId}
                onChange={(e) => setSpecialtyId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              >
                <option value="">-- بدون دسته‌بندی خاص (عمومی) --</option>
                {specialties.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">خلاصه دو جمله‌ای (جهت کارت وبلاگ و سئو)</label>
            <textarea
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="یک خلاصه جذاب از مقاله که کاربر را ترغیب به خواندن کند..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white leading-relaxed"
            />
          </div>

          {/* Cover Image Management */}
          <div className="p-5 bg-slate-50/70 rounded-xl border border-slate-200/80">
            <label className="block text-sm font-bold text-slate-800 mb-2">🖼️ تصویر شاخص (کاور مقاله)</label>
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
              <input
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="آدرس اینترنتی یا مسیر عکس (مثال: /hero/mina-plate-blue.png)"
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono dir-ltr text-right"
              />

              {/* Upload Button */}
              <label className="cursor-pointer px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm whitespace-nowrap">
                {uploadingCover ? (
                  <>
                    <span className="inline-block animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>
                    <span>در حال آپلود...</span>
                  </>
                ) : (
                  <>
                    <span>📤</span>
                    <span>آپلود تصویر جدید</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={onCoverFileChange}
                  disabled={uploadingCover}
                  className="hidden"
                />
              </label>

              {coverImage && (
                <button
                  type="button"
                  onClick={() => setCoverImage('')}
                  className="px-3 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-xl transition whitespace-nowrap"
                >
                  حذف کاور
                </button>
              )}
            </div>

            {/* Quick Preset Image Buttons */}
            <div className="mt-3">
              <span className="text-xs font-bold text-slate-500 block mb-2">انتخاب سریع از گالری آثار استاندارد هنرهاب:</span>
              <div className="flex flex-wrap gap-2">
                {sampleImages.map((img) => (
                  <button
                    key={img.url}
                    type="button"
                    onClick={() => setCoverImage(img.url)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${
                      coverImage === img.url
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>🖼️</span> {img.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Preview */}
            {coverImage && (
              <div className="mt-4 pt-4 border-t border-slate-200/60">
                <span className="text-xs font-bold text-slate-400 block mb-2">پیش‌نمایش تصویر کاور:</span>
                <div className="w-full max-w-sm h-48 rounded-xl overflow-hidden border border-slate-300 relative bg-white shadow-sm">
                  <img
                    src={coverImage}
                    alt="پیش‌نمایش کاور"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Content Editor with Quick Insert */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-slate-700">
                محتوای مقاله (فرمت HTML وبلاگ) *
              </label>
              <div className="text-xs text-slate-400">
                پشتیبانی از تگ‌های &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;img&gt;
              </div>
            </div>

            {/* In-text image insert toolbar */}
            <div className="p-3 bg-slate-100/80 rounded-t-xl border border-b-0 border-slate-200 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-600">افزودن عکس درون متن:</span>
              
              {/* Upload image to content */}
              <label className="cursor-pointer px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold transition flex items-center gap-1 shadow-sm">
                {uploadingInText ? (
                  <span>در حال آپلود...</span>
                ) : (
                  <>
                    <span>📤</span>
                    <span>آپلود و درج عکس جدید</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={onInTextFileChange}
                  disabled={uploadingInText}
                  className="hidden"
                />
              </label>

              <div className="w-px h-4 bg-slate-300 mx-1"></div>

              {sampleImages.slice(0, 5).map((img) => (
                <button
                  key={img.url}
                  type="button"
                  onClick={() => insertImageIntoContent(img.url, img.label)}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-md border border-slate-200 transition font-medium"
                >
                  + عکس {img.label}
                </button>
              ))}
            </div>

            <textarea
              required
              rows={16}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="<p>پاراگراف اول مقاله...</p>\n<h2>عنوان بخش دوم</h2>\n<p>متن توضیحات...</p>"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-b-xl text-slate-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white leading-relaxed dir-ltr text-right"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              برچسب‌ها / تگ‌ها
              <span className="text-xs font-normal text-slate-400 mr-1.5">(با کاما یا ویرگول فارسی جدا کنید)</span>
            </label>
            <input
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="میناکاری، صنایع دستی ایران، خرید هدیه، هنرهاب"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Publish Checkbox */}
          <div className="pt-2">
            <label className="inline-flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-500 border-slate-300"
              />
              <span className="text-sm font-bold text-slate-700">این مقاله در وبلاگ منتشر شود (عمومی باشد)</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/admin/blog"
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition"
          >
            انصراف
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 text-sm transition-all flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="inline-block animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                <span>در حال ذخیره...</span>
              </>
            ) : (
              <span>💾 ذخیره تغییرات</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
