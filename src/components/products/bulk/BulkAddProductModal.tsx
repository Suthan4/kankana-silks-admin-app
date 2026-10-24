import React, { useState } from "react";
import { X, Plus, Trash2, Layers, Box, Globe, Image as ImageIcon } from "lucide-react";
import type { BulkParsedProduct, BulkParsedVariant, BulkParsedMedia } from "@/lib/types/product/bulkProduct";
import type { Warehouse } from "@/lib/types/warehouse/warehouse";

interface BulkAddProductModalProps {
  categoryPaths: string[];
  warehouses: Warehouse[];
  existingGroupIds: string[];
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: BulkParsedProduct) => void;
}

export const BulkAddProductModal: React.FC<BulkAddProductModalProps> = ({
  categoryPaths,
  warehouses,
  existingGroupIds,
  isOpen,
  onClose,
  onAddProduct,
}) => {
  if (!isOpen) return null;

  // Auto-generate next product group ID
  const nextIdNum = existingGroupIds.length + 1;
  const initialGroupId = `PROD-${String(nextIdNum).padStart(3, "0")}`;

  const defaultCategory = categoryPaths[0] || "Clothing > Sarees";
  const defaultWarehouse = warehouses[0]?.code || "WH-MAIN";

  const [productGroupId, setProductGroupId] = useState(initialGroupId);
  const [name, setName] = useState("");
  const [categoryPath, setCategoryPath] = useState(defaultCategory);
  const [productType, setProductType] = useState<"simple" | "variable">("simple");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [basePrice, setBasePrice] = useState<number>(5000);
  const [sellingPrice, setSellingPrice] = useState<number>(3999);
  const [stockQuantity, setStockQuantity] = useState<number>(10);
  const [warehouseCode, setWarehouseCode] = useState(defaultWarehouse);
  const [weight, setWeight] = useState<number>(0.8);
  const [length, setLength] = useState<number>(35);
  const [breadth, setBreadth] = useState<number>(25);
  const [height, setHeight] = useState<number>(5);
  const [hsnCode, setHsnCode] = useState("5007");
  const [artisanName, setArtisanName] = useState("");

  // Variable product variants
  const [variants, setVariants] = useState<BulkParsedVariant[]>([
    {
      sku: "",
      size: "Free Size",
      color: "Peacock Blue",
      fabric: "Pure Silk",
      attributes: { Size: "Free Size", Color: "Peacock Blue", Fabric: "Pure Silk" },
      stock: { warehouseId: warehouses[0]?.id || "1", warehouseCode: defaultWarehouse, quantity: 10 },
    },
  ]);

  // Media
  const [mediaUrls, setMediaUrls] = useState<string[]>([""]);

  // SEO
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [customSlug, setCustomSlug] = useState("");

  const handleAddVariantRow = () => {
    setVariants((prev) => [
      ...prev,
      {
        sku: "",
        size: "Free Size",
        color: "",
        fabric: "Pure Silk",
        attributes: { Size: "Free Size" },
        stock: { warehouseId: warehouses[0]?.id || "1", warehouseCode: defaultWarehouse, quantity: 5 },
      },
    ]);
  };

  const handleRemoveVariantRow = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const mediaItems: BulkParsedMedia[] = mediaUrls
      .filter((u) => u.trim().startsWith("http"))
      .map((url, idx) => ({
        type: "IMAGE",
        url: url.trim(),
        order: idx,
        altText: name,
        isActive: true,
      }));

    const newProduct: BulkParsedProduct = {
      productGroupId: productGroupId.trim(),
      name: name.trim(),
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
      artisanName: artisanName.trim() || undefined,
      isActive: true,
      stock:
        productType === "simple"
          ? {
              warehouseId: warehouses.find((w) => w.code === warehouseCode)?.id || "1",
              warehouseCode,
              quantity: stockQuantity,
              lowStockThreshold: 10,
            }
          : undefined,
      variants: productType === "variable" ? variants : undefined,
      media: mediaItems.length > 0 ? mediaItems : undefined,
      seo:
        metaTitle || metaDesc || customSlug
          ? {
              metaTitle: metaTitle.trim() || undefined,
              metaDesc: metaDesc.trim() || undefined,
              slug: customSlug.trim() || undefined,
            }
          : undefined,
      isValid: true,
    };

    onAddProduct(newProduct);
    onClose();
  };

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
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Body */}
          <div className="p-6 space-y-6 text-xs">
            {/* Identity & Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Product Group ID *
                </label>
                <input
                  type="text"
                  required
                  value={productGroupId}
                  onChange={(e) => setProductGroupId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kanchipuram Pure Silk Saree"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  Category Full Path *
                </label>
                <select
                  value={categoryPath}
                  onChange={(e) => setCategoryPath(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {categoryPaths.map((cp) => (
                    <option key={cp} value={cp}>
                      {cp}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Product Type *
                </label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                >
                  <option value="simple">Simple Product</option>
                  <option value="variable">Variable Product (Variants)</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Description *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed craft description, weave details, zari type..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Pricing & SKU */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Base Price (MRP) ₹ *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={basePrice}
                  onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Selling Price ₹ *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={basePrice}
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Parent SKU (Optional)
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Auto-generated if blank"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>
            </div>

            {/* Simple Stock */}
            {productType === "simple" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Initial Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Warehouse *
                  </label>
                  <select
                    value={warehouseCode}
                    onChange={(e) => setWarehouseCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.code}>
                        {w.code} ({w.name})
                      </option>
                    ))}
                  </select>
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
                  <button
                    type="button"
                    onClick={handleAddVariantRow}
                    className="px-2.5 py-1 bg-purple-600 text-white rounded-lg font-semibold flex items-center gap-1 hover:bg-purple-700 transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Variant
                  </button>
                </div>

                <div className="space-y-2">
                  {variants.map((v, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 bg-white rounded-lg border border-purple-100 items-center"
                    >
                      <div>
                        <label className="block text-[10px] text-slate-400">Size</label>
                        <input
                          type="text"
                          value={v.size || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = [...variants];
                            updated[idx].size = val;
                            updated[idx].attributes = { ...updated[idx].attributes, Size: val };
                            setVariants(updated);
                          }}
                          placeholder="Size (e.g. 40, L)"
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
                            updated[idx].color = val;
                            updated[idx].attributes = { ...updated[idx].attributes, Color: val };
                            setVariants(updated);
                          }}
                          placeholder="Color (e.g. Maroon)"
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
                            updated[idx].stock = {
                              warehouseId: warehouses[0]?.id || "1",
                              warehouseCode: defaultWarehouse,
                              quantity: qty,
                            };
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
                            updated[idx].sku = e.target.value;
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
                <label className="block text-slate-700 font-semibold mb-1">Weight (kg) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 0.5)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Length (cm) *</label>
                <input
                  type="number"
                  required
                  value={length}
                  onChange={(e) => setLength(parseFloat(e.target.value) || 30)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Breadth (cm) *</label>
                <input
                  type="number"
                  required
                  value={breadth}
                  onChange={(e) => setBreadth(parseFloat(e.target.value) || 20)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Height (cm) *</label>
                <input
                  type="number"
                  required
                  value={height}
                  onChange={(e) => setHeight(parseFloat(e.target.value) || 5)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {/* Media URLs */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Image Media URL (HTTPS)
              </label>
              <input
                type="url"
                value={mediaUrls[0] || ""}
                onChange={(e) => setMediaUrls([e.target.value])}
                placeholder="https://pub-2fbc147a469a4993ad805cbbfb7f8373.r2.dev/products/image.jpg"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
            >
              Add to Import Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

