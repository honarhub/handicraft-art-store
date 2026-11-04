import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import { toPersianDigits, formatPersianDateTime } from '@/lib/date';
import DeleteTestOrderButton from './DeleteTestOrderButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CustomerOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login?callbackUrl=/panel/orders');

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              artist: {
                select: {
                  id: true,
                  brandName: true,
                  user: { select: { name: true } }
                }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-5 font-sans" dir="rtl">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>📦</span>
            <span>سفارش‌های من</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            پیگیری مراحل آماده‌سازی، ارسال و سابقه خریدهای شما در هنرهاب
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700">
          مجموع سفارش‌ها: {toPersianDigits(orders.length)}
        </span>
      </div>

      {/* Orders List */}
      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusBadge = {
              PENDING: { text: 'در انتظار پرداخت', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
              PAID: { text: 'پرداخت شده / تایید سفارش', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
              PROCESSING: { text: 'در حال ساخت و آماده‌سازی توسط هنرمند', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
              SHIPPED: { text: 'ارسال شده با پست پیشتاز', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
              DELIVERED: { text: 'تحویل داده شده', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              CANCELLED: { text: 'لغو شده', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
            }[order.status] || { text: order.status, cls: 'bg-slate-100 text-slate-600 border-slate-200' };

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4 hover:shadow-md transition-shadow"
              >
                {/* Order Meta Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-black text-sm text-slate-900">
                      سفارش #{order.id.slice(-6).toUpperCase()}
                    </span>
                    {order.isTest && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                        🧪 سفارش آزمایشی
                      </span>
                    )}
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-medium">
                      {formatPersianDateTime(order.createdAt)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    <span className={`text-xs font-bold px-3 py-1 rounded-xl border ${statusBadge.cls}`}>
                      {statusBadge.text}
                    </span>
                    {order.isTest && (
                      <DeleteTestOrderButton orderId={order.id} />
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-slate-100">
                  {order.items.map((item) => {
                    const artistName = item.product?.artist?.brandName || item.product?.artist?.user?.name || 'هنرمند';
                    return (
                      <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 relative shrink-0 border border-slate-200">
                            {item.product?.imageUrl && (
                              <Image
                                src={item.product.imageUrl}
                                alt={item.product.title}
                                fill
                                sizes="56px"
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/product/${item.productId}`}
                              className="font-bold text-xs sm:text-sm text-slate-800 hover:text-teal-700 transition-colors line-clamp-1"
                            >
                              {item.product?.title || 'اثر هنری'}
                            </Link>
                            <div className="text-[11px] text-slate-500 mt-1">
                              آفریننده: <span className="font-bold text-teal-800">{artistName}</span> • تعداد: {toPersianDigits(item.quantity)}
                            </div>
                          </div>
                        </div>

                        <div className="text-left font-black text-xs sm:text-sm text-slate-900 shrink-0">
                          {toPersianDigits((item.priceAtTime * item.quantity).toLocaleString())} تومان
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Order Footer Total */}
                <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">
                    مبلغ کل پرداخت‌شده:
                  </span>
                  <span className="text-base sm:text-lg font-black text-slate-900">
                    {toPersianDigits(order.total.toLocaleString())} تومان
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-100 text-slate-500 flex items-center justify-center text-3xl">
            📦
          </div>
          <h3 className="font-black text-slate-800 text-base">هنوز هیچ سفارشی ثبت نکرده‌اید!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            با خرید آثار اصیل، از دست‌های سازنده هنرمندان ایرانی پشتیبانی کنید.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-sm transition-colors"
          >
            <span>مشاهده گالری آثار</span>
          </Link>
        </div>
      )}
    </div>
  );
}
