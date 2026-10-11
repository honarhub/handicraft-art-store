'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  tags: string[];
  isPublished: boolean;
  publishedAt: string;
  createdAt: string;
  specialty: { id: string; name: string } | null;
  artistProfile: { id: string; user: { name: string } } | null;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPosts = async (query = '') => {
    try {
      setLoading(true);
      const url = query ? `/api/admin/blog?search=${encodeURIComponent(query)}` : '/api/admin/blog';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error('Error fetching blog posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPosts(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`آیا از حذف مقاله "${title}" اطمینان دارید؟ این عملیات قابل بازگشت نیست.`)) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setPosts(prev => prev.filter(p => p.id !== id));
      } else {
        alert(data.error || 'خطا در حذف مقاله');
      }
    } catch (err) {
      alert('خطا در برقراری ارتباط');
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      const res = await fetch(`/api/admin/blog/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !post.isPublished }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, isPublished: !p.isPublished } : p));
      } else {
        alert(data.error || 'خطا در تغییر وضعیت انتشار');
      }
    } catch (err) {
      alert('خطا در ارتباط با سرور');
    }
  };

  const filteredPosts = posts.filter(post => {
    if (filterStatus === 'PUBLISHED') return post.isPublished;
    if (filterStatus === 'DRAFT') return !post.isPublished;
    return true;
  });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto font-sans" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <span>📝</span> مدیریت مقالات و وبلاگ
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            مشاهده، جستجو، ویرایش مقالات تولیدشده توسط هوش مصنوعی و انتشار مقالات جدید
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/blog/new"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 text-sm"
          >
            <span>➕</span> نوشتن مقاله جدید
          </Link>
          <a
            href="/blog"
            target="_blank"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors flex items-center gap-2 text-sm"
          >
            <span>🌐</span> مشاهده وبلاگ در سایت
          </a>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو در عنوان، تگ‌ها یا اسلاگ..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
          <span className="absolute left-3 top-3 text-slate-400">🔍</span>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-400 whitespace-nowrap ml-2">وضعیت:</span>
          {(['ALL', 'PUBLISHED', 'DRAFT'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterStatus === status
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {status === 'ALL' && `همه (${posts.length})`}
              {status === 'PUBLISHED' && `منتشر شده (${posts.filter(p => p.isPublished).length})`}
              {status === 'DRAFT' && `پیش‌نویس (${posts.filter(p => !p.isPublished).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Posts List / Table */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/70 shadow-sm">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-slate-500 text-sm font-medium">در حال دریافت مقالات وبلاگ...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200/70 shadow-sm">
          <div className="text-5xl mb-4 opacity-40">📭</div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">مقاله‌ای یافت نشد</h3>
          <p className="text-slate-400 text-sm mb-6">
            {search ? 'با عبارت جستجو شده مقاله‌ای تطابق ندارد.' : 'هنوز مقاله‌ای در وبلاگ ثبت نشده است.'}
          </p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
            >
              پاک کردن فیلتر جستجو
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-bold text-slate-500">
                  <th className="py-4 px-6">تصویر و عنوان مقاله</th>
                  <th className="py-4 px-4">دسته‌بندی / تخصص</th>
                  <th className="py-4 px-4">وضعیت</th>
                  <th className="py-4 px-4">تاریخ انتشار</th>
                  <th className="py-4 px-6 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* Title & Cover */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 relative border border-slate-200/60">
                          {post.coverImage ? (
                            <img
                              src={post.coverImage}
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl bg-amber-50 text-amber-700">
                              🎨
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/blog/${post.id}/edit`}
                            className="font-bold text-slate-800 hover:text-emerald-600 transition-colors line-clamp-1 block"
                          >
                            {post.title}
                          </Link>
                          <div className="text-xs text-slate-400 font-mono mt-0.5 line-clamp-1 dir-ltr text-right">
                            /blog/{post.slug}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Specialty / Tags */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {post.specialty ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-md text-xs font-bold">
                          {post.specialty.name}
                        </span>
                      ) : post.tags.length > 0 ? (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
                          {post.tags[0]}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">عمومی</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleTogglePublish(post)}
                        title="برای تغییر وضعیت کلیک کنید"
                        className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                          post.isPublished
                            ? 'bg-emerald-100/80 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${post.isPublished ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        {post.isPublished ? 'منتشر شده' : 'پیش‌نویس'}
                      </button>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-500">
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString('fa-IR')}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <a
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          title="مشاهده در سایت اصلی"
                          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                        >
                          👁️
                        </a>
                        <Link
                          href={`/admin/blog/${post.id}/edit`}
                          title="ویرایش مقاله و تصاویر"
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/70 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                        >
                          ✏️ ویرایش
                        </Link>
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          disabled={deletingId === post.id}
                          title="حذف مقاله"
                          className="p-2 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
