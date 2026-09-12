import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { AlertCircle, FileText } from "lucide-react";
import type { ProductFormValues } from "@/lib/types/product";
import RichTextEditor from "@/components/ui/RichTextEditor";

export interface BasicProductInfoCardProps {
  className?: string;
}

/**
 * BasicProductInfoCard for the main left column: Title & RichText description.
 */
export const BasicProductInfoCard: React.FC<BasicProductInfoCardProps> = ({
  className = "",
}) => {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<ProductFormValues>();

  const watchedDescription = useWatch({ control, name: "description" }) || "";

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5 ${className}`}
    >
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <FileText className="h-5 w-5 text-blue-600" />
        <h3 className="text-base font-bold text-slate-900">
          General Details
        </h3>
      </div>

      <div className="space-y-4">
        {/* Product Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Product Title *
          </label>
          <input
            type="text"
            {...register("name")}
            placeholder="e.g. Royal Blue Pure Kanchipuram Handwoven Silk Saree"
            className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white ${
              errors.name
                ? "border-red-500 focus:ring-red-500"
                : "border-slate-300 focus:ring-blue-500"
            } focus:outline-hidden focus:ring-2`}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1 font-medium">
              <AlertCircle className="h-3.5 w-3.5" />
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Product Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Description &amp; Weave Story *
          </label>
          <div className="rounded-lg border border-slate-300 overflow-hidden bg-white">
            <RichTextEditor
              value={watchedDescription}
              onChange={(value) =>
                setValue("description", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
          </div>
          {errors.description && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1 font-medium">
              <AlertCircle className="h-3.5 w-3.5" />
              {errors.description.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
