import React, { useState, useCallback, useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
  Check,
  Crop,
  Image as ImageIcon,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Video,
} from "lucide-react";
import type { ProductFormValues } from "@/lib/types/product";
import {
  createLocalPreviewItem,
  revokePreviewUrl,
} from "@/services/mediaUploadService";
import MediaEditorModal from "@/components/ui/Mediaeditormodal";

export interface GlobalMediaUploaderProps {
  className?: string;
}

/**
 * Global Product Media Uploader.
 * Active when Custom Variants is toggled OFF.
 *
 * Provides instant local blob preview on file selection without early S3 upload.
 * Includes crop/reposition/rotate/zoom tools per image.
 * All media is uploaded to S3 when the user clicks "Publish Product".
 */
export const GlobalMediaUploader: React.FC<GlobalMediaUploaderProps> = ({
  className = "",
}) => {
  const { control, setValue } = useFormContext<ProductFormValues>();
  const media = useWatch({ control, name: "media" }) || [];
  const [isDragOver, setIsDragOver] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [failedPreviewIds, setFailedPreviewIds] = useState<Set<string>>(new Set());

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      media.forEach((m: any) => {
        revokePreviewUrl(m?.preview || m?.url);
      });
    };
  }, []);

  const handleFiles = useCallback(
    (files: File[]) => {
      if (!files || files.length === 0) return;

      const newItems = files.map((file, idx) =>
        createLocalPreviewItem(
          file,
          media.length + idx,
          media.length === 0 && idx === 0,
          file.name
        )
      );

      setValue("media", [...media, ...newItems] as any, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [media, setValue]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    handleFiles(files);
  };

  const handleRemoveMedia = (index: number) => {
    const target = media[index] as any;
    revokePreviewUrl(target?.preview || target?.url);

    const updated = media
      .filter((_, i) => i !== index)
      .map((item, i) => ({
        ...item,
        order: i,
        isPrimary: i === 0,
      }));

    setValue("media", updated as any, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleMoveMedia = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= media.length) return;
    const reordered = [...media];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setValue("media", reordered.map((item, order) => ({
      ...item,
      order,
      isPrimary: order === 0,
    })) as any, { shouldDirty: true, shouldValidate: true });
  };

  const handleSetCover = (index: number) => {
    const target = media[index];
    const rest = media.filter((_, i) => i !== index);
    const reordered = [target, ...rest].map((item, i) => ({
      ...item,
      order: i,
      isPrimary: i === 0,
    }));

    setValue("media", reordered as any, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleSaveEditedMedia = (
    index: number,
    editedFile: File,
    editedPreviewUrl: string
  ) => {
    const target = media[index] as any;
    if (target?.preview?.startsWith("blob:") && target.preview !== editedPreviewUrl) {
      revokePreviewUrl(target.preview);
    }
    const updated = [...media];
    updated[index] = {
      ...target,
      file: editedFile,
      url: editedPreviewUrl,
      preview: editedPreviewUrl,
    };
    setValue("media", updated as any, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5 ${className}`}
    >
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <ImageIcon className="h-5 w-5 text-blue-600" />
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Product Photos &amp; Media
          </h3>
          <p className="text-xs text-slate-500">
            Upload high resolution photography and videos. Hover over any photo to crop, reposition, or set as cover.
          </p>
        </div>
      </div>

      {/* Dropzone Container */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
          isDragOver
            ? "border-blue-500 bg-blue-50/60"
            : "border-slate-300 hover:border-blue-400 bg-slate-50/50"
        }`}
      >
        <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-700">
          Drag and drop product photos or videos here, or browse
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          Supports JPEG, PNG, WEBP, and MP4 formats
        </p>

        <label className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-xs">
          <Plus className="h-4 w-4" />
          Add Media Files
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </label>
      </div>

      {/* Media Thumbnails Grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
          {media.map((item: any, idx: number) => {
            const isCover = idx === 0;
            const mediaKey = String(item.id || idx);
            const displayUrl = item.preview || item.url;
            const hasLegacyDriveLink =
              /drive\.google\.com|docs\.google\.com|googleusercontent\.com|\/products\/bulk\/drive-proxy\/|[?&]token=/i.test(
                String(item.url || ""),
              );
            const previewFailed = failedPreviewIds.has(mediaKey);

            return (
              <div
                key={item.id || idx}
                className={`relative rounded-lg overflow-hidden border-2 aspect-square bg-slate-100 group shadow-xs ${
                  isCover
                    ? "border-blue-600 ring-2 ring-blue-100"
                    : "border-slate-200"
                }`}
              >
                {item.type === "VIDEO" ? (
                  <video
                    src={displayUrl}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                ) : (
                  previewFailed ? (
                    <div className="flex h-full flex-col items-center justify-center gap-1 p-2 text-center text-[10px] text-slate-500">
                      <ImageIcon className="h-5 w-5 text-slate-300" />
                      <span>Image unavailable</span>
                      {hasLegacyDriveLink && <span className="font-semibold text-amber-700">Remove and re-upload</span>}
                    </div>
                  ) : (
                    <img
                      src={displayUrl}
                      alt={item.altText || `Product photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(event) => {
                        const image = event.currentTarget;
                        if (
                          item.url &&
                          displayUrl !== item.url &&
                          image.dataset.urlFallback !== "true"
                        ) {
                          image.dataset.urlFallback = "true";
                          image.src = item.url;
                          return;
                        }
                        setFailedPreviewIds((current) => {
                          const next = new Set(current);
                          next.add(mediaKey);
                          return next;
                        });
                      }}
                      onLoad={() => {
                        setFailedPreviewIds((current) => {
                          if (!current.has(mediaKey)) return current;
                          const next = new Set(current);
                          next.delete(mediaKey);
                          return next;
                        });
                      }}
                    />
                  )
                )}

                {/* Badges */}
                {isCover && (
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-blue-600 text-white text-3xs font-bold rounded shadow-xs flex items-center gap-0.5 z-10">
                    <Check className="h-2.5 w-2.5" />
                    Cover
                  </div>
                )}
                {hasLegacyDriveLink && (
                  <div
                    className="absolute bottom-1.5 left-1.5 rounded bg-amber-600/95 px-1.5 py-1 text-[9px] font-bold text-white shadow-sm z-10"
                    title="This is a temporary Google Drive link, not a permanent uploaded image URL."
                  >
                    Needs re-upload
                  </div>
                )}
                {item.type === "VIDEO" && (
                  <div className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded z-10">
                    <Video className="h-3 w-3" />
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1 z-20">
                  {item.type !== "VIDEO" && (
                    <button
                      type="button"
                      onClick={() => setEditingIndex(idx)}
                      className="p-1.5 bg-white hover:bg-blue-50 text-slate-800 hover:text-blue-600 rounded shadow-xs transition-colors"
                      title="Crop & Move image"
                    >
                      <Crop className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleMoveMedia(idx, -1)}
                    disabled={idx === 0}
                    className="p-1.5 bg-white hover:bg-blue-50 text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed rounded shadow-xs"
                    title="Move image earlier"
                    aria-label={`Move image ${idx + 1} earlier`}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveMedia(idx, 1)}
                    disabled={idx === media.length - 1}
                    className="p-1.5 bg-white hover:bg-blue-50 text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed rounded shadow-xs"
                    title="Move image later"
                    aria-label={`Move image ${idx + 1} later`}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  {!isCover && (
                    <button
                      type="button"
                      onClick={() => handleSetCover(idx)}
                      className="px-2 py-1 bg-white hover:bg-blue-50 text-slate-800 rounded text-3xs font-semibold shadow-xs transition-colors"
                    >
                      Set Cover
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(idx)}
                    className="p-1 bg-red-600 hover:bg-red-700 text-white rounded shadow-xs transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Crop / Move Image Modal */}
      {editingIndex !== null && media[editingIndex] && (
        <MediaEditorModal
          src={(media[editingIndex] as any).preview || (media[editingIndex] as any).url}
          fileName={(media[editingIndex] as any).file?.name || `product-photo-${editingIndex + 1}.jpg`}
          onCancel={() => setEditingIndex(null)}
          onSave={(editedFile, editedPreviewUrl) => {
            handleSaveEditedMedia(editingIndex, editedFile, editedPreviewUrl);
            setEditingIndex(null);
          }}
        />
      )}
    </div>
  );
};
