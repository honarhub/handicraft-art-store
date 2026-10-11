import prisma from '@/lib/prisma';
import Link from 'next/link';
import SiteHeader from '@/app/components/SiteHeader';
import SiteFooter from '@/app/components/SiteFooter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'وبلاگ هنرهاب | مجله فرهنگ و صنایع دستی ایران',
  description: 'جدیدترین مقالات درباره صنایع دستی، هنرهای تجسمی و فرهنگ ایران زمین در وبلاگ هنرهاب.',
};

export default async function BlogIndex() {
  let posts: any[] = [];
  try {
    posts = await prisma.blogPost.findMany({
      where: { isPublished: true },
      include: {
        specialty: { select: { name: true } }
      },
      orderBy: { publishedAt: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching blog posts in BlogIndex:', error);
    posts = [];
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans" dir="rtl">
      <SiteHeader />

      <main className="flex-1 max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16 w-full">
        <header className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold mb-4 border border-emerald-200/60">
            <span>✨</span> مجله هنر و فرهنگ
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            مجله فرهنگی و هنری هنرهاب
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed font-medium">
            روایت خلق شاهکارها، کشف تاریخچه دست‌سازه‌های اصیل ایران و راهنمای تخصصی خرید آثار بی‌واسطه از هنرمندان.
          </p>
        </header>

        {posts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 max-w-md mx-auto shadow-sm">
            <div className="text-5xl mb-4 opacity-50">✍️</div>
            <p className="text-lg font-bold text-slate-700 mb-1">هنوز مقاله‌ای منتشر نشده است.</p>
            <p className="text-sm text-slate-400">به زودی مقالات جدید هوش مصنوعی در این بخش قرار می‌گیرند.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article 
                key={post.id} 
                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 border border-slate-200/80 flex flex-col group"
              >
                {/* Cover Image Container */}
                <div className="aspect-[16/10] w-full relative overflow-hidden bg-slate-100">
                  {post.coverImage ? (
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-amber-50 to-orange-100 text-amber-600">
                      🎨
                    </div>
                  )}

                  {/* Specialty Badge */}
                  {post.specialty && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="px-3 py-1 bg-white/95 backdrop-blur-md text-emerald-800 text-xs font-bold rounded-lg shadow-sm border border-emerald-100">
                        {post.specialty.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 md:p-7 flex-1 flex flex-col">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {post.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <h2 className="text-xl font-black text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-snug">
                    <Link href={`/blog/${post.slug}`}>
                      {post.title}
                    </Link>
                  </h2>
                  
                  <p className="text-slate-500 text-sm mb-6 flex-1 line-clamp-3 leading-relaxed">
                    {post.excerpt || 'در این مقاله به بررسی یکی از زیباترین هنرهای اصیل ایران زمین و ویژگی‌های خرید آن می‌پردازیم...'}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-4 mt-auto">
                    <time dateTime={post.publishedAt.toISOString()}>
                      {new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(post.publishedAt)}
                    </time>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="font-bold text-emerald-600 group-hover:text-emerald-700 flex items-center gap-1.5 text-xs transition-colors"
                    >
                      ادامه مطالعه
                      <span className="group-hover:translate-x-[-3px] transition-transform">←</span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
