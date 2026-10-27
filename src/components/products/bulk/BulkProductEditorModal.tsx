/**
 * BulkProductEditorModal
 *
 * Structured 12-section editor for editing a single parsed product:
 * 1. Basic Information
 * 2. Category
 * 3. Pricing
 * 4. Inventory & Warehouse
 * 5. Shipping & Dimensions
 * 6. Product Specifications
 * 7. Product Images
 * 8. Variants
 * 9. SEO Metadata
 * 10. Artisan Information
 * 11. Additional Settings
 * 12. Advanced JSON (View & Edit JSON with validation)
 */
import React, { useState, useEffect } from "react";
import {
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Layers,
  Globe,
  Image as ImageIcon,
  Package,
  DollarSign,
  Warehouse,
  Code,
  Copy,
  CheckCircle2,
  FileSpreadsheet,
  Truck,
  Video,
  User,
  Settings,
  AlertCircle,
  Tag,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-hot-toast";
import type {
  BulkParsedProduct,
  BulkParsedVariant,
  BulkParsedMedia,
  BulkCategoryNode,
  BulkCategoryLookup,
  BulkWarehouse,
} from "@/lib/types/product/bulkProduct";
import { BulkImageGallery } from "./BulkImageGallery";
import {
  normalizeCategoryPath,
  resolveCategory,
  validateBulkProduct,
} from "@/lib/utils/bulkProductNormalization";

interface BulkProductEditorModalProps {
  product: BulkParsedProduct;
  categoriesTree: BulkCategoryNode[];
  flatCategories: BulkCategoryLookup[];
  warehouses: BulkWarehouse[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: BulkParsedProduct) => void;
  getThumbnailUrl?: (ref: string) => string | undefined;
}

// Collapsible Section Component
const Section: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
}> = ({ title, icon, children, defaultOpen = true, badge }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
      >
        <span className="flex items-center gap-2">
          {icon}
          {title}
          {badge !== undefined && (
            <span className="ml-1.5 px-2 py-0.5 text-[10px] bg-indigo-100 text-indigo-700 rounded-full font-semibold">
              {badge}
            </span>
          )}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>
      {open && <div className="p-4 space-y-4 bg-white border-t border-slate-100">{children}</div>}
    </div>
  );
};

