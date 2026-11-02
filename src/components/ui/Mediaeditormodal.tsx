import React, { useCallback, useEffect, useRef, useState } from "react";
import apiClient from "@/lib/api/api.base.service";
import {
  X,
  RotateCcw,
  RotateCw,
  FlipHorizontal2,
  Check,
  Loader2,
} from "lucide-react";

/**
 * MediaEditorModal
 * -----------------
 * A LinkedIn-"Edit image"-style cropper/rotator for a single image.
 * Used for both product media and variant media thumbnails.
 *
 * Usage:
 *   <MediaEditorModal
 *     src={item.preview}
 *     fileName={item.file?.name ?? `media-${item.id}.jpg`}
 *     onCancel={() => setEditingMedia(null)}
 *     onSave={(file, previewUrl) => handleSaveEditedMedia(file, previewUrl)}
 *   />
 *
 * onSave receives a brand new File (JPEG) + an object URL preview for it.
 * The caller is responsible for swapping it into mediaPreviews /
 * variantMediaPreviews and revoking the old blob URL if needed.
 */

interface MediaEditorModalProps {
  src: string;
  fileName?: string;
  aspect?: number; // width / height, default 1 (square)
  onCancel: () => void;
  onSave: (file: File, previewUrl: string) => void;
}

const VIEWPORT_SIZE = 420; // on-screen crop viewport (px)
const OUTPUT_SIZE = 1000; // exported image size (px, square)
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

