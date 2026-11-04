'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteTestOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm('آیا از حذف این سفارش آزمایشی (تستی) اطمینان دارید؟ این سفارش به طور کامل از سوابق شما پاک خواهد شد.');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/user/orders/${orderId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.refresh();
      } else {
        alert(data.error || 'خطا در حذف سفارش');
      }
    } catch {
      alert('خطا در برقراری ارتباط با سرور');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      title="حذف سفارش آزمایشی"
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      <span>{isDeleting ? 'در حال حذف...' : 'حذف سفارش آزمایشی'}</span>
    </button>
  );
}
