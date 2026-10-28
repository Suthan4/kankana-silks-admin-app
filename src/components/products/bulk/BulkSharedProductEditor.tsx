import React, { useMemo } from "react";
import { X } from "lucide-react";
import { ProductFormLayout } from "@/components/products/ProductFormLayout";
import type { Category } from "@/lib/types/category/category";
import type { CreateProductData, Product, Warehouse } from "@/lib/types/product";
import type { BulkCategoryLookup, BulkParsedMedia, BulkParsedProduct, BulkWarehouse } from "@/lib/types/product/bulkProduct";
import { resolveCategory } from "@/lib/utils/bulkProductNormalization";

interface Props {
  product: BulkParsedProduct;
  flatCategories: BulkCategoryLookup[];
  warehouses: BulkWarehouse[];
  onClose: () => void;
  onSave: (product: BulkParsedProduct) => void;
}

function mediaToProductMedia(media: BulkParsedMedia[] = []) {
  return media.map((item, index) => ({
    id: `draft-media-${index}-${item.key || item.url}`,
    type: item.type || "IMAGE",
    url: item.url,
    key: item.key,
    thumbnailUrl: item.thumbnailUrl,
    altText: item.altText,
    title: item.title,
    description: item.description,
    mimeType: item.mimeType,
    fileSize: item.fileSize,
    duration: item.duration,
    width: item.width,
    height: item.height,
    order: item.order ?? index,
    isActive: item.isActive ?? true,
  }));
}

