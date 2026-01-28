import React, { type JSX, useState } from "react";
import {
  Package,
  Layers,
  Upload,
  X,
  Plus,
  DollarSign,
  Tag,
  FileText,
  User,
  MapPin,
  Warehouse as WarehouseIcon,
  Ruler,
  Palette,
  Box,
  AlertCircle,
  Info,
  CheckCircle,
  Trash2,
  GripVertical,
  Star,
  ImageIcon,
  Video,
  Play,
  Weight,
  Maximize2,
  Sparkles,
  Image as ImagePlus,
  Zap,
  TrendingUp,
  Percent,
} from "lucide-react";
import type { Category } from "@/lib/types/category/category";
import type { CreateProductFormData } from "@/lib/types/product/schema";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import {
  validateColorWithSuggestions,
  getColorHex,
  isColorAttribute,
} from "@/lib/utils/colorValidation";
import { s3Api } from "@/lib/api/s3.api";


interface MediaPreviewItem {
  file: File | null;
  preview: string;
  isPrimary: boolean;
  id: string;
  type: "IMAGE" | "VIDEO";
  thumbnailUrl?: string;
}

interface AttributeField {
  key: string;
  value: string;
}

interface ProductFormStepsProps {
  currentStep: number;
  productType: "simple" | "variable";
  setProductType: React.Dispatch<React.SetStateAction<"simple" | "variable">>;
  register: UseFormRegister<CreateProductFormData>;
  errors: FieldErrors<CreateProductFormData>;
  categories?: { categories: Category[] };
  warehouses?: any[];
  specFields: any[];
  appendSpec: (spec: { key: string; value: string }) => void;
  removeSpec: (index: number) => void;
  mediaFields: any[];
  appendMedia: (media: any) => void;
  removeMedia: (index: number) => void;
  variantFields: any[];
  appendVariant: (variant: any) => void;
  removeVariant: (index: number) => void;
  mediaPreviews: MediaPreviewItem[];
  setMediaPreviews: React.Dispatch<React.SetStateAction<MediaPreviewItem[]>>;
  handleMediaUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  watch: any;
  setValue: any;
  // 🆕 NEW: Variant-specific features
  variantMediaPreviews: Record<number, MediaPreviewItem[]>;
  setVariantMediaPreviews: React.Dispatch<
    React.SetStateAction<Record<number, MediaPreviewItem[]>>
  >;
  handleVariantMediaUpload: (
    variantIndex: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  variantAttributeFields: Record<number, AttributeField[]>;
  variantAttributeErrors?: Record<number, Record<number, string>>; // ✅ ADD THIS
  appendVariantAttribute: (variantIndex: number) => void;
  removeVariantAttribute: (variantIndex: number, attrIndex: number) => void;
  updateVariantAttribute: (
    variantIndex: number,
    attrIndex: number,
    field: "key" | "value",
    value: string,
  ) => void;
}

// Helper function to render category options with hierarchy
const renderCategoryOptions = (
  categories: Category[],
  level: number = 0,
): JSX.Element[] => {
  const options: JSX.Element[] = [];

  categories.forEach((cat) => {
    const indent = "  ".repeat(level);
    const prefix = level > 0 ? "└─ " : "";

    options.push(
      <option key={cat.id} value={cat.id}>
        {indent}
        {prefix}
        {cat.name}
      </option>,
    );

    if (cat.children && cat.children.length > 0) {
      options.push(...renderCategoryOptions(cat.children, level + 1));
    }
  });

  return options;
};

const ProductFormSteps: React.FC<ProductFormStepsProps> = ({
  currentStep,
  productType,
  setProductType,
  register,
  errors,
  categories,
  warehouses,
  specFields,
  appendSpec,
  removeSpec,
  mediaFields,
  appendMedia,
  removeMedia,
  variantFields,
  appendVariant,
  removeVariant,
  mediaPreviews,
  setMediaPreviews,
  handleMediaUpload,
  watch,
  setValue,
  variantMediaPreviews,
  setVariantMediaPreviews,
  handleVariantMediaUpload,
  variantAttributeFields,
  variantAttributeErrors,
  appendVariantAttribute,
  removeVariantAttribute,
  updateVariantAttribute,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedVariantIndex, setDraggedVariantIndex] = useState<{
    variantIndex: number;
    mediaIndex: number;
  } | null>(null);

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newPreviews = [...mediaPreviews];
    const draggedItem = newPreviews[draggedIndex];
    newPreviews.splice(draggedIndex, 1);
    newPreviews.splice(index, 0, draggedItem);

    setMediaPreviews(newPreviews);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSetPrimary = (id: string) => {
    setMediaPreviews((prev) =>
      prev.map((item) => ({
        ...item,
        isPrimary: item.id === id,
      })),
    );
  };

  const handleRemoveMedia = async (id: string) => {
    const itemToRemove = mediaPreviews.find((m) => m.id === id);
    if (!itemToRemove) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this media?",
    );
    if (!confirmDelete) return;

    try {
      // ✅ If existing media (from backend)
      if (!itemToRemove.file) {
        await s3Api.deleteFileByUrl(itemToRemove.preview);
      }

      // ✅ If local media
      if (itemToRemove.file && itemToRemove.preview.startsWith("blob:")) {
        URL.revokeObjectURL(itemToRemove.preview);
      }

      setMediaPreviews((prev) => {
        const next = prev.filter((m) => m.id !== id);

        // ✅ keep a primary always
        if (!next.some((x) => x.isPrimary) && next.length > 0) {
          next[0].isPrimary = true;
        }

        return next;
      });
    } catch (error) {
      console.error("Delete media failed:", error);
      alert("Failed to delete media from S3");
    }
  };

  // Calculate volumetric weight
  const calculateVolumetricWeight = () => {
    const formData = watch();
    const { length, breadth, height } = formData;
    if (length && breadth && height) {
      return ((length * breadth * height) / 5000).toFixed(3);
    }
    return "0.000";
  };

  // 🆕 Calculate variant volumetric weight
  const calculateVariantVolumetricWeight = (index: number) => {
    const formData = watch();
    const variant = formData.variants?.[index];
    const length = variant?.length || formData.length;
    const breadth = variant?.breadth || formData.breadth;
    const height = variant?.height || formData.height;

    if (length && breadth && height) {
      return ((length * breadth * height) / 5000).toFixed(3);
    }
    return "0.000";
  };

  // 🆕 Calculate discount percentage
  const calculateDiscount = (base: number, selling: number) => {
    if (!base || !selling || base <= selling) return 0;
    return Math.round(((base - selling) / base) * 100);
  };

