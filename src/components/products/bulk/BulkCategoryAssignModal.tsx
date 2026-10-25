import React, { useState } from "react";
import { X, Folder, Tag, AlertTriangle, Check, Layers, ChevronRight } from "lucide-react";
import type { BulkCategoryLookup, BulkCategoryNode, BulkParsedProduct } from "@/lib/types/product/bulkProduct";

interface BulkCategoryAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: BulkParsedProduct[];
  flatCategories: BulkCategoryLookup[];
  categoriesTree: BulkCategoryNode[];
  onApplyCategory: (categoryId: string, categoryPath: string, onlyUnassigned: boolean) => void;
}

export const BulkCategoryAssignModal: React.FC<BulkCategoryAssignModalProps> = ({
  isOpen,
  onClose,
  selectedProducts,
  flatCategories,
  categoriesTree: _categoriesTree,
  onApplyCategory,
}) => {
  const [selectedId, setSelectedId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);

  if (!isOpen) return null;

  const selectedCategory = flatCategories.find((c) => c.id === selectedId);

  const filteredCategories = search.trim()
    ? flatCategories.filter(
        (c) =>
          c.path.toLowerCase().includes(search.toLowerCase()) ||
          c.name.toLowerCase().includes(search.toLowerCase())
      )
    : flatCategories;

  const alreadyAssignedCount = selectedProducts.filter(
    (p) => Boolean(p.categoryId) || Boolean(p.categoryPath?.trim())
  ).length;

  const unassignedCount = selectedProducts.length - alreadyAssignedCount;

  const hasConflict = !onlyUnassigned && alreadyAssignedCount > 0;

  const handleApply = () => {
    if (!selectedCategory) return;
    if (hasConflict && !confirmOverwrite) return;
    onApplyCategory(selectedCategory.id, selectedCategory.path, onlyUnassigned);
    onClose();
  };

  // Convert "A > B > C" to breadcrumb parts
  const breadcrumbParts = selectedCategory
    ? selectedCategory.path.split(/[>→]/).map((s) => s.trim())
    : [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Assign Category to Products</h3>
              <p className="text-xs text-slate-500">
                {selectedProducts.length} product(s) selected
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Breadcrumb Preview */}
          {selectedCategory ? (
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1">
              <span className="text-[10px] font-semibold text-indigo-700 uppercase tracking-wider">
                Selected Category Breadcrumb
              </span>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-indigo-900 font-medium">
                {breadcrumbParts.map((part, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <ChevronRight className="h-3 w-3 text-indigo-400 shrink-0" />}
                    <span className="px-2 py-0.5 bg-white border border-indigo-200 rounded-md shadow-2xs font-semibold">
                      {part}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400">
              Select a category from the list below
            </div>
          )}

          {/* Search */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Search Categories</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. Silk Sarees, Kanchipuram..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
            />
          </div>

          {/* Category List */}
          <div className="border border-slate-200 rounded-xl max-h-52 overflow-y-auto divide-y divide-slate-100">
            {filteredCategories.length === 0 ? (
              <p className="p-4 text-center text-slate-400">No categories found matching "{search}"</p>
            ) : (
              filteredCategories.map((cat) => {
                const isSelected = cat.id === selectedId;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedId(cat.id)}
                    className={`w-full text-left px-3 py-2.5 flex items-center justify-between hover:bg-indigo-50/60 transition ${
                      isSelected ? "bg-indigo-50 text-indigo-900 font-semibold" : "text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <Tag className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-indigo-600" : "text-slate-400"}`} />
                      <span className="truncate">{cat.path}</span>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-indigo-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Target options */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyUnassigned}
                onChange={(e) => setOnlyUnassigned(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
              />
              <span className="text-slate-700 font-medium">
                Apply only to products without a category ({unassignedCount} of {selectedProducts.length})
              </span>
            </label>

            {/* Overwrite Confirmation Warning */}
            {hasConflict && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-amber-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs">
                    <strong>{alreadyAssignedCount} product(s)</strong> already have a category assigned.
                    Applying will overwrite their current category paths.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-amber-900">
                  <input
                    type="checkbox"
                    checked={confirmOverwrite}
                    onChange={(e) => setConfirmOverwrite(e.target.checked)}
                    className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                  />
                  <span>Yes, overwrite existing categories</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!selectedCategory || (hasConflict && !confirmOverwrite)}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-xs transition"
          >
            Apply Category
          </button>
        </div>
      </div>
    </div>
  );
};

