import React, { useState, useMemo } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  Box,
  Tag,
  Image as ImageIcon,
  Eye,
  Globe,
  Trash2,
  GripVertical,
  Star,
  Edit2,
  Plus,
  FileSpreadsheet,
  Download,
  Truck,
  Video,
  Info,
  Square,
  Check,
  Code,
  Copy,
  X,
} from "lucide-react";
import type {
  BulkParsedProduct,
  BulkParsedVariant,
  BulkParsedMedia,
  ImageMatchResult,
  BulkValidationError,
  BulkValidationSummary,
  BulkCategoryLookup,
  BulkCategoryNode,
} from "@/lib/types/product/bulkProduct";
import { BulkCategoryAssignModal } from "./BulkCategoryAssignModal";
import { resolveImageUrl } from "@/lib/utils/bulkImageUtils";
import {
  resolveCategory,
  validateBulkProduct,
} from "@/lib/utils/bulkProductNormalization";

function getStorefrontPreviewMedia(
  product: BulkParsedProduct,
  selectedVariantSku?: string | null,
): BulkParsedMedia[] {
  const selectedSku = (selectedVariantSku || "").trim().toLocaleLowerCase("en-US");
  const selectedVariant = product.variants?.find(
    (variant) => (variant.sku || "").trim().toLocaleLowerCase("en-US") === selectedSku,
  );
  const selectedVariantImages = (selectedVariant?.media ?? []).filter(
    (media) => media.type === "IMAGE",
  );
  if (selectedVariantImages.length) {
    return [...selectedVariantImages].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );
  }

  // Some parser formats store variant media in products[].media with
  // variantSku/source="variant", instead of nesting it under the variant.
  const embeddedVariantImages = selectedSku
    ? (product.media ?? []).filter((media) =>
        media.type === "IMAGE" &&
        (
          (media.variantSku || "").trim().toLocaleLowerCase("en-US") === selectedSku ||
          (media.source === "variant" && !media.variantSku)
        ),
      )
    : [];
  if (embeddedVariantImages.length) {
    return [...embeddedVariantImages].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );
  }

  const productImages = (product.media ?? []).filter(
    (media) => media.type === "IMAGE" && !media.variantSku && media.source !== "variant",
  );
  if (productImages.length) {
    return [...productImages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  // Fallback for imports where media is only present in the unified image list.
  if (product.allImages?.length) {
    const images = product.allImages.filter((media) =>
      media.type === "IMAGE" &&
      (selectedSku
        ? (media.variantSku || "").trim().toLocaleLowerCase("en-US") === selectedSku ||
          (media.source === "product" && !media.variantSku)
        : !media.variantSku && media.source !== "variant"),
    );
    return [...images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  return [];
}

function getMatchedStorefrontPreviewMedia(
  product: BulkParsedProduct,
  matches: ImageMatchResult | null | undefined,
  selectedVariantSku: string | null | undefined,
  getDriveProxyUrl?: (fileId: string) => string,
  getDriveThumbnailUrl?: (fileId: string) => string,
): BulkParsedMedia[] {
  if (!matches?.matched?.length || !product.productGroupId) return [];

  const desiredSku =
    selectedVariantSku?.toLocaleLowerCase("en-US").trim() || "";
  const groupMatches = matches.matched
    .filter((entry) => {
      if (entry.productGroupId !== product.productGroupId) return false;
      const matchSku =
        entry.variantSku?.toLocaleLowerCase("en-US").trim() || "";
      return desiredSku ? matchSku === desiredSku : !matchSku;
    })
    .sort((a, b) => a.mediaIndex - b.mediaIndex);

  if (!groupMatches.length) return [];

  const existingProductMedia = getStorefrontPreviewMedia(product, selectedVariantSku);
  const normalizeLabel = (value?: string) => {
    let name = (value || "").trim();
    const proxy = name.match(/\/products\/bulk\/drive-proxy\/([^/?#]+)/);
    if (proxy?.[1]) {
      try { name = decodeURIComponent(proxy[1]); } catch { name = proxy[1]; }
    } else {
      try {
        const url = new URL(name);
        name = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || name);
      } catch {
        name = name.split(/[?#]/, 1)[0].split(/[\\/]/).pop() || name;
      }
    }
    name = name.toLocaleLowerCase("en-US").replace(/\.[^.]+$/, "");
    const cameraRef = name.match(/^([a-z]{2,5})[o0](\d{4,})$/);
    return cameraRef ? cameraRef[1] + "0" + cameraRef[2] : name;
  };
  const isPermanentStorageUrl = (value?: string) =>
    /^https:\/\//i.test(value || "") &&
    !/drive\.google\.com|docs\.google\.com|googleusercontent\.com|\/products\/bulk\/drive-proxy\//i.test(value || "");

  return groupMatches
    .map((entry, index) => {
      const fileId = entry.file.id;
      const matchedName = normalizeLabel(entry.file.name);
      const matchedReference = normalizeLabel(entry.reference);
      const storedMedia = existingProductMedia.find((media) =>
        media.sourceDriveFileId === fileId ||
        media.key === fileId ||
        [media.url, media.title, media.altText].some((label) => {
          const normalized = normalizeLabel(label);
          return normalized === matchedName || normalized === matchedReference;
        }),
      );
      const storedUrl = isPermanentStorageUrl(storedMedia?.url) ? storedMedia?.url : undefined;
      const originalUrl =
        storedUrl ||
        getDriveProxyUrl?.(fileId) ||
        entry.file.previewUrl ||
        entry.file.webContentLink ||
        "";
      const thumbnailUrl =
        storedUrl ||
        entry.file.thumbnailLink ||
        getDriveThumbnailUrl?.(fileId) ||
        originalUrl;

      return {
        type: "IMAGE" as const,
        url: originalUrl,
        thumbnailUrl,
        key: storedMedia?.key || fileId,
        sourceDriveFileId: fileId,
        altText: storedMedia?.altText || entry.file.name,
        title: storedMedia?.title || entry.file.name,
        order: storedMedia?.order ?? index,
        isActive: true,
        source: entry.variantSku ? ("variant" as const) : ("product" as const),
        variantSku: entry.variantSku,
        productGroupId: product.productGroupId,
      };
    })
    .filter((media) => Boolean(media.url))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

interface BulkProductPreviewTableProps {
  products: BulkParsedProduct[];
  summary?: BulkValidationSummary;
  errors: BulkValidationError[];
  filterStatus?: "all" | "valid" | "error" | "warning";
  onFilterChange?: (filter: "all" | "valid" | "error" | "warning") => void;
  onUpdateProduct: (updated: BulkParsedProduct) => void;
  onDeleteProduct: (productGroupId: string) => void;
  onAddProduct: () => void;
  onDownloadErrorReport: () => void;
  onEditProduct?: (product: BulkParsedProduct) => void;
  flatCategories?: BulkCategoryLookup[];
  categoriesTree?: BulkCategoryNode[];
  onBulkUpdateProducts?: (updatedProducts: BulkParsedProduct[]) => void;
  getDriveProxyUrl?: (fileId: string) => string;
  getDriveThumbnailUrl?: (fileId: string) => string;
  imageMatches?: ImageMatchResult | null;
}

export const BulkProductPreviewTable: React.FC<
  BulkProductPreviewTableProps
> = ({
  products,
  summary,
  errors,
  filterStatus: externalFilterStatus,
  onFilterChange: externalOnFilterChange,
  onUpdateProduct,
  onDeleteProduct,
  onAddProduct,
  onDownloadErrorReport,
  onEditProduct,
  flatCategories,
  categoriesTree,
  onBulkUpdateProducts,
  getDriveProxyUrl,
  getDriveThumbnailUrl,
  imageMatches,
}) => {
  const [internalFilterStatus, setInternalFilterStatus] = useState<
    "all" | "valid" | "error" | "warning"
  >("all");
  const filterStatus = externalFilterStatus ?? internalFilterStatus;
  const setFilterStatus = (s: "all" | "valid" | "error" | "warning") => {
    setInternalFilterStatus(s);
    externalOnFilterChange?.(s);
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Editing state for inline edits
  const [viewingJsonProduct, setViewingJsonProduct] =
    useState<BulkParsedProduct | null>(null);
  const [imageGallery, setImageGallery] = useState<{
    product: BulkParsedProduct;
    images: BulkParsedMedia[];
    index: number;
  } | null>(null);
  const [failedDetailImageUrl, setFailedDetailImageUrl] = useState<
    string | null
  >(null);
  const [storefrontPreviewProduct, setStorefrontPreviewProduct] =
    useState<BulkParsedProduct | null>(null);
  const [storefrontSelectedVariantSku, setStorefrontSelectedVariantSku] =
    useState<string | null>(null);
  const [storefrontPreviewImageIndex, setStorefrontPreviewImageIndex] =
    useState(0);
  const [failedStorefrontImageUrl, setFailedStorefrontImageUrl] = useState<
    string | null
  >(null);
  const [storefrontDraggedImageIndex, setStorefrontDraggedImageIndex] =
    useState<number | null>(null);
  const [selectedStorefrontImageKeys, setSelectedStorefrontImageKeys] =
    useState<Set<string>>(new Set());
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<BulkParsedProduct | null>(
    null,
  );

  const toggleExpand = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedGroups(new Set(products.map((p) => p.productGroupId)));
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Status filter
      const hasErrors =
        p.errors && p.errors.some((e) => e.severity === "error");
      const hasWarnings =
        p.errors && p.errors.some((e) => e.severity === "warning");
      const isValid = p.isValid !== false && !hasErrors;

      if (filterStatus === "valid" && !isValid) return false;
      if (filterStatus === "error" && !hasErrors) return false;
      if (filterStatus === "warning" && !hasWarnings) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesSku = p.sku?.toLowerCase().includes(query);
        const matchesGroup = p.productGroupId.toLowerCase().includes(query);
        const matchesCat = p.categoryPath.toLowerCase().includes(query);
        const matchesVariantSku = p.variants?.some((v) =>
          v.sku?.toLowerCase().includes(query),
        );

        if (
          !matchesName &&
          !matchesSku &&
          !matchesGroup &&
          !matchesCat &&
          !matchesVariantSku
        ) {
          return false;
        }
      }

      return true;
    });
  }, [products, filterStatus, searchQuery]);

  const handleStartEdit = (product: BulkParsedProduct) => {
    setEditingGroupId(product.productGroupId);
    setEditFormData(JSON.parse(JSON.stringify(product))); // Deep copy
  };

  const handleSaveEdit = () => {
    if (editFormData) {
      const resolvedCat = resolveCategory(
        editFormData.categoryPath,
        editFormData.categoryId,
        flatCategories,
      );
      const updatedProduct: BulkParsedProduct = {
        ...editFormData,
        categoryId: resolvedCat.categoryId,
        categoryPath: resolvedCat.categoryPath,
        categoryName: resolvedCat.categoryName || editFormData.categoryName,
      };
      const valErrors = validateBulkProduct(updatedProduct, flatCategories);
      const isValid = !valErrors.some((e) => e.severity === "error");
      onUpdateProduct({
        ...updatedProduct,
        isValid,
        errors: valErrors.length > 0 ? valErrors : undefined,
      });
      setEditingGroupId(null);
      setEditFormData(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingGroupId(null);
    setEditFormData(null);
  };

  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkCategoryModal, setShowBulkCategoryModal] = useState(false);

  const isAllSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedIds.has(p.productGroupId));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.productGroupId)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkApplyCategory = (
    categoryId: string,
    categoryPath: string,
    onlyUnassigned: boolean,
  ) => {
    const selectedCat = flatCategories?.find((c) => c.id === categoryId);
    const updated = products.map((p) => {
      if (!selectedIds.has(p.productGroupId)) return p;
      if (onlyUnassigned && (p.categoryId || p.categoryPath?.trim())) {
        return p;
      }
      const updatedProduct: BulkParsedProduct = {
        ...p,
        categoryId,
        categoryPath,
        categoryName: selectedCat?.name || p.categoryName,
      };
      // Recalculate validation so category errors are immediately resolved
      const valErrors = validateBulkProduct(updatedProduct, flatCategories);
      const isValid = !valErrors.some((e) => e.severity === "error");
      return {
        ...updatedProduct,
        isValid,
        errors: valErrors.length > 0 ? valErrors : undefined,
      };
    });
    if (onBulkUpdateProducts) {
      onBulkUpdateProducts(updated);
    } else {
      updated.forEach((p) => onUpdateProduct(p));
    }
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.size} selected product(s)?`,
      )
    ) {
      return;
    }
    selectedIds.forEach((id) => onDeleteProduct(id));
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Top Controls & Filter Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatus === "all"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Products ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("valid")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              filterStatus === "valid"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Valid (
            {summary?.validProducts ??
              products.filter((p) => p.isValid !== false).length}
            )
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("error")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              filterStatus === "error"
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            <XCircle className="h-3.5 w-3.5" />
            With Errors (
            {summary?.invalidProducts ??
              products.filter((p) =>
                p.errors?.some((e) => e.severity === "error"),
              ).length}
            )
          </button>
          {errors.some((e) => e.severity === "warning") && (
            <button
              type="button"
              onClick={() => setFilterStatus("warning")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                filterStatus === "warning"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Warnings ({summary?.warningCount ?? 0})
            </button>
          )}
        </div>

        {/* Search input & actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, SKU..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <button
            type="button"
            onClick={toggleSelectAll}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ${
              isAllSelected
                ? "bg-indigo-600 text-white shadow-2xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            {isAllSelected ? (
              <Check className="h-3.5 w-3.5 stroke-[3]" />
            ) : (
              <Square className="h-3.5 w-3.5 text-slate-400" />
            )}
            {isAllSelected ? "Deselect All" : "Select All"}
          </button>
          <button
            type="button"
            onClick={expandAll}
            className="px-2.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="px-2.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition"
          >
            Collapse All
          </button>

          {errors.length > 0 && (
            <button
              type="button"
              onClick={onDownloadErrorReport}
              className="px-3 py-1.5 text-xs bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 font-semibold rounded-lg flex items-center gap-1 transition"
            >
              <Download className="h-3.5 w-3.5" />
              Error Report
            </button>
          )}

          <button
            type="button"
            onClick={onAddProduct}
            className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-1 transition shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Product
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-900 px-2.5 py-1 bg-white rounded-md border border-indigo-200 shadow-2xs">
              {selectedIds.size} of {filteredProducts.length} selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-indigo-700 hover:underline font-medium"
            >
              Clear selection
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {flatCategories && flatCategories.length > 0 && (
              <button
                type="button"
                onClick={() => setShowBulkCategoryModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
              >
                <Layers className="h-3.5 w-3.5" />
                Assign Category
              </button>
            )}
            <button
              type="button"
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 text-xs font-semibold rounded-lg transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected ({selectedIds.size})
            </button>
          </div>
        </div>
      )}

      {/* Products List / Cards */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <Box className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <p className="text-base font-semibold text-slate-700">
            No products match current filter
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery
              ? `No results for "${searchQuery}". Clear your search query to see all products.`
              : "Upload an Excel file or click 'Add Product' to start building your import batch."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => {
            const isExpanded = expandedGroups.has(product.productGroupId);
            const productErrors =
              product.errors?.filter((e) => e.severity === "error") || [];
            const productWarnings =
              product.errors?.filter((e) => e.severity === "warning") || [];
            const isRowValid =
              productErrors.length === 0 && product.isValid !== false;
            const isEditing = editingGroupId === product.productGroupId;

            const discount =
              product.basePrice > 0
                ? Math.round(
                    ((product.basePrice - product.sellingPrice) /
                      product.basePrice) *
                      100,
                  )
                : 0;

            return (
              <div
                key={product.productGroupId}
                className={`bg-white rounded-xl border transition-all shadow-xs overflow-hidden ${
                  !isRowValid
                    ? "border-rose-300 bg-rose-50/20"
                    : productWarnings.length > 0
                      ? "border-amber-300 bg-amber-50/10"
                      : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Product Summary Row */}
                <div
                  className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer select-none"
                  onClick={() => toggleExpand(product.productGroupId)}
                >
                  <div className="flex items-start md:items-center gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectOne(product.productGroupId);
                      }}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition"
                      title={
                        selectedIds.has(product.productGroupId)
                          ? "Deselect"
                          : "Select"
                      }
                    >
                      {selectedIds.has(product.productGroupId) ? (
                        <div className="w-4 h-4 rounded bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      ) : (
                        <Square className="h-4 w-4 text-slate-300 hover:text-slate-500" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(product.productGroupId);
                      }}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition mt-0.5 md:mt-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    {/* Status Icon */}
                    <div className="shrink-0 mt-0.5 md:mt-0">
                      {!isRowValid ? (
                        <div
                          title={`${productErrors.length} validation errors`}
                          className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs"
                        >
                          !
                        </div>
                      ) : productWarnings.length > 0 ? (
                        <div
                          title={`${productWarnings.length} warnings`}
                          className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xs"
                        >
                          !
                        </div>
                      ) : (
                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                      )}
                    </div>

                    {/* Product Name & Group ID */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                          {product.productGroupId}
                        </span>
                        {product.id && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            UPDATE
                          </span>
                        )}
                        <h4 className="font-semibold text-slate-900 truncate text-sm">
                          {product.name}
                        </h4>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            product.productType === "variable"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {product.productType}
                        </span>
                        {product.sku && (
                          <span className="text-xs text-slate-500 font-mono">
                            SKU: {product.sku}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                        {product.categoryPath ? (
                          <div className="inline-flex items-center gap-1 flex-wrap bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                            <Tag className="h-3 w-3 text-indigo-500 shrink-0" />
                            {product.categoryPath
                              .split(/[>→]/)
                              .map((seg, i, arr) => (
                                <React.Fragment key={i}>
                                  {i > 0 && (
                                    <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
                                  )}
                                  <span
                                    className={
                                      i === arr.length - 1
                                        ? "font-semibold text-indigo-900"
                                        : "text-slate-600"
                                    }
                                  >
                                    {seg.trim()}
                                  </span>
                                </React.Fragment>
                              ))}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
                            No category assigned
                          </span>
                        )}
                        {(product.seo?.metaTitle || product.seo?.metaDesc) && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded font-medium">
                            <Globe className="h-3 w-3 text-purple-500 shrink-0" />
                            SEO Ready
                          </span>
                        )}
                        {product.artisanName && (
                          <span className="text-slate-400 text-[11px]">
                            · Artisan: {product.artisanName}
                          </span>
                        )}
                        {product.specifications &&
                          product.specifications.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded font-medium">
                              {product.specifications.length} Specs
                            </span>
                          )}
                        {((product.allImages?.length || 0) > 0 ||
                          (product.media?.length || 0) > 0) && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-medium">
                            <ImageIcon className="h-3 w-3 text-slate-500 shrink-0" />
                            {product.allImages?.length ?? product.media?.length}{" "}
                            Photos
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Stock Summary */}
                  <div className="flex items-center gap-6 text-right shrink-0">
                    <div>
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-slate-400 line-through text-xs">
                          ₹{Number(product.basePrice || 0).toLocaleString()}
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          ₹{Number(product.sellingPrice || 0).toLocaleString()}
                        </span>
                        {discount > 0 && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                            {discount}% OFF
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {product.productType === "variable" ? (
                          <span className="text-purple-700 font-medium">
                            {product.variants?.length || 0} Variants
                          </span>
                        ) : (
                          <span>
                            Stock:{" "}
                            <strong>{product.stock?.quantity ?? 0}</strong> (
                            {product.stock?.warehouseCode || "Default"})
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Actions */}
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setStorefrontPreviewProduct(product);
                          setStorefrontSelectedVariantSku(
                            product.variants?.[0]?.sku || null,
                          );
                          setStorefrontPreviewImageIndex(0);
                          setFailedStorefrontImageUrl(null);
                          setSelectedStorefrontImageKeys(new Set());
                          setStorefrontDraggedImageIndex(null);
                        }}
                        title="Preview as customer"
                        aria-label={`Preview ${product.name} as a customer`}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1.5 text-[11px] font-semibold text-amber-900 transition hover:bg-amber-100"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">
                          Preview as customer
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewingJsonProduct(product)}
                        title="View Full Product JSON"
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition"
                      >
                        <Code className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (onEditProduct) {
                            onEditProduct(product);
                          } else {
                            handleStartEdit(product);
                          }
                        }}
                        title="Edit Product"
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProduct(product.productGroupId)}
                        title="Delete Product"
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inline Quick Editor */}
                {isEditing && editFormData && (
                  <div className="p-4 bg-blue-50/50 border-t border-blue-200 space-y-3">
                    <h5 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                      Quick Edit: {editFormData.name}
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">
                          Product Name
                        </label>
                        <input
                          type="text"
                          value={editFormData.name}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">
                          Category Full Path
                        </label>
                        <input
                          type="text"
                          value={editFormData.categoryPath}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              categoryPath: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">
                          Base Price (MRP)
                        </label>
                        <input
                          type="number"
                          value={editFormData.basePrice}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              basePrice: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">
                          Selling Price
                        </label>
                        <input
                          type="number"
                          value={editFormData.sellingPrice}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              sellingPrice: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">
                          Parent SKU
                        </label>
                        <input
                          type="text"
                          value={editFormData.sku || ""}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              sku: e.target.value,
                            })
                          }
                          placeholder="Auto-generate if empty"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editFormData.weight || ""}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              weight: parseFloat(e.target.value) || 0.5,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                      {editFormData.productType === "simple" && (
                        <div>
                          <label className="block text-slate-600 font-medium mb-1">
                            Stock Quantity
                          </label>
                          <input
                            type="number"
                            value={editFormData.stock?.quantity ?? 0}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                stock: {
                                  warehouseId:
                                    editFormData.stock?.warehouseId || "1",
                                  warehouseCode:
                                    editFormData.stock?.warehouseCode ||
                                    "DEFAULT",
                                  quantity: parseInt(e.target.value, 10) || 0,
                                },
                              })
                            }
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">
                          HSN Code
                        </label>
                        <input
                          type="text"
                          value={editFormData.hsnCode || ""}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              hsnCode: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                        />
                      </div>
                    </div>

                    {/* Variant editing for variable products */}
                    {editFormData.productType === "variable" && (
                      <div className="mt-4 pt-3 border-t border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                            Edit Variants ({editFormData.variants?.length || 0})
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const newVariants = [
                                ...(editFormData.variants || []),
                              ];
                              newVariants.push({
                                sku: `${editFormData.sku || editFormData.productGroupId}-VAR-${newVariants.length + 1}`,
                                size: "Free Size",
                                color: "New Colour",
                                fabric: "Pure Silk",
                                sellingPrice: editFormData.sellingPrice,
                                stock: {
                                  warehouseId: "1",
                                  warehouseCode: "DEFAULT",
                                  quantity: 1,
                                  lowStockThreshold: 5,
                                },
                              });
                              setEditFormData({
                                ...editFormData,
                                variants: newVariants,
                              });
                            }}
                            className="px-2.5 py-1 text-[11px] bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold flex items-center gap-1 shadow-xs"
                          >
                            <Plus className="h-3 w-3" /> Add Variant
                          </button>
                        </div>
                        <div className="overflow-x-auto bg-white rounded-lg border border-blue-200">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-blue-50/60 text-blue-900 font-semibold border-b border-blue-100">
                              <tr>
                                <th className="py-2 px-2.5">Variant SKU</th>
                                <th className="py-2 px-2.5">Size</th>
                                <th className="py-2 px-2.5">Colour</th>
                                <th className="py-2 px-2.5">Fabric</th>
                                <th className="py-2 px-2.5 text-right">
                                  Price (₹)
                                </th>
                                <th className="py-2 px-2.5 text-right">
                                  Stock
                                </th>
                                <th className="py-2 px-2.5 text-center">
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-50">
                              {editFormData.variants?.map((v, vIdx) => (
                                <tr key={vIdx} className="hover:bg-blue-50/20">
                                  <td className="p-1.5">
                                    <input
                                      type="text"
                                      value={v.sku || ""}
                                      onChange={(e) => {
                                        const nextVariants = [
                                          ...(editFormData.variants || []),
                                        ];
                                        nextVariants[vIdx] = {
                                          ...nextVariants[vIdx],
                                          sku: e.target.value,
                                        };
                                        setEditFormData({
                                          ...editFormData,
                                          variants: nextVariants,
                                        });
                                      }}
                                      className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-xs bg-white"
                                      placeholder="SKU"
                                    />
                                  </td>
                                  <td className="p-1.5">
                                    <input
                                      type="text"
                                      value={v.size || ""}
                                      onChange={(e) => {
                                        const nextVariants = [
                                          ...(editFormData.variants || []),
                                        ];
                                        nextVariants[vIdx] = {
                                          ...nextVariants[vIdx],
                                          size: e.target.value,
                                        };
                                        setEditFormData({
                                          ...editFormData,
                                          variants: nextVariants,
                                        });
                                      }}
                                      className="w-20 px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                                      placeholder="Size"
                                    />
                                  </td>
                                  <td className="p-1.5">
                                    <input
                                      type="text"
                                      value={v.color || ""}
                                      onChange={(e) => {
                                        const nextVariants = [
                                          ...(editFormData.variants || []),
                                        ];
                                        nextVariants[vIdx] = {
                                          ...nextVariants[vIdx],
                                          color: e.target.value,
                                        };
                                        setEditFormData({
                                          ...editFormData,
                                          variants: nextVariants,
                                        });
                                      }}
                                      className="w-24 px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                                      placeholder="Colour"
                                    />
                                  </td>
                                  <td className="p-1.5">
                                    <input
                                      type="text"
                                      value={v.fabric || ""}
                                      onChange={(e) => {
                                        const nextVariants = [
                                          ...(editFormData.variants || []),
                                        ];
                                        nextVariants[vIdx] = {
                                          ...nextVariants[vIdx],
                                          fabric: e.target.value,
                                        };
                                        setEditFormData({
                                          ...editFormData,
                                          variants: nextVariants,
                                        });
                                      }}
                                      className="w-28 px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                                      placeholder="Fabric"
                                    />
                                  </td>
                                  <td className="p-1.5">
                                    <input
                                      type="number"
                                      value={v.sellingPrice ?? ""}
                                      onChange={(e) => {
                                        const nextVariants = [
                                          ...(editFormData.variants || []),
                                        ];
                                        nextVariants[vIdx] = {
                                          ...nextVariants[vIdx],
                                          sellingPrice: e.target.value
                                            ? parseFloat(e.target.value)
                                            : undefined,
                                        };
                                        setEditFormData({
                                          ...editFormData,
                                          variants: nextVariants,
                                        });
                                      }}
                                      className="w-24 px-2 py-1 border border-slate-300 rounded text-xs text-right bg-white"
                                      placeholder="Inherit"
                                    />
                                  </td>
                                  <td className="p-1.5">
                                    <input
                                      type="number"
                                      value={v.stock?.quantity ?? 0}
                                      onChange={(e) => {
                                        const nextVariants = [
                                          ...(editFormData.variants || []),
                                        ];
                                        nextVariants[vIdx] = {
                                          ...nextVariants[vIdx],
                                          stock: {
                                            warehouseId:
                                              nextVariants[vIdx].stock
                                                ?.warehouseId || "1",
                                            warehouseCode:
                                              nextVariants[vIdx].stock
                                                ?.warehouseCode || "DEFAULT",
                                            quantity:
                                              parseInt(e.target.value, 10) || 0,
                                          },
                                        };
                                        setEditFormData({
                                          ...editFormData,
                                          variants: nextVariants,
                                        });
                                      }}
                                      className="w-20 px-2 py-1 border border-slate-300 rounded text-xs text-right bg-white"
                                      placeholder="Stock"
                                    />
                                  </td>
                                  <td className="p-1.5 text-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextVariants =
                                          editFormData.variants?.filter(
                                            (_, i) => i !== vIdx,
                                          ) || [];
                                        setEditFormData({
                                          ...editFormData,
                                          variants: nextVariants,
                                        });
                                      }}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                                      title="Remove variant"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
                      >
                        Apply Changes
                      </button>
                    </div>
                  </div>
                )}

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="border-t border-slate-200 p-5 bg-slate-50/50 space-y-5">
                    {/* Validation Errors & Warnings Callout Box */}
                    {product.errors && product.errors.length > 0 && (
                      <div className="bg-white rounded-xl border border-rose-200 p-4 space-y-2 shadow-xs">
                        <h5 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 text-rose-600" />
                          Validation Issues for {product.productGroupId} (
                          {product.errors.length})
                        </h5>
                        <div className="space-y-1.5 pt-1">
                          {product.errors.map((err, idx) => (
                            <div
                              key={idx}
                              className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                                err.severity === "error"
                                  ? "bg-rose-50/80 border border-rose-200 text-rose-900"
                                  : "bg-amber-50/80 border border-amber-200 text-amber-900"
                              }`}
                            >
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                                  err.severity === "error"
                                    ? "bg-rose-600 text-white"
                                    : "bg-amber-500 text-white"
                                }`}
                              >
                                {err.sheet} {err.row ? `Row ${err.row}` : ""}
                              </span>
                              <div className="flex-1">
                                <p className="font-semibold">
                                  {err.field}: {err.message}
                                </p>
                                <p className="text-slate-600 text-[11px] mt-0.5 italic">
                                  How to fix: {err.fix}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Description & Artisan Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <span className="font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                          Product Description
                        </span>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                          {product.description}
                        </p>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-slate-200 space-y-1.5">
                        <span className="font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                          Shipping & Dimensions
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-slate-700">
                          <div>
                            <span className="text-slate-400">Weight:</span>{" "}
                            <strong>{product.weight} kg</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Dimensions:</span>{" "}
                            <strong>
                              {product.length} × {product.breadth} ×{" "}
                              {product.height} cm
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-400">HSN Code:</span>{" "}
                            <span className="font-mono">
                              {product.hsnCode || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Backorders:</span>{" "}
                            <strong>
                              {product.allowOutOfStockOrders ? "Allowed" : "No"}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Specifications */}
                      {product.specifications &&
                        product.specifications.length > 0 && (
                          <div className="bg-white rounded-lg p-3 border border-slate-200 col-span-full">
                            <span className="font-semibold text-slate-500 uppercase tracking-wide block mb-2">
                              Product Specifications (
                              {product.specifications.length})
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                              {product.specifications.map((spec, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="bg-slate-50 border border-slate-200 rounded-lg p-2"
                                >
                                  <span className="text-[10px] text-slate-400 font-semibold uppercase block truncate">
                                    {spec.key}
                                  </span>
                                  <span className="text-xs font-medium text-slate-800 block truncate">
                                    {spec.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Variants Breakdown (Variable Products) */}
                    {product.productType === "variable" && (
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                        <div className="p-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers className="h-4 w-4 text-purple-600" />
                            Product Variants ({product.variants?.length || 0})
                          </span>
                        </div>

                        {product.variants && product.variants.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                <tr>
                                  <th className="py-2.5 px-3">Variant SKU</th>
                                  <th className="py-2.5 px-3">Size</th>
                                  <th className="py-2.5 px-3">Color</th>
                                  <th className="py-2.5 px-3">Fabric</th>
                                  <th className="py-2.5 px-3">Photos</th>
                                  <th className="py-2.5 px-3">
                                    Other Attributes
                                  </th>
                                  <th className="py-2.5 px-3 text-right">
                                    Price Override
                                  </th>
                                  <th className="py-2.5 px-3 text-right">
                                    Stock
                                  </th>
                                  <th className="py-2.5 px-3">Warehouse</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {product.variants.map((v, idx) => {
                                  const isDuplicateColor = Boolean(
                                    v.color &&
                                    (product.variants || []).filter(
                                      (other) =>
                                        other.color?.trim().toLowerCase() ===
                                        v.color?.trim().toLowerCase(),
                                    ).length > 1,
                                  );
                                  const variantMedia =
                                    v.media && v.media.length > 0
                                      ? v.media
                                      : product.media?.filter(
                                          (m) =>
                                            m.variantSku === v.sku ||
                                            (!v.sku &&
                                              m.variantSku === String(idx + 1)),
                                        ) || [];

                                  const attrDisplay = (() => {
                                    if (!v.attributes) return "—";
                                    if (Array.isArray(v.attributes)) {
                                      return (
                                        v.attributes
                                          .filter(
                                            (a) =>
                                              ![
                                                "Size",
                                                "Color",
                                                "Fabric",
                                              ].includes(a.name),
                                          )
                                          .map((a) => `${a.name}: ${a.value}`)
                                          .join(", ") || "—"
                                      );
                                    }
                                    return (
                                      Object.entries(v.attributes)
                                        .filter(
                                          ([k]) =>
                                            ![
                                              "Size",
                                              "Color",
                                              "Fabric",
                                            ].includes(k),
                                        )
                                        .map(([k, val]) => `${k}: ${val}`)
                                        .join(", ") || "—"
                                    );
                                  })();

                                  const effectivePrice =
                                    v.price ?? v.sellingPrice;

                                  return (
                                    <tr
                                      key={idx}
                                      className="hover:bg-slate-50/50"
                                    >
                                      <td className="py-2 px-3 font-mono font-medium text-slate-800">
                                        <div>
                                          {v.sku || (
                                            <span className="text-slate-400 italic">
                                              auto-generated
                                            </span>
                                          )}
                                        </div>
                                        {v.title && (
                                          <div className="text-[10px] font-sans text-slate-500 font-normal">
                                            {v.title}
                                          </div>
                                        )}
                                        {v.id && (
                                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded font-mono">
                                            ID: {v.id.slice(0, 8)}…
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-2 px-3 text-slate-700">
                                        {v.size || "—"}
                                      </td>
                                      <td className="py-2 px-3 text-slate-700">
                                        <span>{v.color || "—"}</span>
                                        {isDuplicateColor && (
                                          <span className="ml-1.5 inline-flex items-center text-[10px] bg-rose-100 text-rose-700 border border-rose-300 font-bold px-1.5 py-0.2 rounded">
                                            Duplicate
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-2 px-3 text-slate-700">
                                        {v.fabric || "—"}
                                      </td>
                                      <td className="py-2 px-3">
                                        {variantMedia.length > 0 ? (
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            {variantMedia
                                              .slice(0, 2)
                                              .map((vm, vi) => {
                                                const vmSrc = resolveImageUrl(
                                                  vm.url,
                                                  vm.thumbnailUrl,
                                                  getDriveProxyUrl,
                                                  getDriveThumbnailUrl,
                                                );
                                                return vmSrc ? (
                                                  <img
                                                    key={vi}
                                                    src={vmSrc}
                                                    alt=""
                                                    className="w-7 h-7 object-cover rounded border border-slate-200"
                                                  />
                                                ) : (
                                                  <span
                                                    key={vi}
                                                    className="w-7 h-7 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-[9px] text-slate-400"
                                                  >
                                                    <ImageIcon className="w-3.5 h-3.5" />
                                                  </span>
                                                );
                                              })}
                                            <span className="text-[10px] text-slate-500 font-medium">
                                              {variantMedia.length} photo
                                              {variantMedia.length !== 1
                                                ? "s"
                                                : ""}
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="text-slate-400 italic text-[11px]">
                                            None
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-2 px-3 text-slate-600">
                                        {attrDisplay}
                                      </td>
                                      <td className="py-2 px-3 text-right font-medium text-slate-900">
                                        {effectivePrice ? (
                                          <span>
                                            ₹{effectivePrice.toLocaleString()}
                                          </span>
                                        ) : (
                                          <span className="text-slate-400 italic">
                                            Inherits parent
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-2 px-3 text-right font-bold text-slate-800">
                                        {v.stock?.quantity ?? 0}
                                      </td>
                                      <td className="py-2 px-3 text-slate-600">
                                        {v.stock?.warehouseCode || "Default"}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-4 text-center text-xs text-rose-600 font-medium">
                            No variants configured for this variable product.
                            Add variants on the Variants sheet.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Media & SEO Galleries */}
                    {(() => {
                      const displayMedia =
                        product.allImages && product.allImages.length > 0
                          ? product.allImages
                          : [
                              ...(product.media || []).map((m, idx) => ({
                                ...m,
                                source: m.source || ("product" as const),
                                order: m.order ?? idx,
                              })),
                              ...(product.variants || []).flatMap((v) =>
                                (v.media || []).map((m, idx) => ({
                                  ...m,
                                  source: "variant" as const,
                                  variantSku: m.variantSku || v.sku,
                                  order: m.order ?? 100 + idx,
                                })),
                              ),
                            ].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          {/* Media items */}
                          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <ImageIcon className="h-4 w-4 text-blue-600" />
                                All Product Images ({displayMedia.length})
                              </span>
                              {displayMedia.length > 0 && (
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {product.media?.length || 0} product ·{" "}
                                  {displayMedia.length -
                                    (product.media?.length || 0)}{" "}
                                  variant
                                </span>
                              )}
                            </div>
                            {displayMedia.length > 0 ? (
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                                {displayMedia.map((m, mIdx) => (
                                  <div
                                    key={mIdx}
                                    className="group relative rounded-lg border border-slate-200 overflow-hidden bg-slate-100 aspect-square"
                                  >
                                    {m.type === "VIDEO" ? (
                                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-white">
                                        <Video className="h-6 w-6 text-slate-300" />
                                        <span className="text-[9px] uppercase mt-1">
                                          Video
                                        </span>
                                      </div>
                                    ) : (
                                      (() => {
                                        const resolvedSrc = resolveImageUrl(
                                          m.url,
                                          m.thumbnailUrl,
                                          getDriveProxyUrl,
                                          getDriveThumbnailUrl,
                                        );
                                        return resolvedSrc ? (
                                          <img
                                            src={resolvedSrc}
                                            alt={m.altText || product.name}
                                            loading="lazy"
                                            decoding="async"
                                            title="Click to view full-size"
                                            onClick={() => {
                                              setFailedDetailImageUrl(null);
                                              setImageGallery({
                                                product,
                                                images: displayMedia,
                                                index: mIdx,
                                              });
                                            }}
                                            className="w-full h-full object-cover cursor-zoom-in"
                                            onError={(e) => {
                                              const target = e.currentTarget;
                                              const proxyMatch = (m.url || "").match(/\/products\/bulk\/drive-proxy\/([^/?#]+)/);
                                              if (proxyMatch?.[1] && getDriveThumbnailUrl && !target.dataset.thumbnailFallback) {
                                                let fileId = proxyMatch[1];
                                                try { fileId = decodeURIComponent(fileId); } catch { /* keep encoded ID */ }
                                                const fallback = getDriveThumbnailUrl(fileId);
                                                if (fallback && target.src !== fallback) {
                                                  target.dataset.thumbnailFallback = "true";
                                                  target.src = fallback;
                                                  return;
                                                }
                                              }
                                              // Never load the full original as a thumbnail fallback.
                                              target.dataset.thumbnailFailed = "true";
                                              target.src =
                                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
                                            }}
                                          />
                                        ) : (
                                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 p-2 text-center text-slate-400">
                                            <ImageIcon className="h-6 w-6 text-slate-300 mb-1" />
                                            <span className="text-[8px] font-mono truncate max-w-full text-slate-500">
                                              {m.url || "Pending match"}
                                            </span>
                                          </div>
                                        );
                                      })()
                                    )}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setFailedDetailImageUrl(null);
                                        setImageGallery({
                                          product,
                                          images: displayMedia,
                                          index: mIdx,
                                        });
                                      }}
                                      className="absolute inset-0 z-[5] flex items-center justify-center bg-black/0 text-white opacity-0 transition hover:bg-black/20 hover:opacity-100 focus:opacity-100"
                                      aria-label={`View full-size image ${m.title || m.altText || mIdx + 1}`}
                                      title="View full-size image"
                                    >
                                      <span className="rounded-full bg-slate-900/75 px-2.5 py-1 text-[10px] font-semibold shadow">
                                        View
                                      </span>
                                    </button>
                                    <div className="absolute top-1 left-1 z-10">
                                      {m.order === 0 || mIdx === 0 ? (
                                        <span className="bg-amber-500 text-white font-bold text-[9px] px-1 py-0.5 rounded shadow">
                                          ★ Primary
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const nextMedia = [
                                              ...(product.media || []),
                                            ];
                                            const matchIdx =
                                              nextMedia.findIndex(
                                                (x) => x.url === m.url,
                                              );
                                            if (matchIdx >= 0) {
                                              const [chosen] = nextMedia.splice(
                                                matchIdx,
                                                1,
                                              );
                                              nextMedia.unshift({
                                                ...chosen,
                                                order: 0,
                                              });
                                              const reindexed = nextMedia.map(
                                                (item, idx) => ({
                                                  ...item,
                                                  order: idx,
                                                }),
                                              );
                                              onUpdateProduct({
                                                ...product,
                                                media: reindexed,
                                              });
                                            }
                                          }}
                                          className="opacity-0 group-hover:opacity-100 bg-slate-900/80 hover:bg-blue-600 text-white text-[9px] px-1 py-0.5 rounded transition shadow"
                                          title="Set as primary image"
                                        >
                                          Set Primary
                                        </button>
                                      )}
                                    </div>
                                    <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const nextMedia = (
                                            product.media || []
                                          ).filter((x) => x.url !== m.url);
                                          const nextVariants = (
                                            product.variants || []
                                          ).map((v) => ({
                                            ...v,
                                            media: (v.media || []).filter(
                                              (x) => x.url !== m.url,
                                            ),
                                          }));
                                          const nextAll = (
                                            product.allImages || []
                                          ).filter((x) => x.url !== m.url);
                                          onUpdateProduct({
                                            ...product,
                                            media: nextMedia,
                                            variants: nextVariants,
                                            allImages: nextAll,
                                          });
                                        }}
                                        className="p-1 rounded bg-slate-900/80 hover:bg-rose-600 text-white shadow"
                                        title="Remove photo"
                                      >
                                        <Trash2 className="h-2.5 w-2.5" />
                                      </button>
                                    </div>
                                    <div className="absolute bottom-0 inset-x-0 bg-slate-900/70 text-white text-[9px] px-1 py-0.5 truncate text-center">
                                      {m.source === "variant" ||
                                      m.variantSku ? (
                                        <span className="text-purple-300 font-medium">
                                          Var: {m.variantSku || "Variant"}
                                        </span>
                                      ) : (
                                        `Product #${m.order ?? mIdx}`
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-slate-400 italic pt-1">
                                No media specified.
                              </p>
                            )}
                          </div>

                          {/* SEO details */}
                          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                            <span className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                              <Globe className="h-4 w-4 text-emerald-600" />
                              SEO Metadata
                            </span>
                            {product.seo ? (
                              <div className="space-y-1.5 pt-1 text-slate-700">
                                <div>
                                  <span className="text-slate-400">
                                    Meta Title:
                                  </span>{" "}
                                  <span className="font-medium">
                                    {product.seo.metaTitle || "—"}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400">
                                    Meta Description:
                                  </span>{" "}
                                  <p className="text-slate-600 mt-0.5 italic">
                                    {product.seo.metaDesc || "—"}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-slate-400">
                                    Custom URL Slug:
                                  </span>{" "}
                                  <span className="font-mono text-blue-700">
                                    {product.seo.slug || "Auto-generated"}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <p className="text-slate-400 italic pt-1">
                                No custom SEO data specified (will use
                                defaults).
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bulk Category Assign Modal */}
      {showBulkCategoryModal && flatCategories && (
        <BulkCategoryAssignModal
          isOpen={showBulkCategoryModal}
          onClose={() => setShowBulkCategoryModal(false)}
          selectedProducts={products.filter((p) =>
            selectedIds.has(p.productGroupId),
          )}
          flatCategories={flatCategories}
          categoriesTree={categoriesTree || []}
          onApplyCategory={handleBulkApplyCategory}
        />
      )}

      {/* Product JSON Modal */}
      {viewingJsonProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-indigo-600" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Product JSON: {viewingJsonProduct.name}
                  </h4>
                  <p className="text-[11px] font-mono text-slate-500">
                    {viewingJsonProduct.productGroupId}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      JSON.stringify(viewingJsonProduct, null, 2),
                    );
                    alert("Product JSON copied to clipboard!");
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => setViewingJsonProduct(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-auto bg-slate-900">
              <pre className="text-xs font-mono text-emerald-300 leading-relaxed">
                {JSON.stringify(viewingJsonProduct, null, 2)}
              </pre>
            </div>
            <div className="p-3 border-t border-slate-200 flex justify-end bg-white shrink-0">
              <button
                type="button"
                onClick={() => setViewingJsonProduct(null)}
                className="px-4 py-1.5 text-xs font-medium border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {storefrontPreviewProduct &&
        (() => {
          const previewProduct = storefrontPreviewProduct;
          const selectedPreviewVariant = previewProduct.variants?.find(
            (variant) => variant.sku === storefrontSelectedVariantSku,
          );
          // Use the exact same matched Drive entries shown in the Matched images
          // panel. Raw references in the product JSON (e.g. NAVO2845) are not URLs.
          const matchedPreviewImages = getMatchedStorefrontPreviewMedia(
            previewProduct,
            imageMatches,
            storefrontSelectedVariantSku,
            getDriveProxyUrl,
            getDriveThumbnailUrl,
          );
          // Product media is the editable source of truth. Use the match report
          // only as a fallback when an older draft has not yet attached media to
          // the product payload; otherwise deletions/reordering would be undone
          // by rebuilding the gallery from the original match list.
          const retainedProductImages = getStorefrontPreviewMedia(
            previewProduct,
            storefrontSelectedVariantSku,
          );
          const hasExplicitlyClearedGallery =
            Array.isArray(previewProduct.allImages) &&
            previewProduct.allImages.length === 0 &&
            !(previewProduct.media || []).some((media) => media.type === "IMAGE") &&
            !(previewProduct.variants || []).some((variant) =>
              (variant.media || []).some((media) => media.type === "IMAGE"),
            );
          const previewImages = hasExplicitlyClearedGallery
            ? []
            : matchedPreviewImages.length > 0
              ? matchedPreviewImages
              : retainedProductImages;
          const activeIndex = Math.min(
            storefrontPreviewImageIndex,
            Math.max(0, previewImages.length - 1),
          );
          const activeImage = previewImages[activeIndex];
          const currentImageUrl = activeImage?.url || "";
          const isDriveOriginalProxy = currentImageUrl.includes("/products/bulk/drive-proxy/");
          // Before Import, show the lightweight thumbnail in the large preview area.
          // This lets admins inspect the complete photo without downloading a 40+ MB original.
          const previewSourceUrl =
            isDriveOriginalProxy && activeImage?.thumbnailUrl
              ? activeImage.thumbnailUrl
              : currentImageUrl;
          const detailImageUrl = /^(https?:\/\/|\/)/i.test(previewSourceUrl)
            ? previewSourceUrl
            : "";
          const previewSellingPrice = Number(
            selectedPreviewVariant?.sellingPrice ??
              selectedPreviewVariant?.price ??
              previewProduct.sellingPrice ??
              0,
          );
          const previewBasePrice = Number(
            selectedPreviewVariant?.basePrice ?? previewProduct.basePrice ?? 0,
          );
          const discountPercent =
            previewBasePrice > previewSellingPrice && previewBasePrice > 0
              ? Math.round(
                  ((previewBasePrice - previewSellingPrice) /
                    previewBasePrice) *
                    100,
                )
              : 0;

          const selectedVariantForMedia = previewProduct.variants?.find(
            (variant) => variant.sku === storefrontSelectedVariantSku,
          );
          const editVariantMedia =
            Boolean(storefrontSelectedVariantSku) &&
            Boolean(selectedVariantForMedia) &&
            (previewImages.some(
              (media) =>
                media.source === "variant" ||
                media.variantSku === storefrontSelectedVariantSku,
            ) ||
              (selectedVariantForMedia?.media || []).some(
                (media) => media.type === "IMAGE",
              ));
          const imageIdentity = (media: BulkParsedMedia, index: number) => {
            if (media.sourceDriveFileId) return "drive:" + media.sourceDriveFileId;
            const proxyId = (media.url || "").match(
              /\/products\/bulk\/drive-proxy\/([^/?#]+)/,
            );
            if (proxyId?.[1]) {
              try { return "drive:" + decodeURIComponent(proxyId[1]); } catch {
                return "drive:" + proxyId[1];
              }
            }
            if (media.key) return "key:" + media.key;
            if (media.url) return "url:" + media.url;
            return "label:" + (media.title || media.altText || "image") + ":" + index;
          };

          const updatePreviewImages = (images: BulkParsedMedia[]) => {
            const orderedImages = images.map((media, index) => ({
              ...media,
              order: index,
              isActive: true,
              source: editVariantMedia ? ("variant" as const) : ("product" as const),
              productGroupId: previewProduct.productGroupId,
              variantSku: editVariantMedia ? (storefrontSelectedVariantSku || undefined) : undefined,
            }));

            let updatedProduct: BulkParsedProduct;
            if (editVariantMedia && selectedVariantForMedia) {
              const variants = (previewProduct.variants || []).map((variant) => {
                if (variant.sku !== storefrontSelectedVariantSku) return variant;
                const nonImages = (variant.media || [])
                  .filter((media) => media.type !== "IMAGE")
                  .map((media, index) => ({ ...media, order: orderedImages.length + index }));
                return { ...variant, media: [...orderedImages, ...nonImages] };
              });
              updatedProduct = { ...previewProduct, variants };
            } else {
              const nonImages = (previewProduct.media || [])
                .filter((media) => media.type !== "IMAGE")
                .map((media, index) => ({ ...media, order: orderedImages.length + index }));
              updatedProduct = {
                ...previewProduct,
                media: [...orderedImages, ...nonImages],
              };
            }

            const allImages: BulkParsedMedia[] = [
              ...(updatedProduct.media || []).map((media, index) => ({
                ...media,
                source: "product" as const,
                order: media.order ?? index,
              })),
              ...(updatedProduct.variants || []).flatMap((variant) =>
                (variant.media || []).map((media, index) => ({
                  ...media,
                  source: "variant" as const,
                  variantSku: variant.sku,
                  order: media.order ?? (10000 + index),
                })),
              ),
            ].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            updatedProduct = { ...updatedProduct, allImages };
            setStorefrontPreviewProduct(updatedProduct);
            onUpdateProduct(updatedProduct);
            setStorefrontPreviewImageIndex((current) =>
              Math.min(current, Math.max(0, orderedImages.length - 1)),
            );
            setFailedStorefrontImageUrl(null);
          };

          const movePreviewImage = (fromIndex: number, toIndex: number) => {
            if (
              fromIndex === toIndex ||
              fromIndex < 0 ||
              toIndex < 0 ||
              fromIndex >= previewImages.length ||
              toIndex >= previewImages.length
            ) return;
            const activeKey = previewImages[activeIndex]
              ? imageIdentity(previewImages[activeIndex], activeIndex)
              : "";
            const nextImages = [...previewImages];
            const [moved] = nextImages.splice(fromIndex, 1);
            if (!moved) return;
            nextImages.splice(toIndex, 0, moved);
            updatePreviewImages(nextImages);
            const nextIndex = nextImages.findIndex(
              (media, index) => imageIdentity(media, index) === activeKey,
            );
            setStorefrontPreviewImageIndex(nextIndex >= 0 ? nextIndex : 0);
            setStorefrontDraggedImageIndex(null);
            setSelectedStorefrontImageKeys(new Set());
          };

          const removePreviewImages = (indexes: number[]) => {
            if (indexes.length === 0) return;
            const removed = new Set(indexes);
            const nextImages = previewImages.filter((_media, index) => !removed.has(index));
            updatePreviewImages(nextImages);
            setSelectedStorefrontImageKeys(new Set());
            setStorefrontDraggedImageIndex(null);
            setStorefrontPreviewImageIndex(0);
          };

          const selectedImagesCount = previewImages.reduce(
            (count, media, index) =>
              count + (selectedStorefrontImageKeys.has(imageIdentity(media, index)) ? 1 : 0),
            0,
          );
          return (
            <div
              className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-5"
              role="dialog"
              aria-modal="true"
              aria-label={`Customer storefront preview for ${previewProduct.name}`}
              onClick={() => {
                setStorefrontPreviewProduct(null);
                setSelectedStorefrontImageKeys(new Set());
                setStorefrontDraggedImageIndex(null);
              }}
            >
              <div
                className="flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-6">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-900">
                        Storefront preview
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Admin-only · image changes update the draft
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                      {previewProduct.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStorefrontPreviewProduct(null);
                      setSelectedStorefrontImageKeys(new Set());
                      setStorefrontDraggedImageIndex(null);
                    }}
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    aria-label="Close storefront preview"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </header>

                <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-2">
                  <section className="border-b border-slate-200 bg-[#faf9f6] p-4 sm:p-6 lg:border-b-0 lg:border-r">
                    <div className="mx-auto max-w-xl">
                      <div className="relative flex aspect-[4/5] max-h-[58vh] items-center justify-center overflow-hidden rounded-xl bg-white">
                        {activeImage &&
                        detailImageUrl &&
                        activeImage.type !== "VIDEO" &&
                        failedStorefrontImageUrl !== detailImageUrl ? (
                          <img
                            key={detailImageUrl}
                            src={detailImageUrl}
                            alt={
                              activeImage.altText ||
                              activeImage.title ||
                              previewProduct.name
                            }
                            loading="eager"
                            decoding="async"
                            className="h-full w-full object-contain"
                            onError={(event) => {
                              const target = event.currentTarget;
                              const proxyMatch = currentImageUrl.match(/\/products\/bulk\/drive-proxy\/([^/?#]+)/);
                              if (
                                isDriveOriginalProxy &&
                                proxyMatch?.[1] &&
                                getDriveThumbnailUrl &&
                                !target.dataset.thumbnailFallback
                              ) {
                                let fileId = proxyMatch[1];
                                try { fileId = decodeURIComponent(fileId); } catch { /* keep encoded ID */ }
                                const fallback = getDriveThumbnailUrl(fileId);
                                if (fallback && target.src !== fallback) {
                                  target.dataset.thumbnailFallback = "true";
                                  target.src = fallback;
                                  return;
                                }
                              }
                              setFailedStorefrontImageUrl(detailImageUrl);
                            }}
                          />
                        ) : (
                          <div className="flex max-w-sm flex-col items-center gap-2 p-8 text-center text-slate-500">
                            <ImageIcon className="h-12 w-12 text-slate-300" />
                            <p className="text-sm font-semibold text-slate-700">
                              {previewImages.length === 0
                                ? "No product images selected"
                                : failedStorefrontImageUrl === detailImageUrl && detailImageUrl
                                  ? "This image could not be loaded"
                                  : "No full-size product image available"}
                            </p>
                            <p className="text-xs leading-relaxed">
                              {previewImages.length === 0
                                ? "Add images from Google Drive or local upload before importing this product."
                                : "Use the image controls below to reorder, set a primary image, or remove photos from this import."}
                            </p>
                          </div>
                        )}
                        {previewImages.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setStorefrontPreviewImageIndex(
                                  (activeIndex - 1 + previewImages.length) %
                                    previewImages.length,
                                );
                                setFailedStorefrontImageUrl(null);
                              }}
                              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 p-2 text-slate-700 shadow transition hover:bg-white"
                              aria-label="Previous product image"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setStorefrontPreviewImageIndex(
                                  (activeIndex + 1) % previewImages.length,
                                );
                                setFailedStorefrontImageUrl(null);
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 p-2 text-slate-700 shadow transition hover:bg-white"
                              aria-label="Next product image"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {discountPercent > 0 && (
                          <span className="absolute left-3 top-3 rounded-sm bg-rose-700 px-2 py-1 text-[10px] font-bold text-white">
                            {discountPercent}% OFF
                          </span>
                        )}
                        {activeIndex === 0 && previewImages.length > 0 && (
                          <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium text-slate-700 shadow-sm">
                            Primary image
                          </span>
                        )}
                      </div>

                      {previewImages.length > 0 && (
                        <>
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                            <div className="flex items-center gap-2 font-semibold text-slate-700">
                              <GripVertical className="h-3.5 w-3.5 text-slate-400" />
                              Manage product images
                              <span className="font-normal text-slate-400">· Drag to reorder</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStorefrontImageKeys(
                                    selectedImagesCount === previewImages.length
                                      ? new Set()
                                      : new Set(previewImages.map(imageIdentity)),
                                  );
                                }}
                                className="rounded-md border border-slate-300 px-2 py-1 font-medium text-slate-600 hover:bg-slate-50"
                              >
                                {selectedImagesCount === previewImages.length ? "Deselect all" : "Select all"}
                              </button>
                              <button
                                type="button"
                                disabled={selectedImagesCount === 0}
                                onClick={() => {
                                  const count = selectedImagesCount;
                                  if (window.confirm(`Remove ${count} selected image(s) from this product? Only the remaining images will be imported.`)) {
                                    removePreviewImages(
                                      previewImages
                                        .map((media, index) => ({ media, index }))
                                        .filter(({ media, index }) => selectedStorefrontImageKeys.has(imageIdentity(media, index)))
                                        .map(({ index }) => index),
                                    );
                                  }
                                }}
                                className="rounded-md border border-rose-200 px-2 py-1 font-semibold text-rose-700 enabled:hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <span className="inline-flex items-center gap-1"><Trash2 className="h-3 w-3" /> Remove selected ({selectedImagesCount})</span>
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
                            {previewImages.map((media, index) => {
                              const thumbSrc = resolveImageUrl(
                                media.url,
                                media.thumbnailUrl,
                                getDriveProxyUrl,
                                getDriveThumbnailUrl,
                              );
                              const stableKey = imageIdentity(media, index);
                              const isSelected = selectedStorefrontImageKeys.has(stableKey);
                              const isPrimary = index === 0;
                              return (
                                <div
                                  key={stableKey}
                                  draggable={previewImages.length > 1}
                                  onDragStart={(event) => {
                                    setStorefrontDraggedImageIndex(index);
                                    event.dataTransfer.effectAllowed = "move";
                                    event.dataTransfer.setData("text/plain", stableKey);
                                  }}
                                  onDragOver={(event) => {
                                    event.preventDefault();
                                    event.dataTransfer.dropEffect = "move";
                                  }}
                                  onDrop={(event) => {
                                    event.preventDefault();
                                    if (storefrontDraggedImageIndex !== null) {
                                      movePreviewImage(storefrontDraggedImageIndex, index);
                                    }
                                  }}
                                  onDragEnd={() => setStorefrontDraggedImageIndex(null)}
                                  className={`group relative h-[88px] w-[66px] shrink-0 overflow-hidden rounded-md border-2 bg-white transition ${index === activeIndex ? "border-amber-700 ring-2 ring-amber-100" : isSelected ? "border-indigo-500 ring-1 ring-indigo-100" : "border-slate-200 hover:border-slate-400"} ${storefrontDraggedImageIndex === index ? "opacity-50" : ""}`}
                                  title="Drag to reorder. The first image is the primary image."
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setStorefrontPreviewImageIndex(index);
                                      setFailedStorefrontImageUrl(null);
                                    }}
                                    className="absolute inset-0 z-0"
                                    aria-label={`View product image ${index + 1}`}
                                  >
                                    {thumbSrc ? (
                                      <img
                                        key={thumbSrc}
                                        src={thumbSrc}
                                        alt=""
                                        loading="lazy"
                                        decoding="async"
                                        className="h-full w-full object-cover"
                                        onError={(event) => {
                                          const target = event.currentTarget;
                                          const proxyMatch = (media.url || "").match(/\/products\/bulk\/drive-proxy\/([^/?#]+)/);
                                          if (proxyMatch?.[1] && getDriveThumbnailUrl && !target.dataset.thumbnailFallback) {
                                            let fileId = proxyMatch[1];
                                            try { fileId = decodeURIComponent(fileId); } catch { /* keep encoded ID */ }
                                            const fallback = getDriveThumbnailUrl(fileId);
                                            if (fallback && target.src !== fallback) {
                                              target.dataset.thumbnailFallback = "true";
                                              target.src = fallback;
                                              return;
                                            }
                                          }
                                          target.style.visibility = "hidden";
                                        }}
                                      />
                                    ) : (
                                      <span className="flex h-full items-center justify-center">
                                        <ImageIcon className="h-5 w-5 text-slate-300" />
                                      </span>
                                    )}
                                  </button>
                                  <div className="absolute left-1 top-1 z-10">
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setSelectedStorefrontImageKeys((current) => {
                                          const next = new Set(current);
                                          if (next.has(stableKey)) next.delete(stableKey);
                                          else next.add(stableKey);
                                          return next;
                                        });
                                      }}
                                      className={`flex h-4 w-4 items-center justify-center rounded border shadow-sm ${isSelected ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-400 bg-white/95 text-transparent hover:border-indigo-600"}`}
                                      aria-label={isSelected ? "Deselect image" : "Select image"}
                                      aria-pressed={isSelected}
                                    >
                                      <Check className="h-3 w-3" />
                                    </button>
                                  </div>
                                  <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between gap-1 bg-slate-950/75 px-1 py-1">
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        if (index > 0) movePreviewImage(index, 0);
                                      }}
                                      disabled={isPrimary}
                                      title={isPrimary ? "Primary image" : "Set as primary"}
                                      className="flex min-w-0 items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-semibold text-white hover:bg-white/20 disabled:cursor-default disabled:opacity-100"
                                    >
                                      <Star className={`h-3 w-3 shrink-0 ${isPrimary ? "fill-amber-400 text-amber-400" : ""}`} />
                                      <span>{isPrimary ? "Primary" : "Set"}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        if (window.confirm(`Remove "${media.title || media.altText || `image ${index + 1}`}" from this product? It will not be uploaded.`)) {
                                          removePreviewImages([index]);
                                        }
                                      }}
                                      title="Remove image from import"
                                      aria-label={`Remove image ${index + 1}`}
                                      className="rounded p-0.5 text-white hover:bg-rose-600"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                  {isPrimary && (
                                    <span className="absolute left-1 top-6 z-10 rounded bg-amber-500 px-1 py-0.5 text-[8px] font-bold text-white">
                                      PRIMARY
                                    </span>
                                  )}
                                  <span className="sr-only">{media.title || media.altText || `Image ${index + 1}`}</span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                      <p className="mt-2 text-center text-[10px] text-slate-400">
                        {previewImages.length} retained product image{previewImages.length === 1 ? "" : "s"} · first image is primary
                      </p>
                    </div>
                  </section>

                  <section className="p-5 sm:p-7 lg:overflow-y-auto">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-800">
                      {previewProduct.categoryPath || "Kankana Silks"}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">
                      {previewProduct.name}
                    </h2>
                    {previewProduct.artisanName && (
                      <p className="mt-2 text-sm text-slate-500">
                        Woven by {previewProduct.artisanName}
                      </p>
                    )}
                    <div className="mt-5 flex flex-wrap items-baseline gap-2">
                      <span className="text-2xl font-semibold text-slate-900">
                        ₹{previewSellingPrice.toLocaleString("en-IN")}
                      </span>
                      {previewBasePrice > previewSellingPrice && (
                        <span className="text-sm text-slate-400 line-through">
                          ₹{previewBasePrice.toLocaleString("en-IN")}
                        </span>
                      )}
                      {discountPercent > 0 && (
                        <span className="rounded bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">
                          {discountPercent}% OFF
                        </span>
                      )}
                    </div>
                    {previewProduct.sku && (
                      <p className="mt-2 text-[11px] text-slate-400">
                        SKU: {previewProduct.sku}
                      </p>
                    )}

                    <div className="mt-5 border-y border-slate-200 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Product details
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                        {previewProduct.description ||
                          "No product description provided."}
                      </p>
                    </div>

                    {previewProduct.productType === "variable" &&
                      (previewProduct.variants?.length || 0) > 0 && (
                        <div className="mt-5">
                          <p className="text-xs font-semibold text-slate-800">
                            Available options
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {previewProduct.variants!.map((variant, index) => {
                              const optionName =
                                variant.title ||
                                [variant.color, variant.size, variant.fabric]
                                  .filter(Boolean)
                                  .join(" / ") ||
                                variant.sku ||
                                `Option ${index + 1}`;
                              const isSelectedOption =
                                (variant.sku || null) ===
                                storefrontSelectedVariantSku;
                              const optionPrice = Number(
                                variant.sellingPrice ??
                                  variant.price ??
                                  previewProduct.sellingPrice,
                              );
                              return (
                                <button
                                  key={variant.sku || index}
                                  type="button"
                                  onClick={() => {
                                    setStorefrontSelectedVariantSku(
                                      variant.sku || null,
                                    );
                                    setStorefrontPreviewImageIndex(0);
                                    setFailedStorefrontImageUrl(null);
                                  }}
                                  aria-pressed={isSelectedOption}
                                  className={`rounded-md border px-3 py-2 text-left text-xs transition ${isSelectedOption ? "border-amber-800 bg-amber-50 text-amber-950 ring-1 ring-amber-700" : "border-slate-300 text-slate-700 hover:border-slate-500"}`}
                                >
                                  <span className="block font-medium">
                                    {optionName}
                                  </span>
                                  <span className="mt-1 block font-semibold">
                                    ₹{optionPrice.toLocaleString("en-IN")}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    {previewProduct.specifications &&
                      previewProduct.specifications.length > 0 && (
                        <div className="mt-5">
                          <p className="text-xs font-semibold text-slate-800">
                            Specifications
                          </p>
                          <dl className="mt-2 divide-y divide-slate-100 border-y border-slate-100">
                            {previewProduct.specifications.map(
                              (spec, index) => (
                                <div
                                  key={`${spec.key}-${index}`}
                                  className="flex items-start justify-between gap-4 py-2 text-xs"
                                >
                                  <dt className="text-slate-500">{spec.key}</dt>
                                  <dd className="text-right font-medium text-slate-800">
                                    {spec.value}
                                  </dd>
                                </div>
                              ),
                            )}
                          </dl>
                        </div>
                      )}

                    <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-slate-500">Weight</p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {previewProduct.weight || "—"} kg
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-slate-500">Availability</p>
                        <p className="mt-1 font-semibold text-emerald-700">
                          {previewProduct.productType === "variable"
                            ? `${previewProduct.variants?.length || 0} options`
                            : (previewProduct.stock?.quantity ?? 0) > 0
                              ? "In stock"
                              : "Stock not set"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        disabled
                        className="cursor-not-allowed rounded-lg bg-slate-900 px-4 py-3 text-xs font-semibold text-white opacity-90"
                      >
                        Add to cart
                      </button>
                      <button
                        type="button"
                        disabled
                        className="cursor-not-allowed rounded-lg border border-slate-300 px-4 py-3 text-xs font-semibold text-slate-700 opacity-90"
                      >
                        Buy now
                      </button>
                    </div>
                    <p className="mt-2 text-center text-[10px] text-slate-400">
                      Preview only — storefront actions are disabled in the
                      admin preview.
                    </p>
                    {previewProduct.seo && (
                      <div className="mt-6 rounded-lg border border-dashed border-slate-200 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Search listing preview
                        </p>
                        <p className="mt-1 text-xs font-semibold text-blue-800">
                          {previewProduct.seo.metaTitle ||
                            previewProduct.metaTitle ||
                            previewProduct.name}
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                          {previewProduct.seo.metaDesc ||
                            previewProduct.metaDesc ||
                            previewProduct.description}
                        </p>
                      </div>
                    )}
                  </section>
                </div>
              </div>
            </div>
          );
        })()}

      {imageGallery && imageGallery.images[imageGallery.index] && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Product detail preview for ${imageGallery.product.name}`}
          onClick={() => setImageGallery(null)}
        >
          <div
            className="flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-slate-900">
                  {imageGallery.product.name}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Image {imageGallery.index + 1} of {imageGallery.images.length}{" "}
                  · Full-size image loads only in this viewer
                </p>
              </div>
              <button
                type="button"
                onClick={() => setImageGallery(null)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close image viewer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="relative flex min-h-[36vh] items-center justify-center bg-slate-950 p-3 sm:p-6">
                {imageGallery.index > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setImageGallery((current) =>
                        current
                          ? {
                              ...current,
                              index: Math.max(0, current.index - 1),
                            }
                          : current,
                      )
                    }
                    className="absolute left-3 z-10 rounded-full bg-white/90 p-2 text-slate-900 shadow transition hover:bg-white"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                {(() => {
                  const active = imageGallery.images[imageGallery.index];
                  const detailSrc = /^(https?:\/\/|\/)/i.test(active.url || "")
                    ? active.url
                    : undefined;
                  return detailSrc &&
                    active.type !== "VIDEO" &&
                    failedDetailImageUrl !== detailSrc ? (
                    <img
                      key={detailSrc}
                      src={detailSrc}
                      alt={
                        active.altText ||
                        active.title ||
                        imageGallery.product.name
                      }
                      loading="eager"
                      decoding="async"
                      className="max-h-[72vh] max-w-full object-contain"
                      onError={() => setFailedDetailImageUrl(detailSrc)}
                    />
                  ) : (
                    <div className="flex max-w-md flex-col items-center gap-2 px-6 py-12 text-center text-white">
                      <ImageIcon className="h-10 w-10 text-slate-400" />
                      <p className="text-sm font-medium">
                        {failedDetailImageUrl === detailSrc
                          ? "This image could not be loaded."
                          : "A full-size image URL is not available for this item."}
                      </p>
                      <p className="text-xs text-slate-400">
                        Check that this image was uploaded or run Drive matching
                        again.
                      </p>
                    </div>
                  );
                })()}
                {imageGallery.index < imageGallery.images.length - 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setImageGallery((current) =>
                        current
                          ? {
                              ...current,
                              index: Math.min(
                                current.images.length - 1,
                                current.index + 1,
                              ),
                            }
                          : current,
                      )
                    }
                    className="absolute right-3 z-10 rounded-full bg-white/90 p-2 text-slate-900 shadow transition hover:bg-white"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                )}
              </div>
              <aside className="max-h-[32vh] overflow-y-auto border-t border-slate-200 bg-white p-4 text-sm lg:max-h-[78vh] lg:border-l lg:border-t-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Product details
                </p>
                <p className="mt-3 font-mono text-xs text-slate-500">
                  {imageGallery.product.productGroupId}
                </p>
                <h4 className="mt-1 text-base font-semibold leading-snug text-slate-900">
                  {imageGallery.product.name}
                </h4>
                {imageGallery.product.sku && (
                  <p className="mt-1 text-xs text-slate-500">
                    SKU: {imageGallery.product.sku}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-900">
                    ₹
                    {Number(
                      imageGallery.product.sellingPrice || 0,
                    ).toLocaleString("en-IN")}
                  </span>
                  {imageGallery.product.basePrice >
                    imageGallery.product.sellingPrice && (
                    <span className="text-xs text-slate-400 line-through">
                      ₹
                      {Number(imageGallery.product.basePrice).toLocaleString(
                        "en-IN",
                      )}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">
                    Category:{" "}
                  </span>
                  {imageGallery.product.categoryPath || "Not assigned"}
                </p>
                {imageGallery.product.description && (
                  <div className="mt-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Description
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-700">
                      {imageGallery.product.description}
                    </p>
                  </div>
                )}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-slate-200 p-2">
                    <p className="text-[10px] text-slate-500">Type</p>
                    <p className="mt-0.5 text-xs font-semibold capitalize text-slate-800">
                      {imageGallery.product.productType}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-2">
                    <p className="text-[10px] text-slate-500">Weight</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-800">
                      {imageGallery.product.weight || "—"} kg
                    </p>
                  </div>
                </div>
                {imageGallery.product.stock && (
                  <div className="mt-3 rounded-lg border border-slate-200 p-2">
                    <p className="text-[10px] text-slate-500">Stock quantity</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-800">
                      {imageGallery.product.stock.quantity}
                    </p>
                  </div>
                )}
                {imageGallery.product.specifications &&
                  imageGallery.product.specifications.length > 0 && (
                    <div className="mt-4">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        Specifications
                      </p>
                      <dl className="mt-2 space-y-2">
                        {imageGallery.product.specifications.map(
                          (spec, index) => (
                            <div
                              key={spec.key + "-" + index}
                              className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 text-xs"
                            >
                              <dt className="text-slate-500">{spec.key}</dt>
                              <dd className="text-right font-medium text-slate-800">
                                {spec.value}
                              </dd>
                            </div>
                          ),
                        )}
                      </dl>
                    </div>
                  )}
              </aside>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
              <span className="truncate">
                {imageGallery.images[imageGallery.index].title ||
                  imageGallery.images[imageGallery.index].altText ||
                  "Product image"}
              </span>
              <button
                type="button"
                onClick={() => setImageGallery(null)}
                className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
