import React, { useEffect, useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  FileText,
  Layers,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Undo2,
  User,
} from "lucide-react";
import toast from "react-hot-toast";

import type { Category } from "@/lib/types/category/category";
import type {
  CreateProductData,
  Product,
  ProductFormValues,
  Warehouse,
} from "@/lib/types/product";
import { ProductFormSchema } from "@/lib/types/product/schema";
import { useFormGuard } from "@/lib/hooks/useFormGuard";
import {
  useCreateProductMutation,
  useProductQuery,
  useUpdateProductMutation,
} from "@/lib/hooks/useProductMutations";
import { uploadFileToS3 } from "@/services/mediaUploadService";
import { BasicProductInfoCard } from "./BasicProductInfoCard";
import { GlobalMediaUploader } from "./GlobalMediaUploader";
import { VariantMatrixBuilder } from "./VariantMatrixBuilder";
import { ProductSidebarControls } from "./ProductSidebarControls";
import { UnsavedChangesModal } from "./UnsavedChangesModal";
import { FormActionBar } from "./FormActionBar";

export interface ProductFormLayoutProps {
  productId?: string;
  initialProduct?: Product | null;
  categories: Category[];
  warehouses: Warehouse[];
  onClose?: () => void;
  onSuccess?: () => void;
}

/**
 * Full-Page 2-Column Side-by-Side Product Management Dashboard Layout (Shopify / Stripe Style):
 * - Left Column (2/3 width): General Info, Media (when simple), Variants Matrix (when variable), Specifications
 * - Right Column (1/3 width): Status/Visibility, Category & SKU, Pricing & Stock, Shipping, SEO Preview
 * - Shopify-style Sticky Form Action Bar & Navigation Guards
 */
// Check if a variant is a real user-defined variant (not a backend DB placeholder like { default: true })
function isRealVariant(v: any): boolean {
  if (!v) return false;
  const attrs = v.attributes;
  if (attrs && typeof attrs === "object") {
    const keys = Object.keys(attrs);
    const hasRealAttrs = keys.some(
      (k) => k.toLowerCase() !== "default" && k.toLowerCase() !== "isdefault",
    );
    if (hasRealAttrs) return true;
  }
  if (
    (v.size && v.size.toLowerCase() !== "default") ||
    (v.color && v.color.toLowerCase() !== "default") ||
    (v.fabric && v.fabric.toLowerCase() !== "default")
  ) {
    return true;
  }
  return false;
}

// Helper to extract real variant options from loaded variants
function extractOptionsFromVariants(
  variantsList: any[],
): { name: string; values: string[] }[] {
  const optionsMap = new Map<string, Set<string>>();

  variantsList.forEach((v) => {
    if (v.attributes && typeof v.attributes === "object") {
      Object.entries(v.attributes).forEach(([key, val]) => {
        const cleanKey = key?.trim();
        if (
          cleanKey &&
          cleanKey.toLowerCase() !== "default" &&
          cleanKey.toLowerCase() !== "isdefault" &&
          val !== undefined &&
          val !== null &&
          val !== "" &&
          val !== true &&
          val !== false
        ) {
          if (!optionsMap.has(cleanKey)) optionsMap.set(cleanKey, new Set());
          optionsMap.get(cleanKey)!.add(String(val));
        }
      });
    }
    if (v.size && v.size.toLowerCase() !== "default") {
      if (!optionsMap.has("Size")) optionsMap.set("Size", new Set());
      optionsMap.get("Size")!.add(String(v.size));
    }
    if (v.color && v.color.toLowerCase() !== "default") {
      if (!optionsMap.has("Color")) optionsMap.set("Color", new Set());
      optionsMap.get("Color")!.add(String(v.color));
    }
    if (v.fabric && v.fabric.toLowerCase() !== "default") {
      if (!optionsMap.has("Fabric")) optionsMap.set("Fabric", new Set());
      optionsMap.get("Fabric")!.add(String(v.fabric));
    }
  });

  return Array.from(optionsMap.entries()).map(([name, valuesSet]) => ({
    name,
    values: Array.from(valuesSet),
  }));
}