// Searchable Category Selector
const CategoryCombobox: React.FC<{
  flatCategories: BulkCategoryLookup[];
  categoryId?: string;
  categoryPath?: string;
  onChange: (category: BulkCategoryLookup) => void;
}> = ({ flatCategories, categoryId, categoryPath, onChange }) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  // Match by ID, or fallback to matching by normalized path
  const selected =
    (categoryId ? flatCategories.find((c) => c.id === categoryId) : null) ||
    (categoryPath
      ? flatCategories.find(
          (c) => normalizeCategoryPath(c.path) === normalizeCategoryPath(categoryPath)
        )
      : null);

  const filtered = search.trim()
    ? flatCategories.filter(
        (c) =>
          c.path.toLowerCase().includes(search.toLowerCase()) ||
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.id.toLowerCase().includes(search.toLowerCase())
      )
    : flatCategories;

  const breadcrumbParts = selected
    ? selected.path.split(/[>→/]/).map((s) => s.trim())
    : categoryPath
    ? categoryPath.split(/[>→/]/).map((s) => s.trim())
    : [];

  return (
    <div className="space-y-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white hover:border-indigo-400 transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <span className={selected ? "text-slate-900 font-medium" : "text-slate-400"}>
            {selected ? selected.path : categoryPath || "Select category…"}
          </span>
          <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            <div className="p-2 border-b border-slate-100 bg-slate-50">
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search categories by name or path…"
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              />
            </div>
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No categories found</p>
              ) : (
                filtered.map((c) => {
                  const isCurrent = selected?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onChange(c);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={`w-full text-left px-3 py-2.5 text-xs hover:bg-indigo-50 transition flex items-center justify-between ${
                        isCurrent ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <Tag className={`h-3 w-3 shrink-0 ${isCurrent ? "text-indigo-600" : "text-slate-400"}`} />
                        <span className="truncate">{c.path}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                        {c.id}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {breadcrumbParts.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
          <span className="text-slate-400 font-medium mr-1">Hierarchy:</span>
          {breadcrumbParts.map((part, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />}
              <span
                className={
                  idx === breadcrumbParts.length - 1
                    ? "font-bold text-indigo-700"
                    : "text-slate-600"
                }
              >
                {part}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

// Google Search Snippet Preview
const SeoPreview: React.FC<{ title: string; description: string; slug?: string }> = ({
  title,
  description,
  slug,
}) => (
  <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1 shadow-2xs">
    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
      Google Search Preview
    </p>
    <p className="text-emerald-700 text-[11px] truncate font-mono">
      https://kankana-silks.com/products/{slug || "product-url"}
    </p>
    <p className="text-blue-700 font-medium text-sm truncate hover:underline cursor-pointer">
      {title || "Product Title"}
    </p>
    <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
      {description || "Meta description will appear here in search engine results."}
    </p>
  </div>
);

export const BulkProductEditorModal: React.FC<BulkProductEditorModalProps> = ({
  product,
  categoriesTree: _categoriesTree,
  flatCategories,
  warehouses,
  isOpen,
  onClose,
  onSave,
  getThumbnailUrl,
}) => {
  const [form, setForm] = useState<BulkParsedProduct>(product);
  const [isSaving, setIsSaving] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isEditingJson, setIsEditingJson] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync form state when product prop changes
  useEffect(() => {
    setForm(product);
    setJsonText(JSON.stringify(product, null, 2));
    setJsonError(null);
    setIsEditingJson(false);
  }, [product]);

  if (!isOpen) return null;

  const defaultWarehouse = warehouses.find((w) => w.isDefaultPickup) || warehouses[0];

  const setField = <K extends keyof BulkParsedProduct>(key: K, val: BulkParsedProduct[K]) => {
    setForm((f) => {
      const next = { ...f, [key]: val };
      setJsonText(JSON.stringify(next, null, 2));
      return next;
    });
  };

  const handleCategorySelect = (category: BulkCategoryLookup) => {
    setForm((f) => {
      const next = {
        ...f,
        categoryId: category.id,
        categoryPath: category.path,
        categoryName: category.name,
      };
      setJsonText(JSON.stringify(next, null, 2));
      return next;
    });
  };

  const setStockField = (
    key: "warehouseId" | "warehouseCode" | "quantity" | "lowStockThreshold",
    val: string | number
  ) => {
    setForm((f) => {
      const currentStock = f.stock || {
        warehouseId: defaultWarehouse?.id || "",
        warehouseCode: defaultWarehouse?.code || "WH-01",
        quantity: 0,
        lowStockThreshold: 5,
      };
      let patch: any = { [key]: val };
      if (key === "warehouseId") {
        const found = warehouses.find((w) => w.id === val);
        if (found) patch.warehouseCode = found.code;
      }
      const nextStock = { ...currentStock, ...patch };
      const next = { ...f, stock: nextStock };
      setJsonText(JSON.stringify(next, null, 2));
      return next;
    });
  };

  const setSeoField = (
    key: "metaTitle" | "metaDesc" | "slug" | "schemaMarkup",
    val: string
  ) => {
    setForm((f) => {
      const nextSeo = { ...f.seo, [key]: val };
      const next: BulkParsedProduct = {
        ...f,
        seo: nextSeo,
        metaTitle: key === "metaTitle" ? val : f.metaTitle,
        metaDesc: key === "metaDesc" ? val : f.metaDesc,
      };
      setJsonText(JSON.stringify(next, null, 2));
      return next;
    });
  };

  // Variants handlers
  const updateVariant = (idx: number, patch: Partial<BulkParsedVariant>) => {
    setForm((f) => {
      const nextVariants = (f.variants || []).map((v, i) =>
        i === idx ? { ...v, ...patch } : v
      );
      const next = { ...f, variants: nextVariants };
      setJsonText(JSON.stringify(next, null, 2));
      return next;
    });
  };

  const addVariant = () => {
    setForm((f) => {
      const nextIdx = (f.variants?.length || 0) + 1;
      const nextVariant: BulkParsedVariant = {
        sku: `${form.sku || form.productGroupId}-VAR-${nextIdx}`,
        title: `Variant ${nextIdx}`,
        size: "Free Size",
        color: "New Color",
        fabric: "Pure Silk",
        attributes: { Size: "Free Size", Fabric: "Pure Silk" },
        basePrice: form.basePrice,
        sellingPrice: form.sellingPrice,
        price: form.sellingPrice,
        weight: form.weight,
        length: form.length,
        breadth: form.breadth,
        height: form.height,
        stock: {
          warehouseId: defaultWarehouse?.id || "",
          warehouseCode: defaultWarehouse?.code || "WH-01",
          quantity: 10,
          lowStockThreshold: 5,
        },
      };
      const next = { ...f, variants: [...(f.variants || []), nextVariant] };
      setJsonText(JSON.stringify(next, null, 2));
      return next;
    });
  };

  const removeVariant = (idx: number) => {
    setForm((f) => {
      const nextVariants = (f.variants || []).filter((_, i) => i !== idx);
      const next = { ...f, variants: nextVariants };
      setJsonText(JSON.stringify(next, null, 2));
      return next;
    });
  };

  // Save handler with validation & unified images
  const handleSave = () => {
    setIsSaving(true);
    try {
      // 1. Ensure category is resolved
      const resolvedCat = resolveCategory(
        form.categoryPath,
        form.categoryId,
        flatCategories
      );

      // 2. Build unified allImages
      const unifiedImages: BulkParsedMedia[] = [
        ...(form.media || []).map((m, idx) => ({
          ...m,
          source: "product" as const,
          order: m.order ?? idx,
        })),
        ...(form.variants || []).flatMap((v) =>
          (v.media || []).map((m, idx) => ({
            ...m,
            source: "variant" as const,
            variantSku: m.variantSku || v.sku,
            order: m.order ?? (100 + idx),
          }))
        ),
      ].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      const updatedProduct: BulkParsedProduct = {
        ...form,
        categoryId: resolvedCat.categoryId,
        categoryPath: resolvedCat.categoryPath,
        categoryName: resolvedCat.categoryName || form.categoryName,
        allImages: unifiedImages.length > 0 ? unifiedImages : undefined,
      };

      // 3. Recalculate validation
      const validationErrors = validateBulkProduct(
        updatedProduct,
        flatCategories,
        warehouses
      );
      const hasBlockingError = validationErrors.some((e) => e.severity === "error");

      updatedProduct.isValid = !hasBlockingError;
      updatedProduct.errors = validationErrors.length > 0 ? validationErrors : undefined;

      onSave(updatedProduct);
      toast.success(`Saved changes for ${updatedProduct.name}`);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save product changes");
    } finally {
      setIsSaving(false);
    }
  };

  // Apply JSON Changes
  const handleApplyJson = () => {
    try {
      setJsonError(null);
      const parsed = JSON.parse(jsonText);
      if (!parsed || typeof parsed !== "object") {
        throw new Error("JSON must be a valid product object");
      }
      if (!parsed.productGroupId && !parsed.name) {
        throw new Error("Product must contain productGroupId and name");
      }
      setForm(parsed);
      setIsEditingJson(false);
      toast.success("JSON changes applied to form!");
    } catch (err: any) {
      setJsonError(err?.message || "Invalid JSON syntax");
      toast.error("Failed to apply JSON: check syntax error below");
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonText).then(() => {
      setCopied(true);
      toast.success("Product JSON copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const discount =
    form.basePrice > 0 && form.sellingPrice > 0
      ? Math.round(((form.basePrice - form.sellingPrice) / form.basePrice) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 truncate">
                  Edit Product: {form.name || form.productGroupId}
                </h3>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                  {form.productGroupId}
                </span>
                {form.id && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    UPDATE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {form.categoryPath || "No category selected"} · {form.productType} product
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body: Scrollable 12 Sections */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* Validation Banner if errors present */}
          {form.errors && form.errors.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{form.errors.length} validation message(s) on this product:</span>
              </div>
              <ul className="list-disc list-inside text-rose-700 space-y-0.5 pl-1 text-[11px]">
                {form.errors.map((e, idx) => (
                  <li key={idx}>
                    <strong>{e.field}:</strong> {e.message} {e.fix && `(${e.fix})`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <Section
            title="1. Basic Information"
            icon={<Package className="h-4 w-4 text-indigo-600" />}
            defaultOpen={true}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {form.id && (
                <div className="sm:col-span-3 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                      Existing Product ID (Update Flow)
                    </span>
                    <span className="text-xs font-mono text-emerald-900">{form.id}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded">
                    DATABASE ID
                  </span>
                </div>
              )}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Product Group ID *
                </label>
                <input
                  type="text"
                  value={form.productGroupId}
                  onChange={(e) => setField("productGroupId", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Product Type *
                </label>
                <select
                  value={form.productType}
                  onChange={(e) =>
                    setField("productType", e.target.value as "simple" | "variable")
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                >
                  <option value="simple">Simple Product</option>
                  <option value="variable">Variable (with Variants)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Parent SKU (optional)
                </label>
                <input
                  type="text"
                  value={form.sku || ""}
                  onChange={(e) => setField("sku", e.target.value || undefined)}
                  placeholder="Auto-generated if blank"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white"
                />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={form.isActive !== false}
                  onChange={(e) => setField("isActive", e.target.checked)}
                  className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="isActiveToggle" className="text-slate-700 font-semibold cursor-pointer">
                  Product is Active & Published
                </label>
              </div>
              <div className="sm:col-span-3">
                <label className="block text-slate-700 font-semibold mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none resize-none bg-white"
                />
              </div>
            </div>
          </Section>

          {/* Section 2: Category */}
          <Section
            title="2. Category Assignment"
            icon={<Tag className="h-4 w-4 text-indigo-600" />}
            defaultOpen={true}
          >
            <div className="space-y-3">
              <label className="block text-slate-700 font-semibold">
                Select Canonical Category *
              </label>
              <CategoryCombobox
                flatCategories={flatCategories}
                categoryId={form.categoryId}
                categoryPath={form.categoryPath}
                onChange={handleCategorySelect}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1">
                <div>
                  <strong>Category ID:</strong>{" "}
                  <span className="font-mono">{form.categoryId || "None (unresolved)"}</span>
                </div>
                <div>
                  <strong>Category Name:</strong>{" "}
                  <span>{form.categoryName || "Not assigned"}</span>
                </div>
              </div>
            </div>
          </Section>

          {/* Section 3: Pricing */}
          <Section
            title="3. Pricing & Discounts"
            icon={<DollarSign className="h-4 w-4 text-emerald-600" />}
            defaultOpen={true}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Base Price (MRP) ₹ *
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.basePrice}
                  onChange={(e) => setField("basePrice", parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Selling Price ₹ *
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.sellingPrice}
                  onChange={(e) => setField("sellingPrice", parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white"
                />
              </div>
              <div className="flex flex-col justify-end">
                <span className="text-slate-500 mb-1">Discount Calculation:</span>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="font-medium text-slate-600">Calculated:</span>
                  <span
                    className={`font-bold ${
                      discount > 0 ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    {discount > 0 ? `${discount}% OFF` : "No discount"}
                  </span>
                </div>
              </div>
            </div>
          </Section>

          {/* Section 4: Inventory & Warehouse */}
          <Section
            title="4. Inventory & Warehouse"
            icon={<Warehouse className="h-4 w-4 text-blue-600" />}
            defaultOpen={form.productType === "simple"}
          >
            {form.productType === "simple" ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Fulfillment Warehouse *
                  </label>
                  <select
                    value={form.stock?.warehouseId || defaultWarehouse?.id || ""}
                    onChange={(e) => setStockField("warehouseId", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.code} — {w.name} {w.isDefaultPickup ? "(Default)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Available Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.stock?.quantity ?? 0}
                    onChange={(e) =>
                      setStockField("quantity", parseInt(e.target.value, 10) || 0)
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Low Stock Alert Threshold
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.stock?.lowStockThreshold ?? 5}
                    onChange={(e) =>
                      setStockField("lowStockThreshold", parseInt(e.target.value, 10) || 0)
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-800">
                <p className="font-semibold mb-1">Variable Product Inventory</p>
                <p className="text-[11px] leading-relaxed">
                  Inventory is managed individually per variant under{" "}
                  <strong>Section 8: Variants</strong>. Total variants configured:{" "}
                  <strong>{form.variants?.length || 0}</strong>.
                </p>
              </div>
            )}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
              <input
                type="checkbox"
                id="allowOutOfStockToggle"
                checked={Boolean(form.allowOutOfStockOrders)}
                onChange={(e) => setField("allowOutOfStockOrders", e.target.checked)}
                className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <label htmlFor="allowOutOfStockToggle" className="text-slate-700 font-semibold cursor-pointer">
                Allow Backorders (Allow out-of-stock orders for this product)
              </label>
            </div>
          </Section>

          {/* Section 5: Shipping & Dimensions */}
          <Section
            title="5. Shipping & Dimensions"
            icon={<Truck className="h-4 w-4 text-amber-600" />}
            defaultOpen={false}
          >
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.weight}
                  onChange={(e) => setField("weight", parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Length (cm)</label>
                <input
                  type="number"
                  min={0}
                  value={form.length}
                  onChange={(e) => setField("length", parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Breadth (cm)</label>
                <input
                  type="number"
                  min={0}
                  value={form.breadth}
                  onChange={(e) => setField("breadth", parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Height (cm)</label>
                <input
                  type="number"
                  min={0}
                  value={form.height}
                  onChange={(e) => setField("height", parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-slate-700 font-semibold mb-1">HSN Code</label>
                <input
                  type="text"
                  value={form.hsnCode || ""}
                  onChange={(e) => setField("hsnCode", e.target.value || undefined)}
                  placeholder="e.g. 500720"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white"
                />
              </div>
            </div>
          </Section>

          {/* Section 6: Product Specifications */}
          <Section
            title="6. Product Specifications"
            icon={<FileSpreadsheet className="h-4 w-4 text-cyan-600" />}
            defaultOpen={false}
            badge={form.specifications?.length || 0}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-slate-500">
                  Detailed attributes such as Fabric, Zari, Weave technique, Pattern, and Border.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      specifications: [...(f.specifications || []), { key: "", value: "" }],
                    }))
                  }
                  className="flex items-center gap-1 text-xs px-2.5 py-1 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-semibold transition"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Spec
                </button>
              </div>

              {!form.specifications || form.specifications.length === 0 ? (
                <p className="text-slate-400 italic py-3 text-center border border-dashed border-slate-200 rounded-lg">
                  No specifications added yet. Click "+ Add Spec" to specify attributes.
                </p>
              ) : (
                <div className="space-y-2">
                  {form.specifications.map((spec, sIdx) => (
                    <div key={sIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={spec.key}
                        onChange={(e) => {
                          const next = [...(form.specifications || [])];
                          next[sIdx] = { ...next[sIdx], key: e.target.value };
                          setForm((f) => ({ ...f, specifications: next }));
                        }}
                        placeholder="Attribute (e.g. Fabric, Zari Type, Weave)"
                        className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:outline-none bg-white"
                      />
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => {
                          const next = [...(form.specifications || [])];
                          next[sIdx] = { ...next[sIdx], value: e.target.value };
                          setForm((f) => ({ ...f, specifications: next }));
                        }}
                        placeholder="Value (e.g. Pure Silk, Gold Zari, Handloom)"
                        className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:outline-none bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = (form.specifications || []).filter((_, i) => i !== sIdx);
                          setForm((f) => ({ ...f, specifications: next }));
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition"
                        title="Remove attribute"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>

          {/* Section 7: Product Images */}
          <Section
            title="7. Product Images"
            icon={<ImageIcon className="h-4 w-4 text-amber-500" />}
            defaultOpen={false}
            badge={form.media?.length || 0}
          >
            <BulkImageGallery
              media={form.media || []}
              onChange={(updated) => setField("media", updated)}
              getThumbnailUrl={getThumbnailUrl}
              label="Product-Level Media"
            />
          </Section>

          {/* Section 8: Variants */}
          {form.productType === "variable" && (
            <Section
              title="8. Variants"
              icon={<Layers className="h-4 w-4 text-purple-600" />}
              defaultOpen={true}
              badge={form.variants?.length || 0}
            >
              <div className="space-y-4">
                {(form.variants || []).map((v, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-xl p-3.5 space-y-3 bg-slate-50/70 shadow-2xs"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">Variant #{idx + 1}</span>
                        {v.sku && (
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                            {v.sku}
                          </span>
                        )}
                        {v.id && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">
                            ID: {v.id}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVariant(idx)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete variant"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="col-span-2">
                        <label className="block text-slate-600 mb-0.5 font-medium">
                          Variant Title
                        </label>
                        <input
                          type="text"
                          value={v.title || ""}
                          onChange={(e) => updateVariant(idx, { title: e.target.value })}
                          placeholder="e.g. Crimson Red — Free Size"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-0.5 font-medium">SKU *</label>
                        <input
                          type="text"
                          value={v.sku || ""}
                          onChange={(e) => updateVariant(idx, { sku: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-0.5 font-medium">Price (₹) *</label>
                        <input
                          type="number"
                          value={v.price ?? v.sellingPrice ?? ""}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || undefined;
                            updateVariant(idx, { price: val, sellingPrice: val });
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-0.5 font-medium">Color</label>
                        <input
                          type="text"
                          value={v.color || ""}
                          onChange={(e) => updateVariant(idx, { color: e.target.value })}
                          placeholder="e.g. Crimson Red"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-0.5 font-medium">Size</label>
                        <input
                          type="text"
                          value={v.size || ""}
                          onChange={(e) => updateVariant(idx, { size: e.target.value })}
                          placeholder="e.g. Free Size"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-0.5 font-medium">Fabric</label>
                        <input
                          type="text"
                          value={v.fabric || ""}
                          onChange={(e) => updateVariant(idx, { fabric: e.target.value })}
                          placeholder="e.g. Pure Silk"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-0.5 font-medium">Warehouse</label>
                        <select
                          value={v.stock?.warehouseId || defaultWarehouse?.id || ""}
                          onChange={(e) => {
                            const wId = e.target.value;
                            const wFound = warehouses.find((w) => w.id === wId);
                            updateVariant(idx, {
                              stock: {
                                warehouseId: wId,
                                warehouseCode: wFound?.code || "WH-01",
                                quantity: v.stock?.quantity ?? 0,
                                lowStockThreshold: v.stock?.lowStockThreshold ?? 5,
                              },
                            });
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        >
                          {warehouses.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.code}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-0.5 font-medium">Stock Qty</label>
                        <input
                          type="number"
                          min={0}
                          value={v.stock?.quantity ?? 0}
                          onChange={(e) =>
                            updateVariant(idx, {
                              stock: {
                                warehouseId: v.stock?.warehouseId || defaultWarehouse?.id || "",
                                warehouseCode: v.stock?.warehouseCode || "WH-01",
                                quantity: parseInt(e.target.value, 10) || 0,
                                lowStockThreshold: v.stock?.lowStockThreshold ?? 5,
                              },
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-0.5 font-medium">Weight (kg)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={v.weight ?? form.weight}
                          onChange={(e) =>
                            updateVariant(idx, { weight: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-0.5 font-medium">L x B x H (cm)</label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            placeholder="L"
                            value={v.length ?? form.length}
                            onChange={(e) =>
                              updateVariant(idx, { length: parseFloat(e.target.value) || 0 })
                            }
                            className="w-1/3 px-1.5 py-1.5 border border-slate-300 rounded bg-white text-[11px]"
                          />
                          <input
                            type="number"
                            placeholder="B"
                            value={v.breadth ?? form.breadth}
                            onChange={(e) =>
                              updateVariant(idx, { breadth: parseFloat(e.target.value) || 0 })
                            }
                            className="w-1/3 px-1.5 py-1.5 border border-slate-300 rounded bg-white text-[11px]"
                          />
                          <input
                            type="number"
                            placeholder="H"
                            value={v.height ?? form.height}
                            onChange={(e) =>
                              updateVariant(idx, { height: parseFloat(e.target.value) || 0 })
                            }
                            className="w-1/3 px-1.5 py-1.5 border border-slate-300 rounded bg-white text-[11px]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Variant images */}
                    <div className="pt-2 border-t border-slate-200">
                      <BulkImageGallery
                        media={v.media || []}
                        onChange={(updated) => updateVariant(idx, { media: updated })}
                        getThumbnailUrl={getThumbnailUrl}
                        label={`Variant ${idx + 1} Images`}
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addVariant}
                  className="flex items-center gap-1.5 px-3 py-2 border border-dashed border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 transition w-full justify-center font-semibold"
                >
                  <Plus className="h-4 w-4" /> Add Variant
                </button>
              </div>
            </Section>
          )}

          {/* Section 9: SEO Metadata */}
          <Section
            title="9. SEO Metadata"
            icon={<Globe className="h-4 w-4 text-purple-600" />}
            defaultOpen={false}
          >
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold">Meta Title</label>
                  <span
                    className={`text-[10px] font-mono ${
                      (form.seo?.metaTitle?.length || 0) > 60 ? "text-rose-500" : "text-slate-400"
                    }`}
                  >
                    {form.seo?.metaTitle?.length || form.metaTitle?.length || 0}/60 chars
                  </span>
                </div>
                <input
                  type="text"
                  value={form.seo?.metaTitle || form.metaTitle || ""}
                  onChange={(e) => setSeoField("metaTitle", e.target.value)}
                  placeholder="e.g. Jade Green Kanchipuram Silk Saree | Kankana Silks"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold">Meta Description</label>
                  <span
                    className={`text-[10px] font-mono ${
                      (form.seo?.metaDesc?.length || 0) > 160 ? "text-rose-500" : "text-slate-400"
                    }`}
                  >
                    {form.seo?.metaDesc?.length || form.metaDesc?.length || 0}/160 chars
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={form.seo?.metaDesc || form.metaDesc || ""}
                  onChange={(e) => setSeoField("metaDesc", e.target.value)}
                  placeholder="Compelling search result description…"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none resize-none bg-white"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Custom Slug</label>
                  <input
                    type="text"
                    value={form.seo?.slug || ""}
                    onChange={(e) => setSeoField("slug", e.target.value)}
                    placeholder="jade-green-kanchipuram-silk-saree"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Schema Markup (JSON-LD)
                  </label>
                  <input
                    type="text"
                    value={form.seo?.schemaMarkup || ""}
                    onChange={(e) => setSeoField("schemaMarkup", e.target.value)}
                    placeholder='{"@context":"https://schema.org", ...}'
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white"
                  />
                </div>
              </div>

              <SeoPreview
                title={form.seo?.metaTitle || form.metaTitle || form.name}
                description={form.seo?.metaDesc || form.metaDesc || form.description}
                slug={form.seo?.slug}
              />
            </div>
          </Section>

          {/* Section 10: Artisan Information */}
          <Section
            title="10. Artisan Information"
            icon={<User className="h-4 w-4 text-emerald-600" />}
            defaultOpen={false}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Artisan Name</label>
                <input
                  type="text"
                  value={form.artisanName || ""}
                  onChange={(e) => setField("artisanName", e.target.value || undefined)}
                  placeholder="e.g. Master Weaver Ravi"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Artisan Location</label>
                <input
                  type="text"
                  value={form.artisanLocation || ""}
                  onChange={(e) => setField("artisanLocation", e.target.value || undefined)}
                  placeholder="e.g. Kanchipuram, Tamil Nadu"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">About the Artisan</label>
                <textarea
                  rows={2}
                  value={form.artisanAbout || ""}
                  onChange={(e) => setField("artisanAbout", e.target.value || undefined)}
                  placeholder="Story and weaving lineage of the artisan…"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none resize-none bg-white"
                />
              </div>
            </div>
          </Section>

          {/* Section 11: Additional Settings */}
          <Section
            title="11. Additional Settings & Video Consultation"
            icon={<Settings className="h-4 w-4 text-slate-600" />}
            defaultOpen={false}
          >
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form.hasVideoConsultation)}
                    onChange={(e) => setField("hasVideoConsultation", e.target.checked)}
                    className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block">Has Video Consultation</span>
                    <span className="text-[10px] text-slate-500">
                      Enable live video call option for this product
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form.videoPurchasingEnabled)}
                    onChange={(e) => setField("videoPurchasingEnabled", e.target.checked)}
                    className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block">
                      Video Purchasing Enabled
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Allow direct purchase during video session
                    </span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Video Consultation Note
                </label>
                <input
                  type="text"
                  value={form.videoConsultationNote || ""}
                  onChange={(e) =>
                    setField("videoConsultationNote", e.target.value || undefined)
                  }
                  placeholder="e.g. Prior appointment required 24 hours in advance."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Import Note</label>
                  <input
                    type="text"
                    value={form.importNote || ""}
                    onChange={(e) => setField("importNote", e.target.value || undefined)}
                    placeholder="Internal reference notes"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Group Suggestion
                  </label>
                  <input
                    type="text"
                    value={form.groupSuggestion || ""}
                    onChange={(e) => setField("groupSuggestion", e.target.value || undefined)}
                    placeholder="Suggested product collection grouping"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white"
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* Section 12: Advanced JSON */}
          <Section
            title="12. Advanced JSON (View & Edit Raw Object)"
            icon={<Code className="h-4 w-4 text-violet-600" />}
            defaultOpen={false}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-slate-500">
                  {isEditingJson
                    ? "Editing raw JSON object. Click 'Apply JSON Changes' to validate and update the form."
                    : "Complete synchronized JSON representation of this product."}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="flex items-center gap-1 px-2.5 py-1 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingJson((e) => !e)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border font-semibold transition ${
                      isEditingJson
                        ? "bg-amber-50 text-amber-800 border-amber-300"
                        : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                    }`}
                  >
                    {isEditingJson ? "Cancel Direct Edit" : "Edit JSON Directly"}
                  </button>
                  {isEditingJson && (
                    <button
                      type="button"
                      onClick={handleApplyJson}
                      className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
                    >
                      Apply JSON Changes
                    </button>
                  )}
                </div>
              </div>

              {jsonError && (
                <div className="bg-rose-50 border border-rose-300 text-rose-700 rounded-lg p-2.5 text-xs">
                  <strong>JSON Error:</strong> {jsonError}
                </div>
              )}

              {isEditingJson ? (
                <textarea
                  rows={16}
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  className="w-full font-mono text-[11px] bg-slate-900 text-emerald-300 p-4 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                  spellCheck={false}
                />
              ) : (
                <pre className="font-mono text-[11px] bg-slate-900 text-emerald-300 p-4 rounded-xl border border-slate-800 max-h-80 overflow-auto leading-relaxed shadow-inner">
                  {jsonText}
                </pre>
              )}
            </div>
          </Section>
        </div>

        {/* Modal Sticky Footer */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-white shrink-0">
          <p className="text-xs text-slate-500">
            Changes will update preview and persist to the draft session.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-xs transition flex items-center gap-2"
            >
              {isSaving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
