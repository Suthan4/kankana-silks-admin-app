import React from "react";
import { Check, Trash2 } from "lucide-react";

export interface ImagePreviewGridProps {
  items: any[];
  onRemove: (index: number) => void;
  onSetCover: (index: number) => void;
  columns?: 3 | 4 | 5;
}

const colClass: Record<number, string> = {
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-4 md:grid-cols-5",
};

/**
 * Reusable grid of media preview tiles supporting:
 * - Instant local blob URL preview
 * - Cover image badge (index 0)
 * - Hover overlay with Set Cover / Delete actions
 */
export const ImagePreviewGrid: React.FC<ImagePreviewGridProps> = ({
  items,
  onRemove,
  onSetCover,
  columns = 5,
}) => {
  if (items.length === 0) return null;

  return (
    <div className={`grid ${colClass[columns] ?? colClass[5]} gap-3 pt-2`}>
      {items.map((item, idx) => {
        const isCover = idx === 0;
        const displayUrl = item.preview || item.url || item.localUrl;

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
              <img
                src={displayUrl}
                alt={item.altText || `Product photo ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            )}

            {isCover && (
              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-blue-600 text-white text-3xs font-bold rounded shadow-xs flex items-center gap-0.5 z-10">
                <Check className="h-2.5 w-2.5" />
                Cover
              </div>
            )}

            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1 z-20">
              {!isCover && (
                <button
                  type="button"
                  onClick={() => onSetCover(idx)}
                  className="px-2 py-1 bg-white hover:bg-blue-50 text-slate-800 rounded text-3xs font-semibold shadow-xs transition-colors"
                >
                  Set Cover
                </button>
              )}
              <button
                type="button"
                onClick={() => onRemove(idx)}
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
  );
};
