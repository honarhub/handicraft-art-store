'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { formatPersianDate, formatPersianTime, formatPersianDateTime } from '@/lib/date';

interface UserItem {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  phoneNumber: string | null;
  image: string | null;
  role: 'USER' | 'ARTIST' | 'ADMIN';
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  _count: {
    orders: number;
    addresses: number;
    wishlistItems: number;
  };
}

interface UserStats {
  total: number;
  active: number;
  artists: number;
  admins: number;
}

const toPersianDigits = (num: number | string) =>
  String(num).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [stats, setStats] = useState<UserStats>({ total: 0, active: 0, artists: 0, admins: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'orders' | 'addresses' | 'wishlist'>('info');

  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    role: 'USER',
    isActive: true
  });
  const [actionLoading, setActionLoading] = useState(false);

  const [deleteTargetUser, setDeleteTargetUser] = useState<UserItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (roleFilter !== 'ALL') params.set('role', roleFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        setStats(data.stats);
      }
    } catch {
      showAlert('error', 'خطا در بارگذاری لیست کاربران');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  // View User Details
  const handleOpenDetails = async (userId: string) => {
    setShowDetailModal(true);
    setDetailLoading(true);
    setActiveDetailTab('info');
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedUser(data.user);
      } else {
        showAlert('error', data.error || 'خطا در دریافت جزئیات کاربر');
        setShowDetailModal(false);
      }
    } catch {
      showAlert('error', 'خطا در دریافت جزئیات کاربر');
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (u: UserItem) => {
    setEditingUser(u);
    setEditFormData({
      name: u.name || '',
      email: u.email || '',
      phoneNumber: u.phoneNumber || '',
      role: u.role,
      isActive: u.isActive
    });
    setShowEditModal(true);
  };

  // Submit Edit Form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در ذخیره تغییرات');
      }
      showAlert('success', 'مشخصات کاربر با موفقیت به‌روزرسانی شد');
      setShowEditModal(false);
      fetchUsers();
    } catch (err: any) {
      showAlert('error', err.message || 'خطا در ذخیره تغییرات');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Active/Inactive Status
  const handleToggleActive = async (u: UserItem) => {
    const newStatus = !u.isActive;
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در تغییر وضعیت');
      }
      showAlert('success', `حساب کاربری «${u.name || u.phoneNumber || u.email}» ${newStatus ? 'فعال' : 'غیرفعال'} شد`);
      setUsers(prev => prev.map(item => item.id === u.id ? { ...item, isActive: newStatus } : item));
    } catch (err: any) {
      showAlert('error', err.message || 'خطا در تغییر وضعیت');
    }
  };

  // Delete User
  const handleConfirmDelete = async () => {
    if (!deleteTargetUser) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteTargetUser.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در حذف کاربر');
      }
      showAlert('success', 'حساب کاربر با موفقیت بایگانی/حذف شد');
      setShowDeleteModal(false);
      setDeleteTargetUser(null);
      fetchUsers();
    } catch (err: any) {
      showAlert('error', err.message || 'خطا در حذف کاربر');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2 py-0.5 rounded-md border border-purple-200">مدیر کل</span>;
      case 'ARTIST':
        return <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-md border border-amber-200">هنرمند</span>;
      default:
        return <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-md border border-emerald-200">هنردوست</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans" dir="rtl">
      {/* Toast Notification */}
      {alertMsg && (
        <div className={`fixed top-6 left-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-bold animate-in fade-in slide-in-from-top-4 flex items-center gap-2 ${
          alertMsg.type === 'success' ? 'bg-emerald-600 text-white shadow-emerald-600/30' : 'bg-red-600 text-white shadow-red-600/30'
        }`}>
          <span>{alertMsg.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Header and Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            مدیریت کاربران و هنردوستان
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            مشاهده، ویرایش مشخصات، تغییر سطح دسترسی و بررسی تاریخچه فعالیت کاربران هنرهاب
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-bold mb-1">کل کاربران ثبت‌شده</div>
          <div className="text-2xl font-black text-slate-800">{toPersianDigits(stats.total)}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-emerald-600 font-bold mb-1">حساب‌های فعال</div>
          <div className="text-2xl font-black text-emerald-700">{toPersianDigits(stats.active)}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-amber-600 font-bold mb-1">هنرمندان پلتفرم</div>
          <div className="text-2xl font-black text-amber-700">{toPersianDigits(stats.artists)}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-purple-600 font-bold mb-1">مدیران ارشد</div>
          <div className="text-2xl font-black text-purple-700">{toPersianDigits(stats.admins)}</div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو با نام، شماره موبایل یا ایمیل..."
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 text-xs sm:text-sm outline-none transition"
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="ALL">تمام نقش‌ها</option>
            <option value="USER">هنردوستان (عادی)</option>
            <option value="ARTIST">هنرمندان</option>
            <option value="ADMIN">مدیران کل</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="ALL">تمام وضعیت‌ها</option>
            <option value="ACTIVE">فقط فعال</option>
            <option value="INACTIVE">فقط غیرفعال</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium text-xs sm:text-sm">
            در حال بارگذاری لیست کاربران...
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-bold text-xs sm:text-sm">
            هیچ کاربری با مشخصات وارد شده یافت نشد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold text-[11px] sm:text-xs">
                  <th className="py-3 px-4">کاربر / هویت</th>
                  <th className="py-3 px-4">اطلاعات تماس</th>
                  <th className="py-3 px-4">فعالیت</th>
                  <th className="py-3 px-4">زمان عضویت</th>
                  <th className="py-3 px-4 text-center">وضعیت</th>
                  <th className="py-3 px-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* User Profile */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {u.image ? (
                            <img src={u.image} alt={u.name || ''} className="w-full h-full rounded-xl object-cover" />
                          ) : (
                            u.name ? u.name[0] : 'هـ'
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>{u.name || 'بدون نام'}</span>
                            {getRoleBadge(u.role)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            ID: {u.id.slice(0, 10)}...
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs text-slate-800 font-bold">
                        {u.phoneNumber ? toPersianDigits(u.phoneNumber) : '—'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono truncate max-w-[180px] mt-0.5">
                        {u.email || 'ایمیل ثبت‌نشده'}
                        {u.email && u.emailVerified && (
                          <span className="text-emerald-600 font-sans mr-1" title="ایمیل تایید شده">✓</span>
                        )}
                      </div>
                    </td>

                    {/* Activity Stats */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                        <span title="سفارش‌ها">📦 {toPersianDigits(u._count.orders)}</span>
                        <span>•</span>
                        <span title="آدرس‌ها">📍 {toPersianDigits(u._count.addresses)}</span>
                        <span>•</span>
                        <span title="علاقه‌مندی‌ها">🔖 {toPersianDigits(u._count.wishlistItems)}</span>
                      </div>
                    </td>

                    {/* Join Date */}
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div className="font-bold text-slate-700">{formatPersianDate(u.createdAt, { format: 'numeric' })}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        ساعت {formatPersianTime(u.createdAt)}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        u.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                        <span>{u.isActive ? 'فعال' : 'غیرفعال'}</span>
                      </span>
                    </td>

                    {/* Actions: View, Edit, Toggle Active, Delete */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        {/* View Details */}
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(u.id)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                          title="نمایش جزئیات کامل"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition cursor-pointer"
                          title="ویرایش کاربر"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            <path d="m15 5 4 4" />
                          </svg>
                        </button>

                        {/* Toggle Active / Inactive */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(u)}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            u.isActive
                              ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
                              : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                          }`}
                          title={u.isActive ? 'غیرفعال‌سازی حساب' : 'فعال‌سازی حساب'}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                            <line x1="12" y1="2" x2="12" y2="12" />
                          </svg>
                        </button>

                        {/* Delete / Archive */}
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTargetUser(u);
                            setShowDeleteModal(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                          title="حذف / بایگانی کاربر"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: VIEW USER DETAILS */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                  {selectedUser?.name ? selectedUser.name[0] : 'هـ'}
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                    <span>{selectedUser?.name || 'کاربر بدون نام'}</span>
                    {selectedUser && getRoleBadge(selectedUser.role)}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    ID: {selectedUser?.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 px-5 gap-4 text-xs font-bold bg-white">
              <button
                type="button"
                onClick={() => setActiveDetailTab('info')}
                className={`py-3 border-b-2 transition cursor-pointer ${
                  activeDetailTab === 'info'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                اطلاعات هویتی
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailTab('orders')}
                className={`py-3 border-b-2 transition cursor-pointer ${
                  activeDetailTab === 'orders'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                سفارش‌ها ({toPersianDigits(selectedUser?._count?.orders ?? 0)})
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailTab('addresses')}
                className={`py-3 border-b-2 transition cursor-pointer ${
                  activeDetailTab === 'addresses'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                آدرس‌ها ({toPersianDigits(selectedUser?._count?.addresses ?? 0)})
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailTab('wishlist')}
                className={`py-3 border-b-2 transition cursor-pointer ${
                  activeDetailTab === 'wishlist'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                علاقه‌مندی‌ها ({toPersianDigits(selectedUser?._count?.wishlistItems ?? 0)})
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {detailLoading ? (
                <div className="p-8 text-center text-slate-400 font-medium text-xs">
                  در حال بارگذاری اطلاعات کاربر...
                </div>
              ) : selectedUser ? (
                <>
                  {/* TAB 1: INFO */}
                  {activeDetailTab === 'info' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                        <span className="text-slate-400 block font-medium">شماره موبایل:</span>
                        <span className="font-mono text-sm font-bold text-slate-800 dir-ltr inline-block">
                          {selectedUser.phoneNumber || 'ثبت‌نشده'}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                        <span className="text-slate-400 block font-medium">ایمیل:</span>
                        <span className="font-mono text-xs font-bold text-slate-800 dir-ltr inline-block">
                          {selectedUser.email || 'ثبت‌نشده'}
                        </span>
                        {selectedUser.email && (
                          <span className={`block text-[10px] font-bold ${selectedUser.emailVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {selectedUser.emailVerified ? '✓ تایید شده' : '⏳ در انتظار تایید'}
                          </span>
                        )}
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                        <span className="text-slate-400 block font-medium">وضعیت حساب:</span>
                        <span className={`font-bold ${selectedUser.isActive ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {selectedUser.isActive ? 'فعال و مجاز به استفاده از خدمات' : 'مسدود / غیرفعال شده توسط مدیریت'}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                        <span className="text-slate-400 block font-medium">تاریخ و زمان ثبت‌نام:</span>
                        <span className="font-bold text-slate-700">
                          {formatPersianDateTime(selectedUser.createdAt)}
                        </span>
                      </div>
                      {selectedUser.artistProfile && (
                        <div className="col-span-1 sm:col-span-2 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                          <span className="text-amber-800 font-bold block">پروفایل هنرمندی:</span>
                          <p className="text-slate-700 text-xs">
                            برند هنری: <strong>{selectedUser.artistProfile.brandName || 'تنظیم نشده'}</strong> | سطح احراز: {toPersianDigits(selectedUser.artistProfile.verificationLevel)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: ORDERS */}
                  {activeDetailTab === 'orders' && (
                    <div className="space-y-3">
                      {selectedUser.orders.length === 0 ? (
                        <p className="text-center text-slate-400 text-xs py-8">هیچ سفارشی ثبت نشده است.</p>
                      ) : (
                        selectedUser.orders.map((o: any) => (
                          <div key={o.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
                            <div>
                              <div className="font-bold text-slate-800 flex items-center gap-2">
                                <span>کد سفارش: {o.id.slice(0, 8)}</span>
                                <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px]">
                                  {o.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1">
                                <span className="font-bold text-slate-700">{formatPersianDateTime(o.createdAt)}</span> • {toPersianDigits(o.items?.length || 0)} قلم کالا
                              </p>
                            </div>
                            <div className="font-bold text-emerald-700 font-mono text-sm">
                              {toPersianDigits(Number(o.totalAmount || 0).toLocaleString())} تومان
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 3: ADDRESSES */}
                  {activeDetailTab === 'addresses' && (
                    <div className="space-y-3">
                      {selectedUser.addresses.length === 0 ? (
                        <p className="text-center text-slate-400 text-xs py-8">هیچ آدرسی ثبت نشده است.</p>
                      ) : (
                        selectedUser.addresses.map((addr: any) => (
                          <div key={addr.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs space-y-1">
                            <div className="flex items-center justify-between font-bold text-slate-800">
                              <span>📍 {addr.title || 'آدرس'} ({addr.province} - {addr.city})</span>
                              {addr.isDefault && (
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">پیش‌فرض</span>
                              )}
                            </div>
                            <p className="text-slate-600 text-[11px]">{addr.address}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              گیرنده: {addr.receiverName} • موبایل: {toPersianDigits(addr.receiverPhone)} • کدپستی: {toPersianDigits(addr.postalCode || '—')}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 4: WISHLIST */}
                  {activeDetailTab === 'wishlist' && (
                    <div className="space-y-2">
                      {selectedUser.wishlistItems.length === 0 ? (
                        <p className="text-center text-slate-400 text-xs py-8">هیچ محصولی در لیست علاقه‌مندی‌ها وجود ندارد.</p>
                      ) : (
                        selectedUser.wishlistItems.map((w: any) => (
                          <div key={w.id} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                            <div className="font-bold text-slate-800">
                              {w.product?.title || 'محصول'}
                            </div>
                            <Link
                              href={`/product/${w.productId}`}
                              target="_blank"
                              className="text-emerald-700 hover:underline text-[11px] font-bold"
                            >
                              مشاهده محصول ↗
                            </Link>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT USER */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                ویرایش مشخصات کاربر
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نام و نام خانوادگی:
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="نام کاربر"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  شماره موبایل:
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={editFormData.phoneNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                  placeholder="09123456789"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-emerald-600 font-mono text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  آدرس ایمیل:
                </label>
                <input
                  type="email"
                  dir="ltr"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-emerald-600 font-mono text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نقش کاربری:
                </label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-emerald-600 bg-white cursor-pointer"
                >
                  <option value="USER">هنردوست (کاربر عادی)</option>
                  <option value="ARTIST">هنرمند رسمی</option>
                  <option value="ADMIN">مدیر ارشد (Admin)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={editFormData.isActive}
                  onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="isActiveCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  حساب کاربری فعال و مجاز باشد
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION */}
      {showDeleteModal && deleteTargetUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 mx-auto flex items-center justify-center text-xl">
              🗑️
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                بایگانی و حذف کاربر
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                آیا از حذف و بایگانی حساب کاربری «{deleteTargetUser.name || deleteTargetUser.phoneNumber || deleteTargetUser.email}» اطمینان دارید؟ با این کار دسترسی ورود کاربر مسدود می‌شود.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTargetUser(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'در حال حذف...' : 'تایید و حذف'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
