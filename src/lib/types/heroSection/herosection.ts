// Types
export const SectionType = {
  FEATURED: "FEATURED",
  NEW_ARRIVALS: "NEW_ARRIVALS",
  BEST_SELLERS: "BEST_SELLERS",
  TRENDING: "TRENDING",
  SEASONAL: "SEASONAL",
  CATEGORY_SPOTLIGHT: "CATEGORY_SPOTLIGHT",
} as const;

export type SectionType = (typeof SectionType)[keyof typeof SectionType];


export interface HomeSection {
  id: string;
  type: SectionType;
  title: string;
  subtitle?: string;
  isActive: boolean;
  order: number;
  limit: number;
  products?: any[];
  categories?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateHomeSectionData {
  type: SectionType;
  title: string;
  subtitle?: string;
  isActive?: boolean;
  order?: number;
  limit?: number;
  productIds?: string[];
  categoryIds?: string[];
}

export interface UpdateHomeSectionData {
  type?: SectionType;
  title?: string;
  subtitle?: string | null;
  isActive?: boolean;
  order?: number;
  limit?: number;
  productIds?: string[];
  categoryIds?: string[];
}

export interface QueryHomeSectionParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  type?: SectionType;
  sortBy?: "order" | "createdAt" | "title";
  sortOrder?: "asc" | "desc";
}
