import type { Metadata } from "next";
import { Vazirmatn, Geist_Mono } from "next/font/google";
import "./globals.css";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
  display: "swap",
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HonarHub | هنرهاب",
  description: "پلتفرم اختصاصی دست‌سازه‌های هنری و ارتباط بی‌واسطه با هنرمندان",
  icons: {
    icon: [
      { url: '/favicon.ico?v=5', sizes: 'any' },
      { url: '/icon.png?v=5', type: 'image/png' },
      { url: '/favicon.svg?v=5', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.png?v=5' },
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
