import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "HonarHub | هنرهاب",
  description: "پلتفرم اختصاصی دست‌سازه‌های هنری و ارتباط بی‌واسطه با هنرمندان",
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

import { CartProvider } from './context/CartContext';
import { AuthProvider } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazirmatn.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <body className={`${vazirmatn.className} min-h-full flex flex-col font-sans`}>
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
