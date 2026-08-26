export type DeliveryTier = 'PRE_ORDER' | 'STANDARD' | 'EXPRESS';

export interface PricingTier {
  id: DeliveryTier;
  title: string;
  description: string;
  price: number;
  deliveryTime: string;
  isAvailable: boolean;
}

export interface Artist {
  id: string;
  name: string;
  bio: string;
  avatarUrl: string;
  githubProfile?: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  artist: Artist;
  pricingTiers: PricingTier[];
  tags: string[];
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    schemaMarkup?: string;
  };
}
