import prisma from '@/lib/prisma';
import Link from 'next/link';

export const metadata = {
  title: 'وبلاگ هنرهاب | مقالات و مطالب هنری',
  description: 'جدیدترین مقالات درباره صنایع دستی، هنرهای تجسمی و فرهنگ ایران زمین در وبلاگ هنرهاب.',
};

export default async function BlogIndex() {
  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12" dir="rtl">
      <header className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">مجله هنر و فرهنگ هنرهاب</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          داستان خلق آثار، معرفی سبک‌های هنری و راهنمای خرید اصیل‌ترین صنایع دستی ایران.
        </p>
      </header>

      {posts.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
          <p className="text-lg text-gray-500">هنوز مقاله‌ای منتشر نشده است.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <article 
              key={post.id} 
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group"
            >
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map(tag => (
                    <span key={tag} className="text-xs font-medium bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-amber-600 transition-colors">
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </h2>
                
                <p className="text-gray-600 mb-6 flex-1 line-clamp-3">
                  {post.excerpt || 'در این مقاله به بررسی یکی از جذاب‌ترین هنرهای دست‌ساز ایران می‌پردازیم...'}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-4">
                  <time dateTime={post.publishedAt.toISOString()}>
                    {new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(post.publishedAt)}
                  </time>
                  <Link href={`/blog/${post.slug}`} className="font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1">
                    ادامه مطلب
                    <svg className="w-4 h-4 mr-1 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
