/**
 * BulkImageGallery — visual image gallery with drag-and-drop reordering.
 *
 * Uses the existing `order` field (starting at 0) to track sequence.
 * Provides accessible move-left / move-right buttons as an alternative to drag.
 * Does NOT mutate original Drive files.
 */
import React, { useState, useRef } from "react";
import {
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Plus,
  GripVertical,
  Eye,
} from "lucide-react";
import type { BulkParsedMedia } from "@/lib/types/product/bulkProduct";
import { resolveImageUrl } from "@/lib/utils/bulkImageUtils";

interface BulkImageGalleryProps {
  media: BulkParsedMedia[];
  onChange: (updated: BulkParsedMedia[]) => void;
  /** Optional: a function that returns a proxy thumbnail URL given a Drive file reference */
  getThumbnailUrl?: (ref: string) => string | undefined;
  /** Label shown above the gallery, e.g. "Product Images" or "Variant: Red" */
  label?: string;
  readOnly?: boolean;
}

export const BulkImageGallery: React.FC<BulkImageGalleryProps> = ({
  media,
  onChange,
  getThumbnailUrl,
  label = "Images",
  readOnly = false,
}) => {
  // Sort by `order`, then index
  const sorted = [...media].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const next = [...sorted];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next.map((m, i) => ({ ...m, order: i })));
  };

  const moveLeft = (idx: number) => reorder(idx, idx - 1);
  const moveRight = (idx: number) => reorder(idx, idx + 1);

  const removeAt = (idx: number) => {
    const next = sorted.filter((_, i) => i !== idx).map((m, i) => ({ ...m, order: i }));
    onChange(next);
  };

  const updateAlt = (idx: number, altText: string) => {
    const next = sorted.map((m, i) => (i === idx ? { ...m, altText } : m));
    onChange(next.map((m, i) => ({ ...m, order: i })));
  };

  const addUrl = (url: string) => {
    if (!url.trim()) return;
    const next = [...sorted, { type: "IMAGE" as const, url: url.trim(), order: sorted.length, isActive: true }];
    onChange(next.map((m, i) => ({ ...m, order: i })));
  };

  const [newUrl, setNewUrl] = useState("");

  const thumbFor = (m: BulkParsedMedia): string | undefined => {
    return resolveImageUrl(m.url, m.thumbnailUrl, getThumbnailUrl, getThumbnailUrl);
  };

  return (
    <div className="space-y-3">
      {label && (
        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">{label}</p>
      )}

      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
          <ImageIcon className="h-8 w-8 mb-2" />
          <p className="text-xs">No images yet</p>
        </div>
      )}

      {/* Gallery grid */}
      <div className="flex flex-wrap gap-3">
        {sorted.map((m, idx) => {
          const thumb = thumbFor(m);
          const isDragging = draggingIdx === idx;
          const isOver = overIdx === idx;

          return (
            <div
              key={idx}
              className={[
                "relative group flex flex-col rounded-xl border overflow-hidden transition-all",
                "w-28",
                isDragging ? "opacity-40 scale-95" : "",
                isOver ? "ring-2 ring-indigo-500 border-indigo-400" : "border-slate-200",
                !readOnly ? "cursor-grab active:cursor-grabbing" : "",
              ].filter(Boolean).join(" ")}
              draggable={!readOnly}
              onDragStart={() => setDraggingIdx(idx)}
              onDragEnd={() => { setDraggingIdx(null); setOverIdx(null); }}
              onDragOver={(e) => { e.preventDefault(); setOverIdx(idx); }}
              onDrop={() => {
                if (draggingIdx !== null) reorder(draggingIdx, idx);
                setDraggingIdx(null);
                setOverIdx(null);
              }}
              ref={draggingIdx === idx ? dragNode : null}
            >
              {/* Thumbnail */}
              <div className="h-24 bg-slate-100 flex items-center justify-center relative">
                {thumb ? (
                  <img
                    src={thumb}
                    alt={m.altText || "product image"}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      const storageUrl = /^https?:\/\//i.test(m.url || "");
                      const isDriveThumbnail = (m.thumbnailUrl || "").includes("/products/bulk/drive-thumbnail/");
                      const isDriveOriginalProxy = (m.url || "").includes("/products/bulk/drive-proxy/");
                      if (
                        storageUrl &&
                        isDriveThumbnail &&
                        !target.dataset.storageFallback &&
                        !isDriveOriginalProxy
                      ) {
                        target.dataset.storageFallback = "true";
                        target.src = m.url;
                        return;
                      }
                      target.style.display = "none";
                    }}
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-slate-300" />
                )}

                {/* Order badge */}
                <span className="absolute top-1 left-1 text-[10px] bg-slate-800/70 text-white rounded px-1 font-mono">
                  #{idx + 1}
                </span>

                {/* Variant badge if applicable */}
                {(m.source === "variant" || m.variantSku) && (
                  <span className="absolute bottom-1 left-1 max-w-[85%] truncate text-[9px] bg-purple-700/80 text-white rounded px-1 font-sans">
                    {m.variantSku ? `Var: ${m.variantSku}` : "Variant"}
                  </span>
                )}

                {/* Drag handle */}
                {!readOnly && (
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition">
                    <GripVertical className="h-4 w-4 text-white drop-shadow" />
                  </div>
                )}

                {/* Preview button */}
                {thumb && (
                  <button
                    type="button"
                    onClick={() => {
                      const fullUrl = /^(https?:\/\/|\/)/i.test(m.url || "") ? m.url : thumb;
                      setPreviewUrl(fullUrl || thumb);
                    }}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition"
                  >
                    <Eye className="h-5 w-5 text-white" />
                  </button>
                )}
              </div>

              {/* Alt text */}
              {!readOnly && (
                <input
                  type="text"
                  value={m.altText || ""}
                  onChange={(e) => updateAlt(idx, e.target.value)}
                  placeholder="Alt text"
                  className="px-2 py-1 text-[10px] border-t border-slate-100 bg-white focus:outline-none focus:bg-blue-50 w-full truncate"
                />
              )}

              {/* Controls */}
              {!readOnly && (
                <div className="flex items-center justify-between px-1 py-1 bg-white border-t border-slate-100 gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveLeft(idx)}
                    disabled={idx === 0}
                    className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-500"
                    title="Move left"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAt(idx)}
                    className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                    title="Remove"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveRight(idx)}
                    disabled={idx === sorted.length - 1}
                    className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-500"
                    title="Move right"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add image URL */}
      {!readOnly && (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Add image URL or Drive file reference…"
            className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            onKeyDown={(e) => {
              if (e.key === "Enter") { addUrl(newUrl); setNewUrl(""); }
            }}
          />
          <button
            type="button"
            onClick={() => { addUrl(newUrl); setNewUrl(""); }}
            className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      )}

      {/* Lightbox preview */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setPreviewUrl(null)}
        >
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
