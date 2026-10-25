import React, { useState, useMemo } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  ChevronDown,
  ChevronRight,
  Layers,
  Box,
  Tag,
  Image as ImageIcon,
  Globe,
  Trash2,
  Edit2,
  Plus,
  FileSpreadsheet,
  Download,
  Truck,
  Video,
  Info,
  Square,
  Check,
} from "lucide-react";
import type {
  BulkParsedProduct,
  BulkParsedVariant,
  BulkValidationError,
  BulkValidationSummary,
  BulkCategoryLookup,
  BulkCategoryNode,
} from "@/lib/types/product/bulkProduct";
import { BulkCategoryAssignModal } from "./BulkCategoryAssignModal";

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
}

export const BulkProductPreviewTable: React.FC<BulkProductPreviewTableProps> = ({
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
}) => {
  const [internalFilterStatus, setInternalFilterStatus] = useState<"all" | "valid" | "error" | "warning">("all");
  const filterStatus = externalFilterStatus ?? internalFilterStatus;
  const setFilterStatus = (s: "all" | "valid" | "error" | "warning") => {
    setInternalFilterStatus(s);
    externalOnFilterChange?.(s);
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Editing state for inline edits
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<BulkParsedProduct | null>(null);

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
      const hasErrors = p.errors && p.errors.some((e) => e.severity === "error");
      const hasWarnings = p.errors && p.errors.some((e) => e.severity === "warning");
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
        const matchesVariantSku = p.variants?.some((v) => v.sku?.toLowerCase().includes(query));

        if (!matchesName && !matchesSku && !matchesGroup && !matchesCat && !matchesVariantSku) {
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
      onUpdateProduct(editFormData);
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
    onlyUnassigned: boolean
  ) => {
    const updated = products.map((p) => {
      if (!selectedIds.has(p.productGroupId)) return p;
      if (onlyUnassigned && (p.categoryId || p.categoryPath?.trim())) {
        return p;
      }
      return {
        ...p,
        categoryId,
        categoryPath,
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
        `Are you sure you want to delete ${selectedIds.size} selected product(s)?`
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
            Valid ({summary?.validProducts ?? products.filter((p) => p.isValid !== false).length})
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
            With Errors ({summary?.invalidProducts ?? products.filter((p) => p.errors?.some((e) => e.severity === "error")).length})
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
          <p className="text-base font-semibold text-slate-700">No products match current filter</p>
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
            const productErrors = product.errors?.filter((e) => e.severity === "error") || [];
            const productWarnings = product.errors?.filter((e) => e.severity === "warning") || [];
            const isRowValid = productErrors.length === 0 && product.isValid !== false;
            const isEditing = editingGroupId === product.productGroupId;

            const discount =
              product.basePrice > 0
                ? Math.round(((product.basePrice - product.sellingPrice) / product.basePrice) * 100)
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
                      title={selectedIds.has(product.productGroupId) ? "Deselect" : "Select"}
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
                            {product.categoryPath.split(/[>→]/).map((seg, i, arr) => (
                              <React.Fragment key={i}>
                                {i > 0 && <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />}
                                <span className={i === arr.length - 1 ? "font-semibold text-indigo-900" : "text-slate-600"}>
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
                          <span className="text-slate-400 text-[11px]">· Artisan: {product.artisanName}</span>
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
                            Stock: <strong>{product.stock?.quantity ?? 0}</strong> ({product.stock?.warehouseCode || "Default"})
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
                        <label className="block text-slate-600 font-medium mb-1">Product Name</label>
                        <input
                          type="text"
                          value={editFormData.name}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, name: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">Category Full Path</label>
                        <input
                          type="text"
                          value={editFormData.categoryPath}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, categoryPath: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">Base Price (MRP)</label>
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
                        <label className="block text-slate-600 font-medium mb-1">Selling Price</label>
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
                        <label className="block text-slate-600 font-medium mb-1">Parent SKU</label>
                        <input
                          type="text"
                          value={editFormData.sku || ""}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, sku: e.target.value })
                          }
                          placeholder="Auto-generate if empty"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">Weight (kg)</label>
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
                          <label className="block text-slate-600 font-medium mb-1">Stock Quantity</label>
                          <input
                            type="number"
                            value={editFormData.stock?.quantity ?? 0}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                stock: {
                                  warehouseId: editFormData.stock?.warehouseId || "1",
                                  warehouseCode: editFormData.stock?.warehouseCode || "DEFAULT",
                                  quantity: parseInt(e.target.value, 10) || 0,
                                },
                              })
                            }
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">HSN Code</label>
                        <input
                          type="text"
                          value={editFormData.hsnCode || ""}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, hsnCode: e.target.value })
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
                              const newVariants = [...(editFormData.variants || [])];
                              newVariants.push({
                                sku: `${editFormData.sku || editFormData.productGroupId}-VAR-${newVariants.length + 1}`,
                                size: "Free Size",
                                color: "New Colour",
                                fabric: "Pure Silk",
                                sellingPrice: editFormData.sellingPrice,
                                stock: { warehouseId: "1", warehouseCode: "DEFAULT", quantity: 1, lowStockThreshold: 5 },
                              });
                              setEditFormData({ ...editFormData, variants: newVariants });
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
                                <th className="py-2 px-2.5 text-right">Price (₹)</th>
                                <th className="py-2 px-2.5 text-right">Stock</th>
                                <th className="py-2 px-2.5 text-center">Action</th>
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
                                        const nextVariants = [...(editFormData.variants || [])];
                                        nextVariants[vIdx] = { ...nextVariants[vIdx], sku: e.target.value };
                                        setEditFormData({ ...editFormData, variants: nextVariants });
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
                                        const nextVariants = [...(editFormData.variants || [])];
                                        nextVariants[vIdx] = { ...nextVariants[vIdx], size: e.target.value };
                                        setEditFormData({ ...editFormData, variants: nextVariants });
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
                                        const nextVariants = [...(editFormData.variants || [])];
                                        nextVariants[vIdx] = { ...nextVariants[vIdx], color: e.target.value };
                                        setEditFormData({ ...editFormData, variants: nextVariants });
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
                                        const nextVariants = [...(editFormData.variants || [])];
                                        nextVariants[vIdx] = { ...nextVariants[vIdx], fabric: e.target.value };
                                        setEditFormData({ ...editFormData, variants: nextVariants });
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
                                        const nextVariants = [...(editFormData.variants || [])];
                                        nextVariants[vIdx] = {
                                          ...nextVariants[vIdx],
                                          sellingPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                                        };
                                        setEditFormData({ ...editFormData, variants: nextVariants });
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
                                        const nextVariants = [...(editFormData.variants || [])];
                                        nextVariants[vIdx] = {
                                          ...nextVariants[vIdx],
                                          stock: {
                                            warehouseId: nextVariants[vIdx].stock?.warehouseId || "1",
                                            warehouseCode: nextVariants[vIdx].stock?.warehouseCode || "DEFAULT",
                                            quantity: parseInt(e.target.value, 10) || 0,
                                          },
                                        };
                                        setEditFormData({ ...editFormData, variants: nextVariants });
                                      }}
                                      className="w-20 px-2 py-1 border border-slate-300 rounded text-xs text-right bg-white"
                                      placeholder="Stock"
                                    />
                                  </td>
                                  <td className="p-1.5 text-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextVariants = editFormData.variants?.filter((_, i) => i !== vIdx) || [];
                                        setEditFormData({ ...editFormData, variants: nextVariants });
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
                          Validation Issues for {product.productGroupId} ({product.errors.length})
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
                              {product.length} × {product.breadth} × {product.height} cm
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-400">HSN Code:</span>{" "}
                            <span className="font-mono">{product.hsnCode || "—"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Backorders:</span>{" "}
                            <strong>{product.allowOutOfStockOrders ? "Allowed" : "No"}</strong>
                          </div>
                        </div>
                      </div>
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
                                  <th className="py-2.5 px-3">Other Attributes</th>
                                  <th className="py-2.5 px-3 text-right">Price Override</th>
                                  <th className="py-2.5 px-3 text-right">Stock</th>
                                  <th className="py-2.5 px-3">Warehouse</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {product.variants.map((v, idx) => {
                                  const isDuplicateColor = Boolean(
                                    v.color &&
                                    (product.variants || []).filter(
                                      (other) => other.color?.trim().toLowerCase() === v.color?.trim().toLowerCase()
                                    ).length > 1
                                  );
                                  const variantMedia = product.media?.filter(
                                    (m) => m.variantSku === v.sku || (!v.sku && m.variantSku === String(idx + 1))
                                  ) || [];

                                  return (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                      <td className="py-2 px-3 font-mono font-medium text-slate-800">
                                        {v.sku || <span className="text-slate-400 italic">auto-generated</span>}
                                      </td>
                                      <td className="py-2 px-3 text-slate-700">{v.size || "—"}</td>
                                      <td className="py-2 px-3 text-slate-700">
                                        <span>{v.color || "—"}</span>
                                        {isDuplicateColor && (
                                          <span className="ml-1.5 inline-flex items-center text-[10px] bg-rose-100 text-rose-700 border border-rose-300 font-bold px-1.5 py-0.2 rounded">
                                            Duplicate
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-2 px-3 text-slate-700">{v.fabric || "—"}</td>
                                      <td className="py-2 px-3">
                                        {variantMedia.length > 0 ? (
                                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[10px]">
                                            <ImageIcon className="h-3 w-3" /> {variantMedia.length} photo{variantMedia.length !== 1 ? "s" : ""}
                                          </span>
                                        ) : (
                                          <span className="text-slate-400 italic text-[11px]">None</span>
                                        )}
                                      </td>
                                      <td className="py-2 px-3 text-slate-600">
                                        {v.attributes
                                          ? Object.entries(v.attributes)
                                              .filter(([k]) => !["Size", "Color", "Fabric"].includes(k))
                                              .map(([k, val]) => `${k}: ${val}`)
                                              .join(", ") || "—"
                                          : "—"}
                                      </td>
                                      <td className="py-2 px-3 text-right font-medium text-slate-900">
                                        {v.sellingPrice ? (
                                          <span>₹{v.sellingPrice.toLocaleString()}</span>
                                        ) : (
                                          <span className="text-slate-400 italic">Inherits parent</span>
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
                            No variants configured for this variable product. Add variants on the Variants sheet.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Media & SEO Galleries */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Media items */}
                      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                        <span className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <ImageIcon className="h-4 w-4 text-blue-600" />
                          Media Attachments ({product.media?.length || 0})
                        </span>
                        {product.media && product.media.length > 0 ? (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                            {product.media.map((m, mIdx) => (
                              <div
                                key={mIdx}
                                className="group relative rounded-lg border border-slate-200 overflow-hidden bg-slate-100 aspect-square"
                              >
                                {m.type === "VIDEO" ? (
                                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-white">
                                    <Video className="h-6 w-6 text-slate-300" />
                                    <span className="text-[9px] uppercase mt-1">Video</span>
                                  </div>
                                ) : (
                                  <img
                                    src={m.url}
                                    alt={m.altText || product.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.currentTarget as any).src =
                                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
                                    }}
                                  />
                                )}
                                  <div className="absolute top-1 left-1">
                                    {(m.order === 0 || mIdx === 0) ? (
                                      <span className="bg-amber-500 text-white font-bold text-[9px] px-1 py-0.5 rounded shadow">
                                        ★ Primary
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const nextMedia = [...(product.media || [])];
                                          const [chosen] = nextMedia.splice(mIdx, 1);
                                          nextMedia.unshift({ ...chosen, order: 0 });
                                          // re-index order
                                          const reindexed = nextMedia.map((item, idx) => ({ ...item, order: idx }));
                                          onUpdateProduct({ ...product, media: reindexed });
                                        }}
                                        className="opacity-0 group-hover:opacity-100 bg-slate-900/80 hover:bg-blue-600 text-white text-[9px] px-1 py-0.5 rounded transition shadow"
                                        title="Set as primary image"
                                      >
                                        Set Primary
                                      </button>
                                    )}
                                  </div>
                                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextMedia = (product.media || []).filter((_, i) => i !== mIdx);
                                        onUpdateProduct({ ...product, media: nextMedia });
                                      }}
                                      className="p-1 rounded bg-slate-900/80 hover:bg-rose-600 text-white shadow"
                                      title="Remove photo"
                                    >
                                      <Trash2 className="h-2.5 w-2.5" />
                                    </button>
                                  </div>
                                  <div className="absolute bottom-0 inset-x-0 bg-slate-900/70 text-white text-[9px] px-1 py-0.5 truncate text-center">
                                    {m.variantSku ? `SKU: ${m.variantSku}` : `Order #${m.order ?? mIdx}`}
                                  </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-400 italic pt-1">No media specified.</p>
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
                              <span className="text-slate-400">Meta Title:</span>{" "}
                              <span className="font-medium">{product.seo.metaTitle || "—"}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Meta Description:</span>{" "}
                              <p className="text-slate-600 mt-0.5 italic">{product.seo.metaDesc || "—"}</p>
                            </div>
                            <div>
                              <span className="text-slate-400">Custom URL Slug:</span>{" "}
                              <span className="font-mono text-blue-700">{product.seo.slug || "Auto-generated"}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-400 italic pt-1">No custom SEO data specified (will use defaults).</p>
                        )}
                      </div>
                    </div>
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
          selectedProducts={products.filter((p) => selectedIds.has(p.productGroupId))}
          flatCategories={flatCategories}
          categoriesTree={categoriesTree || []}
          onApplyCategory={handleBulkApplyCategory}
        />
      )}
    </div>
  );
};

