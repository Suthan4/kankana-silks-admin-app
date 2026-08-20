export interface CategoryPlacement {
  id: string;
  parentId: string;
  childId: string;
  order: number;
  /**
   * Whether this occurrence shows the category's own subcategories.
   * When false, `child` is rendered as a leaf in this branch of the tree
   * even though the same category may show its subtree under a different
   * parent. Defaults to true on the backend.
   */
  includeChildren: boolean;
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
  /** Only relevant when parentId is set — whether this placement should show subcategories. */
  includeChildren?: boolean;
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
  /**
   * Whether this placement should show the linked category's own
   * subcategories here. Default true (matches current behavior).
   * Set false for a "leaf-only" placement — e.g. showing "Banarasi Sarees"
   * flat under "What's New" while it keeps its full subtree under "sarees".
   */
  includeChildren?: boolean;
}

export interface UpdatePlacementData {
  order?: number;
  includeChildren?: boolean;
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