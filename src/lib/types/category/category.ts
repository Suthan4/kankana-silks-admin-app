export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  parent?: Category;
  children?: Category[];
  metaTitle?: string;
  metaDesc?: string;
  image?: string;
  isActive: boolean;
  order: number;
  hasVideoConsultation?: boolean;
  videoPurchasingEnabled?: boolean;
  videoConsultationNote?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  parentId?: string | null;   // ✅ allow null
  metaTitle?: string;
  metaDesc?: string;
  image?: string;
  isActive?: boolean;
  order?: number;
  hasVideoConsultation?: boolean;
  videoPurchasingEnabled?: boolean;
  videoConsultationNote?: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  parentId?: string | null;
  metaTitle?: string;
  metaDesc?: string;
  image?: string;
  isActive?: boolean;
  order?: number;
}

export interface QueryCategoryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  parentId?: string;
  sortBy?: "name" | "createdAt" | "order";
  sortOrder?: "asc" | "desc";
}