import React, { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
  AlertCircle,
  Box,
  ChevronDown,
  ChevronUp,
  DollarSign,
  HelpCircle,
  Info,
  Layers,
  MapPin,
  Package,
  Ruler,
  Search,
  Sparkles,
  Tag,
  User,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import type { Category } from "@/lib/types/category/category";
import type { ProductFormValues, Warehouse } from "@/lib/types/product";
import RichTextEditor from "@/components/ui/RichTextEditor";

export interface BasicInfoStepProps {
  categories: Category[];
  warehouses: Warehouse[];
  isEditMode?: boolean;
}

/**
 * BasicInfoStep component:
 * - Eliminates upfront product type modal; starts immediately on product details.
 * - Features an inline toggle: "[ ] This product has multiple variants".
 * - When toggle is OFF (Simple Product): Renders root Base Price, Selling Price, and Warehouse Stock.
 * - When toggle is ON (Variable Product): Shows notification that variants manage pricing and stock.
 */
export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  categories,
  warehouses,
}) => {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<ProductFormValues>();

  const hasVariants = useWatch({ control, name: "hasVariants" });
  const watchedDescription = useWatch({ control, name: "description" }) || "";

  // Collapsible accordion states for secondary sections
  const [showArtisan, setShowArtisan] = useState(false);
  const [showShipping, setShowShipping] = useState(true);
  const [showSeo, setShowSeo] = useState(false);
  const [showConsultation, setShowConsultation] = useState(false);

  return (
    <div className="space-y-6">
      {/* 1. Primary Product Details Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <Package className="h-5 w-5 text-blue-600" />
          <h3 className="text-base font-semibold text-gray-900">
            Product Information
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Product Name */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Product Title *
            </label>
            <input
              type="text"
              {...register("name")}
              placeholder="e.g. Handwoven Kanchipuram Pure Silk Saree"
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white ${
                errors.name
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              } focus:outline-hidden focus:ring-2`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Category *
            </label>
            <select
              {...register("categoryId")}
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white ${
                errors.categoryId
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              } focus:outline-hidden focus:ring-2`}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.categoryId.message}
              </p>
            )}
          </div>

          {/* Base SKU */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Base SKU
              <span className="text-gray-400 font-normal ml-1">
                (Auto-generated if blank)
              </span>
            </label>
            <input
              type="text"
              {...register("sku")}
              placeholder="e.g. KS-SILK-001"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm bg-white font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            {errors.sku && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.sku.message}
              </p>
            )}
          </div>

          {/* HSN Code & Status Toggle */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              HSN Code
            </label>
            <input
              type="text"
              {...register("hsnCode")}
              placeholder="e.g. 5007"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="isActive"
              {...register("isActive")}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              Product is Active &amp; Published in Store
            </label>
          </div>

          {/* Product Description */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Product Description *
            </label>
            <div className="rounded-lg border border-gray-300 overflow-hidden bg-white">
              <RichTextEditor
                value={watchedDescription}
                onChange={(content) =>
                  setValue("description", content, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
            </div>
            {errors.description && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.description.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. INLINE VARIANT TOGGLE (The Core UX requirement!) */}
      <div className="bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-blue-50/70 rounded-xl border border-indigo-200/80 p-5 shadow-xs transition-all">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-lg mt-0.5">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900">
                Custom Variants
              </h4>
              <p className="text-xs text-gray-600 mt-1 max-w-xl">
                Enable custom variants if this product comes in multiple options
                such as different Sizes, Colors, or Fabrics.
              </p>
            </div>
          </div>

          {/* Switch Toggle */}
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasVariants}
              onChange={(e) => {
                const checked = e.target.checked;
                setValue("hasVariants", checked, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-hidden peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {hasVariants && (
          <div className="mt-4 pt-3 border-t border-indigo-100/80 flex items-center gap-2 text-xs text-indigo-800 font-medium">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span>
              Variant matrix is active. Head to the{" "}
              <strong>Variants Matrix</strong> step or section below to generate
              custom SKUs, prices, and stock.
            </span>
          </div>
        )}
      </div>

      {/* 3. Simple Product Pricing & Stock (Visible ONLY when hasVariants === false) */}
      {!hasVariants && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Pricing &amp; Inventory (Simple Product)
              </h3>
              <p className="text-xs text-gray-500">
                Specify retail pricing and warehouse inventory for this single
                product.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Base Price (MRP) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Base Price / MRP (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                {...register("basePrice", { valueAsNumber: true })}
                placeholder="e.g. 15000"
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white ${
                  errors.basePrice
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                } focus:outline-hidden focus:ring-2`}
              />
              {errors.basePrice && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.basePrice.message}
                </p>
              )}
            </div>

            {/* Selling Price */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Selling Price / Discounted (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                {...register("sellingPrice", { valueAsNumber: true })}
                placeholder="e.g. 12999"
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white ${
                  errors.sellingPrice
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                } focus:outline-hidden focus:ring-2`}
              />
              {errors.sellingPrice && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.sellingPrice.message}
                </p>
              )}
            </div>

            {/* Warehouse Select */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Warehouse *
              </label>
              <select
                {...register("stock.warehouseId")}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white ${
                  errors.stock?.warehouseId
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                } focus:outline-hidden focus:ring-2`}
              >
                <option value="">Select a warehouse</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
              {errors.stock?.warehouseId && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.stock.warehouseId.message}
                </p>
              )}
            </div>

            {/* Stock Quantity */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Available Stock Quantity *
              </label>
              <input
                type="number"
                {...register("stock.quantity", { valueAsNumber: true })}
                placeholder="e.g. 50"
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white ${
                  errors.stock?.quantity
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                } focus:outline-hidden focus:ring-2`}
              />
              {errors.stock?.quantity && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.stock.quantity.message}
                </p>
              )}
            </div>

            {/* Low Stock Alert Threshold */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Low Stock Threshold
              </label>
              <input
                type="number"
                {...register("stock.lowStockThreshold", {
                  valueAsNumber: true,
                })}
                placeholder="e.g. 5"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. Shipping & Dimensions Accordion */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowShipping(!showShipping)}
          className="w-full px-6 py-4 flex items-center justify-between bg-gray-50/50 hover:bg-gray-50 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <Ruler className="h-5 w-5 text-gray-700" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Shipping Dimensions &amp; Weight *
              </h3>
              <p className="text-xs text-gray-500">
                Required for courier volumetric weight calculation
              </p>
            </div>
          </div>
          {showShipping ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {showShipping && (
          <div className="p-6 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-2xs font-semibold text-gray-600 uppercase mb-1">
                Weight (kg) *
              </label>
              <input
                type="number"
                step="0.01"
                {...register("weight", { valueAsNumber: true })}
                placeholder="0.5"
                className={`w-full px-3 py-2 rounded-lg border text-sm bg-white ${
                  errors.weight ? "border-red-500" : "border-gray-300"
                } focus:ring-2 focus:ring-blue-500 focus:outline-hidden`}
              />
              {errors.weight && (
                <p className="mt-1 text-2xs text-red-600">
                  {errors.weight.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-2xs font-semibold text-gray-600 uppercase mb-1">
                Length (cm) *
              </label>
              <input
                type="number"
                step="0.1"
                {...register("length", { valueAsNumber: true })}
                placeholder="10"
                className={`w-full px-3 py-2 rounded-lg border text-sm bg-white ${
                  errors.length ? "border-red-500" : "border-gray-300"
                } focus:ring-2 focus:ring-blue-500 focus:outline-hidden`}
              />
              {errors.length && (
                <p className="mt-1 text-2xs text-red-600">
                  {errors.length.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-2xs font-semibold text-gray-600 uppercase mb-1">
                Breadth (cm) *
              </label>
              <input
                type="number"
                step="0.1"
                {...register("breadth", { valueAsNumber: true })}
                placeholder="10"
                className={`w-full px-3 py-2 rounded-lg border text-sm bg-white ${
                  errors.breadth ? "border-red-500" : "border-gray-300"
                } focus:ring-2 focus:ring-blue-500 focus:outline-hidden`}
              />
              {errors.breadth && (
                <p className="mt-1 text-2xs text-red-600">
                  {errors.breadth.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-2xs font-semibold text-gray-600 uppercase mb-1">
                Height (cm) *
              </label>
              <input
                type="number"
                step="0.1"
                {...register("height", { valueAsNumber: true })}
                placeholder="5"
                className={`w-full px-3 py-2 rounded-lg border text-sm bg-white ${
                  errors.height ? "border-red-500" : "border-gray-300"
                } focus:ring-2 focus:ring-blue-500 focus:outline-hidden`}
              />
              {errors.height && (
                <p className="mt-1 text-2xs text-red-600">
                  {errors.height.message}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 5. Artisan Information Accordion */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowArtisan(!showArtisan)}
          className="w-full px-6 py-4 flex items-center justify-between bg-gray-50/50 hover:bg-gray-50 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <User className="h-5 w-5 text-gray-700" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Artisan Story &amp; Weaver Details (Optional)
              </h3>
              <p className="text-xs text-gray-500">
                Highlight the master craftsman behind this heritage weave
              </p>
            </div>
          </div>
          {showArtisan ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {showArtisan && (
          <div className="p-6 border-t border-gray-100 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-2xs font-semibold text-gray-600 uppercase mb-1">
                  Artisan Name
                </label>
                <input
                  type="text"
                  {...register("artisanName")}
                  placeholder="e.g. Master Weaver Sundaramurthy"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-gray-600 uppercase mb-1">
                  Weaving Cluster / Location
                </label>
                <input
                  type="text"
                  {...register("artisanLocation")}
                  placeholder="e.g. Kanchipuram, Tamil Nadu"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-2xs font-semibold text-gray-600 uppercase mb-1">
                About the Artisan &amp; Craft Technique
              </label>
              <textarea
                rows={3}
                {...register("artisanAbout")}
                placeholder="Share the generational heritage and weaving traditions behind this weave..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        )}
      </div>

      {/* 6. SEO Meta Accordion */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSeo(!showSeo)}
          className="w-full px-6 py-4 flex items-center justify-between bg-gray-50/50 hover:bg-gray-50 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <Search className="h-5 w-5 text-gray-700" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                SEO &amp; Search Engine Listing
              </h3>
              <p className="text-xs text-gray-500">
                Customize titles and descriptions for Google search previews
              </p>
            </div>
          </div>
          {showSeo ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {showSeo && (
          <div className="p-6 border-t border-gray-100 space-y-4">
            <div>
              <label className="block text-2xs font-semibold text-gray-600 uppercase mb-1">
                Meta Title
              </label>
              <input
                type="text"
                {...register("metaTitle")}
                placeholder="Pure Kanchipuram Silk Sarees Online | Kankana Silks"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-2xs font-semibold text-gray-600 uppercase mb-1">
                Meta Description
              </label>
              <textarea
                rows={2}
                {...register("metaDesc")}
                placeholder="Buy authentic handwoven pure silk sarees directly from master artisans..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
