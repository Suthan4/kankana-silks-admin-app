export interface CategoryPlacement {
  id: string;
  parentId: string;
  childId: string;
  order: number;
  parent?: Category;
  child?: Category;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;

  /**
   * Legacy single-parent fields. Keep these optional while the backend is
   * being migrated fully to CategoryPlacement.
   */
  parentId?: string | null;
  parent?: Category | null;

  /** Placement-based hierarchy returned by the new backend. */
  parentPlacements?: CategoryPlacement[];
  childPlacements?: CategoryPlacement[];

  /** Normalized convenience fields created by categoryApi. */
  parents?: Category[];
  children?: Category[];

  metaTitle?: string;
  metaDesc?: string;
  image?: string;
  isActive: boolean;
  isRoot: boolean;
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
  parentId?: string;
  isRoot?: boolean;
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
  isRoot?: boolean;
  metaTitle?: string;
  metaDesc?: string;
  image?: string;
  isActive?: boolean;
  order?: number;
  hasVideoConsultation?: boolean;
  videoPurchasingEnabled?: boolean;
  videoConsultationNote?: string;
}

export interface LinkCategoryData {
  parentId: string;
  childId: string;
  order?: number;
}

export interface UpdatePlacementData {
  order: number;
}

export interface QueryCategoryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  isRoot?: boolean;
  sortBy?: "name" | "createdAt" | "order";
  sortOrder?: "asc" | "desc";
}

export interface CategoryListData {
  categories: Category[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
