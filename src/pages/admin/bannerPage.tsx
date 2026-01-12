import React, { useState } from "react";
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
  Upload,
  X,
  Image as ImageIcon,
  Video,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Type,
  Hash,
  Clock,
  FileImage,
  Play,
  Pause,
  Loader2,
  ExternalLink,
  GripVertical,
  Sparkles,
} from "lucide-react";
import {
  bannerApi,
  type Banner,
  type QueryBannerParams,
} from "@/lib/api/banner.api";
import { s3Api } from "@/lib/api/s3.api";
import {
  createBannerSchema,
  type CreateBannerFormData,
} from "@/lib/types/banner/schema";
// Banner Card Component
const BannerCard: React.FC<{
  banner: Banner;
  onEdit: (banner: Banner) => void;
  onDelete: (id: string) => void;
  canUpdate: boolean;
  canDelete: boolean;
}> = ({ banner, onEdit, onDelete, canUpdate, canDelete }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Media Section */}
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
        {banner.type === "VIDEO" ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              src={banner.url}
              poster={banner.thumbnailUrl}
              className="w-full h-full object-cover"
              loop
              muted
            />
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-all"
            >
              {isPlaying ? (
                <Pause className="h-12 w-12 text-white" />
              ) : (
                <Play className="h-12 w-12 text-white" />
              )}
            </button>
            <div className="absolute top-2 left-2 px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
              <Video className="h-3 w-3" />
              VIDEO
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full">
            <img
              src={banner.url}
              alt={banner.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              IMAGE
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <span
            className={`px-2 py-1 text-xs font-bold rounded-full flex items-center gap-1 ${
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

        {/* Order Badge */}
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-70 text-white text-xs font-bold rounded">
          Order: {banner.order}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
          {banner.title}
        </h3>

        {banner.text && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {banner.text}
          </p>
        )}

        {/* Meta Info */}
        <div className="space-y-2 mb-4">
          {banner.link && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <LinkIcon className="h-3 w-3" />
              <a
                href={banner.link}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate hover:text-blue-600"
              >
                {banner.link}
              </a>
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500">
            {banner.width && banner.height && (
              <span className="flex items-center gap-1">
                <FileImage className="h-3 w-3" />
                {banner.width}×{banner.height}
              </span>
            )}
            {banner.duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {banner.duration}s
              </span>
            )}
            {banner.fileSize && (
              <span className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {(banner.fileSize / (1024 * 1024)).toFixed(2)}MB
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {(canUpdate || canDelete) && (
          <div className="flex gap-2 pt-3 border-t border-gray-200">
            {canUpdate && (
              <button
                onClick={() => onEdit(banner)}
                className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(banner.id)}
                className="flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const BannersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO">("IMAGE");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [filterType, setFilterType] = useState<"ALL" | "IMAGE" | "VIDEO">(
    "ALL"
  );
  const [filterActive, setFilterActive] = useState<boolean | undefined>(
    undefined
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
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createBannerSchema),
    defaultValues: {
      type: "IMAGE",
      isActive: true,
      order: 0,
    },
  });

  const watchedType = watch("type");

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleMediaFile(file);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleMediaFile(file);
    }
    e.target.value = "";
  };

  // Process media file with validation
  const handleMediaFile = (file: File) => {
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast.error("Please select a valid image or video file");
      return;
    }

    // Validate file size (10MB for images, 50MB for videos)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(
        `File size must be less than ${
          isVideo ? "40MB" : "10MB"
        }. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`
      );
      return;
    }
    console.log("errors", errors);

    setMediaFile(file);
    setMediaType(isImage ? "IMAGE" : "VIDEO");
    setValue("type", isImage ? "IMAGE" : "VIDEO");

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setMediaPreview(result);
      // 🔑 THIS IS THE MISSING LINE
      setValue("url", result, {
        shouldValidate: true,
        shouldDirty: true,
      });
    };
    reader.readAsDataURL(file);
  };

  // Upload media to S3
  const uploadMediaToS3 = async (): Promise<string | null> => {
    if (!mediaFile) return null;

    setIsUploadingMedia(true);
    const uploadToast = toast.loading(
      `Uploading ${mediaType.toLowerCase()} ...`
    );

    try {
      const response = await s3Api.uploadSingle(mediaFile, "banners");

      if (!response.success) {
        throw new Error("Failed to upload media");
      }

      toast.success("Media uploaded successfully!", { id: uploadToast });
      return response.url;
    } catch (error: any) {
      console.error("Media upload error:", error);
      toast.error(error?.response?.data?.message || "Failed to upload media", {
        id: uploadToast,
      });
      throw error;
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const onSubmit = async (data: CreateBannerFormData) => {
    try {
      // Upload media to S3 if there's a new file
      let mediaUrl = data.url || "";
      if (mediaFile) {
        const uploadedUrl = await uploadMediaToS3();
        if (uploadedUrl) {
          mediaUrl = uploadedUrl;
        }
      }

      const submitData = {
        ...data,
        url: mediaUrl,
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
    setValue("link", banner.link || "");
    setValue("text", banner.text || "");
    setValue("thumbnailUrl", banner.thumbnailUrl || "");
    setValue("isActive", banner.isActive);
    setValue("order", banner.order);
    setMediaPreview(
      banner.type === "VIDEO" ? banner.thumbnailUrl || banner.url : banner.url
    );
    setMediaType(banner.type);
    setMediaFile(null);
    setShowCreateModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this banner?")) {
      deleteMutation.mutate(id);
    }
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

          {canCreate && (
            <button
              onClick={() => {
                setEditingBanner(null);
                reset({
                  title: "",
                  type: "IMAGE",
                  url: "",
                  link: "",
                  text: "",
                  thumbnailUrl: "",
                  isActive: true,
                  order: 0,
                });
                setMediaPreview("");
                setMediaFile(null);
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
                  value === "all" ? undefined : value === "active"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {bannersData?.banners?.map((banner) => (
              <BannerCard
                key={banner.id}
                banner={banner}
                onEdit={handleEdit}
                onDelete={handleDelete}
                canUpdate={canUpdate}
                canDelete={canDelete}
              />
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
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

                {/* Media Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {mediaType === "VIDEO" ? "Video" : "Image"} *
                  </label>
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      isDragging
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {mediaPreview ? (
                      <div className="relative inline-block">
                        {mediaType === "VIDEO" ? (
                          <video
                            src={mediaPreview}
                            className="h-40 w-auto rounded-lg"
                            controls
                          />
                        ) : (
                          <img
                            src={mediaPreview}
                            alt="Preview"
                            className="h-40 w-auto object-cover rounded-lg"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setMediaPreview("");
                            setMediaFile(null);
                            setValue("url", "");
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          Drag & drop {mediaType.toLowerCase()} here, or click
                          to select
                        </p>
                        <p className="text-xs text-gray-500 mb-2">
                          {mediaType === "VIDEO"
                            ? "MP4, WEBM up to 50MB"
                            : "PNG, JPG, WEBP up to 10MB"}
                        </p>
                        <input
                          type="file"
                          accept={mediaType === "VIDEO" ? "video/*" : "image/*"}
                          onChange={handleFileSelect}
                          className="hidden"
                          id="media-upload"
                        />
                        <label
                          htmlFor="media-upload"
                          className="cursor-pointer text-purple-600 hover:text-purple-700 font-medium"
                        >
                          Browse files
                        </label>
                      </>
                    )}
                  </div>
                </div>

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
