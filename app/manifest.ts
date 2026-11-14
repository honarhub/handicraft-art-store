import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'هنرهاب | بازار آنلاین صنایع دستی و دست‌سازه‌های ایران',
    short_name: 'هنرهاب',
    description: 'سامانه خرید بی‌واسطه صنایع دستی اصیل ایرانی از اساتید و هنرمندان با شناسنامه اصالت',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#059669',
    icons: [
      {
        src: '/icon.png?v=7',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png?v=7',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
