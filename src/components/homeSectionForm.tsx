"use client";

import React, { useMemo } from "react";
import {
  useForm,
  Controller,
  useFieldArray,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Image,
  Video,
  LayoutGrid,
  LayoutList,
  LayoutPanelTop,
} from "lucide-react";

import {
  createHomeSectionSchema,
  type CreateHomeSectionFormData,
} from "@/lib/types/heroSection/schema";
import { SectionType } from "@/lib/types/heroSection/herosection";
import { productApi } from "@/lib/api/product.api";
import { categoryApi } from "@/lib/api/category.api";

// ------------------------------
// 🔹 Autocomplete MultiSelect
// ------------------------------

type Option = { label: string; value: string };

const AutoCompleteMultiSelect = ({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  options: Option[];
  placeholder: string;
}) => {
  return (
    <div className="border rounded-xl p-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((v) => {
          const opt = options.find((o) => o.value === v);
          return (
            <span
              key={v}
              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs"
            >
              {opt?.label}
              <button
                onClick={() => onChange(value.filter((x) => x !== v))}
                className="ml-2"
              >
                ×
              </button>
            </span>
          );
        })}
      </div>
      <select
        className="w-full p-2 border rounded-lg"
        onChange={(e) => {
          if (!value.includes(e.target.value)) {
            onChange([...value, e.target.value]);
          }
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
};

// ------------------------------
// 🔹 Main Form
// ------------------------------

export const HomeSectionForm = ({
  onSubmit,
}: {
  onSubmit: (d: CreateHomeSectionFormData) => void;
}) => {
  const form = useForm<CreateHomeSectionFormData>({
    resolver: zodResolver(
      createHomeSectionSchema
    ) as Resolver<CreateHomeSectionFormData>,
    defaultValues: {
      layout: "grid",
      columns: 4,
      showTitle: true,
      showSubtitle: true,
      media: [],
      ctaButtons: [],
    },
  });

  const { control, register, watch } = form;

  const type = watch("type");
  const layout = watch("layout");

  const {
    fields: mediaFields,
    append: addMedia,
    remove: removeMedia,
  } = useFieldArray({
    control,
    name: "media",
  });

  const {
    fields: ctaFields,
    append: addCTA,
    remove: removeCTA,
  } = useFieldArray({
    control,
    name: "ctaButtons",
  });

  const products = useQuery({
    queryKey: ["products"],
    queryFn: () => productApi.getProducts({ limit: 100 }),
  });
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryApi.getCategories({ limit: 100 }),
  });

  const productOptions = useMemo<Option[]>(
    () =>
      products.data?.data?.products?.map((p: any) => ({
        label: p.name,
        value: p.id,
      })) || [],
    [products.data]
  );

  const categoryOptions = useMemo<Option[]>(
    () =>
      categories.data?.data?.categories?.map((c: any) => ({
        label: c.name,
        value: c.id,
      })) || [],
    [categories.data]
  );

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {/* TYPE */}
      <select {...register("type")} className="w-full p-3 border rounded-xl">
        {Object.values(SectionType).map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      {type === "CUSTOM" && (
        <input
          {...register("customTypeName")}
          placeholder="Custom Type Name"
          className="w-full p-3 border rounded-xl"
        />
      )}

      {/* TITLE */}
      <input
        {...register("title")}
        placeholder="Section Title"
        className="w-full p-3 border rounded-xl"
      />

      {/* LAYOUT */}
      <div className="grid grid-cols-3 gap-2">
        {["grid", "carousel", "list"].map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => form.setValue("layout", l as any)}
            className={`p-3 rounded-xl border flex items-center justify-center gap-2 ${
              layout === l ? "bg-purple-100 border-purple-500" : ""
            }`}
          >
            {l === "grid" && <LayoutGrid size={18} />}
            {l === "carousel" && <LayoutPanelTop size={18} />}
            {l === "list" && <LayoutList size={18} />}
            {l}
          </button>
        ))}
      </div>

      {/* PRODUCTS */}
      <Controller
        control={control}
        name="productIds"
        render={({ field }) => (
          <AutoCompleteMultiSelect
            value={field.value || []}
            onChange={field.onChange}
            options={productOptions}
            placeholder="Select Products"
          />
        )}
      />

      {/* CATEGORIES */}
      <Controller
        control={control}
        name="categoryIds"
        render={({ field }) => (
          <AutoCompleteMultiSelect
            value={field.value || []}
            onChange={field.onChange}
            options={categoryOptions}
            placeholder="Select Categories"
          />
        )}
      />

      {/* MEDIA */}
      <div className="space-y-4">
        <h3 className="font-semibold">Media</h3>
        {mediaFields.map((m, i) => (
          <div key={m.id} className="border rounded-xl p-4 space-y-2">
            <select
              {...register(`media.${i}.type`)}
              className="w-full p-2 border rounded"
            >
              <option value="IMAGE">Image</option>
              <option value="VIDEO">Video</option>
            </select>
            <input
              {...register(`media.${i}.url`)}
              placeholder="Media URL"
              className="w-full p-2 border rounded"
            />
            <button
              type="button"
              onClick={() => removeMedia(i)}
              className="text-red-600 text-sm"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            addMedia({
              type: "IMAGE",
              url: "",
              order: 0,
              overlayPosition: "center",
            })
          }
          className="flex items-center gap-2 text-purple-600"
        >
          <Plus size={16} /> Add Media
        </button>
      </div>

      {/* CTA */}
      <div className="space-y-4">
        <h3 className="font-semibold">CTA Buttons</h3>
        {ctaFields.map((c, i) => (
          <div key={c.id} className="border rounded-xl p-4 space-y-2">
            <input
              {...register(`ctaButtons.${i}.text`)}
              placeholder="Button Text"
              className="w-full p-2 border rounded"
            />
            <input
              {...register(`ctaButtons.${i}.url`)}
              placeholder="Button URL"
              className="w-full p-2 border rounded"
            />
            <button
              type="button"
              onClick={() => removeCTA(i)}
              className="text-red-600 text-sm"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            addCTA({
              text: "",
              url: "/",
              style: "PRIMARY",
              order: 0,
              openNewTab: false,
            })
          }
          className="flex items-center gap-2 text-purple-600"
        >
          <Plus size={16} /> Add CTA
        </button>
      </div>

      <button
        type="submit"
        className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold"
      >
        Save Section
      </button>
    </form>
  );
};
