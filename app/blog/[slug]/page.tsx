import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug, isPublished: true }
  });

  if (!post) {
    return { title: 'پیدا نشد | هنرهاب' };
  }

  const meta = post.seoMeta as any;

  return {
    title: meta?.title || `${post.title} | مجله هنرهاب`,
    description: meta?.description || post.excerpt,
    keywords: meta?.keywords,
    openGraph: {
      title: meta?.title || post.title,
      description: meta?.description || post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt.toISOString(),
      tags: post.tags,
    }
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  
  const post = await prisma.blogPost.findUnique({
    where: { slug, isPublished: true }
  });

  if (!post) {
    notFound();
  }

  // Generate JSON-LD for AI Bots (AIO) and Google SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || (post.seoMeta as any)?.description,
    author: {
      '@type': 'Organization',
      name: 'هنرهاب (HonarHub)',
      url: 'https://honarhub.com'
    },
    publisher: {
      '@type': 'Organization',
      name: 'هنرهاب',
      logo: {
        '@type': 'ImageObject',
        url: 'https://honarhub.com/logo.png'
      }
    },
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    keywords: post.tags.join(', ')
  };

  return (
    <div className="bg-white min-h-screen pb-20" dir="rtl">
      {/* Inject JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="max-w-3xl mx-auto px-4 pt-16 md:pt-24">
        <header className="mb-12 text-center">
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {post.tags.map(tag => (
              <span key={tag} className="text-sm font-medium bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-100">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
            {post.title}
          </h1>
          <div className="text-gray-500 text-sm flex items-center justify-center gap-4">
            <time dateTime={post.publishedAt.toISOString()}>
              انتشار: {new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(post.publishedAt)}
            </time>
            <span>•</span>
            <span>مجله هنرهاب</span>
          </div>
        </header>

        {/* 
          Using prose for styling the generated HTML content safely.
          The AI will inject <h2>, <p>, and <a> tags pointing to products.
        */}
        <div 
          className="prose prose-lg prose-amber mx-auto prose-headings:font-bold prose-a:text-amber-600 hover:prose-a:text-amber-700 prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <hr className="my-16 border-gray-200" />
        
        <footer className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-4">به دنبال آثار اصیل هستید؟</h3>
          <p className="text-gray-600 mb-6">
            در هنرهاب می‌توانید آثار هنرمندان برجسته ایرانی را به صورت مستقیم و بدون واسطه خریداری کنید.
          </p>
          <Link 
            href="/products" 
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition-colors"
          >
            مشاهده گالری محصولات
          </Link>
        </footer>
      </article>
    </div>
  );
}
