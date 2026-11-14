import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './providers';
import OnlineSupportWidget from './components/OnlineSupportWidget';

const vazirmatn = localFont({
  src: "./fonts/Vazirmatn[wght].woff2",
  variable: "--font-vazirmatn",
  display: "swap",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  display: "swap",
  weight: "100 900",
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://honarhub.com';

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "هنرهاب | بازار آنلاین صنایع دستی و دست‌سازه‌های اصیل ایرانی",
    template: "%s | هنرهاب",
  },
  description: "هنرهاب (HonarHub)؛ سامانه جامع خرید مستقیم و بی‌واسطه دست‌سازه‌ها و صنایع دستی اصیل ایرانی از اساتید و هنرمندان با شناسنامه دیجیتال اصالت کالا.",
  keywords: [
    "صنایع دستی",
    "خرید صنایع دستی",
    "دست سازه های ایرانی",
    "میناکاری",
    "خاتم کاری",
    "فیروزه کوبی",
    "قلمزنی",
    "فرش دستباف",
    "گلیم و جاجیم",
    "سفالگری سنتی",
    "حمایت از هنرمندان ایرانی",
    "صنایع دستی اصفهان",
    "هنرهاب",
    "HonarHub",
  ],
  authors: [{ name: "هنرهاب (HonarHub)", url: baseUrl }],
  creator: "تیم توسعه هنرهاب",
  publisher: "هنرهاب - پلتفرم اختصاصی صنایع دستی ایران",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
    languages: {
      "fa-IR": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: baseUrl,
    siteName: "هنرهاب | HonarHub",
    title: "هنرهاب | بازار آنلاین صنایع دستی و دست‌سازه‌های اصیل ایرانی",
    description: "خرید مستقیم و بی‌واسطه دست‌سازه‌های فاخر ایرانی از اساتید با شناسنامه اصالت دیجیتال و ارسال مطمئن.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "هنرهاب - بازار آنلاین صنایع دستی اصیل ایران",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "هنرهاب | بازار آنلاین صنایع دستی و دست‌سازه‌های اصیل ایرانی",
    description: "خرید بی‌واسطه صنایع دستی اصیل ایرانی از هنرمندان با گواهی اصالت.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico?v=7', sizes: 'any' },
      { url: '/icon.png?v=7', type: 'image/png', sizes: '192x192' },
    ],
    apple: [
      { url: '/apple-icon.png?v=7' },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Global structured data schemas (Organization & WebSite with SearchAction)
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: 'هنرهاب',
    alternateName: 'HonarHub',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: 'بازار تخصصی صنایع دستی و دست‌سازه‌های اصیل ایرانی با ارتباط بی‌واسطه میان هنرمندان و خریداران.',
    sameAs: [
      'https://www.instagram.com/honarhub',
      'https://t.me/honarhub',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: ['Persian', 'fa'],
      url: `${baseUrl}/support`,
    },
  };

  const webSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    url: baseUrl,
    name: 'هنرهاب | HonarHub',
    description: 'بازار آنلاین دست‌سازه‌های فاخر و صنایع دستی ایران',
    publisher: {
      '@id': `${baseUrl}/#organization`,
    },
    inLanguage: 'fa-IR',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/products?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazirmatn.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
      </head>
      <body className={`${vazirmatn.className} min-h-full flex flex-col font-sans`}>
        <AuthProvider>
          <CartProvider>
            {children}
            <OnlineSupportWidget />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
