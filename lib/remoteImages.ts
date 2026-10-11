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

export async function fetchRemoteCraftImages(specialtyName: string, count: number = 3): Promise<RemoteCraftImage[]> {
  try {
    const terms = specialtySearchTerms[specialtyName] || [`persian handicraft ${specialtyName}`];
    const searchTerm = terms[0];

    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchTerm)}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|mime&format=json&origin=*`;

    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'HonarHubBot/1.0 (https://honarhub.com; contact@honarhub.com)'
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    const pages = data.query?.pages || {};

    const images: RemoteCraftImage[] = [];
    for (const page of Object.values(pages) as any[]) {
      const info = page.imageinfo?.[0];
      if (info && info.url && info.mime?.startsWith('image/')) {
        // Clean title for nice caption
        const cleanTitle = (page.title || '')
          .replace(/^File:/i, '')
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]/g, ' ')
          .trim();

        images.push({
          url: info.url,
          alt: `اثر هنری ${specialtyName} - ${cleanTitle}`
        });

        if (images.length >= count) break;
      }
    }

    return images;
  } catch (err) {
    console.warn('Failed to fetch remote craft images from Wikimedia:', err);
    return [];
  }
}
