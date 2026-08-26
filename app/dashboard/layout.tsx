import React from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans" dir="rtl">
      <header className="bg-emerald-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight">پنل مدیریت هنرآفرین</h1>
          <nav className="flex gap-4 text-sm font-medium">
            <a href="/" className="hover:text-emerald-200 transition-colors">مشاهده سایت</a>
            <a href="/api/auth/signout" className="hover:text-red-300 transition-colors">خروج</a>
          </nav>
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
