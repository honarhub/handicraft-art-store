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
                  <th className="py-4 px-6 text-right">تصویر و عنوان مقاله</th>
                  <th className="py-4 px-4 text-right">دسته‌بندی / تخصص</th>
                  <th className="py-4 px-4 text-center">وضعیت نمایش</th>
                  <th className="py-4 px-4 text-center">تاریخ انتشار</th>
                  <th className="py-4 px-6 text-left">عملیات</th>
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

                    {/* Status Toggle Switch (Exact as in Artists Page) */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <button 
                          type="button"
                          dir="ltr"
                          onClick={() => handleTogglePublish(post)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${post.isPublished ? 'bg-emerald-500' : 'bg-slate-300'}`}
                          title={post.isPublished ? 'غیرفعال کردن نمایش (پیش‌نویس)' : 'فعال کردن نمایش (انتشار عمومی)'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              post.isPublished ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className="text-[10px] font-bold text-slate-400">
                          {post.isPublished ? 'منتشر شده' : 'پیش‌نویس'}
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 text-center whitespace-nowrap text-xs text-slate-500 font-medium">
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString('fa-IR')}
                    </td>

                    {/* Actions (Exact match to artists table design & icons) */}
                    <td className="py-4 px-6 text-left whitespace-nowrap">
                      <div className="flex justify-end items-center gap-2">
                        {/* View in new tab */}
                        <a
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="مشاهده مقاله"
                          className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold flex items-center gap-1 border border-transparent hover:border-blue-100"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                          مشاهده
                        </a>

                        {/* Edit post */}
                        <Link
                          href={`/admin/blog/${post.id}/edit`}
                          title="ویرایش مقاله"
                          className="text-emerald-500 hover:bg-emerald-50 p-2 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </Link>

                        {/* Delete post */}
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          disabled={deletingId === post.id}
                          title="حذف مقاله"
                          className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors border border-transparent hover:border-red-100 disabled:opacity-50"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
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
