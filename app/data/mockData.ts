import { Product } from '../types';

export const mockProduct: Product = {
  id: 'prod-pickle-rick-001',
  title: 'ست جا فندکی و زیرسیگاری دست‌ساز مدل ریک و مورتی (Pickle Rick)',
  description: 'یک قطعه هنر کاربردی، مخصوص طرفداران واقعی! این ست صرفاً یک وسیله کاربردی نیست، بلکه یک مجسمه کوچک هنری است که تماماً با دست شکل داده شده و رنگ‌آمیزی شده است. هر کدام از این ست‌ها به دلیل دست‌ساز بودن، روح و شخصیت منحصربه‌فرد خود را دارند.',
  imageUrl: '/pickle_rick.jpg', // We will place the AI generated image in the public folder later, or use a placeholder
  artist: {
    id: 'artist-001',
    name: 'عباس رنجبر',
    bio: 'هنرمند و توسعه‌دهنده خلاق',
    avatarUrl: '',
    githubProfile: 'https://github.com/ranjbarabbas'
  },
  tags: ['هنر دست', 'ریک و مورتی', 'فانتزی', 'جا فندکی'],
  pricingTiers: [
    {
      id: 'PRE_ORDER',
      title: 'پیش‌خرید (سفارشی)',
      description: 'اقتصادی‌ترین حالت برای کسانی که عجله ندارند.',
      price: 200000,
      deliveryTime: '۱ ماه آینده',
      isAvailable: true
    },
    {
      id: 'STANDARD',
      title: 'تولید سریع',
      description: 'حالت استاندارد با زمان معقول.',
      price: 350000,
      deliveryTime: '۱ هفته',
      isAvailable: true
    },
    {
      id: 'EXPRESS',
      title: 'ارسال فوری',
      description: 'موجودی آماده در انبار. مناسب هدایای لحظه آخری.',
      price: 500000,
      deliveryTime: '۲ ساعت (پیک)',
      isAvailable: true
    }
  ],
  seo: {
    metaTitle: 'خرید ست جا فندکی و زیرسیگاری ریک و مورتی (دست‌ساز) | هدیه خاص',
    metaDescription: 'ست جا فندکی و زیرسیگاری خمیری دست‌ساز با طرح Pickle Rick. بهترین هدیه فانتزی و ارزان برای طرفداران انیمیشن ریک و مورتی. سفارش آنلاین با ارسال فوری.',
    keywords: ['هدیه فانتزی', 'صنایع دستی', 'ریک و مورتی', 'Pickle Rick', 'جا فندکی خاص', 'زیرسیگاری هنری', 'کادوی تولد جذاب', 'خرید هدیه ارزان و ارزشمند', 'هنر دست'],
    schemaMarkup: JSON.stringify({
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": "ست جا فندکی و زیرسیگاری دست‌ساز مدل ریک و مورتی",
      "image": [
        "https://example.com/pickle_rick.jpg"
      ],
      "description": "یک قطعه هنر کاربردی، مخصوص طرفداران واقعی! این ست صرفاً یک وسیله کاربردی نیست، بلکه یک مجسمه کوچک هنری است.",
      "brand": {
        "@type": "Brand",
        "name": "هنرآفرین"
      },
      "offers": {
        "@type": "AggregateOffer",
        "lowPrice": "200000",
        "highPrice": "500000",
        "priceCurrency": "IRT"
      }
    })
  }
};