const MediaEditorModal: React.FC<MediaEditorModalProps> = ({
  src,
  fileName = "edited-image.jpg",
  aspect = 1,
  onCancel,
  onSave,
}) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [naturalSize, setNaturalSize] = useState<{
    w: number;
    h: number;
  } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // degrees
  const [flip, setFlip] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [viewportSize, setViewportSize] = useState(VIEWPORT_SIZE);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(src.startsWith("blob:") || src.startsWith("data:") ? src : null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const dragState = useRef<{
    dragging: boolean;
    startX: number;
    startY: number;
    startOffset: { x: number; y: number };
  }>({ dragging: false, startX: 0, startY: 0, startOffset: { x: 0, y: 0 } });

  const viewportWidth =
    VIEWPORT_SIZE * aspect >= VIEWPORT_SIZE
      ? VIEWPORT_SIZE * aspect
      : VIEWPORT_SIZE;
  const viewportHeight = VIEWPORT_SIZE;

  // Base "cover" draw size so the image fully covers the viewport at zoom = 1
  const baseDraw = React.useMemo(() => {
    if (!naturalSize) return { w: viewportWidth, h: viewportHeight };
    const imgRatio = naturalSize.w / naturalSize.h;
    const viewportRatio = viewportWidth / viewportHeight;
    if (imgRatio > viewportRatio) {
      // image is wider -> fit height, overflow width
      const h = viewportHeight;
      const w = h * imgRatio;
      return { w, h };
    } else {
      const w = viewportWidth;
      const h = w / imgRatio;
      return { w, h };
    }
  }, [naturalSize, viewportWidth, viewportHeight]);

  // Existing CloudFront/S3 URLs are not guaranteed to send CORS headers.
  // Fetch remote media through the authenticated same-origin admin API, then
  // edit the returned blob URL so canvas export remains origin-clean.
  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setNaturalSize(null);
    setLoadError(null);
    if (src.startsWith("blob:") || src.startsWith("data:")) {
      setResolvedSrc(src);
      return () => {};
    }

    setResolvedSrc(null);
    const loadImage = async () => {
      try {
        const imageUrl = new URL(src, window.location.origin);
        const key = decodeURIComponent(imageUrl.pathname.replace(/^\/+/, ""));
        if (!key || key.includes("..")) throw new Error("Invalid image storage path.");
        const response = await apiClient.get("/upload/image-preview", {
          params: { key },
          responseType: "blob",
        });
        if (!String(response.data?.type || "").startsWith("image/")) {
          throw new Error("The image preview endpoint returned an unsupported file.");
        }
        objectUrl = URL.createObjectURL(response.data);
        if (!cancelled) setResolvedSrc(objectUrl);
      } catch (error: any) {
        if (cancelled) return;
        const message = error?.response?.data?.message || error?.response?.data?.error || error?.message;
        setLoadError(message || "Unable to load this image from storage. Please check your admin session and try again.");
      }
    };
    loadImage();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  const rotationRadians = (rotation * Math.PI) / 180;
  const rotatedBounds = {
    width: Math.abs(baseDraw.w * Math.cos(rotationRadians)) + Math.abs(baseDraw.h * Math.sin(rotationRadians)),
    height: Math.abs(baseDraw.w * Math.sin(rotationRadians)) + Math.abs(baseDraw.h * Math.cos(rotationRadians)),
  };
  const rotationCoverScale = Math.max(
    viewportWidth / Math.max(1, rotatedBounds.width),
    viewportHeight / Math.max(1, rotatedBounds.height),
    1,
  );

  const handleImgLoad = () => {
    setLoadError(null);
    const img = imgRef.current;
    if (!img) return;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragState.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startOffset: { ...offset },
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current.dragging) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setOffset({
      x: dragState.current.startOffset.x + dx,
      y: dragState.current.startOffset.y + dy,
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    dragState.current.dragging = false;
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  };

  const resetTransform = () => {
    setZoom(1);
    setRotation(0);
    setFlip(false);
    setOffset({ x: 0, y: 0 });
  };

  const rotateBy = (deg: number) => {
    setRotation((prev) => {
      let next = (prev + deg) % 360;
      if (next < -180) next += 360;
      if (next > 180) next -= 360;
      return next;
    });
  };

  const handleSave = useCallback(async () => {
    const img = imgRef.current;
    if (!img || !naturalSize || !img.complete || img.naturalWidth === 0) {
      setSaveError("The original image is not ready. Please wait for it to load and try again.");
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(viewportWidth * (OUTPUT_SIZE / VIEWPORT_SIZE)));
      canvas.height = Math.max(1, Math.round(viewportHeight * (OUTPUT_SIZE / VIEWPORT_SIZE)));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Your browser could not create an image editor canvas.");
      const ratio = canvas.width / viewportWidth;
      ctx.save();
      ctx.translate(canvas.width / 2 + offset.x * ratio, canvas.height / 2 + offset.y * ratio);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale((flip ? -1 : 1) * zoom * rotationCoverScale, zoom * rotationCoverScale);
      ctx.drawImage(img, -(baseDraw.w * ratio) / 2, -(baseDraw.h * ratio) / 2, baseDraw.w * ratio, baseDraw.h * ratio);
      ctx.restore();
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => result ? resolve(result) : reject(new Error("The edited image could not be exported. Check image storage CORS permissions and try again.")), "image/jpeg", 0.92);
      });
      const baseName = fileName.replace(/\\.[^.]+$/, "") || "edited-image";
      const editedFile = new File([blob], baseName + ".jpg", { type: "image/jpeg", lastModified: Date.now() });
      const previewUrl = URL.createObjectURL(blob);
      try { await onSave(editedFile, previewUrl); }
      catch (callbackError) { URL.revokeObjectURL(previewUrl); throw callbackError; }
    } catch (err) {
      console.error("Image edit save failed:", err);
      setSaveError(err instanceof Error ? err.message : "Could not save the edited image. Please try again.");
    } finally { setIsSaving(false); }
  }, [naturalSize, viewportWidth, viewportHeight, viewportSize, offset, rotation, flip, zoom, baseDraw, rotationCoverScale, fileName, onSave]);

  useEffect(() => {
    const updateViewport = () => {
      const availableWidth = Math.max(220, window.innerWidth - 96);
      const availableHeight = Math.max(220, window.innerHeight * 0.52);
      setViewportSize(Math.min(VIEWPORT_SIZE, availableWidth, availableHeight));
    };
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  // Prevent page scroll while dragging inside the crop viewport
  useEffect(() => {
    const prevent = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-media-editor-viewport]")) {
        e.preventDefault();
        setZoom((z) => {
          const next = z - e.deltaY * 0.001;
          return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
        });
      }
    };
    window.addEventListener("wheel", prevent, { passive: false });
    return () => window.removeEventListener("wheel", prevent);
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Edit image</h3>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:bg-gray-100 rounded-lg p-2 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col lg:flex-row">
          {/* Crop viewport */}
          <div className="flex-1 min-w-0 bg-gray-900 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
            <div
              data-media-editor-viewport
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              className="relative overflow-hidden bg-gray-800 cursor-grab active:cursor-grabbing select-none touch-none rounded-lg"
              style={{ width: viewportWidth, height: viewportHeight }}
            >
              <img
                ref={imgRef}
                src={resolvedSrc || ""}
                onLoad={handleImgLoad}
                onError={() => setLoadError("The image preview could not be decoded. Please try reopening the editor.")}
                alt="Editing"
                draggable={false}
                className="absolute top-1/2 left-1/2 pointer-events-none max-w-none"
                style={{
                  width: baseDraw.w,
                  height: baseDraw.h,
                  transform:
                    `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${flip ? -1 : 1} ${zoom}, ${zoom})`
                      // note: separate scale for flip via scaleX handled below for browsers that need it
                      .replace(
                        `scale(${flip ? -1 : 1} ${zoom}, ${zoom})`,
                        `scaleX(${flip ? -1 : 1}) scale(${zoom * rotationCoverScale})`,
                      ),
                }}
              />
              {/* crop frame overlay (subtle) */}
              <div className="absolute inset-0 pointer-events-none ring-1 ring-white/30 rounded-lg" />
              {loadError && <div className="absolute inset-x-2 bottom-2 rounded-lg bg-red-600/95 px-3 py-2 text-xs text-white">{loadError}</div>}
            </div>
          </div>

          {/* Controls */}
          <div className="w-full lg:w-56 shrink-0 p-4 sm:p-6 space-y-4 sm:space-y-6 border-t lg:border-t-0 lg:border-l border-gray-200">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => rotateBy(-90)}
                title="Rotate left"
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => rotateBy(90)}
                title="Rotate right"
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                <RotateCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setFlip((f) => !f)}
                title="Flip horizontal"
                className={`p-2 rounded-lg border transition-colors ${
                  flip
                    ? "border-blue-500 bg-blue-50 text-blue-600"
                    : "border-gray-300 hover:bg-gray-100"
                }`}
              >
                <FlipHorizontal2 className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Zoom
              </label>
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Rotate
              </label>
              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <p className="text-xs text-gray-500">
              Drag the image to reposition it. Scroll to zoom.
            </p>
            {saveError && <p role="alert" className="text-xs text-red-600 leading-relaxed">{saveError}</p>}

            <button
              type="button"
              onClick={resetTransform}
              className="text-xs font-semibold text-gray-500 hover:text-gray-800 underline"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 max-w-md">Save changes applies this edit to the product form. Save the product to upload the edited image and replace the previous file.</p>
          <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !naturalSize || Boolean(loadError) || !resolvedSrc}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Save changes
              </>
            )}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MediaEditorModal);
