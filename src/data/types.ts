export type Variant = {
  id: string;
  sku: string;
  size: string;
  color: string;
  colorHex: string;
  stock: number;
  active: boolean;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  price: number;
  compareAtPrice: number | null;
  description: string;
  material: string;
  care: string;
  fit: string;
  images: string[];
  colors: { name: string; hex: string }[];
  sizes: string[];
  variants: Variant[];
  publishedAt: string;
  labels: string[];
  featuredTrending: boolean;
  popularityScore: number;
  collections: string[];
  season: string;
  published: boolean;
  dropSlug?: string;
  dropStatus?: 'scheduled' | 'live' | 'sold-out' | 'ended';
};

export type CartLine = { productId: string; variantId: string; quantity: number };
export type CartLineView = CartLine & { product: Product; variant: Variant; lineTotal: number };

export type StoreContent = {
  brandName: string;
  tagline: string;
  announcement: string;
  freeDeliveryThreshold: number;
  shippingFee: number;
  heroEyebrow: string;
  heroTitle: string;
  heroBody: string;
  demoNotice: string;
  socialLinks: { instagram: string; tiktok: string };
};

export type Drop = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  status: 'scheduled' | 'live' | 'sold-out' | 'ended';
  releaseAt: string | null;
  endAt: string | null;
  editionQuantity: number | null;
  productIds: string[];
  visible: boolean;
  notifyEnabled: boolean;
};
