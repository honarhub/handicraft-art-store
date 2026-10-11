// Helper to fetch high-resolution, copyright-free authentic craft photos from Wikimedia Commons / Unsplash
export interface RemoteCraftImage {
  url: string;
  alt: string;
}

const specialtySearchTerms: Record<string, string[]> = {
  'سفالگری': ['persian pottery', 'iranian pottery', 'traditional pottery ceramic'],
  'میناکاری': ['meenakari', 'persian enamel', 'esfahan minakari'],
  'قلمزنی': ['persian toreutics', 'persian copper', 'iranian metalwork'],
  'قالی‌بافی': ['persian rug', 'persian carpet', 'oriental rug weaving'],
  'گلیم‌بافی': ['persian kilim', 'tribal rug', 'woven kilim'],
  'منبت‌کاری': ['woodcarving panel', 'persian wood art', 'wood inlay'],
  'خاتم‌کاری': ['khatam', 'khatamkari', 'marquetry art'],
  'مینیاتور': ['persian miniature', 'persian painting', 'iranian miniature'],
  'تذهیب': ['tazhib', 'islamic illumination', 'persian illumination art'],
  'زیورآلات': ['persian jewelry', 'handcrafted jewelry silver'],
  'کاشی‌کاری': ['persian tilework', 'iranian tile art', 'isfahan tile']
};

const fallbackWikimediaCraftImages: Record<string, RemoteCraftImage[]> = {
  'سفالگری': [
    { url: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Persian_Pottery%2C_Albert_Hall_Museum.jpg', alt: 'سفالینه سنتی و تاریخی ایران - موزه آلبرت هال' },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/3/31/Turkish_and_Persian_Pottery%2C_Albert_Hall_Museum.jpg', alt: 'ظروف سفالی و سرامیکی کهن ایرانی' }
  ],
  'میناکاری': [
    { url: 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Meenakari_Art.jpg', alt: 'هنر اصیل میناکاری و لعاب‌کاری اصفهان' },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Meenakari_peacock.jpg', alt: 'نقوش اسلیمی و لاجورد در میناکاری' }
  ],
  'قلمزنی': [
    { url: 'https://upload.wikimedia.org/wikipedia/commons/d/da/Toreutics_Isfahan.jpg', alt: 'قلمزنی برجسته بر فلز مس و برنج اصفهان' },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Persian_metalwork_ewer.jpg', alt: 'تنگ قلمزنی اصیل ایرانی' }
  ],
  'قالی‌بافی': [
    { url: 'https://upload.wikimedia.org/wikipedia/commons/0/07/Ardabil_Carpet.jpg', alt: 'شاهکار قالی‌بافی اصیل ایرانی - فرش اردبیل' },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/5/52/Persian_carpet_weaving_loom.jpg', alt: 'دستگاه سنتی بافت قالی دستباف' }
  ],
  'خاتم‌کاری': [
    { url: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Khatam-kari_Shiraz.jpg', alt: 'شاهکار هنر خاتم‌کاری شیراز و اصفهان' },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Khatam_detail.jpg', alt: 'ریزه‌کاری و هندسه ظریف خاتم ایرانی' }
  ],
  'مینیاتور': [
    { url: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Persian_miniature_Behzad.jpg', alt: 'نگارگری و مینیاتور اصیل مکتب هرات و اصفهان' },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Persian_court_miniature.jpg', alt: 'ظرافت نقش‌مایه‌های مینیاتور کهن ایرانی' }
  ]
};

const defaultWikimediaFallbacks: RemoteCraftImage[] = [
  { url: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Persian_Pottery%2C_Albert_Hall_Museum.jpg', alt: 'صنایع دستی و هنرهای کهن ایران زمین' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/0/07/Ardabil_Carpet.jpg', alt: 'میراث هنری و دست‌سازه‌های اصیل ایران' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Khatam-kari_Shiraz.jpg', alt: 'ظرافت‌های صنایع دستی ایران' }
];

export async function fetchRemoteCraftImages(specialtyName: string, count: number = 3): Promise<RemoteCraftImage[]> {
  try {
    const terms = specialtySearchTerms[specialtyName] || [`persian handicraft ${specialtyName}`, 'persian art', 'iranian craft'];
    const images: RemoteCraftImage[] = [];
    const seenUrls = new Set<string>();

    for (const term of terms) {
      if (images.length >= count) break;

      const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(term)}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|mime&format=json&origin=*`;

      try {
        const res = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'HonarHubBot/1.0 (https://honarhub.com; contact@honarhub.com)'
          },
          next: { revalidate: 3600 }
        });

        if (!res.ok) continue;

        const data = await res.json();
        const pages = data.query?.pages || {};

        for (const page of Object.values(pages) as any[]) {
          const info = page.imageinfo?.[0];
          if (info && info.url && info.mime?.startsWith('image/')) {
            // Filter out SVGs, icons or tiny thumbnails
            if (info.url.endsWith('.svg') || info.url.endsWith('.pdf')) continue;

            if (!seenUrls.has(info.url)) {
              seenUrls.add(info.url);
              const cleanTitle = (page.title || '')
                .replace(/^File:/i, '')
                .replace(/\.[^/.]+$/, '')
                .replace(/[-_]/g, ' ')
                .trim();

              images.push({
                url: info.url,
                alt: `تصویر اصیل ${specialtyName} - ${cleanTitle}`
              });

              if (images.length >= count) break;
            }
          }
        }
      } catch (subErr) {
        console.warn(`Wikimedia search failed for term "${term}":`, subErr);
      }
    }

    // If still need images, fallback to verified Wikimedia craft photos (never local shop files!)
    if (images.length < count) {
      const craftFallbacks = fallbackWikimediaCraftImages[specialtyName] || defaultWikimediaFallbacks;
      for (const fallback of craftFallbacks) {
        if (!seenUrls.has(fallback.url)) {
          seenUrls.add(fallback.url);
          images.push(fallback);
          if (images.length >= count) break;
        }
      }
    }

    return images;
  } catch (err) {
    console.warn('Failed to fetch remote craft images from Wikimedia:', err);
    return fallbackWikimediaCraftImages[specialtyName] || defaultWikimediaFallbacks;
  }
}
