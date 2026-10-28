import React, { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import {
  AlertCircle,
  Box,
  CheckCircle2,
  Check,
  ChevronDown,
  DollarSign,
  Globe,
  HelpCircle,
  Layers,
  Percent,
  Ruler,
  Search,
  Tag,
  X,
  Video,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import type { Category } from "@/lib/types/category/category";
import type { ProductFormValues, Warehouse } from "@/lib/types/product";

export interface ProductSidebarControlsProps {
  categories: Category[];
  warehouses: Warehouse[];
  className?: string;
}

/**
 * Right Column (1/3 width) Contextual Controls:
 * - Status & Visibility
 * - Category, SKU & HSN
 * - Simple Pricing & Stock (when hasVariants is OFF)
 * - Shipping Dimensions
 * - Video Consultation & Backorders
 * - Live Google Search Preview (SEO)
 */
function getCategoryDisplayPath(category: Category, allCategories: Category[]): string {
  const explicitPath = (category as Category & { path?: string }).path;
  if (explicitPath?.trim()) return explicitPath.trim();
  const seen = new Set<string>([String(category.id)]);
  const names = [category.name];
  let parentId = category.parentId ?? category.parent?.id ?? category.parents?.[0]?.id ?? null;
  while (parentId && !seen.has(String(parentId))) {
    seen.add(String(parentId));
    const parent = allCategories.find((item) => String(item.id) === String(parentId));
    if (!parent) break;
    names.unshift(parent.name);
    parentId = parent.parentId ?? parent.parent?.id ?? parent.parents?.[0]?.id ?? null;
  }
  return names.join(" › ");
}

interface CategoryAutocompleteProps {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}

const normalizeCategoryText = (value: string) =>
  value.toLocaleLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").trim();

function categoryDepth(category: Category, allCategories: Category[]): number {
  const path = getCategoryDisplayPath(category, allCategories);
  const separators = path.match(/(?:\\s>\\s|\\s›\\s|\\s\\/\\s)/g);
  if (separators?.length) return separators.length;
  let depth = 0;
  let parentId = category.parentId ?? category.parent?.id ?? category.parents?.[0]?.id ?? null;
  const seen = new Set<string>([String(category.id)]);
  while (parentId && !seen.has(String(parentId))) {
    seen.add(String(parentId));
    const parent = allCategories.find((item) => String(item.id) === String(parentId));
    if (!parent) break;
    depth += 1;
    parentId = parent.parentId ?? parent.parent?.id ?? parent.parents?.[0]?.id ?? null;
  }
  return depth;
}

const CategoryAutocomplete: React.FC<CategoryAutocompleteProps> = ({
  categories,
  value,
  onChange,
  invalid = false,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const orderedCategories = useMemo(
    () => [...categories].sort((a, b) =>
      getCategoryDisplayPath(a, categories).localeCompare(
        getCategoryDisplayPath(b, categories),
        undefined,
        { sensitivity: "base", numeric: true },
      ),
    ),
    [categories],
  );
  const selectedCategory = categories.find((category) => String(category.id) === String(value));
  const selectedPath = selectedCategory ? getCategoryDisplayPath(selectedCategory, categories) : "";
  const filteredCategories = useMemo(() => {
    const term = normalizeCategoryText(query);
    if (!term) return orderedCategories;
    return orderedCategories.filter((category) => {
      const name = normalizeCategoryText(category.name);
      const path = normalizeCategoryText(getCategoryDisplayPath(category, categories));
      return name.includes(term) || path.includes(term);
    });
  }, [categories, orderedCategories, query]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const chooseCategory = (category: Category) => {
    onChange(String(category.id));
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <div className={`flex items-center gap-2 rounded-lg border bg-white px-3 transition-all focus-within:ring-2 ${
        invalid
          ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-100"
          : open
            ? "border-blue-500 focus-within:ring-blue-100"
            : "border-slate-300 focus-within:border-blue-500 focus-within:ring-blue-100"
      }`}>
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label="Search categories"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="product-category-options"
          aria-activedescendant={open && filteredCategories[activeIndex] ? `category-option-${filteredCategories[activeIndex].id}` : undefined}
          value={open ? query : selectedPath}
          placeholder="Search by category or parent path…"
          onFocus={() => {
            setQuery("");
            setOpen(true);
          }}
          onClick={() => {
            if (!open) {
              setQuery("");
              setOpen(true);
            }
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((current) => Math.min(current + 1, Math.max(filteredCategories.length - 1, 0)));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((current) => Math.max(current - 1, 0));
            } else if (event.key === "Enter" && open && filteredCategories[activeIndex]) {
              event.preventDefault();
              chooseCategory(filteredCategories[activeIndex]);
            } else if (event.key === "Escape") {
              setOpen(false);
              setQuery("");
              inputRef.current?.blur();
            }
          }}
          className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setQuery("");
              setOpen(true);
              inputRef.current?.focus();
            }}
            aria-label="Clear selected category"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setOpen((current) => !current);
            if (!open) {
              setQuery("");
              inputRef.current?.focus();
            }
          }}
          aria-label={open ? "Close category list" : "Open category list"}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="absolute z-[120] mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {query ? "Matching categories" : "Browse category hierarchy"}
            </span>
            <span className="text-[10px] tabular-nums text-slate-400">
              {filteredCategories.length} {filteredCategories.length === 1 ? "category" : "categories"}
            </span>
          </div>
          <div id="product-category-options" role="listbox" className="max-h-72 overflow-y-auto overscroll-contain p-1.5">
            {filteredCategories.length === 0 ? (
              <div className="px-3 py-7 text-center">
                <Search className="mx-auto mb-2 h-5 w-5 text-slate-300" />
                <p className="text-xs font-medium text-slate-600">No categories found</p>
                <p className="mt-1 text-[11px] text-slate-400">Try a category name or part of its parent path.</p>
              </div>
            ) : filteredCategories.map((category, index) => {
              const path = getCategoryDisplayPath(category, categories);
              const depth = categoryDepth(category, categories);
              const selected = String(category.id) === String(value);
              const active = index === activeIndex;
              const parts = path.split(/\s(?:>|›|\/)\s/);
              const leafName = parts[parts.length - 1] || category.name;
              const parentPath = parts.length > 1 ? parts.slice(0, -1).join(" › ") : "";
              return (
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  id={`category-option-${category.id}`}
                  key={category.id}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => chooseCategory(category)}
                  className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${
                    selected ? "bg-blue-50 text-blue-800" : active ? "bg-slate-50 text-slate-900" : "text-slate-700 hover:bg-slate-50"
                  }`}
                  style={{ paddingLeft: `${10 + Math.min(depth, 5) * 12}px` }}
                >
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                    {depth > 0 ? (
                      <span className="h-3 w-3 border-b border-l border-slate-300" />
                    ) : (
                      <span className={`h-2 w-2 rounded-sm ${selected ? "bg-blue-600" : "bg-slate-300"}`} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium">{leafName}</span>
                    {parentPath && (
                      <span className="mt-0.5 block truncate text-[10px] text-slate-400">{parentPath}</span>
                    )}
                  </span>
                  {selected && <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />}
                </button>
              );
            })}
          </div>
          <div className="border-t border-slate-100 bg-slate-50/70 px-3 py-2 text-[10px] text-slate-400">
            Search matches both category names and full parent paths.
          </div>
        </div>
      )}
      {selectedPath && !open && (
        <p className="mt-1.5 truncate text-[10px] text-slate-500" title={selectedPath}>
          Selected: <span className="font-medium text-slate-600">{selectedPath}</span>
        </p>
      )}
    </div>
  );
};

export const ProductSidebarControls: React.FC<ProductSidebarControlsProps> = ({
  categories,
  warehouses,
  className = "",
}) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProductFormValues>();

  const hasVariants = useWatch({ control, name: "hasVariants" });
  const isActive = useWatch({ control, name: "isActive" });
  const basePrice = useWatch({ control, name: "basePrice" }) || 0;
  const sellingPrice = useWatch({ control, name: "sellingPrice" }) || 0;
  const metaTitle = useWatch({ control, name: "metaTitle" }) || "";
  const metaDesc = useWatch({ control, name: "metaDesc" }) || "";
  const name = useWatch({ control, name: "name" }) || "";

  // Discount percentage calculation
  const discountPercent =
    basePrice > 0 && sellingPrice > 0 && sellingPrice < basePrice
      ? Math.round(((basePrice - sellingPrice) / basePrice) * 100)
      : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Status & Visibility Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Product Status</h3>
          <span
            className={`px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider ${
              isActive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {isActive ? "Active" : "Draft"}
          </span>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              id="isActiveToggle"
              {...register("isActive")}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-xs font-semibold text-slate-800 block">
                Visible in Online Store
              </span>
              <span className="text-3xs text-slate-500 block">
                Customers can view and purchase this product
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* 2. Organization & Category Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Tag className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Category &amp; Classification
          </h3>
        </div>

        <div className="space-y-3.5">
          {/* Category Dropdown */}
          <div>
            <label className="block text-2xs font-semibold text-slate-700 uppercase mb-1">
              Category *
            </label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <CategoryAutocomplete
                  categories={categories}
                  value={String(field.value ?? "")}
                  onChange={field.onChange}
                  invalid={Boolean(errors.categoryId)}
                />
              )}
            />
            {errors.categoryId && (
              <p className="mt-1 text-2xs text-red-600 font-medium">
                {errors.categoryId.message}
              </p>
            )}
          </div>

          {/* Root SKU */}
          <div>
            <label className="block text-2xs font-semibold text-slate-700 uppercase mb-1">
              Base SKU
            </label>
            <input
              type="text"
              {...register("sku")}
              placeholder="e.g. KS-SILK-001"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* HSN Code */}
          <div>
            <label className="block text-2xs font-semibold text-slate-700 uppercase mb-1">
              HSN Code
            </label>
            <input
              type="text"
              {...register("hsnCode")}
              placeholder="e.g. 5007"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* 3. Pricing Card (When hasVariants is OFF) */}
      {!hasVariants && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Pricing</h3>
            </div>

            {discountPercent > 0 && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-3xs font-bold">
                <Percent className="h-3 w-3" />
                {discountPercent}% OFF
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-2xs font-semibold text-slate-700 uppercase mb-1">
                MRP / Base Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                {...register("basePrice", { valueAsNumber: true })}
                placeholder="15000"
                className={`w-full px-3 py-2 rounded-lg border text-xs bg-white ${
                  errors.basePrice
                    ? "border-red-500 focus:ring-red-500"
                    : "border-slate-300 focus:ring-blue-500"
                } focus:outline-hidden`}
              />
              {errors.basePrice && (
                <p className="mt-1 text-2xs text-red-600 font-medium">
                  {errors.basePrice.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-2xs font-semibold text-slate-700 uppercase mb-1">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                {...register("sellingPrice", { valueAsNumber: true })}
                placeholder="12999"
                className={`w-full px-3 py-2 rounded-lg border text-xs bg-white font-semibold text-slate-900 ${
                  errors.sellingPrice
                    ? "border-red-500 focus:ring-red-500"
                    : "border-slate-300 focus:ring-blue-500"
                } focus:outline-hidden`}
              />
              {errors.sellingPrice && (
                <p className="mt-1 text-2xs text-red-600 font-medium">
                  {errors.sellingPrice.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Stock & Inventory Card (When hasVariants is OFF) */}
      {!hasVariants && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <WarehouseIcon className="h-4 w-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Inventory &amp; Stock
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-2xs font-semibold text-slate-700 uppercase mb-1">
                Warehouse *
              </label>
              <select
                {...register("stock.warehouseId")}
                className={`w-full px-3 py-2 rounded-lg border text-xs bg-white ${
                  errors.stock?.warehouseId
                    ? "border-red-500 focus:ring-red-500"
                    : "border-slate-300 focus:ring-blue-500"
                } focus:outline-hidden`}
              >
                <option value="">Select warehouse</option>
                {warehouses.map((w) => (
                  <option key={String(w.id)} value={String(w.id)}>
                    {w.name}{w.code ? ` (${w.code})` : ""}
                  </option>
                ))}
              </select>
              {errors.stock?.warehouseId && (
                <p className="mt-1 text-2xs text-red-600 font-medium">
                  {errors.stock.warehouseId.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-2xs font-semibold text-slate-700 uppercase mb-1">
                Quantity *
              </label>
              <input
                type="number"
                {...register("stock.quantity", { valueAsNumber: true })}
                placeholder="25"
                className={`w-full px-3 py-2 rounded-lg border text-xs bg-white ${
                  errors.stock?.quantity
                    ? "border-red-500 focus:ring-red-500"
                    : "border-slate-300 focus:ring-blue-500"
                } focus:outline-hidden`}
              />
              {errors.stock?.quantity && (
                <p className="mt-1 text-2xs text-red-600 font-medium">
                  {errors.stock.quantity.message}
                </p>
              )}
            </div>

            {/* Allow Out Of Stock Orders Toggle / Checkbox */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center justify-between cursor-pointer select-none">
                <div className="pr-2">
                  <span className="text-xs font-semibold text-slate-800 block">
                    Allow Out Of Stock Orders
                  </span>
                  <span className="text-3xs text-slate-500 block mt-0.5">
                    Continue selling when stock reaches 1
                  </span>
                </div>
                <input
                  type="checkbox"
                  {...register("allowOutOfStockOrders")}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 5. Shipping Dimensions Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Ruler className="h-4 w-4 text-slate-700" />
          <h3 className="text-sm font-bold text-slate-900">
            Shipping Dimensions *
          </h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-2xs font-semibold text-slate-700 uppercase mb-1">
              Weight (kg) *
            </label>
            <input
              type="number"
              step="0.01"
              {...register("weight", { valueAsNumber: true })}
              placeholder="0.5"
              className={`w-full px-3 py-2 rounded-lg border text-xs bg-white ${
                errors.weight ? "border-red-500" : "border-slate-300"
              } focus:ring-blue-500 focus:outline-hidden`}
            />
            {errors.weight && (
              <p className="mt-1 text-2xs text-red-600 font-medium">
                {errors.weight.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-3xs font-semibold text-slate-600 uppercase mb-1">
                L (cm) *
              </label>
              <input
                type="number"
                step="0.1"
                {...register("length", { valueAsNumber: true })}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-3xs font-semibold text-slate-600 uppercase mb-1">
                B (cm) *
              </label>
              <input
                type="number"
                step="0.1"
                {...register("breadth", { valueAsNumber: true })}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-3xs font-semibold text-slate-600 uppercase mb-1">
                H (cm) *
              </label>
              <input
                type="number"
                step="0.1"
                {...register("height", { valueAsNumber: true })}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 6. Video Consultation & Backorders */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3.5">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Video className="h-4 w-4 text-purple-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Consultation &amp; Orders
          </h3>
        </div>

        <div className="space-y-3">
          {/* Allow Out Of Stock Orders */}
          <label className="flex items-center justify-between cursor-pointer select-none pb-2 border-b border-slate-100">
            <div className="pr-2">
              <span className="text-xs font-semibold text-slate-800 block">
                Allow Out Of Stock Orders
              </span>
              <span className="text-3xs text-slate-500 block mt-0.5">
                Continue selling when stock reaches 1
              </span>
            </div>
            <input
              type="checkbox"
              {...register("allowOutOfStockOrders")}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              {...register("hasVideoConsultation")}
              className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-xs text-slate-700 font-medium">
              Enable Video Consultation Booking
            </span>
          </label>

          <div>
            <label className="block text-3xs font-semibold text-slate-600 uppercase mb-1">
              Consultation Schedule Note
            </label>
            <input
              type="text"
              {...register("videoConsultationNote")}
              placeholder="e.g. 10:00 AM - 6:00 PM IST"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-purple-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* 7. Search Engine Listing (SEO) Live Preview */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Globe className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Search Engine Preview
          </h3>
        </div>

        {/* Google Snippet Live Card */}
        <div className="bg-slate-50/80 p-3.5 rounded-lg border border-slate-200/80 space-y-1">
          <span className="text-3xs text-emerald-800 font-medium block truncate">
            https://kankana.com/products/
            {(name || "product-title")
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")}
          </span>
          <h4 className="text-xs font-semibold text-blue-700 truncate">
            {metaTitle || name || "Product Title - Kankana Silks"}
          </h4>
          <p className="text-3xs text-slate-600 line-clamp-2 leading-relaxed">
            {metaDesc ||
              "Discover pure handwoven silk sarees crafted by master weavers. Authentic silk mark certified with doorstep delivery worldwide."}
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-2xs font-semibold text-slate-700 uppercase mb-1">
              SEO Meta Title
            </label>
            <input
              type="text"
              {...register("metaTitle")}
              placeholder="e.g. Pure Kanchipuram Silk Sarees Online"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-2xs font-semibold text-slate-700 uppercase mb-1">
              SEO Meta Description
            </label>
            <textarea
              rows={2}
              {...register("metaDesc")}
              placeholder="Brief summary for search engine results..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
