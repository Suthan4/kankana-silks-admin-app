import React, { useState, useEffect } from "react";
import {
  Check,
  Crop,
  Image as ImageIcon,
  Plus,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import {
  createLocalPreviewItem,
  revokePreviewUrl,
  type MediaPreviewItem,
} from "@/services/mediaUploadService";
import MediaEditorModal from "@/components/ui/Mediaeditormodal";

export type VariantMediaItem = MediaPreviewItem;

export interface VariantMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  variantTitle: string;
  variantSku: string;
  media: any[];
  onUpdateMedia: (updatedMedia: any[]) => void;
}

/**
 * Dedicated modal for managing variant-specific photos and videos with instant local previews
 * and cropping/repositioning capabilities.
 * No early S3 upload occurs here — photos are previewed locally until product publish.
 */
export const VariantMediaModal: React.FC<VariantMediaModalProps> = ({
  isOpen,
  onClose,
  variantTitle,
  variantSku,
  media = [],
  onUpdateMedia,
}) => {
  const [items, setItems] = useState<any[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setItems(
        (media || []).map((m: any, idx: number) => ({
          ...m,
          id: m.id || crypto.randomUUID(),
          preview: m.preview || m.url,
          order: m.order ?? idx,
          isPrimary: m.isPrimary ?? idx === 0,
        }))
      );
    }
  }, [isOpen, media]);

  if (!isOpen) return null;

  const handleFiles = (files: File[]) => {
    if (!files || files.length === 0) return;

    const newItems = files.map((file, idx) =>
      createLocalPreviewItem(
        file,
        items.length + idx,
        items.length === 0 && idx === 0,
        `${variantTitle} - ${variantSku}`
      )
    );

    setItems((prev) => [...prev, ...newItems]);
  };

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

  const handleRemove = (index: number) => {
    const target = items[index];
    revokePreviewUrl(target?.preview || target?.url);
    const updated = items
      .filter((_, i) => i !== index)
      .map((item, i) => ({
        ...item,
        order: i,
        isPrimary: i === 0,
      }));
    setItems(updated);
  };

  const handleSetCover = (index: number) => {
    const target = items[index];
    const rest = items.filter((_, i) => i !== index);
    const reordered = [target, ...rest].map((item, i) => ({
      ...item,
      order: i,
      isPrimary: i === 0,
    }));
    setItems(reordered);
  };

  const handleSaveEditedVariantMedia = (
    index: number,
    editedFile: File,
    editedPreviewUrl: string
  ) => {
    const target = items[index];
    if (target?.preview?.startsWith("blob:") && target.preview !== editedPreviewUrl) {
      revokePreviewUrl(target.preview);
    }
    const updated = [...items];
    updated[index] = {
      ...target,
      file: editedFile,
      url: editedPreviewUrl,
      preview: editedPreviewUrl,
    };
    setItems(updated);
  };

  const handleDone = () => {
    onUpdateMedia(items);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/70 to-blue-50/70">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-indigo-600" />
              Variant Media: {variantTitle || "Variant"}
            </h3>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              SKU: {variantSku || "—"} &nbsp;·&nbsp; {items.length} photo(s) attached
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              isDragOver
                ? "border-indigo-500 bg-indigo-50/60"
                : "border-gray-300 hover:border-indigo-400 bg-gray-50/60"
            }`}
          >
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-700">
              Upload images or videos specific to this variant
            </p>
            <p className="text-2xs text-gray-400 mt-0.5">
              e.g. Color swatch or model wearing this specific color/fabric
            </p>

            <label className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-xs">
              <Plus className="h-4 w-4" />
              Select Files
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Media Grid */}
          {items.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {items.map((item, idx) => {
                const isCover = idx === 0;
                const displayUrl = item.preview || item.url;

                return (
                  <div
                    key={item.id || idx}
                    className={`group relative aspect-square rounded-lg overflow-hidden border-2 bg-gray-100 ${
                      isCover
                        ? "border-indigo-600 ring-2 ring-indigo-100"
                        : "border-gray-200"
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
                      <img
                        src={displayUrl}
                        alt={item.altText || `Variant photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Primary Badge */}
                    {isCover && (
                      <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-indigo-600 text-white rounded text-3xs font-bold shadow-xs flex items-center gap-0.5 z-10">
                        <Check className="h-2.5 w-2.5" />
                        Cover
                      </div>
                    )}

                    {item.type === "VIDEO" && (
                      <div className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded z-10">
                        <Video className="h-3 w-3" />
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1 z-20">
                      {item.type !== "VIDEO" && (
                        <button
                          type="button"
                          onClick={() => setEditingIndex(idx)}
                          className="p-1.5 bg-white text-gray-800 hover:bg-indigo-50 hover:text-indigo-600 rounded shadow-xs transition-colors"
                          title="Crop & Move image"
                        >
                          <Crop className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {!isCover && (
                        <button
                          type="button"
                          onClick={() => handleSetCover(idx)}
                          className="px-2 py-1 bg-white text-gray-800 rounded text-3xs font-medium hover:bg-indigo-50 hover:text-indigo-600 shadow-xs transition-colors"
                        >
                          Set Cover
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemove(idx)}
                        className="p-1 bg-red-600 hover:bg-red-700 text-white rounded shadow-xs transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-gray-400">
              No media attached to this variant yet. Upload photos above.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {items.length} photo(s) selected
          </span>
          <button
            type="button"
            onClick={handleDone}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            Done
          </button>
        </div>
      </div>

      {/* Crop & Move Modal */}
      {editingIndex !== null && items[editingIndex] && (
        <MediaEditorModal
          src={items[editingIndex].preview || items[editingIndex].url}
          fileName={items[editingIndex].file?.name || `variant-photo-${editingIndex + 1}.jpg`}
          onCancel={() => setEditingIndex(null)}
          onSave={(editedFile, editedPreviewUrl) => {
            handleSaveEditedVariantMedia(editingIndex, editedFile, editedPreviewUrl);
            setEditingIndex(null);
          }}
        />
      )}
    </div>
  );
};