  // Step 1: Product Type Selection (Enhanced UI)
  if (currentStep === 1) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-3">
            Choose Your Product Type
          </h3>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Select whether your product has variants like size, color, or custom
            attributes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <button
            type="button"
            onClick={() => setProductType("simple")}
            className={`group relative p-8 border-2 rounded-2xl transition-all duration-300 ${
              productType === "simple"
                ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-xl scale-105"
                : "border-gray-200 hover:border-blue-300 hover:shadow-lg"
            }`}
          >
            <div
              className={`absolute top-4 right-4 transition-opacity ${
                productType === "simple" ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Package className="h-10 w-10 text-blue-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                Simple Product
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Single product with no variations
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                  One Price
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                  One SKU
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                  Quick Setup
                </span>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setProductType("variable")}
            className={`group relative p-8 border-2 rounded-2xl transition-all duration-300 ${
              productType === "variable"
                ? "border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-xl scale-105"
                : "border-gray-200 hover:border-purple-300 hover:shadow-lg"
            }`}
          >
            <div
              className={`absolute top-4 right-4 transition-opacity ${
                productType === "variable" ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Layers className="h-10 w-10 text-purple-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                Variable Product
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Product with multiple variants
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                  Custom Attributes
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                  Variant Pricing
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                  Variant Media
                </span>
              </div>
            </div>
          </button>
        </div>

        {productType && (
          <div className="mt-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl max-w-2xl mx-auto">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-900">
                <p className="font-semibold mb-1">
                  Perfect! You've selected{" "}
                  {productType === "simple" ? "Simple" : "Variable"} Product
                </p>
                <p>
                  {productType === "simple"
                    ? "Great for single-variant items. Click Next to continue."
                    : "Perfect for products with multiple options. You'll be able to add custom attributes, pricing, dimensions, and media for each variant."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Step 2: Basic Information (Enhanced with SKU)
  if (currentStep === 2) {
    const formData = watch();
    const discount = calculateDiscount(
      formData.basePrice,
      formData.sellingPrice,
    );

    return (
      <div className="space-y-8">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Basic Information
          </h3>
          <p className="text-gray-600">Tell us about your product</p>
        </div>

        {/* Product Name & SKU Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product Name *
            </label>
            <input
              {...register("name")}
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="e.g., Handwoven Cotton Saree"
            />
            {errors.name && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.name.message}
              </p>
            )}
          </div>

          {/* 🆕 SKU Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              SKU (Optional)
            </label>
            <input
              {...register("sku")}
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
              placeholder="AUTO-GEN"
            />
            <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Auto-generated if empty
            </p>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            {...register("description")}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            placeholder="Detailed product description..."
          />
          {errors.description && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Category *
          </label>
          <select
            {...register("categoryId")}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-mono text-sm transition-all"
          >
            <option value="">Select a category</option>
            {categories?.categories &&
              renderCategoryOptions(
                categories.categories.filter((cat) => !cat.parentId),
              )}
          </select>
          {errors.categoryId && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.categoryId.message}
            </p>
          )}
        </div>

        {/* Pricing Section - Enhanced */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <h4 className="text-lg font-bold text-gray-900">Product Pricing</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Base Price (MRP) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold text-lg">
                  ₹
                </span>
                <input
                  {...register("basePrice")}
                  type="number"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg font-semibold"
                  placeholder="0.00"
                />
              </div>
              {errors.basePrice && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.basePrice.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Selling Price *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold text-lg">
                  ₹
                </span>
                <input
                  {...register("sellingPrice")}
                  type="number"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg font-semibold"
                  placeholder="0.00"
                />
              </div>
              {errors.sellingPrice && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.sellingPrice.message}
                </p>
              )}
            </div>
          </div>

          {/* Discount Display */}
          {discount > 0 && (
            <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-green-600" />
                <span className="text-sm font-semibold text-green-900">
                  Discount Applied
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-green-600">
                  {discount}% OFF
                </span>
                <span className="text-sm text-green-700">
                  Save ₹
                  {(formData.basePrice - formData.sellingPrice).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* HSN Code */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            HSN Code (Optional)
          </label>
          <input
            {...register("hsnCode")}
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="e.g., 5208"
          />
          <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <Info className="h-3 w-3" />
            HSN code for GST classification
          </p>
        </div>

        {/* Shipping Dimensions - Enhanced */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Maximize2 className="h-5 w-5 text-green-600" />
            <h4 className="text-lg font-bold text-gray-900">
              Shipping Dimensions
            </h4>
            <span className="ml-auto px-3 py-1 bg-green-200 text-green-800 rounded-full text-xs font-bold">
              REQUIRED FOR SHIPROCKET
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Weight (kg) *
              </label>
              <div className="relative">
                <Weight className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...register("weight")}
                  type="number"
                  step="0.001"
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  placeholder="0.500"
                />
              </div>
              {errors.weight && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.weight.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Length (cm) *
              </label>
              <input
                {...register("length")}
                type="number"
                step="0.01"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                placeholder="30"
              />
              {errors.length && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.length.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Breadth (cm) *
              </label>
              <input
                {...register("breadth")}
                type="number"
                step="0.01"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                placeholder="20"
              />
              {errors.breadth && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.breadth.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Height (cm) *
              </label>
              <input
                {...register("height")}
                type="number"
                step="0.01"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                placeholder="10"
              />
              {errors.height && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.height.message}
                </p>
              )}
            </div>
          </div>

          {/* Volumetric Weight Display */}
          <div className="bg-white border-2 border-green-300 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-green-900 mb-1">
                  Volumetric Weight
                </p>
                <p className="text-xs text-green-700">(L × B × H) ÷ 5000</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-600">
                  {calculateVolumetricWeight()} kg
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Artisan Information - Enhanced */}
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-amber-600" />
            <h4 className="text-lg font-bold text-gray-900">
              Artisan Information
            </h4>
            <span className="ml-auto px-3 py-1 bg-amber-200 text-amber-800 rounded-full text-xs font-bold">
              OPTIONAL
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Artisan Name
              </label>
              <input
                {...register("artisanName")}
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                placeholder="Name of the artisan"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                About Artisan
              </label>
              <textarea
                {...register("artisanAbout")}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none"
                placeholder="Brief description about the artisan..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Artisan Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register("artisanLocation")}
                  type="text"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  placeholder="e.g., Varanasi, Uttar Pradesh"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Out-of-Stock & Video Features */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Additional Features
          </h4>

          <div className="space-y-3">
            <div className="flex items-center">
              <input
                {...register("allowOutOfStockOrders")}
                type="checkbox"
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label className="ml-2 text-sm text-gray-700">
                Allow orders when stock is low (below threshold but not zero)
              </label>
            </div>

            <div className="flex items-center">
              <input
                {...register("hasVideoConsultation")}
                type="checkbox"
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label className="ml-2 text-sm text-gray-700">
                Enable Video Consultation
              </label>
            </div>

            <div className="flex items-center">
              <input
                {...register("videoPurchasingEnabled")}
                type="checkbox"
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label className="ml-2 text-sm text-gray-700">
                Enable Video Purchasing
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video Consultation Note
              </label>
              <textarea
                {...register("videoConsultationNote")}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Add instructions for video consultation..."
              />
            </div>
          </div>
        </div>

        {/* Specifications - Enhanced */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-indigo-600" />
              <h4 className="text-lg font-bold text-gray-900">
                Specifications
              </h4>
            </div>
            <button
              type="button"
              onClick={() => appendSpec({ key: "", value: "" })}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-2 font-semibold transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4" />
              Add Spec
            </button>
          </div>

          {specFields.length > 0 ? (
            <div className="space-y-3">
              {specFields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex gap-3 bg-white p-3 rounded-xl border border-indigo-200"
                >
                  <input
                    {...register(`specifications.${index}.key` as const)}
                    placeholder="Key (e.g., Fabric)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    {...register(`specifications.${index}.value` as const)}
                    placeholder="Value (e.g., Cotton)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeSpec(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-white rounded-xl border-2 border-dashed border-indigo-300">
              <Tag className="h-10 w-10 text-indigo-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                No specifications added yet
              </p>
            </div>
          )}
        </div>

        {/* Active Status */}
        <div className="flex items-center justify-center p-6 bg-gray-50 rounded-2xl border-2 border-gray-200">
          <label className="flex items-center space-x-3 cursor-pointer group">
            <input
              {...register("isActive")}
              type="checkbox"
              className="h-6 w-6 text-blue-600 rounded-lg focus:ring-blue-500 focus:ring-2 transition-all cursor-pointer"
            />
            <div>
              <span className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                Publish this product immediately
              </span>
              <p className="text-sm text-gray-500">
                Product will be visible on your store right away
              </p>
            </div>
          </label>
        </div>
      </div>
    );
  }

  // Continue in next part due to length...
  // Step 3: Media Upload (Enhanced)
  if (currentStep === 3) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <Upload className="h-6 w-6 text-blue-600" />
            Product Media
          </h3>
          <p className="text-gray-600">Upload high-quality images and videos</p>
        </div>

        {/* Upload Area - Enhanced */}
        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 cursor-pointer group">
          <input
            type="file"
            id="media-upload"
            multiple
            accept="image/*,video/*"
            onChange={handleMediaUpload}
            className="hidden"
          />
          <label
            htmlFor="media-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload className="h-10 w-10 text-blue-600" />
            </div>
            <p className="text-xl font-bold text-gray-900 mb-2">
              Click to upload media
            </p>
            <p className="text-sm text-gray-500">
              Images (PNG, JPG) or Videos (MP4, WebM) • Max 50MB each
            </p>
            <div className="flex items-center gap-2 mt-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                Drag & Drop
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                Multi-Upload
              </span>
            </div>
          </label>
        </div>

        {/* Media Preview Grid */}
        {mediaPreviews.length > 0 && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 flex items-center gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <p className="text-sm text-blue-900">
                <strong>Drag</strong> to reorder • <strong>Click star</strong>{" "}
                to set primary • <strong>Hover</strong> to manage
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mediaPreviews.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`relative group cursor-move border-2 rounded-xl overflow-hidden transition-all duration-300 ${
                    item.isPrimary
                      ? "border-blue-500 ring-4 ring-blue-200 shadow-xl"
                      : "border-gray-200 hover:border-blue-400 hover:shadow-lg"
                  } ${
                    draggedIndex === index ? "opacity-50 scale-95" : "scale-100"
                  }`}
                >
                  {/* Media Display */}
                  <div className="aspect-square">
                    {item.type === "VIDEO" ? (
                      <div className="relative w-full h-full bg-gray-900">
                        <video
                          src={item.preview}
                          className="w-full h-full object-cover"
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                            <Play className="h-8 w-8 text-gray-800 ml-1" />
                          </div>
                        </div>
                        <div className="absolute top-2 left-2 px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded-lg">
                          VIDEO
                        </div>
                      </div>
                    ) : (
                      <img
                        src={item.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Drag Handle */}
                  <div className="absolute top-2 left-2 p-2 bg-black bg-opacity-60 rounded-lg cursor-move backdrop-blur-sm">
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>

                  {/* Primary Badge */}
                  {item.isPrimary && (
                    <div className="absolute top-2 right-2 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-lg">
                      <Star className="h-3 w-3 fill-white" />
                      PRIMARY
                    </div>
                  )}

                  {/* Actions Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end justify-center gap-2 p-3">
                    {!item.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(item.id)}
                        className="px-3 py-2 bg-white hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 shadow-lg"
                        title="Set as primary"
                      >
                        <Star className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-semibold">
                          Set Primary
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(item.id)}
                      className="px-3 py-2 bg-white hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 shadow-lg"
                      title="Remove media"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                      <span className="text-xs font-semibold">Remove</span>
                    </button>
                  </div>

                  {/* Order Badge */}
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-70 backdrop-blur-sm text-white text-xs font-bold rounded-lg">
                    #{index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {mediaPreviews.length === 0 && (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
            <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-semibold text-lg">
              No media uploaded yet
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Upload images and videos to showcase your product
            </p>
          </div>
        )}
      </div>
    );
  }

  // ProductFormSteps.tsx - Part 2 (Steps 4 & 5)
  // Continue from Part 1...

  // Step 4: Stock Management or Variants
  if (currentStep === 4) {
    // Simple Product - Stock Management
    if (productType === "simple") {
      return (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
              <WarehouseIcon className="h-6 w-6 text-blue-600" />
              Stock Management
            </h3>
            <p className="text-gray-600">Manage inventory for your product</p>
          </div>

          {/* Warehouse Selection */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <WarehouseIcon className="h-5 w-5 text-blue-600" />
              <h4 className="text-lg font-bold text-gray-900">
                Warehouse Location
              </h4>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Warehouse *
              </label>

              <select
                {...register("stock.warehouseId")}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
              >
                <option value="">Choose a warehouse</option>
                {warehouses?.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} - {warehouse.location}
                  </option>
                ))}
              </select>

              {errors.stock?.warehouseId?.message && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.stock.warehouseId.message}
                </p>
              )}
            </div>
          </div>

          {/* Stock Quantity */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Box className="h-5 w-5 text-green-600" />
              <h4 className="text-lg font-bold text-gray-900">
                Stock Quantity
              </h4>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Available Quantity *
              </label>
              <input
                {...register("stock.quantity")}
                type="number"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-lg font-semibold"
                placeholder="e.g., 100"
              />
              {errors?.stock?.quantity?.message && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.stock.quantity?.message}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Initial stock quantity for this product
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Variable Product - Variants Management
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <Layers className="h-6 w-6 text-purple-600" />
            Product Variants
          </h3>
          <p className="text-gray-600">
            Configure variants with custom attributes
          </p>
        </div>

        {/* Add Variant Button */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-purple-600" />
            <span className="font-bold text-gray-900">
              {variantFields.length} Variant
              {variantFields.length !== 1 ? "s" : ""}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              appendVariant({
                size: "",
                color: "",
                fabric: "",
                price: "",
                basePrice: "",
                sellingPrice: "",
                warehouseId: "",
                stockQuantity: 0,
                weight: "",
                length: "",
                breadth: "",
                height: "",
              });
            }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl flex items-center gap-2 font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            Add Variant
          </button>
        </div>

        {/* Variants List */}
        {variantFields?.length > 0 ? (
          <div className="space-y-6">
            {Array.isArray(variantFields) &&
              variantFields?.map((field, variantIndex) => {
                const formData = watch();
                const variant = formData.variants?.[variantIndex];
                const discount =
                  variant?.basePrice && variant?.sellingPrice
                    ? calculateDiscount(variant.basePrice, variant.sellingPrice)
                    : 0;

                return (
                  <div
                    key={field.id}
                    className="bg-white border-2 border-purple-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
                  >
                    {/* Variant Header */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-purple-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold">
                          #{variantIndex + 1}
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">
                            Variant {variantIndex + 1}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Configure attributes and details
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVariant(variantIndex)}
                        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg flex items-center gap-2 font-semibold transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </div>

                    {/* Dynamic Attributes Section */}
                    <div className="mb-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Tag className="h-5 w-5 text-indigo-600" />
                          <h5 className="text-base font-bold text-gray-900">
                            Custom Attributes
                          </h5>
                          <span className="ml-2 px-2 py-1 bg-indigo-200 text-indigo-800 rounded-full text-xs font-bold">
                            DYNAMIC
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => appendVariantAttribute(variantIndex)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1 text-sm font-semibold transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          Add
                        </button>
                      </div>

                      {(variantAttributeFields?.[variantIndex] ?? [])?.length >
                      0 ? (
                        <div className="space-y-3">
                          {(variantAttributeFields?.[variantIndex] ?? [])?.map(
                            (attr, attrIndex) => {
                              const isColorField = isColorAttribute(attr.key);
                              const hasError =
                                variantAttributeErrors?.[variantIndex]?.[
                                  attrIndex
                                ];

                              // Dynamic validation
                              const colorValidation =
                                isColorField && attr.value
                                  ? validateColorWithSuggestions(attr.value)
                                  : null;

                              const isValidColorValue =
                                colorValidation?.isValid ?? true;
                              const colorHex = colorValidation?.hex;
                              const suggestions =
                                colorValidation?.suggestions || [];

                              return (
                                <div
                                  key={attrIndex}
                                  className="bg-white p-3 rounded-lg border border-indigo-200"
                                >
                                  <div className="flex gap-3 mb-2">
                                    {/* Attribute Key Input */}
                                    <div className="flex-1 relative">
                                      <input
                                        value={attr.key}
                                        onChange={(e) =>
                                          updateVariantAttribute(
                                            variantIndex,
                                            attrIndex,
                                            "key",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="Attribute (e.g., Material, Color)"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                      />
                                      {isColorField && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                          <Palette className="h-4 w-4 text-indigo-500" />
                                        </div>
                                      )}
                                    </div>

                                    {/* Attribute Value Input with Color Preview */}
                                    <div className="flex-1 relative">
                                      <div className="flex gap-2">
                                        <input
                                          value={attr.value}
                                          onChange={(e) =>
                                            updateVariantAttribute(
                                              variantIndex,
                                              attrIndex,
                                              "value",
                                              e.target.value,
                                            )
                                          }
                                          placeholder={
                                            isColorField
                                              ? "Any CSS color (red, #FF0000, rgb(255,0,0))"
                                              : "Value (e.g., Silk)"
                                          }
                                          className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                                            hasError
                                              ? "border-red-500 focus:ring-red-500"
                                              : isColorField &&
                                                  attr.value &&
                                                  isValidColorValue
                                                ? "border-green-500 focus:ring-green-500"
                                                : "border-gray-300 focus:ring-indigo-500"
                                          }`}
                                        />

                                        {/* Dynamic Color Preview Swatch */}
                                        {isColorField &&
                                          isValidColorValue &&
                                          attr.value &&
                                          colorHex && (
                                            <div className="relative group">
                                              <div
                                                className="w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm flex-shrink-0 cursor-pointer transition-transform hover:scale-110"
                                                style={{
                                                  backgroundColor: colorHex,
                                                }}
                                                title={`${attr.value} (${colorHex})`}
                                              />
                                              {/* Tooltip */}
                                              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                {colorHex}
                                              </div>
                                            </div>
                                          )}
                                      </div>

                                      {/* Smart Suggestions Dropdown */}
                                      {isColorField &&
                                        suggestions.length > 0 &&
                                        !isValidColorValue &&
                                        attr.value && (
                                          <div className="absolute z-20 w-full mt-1 bg-white border border-indigo-300 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                            <div className="px-3 py-2 bg-indigo-50 border-b border-indigo-200 sticky top-0">
                                              <p className="text-xs font-semibold text-indigo-900 flex items-center gap-1">
                                                <Info className="h-3 w-3" />
                                                Did you mean one of these?
                                              </p>
                                            </div>
                                            {suggestions.map((suggestion) => {
                                              const suggestedHex =
                                                getColorHex(suggestion);
                                              return (
                                                <button
                                                  key={suggestion}
                                                  type="button"
                                                  onClick={() => {
                                                    updateVariantAttribute(
                                                      variantIndex,
                                                      attrIndex,
                                                      "value",
                                                      suggestion,
                                                    );
                                                  }}
                                                  className="w-full px-3 py-2.5 text-left hover:bg-indigo-50 flex items-center gap-3 transition-colors border-b border-gray-100 last:border-0"
                                                >
                                                  <div
                                                    className="w-8 h-8 rounded-lg border-2 border-gray-300 shadow-sm flex-shrink-0"
                                                    style={{
                                                      backgroundColor:
                                                        suggestedHex ||
                                                        "#CCCCCC",
                                                    }}
                                                  />
                                                  <div className="flex-1">
                                                    <span className="text-sm font-medium capitalize block">
                                                      {suggestion}
                                                    </span>
                                                    {suggestedHex && (
                                                      <span className="text-xs text-gray-500 font-mono">
                                                        {suggestedHex}
                                                      </span>
                                                    )}
                                                  </div>
                                                </button>
                                              );
                                            })}
                                          </div>
                                        )}
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeVariantAttribute(
                                          variantIndex,
                                          attrIndex,
                                        )
                                      }
                                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                    >
                                      <X className="h-5 w-5" />
                                    </button>
                                  </div>

                                  {/* Error Message with Smart Suggestions */}
                                  {hasError && (
                                    <div className="flex items-start gap-2 text-sm text-red-600 mt-2 bg-red-50 p-2 rounded-lg border border-red-200">
                                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                      <span>{hasError}</span>
                                    </div>
                                  )}

                                  {/* Valid Color Success Message with Hex */}
                                  {isColorField &&
                                    isValidColorValue &&
                                    attr.value &&
                                    !hasError &&
                                    colorHex && (
                                      <div className="flex items-center justify-between text-sm text-green-600 mt-2 bg-green-50 p-2 rounded-lg border border-green-200">
                                        <div className="flex items-center gap-2">
                                          <CheckCircle className="h-4 w-4" />
                                          <span className="font-medium">
                                            Valid color: {attr.value}
                                          </span>
                                        </div>
                                        <span className="text-xs font-mono text-green-700 bg-white px-2 py-0.5 rounded border border-green-300">
                                          {colorHex}
                                        </span>
                                      </div>
                                    )}

                                  {/* Dynamic Helper Text */}
                                  {isColorField && !attr.value && (
                                    <div className="flex items-start gap-2 text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded-lg">
                                      <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                      <div>
                                        <p className="font-medium mb-1">
                                          Accepts any CSS color format:
                                        </p>
                                        <ul className="list-disc list-inside space-y-0.5 text-gray-600">
                                          <li>
                                            Color names:{" "}
                                            <code className="bg-white px-1 rounded">
                                              red
                                            </code>
                                            ,{" "}
                                            <code className="bg-white px-1 rounded">
                                              lightblue
                                            </code>
                                          </li>
                                          <li>
                                            Hex codes:{" "}
                                            <code className="bg-white px-1 rounded">
                                              #FF0000
                                            </code>
                                          </li>
                                          <li>
                                            RGB:{" "}
                                            <code className="bg-white px-1 rounded">
                                              rgb(255, 0, 0)
                                            </code>
                                          </li>
                                        </ul>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            },
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4 bg-white rounded-lg border-2 border-dashed border-indigo-300">
                          <Tag className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">
                            No custom attributes
                          </p>
                          <p className="text-xs text-gray-400">
                            Click Add to create
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Legacy Fields (Size, Color, Fabric) - Enhanced with Color Validation */}
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Palette className="h-5 w-5 text-purple-600" />
                        <h5 className="text-base font-bold text-gray-900">
                          Standard Attributes
                        </h5>
                        <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-bold">
                          LEGACY
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Size Field */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Size
                          </label>
                          <input
                            {...register(
                              `variants.${variantIndex}.size` as const,
                            )}
                            type="text"
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="e.g., M, L, XL"
                          />
                        </div>

                        {/* Color Field - Enhanced with Validation */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            Color
                            <Palette className="h-3 w-3 text-purple-500" />
                          </label>
                          <div className="relative">
                            {(() => {
                              const colorValue = variant?.color || "";
                              const colorValidation = colorValue
                                ? validateColorWithSuggestions(colorValue)
                                : null;
                              const isValidColor =
                                colorValidation?.isValid ?? true;
                              const colorHex = colorValidation?.hex;
                              const colorSuggestions =
                                colorValidation?.suggestions || [];

                              return (
                                <>
                                  <div className="flex gap-2">
                                    <input
                                      {...register(
                                        `variants.${variantIndex}.color` as const,
                                      )}
                                      type="text"
                                      className={`flex-1 px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                                        colorValue && !isValidColor
                                          ? "border-red-500 focus:ring-red-500"
                                          : colorValue && isValidColor
                                            ? "border-green-500 focus:ring-green-500"
                                            : "border-gray-300 focus:ring-purple-500"
                                      }`}
                                      placeholder="Any CSS color (red, #FF0000)"
                                    />

                                    {/* Color Preview Swatch */}
                                    {colorValue && isValidColor && colorHex && (
                                      <div className="relative group">
                                        <div
                                          className="w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm flex-shrink-0 cursor-pointer transition-transform hover:scale-110"
                                          style={{
                                            backgroundColor: colorHex,
                                          }}
                                          title={`${colorValue} (${colorHex})`}
                                        />
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                          {colorHex}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Color Suggestions Dropdown */}
                                  {colorValue &&
                                    colorSuggestions.length > 0 &&
                                    !isValidColor && (
                                      <div className="absolute z-20 w-full mt-1 bg-white border border-purple-300 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                        <div className="px-3 py-2 bg-purple-50 border-b border-purple-200 sticky top-0">
                                          <p className="text-xs font-semibold text-purple-900 flex items-center gap-1">
                                            <Info className="h-3 w-3" />
                                            Did you mean one of these?
                                          </p>
                                        </div>
                                        {colorSuggestions.map((suggestion) => {
                                          const suggestedHex =
                                            getColorHex(suggestion);
                                          return (
                                            <button
                                              key={suggestion}
                                              type="button"
                                              onClick={() => {
                                                setValue(
                                                  `variants.${variantIndex}.color` as const,
                                                  suggestion,
                                                  {
                                                    shouldDirty: true,
                                                    shouldValidate: true,
                                                  },
                                                );
                                              }}
                                              className="w-full px-3 py-2.5 text-left hover:bg-purple-50 flex items-center gap-3 transition-colors border-b border-gray-100 last:border-0"
                                            >
                                              <div
                                                className="w-8 h-8 rounded-lg border-2 border-gray-300 shadow-sm flex-shrink-0"
                                                style={{
                                                  backgroundColor:
                                                    suggestedHex || "#CCCCCC",
                                                }}
                                              />
                                              <div className="flex-1">
                                                <span className="text-sm font-medium capitalize block">
                                                  {suggestion}
                                                </span>
                                                {suggestedHex && (
                                                  <span className="text-xs text-gray-500 font-mono">
                                                    {suggestedHex}
                                                  </span>
                                                )}
                                              </div>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}

                                  {/* Validation Messages */}
                                  {colorValue && !isValidColor && (
                                    <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                                      <AlertCircle className="h-3 w-3" />
                                      <span>
                                        Invalid color
                                        {colorSuggestions.length > 0 && (
                                          <> - see suggestions below</>
                                        )}
                                      </span>
                                    </div>
                                  )}

                                  {colorValue && isValidColor && colorHex && (
                                    <div className="flex items-center justify-between text-xs text-green-600 mt-1">
                                      <div className="flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        <span className="font-medium">
                                          Valid: {colorValue}
                                        </span>
                                      </div>
                                      <span className="font-mono text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                                        {colorHex}
                                      </span>
                                    </div>
                                  )}

                                  {!colorValue && (
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                      <Info className="h-3 w-3" />
                                      e.g., Red, Blue, #FF0000
                                    </p>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Fabric Field */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Fabric
                          </label>
                          <input
                            {...register(
                              `variants.${variantIndex}.fabric` as const,
                            )}
                            type="text"
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="e.g., Cotton"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Variant Pricing */}
                    <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                        <h5 className="text-base font-bold text-gray-900">
                          Variant Pricing
                        </h5>
                        <span className="ml-auto px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-bold">
                          OPTIONAL
                        </span>
                      </div>
                      <p className="text-xs text-blue-700 mb-4 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Leave empty to use product pricing (₹
                        {formData.basePrice || "0.00"} base, ₹
                        {formData.sellingPrice || "0.00"} selling)
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Base Price
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                              ₹
                            </span>
                            <input
                              {...register(
                                `variants.${variantIndex}.basePrice` as const,
                              )}
                              type="number"
                              step="0.01"
                              className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={formData.basePrice || "0.00"}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Selling Price
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                              ₹
                            </span>
                            <input
                              {...register(
                                `variants.${variantIndex}.sellingPrice` as const,
                              )}
                              type="number"
                              step="0.01"
                              className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={formData.sellingPrice || "0.00"}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Price (Legacy) *
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                              ₹
                            </span>
                            <input
                              {...register(
                                `variants.${variantIndex}.price` as const,
                              )}
                              type="number"
                              step="0.01"
                              className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Required"
                            />
                          </div>
                        </div>
                      </div>

                      {discount > 0 && (
                        <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg flex items-center justify-between">
                          <span className="text-sm font-semibold text-green-900">
                            Variant Discount
                          </span>
                          <span className="text-lg font-bold text-green-600">
                            {discount}% OFF
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Variant Dimensions */}
                    <div className="mb-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Maximize2 className="h-5 w-5 text-green-600" />
                        <h5 className="text-base font-bold text-gray-900">
                          Variant Dimensions
                        </h5>
                        <span className="ml-auto px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs font-bold">
                          OPTIONAL
                        </span>
                      </div>
                      <p className="text-xs text-green-700 mb-4 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Leave empty to use product dimensions
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Weight (kg)
                          </label>
                          <input
                            {...register(
                              `variants.${variantIndex}.weight` as const,
                            )}
                            type="number"
                            step="0.001"
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder={formData.weight || "0.500"}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Length (cm)
                          </label>
                          <input
                            {...register(
                              `variants.${variantIndex}.length` as const,
                            )}
                            type="number"
                            step="0.01"
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder={formData.length || "30"}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Breadth (cm)
                          </label>
                          <input
                            {...register(
                              `variants.${variantIndex}.breadth` as const,
                            )}
                            type="number"
                            step="0.01"
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder={formData.breadth || "20"}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Height (cm)
                          </label>
                          <input
                            {...register(
                              `variants.${variantIndex}.height` as const,
                            )}
                            type="number"
                            step="0.01"
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder={formData.height || "10"}
                          />
                        </div>
                      </div>

                      <div className="bg-white border-2 border-green-300 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-green-900">
                            Volumetric Weight
                          </span>
                          <span className="text-2xl font-bold text-green-600">
                            {calculateVariantVolumetricWeight(variantIndex)} kg
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Variant Media */}
                    <div className="mb-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <ImagePlus className="h-5 w-5 text-purple-600" />
                        <h5 className="text-base font-bold text-gray-900">
                          Variant Media
                        </h5>
                        <span className="ml-auto px-2 py-1 bg-purple-200 text-purple-800 rounded-full text-xs font-bold">
                          OPTIONAL
                        </span>
                      </div>
                      <p className="text-xs text-purple-700 mb-4 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Falls back to product media if not provided
                      </p>

                      <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer">
                        <input
                          type="file"
                          id={`variant-media-${variantIndex}`}
                          multiple
                          accept="image/*,video/*"
                          onChange={(e) =>
                            handleVariantMediaUpload(variantIndex, e)
                          }
                          className="hidden"
                        />
                        <label
                          htmlFor={`variant-media-${variantIndex}`}
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <Upload className="h-8 w-8 text-purple-600 mb-2" />
                          <p className="text-sm font-semibold text-gray-900 mb-1">
                            Upload variant-specific media
                          </p>
                          <p className="text-xs text-gray-500">
                            Images or videos for this variant
                          </p>
                        </label>
                      </div>

                      {(variantMediaPreviews?.[variantIndex] ?? [])?.length >
                        0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                          {(variantMediaPreviews?.[variantIndex] ?? []).map(
                            (item, idx) => (
                              <div
                                key={item.id}
                                draggable
                                onDragStart={() =>
                                  setDraggedVariantIndex({
                                    variantIndex,
                                    mediaIndex: idx,
                                  })
                                }
                                onDragOver={(e) => {
                                  e.preventDefault();

                                  if (!draggedVariantIndex) return;
                                  if (
                                    draggedVariantIndex.variantIndex !==
                                    variantIndex
                                  )
                                    return;
                                  if (draggedVariantIndex.mediaIndex === idx)
                                    return;

                                  setVariantMediaPreviews((prev) => {
                                    const current = [
                                      ...(prev?.[variantIndex] ?? []),
                                    ];
                                    const draggedItem =
                                      current[draggedVariantIndex.mediaIndex];

                                    current.splice(
                                      draggedVariantIndex.mediaIndex,
                                      1,
                                    );
                                    current.splice(idx, 0, draggedItem);

                                    // ✅ keep primary always on first item if none
                                    const fixed = current.map((m, i) => ({
                                      ...m,
                                      isPrimary: i === 0,
                                    }));

                                    return { ...prev, [variantIndex]: fixed };
                                  });

                                  setDraggedVariantIndex({
                                    variantIndex,
                                    mediaIndex: idx,
                                  });
                                }}
                                onDragEnd={() => setDraggedVariantIndex(null)}
                                className={`relative group cursor-move border-2 rounded-xl overflow-hidden transition-all duration-300 ${
                                  item.isPrimary
                                    ? "border-purple-500 ring-4 ring-purple-200 shadow-xl"
                                    : "border-purple-200 hover:border-purple-400 hover:shadow-lg"
                                }`}
                              >
                                {/* Media */}
                                <div className="aspect-square">
                                  {item.type === "VIDEO" ? (
                                    <div className="relative w-full h-full bg-gray-900">
                                      <video
                                        src={item.preview}
                                        className="w-full h-full object-cover"
                                        muted
                                        playsInline
                                        autoPlay
                                        loop
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                                          <Play className="h-6 w-6 text-gray-800 ml-1" />
                                        </div>
                                      </div>
                                      <div className="absolute top-2 left-2 px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded-lg">
                                        VIDEO
                                      </div>
                                    </div>
                                  ) : (
                                    <img
                                      src={item.preview}
                                      alt={`Variant ${variantIndex + 1} media ${
                                        idx + 1
                                      }`}
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </div>

                                {/* Drag Handle */}
                                <div className="absolute top-2 left-2 p-2 bg-black/60 rounded-lg backdrop-blur-sm">
                                  <GripVertical className="h-4 w-4 text-white" />
                                </div>

                                {/* Primary Badge */}
                                {item.isPrimary && (
                                  <div className="absolute top-2 right-2 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-lg">
                                    <Star className="h-3 w-3 fill-white" />
                                    PRIMARY
                                  </div>
                                )}

                                {/* Order Badge */}
                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs font-bold rounded-lg">
                                  #{idx + 1}
                                </div>

                                {/* Actions */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end justify-center gap-2 p-3">
                                  {!item.isPrimary && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setVariantMediaPreviews((prev) => ({
                                          ...prev,
                                          [variantIndex]: (
                                            prev?.[variantIndex] ?? []
                                          ).map((m) => ({
                                            ...m,
                                            isPrimary: m.id === item.id,
                                          })),
                                        }));
                                      }}
                                      className="px-3 py-2 bg-white hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-1 shadow-lg"
                                    >
                                      <Star className="h-4 w-4 text-purple-600" />
                                      <span className="text-xs font-semibold">
                                        Set Primary
                                      </span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const itemToRemove =
                                        variantMediaPreviews?.[variantIndex]?.[
                                          idx
                                        ];
                                      if (!itemToRemove) return;

                                      const confirmDelete = window.confirm(
                                        "Are you sure you want to delete this variant media?",
                                      );
                                      if (!confirmDelete) return;

                                      try {
                                        // ✅ If existing variant media in S3
                                        if (!itemToRemove.file) {
                                          await s3Api.deleteFileByUrl(
                                            itemToRemove.preview,
                                          );
                                        }

                                        // ✅ If local file preview
                                        if (
                                          itemToRemove.file &&
                                          itemToRemove.preview.startsWith(
                                            "blob:",
                                          )
                                        ) {
                                          URL.revokeObjectURL(
                                            itemToRemove.preview,
                                          );
                                        }

                                        setVariantMediaPreviews((prev) => {
                                          const updated = (
                                            prev?.[variantIndex] ?? []
                                          ).filter((_, i) => i !== idx);

                                          const fixed = updated.map((m, i) => ({
                                            ...m,
                                            isPrimary: i === 0,
                                          }));

                                          return {
                                            ...prev,
                                            [variantIndex]: fixed,
                                          };
                                        });
                                      } catch (error) {
                                        console.error(
                                          "Delete variant media failed:",
                                          error,
                                        );
                                        alert(
                                          "Failed to delete variant media from S3",
                                        );
                                      }
                                    }}
                                    className="px-3 py-2 bg-white hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 shadow-lg"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                    <span className="text-xs font-semibold">
                                      Remove
                                    </span>
                                  </button>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>

                    {/* Stock Management */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Warehouse *
                        </label>
                        <select
                          {...register(
                            `variants.${variantIndex}.stock.warehouseId` as const,
                          )}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                        >
                          <option value="">Select warehouse</option>
                          {warehouses?.map((warehouse) => (
                            <option key={warehouse.id} value={warehouse.id}>
                              {warehouse.name}
                            </option>
                          ))}
                        </select>

                        {errors.variants?.[variantIndex]?.stock?.warehouseId
                          ?.message && (
                          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {
                              errors.variants[variantIndex]?.stock?.warehouseId
                                ?.message
                            }
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Stock Quantity *
                        </label>
                        <input
                          {...register(
                            `variants.${variantIndex}.stock.quantity` as const,
                          )}
                          type="number"
                          min="0"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="e.g., 50"
                        />

                        {errors.variants?.[variantIndex]?.stock?.quantity
                          ?.message && (
                          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {
                              errors.variants[variantIndex]?.stock?.quantity
                                ?.message
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-16 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-dashed border-purple-300">
            <Layers className="h-16 w-16 text-purple-400 mx-auto mb-4" />
            <p className="text-gray-700 font-semibold text-lg mb-2">
              No variants added yet
            </p>
            <p className="text-gray-500 text-sm mb-4">
              Click "Add Variant" to create your first product variant
            </p>
          </div>
        )}
      </div>
    );
  }

  // Step 5: Review & Submit
  if (currentStep === 5) {
    const formData = watch();
    const discount = calculateDiscount(
      formData.basePrice,
      formData.sellingPrice,
    );

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4 shadow-lg">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">
            Review Your Product
          </h3>
          <p className="text-gray-600">
            Double-check everything before submitting
          </p>
        </div>

        {/* Product Type Badge */}
        <div className="flex justify-center">
          <div
            className={`px-6 py-3 rounded-xl flex items-center gap-2 ${
              productType === "simple"
                ? "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800"
                : "bg-gradient-to-r from-purple-100 to-pink-200 text-purple-800"
            }`}
          >
            {productType === "simple" ? (
              <Package className="h-5 w-5" />
            ) : (
              <Layers className="h-5 w-5" />
            )}
            <span className="font-bold">
              {productType === "simple" ? "Simple Product" : "Variable Product"}
            </span>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-md">
          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Basic Information
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-sm font-semibold text-gray-600">Name:</span>
              <span className="text-sm text-gray-900 font-medium text-right max-w-md">
                {formData.name || "—"}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm font-semibold text-gray-600">SKU:</span>
              <span className="text-sm text-gray-900 font-medium font-mono">
                {formData.sku || "Auto-generated"}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm font-semibold text-gray-600">
                Description:
              </span>
              <span className="text-sm text-gray-900 font-medium text-right max-w-md">
                {formData.description || "—"}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm font-semibold text-gray-600">
                Category:
              </span>
              <span className="text-sm text-gray-900 font-medium">
                {formData.categoryId || "—"}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm font-semibold text-gray-600">
                HSN Code:
              </span>
              <span className="text-sm text-gray-900 font-medium">
                {formData.hsnCode || "—"}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm font-semibold text-gray-600">
                Status:
              </span>
              <span
                className={`text-sm font-bold ${formData.isActive ? "text-green-600" : "text-gray-500"}`}
              >
                {formData.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Pricing
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-600">
                Base Price (MRP):
              </span>
              <span className="text-lg font-bold text-gray-900">
                ₹{formData.basePrice || "0.00"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-600">
                Selling Price:
              </span>
              <span className="text-lg font-bold text-blue-600">
                ₹{formData.sellingPrice || "0.00"}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between items-center pt-3 border-t-2 border-blue-200">
                <span className="text-sm font-semibold text-green-600">
                  Discount:
                </span>
                <div className="text-right">
                  <div className="text-xl font-bold text-green-600">
                    {discount}% OFF
                  </div>
                  <div className="text-xs text-green-700">
                    Save ₹
                    {(formData.basePrice - formData.sellingPrice).toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dimensions */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Maximize2 className="h-5 w-5 text-green-600" />
            Shipping Dimensions
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-white rounded-lg border border-green-200">
              <div className="text-xs text-gray-600 mb-1">Weight</div>
              <div className="text-lg font-bold text-gray-900">
                {formData.weight || "0"} kg
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-green-200">
              <div className="text-xs text-gray-600 mb-1">Length</div>
              <div className="text-lg font-bold text-gray-900">
                {formData.length || "0"} cm
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-green-200">
              <div className="text-xs text-gray-600 mb-1">Breadth</div>
              <div className="text-lg font-bold text-gray-900">
                {formData.breadth || "0"} cm
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-green-200">
              <div className="text-xs text-gray-600 mb-1">Height</div>
              <div className="text-lg font-bold text-gray-900">
                {formData.height || "0"} cm
              </div>
            </div>
          </div>
          <div className="bg-white border-2 border-green-300 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-green-900">
                Volumetric Weight:
              </span>
              <span className="text-2xl font-bold text-green-600">
                {calculateVolumetricWeight()} kg
              </span>
            </div>
          </div>
        </div>

        {/* Artisan Information */}
        {(formData.artisanName ||
          formData.artisanAbout ||
          formData.artisanLocation) && (
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-amber-600" />
              Artisan Information
            </h4>
            <div className="space-y-3">
              {formData.artisanName && (
                <div className="flex justify-between items-start">
                  <span className="text-sm font-semibold text-gray-600">
                    Name:
                  </span>
                  <span className="text-sm text-gray-900 font-medium text-right max-w-md">
                    {formData.artisanName}
                  </span>
                </div>
              )}
              {formData.artisanAbout && (
                <div className="flex justify-between items-start">
                  <span className="text-sm font-semibold text-gray-600">
                    About:
                  </span>
                  <span className="text-sm text-gray-900 font-medium text-right max-w-md">
                    {formData.artisanAbout}
                  </span>
                </div>
              )}
              {formData.artisanLocation && (
                <div className="flex justify-between items-start">
                  <span className="text-sm font-semibold text-gray-600">
                    Location:
                  </span>
                  <span className="text-sm text-gray-900 font-medium">
                    {formData.artisanLocation}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Specifications */}
        {formData.specifications && formData.specifications.length > 0 && (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5 text-indigo-600" />
              Specifications ({formData.specifications.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {formData.specifications.map((spec: any, index: number) => (
                <div
                  key={index}
                  className="bg-white p-3 rounded-lg border border-indigo-200"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">
                      {spec.key}:
                    </span>
                    <span className="text-sm text-gray-900 font-medium">
                      {spec.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Media */}
        {mediaPreviews.length > 0 && (
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-md">
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-blue-600" />
              Product Media ({mediaPreviews.length})
            </h4>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {mediaPreviews.map((item, index) => (
                <div
                  key={item.id}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                    item.isPrimary
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-gray-200"
                  }`}
                >
                  {item.type === "VIDEO" ? (
                    <video
                      src={item.preview}
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : (
                    <img
                      src={item.preview}
                      alt={`Media ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {item.isPrimary && (
                    <div className="absolute top-1 right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Star className="h-4 w-4 text-white fill-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stock/Variants Summary */}
        {productType === "simple" ? (
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-md">
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <WarehouseIcon className="h-5 w-5 text-blue-600" />
              Stock Information
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-600">
                  Warehouse:
                </span>
                <span className="text-sm text-gray-900 font-medium">
                  {formData.warehouseId || "—"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-600">
                  Stock Quantity:
                </span>
                <span className="text-lg font-bold text-green-600">
                  {formData.stockQuantity || 0} units
                </span>
              </div>
            </div>
          </div>
        ) : (
          formData.variants &&
          formData.variants.length > 0 && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Layers className="h-5 w-5 text-purple-600" />
                Variants Summary ({formData.variants.length})
              </h4>
              <div className="space-y-4">
                {formData.variants.map((variant: any, index: number) => {
                  const variantAttrs = variantAttributeFields[index] || [];
                  const hasCustomAttrs =
                    variantAttrs.length > 0 &&
                    variantAttrs.some((a) => a.key && a.value);
                  const hasMedia = variantMediaPreviews[index]?.length > 0;

                  return (
                    <div
                      key={index}
                      className="bg-white p-4 rounded-xl border-2 border-purple-200"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          #{index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {variant.size && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-semibold">
                                {variant.size}
                              </span>
                            )}
                            {variant.color && (
                              <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-md text-xs font-semibold">
                                {variant.color}
                              </span>
                            )}
                            {variant.fabric && (
                              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs font-semibold">
                                {variant.fabric}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-900">
                            ₹{variant.price || variant.sellingPrice || "0.00"}
                          </div>
                          <div className="text-xs text-gray-500">
                            Stock: {variant.stockQuantity || 0}
                          </div>
                        </div>
                      </div>

                      {/* Custom Attributes */}
                      {hasCustomAttrs && (
                        <div className="mb-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                          <div className="text-xs font-semibold text-indigo-900 mb-2">
                            Custom Attributes:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {variantAttrs
                              .filter((attr) => attr.key && attr.value)
                              .map((attr, attrIdx) => (
                                <span
                                  key={attrIdx}
                                  className="px-2 py-1 bg-white border border-indigo-300 rounded-md text-xs"
                                >
                                  <strong>{attr.key}:</strong> {attr.value}
                                </span>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Variant Features */}
                      <div className="flex flex-wrap gap-2">
                        {(variant.basePrice || variant.sellingPrice) && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Custom Pricing
                          </span>
                        )}
                        {(variant.weight ||
                          variant.length ||
                          variant.breadth ||
                          variant.height) && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-semibold flex items-center gap-1">
                            <Ruler className="h-3 w-3" />
                            Custom Dimensions
                          </span>
                        )}
                        {hasMedia && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-semibold flex items-center gap-1">
                            <ImageIcon className="h-3 w-3" />
                            {variantMediaPreviews[index].length} Media
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}

        {/* Final Confirmation */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-lg font-bold text-green-900 mb-2">
                Ready to Submit!
              </h4>
              <p className="text-sm text-green-800 mb-4">
                Please review all information above. Once submitted, your
                product will be{" "}
                {formData.isActive ? "immediately visible" : "saved as draft"}{" "}
                in your store.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>
                    Product Type:{" "}
                    <strong>
                      {productType === "simple" ? "Simple" : "Variable"}
                    </strong>
                  </span>
                </div>
                {mediaPreviews.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>
                      <strong>{mediaPreviews.length}</strong> Media Files
                    </span>
                  </div>
                )}
                {productType === "variable" && formData.variants && (
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>
                      <strong>{formData.variants.length}</strong> Variants
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Warning for Variants without Custom Attributes */}
        {productType === "variable" &&
          formData.variants &&
          formData.variants.length > 0 && (
            <>
              {formData.variants.some((_: any, idx: number) => {
                const attrs = variantAttributeFields[idx] || [];
                return (
                  attrs.length === 0 || !attrs.some((a) => a.key && a.value)
                );
              }) && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-900">
                      <p className="font-semibold mb-1">
                        Note about Custom Attributes
                      </p>
                      <p>
                        Some variants don't have custom attributes. They'll rely
                        on the legacy fields (size, color, fabric) for
                        identification.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
      </div>
    );
  }

  return null;
};

export default ProductFormSteps