export const ProductFormLayout: React.FC<ProductFormLayoutProps> = ({
  productId,
  initialProduct,
  categories,
  warehouses,
  onClose,
  onSuccess,
}) => {
  const isEditMode = Boolean(productId || initialProduct?.id);
  const activeProductId = productId || initialProduct?.id;

  // 1. Form state setup with Zod resolver
  const methods = useForm<ProductFormValues>({
    resolver: zodResolver(ProductFormSchema) as any,
    defaultValues: {
      hasVariants: false,
      name: "",
      description: "",
      categoryId: "",
      sku: "",
      isActive: true,
      hsnCode: "",
      artisanName: "",
      artisanAbout: "",
      artisanLocation: "",
      weight: 0.5,
      length: 10,
      breadth: 10,
      height: 5,
      basePrice: undefined,
      sellingPrice: undefined,
      stock: {
        warehouseId: warehouses[0]?.id || "",
        quantity: 10,
        lowStockThreshold: 5,
      },
      options: [],
      variants: [],
      specifications: [],
      media: [],
      allowOutOfStockOrders: true,
      hasVideoConsultation: true,
      videoPurchasingEnabled: true,
      videoConsultationNote: "",
      metaTitle: "",
      metaDesc: "",
    },
    mode: "onBlur",
  });

  const {
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    setError,
    formState: { isDirty },
  } = methods;

  const hasVariants = watch("hasVariants");
  const formValues = watch();

  // Specifications field array
  const {
    fields: specFields,
    append: appendSpec,
    remove: removeSpec,
    replace: replaceSpecs,
  } = useFieldArray({
    control,
    name: "specifications",
  });

  // 2. Navigation Guard
  const {
    isBlocked,
    confirmLeave,
    cancelLeave,
    guardedAction,
    guardedNavigate,
  } = useFormGuard(isDirty);

  // 3. TanStack Query integration
  const { data: fetchedProductData, isLoading: isLoadingProduct } =
    useProductQuery(activeProductId, !initialProduct && !!activeProductId);

  const productData = initialProduct || fetchedProductData;

  const createMutation = useCreateProductMutation(setError);
  const updateMutation = useUpdateProductMutation(setError);

  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isProcessing = isSaving || isUploadingMedia;

  // Prefill Form in Edit Mode
  useEffect(() => {
    if (!productData) return;

    const prod = productData;
    const variantsList = prod.variants || [];
    // Dynamic toggle condition: only true if prod.hasVariants is true AND product has real user-defined variants
    const realVariants = variantsList.filter(isRealVariant);
    const hasExistingVariants =
      Boolean(prod.hasVariants) && realVariants.length > 0;
    // Dynamically extract real options from real variants without dummy mock data
    const extractedOptions = hasExistingVariants
      ? extractOptionsFromVariants(realVariants)
      : [];

    reset({
      hasVariants: hasExistingVariants,
      name: prod.name || "",
      description: prod.description || "",
      categoryId: prod.categoryId || "",
      sku: prod.sku || "",
      isActive: prod.isActive ?? true,
      hsnCode: prod.hsnCode || "",
      artisanName: prod.artisanName || "",
      artisanAbout: prod.artisanAbout || "",
      artisanLocation: prod.artisanLocation || "",
      weight: Number(prod.weight || 0.5),
      length: Number(prod.length || 10),
      breadth: Number(prod.breadth || 10),
      height: Number(prod.height || 5),
      basePrice: Number(prod.basePrice || 0),
      sellingPrice: Number(prod.sellingPrice || 0),
      stock: {
        warehouseId: prod.stock?.[0]?.warehouseId || warehouses[0]?.id || "",
        quantity: Number(prod.stock?.[0]?.quantity || 0),
        lowStockThreshold: Number(prod.stock?.[0]?.lowStockThreshold || 5),
      },
      options: extractedOptions,
      variants: hasExistingVariants
        ? realVariants.map((v, vIdx) => {
            const vStock = prod.stock?.find((s) => s.variantId === v.id);

            // Extract and normalize real attributes (merging dynamic attributes, color, size, fabric)
            const mergedAttributes: Record<string, string> = {};
            if (v.attributes && typeof v.attributes === "object") {
              Object.entries(v.attributes).forEach(([key, val]) => {
                const cleanKey = key?.trim();
                if (
                  cleanKey &&
                  cleanKey.toLowerCase() !== "default" &&
                  cleanKey.toLowerCase() !== "isdefault" &&
                  val !== undefined &&
                  val !== null &&
                  val !== "" &&
                  val !== true &&
                  val !== false &&
                  String(val).toLowerCase() !== "default"
                ) {
                  mergedAttributes[cleanKey] = String(val);
                }
              });
            }
            if (
              v.color &&
              v.color.toLowerCase() !== "default" &&
              !mergedAttributes["Color"] &&
              !mergedAttributes["color"]
            ) {
              mergedAttributes["Color"] = v.color;
            }
            if (
              v.size &&
              v.size.toLowerCase() !== "default" &&
              !mergedAttributes["Size"] &&
              !mergedAttributes["size"]
            ) {
              mergedAttributes["Size"] = v.size;
            }
            if (
              v.fabric &&
              v.fabric.toLowerCase() !== "default" &&
              !mergedAttributes["Fabric"] &&
              !mergedAttributes["fabric"]
            ) {
              mergedAttributes["Fabric"] = v.fabric;
            }

            // Determine default variant:
            const hasExplicitDefault = realVariants.some(
              (rv) =>
                rv.isDefault ||
                rv.attributes?.isDefault ||
                (prod.defaultVariantId && rv.id === prod.defaultVariantId),
            );
            const isDefault = Boolean(
              v.isDefault ||
              v.attributes?.isDefault === true ||
              (prod.defaultVariantId && v.id === prod.defaultVariantId) ||
              (!hasExplicitDefault && vIdx === 0),
            );

            return {
              id: v.id,
              variantId: v.id,
              sku: v.sku || "",
              isDefault,
              attributes: mergedAttributes,
              size:
                v.size || mergedAttributes["Size"] || mergedAttributes["size"],
              color:
                v.color ||
                mergedAttributes["Color"] ||
                mergedAttributes["color"],
              fabric:
                v.fabric ||
                mergedAttributes["Fabric"] ||
                mergedAttributes["fabric"],
              basePrice: Number(v.basePrice || prod.basePrice || 0),
              sellingPrice: Number(v.sellingPrice || prod.sellingPrice || 0),
              price: Number(v.price || prod.sellingPrice || 0),
              weight: Number(v.weight || prod.weight || 0.5),
              length: Number(v.length || prod.length || 10),
              breadth: Number(v.breadth || prod.breadth || 10),
              height: Number(v.height || prod.height || 5),
              media: (v.media || []).map((m: any, mIdx: number) => ({
                id: m.id || crypto.randomUUID(),
                url: m.url,
                preview: m.url || m.thumbnailUrl,
                type: m.type || "IMAGE",
                order: m.order ?? mIdx,
                isActive: m.isActive ?? true,
                isPrimary: m.order === 0 || mIdx === 0,
                altText: m.altText || "",
              })),
              stock: {
                warehouseId: vStock?.warehouseId || warehouses[0]?.id || "",
                quantity: Number(vStock?.quantity || 0),
                lowStockThreshold: Number(vStock?.lowStockThreshold || 5),
              },
            };
          })
        : [],
      specifications: (prod.specifications || []).map((s) => ({
        key: s.key,
        value: s.value,
      })),
      media: (prod.media || []).map((m: any, idx: number) => ({
        id: m.id || crypto.randomUUID(),
        url: m.url,
        preview: m.url || m.thumbnailUrl,
        type: m.type || "IMAGE",
        order: m.order ?? idx,
        isActive: m.isActive ?? true,
        isPrimary: m.order === 0 || idx === 0,
        altText: m.altText || "",
      })),
      allowOutOfStockOrders: prod.allowOutOfStockOrders ?? true,
      hasVideoConsultation: prod.hasVideoConsultation ?? true,
      videoPurchasingEnabled: prod.videoPurchasingEnabled ?? true,
      videoConsultationNote: prod.videoConsultationNote || "",
      metaTitle: prod.metaTitle || "",
      metaDesc: prod.metaDesc || "",
    });

    if (prod.specifications) {
      replaceSpecs(
        prod.specifications.map((s) => ({ key: s.key, value: s.value })),
      );
    }
  }, [productData, reset, replaceSpecs, warehouses]);

  // Form Submit Handler with deferred media upload on Publish
  const onSubmit = async (data: ProductFormValues) => {
    setIsUploadingMedia(true);
    let uploadToastId: string | undefined;

    try {
      // 1. Upload pending simple product photos if any
      let finalGlobalMedia = data.media || [];
      const pendingGlobalFiles = (data.media || []).filter((m: any) => m.file);

      if (pendingGlobalFiles.length > 0) {
        uploadToastId = toast.loading(
          `Uploading ${pendingGlobalFiles.length} product photo(s)...`,
        );
      }

      if (data.media && data.media.length > 0) {
        finalGlobalMedia = await Promise.all(
          data.media.map(async (m: any, idx: number) => {
            if (m.file) {
              const publicUrl = await uploadFileToS3(m.file, "products");
              return {
                type: m.type || "IMAGE",
                url: publicUrl,
                order: m.order ?? idx,
                altText: m.altText || data.name,
                isActive: true,
              };
            }
            return {
              type: m.type || "IMAGE",
              url: m.url,
              order: m.order ?? idx,
              altText: m.altText,
              isActive: true,
            };
          }),
        );
      }

      // 2. Upload pending variant photos if any
      let finalVariants = data.variants || [];
      if (data.hasVariants && data.variants && data.variants.length > 0) {
        const totalPendingVariantFiles = data.variants.reduce(
          (acc, v: any) =>
            acc + (v.media || []).filter((m: any) => m.file).length,
          0,
        );

        if (totalPendingVariantFiles > 0 && !uploadToastId) {
          uploadToastId = toast.loading(
            `Uploading ${totalPendingVariantFiles} variant photo(s)...`,
          );
        }

        finalVariants = await Promise.all(
          data.variants.map(async (v: any) => {
            const vMedia = v.media || [];
            const uploadedVMedia = await Promise.all(
              vMedia.map(async (m: any, mOrder: number) => {
                if (m.file) {
                  const publicUrl = await uploadFileToS3(
                    m.file,
                    "products/variants",
                  );
                  return {
                    type: m.type || "IMAGE",
                    url: publicUrl,
                    order: m.order ?? mOrder,
                    altText: m.altText || `${v.sku || data.name} photo`,
                    isActive: true,
                  };
                }
                return {
                  type: m.type || "IMAGE",
                  url: m.url,
                  order: m.order ?? mOrder,
                  altText: m.altText,
                  isActive: true,
                };
              }),
            );
            return {
              ...v,
              media: uploadedVMedia,
            };
          }),
        );
      }

      if (uploadToastId) {
        toast.success("Photos uploaded successfully!", { id: uploadToastId });
      }

      // 3. Build the final payload with verified permanent S3 URLs
      const payload: CreateProductData = {
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        basePrice: data.basePrice || data.variants?.[0]?.basePrice || 100,
        sellingPrice:
          data.sellingPrice || data.variants?.[0]?.sellingPrice || 100,
        sku: data.sku || undefined,
        isActive: data.isActive,
        hsnCode: data.hsnCode || undefined,
        artisanName: data.artisanName || undefined,
        artisanAbout: data.artisanAbout || undefined,
        artisanLocation: data.artisanLocation || undefined,
        weight: Number(data.weight),
        length: Number(data.length),
        breadth: Number(data.breadth),
        height: Number(data.height),
        metaTitle: data.metaTitle || undefined,
        metaDesc: data.metaDesc || undefined,
        allowOutOfStockOrders: data.allowOutOfStockOrders,
        hasVideoConsultation: data.hasVideoConsultation,
        videoPurchasingEnabled: data.videoPurchasingEnabled,
        videoConsultationNote: data.videoConsultationNote || undefined,
        specifications: data.specifications?.filter((s) => s.key && s.value),
        media: finalGlobalMedia.map((m, idx) => ({
          type: m.type,
          url: m.url,
          order: m.order ?? idx,
          altText: m.altText,
        })),
      };

      if (!data.hasVariants) {
        payload.stock = {
          warehouseId: data.stock?.warehouseId || warehouses[0]?.id || "",
          quantity: Number(data.stock?.quantity || 0),
          lowStockThreshold: Number(data.stock?.lowStockThreshold || 5),
        };
      } else {
        const defaultVar =
          finalVariants.find((v: any) => v.isDefault) || finalVariants[0];
        if (defaultVar) {
          payload.defaultVariantId = defaultVar.id || defaultVar.variantId;
          payload.defaultVariantSku = defaultVar.sku;
        }

        payload.variants = finalVariants.map((v) => {
          const isThisDefault = Boolean(v.isDefault);
          return {
            id: v.id,
            variantId: v.variantId || v.id,
            sku: v.sku,
            isDefault: isThisDefault,
            attributes: {
              ...v.attributes,
              ...(isThisDefault ? { isDefault: true } : {}),
            },
            size: v.size || v.attributes?.["Size"] || v.attributes?.["size"],
            color:
              v.color || v.attributes?.["Color"] || v.attributes?.["color"],
            fabric:
              v.fabric || v.attributes?.["Fabric"] || v.attributes?.["fabric"],
            basePrice: v.basePrice,
            sellingPrice: v.sellingPrice,
            price: v.price || v.sellingPrice || 100,
            weight: v.weight,
            length: v.length,
            breadth: v.breadth,
            height: v.height,
            media: v.media?.map((m: any, order: number) => ({
              type: m.type,
              url: m.url,
              order: m.order ?? order,
              altText: m.altText,
            })),
            stock: {
              warehouseId: v.stock?.warehouseId || warehouses[0]?.id || "",
              quantity: Number(v.stock?.quantity || 0),
              lowStockThreshold: Number(v.stock?.lowStockThreshold || 5),
            },
          };
        });
      }

      if (isEditMode && activeProductId) {
        await updateMutation.mutateAsync({
          id: activeProductId,
          data: payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }

      reset(data); // Clear dirty state
      onSuccess?.();
    } catch (err: any) {
      if (uploadToastId) {
        toast.error(err?.message || "Failed to upload photos", {
          id: uploadToastId,
        });
      }
      console.error("Submission failed:", err);
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleDiscard = () => {
    reset();
    toast.success("Changes discarded");
  };

  const handleBack = () => {
    if (onClose) {
      guardedAction(onClose);
    } else {
      guardedNavigate("/admin/products");
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm font-semibold text-slate-600">
          Loading product configuration...
        </p>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="w-full pb-32">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="p-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 transition-colors shadow-2xs"
              title="Go back to products"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {isEditMode
                  ? formValues.name || "Edit Product"
                  : "Add New Product"}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEditMode
                  ? "Update product details, variant matrix, photos, and inventory"
                  : "Fill in product specifications, generate variants, and publish to catalog"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={!isDirty || isProcessing}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs inline-flex items-center gap-1.5"
            >
              <Undo2 className="h-4 w-4" />
              Discard
            </button>
            <button
              type="button"
              onClick={handleSubmit((data) =>
                onSubmit(data as ProductFormValues),
              )}
              disabled={isProcessing}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isUploadingMedia ? "Uploading..." : "Saving..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEditMode ? "Save Product" : "Publish Product"}
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
          {/* ========================================================= */}
          {/* LEFT COLUMN (2/3 width - Main Content)                     */}
          {/* ========================================================= */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. General Product Details: Title & Description */}
            <BasicProductInfoCard />

            {/* 2. Product Photos & Media (Always visible for main product photography) */}
            <GlobalMediaUploader />

            {/* 3. Variants Section Card with Inline Toggle */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-600 text-white rounded-lg mt-0.5">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Product Variants
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
                      Does this product come in multiple options like color,
                      size, or fabric? Toggle on to manage customized SKUs,
                      prices, and variant-specific photos.
                    </p>
                  </div>
                </div>

                {/* Inline Toggle Switch */}
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
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* When Variants ON: Render VariantMatrixBuilder with Variant-Level Media */}
              {hasVariants ? (
                <VariantMatrixBuilder
                  warehouses={warehouses}
                  productId={activeProductId}
                  isEditMode={isEditMode}
                />
              ) : (
                <div className="py-2 text-xs text-slate-500 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-slate-400" />
                  <span>
                    Simple product mode is active. Retail pricing and inventory
                    stock are managed in the sidebar on the right.
                  </span>
                </div>
              )}
            </div>

            {/* 4. Product Specifications & Artisan Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Product Specifications
                    </h3>
                    <p className="text-xs text-slate-500">
                      Detailed craft and weave specifications displayed to
                      customers
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => appendSpec({ key: "", value: "" })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold rounded-lg transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Specification
                </button>
              </div>

              {specFields.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center italic">
                  No specifications added yet (e.g. Zari Type: Pure Gold Tested
                  Zari, Loom: Traditional Handloom).
                </p>
              ) : (
                <div className="space-y-3">
                  {specFields.map((field, idx) => (
                    <div key={field.id} className="flex items-center gap-3">
                      <input
                        type="text"
                        {...methods.register(`specifications.${idx}.key`)}
                        placeholder="Specification Name (e.g. Zari Type)"
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                      <input
                        type="text"
                        {...methods.register(`specifications.${idx}.value`)}
                        placeholder="Value (e.g. Pure Tested Silver Zari)"
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => removeSpec(idx)}
                        className="text-slate-400 hover:text-red-500 p-1.5 transition-colors"
                        title="Remove Specification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Artisan Details Section */}
              <div className="pt-4 border-t border-slate-100 space-y-3.5">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-600" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Master Artisan Details (Optional)
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-3xs font-semibold text-slate-600 uppercase mb-1">
                      Artisan / Weaver Name
                    </label>
                    <input
                      type="text"
                      {...methods.register("artisanName")}
                      placeholder="e.g. Sundaramurthy Weavers"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-3xs font-semibold text-slate-600 uppercase mb-1">
                      Craft Cluster / Origin Location
                    </label>
                    <input
                      type="text"
                      {...methods.register("artisanLocation")}
                      placeholder="e.g. Kanchipuram, Tamil Nadu"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-3xs font-semibold text-slate-600 uppercase mb-1">
                    Artisan Biography &amp; Craft Legacy
                  </label>
                  <textarea
                    rows={2}
                    {...methods.register("artisanAbout")}
                    placeholder="Generational handloom heritage, technique, and craft notes..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN (1/3 width - Contextual Controls)             */}
          {/* ========================================================= */}
          <div className="lg:col-span-1">
            <ProductSidebarControls
              categories={categories}
              warehouses={warehouses}
            />
          </div>
        </div>

        {/* 5. Sticky Bottom Form Action Bar (Shopify-Style, appears when isDirty) */}
        <FormActionBar
          isDirty={isDirty}
          isSubmitting={isProcessing}
          onDiscard={handleDiscard}
          onSave={handleSubmit((data) => onSubmit(data as ProductFormValues))}
          saveLabel={isEditMode ? "Save Changes" : "Publish Product"}
        />

        {/* 6. Shopify-Style Unsaved Changes Modal */}
        <UnsavedChangesModal
          isOpen={isBlocked}
          onConfirm={confirmLeave}
          onCancel={cancelLeave}
        />
      </div>
    </FormProvider>
  );
};
