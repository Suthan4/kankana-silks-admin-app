import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import {
  AlertCircle,
  Camera,
  Coins,
  Image as ImageIcon,
  Layers,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Star,
  Trash2,
  Warehouse as WarehouseIcon,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import type {
  ProductFormValues,
  VariantOption,
  Warehouse,
} from "@/lib/types/product";
import { usePatchProductMutation } from "@/lib/hooks/useProductMutations";
import { s3Api } from "@/lib/api/s3.api";
import { createLocalPreviewItem } from "@/services/mediaUploadService";
import { VariantMediaModal, type VariantMediaItem } from "./VariantMediaModal";

export interface VariantMatrixBuilderProps {
  warehouses: Warehouse[];
  productId?: string;
  isEditMode?: boolean;
}

/**
 * Variant Matrix Builder with Dynamic Option Generators, Cartesian Combination Engine,
 * Editable Variant Table, and Variant-Specific Media Uploads.
 */
export const VariantMatrixBuilder: React.FC<VariantMatrixBuilderProps> = ({
  warehouses,
  productId,
  isEditMode = false,
}) => {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<ProductFormValues>();

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
    replace: replaceVariants,
  } = useFieldArray({
    control,
    name: "variants",
  });

  // Watch key values for dynamic calculation
  const watchedBasePrice = useWatch({ control, name: "basePrice" }) || 0;
  const watchedSellingPrice = useWatch({ control, name: "sellingPrice" }) || 0;
  const watchedWeight = useWatch({ control, name: "weight" }) || 0.5;
  const watchedLength = useWatch({ control, name: "length" }) || 10;
  const watchedBreadth = useWatch({ control, name: "breadth" }) || 10;
  const watchedHeight = useWatch({ control, name: "height" }) || 5;
  const watchedBaseSku = useWatch({ control, name: "sku" }) || "SKU";
  const watchedVariants = useWatch({ control, name: "variants" }) || [];

  // Helper to extract non-default attribute key-values and standard attributes for display
  function getVariantAttributeEntries(
    variant: any,
  ): { key?: string; value: string }[] {
    const entries: { key?: string; value: string }[] = [];
    const seenValues = new Set<string>();

    // 1. Dynamic attributes map
    if (variant?.attributes && typeof variant.attributes === "object") {
      Object.entries(variant.attributes).forEach(([k, v]) => {
        const cleanKey = k?.trim();
        const strVal = String(v ?? "").trim();
        if (
          cleanKey &&
          cleanKey.toLowerCase() !== "default" &&
          cleanKey.toLowerCase() !== "isdefault" &&
          strVal !== "" &&
          strVal.toLowerCase() !== "default" &&
          strVal !== "true" &&
          strVal !== "false"
        ) {
          entries.push({ key: cleanKey, value: strVal });
          seenValues.add(strVal.toLowerCase());
        }
      });
    }

    // 2. Standard attributes: Color, Size, Fabric
    if (
      variant?.color &&
      variant.color.toLowerCase() !== "default" &&
      !seenValues.has(variant.color.toLowerCase())
    ) {
      entries.push({ key: "Color", value: variant.color });
      seenValues.add(variant.color.toLowerCase());
    }

    if (
      variant?.size &&
      variant.size.toLowerCase() !== "default" &&
      !seenValues.has(variant.size.toLowerCase())
    ) {
      entries.push({ key: "Size", value: variant.size });
      seenValues.add(variant.size.toLowerCase());
    }

    if (
      variant?.fabric &&
      variant.fabric.toLowerCase() !== "default" &&
      !seenValues.has(variant.fabric.toLowerCase())
    ) {
      entries.push({ key: "Fabric", value: variant.fabric });
      seenValues.add(variant.fabric.toLowerCase());
    }

    return entries;
  }

  // Helper to extract actual options from variant attributes (filtering out backend defaults)
  const extractOptions = useCallback((variantsList: any[]): VariantOption[] => {
    const map = new Map<string, Set<string>>();
    variantsList.forEach((v) => {
      if (v.attributes && typeof v.attributes === "object") {
        Object.entries(v.attributes).forEach(([k, val]) => {
          const cleanKey = k?.trim();
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
            if (!map.has(cleanKey)) map.set(cleanKey, new Set());
            map.get(cleanKey)!.add(String(val));
          }
        });
      }
      if (v.size && v.size.toLowerCase() !== "default") {
        if (!map.has("Size")) map.set("Size", new Set());
        map.get("Size")!.add(String(v.size));
      }
      if (v.color && v.color.toLowerCase() !== "default") {
        if (!map.has("Color")) map.set("Color", new Set());
        map.get("Color")!.add(String(v.color));
      }
      if (v.fabric && v.fabric.toLowerCase() !== "default") {
        if (!map.has("Fabric")) map.set("Fabric", new Set());
        map.get("Fabric")!.add(String(v.fabric));
      }
    });
    return Array.from(map.entries()).map(([name, set]) => ({
      name,
      values: Array.from(set),
    }));
  }, []);

  // Dynamically initialize options from existing variants without mock dummy data
  const [options, setOptions] = useState<VariantOption[]>(() => {
    if (watchedVariants && watchedVariants.length > 0) {
      return extractOptions(watchedVariants);
    }
    return [];
  });

  // Dynamically populate options when product variants load in edit mode
  useEffect(() => {
    if (watchedVariants && watchedVariants.length > 0) {
      setOptions((current) => {
        if (current.length === 0) {
          return extractOptions(watchedVariants);
        }
        return current;
      });
    }
  }, [watchedVariants, extractOptions]);
  const [newOptionName, setNewOptionName] = useState("");
  const [newValueInputs, setNewValueInputs] = useState<Record<number, string>>(
    {},
  );
  const [savingVariantId, setSavingVariantId] = useState<string | null>(null);

  // Variant Media Modal state
  const [activeMediaModalVariantIndex, setActiveMediaModalVariantIndex] =
    useState<number | null>(null);

  // Bulk apply states
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkWarehouse, setBulkWarehouse] = useState(warehouses[0]?.id || "");

  // TanStack Query mutation for partial variant PATCH saves
  const patchMutation = usePatchProductMutation();

  // Current default variant index (guaranteeing one is selected)
  const defaultVariantIndex = useMemo(() => {
    const idx = watchedVariants.findIndex((v) => Boolean(v.isDefault));
    return idx >= 0 ? idx : 0;
  }, [watchedVariants]);

  // Set default variant across all rows
  const handleSetDefaultVariant = useCallback(
    (targetIdx: number) => {
      variantFields.forEach((_, idx) => {
        setValue(`variants.${idx}.isDefault`, idx === targetIdx, {
          shouldDirty: true,
          shouldValidate: true,
        });
      });
      const targetSku =
        watchedVariants[targetIdx]?.sku || `Variant #${targetIdx + 1}`;
      toast.success(`Set ${targetSku} as the default variant`);
    },
    [variantFields, setValue, watchedVariants],
  );

  // Duplicate SKU detection across variants
  const duplicateSkus = useMemo(() => {
    const counts = new Map<string, number>();
    watchedVariants.forEach((v) => {
      if (v.sku?.trim()) {
        const skuKey = v.sku.trim().toLowerCase();
        counts.set(skuKey, (counts.get(skuKey) || 0) + 1);
      }
    });
    const dupes = new Set<string>();
    counts.forEach((count, skuKey) => {
      if (count > 1) dupes.add(skuKey);
    });
    return dupes;
  }, [watchedVariants]);

  // Handle adding an option name
  const handleAddOption = () => {
    const trimmed = newOptionName.trim();
    if (!trimmed) return;
    if (options.some((o) => o.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`Option "${trimmed}" already exists`);
      return;
    }
    setOptions((prev) => [...prev, { name: trimmed, values: [] }]);
    setNewOptionName("");
  };

  // Handle removing an option
  const handleRemoveOption = (index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle adding a value to an option
  const handleAddOptionValue = (optionIndex: number) => {
    const value = (newValueInputs[optionIndex] || "").trim();
    if (!value) return;

    setOptions((prev) =>
      prev.map((opt, i) => {
        if (i !== optionIndex) return opt;
        if (opt.values.includes(value)) {
          toast.error(`Value "${value}" already exists in ${opt.name}`);
          return opt;
        }
        return { ...opt, values: [...opt.values, value] };
      }),
    );
    setNewValueInputs((prev) => ({ ...prev, [optionIndex]: "" }));
  };

  // Handle removing a value from an option
  const handleRemoveOptionValue = (optionIndex: number, valueIndex: number) => {
    setOptions((prev) =>
      prev.map((opt, i) => {
        if (i !== optionIndex) return opt;
        return {
          ...opt,
          values: opt.values.filter((_, vi) => vi !== valueIndex),
        };
      }),
    );
  };

  // Generate Cartesian combinations
  const handleGenerateMatrix = () => {
    const activeOptions = options.filter((o) => o.values.length > 0);
    if (activeOptions.length === 0) {
      toast.error(
        "Please add at least one option with values to generate variants",
      );
      return;
    }

    // Cartesian product algorithm
    const cartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce<string[][]>(
        (acc, curr) => acc.flatMap((c) => curr.map((n) => [...c, n])),
        [[]],
      );
    };

    const combinations = cartesian(activeOptions.map((o) => o.values));

    // Map existing variants by attribute signature to preserve entered prices, stock, & media
    const existingMap = new Map<string, any>();
    watchedVariants.forEach((v) => {
      if (v.attributes) {
        const sig = Object.entries(v.attributes)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, val]) => `${k}:${val}`)
          .join("|");
        existingMap.set(sig, v);
      }
    });

    const defaultWarehouseId = warehouses[0]?.id || "";
    const cleanBaseSku = (watchedBaseSku || "PROD")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .toUpperCase();

    const newVariants = combinations.map((combo) => {
      const attributes: Record<string, string> = {};
      activeOptions.forEach((opt, idx) => {
        attributes[opt.name] = combo[idx];
      });

      const sig = Object.entries(attributes)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, val]) => `${k}:${val}`)
        .join("|");

      const existing = existingMap.get(sig);
      if (existing) {
        return {
          ...existing,
          attributes,
        };
      }

      // Generate clean SKU
      const comboSuffix = combo
        .map((val) =>
          val
            .replace(/[^a-zA-Z0-9]/g, "")
            .slice(0, 3)
            .toUpperCase(),
        )
        .join("-");
      const generatedSku = `${cleanBaseSku}-${comboSuffix}`;

      return {
        sku: generatedSku,
        isDefault: combo.length > 0 && combinations.indexOf(combo) === 0,
        attributes,
        size: attributes["Size"] || attributes["size"],
        color: attributes["Color"] || attributes["color"],
        fabric: attributes["Fabric"] || attributes["fabric"],
        basePrice: watchedBasePrice || 100,
        sellingPrice: watchedSellingPrice || 100,
        price: watchedSellingPrice || 100,
        weight: watchedWeight,
        length: watchedLength,
        breadth: watchedBreadth,
        height: watchedHeight,
        media: [],
        stock: {
          warehouseId: defaultWarehouseId,
          quantity: 10,
          lowStockThreshold: 5,
        },
      };
    });

    replaceVariants(newVariants);
    toast.success(`Generated ${newVariants.length} variant combinations!`);
  };

  // Bulk apply price to all variants
  const handleApplyBulkPrice = () => {
    const priceNum = Number(bulkPrice);
    if (!priceNum || priceNum <= 0) {
      toast.error("Please enter a valid positive price");
      return;
    }
    variantFields.forEach((_, idx) => {
      setValue(`variants.${idx}.sellingPrice`, priceNum, { shouldDirty: true });
      setValue(`variants.${idx}.price`, priceNum, { shouldDirty: true });
    });
    toast.success(`Applied price of ₹${priceNum} to all variants!`);
    setBulkPrice("");
  };

  // Bulk apply warehouse to all variants
  const handleApplyBulkWarehouse = () => {
    if (!bulkWarehouse) {
      toast.error("Please select a warehouse");
      return;
    }
    variantFields.forEach((_, idx) => {
      setValue(`variants.${idx}.stock.warehouseId`, bulkWarehouse, {
        shouldDirty: true,
      });
    });
    const whName =
      warehouses.find((w) => w.id === bulkWarehouse)?.name || "selected";
    toast.success(`Assigned warehouse "${whName}" to all variants!`);
  };

  // Quick direct selection for an individual variant row (local blob preview)
  const handleQuickSelectVariantMedia = (
    variantIndex: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const existingMedia = watchedVariants[variantIndex]?.media || [];

    const newItems = fileArray.map((file, i) =>
      createLocalPreviewItem(
        file,
        existingMedia.length + i,
        existingMedia.length === 0 && i === 0,
        `${watchedVariants[variantIndex]?.sku || "Variant"} photo`,
      ),
    );

    setValue(
      `variants.${variantIndex}.media`,
      [...existingMedia, ...newItems] as any,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
    e.target.value = "";
  };

  // Partial save for a single variant in edit mode
  const handlePartialSaveVariant = async (index: number) => {
    if (!productId) {
      toast.error("Cannot partially save variant without a saved product");
      return;
    }

    const variant = watchedVariants[index];
    const targetVariantId = variant?.id || variant?.variantId;
    if (!targetVariantId) {
      toast.error(
        "This variant has not yet been saved to the server. Save the full product first.",
      );
      return;
    }

    setSavingVariantId(targetVariantId);
    try {
      await patchMutation.mutateAsync({
        id: productId,
        data: {
          variant: {
            variantId: targetVariantId,
            sku: variant.sku,
            isDefault: Boolean(variant.isDefault),
            basePrice: Number(variant.basePrice),
            sellingPrice: Number(variant.sellingPrice),
            price: Number(variant.price || variant.sellingPrice),
            weight: Number(variant.weight),
            stock: {
              warehouseId: variant.stock?.warehouseId,
              quantity: Number(variant.stock?.quantity),
              lowStockThreshold: Number(variant.stock?.lowStockThreshold || 5),
            },
          },
        },
      });
      toast.success(`Variant ${variant.sku} partially updated!`);
    } finally {
      setSavingVariantId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Dynamic Option Generators Section */}
      <div className="bg-slate-50/70 rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              Options &amp; Attributes Generator
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify options (e.g. Size, Color, Fabric) to auto-generate all
              SKU combinations.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerateMatrix}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
          >
            <Layers className="h-3.5 w-3.5" />
            Generate Combinations
          </button>
        </div>

        {/* Existing Options */}
        <div className="mt-4 space-y-3">
          {options.length === 0 && (
            <p className="text-xs text-slate-400 italic py-1">
              No options defined yet. Enter an option name below (e.g. Fabric,
              Color, Size) and click &quot;Add Option&quot;.
            </p>
          )}
          {options.map((option, optIdx) => (
            <div
              key={optIdx}
              className="bg-white rounded-lg p-3 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-center gap-2 min-w-32">
                <span className="font-semibold text-xs text-slate-800">
                  {option.name}
                </span>
                <span className="text-3xs px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                  {option.values.length}
                </span>
              </div>

              {/* Value Chips */}
              <div className="flex-1 flex flex-wrap items-center gap-1.5">
                {option.values.map((val, valIdx) => (
                  <span
                    key={valIdx}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-medium text-slate-700"
                  >
                    {val}
                    <button
                      type="button"
                      onClick={() => handleRemoveOptionValue(optIdx, valIdx)}
                      className="text-slate-400 hover:text-red-500 rounded-sm"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}

                {/* Add new value input for this option */}
                <div className="inline-flex items-center gap-1">
                  <input
                    type="text"
                    placeholder={`+ Add ${option.name}`}
                    value={newValueInputs[optIdx] || ""}
                    onChange={(e) =>
                      setNewValueInputs((prev) => ({
                        ...prev,
                        [optIdx]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddOptionValue(optIdx);
                      }
                    }}
                    className="w-24 px-2 py-1 text-xs border border-dashed border-slate-300 rounded-md focus:border-indigo-500 focus:outline-hidden bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddOptionValue(optIdx)}
                    className="p-1 text-slate-500 hover:text-indigo-600 rounded-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Delete Option */}
              <button
                type="button"
                onClick={() => handleRemoveOption(optIdx)}
                className="self-end md:self-center text-slate-400 hover:text-red-600 p-1 transition-colors"
                title="Remove Option"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {/* Add New Option Input */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              placeholder="New Option Name (e.g. Fabric, Zari)"
              value={newOptionName}
              onChange={(e) => setNewOptionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddOption();
                }
              }}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-60 bg-white"
            />
            <button
              type="button"
              onClick={handleAddOption}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Option
            </button>
          </div>
        </div>
      </div>

      {/* 2. Bulk Actions Bar (if variants exist) */}
      {variantFields.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-blue-900 font-semibold">
            <Coins className="h-4 w-4 text-blue-600" />
            <span>Apply to All ({variantFields.length} rows):</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                placeholder="Selling Price ₹"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                className="w-28 px-2.5 py-1 text-xs border border-blue-200 rounded-md bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleApplyBulkPrice}
                className="px-2.5 py-1 bg-white hover:bg-blue-100 border border-blue-300 text-blue-700 rounded-md text-xs font-medium transition-colors"
              >
                Apply Price
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <select
                value={bulkWarehouse}
                onChange={(e) => setBulkWarehouse(e.target.value)}
                className="px-2 py-1 text-xs border border-blue-200 rounded-md bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleApplyBulkWarehouse}
                className="px-2.5 py-1 bg-white hover:bg-blue-100 border border-blue-300 text-blue-700 rounded-md text-xs font-medium transition-colors"
              >
                Apply Warehouse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Variant Matrix Table with Variant Media Column */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <WarehouseIcon className="h-4 w-4 text-slate-700" />
              Variant Matrix ({variantFields.length} configured)
            </h3>
            {errors.variants?.message && (
              <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.variants.message}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {variantFields.length > 0 && (
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-3xs font-semibold text-slate-500 uppercase tracking-wide">
                  Default:
                </span>
                <select
                  value={defaultVariantIndex}
                  onChange={(e) =>
                    handleSetDefaultVariant(Number(e.target.value))
                  }
                  className="text-xs font-semibold text-indigo-700 bg-transparent focus:outline-hidden cursor-pointer"
                >
                  {variantFields.map((f, i) => {
                    const v = watchedVariants[i] || {};
                    const attrs = getVariantAttributeEntries(v)
                      .map((a) => (a.key ? `${a.key}: ${a.value}` : a.value))
                      .join(", ");
                    const label = attrs || v.sku || `Variant ${i + 1}`;
                    return (
                      <option key={f.id} value={i}>
                        {label} ({v.sku || `Row ${i + 1}`})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                appendVariant({
                  sku: `${watchedBaseSku || "PROD"}-CUSTOM-${variantFields.length + 1}`,
                  isDefault: variantFields.length === 0,
                  attributes: { Custom: `V${variantFields.length + 1}` },
                  basePrice: watchedBasePrice || 100,
                  sellingPrice: watchedSellingPrice || 100,
                  price: watchedSellingPrice || 100,
                  weight: watchedWeight,
                  length: watchedLength,
                  breadth: watchedBreadth,
                  height: watchedHeight,
                  media: [],
                  stock: {
                    warehouseId: warehouses[0]?.id || "",
                    quantity: 10,
                    lowStockThreshold: 5,
                  },
                })
              }
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Row Manually
            </button>
          </div>
        </div>

        {variantFields.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Layers className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">
              No variant combinations generated yet.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Add option names and values above, then click &quot;Generate
              Combinations&quot;.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-3xs">
                <tr>
                  <th scope="col" className="px-3.5 py-2.5 min-w-32">
                    Attributes
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-center min-w-24">
                    Default
                  </th>
                  <th scope="col" className="px-3.5 py-2.5 min-w-36">
                    Photos / Media
                  </th>
                  <th scope="col" className="px-3.5 py-2.5 min-w-36">
                    Variant SKU *
                  </th>
                  <th scope="col" className="px-3 py-2.5 min-w-28">
                    MRP Price (₹)
                  </th>
                  <th scope="col" className="px-3 py-2.5 min-w-28">
                    Selling Price (₹) *
                  </th>
                  <th scope="col" className="px-3.5 py-2.5 min-w-36">
                    Warehouse *
                  </th>
                  <th scope="col" className="px-3 py-2.5 min-w-24">
                    Stock Qty *
                  </th>
                  {isEditMode && productId && (
                    <th
                      scope="col"
                      className="px-3 py-2.5 text-center min-w-20"
                    >
                      Quick Save
                    </th>
                  )}
                  <th scope="col" className="px-2.5 py-2.5 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {variantFields.map((field, idx) => {
                  const variant = watchedVariants[idx] || {};
                  const isDupe =
                    variant.sku &&
                    duplicateSkus.has(variant.sku.trim().toLowerCase());
                  const rowErrors = errors.variants?.[idx];
                  const targetId = variant.id || variant.variantId;
                  const isSavingThis = savingVariantId === targetId;
                  const variantMedia = variant.media || [];

                  const variantAttrSummary = Object.entries(
                    variant.attributes || {},
                  )
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(", ");

                  return (
                    <tr
                      key={field.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isDupe ? "bg-red-50/30" : ""
                      }`}
                    >
                      {/* Attributes Summary */}
                      <td className="px-3.5 py-2.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {(() => {
                            const attrEntries =
                              getVariantAttributeEntries(variant);
                            if (attrEntries.length > 0) {
                              return attrEntries.map((attr, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-800 rounded font-medium text-3xs"
                                >
                                  {attr.key && (
                                    <span className="text-slate-500 mr-1">
                                      {attr.key}:
                                    </span>
                                  )}
                                  <strong className="text-slate-900">
                                    {attr.value}
                                  </strong>
                                </span>
                              ));
                            }
                            // Strictly reserve "Default" for single-variant products with no custom attributes
                            return (
                              <span className="inline-flex items-center px-2 py-0.5 bg-slate-50 text-slate-400 italic rounded text-3xs border border-slate-200">
                                Default
                              </span>
                            );
                          })()}
                        </div>
                      </td>

                      {/* Default Variant Selection */}
                      <td className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleSetDefaultVariant(idx)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-3xs font-semibold transition-all cursor-pointer ${
                            variant.isDefault
                              ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-200 font-bold"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200"
                          }`}
                          title={
                            variant.isDefault
                              ? "Current Default Variant (Primary display for customers)"
                              : "Click to set this variant as default"
                          }
                        >
                          <Star
                            className={`h-3 w-3 ${
                              variant.isDefault
                                ? "fill-amber-300 text-amber-300"
                                : "text-slate-400"
                            }`}
                          />
                          <span>
                            {variant.isDefault ? "Default" : "Set Default"}
                          </span>
                        </button>
                      </td>

                      {/* 🆕 Variant-Level Media Column */}
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {/* Thumbnail strip */}
                          {variantMedia.length > 0 && (
                            <div
                              onClick={() =>
                                setActiveMediaModalVariantIndex(idx)
                              }
                              className="flex items-center -space-x-2 overflow-hidden cursor-pointer hover:opacity-85"
                              title="Click to manage photos for this variant"
                            >
                              {variantMedia
                                .slice(0, 3)
                                .map((m: any, mIdx: number) => (
                                  <img
                                    key={mIdx}
                                    src={m.preview || m.url}
                                    alt="Variant Thumbnail"
                                    className="inline-block h-8 w-8 rounded-md object-cover ring-2 ring-white border border-slate-200"
                                  />
                                ))}
                            </div>
                          )}

                          {variantMedia.length > 3 && (
                            <span
                              onClick={() =>
                                setActiveMediaModalVariantIndex(idx)
                              }
                              className="text-3xs font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 cursor-pointer"
                            >
                              +{variantMedia.length - 3}
                            </span>
                          )}

                          {/* Quick select trigger */}
                          <label
                            className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-2xs font-semibold transition-colors border border-slate-200"
                            title="Add photos for this variant"
                          >
                            <Camera className="h-3.5 w-3.5 text-slate-600" />
                            <span>
                              {variantMedia.length === 0 ? "Add Photo" : "+"}
                            </span>
                            <input
                              type="file"
                              multiple
                              accept="image/*,video/*"
                              onChange={(e) =>
                                handleQuickSelectVariantMedia(idx, e)
                              }
                              className="hidden"
                            />
                          </label>

                          {variantMedia.length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setActiveMediaModalVariantIndex(idx)
                              }
                              className="text-2xs text-blue-600 hover:text-blue-800 font-medium px-1"
                              title="Manage variant photos"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Variant SKU */}
                      <td className="px-3.5 py-2.5">
                        <input
                          type="text"
                          {...register(`variants.${idx}.sku`)}
                          placeholder="SKU-RED-S"
                          className={`w-full px-2.5 py-1.5 rounded-md border text-xs bg-white font-mono ${
                            isDupe || rowErrors?.sku
                              ? "border-red-500 focus:ring-red-500"
                              : "border-slate-300 focus:ring-blue-500"
                          } focus:outline-hidden`}
                        />
                        {isDupe && (
                          <span className="text-3xs text-red-600 block mt-0.5 font-semibold">
                            Duplicate SKU
                          </span>
                        )}
                        {rowErrors?.sku && !isDupe && (
                          <span className="text-3xs text-red-600 block mt-0.5">
                            {rowErrors.sku.message}
                          </span>
                        )}
                      </td>

                      {/* Base Price */}
                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          step="0.01"
                          {...register(`variants.${idx}.basePrice`, {
                            valueAsNumber: true,
                          })}
                          className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs bg-white focus:ring-blue-500 focus:outline-hidden"
                        />
                      </td>

                      {/* Selling Price */}
                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          step="0.01"
                          {...register(`variants.${idx}.sellingPrice`, {
                            valueAsNumber: true,
                            onChange: (e) => {
                              setValue(
                                `variants.${idx}.price`,
                                Number(e.target.value) || 0,
                              );
                            },
                          })}
                          className={`w-full px-2.5 py-1.5 rounded-md border text-xs bg-white font-medium ${
                            rowErrors?.sellingPrice
                              ? "border-red-500"
                              : "border-slate-300"
                          } focus:ring-blue-500 focus:outline-hidden`}
                        />
                      </td>

                      {/* Warehouse Select */}
                      <td className="px-3.5 py-2.5">
                        <select
                          {...register(`variants.${idx}.stock.warehouseId`)}
                          className="w-full px-2 py-1.5 rounded-md border border-slate-300 text-xs bg-white focus:ring-blue-500 focus:outline-hidden"
                        >
                          {warehouses.map((wh) => (
                            <option key={wh.id} value={wh.id}>
                              {wh.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Stock Quantity */}
                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          {...register(`variants.${idx}.stock.quantity`, {
                            valueAsNumber: true,
                          })}
                          className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs bg-white focus:ring-blue-500 focus:outline-hidden"
                        />
                      </td>

                      {/* Single Variant Quick Save Button (in Edit Mode) */}
                      {isEditMode && productId && (
                        <td className="px-3 py-2.5 text-center">
                          <button
                            type="button"
                            disabled={isSavingThis || !targetId}
                            onClick={() => handlePartialSaveVariant(idx)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-3xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors disabled:opacity-50"
                            title="Partially save this variant's price & stock"
                          >
                            {isSavingThis ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Save className="h-3 w-3" />
                            )}
                            Save
                          </button>
                        </td>
                      )}

                      {/* Remove Row */}
                      <td className="px-2.5 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => removeVariant(idx)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded-sm transition-colors"
                          title="Delete variant row"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Variant Media Management Modal */}
      {activeMediaModalVariantIndex !== null && (
        <VariantMediaModal
          isOpen={true}
          onClose={() => setActiveMediaModalVariantIndex(null)}
          variantTitle={
            Object.entries(
              watchedVariants[activeMediaModalVariantIndex]?.attributes || {},
            )
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ") || "Variant"
          }
          variantSku={watchedVariants[activeMediaModalVariantIndex]?.sku || ""}
          media={watchedVariants[activeMediaModalVariantIndex]?.media || []}
          onUpdateMedia={(updatedMedia) => {
            setValue(
              `variants.${activeMediaModalVariantIndex}.media`,
              updatedMedia as any,
              { shouldDirty: true },
            );
          }}
        />
      )}
    </div>
  );
};
