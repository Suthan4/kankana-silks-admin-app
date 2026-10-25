/**
 * BulkProductEditorModal
 *
 * Structured form for editing a single parsed product.
 * Sections: Basic Info | Pricing | Inventory | SEO | Images | Variants
 * Generates JSON from form state; no manual JSON editing required.
 * Optional JSON preview (read-only + copy).
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
} from "lucide-react";
import type {
  BulkParsedProduct,
  BulkParsedVariant,
  BulkCategoryNode,
  BulkCategoryLookup,
  BulkWarehouse,
} from "@/lib/types/product/bulkProduct";
import { BulkImageGallery } from "./BulkImageGallery";

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

// Simple collapsible section
const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({
  title, icon, children, defaultOpen = true,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
      >
        <span className="flex items-center gap-2">{icon}{title}</span>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {open && <div className="p-4 space-y-4 bg-white">{children}</div>}
    </div>
  );
};

// Category combobox (searchable flat list)
const CategoryCombobox: React.FC<{
  flatCategories: BulkCategoryLookup[];
  value: string; // categoryId
  onChange: (id: string, path: string) => void;
}> = ({ flatCategories, value, onChange }) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const selected = flatCategories.find((c) => c.id === value);

  const filtered = search
    ? flatCategories.filter(
        (c) =>
          c.path.toLowerCase().includes(search.toLowerCase()) ||
          c.name.toLowerCase().includes(search.toLowerCase())
      )
    : flatCategories;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white hover:border-indigo-400 transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        <span className={selected ? "text-slate-800" : "text-slate-400"}>
          {selected ? selected.path : "Select category…"}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories…"
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">No categories found</p>
            )}
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onChange(c.id, c.path); setOpen(false); setSearch(""); }}
                className={[
                  "w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 transition",
                  c.id === value ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-700",
                ].join(" ")}
              >
                <span className="text-[10px] text-slate-400 font-mono mr-2">{c.id}</span>
                {c.path}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// SEO search preview
const SeoPreview: React.FC<{ title: string; description: string; url?: string }> = ({ title, description, url = "kankana-silks.com/products/..." }) => (
  <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-0.5">
    <p className="text-[10px] text-slate-400 mb-1">Search preview</p>
    <p className="text-green-700 truncate">{url}</p>
    <p className="text-blue-700 font-medium text-sm truncate">{title || "Product Title"}</p>
    <p className="text-slate-600 line-clamp-2">{description || "Meta description will appear here."}</p>
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
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeSection, _setActiveSection] = useState<string | null>(null);

  // Reset when product changes
  useEffect(() => { setForm(product); }, [product]);

  if (!isOpen) return null;

  const setField = <K extends keyof BulkParsedProduct>(key: K, val: BulkParsedProduct[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const setSeoField = (key: "metaTitle" | "metaDesc" | "slug", val: string) =>
    setForm((f) => ({ ...f, seo: { ...f.seo, [key]: val } }));

  const setStockField = (key: "warehouseId" | "quantity" | "lowStockThreshold", val: string | number) =>
    setForm((f) => ({
      ...f,
      stock: { warehouseId: f.stock?.warehouseId || "", quantity: f.stock?.quantity ?? 0, ...f.stock, [key]: val },
    }));

  const updateVariant = (idx: number, patch: Partial<BulkParsedVariant>) =>
    setForm((f) => ({
      ...f,
      variants: (f.variants || []).map((v, i) => (i === idx ? { ...v, ...patch } : v)),
    }));

  const addVariant = () =>
    setForm((f) => ({
      ...f,
      variants: [
        ...(f.variants || []),
        {
          sku: "",
          size: "",
          color: "",
          fabric: "",
          attributes: {},
          stock: { warehouseId: warehouses[0]?.id || "", quantity: 0, lowStockThreshold: 10 },
        },
      ],
    }));

  const removeVariant = (idx: number) =>
    setForm((f) => ({ ...f, variants: (f.variants || []).filter((_, i) => i !== idx) }));

  const handleSave = () => { onSave(form); onClose(); };

  const jsonStr = JSON.stringify(form, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonStr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const defaultWarehouse = warehouses.find((w) => w.isDefaultPickup) || warehouses[0];

  // Suppress unused variable warning
  void activeSection;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 pt-8">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between shrink-0 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Package className="h-5 w-5 text-indigo-600" />
              Edit Product
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">{form.productGroupId}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowJson((s) => !s)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition"
            >
              <Code className="h-3.5 w-3.5" />
              {showJson ? "Hide" : "View"} JSON
            </button>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className={showJson ? "grid grid-cols-2 divide-x divide-slate-200" : ""}>
            {/* Form */}
            <div className="p-5 space-y-4 overflow-y-auto" style={showJson ? { maxHeight: "calc(92vh - 120px)" } : {}}>
              {/* Basic Info */}
              <Section title="Basic Information" icon={<Package className="h-4 w-4 text-indigo-500" />}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Group ID *</label>
                    <input
                      type="text"
                      value={form.productGroupId}
                      onChange={(e) => setField("productGroupId", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Product Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setField("name", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Product Type *</label>
                    <select
                      value={form.productType}
                      onChange={(e) => setField("productType", e.target.value as "simple" | "variable")}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                    >
                      <option value="simple">Simple</option>
                      <option value="variable">Variable (Variants)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Category *</label>
                    <CategoryCombobox
                      flatCategories={flatCategories}
                      value={form.categoryId || ""}
                      onChange={(id, path) => setForm((f) => ({ ...f, categoryId: id, categoryPath: path }))}
                    />
                    {form.categoryPath && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        Path: <span className="font-mono">{form.categoryPath}</span>
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Description *</label>
                    <textarea
                      rows={3}
                      value={form.description}
                      onChange={(e) => setField("description", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">SKU (optional)</label>
                    <input
                      type="text"
                      value={form.sku || ""}
                      onChange={(e) => setField("sku", e.target.value || undefined)}
                      placeholder="Auto-generated"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">HSN Code</label>
                    <input
                      type="text"
                      value={form.hsnCode || ""}
                      onChange={(e) => setField("hsnCode", e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                    />
                  </div>
                </div>
              </Section>

              {/* Pricing & Dimensions */}
              <Section title="Pricing & Dimensions" icon={<DollarSign className="h-4 w-4 text-emerald-500" />}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Base Price (MRP) ₹ *</label>
                    <input type="number" min={0} value={form.basePrice} onChange={(e) => setField("basePrice", parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Selling Price ₹ *</label>
                    <input type="number" min={0} value={form.sellingPrice} onChange={(e) => setField("sellingPrice", parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Weight (kg)</label>
                    <input type="number" step="0.01" min={0} value={form.weight} onChange={(e) => setField("weight", parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Length (cm)</label>
                    <input type="number" min={0} value={form.length} onChange={(e) => setField("length", parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Breadth (cm)</label>
                    <input type="number" min={0} value={form.breadth} onChange={(e) => setField("breadth", parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Height (cm)</label>
                    <input type="number" min={0} value={form.height} onChange={(e) => setField("height", parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none" />
                  </div>
                  {form.basePrice > 0 && form.sellingPrice > 0 && (
                    <div className="col-span-2 flex items-center gap-2">
                      <span className="text-xs text-slate-500">Discount:</span>
                      <span className={`text-xs font-semibold ${form.sellingPrice < form.basePrice ? "text-emerald-600" : "text-red-500"}`}>
                        {form.sellingPrice < form.basePrice
                          ? `${Math.round(((form.basePrice - form.sellingPrice) / form.basePrice) * 100)}% off`
                          : "No discount"}
                      </span>
                    </div>
                  )}
                </div>
              </Section>

              {/* Inventory (simple only) */}
              {form.productType === "simple" && (
                <Section title="Inventory" icon={<Warehouse className="h-4 w-4 text-blue-500" />}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Warehouse *</label>
                      <select
                        value={form.stock?.warehouseId || defaultWarehouse?.id || ""}
                        onChange={(e) => setStockField("warehouseId", e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                      >
                        {warehouses.map((w) => (
                          <option key={w.id} value={w.id}>{w.code} — {w.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity</label>
                      <input type="number" min={0} value={form.stock?.quantity ?? 0} onChange={(e) => setStockField("quantity", parseInt(e.target.value, 10) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Low Stock Alert</label>
                      <input type="number" min={0} value={form.stock?.lowStockThreshold ?? 10} onChange={(e) => setStockField("lowStockThreshold", parseInt(e.target.value, 10) || 10)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none" />
                    </div>
                  </div>
                </Section>
              )}

              {/* SEO */}
              <Section title="SEO" icon={<Globe className="h-4 w-4 text-purple-500" />} defaultOpen={false}>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-600">Meta Title</label>
                      <span className={`text-[10px] font-mono ${(form.seo?.metaTitle?.length || 0) > 60 ? "text-red-500" : "text-slate-400"}`}>
                        {form.seo?.metaTitle?.length || 0}/60
                      </span>
                    </div>
                    <input
                      type="text"
                      value={form.seo?.metaTitle || ""}
                      onChange={(e) => setSeoField("metaTitle", e.target.value)}
                      placeholder="e.g. Jade Green Kanchipuram Silk Saree | Kankana Silks"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-600">Meta Description</label>
                      <span className={`text-[10px] font-mono ${(form.seo?.metaDesc?.length || 0) > 160 ? "text-red-500" : "text-slate-400"}`}>
                        {form.seo?.metaDesc?.length || 0}/160
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={form.seo?.metaDesc || ""}
                      onChange={(e) => setSeoField("metaDesc", e.target.value)}
                      placeholder="Compelling description for search engines…"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Custom Slug</label>
                    <input
                      type="text"
                      value={form.seo?.slug || ""}
                      onChange={(e) => setSeoField("slug", e.target.value)}
                      placeholder="jade-green-kanchipuram-silk-saree"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                    />
                  </div>
                  <SeoPreview
                    title={form.seo?.metaTitle || form.name}
                    description={form.seo?.metaDesc || form.description}
                  />
                </div>
              </Section>

              {/* Images */}
              <Section title="Images" icon={<ImageIcon className="h-4 w-4 text-amber-500" />} defaultOpen={false}>
                <BulkImageGallery
                  media={form.media || []}
                  onChange={(updated) => setField("media", updated)}
                  getThumbnailUrl={getThumbnailUrl}
                  label="Product Images"
                />
              </Section>

              {/* Variants */}
              {form.productType === "variable" && (
                <Section title="Variants" icon={<Layers className="h-4 w-4 text-purple-500" />} defaultOpen={false}>
                  <div className="space-y-3">
                    {(form.variants || []).map((v, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-xl p-3 space-y-3 bg-slate-50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">Variant {idx + 1}</span>
                          <button type="button" onClick={() => removeVariant(idx)} className="p-1 rounded text-slate-400 hover:text-rose-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div>
                            <label className="block text-slate-500 mb-0.5">SKU</label>
                            <input type="text" value={v.sku || ""} onChange={(e) => updateVariant(idx, { sku: e.target.value })} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-0.5">Color</label>
                            <input type="text" value={v.color || ""} onChange={(e) => updateVariant(idx, { color: e.target.value, attributes: { ...v.attributes, Color: e.target.value } })} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-0.5">Size</label>
                            <input type="text" value={v.size || ""} onChange={(e) => updateVariant(idx, { size: e.target.value, attributes: { ...v.attributes, Size: e.target.value } })} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-0.5">Fabric</label>
                            <input type="text" value={v.fabric || ""} onChange={(e) => updateVariant(idx, { fabric: e.target.value, attributes: { ...v.attributes, Fabric: e.target.value } })} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-0.5">Sell Price ₹</label>
                            <input type="number" value={v.sellingPrice ?? ""} onChange={(e) => updateVariant(idx, { sellingPrice: parseFloat(e.target.value) || undefined })} placeholder="Inherit" className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-0.5">Warehouse</label>
                            <select value={v.stock?.warehouseId || defaultWarehouse?.id || ""} onChange={(e) => updateVariant(idx, { stock: { ...v.stock, warehouseId: e.target.value, quantity: v.stock?.quantity ?? 0 } })} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400">
                              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.code}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-0.5">Quantity</label>
                            <input type="number" min={0} value={v.stock?.quantity ?? 0} onChange={(e) => updateVariant(idx, { stock: { ...v.stock, warehouseId: v.stock?.warehouseId || defaultWarehouse?.id || "", quantity: parseInt(e.target.value, 10) || 0 } })} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                          </div>
                        </div>
                        {/* Variant images */}
                        <BulkImageGallery
                          media={v.media || []}
                          onChange={(updated) => updateVariant(idx, { media: updated })}
                          getThumbnailUrl={getThumbnailUrl}
                          label={`Variant ${idx + 1} Images`}
                        />
                      </div>
                    ))}
                    <button type="button" onClick={addVariant} className="flex items-center gap-1.5 text-xs px-3 py-2 border border-dashed border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 transition w-full justify-center">
                      <Plus className="h-3.5 w-3.5" /> Add Variant
                    </button>
                  </div>
                </Section>
              )}
            </div>

            {/* JSON preview panel */}
            {showJson && (
              <div className="flex flex-col" style={{ maxHeight: "calc(92vh - 120px)" }}>
                <div className="p-3 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1"><Code className="h-3.5 w-3.5" /> JSON Preview</span>
                  <button type="button" onClick={handleCopy} className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
                    {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre className="flex-1 overflow-auto text-[10px] font-mono text-slate-700 p-4 bg-slate-50 leading-relaxed">
                  {jsonStr}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex justify-end gap-3 shrink-0 bg-white">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition">
            Cancel
          </button>
          <button type="button" onClick={handleSave} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
