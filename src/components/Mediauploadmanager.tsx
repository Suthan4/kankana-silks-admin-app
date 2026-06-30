"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { useDropzone } from "react-dropzone";
import {
  Check,
  Crop as CropIcon,
  Image as ImageIcon,
  Info,
  Loader2,
  Move,
  RotateCcw,
  Upload,
  Video,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface MediaUploadManagerProps {
  mediaType: "IMAGE" | "VIDEO";
  onMediaSelect: (file: File, preview: string) => void;
  onMediaClear?: () => void;
  currentPreview?: string;
  targetWidth?: number;
  targetHeight?: number;
  maxSizeMB?: number;
  /**
   * The cropped output is never enlarged. Large camera images are reduced only
   * when their selected crop is wider than this value.
   */
  maxOutputWidth?: number;
}

interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

interface CropPosition {
  x: number;
  y: number;
}

interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CropFrameSize {
  width: number;
  height: number;
}

interface CropMediaSize {
  width: number;
  height: number;
}

const getImageDimensions = (file: File): Promise<ImageDimensions> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
        aspectRatio: image.naturalWidth / image.naturalHeight,
      });

      URL.revokeObjectURL(objectUrl);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to read image dimensions"));
    };

    image.src = objectUrl;
  });

const getVideoDuration = (file: File): Promise<number> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");

    video.preload = "metadata";

    video.onloadedmetadata = () => {
      resolve(video.duration);
      URL.revokeObjectURL(objectUrl);
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to read video metadata"));
    };

    video.src = objectUrl;
  });

const loadImage = (source: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Unable to load image for cropping"));

    // This is harmless for local blob URLs and allows S3/remote images when
    // the bucket has the correct CORS configuration.
    image.crossOrigin = "anonymous";
    image.src = source;
  });

const getOutputType = (inputType: string) => {
  if (inputType === "image/png") {
    return { mimeType: "image/png", extension: "png", quality: undefined };
  }

  if (inputType === "image/webp") {
    return { mimeType: "image/webp", extension: "webp", quality: 0.96 };
  }

  return { mimeType: "image/jpeg", extension: "jpg", quality: 0.96 };
};

const createCroppedImageFile = async ({
  imageSource,
  crop,
  originalFile,
  maxOutputWidth,
}: {
  imageSource: string;
  crop: PixelCrop;
  originalFile: File;
  maxOutputWidth: number;
}): Promise<File> => {
  const image = await loadImage(imageSource);

  // Never upscale. Large camera crops are limited to a high-quality 4K output
  // by default so the hero remains sharp without uploading a 20-40 MB image.
  const outputScale = Math.min(1, maxOutputWidth / crop.width);
  const outputWidth = Math.max(1, Math.round(crop.width * outputScale));
  const outputHeight = Math.max(1, Math.round(crop.height * outputScale));

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const context = canvas.getContext("2d", { alpha: true });

  if (!context) {
    throw new Error("Your browser could not create the cropped image");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  context.drawImage(
    image,
    Math.round(crop.x),
    Math.round(crop.y),
    Math.round(crop.width),
    Math.round(crop.height),
    0,
    0,
    outputWidth,
    outputHeight,
  );

  const output = getOutputType(originalFile.type);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error("Failed to create the cropped image"));
        }
      },
      output.mimeType,
      output.quality,
    );
  });

  const originalName = originalFile.name.replace(/\.[^/.]+$/, "");
  const outputName = `${originalName}-banner-${outputWidth}x${outputHeight}.${output.extension}`;

  return new File([blob], outputName, {
    type: output.mimeType,
    lastModified: Date.now(),
  });
};

