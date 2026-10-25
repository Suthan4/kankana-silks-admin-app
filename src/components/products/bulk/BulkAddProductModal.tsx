import React, { useState } from "react";
import { X, Plus, Trash2, Layers, ChevronDown, Globe } from "lucide-react";
import type { BulkParsedProduct, BulkParsedVariant, BulkParsedMedia, BulkCategoryLookup, BulkWarehouse } from "@/lib/types/product/bulkProduct";

interface BulkAddProductModalProps {
  flatCategories: BulkCategoryLookup[];
  warehouses: BulkWarehouse[];
  existingGroupIds: string[];
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: BulkParsedProduct) => void;
}

// Inline category combobox
const CategoryCombo: React.FC<{
  flatCategories: BulkCategoryLookup[];
  value: string;
  onChange: (id: string, path: string) => void;
}> = ({ flatCategories, value, onChange }) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const selected = flatCategories.find((c) => c.id === value);
  const filtered = search
    ? flatCategories.filter((c) => c.path.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase()))
    : flatCategories;
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white hover:border-indigo-400 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition">
        <span className={selected ? "text-slate-800" : "text-slate-400"}>{selected ? selected.path : "Select category…"}</span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input autoFocus type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search categories…" className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && <p className="text-xs text-slate-400 text-center py-3">No categories found</p>}
            {filtered.map((c) => (
              <button key={c.id} type="button" onClick={() => { onChange(c.id, c.path); setOpen(false); setSearch(""); }}
                className={["w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 transition", c.id === value ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-700"].join(" ")}>
                <span className="text-[10px] text-slate-400 font-mono mr-2">{c.id}</span>{c.path}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const BulkAddProductModal: React.FC<BulkAddProductModalProps> = ({
  flatCategories,
  warehouses,
  existingGroupIds,
  isOpen,
  onClose,
  onAddProduct,
}) => {
  if (!isOpen) return null;

  const nextIdNum = existingGroupIds.length + 1;
  const initialGroupId = `PROD-${String(nextIdNum).padStart(3, "0")}`;
  const defaultWarehouse = warehouses.find((w) => w.isDefaultPickup) || warehouses[0];

  const [productGroupId, setProductGroupId] = useState(initialGroupId);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(flatCategories[0]?.id || "");
  const [categoryPath, setCategoryPath] = useState(flatCategories[0]?.path || "");
  const [productType, setProductType] = useState<"simple" | "variable">("simple");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [basePrice, setBasePrice] = useState<number>(5000);
  const [sellingPrice, setSellingPrice] = useState<number>(3999);
  const [stockQuantity, setStockQuantity] = useState<number>(10);
  const [warehouseId, setWarehouseId] = useState(defaultWarehouse?.id || "");
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(10);
  const [weight, setWeight] = useState<number>(0.8);
  const [length, setLength] = useState<number>(35);
  const [breadth, setBreadth] = useState<number>(25);
  const [height, setHeight] = useState<number>(5);
  const [hsnCode, setHsnCode] = useState("5007");

  const [variants, setVariants] = useState<BulkParsedVariant[]>([{
    sku: "",
    size: "Free Size",
    color: "",
    fabric: "Pure Silk",
    attributes: { Size: "Free Size", Fabric: "Pure Silk" },
    stock: { warehouseId: defaultWarehouse?.id || "", quantity: 10, lowStockThreshold: 10 },
  }]);

  const [mediaUrls, setMediaUrls] = useState<string[]>([""]);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [customSlug, setCustomSlug] = useState("");

  const handleAddVariantRow = () => {
    setVariants((prev) => [...prev, {
      sku: "",
      size: "",
      color: "",
      fabric: "Pure Silk",
      attributes: {},
      stock: { warehouseId: defaultWarehouse?.id || "", quantity: 5, lowStockThreshold: 10 },
    }]);
  };

  const handleRemoveVariantRow = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const mediaItems: BulkParsedMedia[] = mediaUrls
      .filter((u) => u.trim())
      .map((url, idx) => ({ type: "IMAGE", url: url.trim(), order: idx, altText: name, isActive: true }));

    const newProduct: BulkParsedProduct = {
      productGroupId: productGroupId.trim(),
      name: name.trim(),
      categoryId: categoryId || undefined,
      categoryPath: categoryPath.trim(),
      productType,
      description: description.trim() || name.trim(),
      sku: sku.trim() || undefined,
      basePrice,
      sellingPrice,
      weight,
      length,
      breadth,
      height,
      hsnCode: hsnCode.trim() || undefined,
      isActive: true,
      stock: productType === "simple"
        ? { warehouseId, quantity: stockQuantity, lowStockThreshold }
        : undefined,
      variants: productType === "variable" ? variants : undefined,
      media: mediaItems.length > 0 ? mediaItems : undefined,
      seo: metaTitle || metaDesc || customSlug
        ? { metaTitle: metaTitle.trim() || undefined, metaDesc: metaDesc.trim() || undefined, slug: customSlug.trim() || undefined }
        : undefined,
      isValid: true,
    };

    onAddProduct(newProduct);
    onClose();
  };

  const inputCls = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white";
  const labelCls = "block text-slate-700 font-semibold mb-1";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Add New Product to Import</h3>
              <p className="text-xs text-slate-500">Configure product details, variants, and pricing</p>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Body */}
          <div className="p-6 space-y-6 text-xs">
            {/* Identity & Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Product Group ID *</label>
                <input
                  type="text"
                  required
                  value={productGroupId}
                  onChange={(e) => setProductGroupId(e.target.value)}
                  className={`${inputCls} font-mono`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Product Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kanchipuram Pure Silk Saree"
                  className={inputCls}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Category *</label>
                <CategoryCombo
                  flatCategories={flatCategories}
                  value={categoryId}
                  onChange={(id, path) => { setCategoryId(id); setCategoryPath(path); }}
                />
                {categoryPath && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Path: <span className="font-mono">{categoryPath}</span>
                  </p>
                )}
              </div>

              <div>
                <label className={labelCls}>Product Type *</label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value as "simple" | "variable")}
                  className={`${inputCls} font-medium`}
                >
                  <option value="simple">Simple Product</option>
                  <option value="variable">Variable Product (Variants)</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={labelCls}>Description *</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed craft description, weave details, zari type..."
                className={inputCls}
              />
            </div>

            {/* Pricing & SKU */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className={labelCls}>Base Price (MRP) ₹ *</label>
                <input type="number" required min={1} value={basePrice} onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)} className={`${inputCls} bg-white`} />
              </div>
              <div>
                <label className={labelCls}>Selling Price ₹ *</label>
                <input type="number" required min={1} max={basePrice} value={sellingPrice} onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)} className={`${inputCls} bg-white`} />
              </div>
              <div>
                <label className={labelCls}>Parent SKU (Optional)</label>
                <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Auto-generated if blank" className={`${inputCls} bg-white font-mono`} />
              </div>
              {basePrice > 0 && sellingPrice > 0 && (
                <div className="sm:col-span-3 flex items-center gap-2">
                  <span className="text-slate-500">Discount:</span>
                  <span className={`font-semibold ${sellingPrice < basePrice ? "text-emerald-600" : "text-red-500"}`}>
                    {sellingPrice < basePrice ? `${Math.round(((basePrice - sellingPrice) / basePrice) * 100)}% off` : "No discount"}
                  </span>
                </div>
              )}
            </div>

            {/* Simple Stock */}
            {productType === "simple" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
                <div>
                  <label className={labelCls}>Initial Stock Quantity *</label>
                  <input type="number" min={0} required value={stockQuantity} onChange={(e) => setStockQuantity(parseInt(e.target.value, 10) || 0)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Warehouse *</label>
                  <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className={inputCls}>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.code} ({w.name})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Low Stock Alert</label>
                  <input type="number" min={0} value={lowStockThreshold} onChange={(e) => setLowStockThreshold(parseInt(e.target.value, 10) || 10)} className={inputCls} />
                </div>
              </div>
            )}

            {/* Variable Product Variants Builder */}
            {productType === "variable" && (
              <div className="space-y-3 bg-purple-50/50 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-purple-600" />
                    Product Variants ({variants.length})
                  </h4>
                  <button type="button" onClick={handleAddVariantRow} className="px-2.5 py-1 bg-purple-600 text-white rounded-lg font-semibold flex items-center gap-1 hover:bg-purple-700 transition">
                    <Plus className="h-3.5 w-3.5" /> Add Variant
                  </button>
                </div>

                <div className="space-y-2">
                  {variants.map((v, idx) => (
                    <div key={idx} className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 bg-white rounded-lg border border-purple-100 items-center">
                      <div>
                        <label className="block text-[10px] text-slate-400">Size</label>
                        <input
                          type="text"
                          value={v.size || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = [...variants];
                            updated[idx] = { ...updated[idx], size: val, attributes: { ...updated[idx].attributes, Size: val } };
                            setVariants(updated);
                          }}
                          placeholder="e.g. 40, L"
                          className="w-full px-2 py-1 border border-slate-200 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400">Color</label>
                        <input
                          type="text"
                          value={v.color || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = [...variants];
                            updated[idx] = { ...updated[idx], color: val, attributes: { ...updated[idx].attributes, Color: val } };
                            setVariants(updated);
                          }}
                          placeholder="e.g. Maroon"
                          className="w-full px-2 py-1 border border-slate-200 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400">Stock Qty</label>
                        <input
                          type="number"
                          min={0}
                          value={v.stock?.quantity ?? 0}
                          onChange={(e) => {
                            const qty = parseInt(e.target.value, 10) || 0;
                            const updated = [...variants];
                            updated[idx] = { ...updated[idx], stock: { warehouseId: defaultWarehouse?.id || "", ...updated[idx].stock, quantity: qty } };
                            setVariants(updated);
                          }}
                          className="w-full px-2 py-1 border border-slate-200 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400">Variant SKU</label>
                        <input
                          type="text"
                          value={v.sku || ""}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[idx] = { ...updated[idx], sku: e.target.value };
                            setVariants(updated);
                          }}
                          placeholder="Optional"
                          className="w-full px-2 py-1 border border-slate-200 rounded font-mono"
                        />
                      </div>
                      <div className="flex justify-end pt-3">
                        <button
                          type="button"
                          disabled={variants.length === 1}
                          onClick={() => handleRemoveVariantRow(idx)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shipping Dimensions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className={labelCls}>Weight (kg) *</label>
                <input type="number" step="0.01" required value={weight} onChange={(e) => setWeight(parseFloat(e.target.value) || 0.5)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Length (cm) *</label>
                <input type="number" required value={length} onChange={(e) => setLength(parseFloat(e.target.value) || 30)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Breadth (cm) *</label>
                <input type="number" required value={breadth} onChange={(e) => setBreadth(parseFloat(e.target.value) || 20)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Height (cm) *</label>
                <input type="number" required value={height} onChange={(e) => setHeight(parseFloat(e.target.value) || 5)} className={inputCls} />
              </div>
            </div>

            {/* HSN Code */}
            <div className="max-w-xs">
              <label className={labelCls}>HSN Code</label>
              <input type="text" value={hsnCode} onChange={(e) => setHsnCode(e.target.value)} placeholder="e.g. 5007" className={`${inputCls} font-mono`} />
            </div>

            {/* Media URLs */}
            <div>
              <label className={labelCls}>Image Media URL (HTTPS)</label>
              <input
                type="url"
                value={mediaUrls[0] || ""}
                onChange={(e) => setMediaUrls([e.target.value])}
                placeholder="https://pub-2fbc147a469a4993ad805cbbfb7f8373.r2.dev/products/image.jpg"
                className={inputCls}
              />
            </div>

            {/* SEO */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Globe className="h-3.5 w-3.5 text-purple-500" /> SEO (Optional)
              </h4>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelCls}>Meta Title</label>
                  <span className={`text-[10px] font-mono ${metaTitle.length > 60 ? "text-red-500" : "text-slate-400"}`}>
                    {metaTitle.length}/60
                  </span>
                </div>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="e.g. Jade Green Kanchipuram Silk Saree | Kankana Silks"
                  className={inputCls}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelCls}>Meta Description</label>
                  <span className={`text-[10px] font-mono ${metaDesc.length > 160 ? "text-red-500" : "text-slate-400"}`}>
                    {metaDesc.length}/160
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={metaDesc}
                  onChange={(e) => setMetaDesc(e.target.value)}
                  placeholder="Compelling description for search engines…"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Custom Slug</label>
                <input
                  type="text"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  placeholder="jade-green-kanchipuram-silk-saree"
                  className={`${inputCls} font-mono`}
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm">
              Add to Import Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
