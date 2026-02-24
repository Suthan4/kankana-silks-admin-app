import React, { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import imageCompression from "browser-image-compression";
import {
  Upload,
  X,
  Check,
  Image as ImageIcon,
  Video,
  Scissors,
  Info,
  Loader2,
  Move,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface MediaUploadManagerProps {
  mediaType: "IMAGE" | "VIDEO";
  onMediaSelect: (file: File, preview: string) => void;
  currentPreview?: string;
  targetWidth?: number;
  targetHeight?: number;
  maxSizeMB?: number;
}

interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

interface CropPosition {
  x: number; // percentage from left (0-100)
  y: number; // percentage from top (0-100)
  scale: number;
}

const MediaUploadManager: React.FC<MediaUploadManagerProps> = ({
  mediaType,
  onMediaSelect,
  currentPreview,
  targetWidth = 1920,
  targetHeight = 600,
  maxSizeMB = 10,
}) => {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalDimensions, setOriginalDimensions] =
    useState<ImageDimensions | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(currentPreview || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const [cropPosition, setCropPosition] = useState<CropPosition>({
    x: 50,
    y: 50,
    scale: 1,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const targetAspectRatio = targetWidth / targetHeight;

  const getImageDimensions = (file: File): Promise<ImageDimensions> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height,
        });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const getVideoMetadata = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        resolve(video.duration);
        URL.revokeObjectURL(video.src);
      };
      video.onerror = reject;
      video.src = URL.createObjectURL(file);
    });
  };

  useEffect(() => {
    if (showCropModal) {
      setCropPosition({ x: 50, y: 50, scale: 1 });
      setImageLoaded(false);
    }
  }, [showCropModal]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleFrameDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX, y: clientY });
    setStartPosition({ x: cropPosition.x, y: cropPosition.y });
  };

  const handleFrameDragMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !containerRef.current || !imageRef.current) return;
      e.preventDefault();

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - dragStart.x;
      const deltaY = clientY - dragStart.y;

      const containerRect = containerRef.current.getBoundingClientRect();

      // Convert pixel delta to percentage
      const deltaXPercent = (deltaX / containerRect.width) * 100;
      const deltaYPercent = (deltaY / containerRect.height) * 100;

      // Calculate new position with boundaries (0-100%)
      const newX = Math.max(0, Math.min(100, startPosition.x + deltaXPercent));
      const newY = Math.max(0, Math.min(100, startPosition.y + deltaYPercent));

      setCropPosition((prev) => ({
        ...prev,
        x: newX,
        y: newY,
      }));
    },
    [isDragging, dragStart, startPosition],
  );

  const handleFrameDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleFrameDragMove as any);
      window.addEventListener("mouseup", handleFrameDragEnd);
      window.addEventListener("touchmove", handleFrameDragMove as any, {
        passive: false,
      });
      window.addEventListener("touchend", handleFrameDragEnd);

      return () => {
        window.removeEventListener("mousemove", handleFrameDragMove as any);
        window.removeEventListener("mouseup", handleFrameDragEnd);
        window.removeEventListener("touchmove", handleFrameDragMove as any);
        window.removeEventListener("touchend", handleFrameDragEnd);
      };
    }
  }, [isDragging, handleFrameDragMove, handleFrameDragEnd]);

  const handleZoomChange = (value: number) => {
    setCropPosition((prev) => ({ ...prev, scale: value / 100 }));
  };

  const cropAndResizeImage = async (
    file: File,
    width: number,
    height: number,
  ): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { alpha: false });

        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);

        // Calculate dimensions
        const imgAspect = img.width / img.height;
        const targetAspect = width / height;

        let sourceWidth, sourceHeight, sourceX, sourceY;

        if (imgAspect > targetAspect) {
          // Image is wider - crop sides
          sourceHeight = img.height / cropPosition.scale;
          sourceWidth = sourceHeight * targetAspect;
          sourceX = ((img.width - sourceWidth) * cropPosition.x) / 100;
          sourceY = ((img.height - sourceHeight) * cropPosition.y) / 100;
        } else {
          // Image is taller - crop top/bottom
          sourceWidth = img.width / cropPosition.scale;
          sourceHeight = sourceWidth / targetAspect;
          sourceX = ((img.width - sourceWidth) * cropPosition.x) / 100;
          sourceY = ((img.height - sourceHeight) * cropPosition.y) / 100;
        }

        // Ensure source dimensions don't exceed image bounds
        sourceX = Math.max(0, Math.min(sourceX, img.width - sourceWidth));
        sourceY = Math.max(0, Math.min(sourceY, img.height - sourceHeight));

        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          width,
          height,
        );

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to create blob"));
              return;
            }

            const extension = file.type.split("/")[1] || "jpg";

            const newFile = new File([blob], `banner.${extension}`, {
              type: file.type,
              lastModified: Date.now(),
            });

            resolve(newFile);
          },
          file.type,
          0.95,
        );

        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  const compressImage = async (file: File): Promise<File> => {
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB,
        maxWidthOrHeight: Math.max(targetWidth, targetHeight),
        useWebWorker: true,
      });
      // 🔥 Convert Blob → File
      return new File([compressed], file.name, {
        type: compressed.type || file.type,
        lastModified: Date.now(),
      });
    } catch (error) {
      return file;
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setIsProcessing(true);
      setOriginalFile(file);

      try {
        if (mediaType === "IMAGE") {
          const dims = await getImageDimensions(file);
          setOriginalDimensions(dims);
          const preview = URL.createObjectURL(file);
          setPreviewUrl(preview);
          setShowCropModal(true);
          setCropPosition({ x: 50, y: 50, scale: 1 });
          setImageLoaded(false);
        } else {
          const duration = await getVideoMetadata(file);
          setVideoDuration(duration);
          const preview = URL.createObjectURL(file);
          setPreviewUrl(preview);
          onMediaSelect(file, preview);
          toast.success("Video uploaded!");
        }
      } catch (error) {
        toast.error("Failed to process file");
      } finally {
        setIsProcessing(false);
      }
    },
    [mediaType, onMediaSelect],
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive: isFileDragActive,
  } = useDropzone({
    onDrop,
    accept:
      mediaType === "IMAGE"
        ? { "image/*": [".png", ".jpg", ".jpeg", ".webp"] }
        : { "video/*": [".mp4", ".webm", ".mov"] },
    maxFiles: 1,
    maxSize: mediaType === "VIDEO" ? 50 * 1024 * 1024 : 10 * 1024 * 1024,
  });

  const handleCropConfirm = async () => {
    if (!originalFile) return;

    setIsProcessing(true);
    setShowCropModal(false);

    try {
      const croppedFile = await cropAndResizeImage(
        originalFile,
        targetWidth,
        targetHeight,
      );
      const compressedFile = await compressImage(croppedFile);
      const finalPreview = URL.createObjectURL(compressedFile);

      setPreviewUrl(finalPreview);
      onMediaSelect(compressedFile, finalPreview);
      toast.success(`Image cropped successfully!`);
    } catch (error) {
      toast.error("Failed to crop image");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setPreviewUrl("");
    setOriginalFile(null);
    setOriginalDimensions(null);
    setVideoDuration(null);
    setCropPosition({ x: 50, y: 50, scale: 1 });
    setImageLoaded(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Calculate frame dimensions for display
  const getFrameDimensions = () => {
    if (!originalDimensions || !containerRef.current) return null;

    const containerRect = containerRef.current.getBoundingClientRect();
    const imgAspect = originalDimensions.width / originalDimensions.height;

    let displayWidth, displayHeight;

    if (imgAspect > targetAspectRatio) {
      // Image is wider than target
      displayHeight = containerRect.height / cropPosition.scale;
      displayWidth = displayHeight * targetAspectRatio;
    } else {
      // Image is taller than target
      displayWidth = containerRect.width / cropPosition.scale;
      displayHeight = displayWidth / targetAspectRatio;
    }

    return {
      width: Math.min(displayWidth, containerRect.width),
      height: Math.min(displayHeight, containerRect.height),
    };
  };

  const frameDimensions = getFrameDimensions();

  return (
    <div className="space-y-4">
      {!previewUrl && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
            isFileDragActive
              ? "border-blue-500 bg-blue-50 scale-105"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          }`}
        >
          <input {...getInputProps()} />
          {isProcessing ? (
            <div className="space-y-3">
              <Loader2 className="h-16 w-16 text-blue-600 mx-auto animate-spin" />
              <p className="text-gray-600 font-medium">Processing...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto">
                {mediaType === "IMAGE" ? (
                  <ImageIcon className="h-10 w-10 text-blue-600" />
                ) : (
                  <Video className="h-10 w-10 text-blue-600" />
                )}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  {isFileDragActive
                    ? `Drop ${mediaType.toLowerCase()} here`
                    : `Upload ${mediaType === "IMAGE" ? "Image" : "Video"}`}
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  Drag & drop or click to browse
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-left space-y-2">
                    <p className="text-sm font-semibold text-blue-900">
                      Requirements:
                    </p>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>
                        • Banner: {targetWidth}×{targetHeight}px
                      </li>
                      <li>
                        • Format:{" "}
                        {mediaType === "IMAGE" ? "PNG, JPG" : "MP4, WEBM"}
                      </li>
                      <li>• Max: {mediaType === "IMAGE" ? "10MB" : "50MB"}</li>
                      {mediaType === "IMAGE" && (
                        <li className="text-green-700 font-medium">
                          ✓ Drag frame to select area
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {previewUrl && !showCropModal && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              {mediaType === "IMAGE" ? (
                <ImageIcon className="h-5 w-5 text-blue-600" />
              ) : (
                <Video className="h-5 w-5 text-blue-600" />
              )}
              Preview
            </h3>
            <button
              onClick={handleClear}
              className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
            >
              <X className="h-5 w-5 text-gray-600 group-hover:text-red-600" />
            </button>
          </div>

          <div className="bg-white rounded-lg overflow-hidden border-2 border-gray-300 mb-4">
            {mediaType === "IMAGE" ? (
              <div style={{ aspectRatio: `${targetWidth}/${targetHeight}` }}>
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <video
                ref={videoRef}
                src={previewUrl}
                controls
                className="w-full h-auto max-h-80"
              />
            )}
          </div>

          {originalFile && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Final Size</p>
                <p className="text-sm font-bold text-blue-600">
                  {targetWidth} × {targetHeight}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">File Size</p>
                <p className="text-sm font-bold text-gray-900">
                  {formatFileSize(originalFile.size)}
                </p>
              </div>
            </div>
          )}

          {mediaType === "IMAGE" && (
            <button
              onClick={() => {
                setShowCropModal(true);
                setImageLoaded(false);
              }}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Scissors className="h-5 w-5" />
              Edit Crop & Position
            </button>
          )}
        </div>
      )}

      {showCropModal && originalDimensions && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Edit image</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Drag frame to select area • Zoom to adjust
                </p>
              </div>
              <button
                onClick={() => setShowCropModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                  <div
                    ref={containerRef}
                    className="bg-gray-900 rounded-lg overflow-hidden relative"
                    style={{
                      aspectRatio: `${originalDimensions.width}/${originalDimensions.height}`,
                      maxHeight: "600px",
                    }}
                  >
                    {!imageLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-12 w-12 text-gray-400 animate-spin" />
                      </div>
                    )}

                    {/* Full image (always visible) */}
                    <img
                      ref={imageRef}
                      src={previewUrl}
                      alt="Full image"
                      onLoad={handleImageLoad}
                      className={`w-full h-full object-contain ${
                        !imageLoaded ? "opacity-0" : "opacity-100"
                      }`}
                      draggable={false}
                    />

                    {/* Selection Frame (draggable) */}
                    {imageLoaded && frameDimensions && (
                      <div
                        className={`absolute border-4 border-white shadow-2xl ${
                          isDragging ? "cursor-grabbing" : "cursor-grab"
                        }`}
                        style={{
                          width: `${frameDimensions.width}px`,
                          height: `${frameDimensions.height}px`,
                          left: `${cropPosition.x}%`,
                          top: `${cropPosition.y}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                        onMouseDown={handleFrameDragStart}
                        onTouchStart={handleFrameDragStart}
                      >
                        {/* Corner indicators */}
                        <div className="absolute -top-1 -left-1 w-6 h-6 bg-white rounded-full border-2 border-blue-500"></div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border-2 border-blue-500"></div>
                        <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-white rounded-full border-2 border-blue-500"></div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full border-2 border-blue-500"></div>

                        {/* Center hint */}
                        {!isDragging && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <div className="bg-white bg-opacity-90 text-gray-900 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                              <Move className="h-4 w-4" />
                              Drag frame
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Dark overlay outside selection */}
                    {imageLoaded && frameDimensions && (
                      <>
                        {/* Top overlay */}
                        <div
                          className="absolute top-0 left-0 right-0 bg-black bg-opacity-60 pointer-events-none"
                          style={{
                            height: `calc(${cropPosition.y}% - ${frameDimensions.height / 2}px)`,
                          }}
                        />
                        {/* Bottom overlay */}
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 pointer-events-none"
                          style={{
                            height: `calc(${100 - cropPosition.y}% - ${frameDimensions.height / 2}px)`,
                          }}
                        />
                        {/* Left overlay */}
                        <div
                          className="absolute left-0 bg-black bg-opacity-60 pointer-events-none"
                          style={{
                            top: `calc(${cropPosition.y}% - ${frameDimensions.height / 2}px)`,
                            width: `calc(${cropPosition.x}% - ${frameDimensions.width / 2}px)`,
                            height: `${frameDimensions.height}px`,
                          }}
                        />
                        {/* Right overlay */}
                        <div
                          className="absolute right-0 bg-black bg-opacity-60 pointer-events-none"
                          style={{
                            top: `calc(${cropPosition.y}% - ${frameDimensions.height / 2}px)`,
                            width: `calc(${100 - cropPosition.x}% - ${frameDimensions.width / 2}px)`,
                            height: `${frameDimensions.height}px`,
                          }}
                        />
                      </>
                    )}
                  </div>
                  <p className="text-center text-sm text-gray-500 mt-3">
                    White frame shows what will be kept • Dark area will be
                    removed
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold">Zoom</label>
                      <span className="text-sm font-bold text-blue-600">
                        {Math.round(cropPosition.scale * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleZoomChange(
                            Math.max(50, cropPosition.scale * 100 - 10),
                          )
                        }
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </button>
                      <input
                        type="range"
                        min="50"
                        max="300"
                        value={cropPosition.scale * 100}
                        onChange={(e) =>
                          handleZoomChange(Number(e.target.value))
                        }
                        className="flex-1 accent-blue-600"
                      />
                      <button
                        onClick={() =>
                          handleZoomChange(
                            Math.min(300, cropPosition.scale * 100 + 10),
                          )
                        }
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-blue-700 space-y-1">
                        <p>• Drag white frame to select area</p>
                        <p>• Zoom to adjust frame size</p>
                        <p>• Dark area will be removed</p>
                        <p>• White frame will be kept</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 border">
                    <p className="text-xs text-gray-500 mb-1">Original</p>
                    <p className="text-sm font-bold text-gray-900">
                      {originalDimensions.width} × {originalDimensions.height}
                    </p>
                    <p className="text-xs text-gray-600 mt-2">Final</p>
                    <p className="text-sm font-bold text-blue-600">
                      {targetWidth} × {targetHeight}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border-t px-6 py-4 flex justify-between">
              <button
                onClick={() => setShowCropModal(false)}
                disabled={isProcessing}
                className="px-6 py-2.5 bg-white hover:bg-gray-100 text-gray-700 border rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCropConfirm}
                disabled={isProcessing || !imageLoaded}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : !imageLoaded ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    Save changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default MediaUploadManager;