const MediaUploadManager: React.FC<MediaUploadManagerProps> = ({
  mediaType,
  onMediaSelect,
  onMediaClear,
  currentPreview,
  targetWidth = 1920,
  targetHeight = 1080,
  maxSizeMB = 30,
  maxOutputWidth = 3840,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceImageFile, setSourceImageFile] = useState<File | null>(null);
  const [originalDimensions, setOriginalDimensions] =
    useState<ImageDimensions | null>(null);
  const [outputDimensions, setOutputDimensions] =
    useState<ImageDimensions | null>(null);
  const [previewUrl, setPreviewUrl] = useState(currentPreview || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [cropSourceUrl, setCropSourceUrl] = useState("");
  const [crop, setCrop] = useState<CropPosition>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(
    null,
  );
  const [cropFrameSize, setCropFrameSize] = useState<CropFrameSize>({
    width: 0,
    height: 0,
  });
  const [cropMediaSize, setCropMediaSize] = useState<CropMediaSize | null>(
    null,
  );
  const [minimumZoom, setMinimumZoom] = useState(1);

  const generatedObjectUrlRef = useRef<string | null>(null);
  const cropSourceUrlRef = useRef<string | null>(null);
  const cropStageRef = useRef<HTMLDivElement | null>(null);
  const hasInitialisedCropRef = useRef(false);

  const aspectRatio = targetWidth / targetHeight;
  const maximumZoom = Math.max(4, minimumZoom * 4);

  useEffect(() => {
    setPreviewUrl(currentPreview || "");
  }, [currentPreview]);

  const revokeGeneratedPreview = useCallback(() => {
    if (generatedObjectUrlRef.current) {
      URL.revokeObjectURL(generatedObjectUrlRef.current);
      generatedObjectUrlRef.current = null;
    }
  }, []);

  const revokeCropSource = useCallback(() => {
    if (cropSourceUrlRef.current) {
      URL.revokeObjectURL(cropSourceUrlRef.current);
      cropSourceUrlRef.current = null;
    }

    setCropSourceUrl("");
  }, []);

  useEffect(() => {
    return () => {
      revokeGeneratedPreview();
      revokeCropSource();
    };
  }, [revokeCropSource, revokeGeneratedPreview]);

  useEffect(() => {
    if (!isCropperOpen || !cropStageRef.current) return;

    const stage = cropStageRef.current;

    const updateCropFrame = () => {
      const bounds = stage.getBoundingClientRect();
      const horizontalPadding = bounds.width < 768 ? 24 : 64;
      const verticalPadding = bounds.height < 520 ? 24 : 48;
      const availableWidth = Math.max(1, bounds.width - horizontalPadding * 2);
      const availableHeight = Math.max(1, bounds.height - verticalPadding * 2);

      let width = availableWidth;
      let height = width / aspectRatio;

      if (height > availableHeight) {
        height = availableHeight;
        width = height * aspectRatio;
      }

      setCropFrameSize({
        width: Math.max(1, Math.round(width)),
        height: Math.max(1, Math.round(height)),
      });
    };

    updateCropFrame();

    const observer = new ResizeObserver(updateCropFrame);
    observer.observe(stage);

    return () => observer.disconnect();
  }, [aspectRatio, isCropperOpen]);

  useEffect(() => {
    if (
      !cropMediaSize ||
      cropFrameSize.width <= 0 ||
      cropFrameSize.height <= 0
    ) {
      return;
    }

    const nextMinimumZoom = Math.max(
      cropFrameSize.width / cropMediaSize.width,
      cropFrameSize.height / cropMediaSize.height,
      0.1,
    );

    setMinimumZoom(nextMinimumZoom);

    if (!hasInitialisedCropRef.current) {
      setZoom(nextMinimumZoom);
      setCrop({ x: 0, y: 0 });
      hasInitialisedCropRef.current = true;
      return;
    }

    setZoom((current) => Math.max(current, nextMinimumZoom));
  }, [cropFrameSize, cropMediaSize]);

  const replaceObjectUrl = useCallback(
    (file: File) => {
      revokeGeneratedPreview();

      const nextUrl = URL.createObjectURL(file);
      generatedObjectUrlRef.current = nextUrl;
      setPreviewUrl(nextUrl);

      return nextUrl;
    },
    [revokeGeneratedPreview],
  );

  const openCropEditor = useCallback(
    (file: File) => {
      revokeCropSource();

      const nextSourceUrl = URL.createObjectURL(file);
      cropSourceUrlRef.current = nextSourceUrl;
      setCropSourceUrl(nextSourceUrl);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setMinimumZoom(1);
      setCropMediaSize(null);
      setCropFrameSize({ width: 0, height: 0 });
      setCroppedAreaPixels(null);
      hasInitialisedCropRef.current = false;
      setIsCropperOpen(true);
    },
    [revokeCropSource],
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setIsProcessing(true);

      try {
        if (mediaType === "IMAGE") {
          const dimensions = await getImageDimensions(file);

          if (dimensions.width <= dimensions.height) {
            toast.error(
              "Please upload a landscape image. Portrait and square images are not suitable for this hero banner.",
            );
            return;
          }

          if (
            dimensions.width < targetWidth ||
            dimensions.height < targetHeight
          ) {
            toast.error(
              `Image is too small. Minimum size is ${targetWidth} × ${targetHeight} px.`,
            );
            return;
          }

          setSourceImageFile(file);
          setOriginalDimensions(dimensions);
          setOutputDimensions(null);
          setVideoDuration(null);
          openCropEditor(file);
          return;
        }

        const duration = await getVideoDuration(file);

        revokeCropSource();
        setSourceImageFile(null);
        setOriginalDimensions(null);
        setOutputDimensions(null);
        setVideoDuration(duration);
        setSelectedFile(file);

        const preview = replaceObjectUrl(file);
        onMediaSelect(file, preview);

        toast.success("Video selected successfully.");
      } catch (error) {
        console.error("Media processing error:", error);

        toast.error(
          error instanceof Error ? error.message : "Failed to process media",
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [
      mediaType,
      onMediaSelect,
      openCropEditor,
      replaceObjectUrl,
      revokeCropSource,
      targetHeight,
      targetWidth,
    ],
  );

  const handleApplyCrop = useCallback(async () => {
    if (!sourceImageFile || !cropSourceUrl || !croppedAreaPixels) {
      toast.error("Please wait for the crop area to load.");
      return;
    }

    setIsProcessing(true);

    try {
      const croppedFile = await createCroppedImageFile({
        imageSource: cropSourceUrl,
        crop: croppedAreaPixels,
        originalFile: sourceImageFile,
        maxOutputWidth,
      });

      const dimensions = await getImageDimensions(croppedFile);
      const preview = replaceObjectUrl(croppedFile);

      setSelectedFile(croppedFile);
      setOutputDimensions(dimensions);
      setIsCropperOpen(false);
      revokeCropSource();
      onMediaSelect(croppedFile, preview);

      toast.success(
        `Banner crop ready at ${dimensions.width} × ${dimensions.height}px.`,
      );
    } catch (error) {
      console.error("Crop error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to crop the image",
      );
    } finally {
      setIsProcessing(false);
    }
  }, [
    cropSourceUrl,
    croppedAreaPixels,
    maxOutputWidth,
    onMediaSelect,
    replaceObjectUrl,
    revokeCropSource,
    sourceImageFile,
  ]);

  const handleCancelCrop = useCallback(() => {
    setIsCropperOpen(false);
    revokeCropSource();

    // If no final crop has been created, remove the pending original file.
    if (!selectedFile) {
      setSourceImageFile(null);
      setOriginalDimensions(null);
    }
  }, [revokeCropSource, selectedFile]);

  const handleAdjustCrop = useCallback(() => {
    if (!sourceImageFile) return;
    openCropEditor(sourceImageFile);
  }, [openCropEditor, sourceImageFile]);

  const onDropRejected = useCallback(() => {
    toast.error(
      mediaType === "IMAGE"
        ? `Upload a JPG, PNG or WebP image up to ${maxSizeMB} MB.`
        : `Upload an MP4, WebM or MOV video up to ${maxSizeMB} MB.`,
    );
  }, [maxSizeMB, mediaType]);

  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept:
      mediaType === "IMAGE"
        ? {
            "image/jpeg": [".jpg", ".jpeg"],
            "image/png": [".png"],
            "image/webp": [".webp"],
          }
        : {
            "video/mp4": [".mp4"],
            "video/webm": [".webm"],
            "video/quicktime": [".mov"],
          },
    maxFiles: 1,
    maxSize: maxSizeMB * 1024 * 1024,
    disabled: isProcessing,
  });

  const handleClear = () => {
    revokeGeneratedPreview();
    revokeCropSource();

    setPreviewUrl("");
    setSelectedFile(null);
    setSourceImageFile(null);
    setOriginalDimensions(null);
    setOutputDimensions(null);
    setVideoDuration(null);
    setIsCropperOpen(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setMinimumZoom(1);
    setCropMediaSize(null);
    setCropFrameSize({ width: 0, height: 0 });
    setCroppedAreaPixels(null);
    hasInitialisedCropRef.current = false;
    onMediaClear?.();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-4">
      {!previewUrl ? (
        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
          } ${isProcessing ? "pointer-events-none opacity-70" : ""}`}
        >
          <input {...getInputProps()} />

          {isProcessing ? (
            <div className="space-y-3">
              <Loader2 className="mx-auto h-14 w-14 animate-spin text-blue-600" />
              <p className="font-medium text-gray-700">Processing media...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                {mediaType === "IMAGE" ? (
                  <ImageIcon className="h-10 w-10 text-blue-600" />
                ) : (
                  <Video className="h-10 w-10 text-blue-600" />
                )}
              </div>

              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {isDragActive
                    ? `Drop the ${mediaType.toLowerCase()} here`
                    : `Upload ${
                        mediaType === "IMAGE" ? "hero image" : "video"
                      }`}
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  Drag and drop or click to browse
                </p>
              </div>

              <div className="mx-auto max-w-lg rounded-lg border border-blue-200 bg-blue-50 p-4 text-left">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                  <div className="space-y-1 text-xs text-blue-800">
                    {mediaType === "IMAGE" ? (
                      <>
                        <p className="font-semibold text-blue-950">
                          Select the visible banner area
                        </p>
                        <p>• Large camera images such as 6000 × 4000 work</p>
                        <p>
                          • Minimum: {targetWidth} × {targetHeight} px
                        </p>
                        <p>
                          • Output ratio: {targetWidth}:{targetHeight}
                        </p>
                        <p>• JPG, PNG or WebP, maximum {maxSizeMB} MB</p>
                        <p className="font-medium text-green-700">
                          • The selected area is exported in high quality, up to
                          {` ${maxOutputWidth}px`} wide
                        </p>
                        <p className="text-amber-700">
                          • Keep faces and important details away from the far
                          left and right edges because screens have different
                          aspect ratios
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-blue-950">
                          Video requirements
                        </p>
                        <p>• MP4, WebM or MOV</p>
                        <p>• Maximum {maxSizeMB} MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="flex items-center gap-2 font-semibold text-gray-900">
                {mediaType === "IMAGE" ? (
                  <ImageIcon className="h-5 w-5 text-blue-600" />
                ) : (
                  <Video className="h-5 w-5 text-blue-600" />
                )}
                Media preview
              </h3>

              {mediaType === "IMAGE" && (
                <p className="mt-1 text-xs text-gray-500">
                  This is the selected 16:9 banner area that will be uploaded.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
              aria-label="Remove selected media"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {mediaType === "IMAGE" ? (
            <div
              className="overflow-hidden rounded-lg bg-[#111]"
              style={{ aspectRatio }}
            >
              <img
                src={previewUrl}
                alt="Selected banner crop preview"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <video
              src={previewUrl}
              controls
              className="max-h-80 w-full rounded-lg bg-black object-contain"
            />
          )}

          {selectedFile && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {mediaType === "IMAGE" && originalDimensions && (
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <p className="text-xs text-gray-500">Original</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {originalDimensions.width} × {originalDimensions.height}
                  </p>
                </div>
              )}

              {mediaType === "IMAGE" && outputDimensions && (
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <p className="text-xs text-gray-500">Banner output</p>
                  <p className="mt-1 text-sm font-semibold text-green-700">
                    {outputDimensions.width} × {outputDimensions.height}
                  </p>
                </div>
              )}

              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-xs text-gray-500">
                  {mediaType === "IMAGE" ? "Upload mode" : "Duration"}
                </p>
                <p className="mt-1 text-sm font-semibold text-blue-600">
                  {mediaType === "IMAGE"
                    ? "Selected crop"
                    : `${videoDuration?.toFixed(1) ?? "0"} sec`}
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-xs text-gray-500">File size</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {mediaType === "IMAGE" && sourceImageFile && (
              <button
                type="button"
                onClick={handleAdjustCrop}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
              >
                <CropIcon className="h-4 w-4" />
                Adjust crop
              </button>
            )}

            <div
              {...getRootProps()}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-blue-400 hover:text-blue-600"
            >
              <input {...getInputProps()} />
              <Upload className="h-4 w-4" />
              Replace media
            </div>
          </div>
        </div>
      )}

      {isCropperOpen && cropSourceUrl && (
        <div className="fixed inset-0 z-[100] bg-black/85 p-0 sm:p-3 lg:p-5">
          <div className="mx-auto flex h-full w-full max-w-[1680px] flex-col overflow-hidden bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-950 sm:text-xl">
                  <CropIcon className="h-5 w-5 text-blue-600" />
                  Select the banner area
                </h3>
                <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                  Drag the image in any direction. Only the area inside the
                  large banner frame will be uploaded.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCancelCrop}
                disabled={isProcessing}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                aria-label="Close crop editor"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div
                ref={cropStageRef}
                className="relative min-h-[430px] overflow-hidden bg-[#9b9b9b] lg:min-h-0"
              >
                {cropFrameSize.width > 0 && cropFrameSize.height > 0 && (
                  <Cropper
                    image={cropSourceUrl}
                    crop={crop}
                    zoom={zoom}
                    minZoom={minimumZoom}
                    maxZoom={maximumZoom}
                    zoomSpeed={0.12}
                    aspect={aspectRatio}
                    cropSize={cropFrameSize}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_, pixelArea) =>
                      setCroppedAreaPixels(pixelArea)
                    }
                    onMediaLoaded={(media) =>
                      setCropMediaSize({
                        width: media.width,
                        height: media.height,
                      })
                    }
                    cropShape="rect"
                    objectFit="contain"
                    showGrid
                    restrictPosition
                    zoomWithScroll
                    style={{
                      containerStyle: {
                        background: "#9b9b9b",
                      },
                      cropAreaStyle: {
                        border: "3px solid rgba(255,255,255,0.98)",
                        boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
                      },
                    }}
                  />
                )}

                <div className="pointer-events-none absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full bg-black/65 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm sm:text-sm">
                  <Move className="h-4 w-4" />
                  Drag image to choose the visible area
                </div>

                <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/65 px-3 py-2 text-center text-[11px] text-white/90 backdrop-blur-sm sm:text-xs">
                  Banner ratio {targetWidth}:{targetHeight}
                </div>
              </div>

              <aside className="overflow-y-auto border-t border-gray-200 bg-white p-5 lg:border-l lg:border-t-0 lg:p-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-base font-semibold text-gray-950">
                      Position and zoom
                    </h4>
                    <p className="mt-1 text-sm leading-6 text-gray-500">
                      Move the photo until the exact people, product or
                      background you want is inside the white frame. Nothing is
                      selected automatically until you press “Use selected
                      area”.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="banner-crop-zoom"
                        className="text-sm font-medium text-gray-800"
                      >
                        Zoom
                      </label>
                      <span className="text-sm font-semibold text-blue-700">
                        {(zoom / Math.max(minimumZoom, 0.0001)).toFixed(2)}×
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setZoom((current) =>
                            Math.max(minimumZoom, current - 0.1),
                          )
                        }
                        disabled={isProcessing || zoom <= minimumZoom}
                        className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Zoom out"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </button>

                      <input
                        id="banner-crop-zoom"
                        type="range"
                        min={minimumZoom}
                        max={maximumZoom}
                        step={0.01}
                        value={zoom}
                        onChange={(event) =>
                          setZoom(Number(event.target.value))
                        }
                        className="w-full accent-blue-600"
                        aria-label="Crop zoom"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setZoom((current) =>
                            Math.min(maximumZoom, current + 0.1),
                          )
                        }
                        disabled={isProcessing || zoom >= maximumZoom}
                        className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Zoom in"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCrop({ x: 0, y: 0 });
                      setZoom(minimumZoom);
                    }}
                    disabled={isProcessing}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset position
                  </button>

                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <p className="text-sm font-semibold text-blue-950">
                      Large desktop banner
                    </p>
                    <p className="mt-1 text-sm leading-6 text-blue-800">
                      The selected crop keeps the original camera pixels and is
                      exported up to {maxOutputWidth}px wide. It is never
                      stretched or enlarged.
                    </p>
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-950">
                      Safe area
                    </p>
                    <p className="mt-1 text-sm leading-6 text-amber-800">
                      Keep faces and important content near the centre grid.
                      Very wide or tall screens may trim a small outer edge
                      because the storefront fills the complete screen.
                    </p>
                  </div>

                  {croppedAreaPixels && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Selected source pixels
                      </p>
                      <p className="mt-1 text-base font-semibold text-gray-900">
                        {Math.round(croppedAreaPixels.width)} ×{" "}
                        {Math.round(croppedAreaPixels.height)} px
                      </p>
                    </div>
                  )}
                </div>
              </aside>
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-gray-200 bg-white px-4 py-3 sm:flex-row sm:justify-end sm:px-6 sm:py-4">
              <button
                type="button"
                onClick={handleCancelCrop}
                disabled={isProcessing}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleApplyCrop}
                disabled={isProcessing || !croppedAreaPixels}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-2.5 text-sm font-semibold text-white transition-colors hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating banner...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Use selected area
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaUploadManager;
