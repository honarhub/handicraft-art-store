import React from 'react';
import { HomeClient } from './HomeClient';
import { mockProduct } from './data/mockData';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  // در دنیای واقعی، این داده‌ها از دیتابیس یا مستقیماً از API هوش مصنوعی دریافت می‌شوند
  const { seo } = mockProduct;
  
  return {
    title: seo.metaTitle,
    description: seo.metaDescription,
    keywords: seo.keywords.join(', '),
    openGraph: {
      title: seo.metaTitle,
      description: seo.metaDescription,
      images: [mockProduct.imageUrl],
    }
  };
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 py-6 px-4 md:px-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-black text-emerald-800 tracking-tight">
            هنرآفرین <span className="text-gray-400 font-light">| بازارچه آثار دست‌ساز</span>
          </div>
          <nav className="hidden md:flex gap-6 text-gray-600 font-medium">
            <a href="#" className="hover:text-emerald-600 transition-colors">هنرمندان</a>
            <a href="#" className="hover:text-emerald-600 transition-colors">مجموعه‌ها</a>
            <a href="#" className="hover:text-emerald-600 transition-colors">درباره ما</a>
          </nav>
        </div>
      </header>

      <main className="flex-1 py-12 px-4 md:px-8">
        <div className="max-w-6xl mx-auto mb-12 text-center">
          <h2 className="text-sm font-bold text-emerald-600 tracking-widest uppercase mb-3">محصول ویژه (MVP)</h2>
          <p className="text-gray-600">این یک پیش‌نمایش از نحوه قرارگیری محصولات هنری در پلتفرم شماست.</p>
        </div>

        <HomeClient product={mockProduct} />
      </main>

      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <p>ساخته شده برای هنرمندان مستقل - {new Date().getFullYear()}</p>
        <p className="mt-2 text-gray-500">تمامی کدها به صورت ماژولار و استاندارد توسعه داده شده است.</p>
      </footer>
    </div>
  );
}