export const BulkSharedProductEditor: React.FC<Props> = ({
  product, flatCategories, warehouses, onClose, onSave,
}) => {
  const categories = useMemo<Category[]>(() => flatCategories.map((item, index) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    description: "",
    isActive: item.isActive,
    isRoot: false,
    order: index,
    createdAt: "",
    updatedAt: "",
  })), [flatCategories]);

  const formWarehouses = useMemo<Warehouse[]>(() => warehouses.map((item) => ({
    id: item.id, name: item.name, code: item.code, isActive: item.isActive,
  })), [warehouses]);

  const initialProduct = useMemo<Product>(() => {
    const category = resolveCategory(product.categoryPath, product.categoryId, flatCategories);
    const variants = (product.variants || []).map((variant, index) => ({
      id: variant.id || `draft-variant-${index}-${variant.sku || ""}`,
      sku: variant.sku || "",
      isDefault: index === 0,
      attributes: Array.isArray(variant.attributes)
        ? Object.fromEntries(variant.attributes.map((item) => [item.name, item.value]))
        : (variant.attributes || {}),
      size: variant.size,
      color: variant.color,
      fabric: variant.fabric,
      basePrice: Number(variant.basePrice ?? product.basePrice),
      sellingPrice: Number(variant.sellingPrice ?? variant.price ?? product.sellingPrice),
      price: Number(variant.price ?? variant.sellingPrice ?? product.sellingPrice),
      weight: Number(variant.weight ?? product.weight),
      length: Number(variant.length ?? product.length),
      breadth: Number(variant.breadth ?? product.breadth),
      height: Number(variant.height ?? product.height),
      media: mediaToProductMedia(variant.media),
      stock: variant.stock ? [{
        id: `draft-stock-${index}`,
        productId: product.id || product.productGroupId,
        variantId: variant.id || `draft-variant-${index}`,
        warehouseId: variant.stock.warehouseId,
        quantity: variant.stock.quantity,
        lowStockThreshold: variant.stock.lowStockThreshold ?? 5,
        updatedAt: "",
      }] : [],
    }));
    const productStock = product.stock ? [{
      id: "draft-stock",
      productId: product.id || product.productGroupId,
      warehouseId: product.stock.warehouseId,
      quantity: product.stock.quantity,
      lowStockThreshold: product.stock.lowStockThreshold ?? 5,
      updatedAt: "",
    }] : [];
    const variantStock = variants.flatMap((variant) => variant.stock || []);
    const stock = [...productStock, ...variantStock];
    return {
      id: product.id || product.productGroupId,
      slug: product.seo?.slug || product.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-"),
      name: product.name,
      description: product.description || "",
      categoryId: category.categoryId || product.categoryId || "",
      category: undefined,
      basePrice: Number(product.basePrice || 0),
      sellingPrice: Number(product.sellingPrice || 0),
      sku: product.sku || "",
      isActive: product.isActive ?? true,
      hasVariants: product.productType === "variable",
      hsnCode: product.hsnCode,
      artisanName: product.artisanName,
      artisanAbout: product.artisanAbout,
      artisanLocation: product.artisanLocation,
      allowOutOfStockOrders: product.allowOutOfStockOrders ?? true,
      hasVideoConsultation: product.hasVideoConsultation ?? true,
      videoPurchasingEnabled: product.videoPurchasingEnabled ?? true,
      videoConsultationNote: product.videoConsultationNote,
      weight: Number(product.weight || 0.5),
      length: Number(product.length || 10),
      breadth: Number(product.breadth || 10),
      height: Number(product.height || 5),
      metaTitle: product.metaTitle || product.seo?.metaTitle,
      metaDesc: product.metaDesc || product.seo?.metaDesc,
      media: mediaToProductMedia(product.media) as any,
      variants: variants as any,
      stock,
      specifications: (product.specifications || []).map((spec, index) => ({
        id: `draft-spec-${index}`, key: spec.key, value: spec.value,
      })),
      createdAt: "",
      updatedAt: "",
    };
  }, [product, flatCategories]);

  const saveDraftPayload = async (payload: CreateProductData) => {
    const extended = payload as any;
    const category = resolveCategory(undefined, payload.categoryId, flatCategories);
    const updated: BulkParsedProduct = {
      ...product,
      name: payload.name,
      description: payload.description,
      categoryId: payload.categoryId,
      categoryPath: category.categoryPath || product.categoryPath,
      categoryName: category.categoryName || product.categoryName,
      productType: extended.variants?.length ? "variable" : "simple",
      sku: payload.sku,
      basePrice: Number(payload.basePrice),
      sellingPrice: Number(payload.sellingPrice),
      stock: extended.stock ? {
        warehouseId: String(extended.stock.warehouseId),
        quantity: Number(extended.stock.quantity),
        lowStockThreshold: Number(extended.stock.lowStockThreshold ?? 5),
      } : product.stock,
      hsnCode: payload.hsnCode,
      artisanName: payload.artisanName,
      artisanAbout: payload.artisanAbout,
      artisanLocation: payload.artisanLocation,
      weight: Number(payload.weight),
      length: Number(payload.length),
      breadth: Number(payload.breadth),
      height: Number(payload.height),
      allowOutOfStockOrders: payload.allowOutOfStockOrders,
      hasVideoConsultation: payload.hasVideoConsultation,
      videoPurchasingEnabled: payload.videoPurchasingEnabled,
      videoConsultationNote: payload.videoConsultationNote,
      isActive: payload.isActive,
      specifications: payload.specifications || [],
      metaTitle: payload.metaTitle,
      metaDesc: payload.metaDesc,
      seo: { ...product.seo, metaTitle: payload.metaTitle, metaDesc: payload.metaDesc },
      media: (payload.media || []).map((item: any, index): BulkParsedMedia => ({
        type: item.type || "IMAGE",
        url: item.url,
        key: item.key,
        thumbnailUrl: item.thumbnailUrl,
        altText: item.altText,
        title: item.title,
        description: item.description,
        mimeType: item.mimeType,
        fileSize: item.fileSize,
        duration: item.duration,
        width: item.width,
        height: item.height,
        order: item.order ?? index,
        isActive: item.isActive ?? true,
        source: "product",
      })),
      variants: (extended.variants || []).map((variant: any, index: number) => ({
        id: variant.id,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        fabric: variant.fabric,
        attributes: variant.attributes || {},
        basePrice: Number(variant.basePrice ?? payload.basePrice),
        sellingPrice: Number(variant.sellingPrice ?? variant.price ?? payload.sellingPrice),
        price: Number(variant.price ?? variant.sellingPrice ?? payload.sellingPrice),
        weight: Number(variant.weight ?? payload.weight),
        length: Number(variant.length ?? payload.length),
        breadth: Number(variant.breadth ?? payload.breadth),
        height: Number(variant.height ?? payload.height),
        stock: variant.stock ? {
          warehouseId: String(variant.stock.warehouseId),
          quantity: Number(variant.stock.quantity),
          lowStockThreshold: Number(variant.stock.lowStockThreshold ?? 5),
        } : product.variants?.[index]?.stock,
        media: (variant.media || []).map((item: any, mediaIndex: number): BulkParsedMedia => ({
          type: item.type || "IMAGE",
          url: item.url,
          key: item.key,
          thumbnailUrl: item.thumbnailUrl,
          altText: item.altText,
          title: item.title,
          description: item.description,
          mimeType: item.mimeType,
          fileSize: item.fileSize,
          duration: item.duration,
          width: item.width,
          height: item.height,
          order: item.order ?? mediaIndex,
          isActive: item.isActive ?? true,
          source: "variant",
          variantSku: variant.sku,
        })),
      })),
    };
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div>
          <p className="text-sm font-semibold text-slate-900">Bulk product review</p>
          <p className="text-xs text-slate-500">Changes are saved to the draft only. Nothing is published yet.</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Close editor"><X className="h-4 w-4" /></button>
      </div>
      <ProductFormLayout
        initialProduct={initialProduct}
        categories={categories}
        warehouses={formWarehouses}
        onClose={onClose}
        onSuccess={onClose}
        draftMode
        uploadType="bulk"
        onDraftSave={saveDraftPayload}
      />
    </div>
  );
};
