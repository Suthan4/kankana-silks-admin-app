// Enhanced HomeSection Types with Media and CTAs

export const SectionType = {
  HERO_SLIDER: "HERO_SLIDER",
  NEW_ARRIVALS: "NEW_ARRIVALS",
  FEATURED: "FEATURED",
  COLLECTIONS: "COLLECTIONS",
  CATEGORIES: "CATEGORIES",
  BEST_SELLERS: "BEST_SELLERS",
  TRENDING: "TRENDING",
  SEASONAL: "SEASONAL",
  CATEGORY_SPOTLIGHT: "CATEGORY_SPOTLIGHT",
  CUSTOM: "CUSTOM",
} as const;

export type SectionType = (typeof SectionType)[keyof typeof SectionType];

export const MediaType = {
  IMAGE: "IMAGE",
  VIDEO: "VIDEO",
} as const;

export type MediaType = (typeof MediaType)[keyof typeof MediaType];

export const CTAStyle = {
  PRIMARY: "PRIMARY",
  SECONDARY: "SECONDARY",
  OUTLINE: "OUTLINE",
  TEXT: "TEXT",
} as const;

export type CTAStyle = (typeof CTAStyle)[keyof typeof CTAStyle];

export interface SectionMedia {
  id?: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  altText?: string;
  title?: string;
  order: number;
  overlayTitle?: string;
  overlaySubtitle?: string;
  overlayPosition?: "center" | "left" | "right" | "top" | "bottom";
}


export interface SectionMediaForm extends Omit<SectionMedia, "url"> {
  url?: string; // optional during form
  file?: File | null; // 👈 UI only
}

export interface SectionCTA {
  id?: string;
  text: string;
  url: string;
  style: CTAStyle;
  icon?: string;
  order: number;
  openNewTab: boolean;
}

export interface HomeSection {
  id: string;
  type: SectionType;
  title: string;
  subtitle?: string;
  description?: string;
  customTypeName?: string;

  // Layout & Styling
  backgroundColor?: string;
  textColor?: string;
  layout?: string;
  columns?: number;

  // Display Settings
  isActive: boolean;
  order: number;
  limit: number;
  showTitle: boolean;
  showSubtitle: boolean;

  // Relations
  products?: any[];
  categories?: any[];
  media?: SectionMedia[];
  ctaButtons?: SectionCTA[];

  createdAt: string;
  updatedAt: string;
}

export interface CreateHomeSectionData {
  type: SectionType;
  title: string;
  subtitle?: string;
  description?: string;
  customTypeName?: string;

  // Layout & Styling
  backgroundColor?: string;
  textColor?: string;
  layout?: string;
  columns?: number;

  // Display Settings
  isActive?: boolean;
  order?: number;
  limit?: number;
  showTitle?: boolean;
  showSubtitle?: boolean;

  // Relations
  productIds?: string[];
  categoryIds?: string[];
  media?: SectionMedia[];
  ctaButtons?: SectionCTA[];
}

export interface UpdateHomeSectionData {
  type?: SectionType;
  title?: string;
  subtitle?: string | null;
  description?: string | null;
  customTypeName?: string | null;

  // Layout & Styling
  backgroundColor?: string | null;
  textColor?: string | null;
  layout?: string;
  columns?: number;

  // Display Settings
  isActive?: boolean;
  order?: number;
  limit?: number;
  showTitle?: boolean;
  showSubtitle?: boolean;

  // Relations
  productIds?: string[];
  categoryIds?: string[];
  media?: SectionMedia[];
  ctaButtons?: SectionCTA[];
}

export interface QueryHomeSectionParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  type?: SectionType;
  sortBy?: "order" | "createdAt" | "title";
  sortOrder?: "asc" | "desc";
}
