import React, { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layouts/mainLayout";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "react-hot-toast";

import {
  Plus,
  Edit,
  Trash2,
  X,
  Image as ImageIcon,
  Video,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Hash,
  Clock,
  FileImage,
  Play,
  Pause,
  Loader2,
  ExternalLink,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Smartphone,
  Check,
  Info,
} from "lucide-react";
import { bannerApi, type Banner } from "@/lib/api/banner.api";
import { s3Api } from "@/lib/api/s3.api";
import {
  createBannerSchema,
  type CreateBannerFormData,
} from "@/lib/types/banner/schema";
import MediaUploadManager from "@/components/Mediauploadmanager"; // Import the new component
import { BackButton } from "@/components/ui/BackButton";

const BANNER_WIDTH = 1920;
const BANNER_HEIGHT = 1080;
const BANNER_ASPECT_RATIO = "16 / 9";

const MOBILE_BANNER_WIDTH = 1080;
const MOBILE_BANNER_HEIGHT = 1920;

interface BannerHeroCarouselProps {
  banners: Banner[];
  onEdit: (banner: Banner) => void;
  onDelete: (banner: Banner) => void;
  canUpdate: boolean;
  canDelete: boolean;
}

const BannerHeroCarousel: React.FC<BannerHeroCarouselProps> = ({
  banners,
  onEdit,
  onDelete,
  canUpdate,
  canDelete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timerKey, setTimerKey] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [isPlayingVideo, setIsPlayingVideo] = useState(true);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  // Reset autoplay timer on manual interactions
  const resetAutoplay = useCallback(() => {
    setTimerKey((prev) => prev + 1);
  }, []);

  // Bounds check when banners array length changes
  useEffect(() => {
    if (banners.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= banners.length) {
      setCurrentIndex(Math.max(0, banners.length - 1));
    }
  }, [banners.length, currentIndex]);

  const handleNext = useCallback(() => {
    if (banners.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const handlePrev = useCallback(() => {
    if (banners.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const handleNextManual = () => {
    handleNext();
    resetAutoplay();
  };

  const handlePrevManual = () => {
    handlePrev();
    resetAutoplay();
  };

  const handleDotClick = (index: number) => {
    if (index === currentIndex || index < 0 || index >= banners.length) return;
    setCurrentIndex(index);
    resetAutoplay();
  };

  // Autoplay effect - 5 seconds interval, clears on unmount or reset
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length, timerKey]);

  // Keyboard navigation for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (banners.length <= 1) return;
      if (e.key === "ArrowLeft") handlePrevManual();
      if (e.key === "ArrowRight") handleNextManual();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [banners.length, handleNextManual, handlePrevManual]);

  const activeBanner = banners[currentIndex] || banners[0];
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );
  if (!activeBanner) return null;

  const isMultiple = banners.length > 1;

  const toggleVideoPlayback = (bannerId: string) => {
    const video = videoRefs.current[bannerId];
    if (video) {
      if (video.paused) {
        video.play();
        setIsPlayingVideo(true);
      } else {
        video.pause();
        setIsPlayingVideo(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Device Viewport Preview Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Preview Mode:
          </span>
          <button
            type="button"
            onClick={() => setPreviewMode("desktop")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              previewMode === "desktop"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            Desktop View (16:9)
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode("mobile")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              previewMode === "mobile"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            Mobile View (Portrait)
          </button>
        </div>

        <div className="text-xs text-gray-500">
          {previewMode === "mobile" ? (
            activeBanner.mobileUrl ? (
              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                ✓ Showing Dedicated Mobile Image
              </span>
            ) : (
              <span className="text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                ⚠ No mobile image set — showing desktop fallback
              </span>
            )
          ) : (
            <span className="text-blue-700 font-semibold bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 flex items-center gap-1">
              ✓ Showing Desktop Landscape Image
            </span>
          )}
        </div>
      </div>

      {/* Hero Section Carousel Frame */}
      <div
        className={`relative overflow-hidden bg-gray-950 shadow-xl transition-all duration-300 ${
          previewMode === "mobile"
            ? "w-full max-w-sm mx-auto rounded-3xl border-4 border-gray-800 aspect-[9/16]"
            : "w-full rounded-2xl border border-gray-200 aspect-[16/9] sm:aspect-[21/9] lg:aspect-[16/5]"
        }`}
        role="region"
        aria-roledescription="carousel"
        aria-label="Promotional banners carousel"
      >
        {/* Slides Track */}
        <div
          className="flex h-full w-full transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner, index) => {
            const hasError = imageErrors[banner.id];
            const isActiveSlide = index === currentIndex;

            return (
              <div
                key={banner.id}
                className="relative h-full w-full flex-shrink-0 select-none overflow-hidden"
                aria-hidden={!isActiveSlide}
              >
                {/* Media Section */}
                {banner.type === "VIDEO" ? (
                  <div className="relative w-full h-full bg-black">
                    <video
                      ref={(el) => {
                        videoRefs.current[banner.id] = el;
                      }}
                      src={banner.url}
                      poster={banner.thumbnailUrl}
                      className="w-full h-full object-cover object-center"
                      autoPlay={isActiveSlide}
                      loop
                      muted
                      playsInline
                    />
                    {isActiveSlide && (
                      <button
                        type="button"
                        onClick={() => toggleVideoPlayback(banner.id)}
                        className="absolute bottom-5 right-5 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all"
                        aria-label={
                          isPlayingVideo ? "Pause video" : "Play video"
                        }
                      >
                        {isPlayingVideo ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                ) : hasError ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-gray-400 p-6 text-center">
                    <FileImage className="h-10 w-10 sm:h-12 sm:w-12 mb-2 text-gray-500" />
                    <p className="text-sm font-medium text-gray-300">
                      Banner Image Unavailable
                    </p>
                    <p className="text-xs text-gray-500 mt-1 max-w-md truncate">
                      {banner.url}
                    </p>
                  </div>
                ) : (
                  <img
                    src={
                      previewMode === "mobile" && banner.mobileUrl
                        ? banner.mobileUrl
                        : banner.url
                    }
                    alt={banner.title || "Promotional banner"}
                    className="w-full h-full object-cover object-center"
                    loading={index === 0 ? "eager" : "lazy"}
                    onError={() =>
                      setImageErrors((prev) => ({
                        ...prev,
                        [banner.id]: true,
                      }))
                    }
                  />
                )}

                {/* Subtle gradient overlay for hero typography readability */}
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/30"
                  aria-hidden="true"
                />

                {/* Badges in top corners */}
                <div className="absolute top-3 left-3 sm:top-5 sm:left-5 z-10 flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 text-xs font-bold rounded-full text-white flex items-center gap-1 shadow-sm backdrop-blur-sm ${
                      banner.type === "VIDEO"
                        ? "bg-purple-600/90"
                        : "bg-blue-600/90"
                    }`}
                  >
                    {banner.type === "VIDEO" ? (
                      <Video className="h-3 w-3" />
                    ) : (
                      <ImageIcon className="h-3 w-3" />
                    )}
                    {banner.type}
                  </span>

                  {previewMode === "mobile" && (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-full text-white backdrop-blur-sm shadow-sm flex items-center gap-1 ${
                        banner.mobileUrl
                          ? "bg-emerald-600/90"
                          : "bg-amber-600/90"
                      }`}
                    >
                      <Smartphone className="h-3 w-3" />
                      {banner.mobileUrl ? "Mobile Asset" : "Desktop Fallback"}
                    </span>
                  )}

                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-black/60 text-white backdrop-blur-sm border border-white/20 shadow-sm">
                    Order: {banner.order}
                  </span>
                </div>

                <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-10 flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 text-xs font-bold rounded-full flex items-center gap-1 shadow-sm backdrop-blur-sm ${
                      banner.isActive
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {banner.isActive ? (
                      <>
                        <Eye className="h-3 w-3" />
                        LIVE
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3" />
                        DRAFT
                      </>
                    )}
                  </span>
                </div>

                {/* Hero typography content */}
                <div className="absolute inset-x-0 bottom-8 sm:bottom-12 lg:bottom-14 z-10 px-6 sm:px-12 text-center flex flex-col items-center justify-center pointer-events-none">
                  <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold uppercase tracking-wider text-white drop-shadow-lg max-w-4xl line-clamp-1">
                    {banner.title}
                  </h2>
                  {banner.text && (
                    <p className="mt-2 text-xs sm:text-sm lg:text-base text-white/90 max-w-2xl font-light drop-shadow line-clamp-2">
                      {banner.text}
                    </p>
                  )}
                  {banner.link && (
                    <a
                      href={banner.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pointer-events-auto mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-white bg-white/20 hover:bg-white hover:text-gray-900 rounded-full backdrop-blur-md border border-white/40 transition-all shadow-sm"
                    >
                      <LinkIcon className="h-3 w-3" />
                      Visit Link
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Previous & Next Arrow Controls (Multiple banners only) */}
        {isMultiple && (
          <>
            <button
              type="button"
              onClick={handlePrevManual}
              aria-label="Previous banner"
              className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-white/80 active:scale-95"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            <button
              type="button"
              onClick={handleNextManual}
              aria-label="Next banner"
              className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-white/80 active:scale-95"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Pagination Dots */}
            <div
              className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/85 backdrop-blur-md shadow-md border border-white/40"
              role="tablist"
              aria-label="Banner slides"
            >
              {banners.map((_, index) => {
                const isActive = index === currentIndex;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDotClick(index)}
                    aria-label={`Go to banner ${index + 1}`}
                    aria-current={isActive ? "true" : undefined}
                    className={`transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-black ${
                      isActive
                        ? "w-7 sm:w-8 h-2.5 bg-black"
                        : "w-2.5 h-2.5 bg-gray-400 hover:bg-gray-700"
                    }`}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Active Banner Management & Details Panel */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                Banner {currentIndex + 1} of {banners.length}
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  activeBanner.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {activeBanner.isActive ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <EyeOff className="h-3 w-3" />
                )}
                {activeBanner.isActive ? "LIVE" : "DRAFT"}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                Order: {activeBanner.order}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                {activeBanner.type}
              </span>
              {activeBanner.mobileUrl ? (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <Smartphone className="h-3 w-3" />
                  Mobile Ready
                </span>
              ) : (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                  <Smartphone className="h-3 w-3" />
                  Desktop Only
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-gray-900">
              {activeBanner.title}
            </h3>

            {activeBanner.text && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {activeBanner.text}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          {(canUpdate || canDelete) && (
            <div className="flex items-center gap-2 shrink-0">
              {canUpdate && (
                <button
                  type="button"
                  onClick={() => onEdit(activeBanner)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Edit className="h-4 w-4" />
                  Edit Banner
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(activeBanner)}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        {/* Technical Specs / Dimensions / File Info */}
        <div className="flex flex-wrap items-center gap-4 pt-4 mt-4 border-t border-gray-100 text-xs text-gray-500">
          {activeBanner.width && activeBanner.height && (
            <span className="flex items-center gap-1">
              <FileImage className="h-3.5 w-3.5 text-gray-400" />
              Dimensions: {activeBanner.width}×{activeBanner.height}px
            </span>
          )}
          {activeBanner.duration && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              Duration: {activeBanner.duration}s
            </span>
          )}
          {activeBanner.fileSize && (
            <span className="flex items-center gap-1">
              <Hash className="h-3.5 w-3.5 text-gray-400" />
              Size: {(activeBanner.fileSize / (1024 * 1024)).toFixed(2)} MB
            </span>
          )}
          {activeBanner.link && (
            <span className="flex items-center gap-1 truncate max-w-md">
              <LinkIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              Link:{" "}
              <a
                href={activeBanner.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline truncate"
              >
                {activeBanner.link}
              </a>
              <ExternalLink className="h-3 w-3 text-blue-600 flex-shrink-0" />
            </span>
          )}
        </div>
      </div>

      {/* Quick All-Banners Navigator & Management Strip (when multiple banners exist) */}
      {isMultiple && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-gray-900">
              All Banners ({banners.length})
            </h4>
            <span className="text-xs text-gray-500">
              Click any slide to jump to preview
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {banners.map((banner, index) => {
              const isSelected = index === currentIndex;
              return (
                <div
                  key={banner.id}
                  onClick={() => handleDotClick(index)}
                  className={`cursor-pointer rounded-lg border p-3 transition-all flex items-center gap-3 ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="relative w-16 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      src={
                        banner.type === "VIDEO"
                          ? banner.thumbnailUrl || banner.url
                          : banner.url
                      }
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {banner.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          banner.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {banner.isActive ? "LIVE" : "DRAFT"}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        #{banner.order}
                      </span>
                      {banner.mobileUrl && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <Smartphone className="h-2.5 w-2.5" />
                          Mobile Ready
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Direct action buttons */}
                  {(canUpdate || canDelete) && (
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {canUpdate && (
                        <button
                          type="button"
                          onClick={() => onEdit(banner)}
                          title="Edit Banner"
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(banner)}
                          title="Delete Banner"
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const BannersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>("");
  const [mobileMediaFile, setMobileMediaFile] = useState<File | null>(null);
  const [mobileMediaPreview, setMobileMediaPreview] = useState<string>("");
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO">("IMAGE");
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [filterType, setFilterType] = useState<"ALL" | "IMAGE" | "VIDEO">(
    "ALL",
  );
  const [filterActive, setFilterActive] = useState<boolean | undefined>(
    undefined,
  );

  const canCreate = hasPermission("banners", "canCreate");
  const canUpdate = hasPermission("banners", "canUpdate");
  const canDelete = hasPermission("banners", "canDelete");

  // Fetch banners
  const { data: bannersData, isLoading } = useQuery({
    queryKey: ["banners", filterType, filterActive],
    queryFn: async () => {
      const response = await bannerApi.getBanners({
        limit: 100,
        type: filterType === "ALL" ? undefined : filterType,
        isActive: filterActive,
        sortBy: "order",
        sortOrder: "asc",
      });
      return response.data;
    },
  });

  // Create banner mutation
  const createMutation = useMutation({
    mutationFn: bannerApi.createBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      setShowCreateModal(false);
      reset();
      setMediaPreview("");
      setMediaFile(null);
      setMobileMediaPreview("");
      setMobileMediaFile(null);
      toast.success("Banner created successfully!");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create banner");
    },
  });

  // Update banner mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      bannerApi.updateBanner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      setEditingBanner(null);
      reset();
      setMediaPreview("");
      setMediaFile(null);
      setMobileMediaPreview("");
      setMobileMediaFile(null);
      setShowCreateModal(false);
      toast.success("Banner updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update banner");
    },
  });

  // Delete banner mutation
  const deleteMutation = useMutation({
    mutationFn: bannerApi.deleteBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Banner deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete banner");
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createBannerSchema),
    defaultValues: {
      type: "IMAGE",
      isActive: true,
      order: 0,
    },
  });

  // Helper to extract URLs from upload response
  const extractUrls = (res: any): string[] => {
    if (Array.isArray(res))
      return res.map((r) => (typeof r === "string" ? r : r.url || ""));
    if (Array.isArray(res?.files))
      return res.files.map((r: any) =>
        typeof r === "string" ? r : r.url || "",
      );
    if (Array.isArray(res?.data?.files))
      return res.data.files.map((r: any) =>
        typeof r === "string" ? r : r.url || "",
      );
    if (Array.isArray(res?.data))
      return res.data.map((r: any) =>
        typeof r === "string" ? r : r.url || "",
      );
    if (Array.isArray(res?.urls))
      return res.urls.map((r: any) =>
        typeof r === "string" ? r : r.url || "",
      );
    if (res?.url) return [res.url];
    if (res?.data?.url) return [res.data.url];
    return [];
  };

  const onSubmit = async (data: CreateBannerFormData) => {
    try {
      let mediaUrl = data.url || "";
      let mobileMediaUrl = data.mobileUrl || mobileMediaPreview || "";

      // ✅ Clean up old desktop media if replacing
      if (mediaFile) {
        if (editingBanner?.url) {
          try {
            await s3Api.deleteFileByUrl(editingBanner.url);
          } catch (err) {
            console.error("Failed to delete old banner media:", err);
          }
        }
        if (editingBanner?.thumbnailUrl) {
          try {
            await s3Api.deleteFileByUrl(editingBanner.thumbnailUrl);
          } catch (err) {
            console.error("Failed to delete thumbnail:", err);
          }
        }
      }

      // ✅ Clean up old mobile media if replacing or clearing
      if (mediaType === "IMAGE") {
        if (mobileMediaFile && editingBanner?.mobileUrl) {
          try {
            await s3Api.deleteFileByUrl(editingBanner.mobileUrl);
          } catch (err) {
            console.error("Failed to delete old mobile banner:", err);
          }
        }
      } else if (!mobileMediaPreview && editingBanner?.mobileUrl) {
        // mobile image was removed
        try {
          await s3Api.deleteFileByUrl(editingBanner.mobileUrl);
        } catch (err) {
          console.error("Failed deleting cleared mobile banner:", err);
        }
        mobileMediaUrl = "";
      } else {
        mobileMediaUrl = "";
      }

      // ✅ Collect files to upload via uploadMultiple
      const filesToUpload: { file: File; target: "desktop" | "mobile" }[] = [];
      if (mediaFile) {
        filesToUpload.push({ file: mediaFile, target: "desktop" });
      }
      if (mediaType === "IMAGE" && mobileMediaFile) {
        filesToUpload.push({ file: mobileMediaFile, target: "mobile" });
      }

      if (filesToUpload.length > 0) {
        setIsUploadingMedia(true);
        const uploadToast = toast.loading(
          filesToUpload.length > 1
            ? "Uploading desktop & mobile images..."
            : `Uploading ${filesToUpload[0].target === "desktop" ? (mediaType === "IMAGE" ? "desktop image" : "video") : "mobile image"}...`,
        );

        try {
          const response = await s3Api.uploadMultiple(
            filesToUpload.map((item) => item.file),
            "banners",
          );

          const urls = extractUrls(response);
          filesToUpload.forEach((item, i) => {
            if (item.target === "desktop" && urls[i]) {
              mediaUrl = urls[i];
            } else if (item.target === "mobile" && urls[i]) {
              mobileMediaUrl = urls[i];
            }
          });

          toast.success("Media uploaded successfully!", { id: uploadToast });
        } catch (error: any) {
          console.error("Banner media upload error:", error);
          toast.error(
            error?.response?.data?.message || "Failed to upload media",
            { id: uploadToast },
          );
          throw error;
        } finally {
          setIsUploadingMedia(false);
        }
      }

      const submitData = {
        ...data,
        url: mediaUrl,
        mobileUrl: mobileMediaUrl || undefined,
        type: mediaType,
        link: data.link || undefined,
        text: data.text || undefined,
        thumbnailUrl: data.thumbnailUrl || undefined,
      };

      if (editingBanner) {
        await updateMutation.mutateAsync({
          id: editingBanner.id,
          data: submitData,
        });
      } else {
        await createMutation.mutateAsync(submitData);
      }
    } catch (error) {
      console.error("Banner submit error:", error);
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setValue("title", banner.title);
    setValue("type", banner.type);
    setValue("url", banner.url);
    setValue("mobileUrl", banner.mobileUrl || "");
    setValue("link", banner.link || "");
    setValue("text", banner.text || "");
    setValue("thumbnailUrl", banner.thumbnailUrl || "");
    setValue("isActive", banner.isActive);
    setValue("order", banner.order);
    setMediaPreview(
      banner.type === "VIDEO" ? banner.thumbnailUrl || banner.url : banner.url,
    );
    setMobileMediaPreview(banner.mobileUrl || "");
    setMediaType(banner.type);
    setMediaFile(null);
    setMobileMediaFile(null);
    setShowCreateModal(true);
  };

  const handleDelete = async (banner: Banner) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) {
      return;
    }

    try {
      // ✅ delete banner media
      if (banner.url) {
        try {
          await s3Api.deleteFileByUrl(banner.url);
        } catch (err) {
          console.error("Failed deleting banner media:", err);
        }
      }

      // ✅ delete mobile banner media if exists
      if (banner.mobileUrl) {
        try {
          await s3Api.deleteFileByUrl(banner.mobileUrl);
        } catch (err) {
          console.error("Failed deleting mobile banner:", err);
        }
      }

      // ✅ delete thumbnail too if exists
      if (banner.thumbnailUrl) {
        try {
          await s3Api.deleteFileByUrl(banner.thumbnailUrl);
        } catch (err) {
          console.error("Failed deleting thumbnail:", err);
        }
      }

      deleteMutation.mutate(banner.id);
    } catch (error) {
      console.error(error);
    }
  };

  // Handle media selection from MediaUploadManager (Desktop)
  const handleMediaSelect = (file: File, preview: string) => {
    setMediaFile(file);
    setMediaPreview(preview);
    setValue("url", preview, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  // Handle mobile media selection from MediaUploadManager (Mobile)
  const handleMobileMediaSelect = (file: File, preview: string) => {
    setMobileMediaFile(file);
    setMobileMediaPreview(preview);
    setValue("mobileUrl", preview, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleMobileMediaClear = () => {
    setMobileMediaFile(null);
    setMobileMediaPreview("");
    setValue("mobileUrl", "", {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const totalBanners = bannersData?.banners?.length || 0;
  const activeBanners =
    bannersData?.banners?.filter((b) => b.isActive).length || 0;
  const imageBanners =
    bannersData?.banners?.filter((b) => b.type === "IMAGE").length || 0;
  const videoBanners =
    bannersData?.banners?.filter((b) => b.type === "VIDEO").length || 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                Banners
              </h1>
              <p className="text-sm text-gray-600 mt-2">
                Manage promotional banners and media
              </p>
            </div>
          </div>

          {canCreate && (
            <button
              onClick={() => {
                setEditingBanner(null);
                reset({
                  title: "",
                  type: "IMAGE",
                  url: "",
                  mobileUrl: "",
                  link: "",
                  text: "",
                  thumbnailUrl: "",
                  isActive: true,
                  order: 0,
                });
                setMediaPreview("");
                setMediaFile(null);
                setMobileMediaPreview("");
                setMobileMediaFile(null);
                setMediaType("IMAGE");
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl font-medium"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Banner</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalBanners}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {activeBanners}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Images</p>
                <p className="text-2xl font-bold text-purple-600">
                  {imageBanners}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Videos</p>
                <p className="text-2xl font-bold text-pink-600">
                  {videoBanners}
                </p>
              </div>
              <div className="h-12 w-12 bg-pink-100 rounded-full flex items-center justify-center">
                <Video className="h-6 w-6 text-pink-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="ALL">All Types</option>
              <option value="IMAGE">Images Only</option>
              <option value="VIDEO">Videos Only</option>
            </select>

            <select
              value={
                filterActive === undefined
                  ? "all"
                  : filterActive
                    ? "active"
                    : "inactive"
              }
              onChange={(e) => {
                const value = e.target.value;
                setFilterActive(
                  value === "all" ? undefined : value === "active",
                );
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Banners Grid */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading banners...</p>
          </div>
        ) : bannersData?.banners?.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Sparkles className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-semibold">
              No banners found
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {filterType !== "ALL" || filterActive !== undefined
                ? "Try adjusting your filters"
                : "Create your first banner to get started"}
            </p>
            {canCreate && !filterType && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
              >
                Create First Banner
              </button>
            )}
          </div>
        ) : (
          <BannerHeroCarousel
            banners={bannersData?.banners || []}
            onEdit={handleEdit}
            onDelete={handleDelete}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white px-6 py-4 flex items-center justify-between z-10 rounded-t-xl">
                <h2 className="text-xl font-bold">
                  {editingBanner ? "Edit Banner" : "Create Banner"}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingBanner(null);
                    reset();
                    setMediaPreview("");
                    setMediaFile(null);
                    setMobileMediaPreview("");
                    setMobileMediaFile(null);
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                  disabled={
                    isUploadingMedia ||
                    createMutation.isPending ||
                    updateMutation.isPending
                  }
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    {...register("title")}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Summer Sale Banner"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                {/* Media Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Media Type *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setMediaType("IMAGE");
                        setValue("type", "IMAGE");
                        setMediaPreview("");
                        setMediaFile(null);
                      }}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        mediaType === "IMAGE"
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <ImageIcon className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <p className="text-sm font-medium">Image</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMediaType("VIDEO");
                        setValue("type", "VIDEO");
                        setMediaPreview("");
                        setMediaFile(null);
                      }}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        mediaType === "VIDEO"
                          ? "border-pink-500 bg-pink-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Video className="h-8 w-8 mx-auto mb-2 text-pink-600" />
                      <p className="text-sm font-medium">Video</p>
                    </button>
                  </div>
                </div>

                {/* Desktop / Main Media Upload Manager */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="block text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                      <Monitor className="h-4 w-4 text-blue-600" />
                      {mediaType === "IMAGE"
                        ? "Desktop View Image *"
                        : "Video Media *"}
                    </label>
                    {mediaType === "IMAGE" && (
                      <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full w-fit">
                        Landscape 16:9 ({BANNER_WIDTH} × {BANNER_HEIGHT})
                      </span>
                    )}
                  </div>

                  <MediaUploadManager
                    mediaType={mediaType}
                    onMediaSelect={handleMediaSelect}
                    onMediaClear={() => {
                      setMediaFile(null);
                      setMediaPreview("");
                      setValue("url", "", {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                    currentPreview={mediaPreview}
                    targetWidth={BANNER_WIDTH}
                    targetHeight={BANNER_HEIGHT}
                    maxSizeMB={mediaType === "IMAGE" ? 30 : 50}
                    maxOutputWidth={3840}
                  />

                  {/* Desktop Banner Requirements */}
                  {mediaType === "IMAGE" && (
                    <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-900 space-y-1">
                      <p className="font-semibold flex items-center gap-1 text-blue-900">
                        <Info className="h-3.5 w-3.5 text-blue-600" /> Desktop
                        Display Optimization:
                      </p>
                      <p className="text-blue-800">
                        Select a wide 16:9 crop (1920 × 1080) for full-width
                        desktop screens. Important subjects should be centered.
                      </p>
                    </div>
                  )}

                  {errors.url && (
                    <p className="text-sm text-red-600">{errors.url.message}</p>
                  )}
                </div>

                {/* Mobile View Image Upload Manager (For Images Only) */}
                {mediaType === "IMAGE" && (
                  <div className="space-y-2 pt-4 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                          <Smartphone className="h-4 w-4 text-purple-600" />
                          Mobile View Image
                          <span className="text-xs font-normal text-gray-500">
                            (Optional / Recommended)
                          </span>
                        </label>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Automatically served to mobile visitors so the image
                          fits phone screens naturally without edge trimming.
                        </p>
                      </div>
                      <span className="text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full w-fit">
                        Portrait 9:16 ({MOBILE_BANNER_WIDTH} ×{" "}
                        {MOBILE_BANNER_HEIGHT})
                      </span>
                    </div>

                    <MediaUploadManager
                      mediaType="IMAGE"
                      onMediaSelect={handleMobileMediaSelect}
                      onMediaClear={handleMobileMediaClear}
                      currentPreview={mobileMediaPreview}
                      targetWidth={MOBILE_BANNER_WIDTH}
                      targetHeight={MOBILE_BANNER_HEIGHT}
                      maxSizeMB={30}
                      maxOutputWidth={2160}
                    />

                    {mobileMediaPreview ? (
                      <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
                        <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        <span>
                          Dedicated mobile view image is set and will be used on
                          phones.
                        </span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 italic">
                        If no mobile image is uploaded, mobile devices will fall
                        back to displaying the desktop image.
                      </p>
                    )}
                  </div>
                )}

                {/* Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link URL (Optional)
                  </label>
                  <input
                    {...register("link")}
                    type="url"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://example.com/sale"
                  />
                  {errors.link && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.link.message}
                    </p>
                  )}
                </div>

                {/* Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    {...register("text")}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Banner description..."
                  />
                  {errors.text && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.text.message}
                    </p>
                  )}
                </div>

                {/* Video Thumbnail */}
                {mediaType === "VIDEO" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thumbnail URL (Optional)
                    </label>
                    <input
                      {...register("thumbnailUrl")}
                      type="url"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="https://example.com/thumbnail.jpg"
                    />
                  </div>
                )}

                {/* Order & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Order
                    </label>
                    <input
                      {...register("order", { valueAsNumber: true })}
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <div className="flex items-center h-10">
                      <input
                        {...register("isActive")}
                        type="checkbox"
                        className="h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingBanner(null);
                      reset();
                      setMediaPreview("");
                      setMediaFile(null);
                      setMobileMediaPreview("");
                      setMobileMediaFile(null);
                    }}
                    disabled={
                      isUploadingMedia ||
                      createMutation.isPending ||
                      updateMutation.isPending
                    }
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isUploadingMedia ||
                      createMutation.isPending ||
                      updateMutation.isPending
                    }
                    className="px-6 py-2 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isUploadingMedia ||
                    createMutation.isPending ||
                    updateMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {isUploadingMedia ? "Uploading..." : "Saving..."}
                      </>
                    ) : editingBanner ? (
                      "Update Banner"
                    ) : (
                      "Create Banner"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Read-Only Notice */}
        {!canCreate && !canUpdate && !canDelete && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              You have read-only access to banners. Contact your administrator
              for permissions.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default BannersPage;
