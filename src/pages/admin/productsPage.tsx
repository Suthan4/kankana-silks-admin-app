import React, { useEffect, useState } from "react";
import {
  useForm,
  useFieldArray,
  type SubmitHandler,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layouts/mainLayout";
import { usePermissions } from "@/hooks/usePermissions";

import {
  Plus,
  Edit,
  Trash2,
  X,
  Package,
  Search,
  Filter,
  Grid3x3,
  List,
  Eye,
  Upload,
  Image as ImageIcon,
  Tag,
  Layers,
  DollarSign,
  Box,
  AlertCircle,
  CheckCircle,
  Info,
  ChevronRight,
  Sparkles,
  TrendingUp,
  ShoppingCart,
  Palette,
  Ruler,
  Warehouse as WarehouseIcon,
  MapPin,
  User,
  FileText,
  Save,
  ChevronLeft,
  Loader2,
  ExternalLink,
  Star,
  Video,
  Play,
} from "lucide-react";
import { productApi } from "@/lib/api/product.api";
import { categoryApi } from "@/lib/api/category.api";
import { warehouseApi } from "@/lib/api/warehouse.api";
import {
  createProductSchema,
  type CreateProductFormData,
} from "@/lib/types/product/schema";
import type { Product, ProductMedia } from "@/lib/types/product/prodcut";
import type { Category } from "@/lib/types/category/category";
import ProductFormSteps from "@/components/productsFormSteps";
import { s3Api } from "@/lib/api/s3.api";
import { toast } from "react-hot-toast";
import { getColorSuggestions, isColorAttribute, isValidCSSColor, validateColorWithSuggestions } from "@/lib/utils/colorValidation";

interface MediaPreviewItem {
  file: File | null;
  preview: string;
  isPrimary: boolean;
  id: string;
  type: "IMAGE" | "VIDEO";
  thumbnailUrl?: string;
}
export type ProductMediaForm = {
  type: "IMAGE" | "VIDEO";
  url: string;
  order: number;
  isActive: boolean;
  altText?: string;
};

export type AttributeField = {
  key: string;
  value: string;
};

// Stats Card (unchanged)
const StatsCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  subtitle?: string;
  trend?: string;
}> = ({ icon, label, value, color, subtitle, trend }) => {
  const colorMap = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {trend}
            </p>
          )}
        </div>
        <div
          className={`h-12 w-12 rounded-full flex items-center justify-center ${
            colorMap[color as keyof typeof colorMap]
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

// Product Card
const ProductCard: React.FC<{
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onView: (product: Product) => void;
  canUpdate: boolean;
  canDelete: boolean;
}> = ({ product, onEdit, onDelete, onView, canUpdate, canDelete }) => {
  const primaryMedia =
    product.media?.find((m) => m.order === 0) || product.media?.[0];
  const isVideo = primaryMedia?.type === "VIDEO";

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-300 group">
      <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200">
        {primaryMedia ? (
          isVideo ? (
            <div className="relative w-full h-full">
              {primaryMedia.thumbnailUrl ? (
                <img
                  src={primaryMedia.thumbnailUrl}
                  alt={primaryMedia.altText || product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <Video className="h-20 w-20 text-gray-400" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                  <Play className="h-8 w-8 text-gray-800 ml-1" />
                </div>
              </div>
            </div>
          ) : (
            <img
              src={primaryMedia.url}
              alt={primaryMedia.altText || product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-20 w-20 text-gray-400" />
          </div>
        )}

        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {product.hasVariants && (
            <span className="px-2.5 py-1 bg-purple-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">
              <Layers className="h-3 w-3" />
              {product.variants?.length || 0}
            </span>
          )}
          <span
            className={`px-2.5 py-1 text-xs font-bold rounded-full shadow-lg ${
              product.isActive
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {product.isActive ? "LIVE" : "DRAFT"}
          </span>
        </div>

        {product.media && product.media.length > 1 && (
          <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black bg-opacity-70 text-white text-xs font-medium rounded-full flex items-center gap-1">
            <ImageIcon className="h-3 w-3" />
            {product.media.length}
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-1">
          {product.name}
        </h3>

        {product.category && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
            <Tag className="h-3.5 w-3.5" />
            <span>{product.category.name}</span>
          </div>
        )}

        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Price
            </p>
            <p className="text-2xl font-bold text-blue-600">
              ₹{product.sellingPrice.toLocaleString()}
            </p>
            {product.basePrice !== product.sellingPrice && (
              <p className="text-xs text-gray-400 line-through">
                ₹{product.basePrice.toLocaleString()}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide">SKU</p>
            <p className="text-sm font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
              {product.sku}
            </p>
          </div>
        </div>

        {product.hasVariants &&
          product.variants &&
          product.variants.length > 0 && (
            <div className="mb-3 p-2.5 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
              <p className="text-xs font-semibold text-purple-700 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                {product.variants.length} Variant
                {product.variants.length > 1 ? "s" : ""} Available
              </p>
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {product.variants.slice(0, 3).map((variant, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-white px-2 py-0.5 rounded border border-purple-200 text-purple-700"
                  >
                    {variant.size || variant.color || variant.fabric}
                  </span>
                ))}
                {product.variants.length > 3 && (
                  <span className="text-xs text-purple-600 font-medium">
                    +{product.variants.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onView(product)}
            className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          {canUpdate && (
            <button
              onClick={() => onEdit(product)}
              className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-1"
              title="Edit Product"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(product.id)}
              className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center gap-1"
              title="Delete Product"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Step Indicator (unchanged)
const StepIndicator: React.FC<{
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}> = ({ currentStep, totalSteps, stepLabels }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {stepLabels.map((label, index) => {
          const stepNum = index + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;

          return (
            <React.Fragment key={stepNum}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isActive
                        ? "bg-blue-600 text-white ring-4 ring-blue-100"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isCompleted ? <CheckCircle className="h-5 w-5" /> : stepNum}
                </div>
                <p
                  className={`text-xs mt-2 font-medium ${
                    isActive ? "text-blue-600" : "text-gray-500"
                  }`}
                >
                  {label}
                </p>
              </div>
              {stepNum < totalSteps && (
                <div
                  className={`flex-1 h-1 mx-2 rounded ${
                    isCompleted ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// View Product Modal Component
const ViewProductModal: React.FC<{
  product: Product;
  onClose: () => void;
  onEdit?: (product: Product) => void;
  canUpdate: boolean;
}> = ({ product, onClose, onEdit, canUpdate }) => {
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const selectedMedia = product.media?.[selectedMediaIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Product Details</h2>
              <p className="text-sm text-blue-100">{product.sku}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canUpdate && onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(product);
                }}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Media */}
            <div className="space-y-4">
              {/* Main Media Display */}
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                {selectedMedia ? (
                  selectedMedia.type === "VIDEO" ? (
                    <video
                      src={selectedMedia.url}
                      controls
                      className="w-full h-full object-cover"
                      poster={selectedMedia.thumbnailUrl}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img
                      src={selectedMedia.url}
                      alt={selectedMedia.altText || product.name}
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-24 w-24 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Media Gallery Thumbnails */}
              {product.media && product.media.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.media.map((mediaItem, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedMediaIndex(idx)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all relative ${
                        selectedMediaIndex === idx
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      {mediaItem.type === "VIDEO" ? (
                        <>
                          {mediaItem.thumbnailUrl ? (
                            <img
                              src={mediaItem.thumbnailUrl}
                              alt={mediaItem.altText || `Video ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                              <Video className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play className="h-6 w-6 text-white drop-shadow-lg" />
                          </div>
                        </>
                      ) : (
                        <img
                          src={mediaItem.url}
                          alt={mediaItem.altText || `Image ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Details */}
            <div className="space-y-6">
              {/* Product Status */}
              <div className="flex items-center gap-2 flex-wrap">
                {product.hasVariants && (
                  <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Layers className="h-4 w-4" />
                    Variable Product
                  </span>
                )}
                <span
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                    product.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {product.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Product Name */}
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h3>
                {product.category && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Tag className="h-4 w-4" />
                    <span>{product.category.name}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Description
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Pricing */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-baseline gap-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Selling Price</p>
                    <p className="text-4xl font-bold text-blue-600">
                      ₹{product.sellingPrice.toLocaleString()}
                    </p>
                  </div>
                  {product.basePrice !== product.sellingPrice && (
                    <div>
                      <p className="text-sm text-gray-500">Base Price</p>
                      <p className="text-xl text-gray-400 line-through">
                        ₹{product.basePrice.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
                {product.basePrice !== product.sellingPrice && (
                  <p className="text-sm text-green-600 font-medium mt-2">
                    Save ₹
                    {(
                      product.basePrice - product.sellingPrice
                    ).toLocaleString()}{" "}
                    (
                    {Math.round(
                      ((product.basePrice - product.sellingPrice) /
                        product.basePrice) *
                        100,
                    )}
                    % off)
                  </p>
                )}
              </div>

              {/* HSN Code */}
              {product.hsnCode && (
                <div>
                  <p className="text-sm text-gray-600">HSN Code</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {product.hsnCode}
                  </p>
                </div>
              )}

              {/* Artisan Information */}
              {(product.artisanName ||
                product.artisanAbout ||
                product.artisanLocation) && (
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="h-5 w-5 text-amber-600" />
                    Artisan Information
                  </h4>
                  {product.artisanName && (
                    <p className="font-medium text-gray-900 mb-1">
                      {product.artisanName}
                    </p>
                  )}
                  {product.artisanLocation && (
                    <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
                      <MapPin className="h-4 w-4" />
                      {product.artisanLocation}
                    </p>
                  )}
                  {product.artisanAbout && (
                    <p className="text-sm text-gray-700 italic">
                      {product.artisanAbout}
                    </p>
                  )}
                </div>
              )}

              {/* Specifications */}
              {product.specifications && product.specifications.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Tag className="h-5 w-5 text-blue-600" />
                    Specifications
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {product.specifications.map((spec, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                      >
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                          {spec.key}
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {spec.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Variants */}
              {product.hasVariants &&
                product.variants &&
                product.variants.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Layers className="h-5 w-5 text-purple-600" />
                      Available Variants ({product.variants.length})
                    </h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {product.variants.map((variant, idx) => {
                        const variantLabel =
                          [variant.size, variant.color, variant.fabric]
                            .filter(Boolean)
                            .join(" / ") || `Variant ${idx + 1}`;

                        const variantStock = product.stock?.find(
                          (s) => s.variantId === variant.id,
                        );

                        return (
                          <div
                            key={idx}
                            className="bg-purple-50 rounded-lg p-3 border border-purple-200"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-900">
                                {variantLabel}
                              </span>
                              <span className="text-purple-600 font-bold text-lg">
                                ₹{Number(variant.price || 0).toLocaleString()}
                              </span>
                            </div>
                            {variantStock && (
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>
                                  Stock:{" "}
                                  <strong className="text-gray-900">
                                    {variantStock.quantity}
                                  </strong>
                                </span>
                                {variantStock.warehouse && (
                                  <span className="flex items-center gap-1">
                                    <WarehouseIcon className="h-3 w-3" />
                                    {variantStock.warehouse.name}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Stock (for simple products) */}
              {!product.hasVariants &&
                product.stock &&
                product.stock.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Box className="h-5 w-5 text-green-600" />
                      Stock Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Quantity</p>
                        <p className="text-2xl font-bold text-green-600">
                          {product.stock[0].quantity}
                        </p>
                      </div>
                      {product.stock[0].warehouse && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            Warehouse
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {product.stock[0].warehouse.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {product.stock[0].warehouse.code}
                          </p>
                        </div>
                      )}
                    </div>
                    {product.stock[0].lowStockThreshold && (
                      <p className="text-sm text-gray-600 mt-3">
                        Low stock alert at {product.stock[0].lowStockThreshold}{" "}
                        units
                      </p>
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  // UI State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | undefined>(
    undefined,
  );
  const [filterHasVariants, setFilterHasVariants] = useState<
    boolean | undefined
  >(undefined);

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const [productType, setProductType] = useState<"simple" | "variable">(
    "simple",
  );
  const [mediaPreviews, setMediaPreviews] = useState<MediaPreviewItem[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [variantMediaPreviews, setVariantMediaPreviews] = useState<
    Record<number, MediaPreviewItem[]>
  >({});

  const [variantAttributeFields, setVariantAttributeFields] = useState<
    Record<number, AttributeField[]>
  >({});
  const [isHydratingEdit, setIsHydratingEdit] = useState(false);
  // Add this after variantAttributeFields state
  const [variantAttributeErrors, setVariantAttributeErrors] = useState<
    Record<number, Record<number, string>>
  >({});

  const appendVariantAttribute = (variantIndex: number) => {
    setVariantAttributeFields((prev) => {
      const updated = [...(prev?.[variantIndex] ?? []), { key: "", value: "" }];

      // ✅ update RHF too (still empty record)
      setValue(
        `variants.${variantIndex}.attributes` as any,
        {},
        {
          shouldDirty: true,
          shouldValidate: false,
        },
      );

      return { ...prev, [variantIndex]: updated };
    });
  };

  const removeVariantAttribute = (variantIndex: number, attrIndex: number) => {
    setVariantAttributeFields((prev) => {
      const updated = (prev?.[variantIndex] ?? []).filter(
        (_, i) => i !== attrIndex,
      );

      const record: Record<string, string> = {};
      updated.forEach((a) => {
        if (a.key?.trim() && a.value?.trim()) {
          record[a.key.trim()] = a.value.trim();
        }
      });

      setValue(`variants.${variantIndex}.attributes` as any, record, {
        shouldDirty: true,
        shouldValidate: false,
      });

      return { ...prev, [variantIndex]: updated };
    });
  };

  const updateVariantAttribute = (
    variantIndex: number,
    attrIndex: number,
    field: "key" | "value",
    value: string,
  ) => {
    setVariantAttributeFields((prev) => {
      const current = prev?.[variantIndex] ?? [];
      const updated = current.map((attr, i) =>
        i === attrIndex ? { ...attr, [field]: value } : attr,
      );

      // ✅ Validate color fields dynamically
      if (field === "value") {
        const currentAttr = updated[attrIndex];

        if (isColorAttribute(currentAttr.key) && value) {
          const validation = validateColorWithSuggestions(value);

          if (!validation.isValid) {
            setVariantAttributeErrors((prevErrors) => ({
              ...prevErrors,
              [variantIndex]: {
                ...(prevErrors[variantIndex] || {}),
                [attrIndex]:
                  validation.suggestions.length > 0
                    ? `Invalid color. Did you mean: ${validation.suggestions.slice(0, 3).join(", ")}?`
                    : "Please enter a valid CSS color name or hex code",
              },
            }));
          } else {
            // Clear error if valid
            setVariantAttributeErrors((prevErrors) => {
              const newErrors = { ...prevErrors };
              if (newErrors[variantIndex]) {
                delete newErrors[variantIndex][attrIndex];
                if (Object.keys(newErrors[variantIndex]).length === 0) {
                  delete newErrors[variantIndex];
                }
              }
              return newErrors;
            });
          }
        }
      }

      // ✅ convert array -> record (Zod expects record now)
      const record: Record<string, string> = {};
      updated.forEach((a) => {
        if (a.key?.trim() && a.value?.trim()) {
          record[a.key.trim()] = a.value.trim();
        }
      });

      // ✅ push into react-hook-form
      setValue(`variants.${variantIndex}.attributes` as any, record, {
        shouldDirty: true,
        shouldValidate: false,
      });

      return { ...prev, [variantIndex]: updated };
    });
  };

  const handleVariantMediaUpload = (
    variantIndex: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files) return;

    const items: MediaPreviewItem[] = Array.from(files).map((file) => {
      const isVideo = file.type.startsWith("video/");
      return {
        file,
        preview: URL.createObjectURL(file), // ✅ BEST PREVIEW
        isPrimary: false,
        id: `${Date.now()}-${variantIndex}-${crypto.randomUUID()}`,
        type: isVideo ? "VIDEO" : "IMAGE",
      };
    });

    setVariantMediaPreviews((prev) => {
      const existing = prev?.[variantIndex] ?? [];
      const merged = [...existing, ...items];

      // ✅ ensure first item is primary
      const fixed = merged.map((m, i) => ({
        ...m,
        isPrimary: i === 0,
      }));

      return { ...prev, [variantIndex]: fixed };
    });

    e.target.value = "";
  };

  const canCreate = hasPermission("products", "canCreate");
  const canUpdate = hasPermission("products", "canUpdate");
  const canDelete = hasPermission("products", "canDelete");

  // Queries
  const { data: productsData, isLoading } = useQuery({
    queryKey: [
      "products",
      searchQuery,
      filterCategory,
      filterActive,
      filterHasVariants,
    ],
    queryFn: async () => {
      const response = await productApi.getProducts({
        limit: 100,
        search: searchQuery || undefined,
        categoryId: filterCategory || undefined,
        isActive: filterActive,
        hasVariants: filterHasVariants,
      });
      return response.data;
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await categoryApi.getCategories({ limit: 100 });
      return response.data;
    },
  });

  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses-active"],
    queryFn: async () => {
      const response = await warehouseApi.getActiveWarehouses();
      return response.data;
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: productApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowCreateModal(false);
      setCurrentStep(1);
      reset();
      setMediaPreviews([]);
      setEditingProduct(null);
      toast.success("Product created successfully!");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create product");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      productApi.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowCreateModal(false);
      setCurrentStep(1);
      reset();
      setMediaPreviews([]);
      setEditingProduct(null);
      toast.success("Product updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update product");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: productApi.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete product");
    },
  });

  // Form
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateProductFormData>({
    resolver: zodResolver(
      createProductSchema,
    ) as Resolver<CreateProductFormData>,
    defaultValues: {
      specifications: [],
      media: [],
      variants: productType === "variable" ? [] : undefined,
      stock:
        productType === "simple" ? { warehouseId: "", quantity: 0 } : undefined,
    },
  });

  useEffect(() => {
    if (isHydratingEdit) return;

    if (productType === "variable") {
      setValue("stock", undefined, { shouldValidate: false });
    }

    if (productType === "simple") {
      setValue("variants", undefined, { shouldValidate: false });
    }
  }, [productType, setValue, isHydratingEdit]);

  const {
    fields: specFields,
    append: appendSpec,
    remove: removeSpec,
    replace: replaceSpecs,
  } = useFieldArray({ control, name: "specifications" });

  const {
    fields: mediaFields,
    append: appendMedia,
    remove: removeMedia,
    replace: replaceMedia,
  } = useFieldArray({ control, name: "media" });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
    replace: replaceVariants,
  } = useFieldArray({ control, name: "variants" });

  const { data: productDetailsData } = useQuery({
    queryKey: ["product-details", editingProduct?.id],
    queryFn: async () => {
      if (!editingProduct?.id) return null;
      const res = await productApi.getProduct(editingProduct.id);
      return res.data;
    },
    enabled: !!editingProduct?.id,
  });
  console.log("productDetailsData", productDetailsData);

  // Populate form when editing
  useEffect(() => {
    if (!productDetailsData) return;

    const fullProduct = productDetailsData;

    setIsHydratingEdit(true);

    const type: "simple" | "variable" = fullProduct.hasVariants
      ? "variable"
      : "simple";

    setProductType(type);

    reset({
      name: fullProduct.name ?? "",
      description: fullProduct.description ?? "",
      categoryId: fullProduct.categoryId ?? "",
      sku: fullProduct.sku ?? "",
      basePrice: Number(fullProduct.basePrice ?? 0),
      sellingPrice: Number(fullProduct.sellingPrice ?? 0),
      isActive: Boolean(fullProduct.isActive ?? true),

      hsnCode: fullProduct.hsnCode ?? "",
      artisanName: fullProduct.artisanName ?? "",
      artisanAbout: fullProduct.artisanAbout ?? "",
      artisanLocation: fullProduct.artisanLocation ?? "",

      weight: Number(fullProduct.weight ?? 0),
      length: Number(fullProduct.length ?? 0),
      breadth: Number(fullProduct.breadth ?? 0),
      height: Number(fullProduct.height ?? 0),

      specifications: [],
      media: [],
      variants: type === "variable" ? [] : undefined,

      stock:
        type === "simple"
          ? {
              warehouseId: fullProduct.stock?.[0]?.warehouseId ?? "",
              quantity: Number(fullProduct.stock?.[0]?.quantity ?? 0),
              lowStockThreshold:
                fullProduct.stock?.[0]?.lowStockThreshold ?? 10,
            }
          : undefined,
    });

    // ✅ specifications
    replaceSpecs(
      (fullProduct.specifications ?? []).map((s) => ({
        key: s.key ?? "",
        value: s.value ?? "",
      })),
    );

    // ✅ media (all)
    const sortedMedia = (fullProduct.media ?? [])
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    replaceMedia(
      sortedMedia.map((m, idx) => ({
        type: m.type,
        url: m.url,
        order: idx,
        isActive: true,
        altText: m.altText ?? "",
      })),
    );

    setMediaPreviews(
      sortedMedia.map((m, idx) => ({
        file: null,
        preview: m.url,
        isPrimary: (m.order ?? idx) === 0,
        id: `existing-product-${m.id ?? idx}`,
        type: m.type,
        thumbnailUrl: (m as any).thumbnailUrl,
      })),
    );

    // ✅ variants
    if (type === "variable") {
      replaceVariants(
        (fullProduct.variants ?? []).map((v) => {
          const variantStock = fullProduct.stock?.find(
            (s) => s.variantId === v.id,
          );

          return {
            attributes: v.attributes ?? undefined, // ✅ ADD THIS

            size: v.size ?? "",
            color: v.color ?? "",
            fabric: v.fabric ?? "",
            price: Number(v.price ?? 0),

            basePrice: Number(v.basePrice ?? 0),
            sellingPrice: Number(v.sellingPrice ?? 0),

            weight: Number(v.weight ?? 0),
            length: Number(v.length ?? 0),
            breadth: Number(v.breadth ?? 0),
            height: Number(v.height ?? 0),

            stock: {
              warehouseId: variantStock?.warehouseId ?? "",
              quantity: Number(variantStock?.quantity ?? 0),
              lowStockThreshold: variantStock?.lowStockThreshold ?? 10,
            },
          };
        }),
      );
      const nextAttrFields: Record<number, AttributeField[]> = {};

      (fullProduct.variants ?? []).forEach((v: any, idx: number) => {
        const attrs = v.attributes ?? {}; // record

        nextAttrFields[idx] = Object.entries(attrs).map(([key, value]) => ({
          key,
          value: String(value),
        }));

        // ✅ also push into RHF
        setValue(`variants.${idx}.attributes` as any, attrs);
      });

      setVariantAttributeFields(nextAttrFields);

      // ✅ variant media previews
      const nextVariantMedia: Record<number, MediaPreviewItem[]> = {};
      (fullProduct.variants ?? []).forEach((v: any, idx: number) => {
        const vMedia = Array.isArray(v.media) ? v.media : [];

        nextVariantMedia[idx] = vMedia
          .slice()
          .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
          .map((m: any, mi: number) => ({
            file: null,
            preview: m.url,
            isPrimary: (m.order ?? mi) === 0,
            id: `existing-variant-${v.id}-${m.id ?? mi}`,
            type: m.type,
            thumbnailUrl: m.thumbnailUrl,
          }));
      });

      setVariantMediaPreviews(nextVariantMedia);
    }

    setTimeout(() => setIsHydratingEdit(false), 0);
  }, [productDetailsData, reset, replaceSpecs, replaceMedia, replaceVariants]);

  // Media Upload Handler
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const items: MediaPreviewItem[] = Array.from(files).map((file) => {
      const isVideo = file.type.startsWith("video/");
      return {
        file,
        preview: URL.createObjectURL(file),
        isPrimary: false,
        id: `${Date.now()}-${crypto.randomUUID()}`,
        type: isVideo ? "VIDEO" : "IMAGE",
      };
    });

    setMediaPreviews((prev) => {
      const merged = [...prev, ...items];
      const fixed = merged.map((m, i) => ({
        ...m,
        isPrimary: i === 0,
      }));
      return fixed;
    });

    e.target.value = "";
  };

  // Upload media to S3 and get URLs
  const uploadProductMediaToS3 = async (): Promise<
    Array<{
      type: "IMAGE" | "VIDEO";
      url: string;
      altText?: string;
      order: number;
      isPrimary?: boolean;
    }>
  > => {
    const newMedia = mediaPreviews.filter((item) => item.file !== null);
    const existingMedia = mediaPreviews.filter((item) => item.file === null);

    // ✅ no new upload → return existing
    if (newMedia.length === 0) {
      return existingMedia.map((item, index) => ({
        type: item.type,
        url: item.preview,
        altText: "",
        order: index,
        isPrimary: item.isPrimary,
      }));
    }

    setIsUploadingMedia(true);
    const uploadToast = toast.loading("Uploading product media...");

    try {
      // ✅ keep same order as previews (drag order already arranged)
      // ✅ just ensure primary is first if needed
      const sorted = [...mediaPreviews].sort((a, b) => {
        if (a.isPrimary) return -1;
        if (b.isPrimary) return 1;
        return 0;
      });

      const newSorted = sorted.filter((x) => x.file !== null);
      const oldSorted = sorted.filter((x) => x.file === null);

      const files = newSorted.map((x) => x.file!);
      const response = await s3Api.uploadMultiple(files, "products");

      if (!response.success) throw new Error("Failed to upload product media");

      // ✅ map uploaded urls back
      const uploadedMapped = response.files.map((f: any, idx: number) => ({
        type: newSorted[idx].type,
        url: f.url,
        altText: "",
        order: oldSorted.length + idx,
        isPrimary: newSorted[idx].isPrimary,
      }));

      const existingMapped = oldSorted.map((m, idx) => ({
        type: m.type,
        url: m.preview,
        altText: "",
        order: idx,
        isPrimary: m.isPrimary,
      }));

      toast.success("Product media uploaded!", { id: uploadToast });
      return [...existingMapped, ...uploadedMapped];
    } catch (error: any) {
      console.error("Product media upload error:", error);
      toast.error(
        error?.response?.data?.message || "Failed to upload product media",
        {
          id: uploadToast,
        },
      );
      throw error;
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const uploadVariantMediaToS3 = async (): Promise<
    Record<
      number,
      Array<{
        type: "IMAGE" | "VIDEO";
        url: string;
        altText?: string;
        order: number;
        isPrimary?: boolean;
      }>
    >
  > => {
    const result: Record<number, any[]> = {};

    const variantEntries = Object.entries(variantMediaPreviews ?? {});

    // ✅ if no variant media at all => return empty (no issue)
    if (variantEntries.length === 0) return result;

    setIsUploadingMedia(true);
    const uploadToast = toast.loading("Uploading variant media...");

    try {
      for (const [variantIndexStr, previewList] of variantEntries) {
        const variantIndex = Number(variantIndexStr);
        const list = previewList ?? [];

        // ✅ keep primary first + keep order
        const sorted = [...list].sort((a, b) => {
          if (a.isPrimary) return -1;
          if (b.isPrimary) return 1;
          return 0;
        });

        const existing = sorted.filter((m) => !m.file);
        const newFiles = sorted.filter((m) => m.file);

        const existingMapped = existing.map((m, idx) => ({
          type: m.type,
          url: m.preview,
          altText: "",
          order: idx,
          isPrimary: m.isPrimary,
        }));

        // ✅ no new upload for this variant
        if (newFiles.length === 0) {
          result[variantIndex] = existingMapped;
          continue;
        }

        const files = newFiles.map((m) => m.file!);
        const response = await s3Api.uploadMultiple(files, "products/variants");

        if (!response.success)
          throw new Error("Failed to upload variant media");

        const uploadedMapped = response.files.map((f: any, idx: number) => ({
          type: newFiles[idx].type,
          url: f.url,
          altText: "",
          order: existingMapped.length + idx,
          isPrimary: newFiles[idx].isPrimary,
        }));

        result[variantIndex] = [...existingMapped, ...uploadedMapped];
      }

      toast.success("Variant media uploaded!", { id: uploadToast });
      return result;
    } catch (error: any) {
      console.error("Variant media upload error:", error);
      toast.error(
        error?.response?.data?.message || "Failed to upload variant media",
        {
          id: uploadToast,
        },
      );
      throw error;
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // Form Submit Handler
  const onSubmit: SubmitHandler<CreateProductFormData> = async (data) => {
    try {
      // ✅ 1) Upload Product Media
      const productMedia =
        mediaPreviews.length > 0 ? await uploadProductMediaToS3() : [];

      // ✅ 2) Upload Variant Media (only if exists)
      const hasAnyVariantMedia = Object.values(variantMediaPreviews ?? {}).some(
        (arr) => (arr ?? []).length > 0,
      );

      const variantMediaMap = hasAnyVariantMedia
        ? await uploadVariantMediaToS3()
        : {};

      const finalVariants = data.variants?.map((v, idx) => {
        const attrsArray = variantAttributeFields?.[idx] ?? [];
        const attributes = attrsArray.reduce<Record<string, string>>(
          (acc, item) => {
            if (item.key?.trim() && item.value?.trim()) {
              acc[item.key.trim()] = item.value.trim();
            }
            return acc;
          },
          {},
        );

        return {
          ...v,
          attributes:
            Object.keys(attributes).length > 0 ? attributes : undefined,
          // ✅ attach variant media only if available for this variant
          media:
            variantMediaMap?.[idx]?.length > 0
              ? variantMediaMap[idx].map((m: any, order: number) => ({
                  type: m.type,
                  url: m.url,
                  altText: `${data.name} - Variant ${idx + 1} - Media ${
                    order + 1
                  }`,
                  order,
                  isActive: true,
                }))
              : undefined,
        };
      });

      const productData = {
        ...data,
        variants: finalVariants,
        media: productMedia.map((item, index) => ({
          type: item.type,
          url: item.url,
          altText: item.altText || `${data.name} - Media ${index + 1}`,
          order: index,
          isActive: true,
        })),
      };

      if (editingProduct) {
        await updateMutation.mutateAsync({
          id: editingProduct.id,
          data: productData,
        });
      } else {
        await createMutation.mutateAsync(productData);
      }
    } catch (error) {
      console.error("Product submission error:", error);
    }
  };

  // Other Handlers
  const handleDelete = (id: string) => {
    if (window.confirm("Delete this product? This cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowCreateModal(true);
    setCurrentStep(1);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setCurrentStep(1);
    reset();
    setMediaPreviews([]);
    setEditingProduct(null);
  };

  // ✅ NEW: Step validation function
  const validateStep = async (step: number): Promise<boolean> => {
    const formValues = watch();

    switch (step) {
      case 1:
        if (!productType) {
          toast.error("Please select a product type");
          return false;
        }
        return true;

      case 2: {
        const basicErrors: string[] = [];

        if (!formValues.name?.trim())
          basicErrors.push("Product name is required");
        if (!formValues.description?.trim())
          basicErrors.push("Description is required");
        if (!formValues.categoryId) basicErrors.push("Category is required");
        if (!formValues.sku?.trim()) basicErrors.push("SKU is required");
        if (!formValues.basePrice || Number(formValues.basePrice) <= 0)
          basicErrors.push("Base price must be greater than 0");
        if (!formValues.sellingPrice || Number(formValues.sellingPrice) <= 0)
          basicErrors.push("Selling price must be greater than 0");

        if (Number(formValues.sellingPrice) > Number(formValues.basePrice)) {
          basicErrors.push("Selling price cannot be greater than base price");
        }

        const invalidSpecIndex = (formValues.specifications || []).findIndex(
          (s: any) => {
            const hasKey = !!s?.key?.trim();
            const hasValue = !!s?.value?.trim();
            return !hasKey || !hasValue;
          },
        );

        if (invalidSpecIndex !== -1) {
          toast.error(
            `Specification row ${invalidSpecIndex + 1}: Please fill both Title and Value (or remove the row)`,
          );
          return false;
        }

        if (basicErrors.length > 0) {
          toast.error(basicErrors[0]);
          return false;
        }

        return true;
      }

      case 3:
        if (mediaPreviews.length === 0) {
          toast.error("Please add at least one product image or video");
          return false;
        }
        return true;

      case 4: {
        if (productType === "variable") {
          if (productType === "variable") {
            if (!formValues.variants || formValues.variants.length === 0) {
              toast.error("Please add at least one variant");
              return false;
            }

            for (let i = 0; i < formValues.variants.length; i++) {
              const variant = formValues.variants[i];

              // ✅ standard attributes
              const hasStandardAttr =
                !!variant.size || !!variant.color || !!variant.fabric;

              // ✅ custom attributes (variant.attributes)
              const attrs = normalizeVariantAttributes(variant);

              const hasCustomAttr =
                attrs &&
                typeof attrs === "object" &&
                Object.entries(attrs).some(([k, v]) => {
                  return (
                    String(k).trim().length > 0 && String(v).trim().length > 0
                  );
                });

              const customLabel = attrs
                ? Object.entries(attrs)
                    .map(([k, v]) => `${k}:${v}`)
                    .join(" / ")
                : "";

              const variantLabel =
                [variant.size, variant.color, variant.fabric]
                  .filter(Boolean)
                  .join(" / ") ||
                customLabel ||
                `Variant ${i + 1}`;

              // ✅ main rule: either standard OR custom must exist
              if (!hasStandardAttr && !hasCustomAttr) {
                toast.error(
                  `${variantLabel}: Please provide at least one attribute (Size/Color/Fabric) OR add custom attributes`,
                );
                return false;
              }

              // ✅ price validation
              if (!variant.price || Number(variant.price) <= 0) {
                toast.error(`${variantLabel}: Price must be greater than 0`);
                return false;
              }

              // ✅ stock
              if (!variant.stock?.warehouseId) {
                toast.error(`${variantLabel}: Warehouse is required`);
                return false;
              }

              if (
                variant.stock?.quantity === undefined ||
                Number(variant.stock.quantity) < 0
              ) {
                toast.error(`${variantLabel}: Quantity must be 0 or greater`);
                return false;
              }

              // ✅ dimensions
              if (!variant.weight || Number(variant.weight) <= 0) {
                toast.error(`${variantLabel}: Weight must be greater than 0`);
                return false;
              }

              if (!variant.length || Number(variant.length) <= 0) {
                toast.error(`${variantLabel}: Length must be greater than 0`);
                return false;
              }

              if (!variant.breadth || Number(variant.breadth) <= 0) {
                toast.error(`${variantLabel}: Breadth must be greater than 0`);
                return false;
              }

              if (!variant.height || Number(variant.height) <= 0) {
                toast.error(`${variantLabel}: Height must be greater than 0`);
                return false;
              }
              
              // ✅ VALIDATE LEGACY COLOR FIELD
              if (variant.color && !isValidCSSColor(variant.color)) {
                const suggestions = getColorSuggestions(variant.color);
                const variantLabel =
                  [variant.size, variant.color, variant.fabric]
                    .filter(Boolean)
                    .join(" / ") || `Variant ${i + 1}`;

                const suggestionText =
                  suggestions.length > 0
                    ? ` Did you mean: ${suggestions.slice(0, 3).join(", ")}?`
                    : "";

                toast.error(
                  `${variantLabel}: "${variant.color}" is not a valid color in the Standard Attributes field.${suggestionText}`,
                );
                return false;
              }

              // Validate custom attributes - especially colors
              const variantAttrs = variantAttributeFields[i] || [];

              for (let j = 0; j < variantAttrs.length; j++) {
                const attr = variantAttrs[j];
                const variantLabel =
                  [variant.size, variant.color, variant.fabric]
                    .filter(Boolean)
                    .join(" / ") || `Variant ${i + 1}`;

                if (attr.key && attr.value) {
                  // Validate color attributes dynamically
                  if (isColorAttribute(attr.key)) {
                    if (!isValidCSSColor(attr.value)) {
                      const suggestions = getColorSuggestions(attr.value);
                      const suggestionText =
                        suggestions.length > 0
                          ? ` Did you mean: ${suggestions.slice(0, 3).join(", ")}?`
                          : "";

                      toast.error(
                        `${variantLabel}: "${attr.value}" is not a valid color.${suggestionText}`,
                      );
                      return false;
                    }
                  }
                }
              }
            }
          }
        } else {
          // ✅ simple product
          if (!formValues.stock?.warehouseId) {
            toast.error("Please select a warehouse");
            return false;
          }

          if (
            formValues.stock?.quantity === undefined ||
            Number(formValues.stock.quantity) < 0
          ) {
            toast.error("Quantity must be 0 or greater");
            return false;
          }
        }

        return true;
      }

      default:
        return true;
    }
  };

  // ✅ UPDATED: Next step with validation
  const nextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (!isValid) return;

    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  // Stats
  const totalProducts = productsData?.products?.length || 0;
  const activeProducts =
    productsData?.products?.filter((p) => p.isActive).length || 0;
  const productsWithVariants =
    productsData?.products?.filter((p) => p.hasVariants).length || 0;

  const filteredProducts = productsData?.products || [];

  const stepLabels = [
    "Type",
    "Basic Info",
    "Media",
    productType === "variable" ? "Variants" : "Stock",
    "Review",
  ];
  console.log("errors", errors);
  console.log("variants", watch("variants"));

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <Package className="h-7 w-7 text-white" />
              </div>
              Products
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              Manage your complete product catalog
            </p>
          </div>

          {canCreate && (
            <button
              onClick={() => {
                reset();
                setCurrentStep(1);
                setProductType("simple");
                setMediaPreviews([]);
                setEditingProduct(null);
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl font-medium"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Create Product</span>
              <span className="sm:hidden">Create</span>
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={<Package className="h-6 w-6" />}
            label="Total Products"
            value={totalProducts}
            color="blue"
            subtitle="In catalog"
            trend="+12% this month"
          />
          <StatsCard
            icon={<CheckCircle className="h-6 w-6" />}
            label="Active"
            value={activeProducts}
            color="green"
            subtitle="Live on store"
          />
          <StatsCard
            icon={<Layers className="h-6 w-6" />}
            label="With Variants"
            value={productsWithVariants}
            color="purple"
            subtitle="Variable products"
          />
          <StatsCard
            icon={<ShoppingCart className="h-6 w-6" />}
            label="Orders"
            value="1,234"
            color="orange"
            subtitle="This month"
            trend="+8%"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name, SKU, or description..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All Categories</option>
              {categoriesData?.categories?.map((cat: Category) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <select
              value={
                filterActive === undefined
                  ? "all"
                  : filterActive
                    ? "active"
                    : "inactive"
              }
              onChange={(e) => {
                const value = e.target.value;
                setFilterActive(
                  value === "all" ? undefined : value === "active",
                );
              }}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            <select
              value={
                filterHasVariants === undefined
                  ? "all"
                  : filterHasVariants
                    ? "variable"
                    : "simple"
              }
              onChange={(e) => {
                const value = e.target.value;
                setFilterHasVariants(
                  value === "all" ? undefined : value === "variable",
                );
              }}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Types</option>
              <option value="simple">Simple</option>
              <option value="variable">Variable</option>
            </select>

            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "table"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Products Display */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-10 w-10 text-blue-600" />
            </div>
            <p className="text-gray-700 text-lg font-semibold">
              No products found
            </p>
            <p className="text-gray-500 text-sm mt-2">
              {searchQuery || filterCategory
                ? "Try adjusting your filters"
                : "Get started by creating your first product"}
            </p>
            {canCreate && !searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Create First Product
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                canUpdate={canUpdate}
                canDelete={canDelete}
              />
            ))}
          </div>
        )}

        {/* Create/Edit Product Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
              {/* Header */}
              <div className="sticky top-0">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-6 w-6" />
                    <div>
                      <h2 className="text-xl font-bold">
                        {editingProduct ? "Edit Product" : "Create New Product"}
                      </h2>
                      <p className="text-sm text-blue-100">
                        Step {currentStep} of 5
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                    disabled={
                      isUploadingMedia ||
                      createMutation.isPending ||
                      updateMutation.isPending
                    }
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="p-6">
                  <StepIndicator
                    currentStep={currentStep}
                    totalSteps={5}
                    stepLabels={stepLabels}
                  />
                </div>
              </div>

              {/* Form Content */}
              <div className="p-6 h-[60vh] overflow-y-auto">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <ProductFormSteps
                    currentStep={currentStep}
                    productType={productType}
                    setProductType={setProductType}
                    register={register}
                    errors={errors}
                    categories={categoriesData}
                    warehouses={warehousesData}
                    specFields={specFields}
                    appendSpec={appendSpec}
                    removeSpec={removeSpec}
                    mediaFields={mediaFields}
                    appendMedia={appendMedia}
                    removeMedia={removeMedia}
                    variantFields={variantFields}
                    appendVariant={appendVariant}
                    removeVariant={removeVariant}
                    mediaPreviews={mediaPreviews}
                    setMediaPreviews={setMediaPreviews}
                    handleMediaUpload={handleMediaUpload}
                    watch={watch}
                    setValue={setValue}
                    // ✅ NEW PROPS FIX
                    variantMediaPreviews={variantMediaPreviews}
                    setVariantMediaPreviews={setVariantMediaPreviews}
                    handleVariantMediaUpload={handleVariantMediaUpload}
                    variantAttributeFields={variantAttributeFields}
                    variantAttributeErrors={variantAttributeErrors}
                    appendVariantAttribute={appendVariantAttribute}
                    removeVariantAttribute={removeVariantAttribute}
                    updateVariantAttribute={updateVariantAttribute}
                  />

                  {/* Navigation Buttons */}
                  <div className="sticky bottom-0 flex justify-between pt-6 bg-gradient-to-t from-white via-white to-transparent pb-4">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={prevStep}
                        disabled={
                          isUploadingMedia ||
                          createMutation.isPending ||
                          updateMutation.isPending
                        }
                        className="px-4 py-2.5 bg-gray-50 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </button>
                    )}
                    {currentStep < 5 ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        disabled={
                          isUploadingMedia ||
                          createMutation.isPending ||
                          updateMutation.isPending
                        }
                        className="ml-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={
                          isUploadingMedia ||
                          createMutation.isPending ||
                          updateMutation.isPending
                        }
                        className="ml-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploadingMedia ||
                        createMutation.isPending ||
                        updateMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {isUploadingMedia
                              ? "Uploading Media..."
                              : editingProduct
                                ? "Updating..."
                                : "Creating..."}
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            {editingProduct
                              ? "Update Product"
                              : "Create Product"}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* View Product Modal */}
        {showViewModal && selectedProduct && (
          <ViewProductModal
            product={selectedProduct}
            onClose={() => {
              setShowViewModal(false);
              setSelectedProduct(null);
            }}
            onEdit={handleEdit}
            canUpdate={canUpdate}
          />
        )}

        {!canCreate && !canUpdate && !canDelete && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              You have read-only access. Contact your administrator for
              permissions.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ProductsPage;
const normalizeVariantAttributes = (variant: any) => {
  // if already proper record -> return
  if (
    variant?.attributes &&
    typeof variant.attributes === "object" &&
    !Array.isArray(variant.attributes)
  ) {
    return variant.attributes;
  }

  // if UI uses customAttributes array [{key,value}]
  const arr =
    variant?.customAttributes ??
    variant?.dynamicAttributes ??
    variant?.attributeFields ??
    [];

  if (!Array.isArray(arr)) return undefined;

  const record: Record<string, string> = {};

  for (const row of arr) {
    const k = String(row?.key ?? row?.attribute ?? "").trim();
    const v = String(row?.value ?? "").trim();
    if (k && v) record[k] = v;
  }

  return Object.keys(record).length > 0 ? record : undefined;
};
