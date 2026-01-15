import React, { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layouts/mainLayout";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Home,
  Search,
  Star,
  Calendar,
  Tag,
  Package,
  Grid3x3,
  List,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Layers,
  Save,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  Palette,
  Layout as LayoutIcon,
  Eye,
  EyeOff,
  Upload,
  PlayCircle,
  GripVertical,
  ExternalLink,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { homeSectionApi } from "@/lib/api/homesection.api";
import { productApi } from "@/lib/api/product.api";
import { categoryApi } from "@/lib/api/category.api";

import type {
  HomeSection,
  SectionMedia,
  SectionCTA,
  SectionType,
  MediaType,
  CTAStyle,
  SectionMediaForm,
} from "@/lib/types/heroSection/herosection";
import {
  createHomeSectionSchema,
  type CreateHomeSectionFormData,
} from "@/lib/types/heroSection/schema";
import { ImageUpload } from "@/components/ui/imageUpload";
import { SectionTypeSelector } from "@/components/ui/Sectiontypeselector";
import { s3Api } from "@/lib/api/s3.api";
import toast from "react-hot-toast";
import { CategoryProductSelector } from "@/components/Categoryproductselector";

// Section Type Configuration
const getSectionConfig = (type: SectionType) => {
  const configs = {
    HERO_SLIDER: {
      icon: "🎠",
      label: "Hero Slider",
      color: "purple",
      bgColor: "bg-purple-100",
      textColor: "text-purple-700",
    },
    FEATURED: {
      icon: "⭐",
      label: "Featured",
      color: "yellow",
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-700",
    },
    NEW_ARRIVALS: {
      icon: "✨",
      label: "New Arrivals",
      color: "blue",
      bgColor: "bg-blue-100",
      textColor: "text-blue-700",
    },
    COLLECTIONS: {
      icon: "📦",
      label: "Collections",
      color: "green",
      bgColor: "bg-green-100",
      textColor: "text-green-700",
    },
    CATEGORIES: {
      icon: "🏷️",
      label: "Categories",
      color: "pink",
      bgColor: "bg-pink-100",
      textColor: "text-pink-700",
    },
    BEST_SELLERS: {
      icon: "📈",
      label: "Best Sellers",
      color: "red",
      bgColor: "bg-red-100",
      textColor: "text-red-700",
    },
    TRENDING: {
      icon: "🔥",
      label: "Trending",
      color: "orange",
      bgColor: "bg-orange-100",
      textColor: "text-orange-700",
    },
    SEASONAL: {
      icon: "📅",
      label: "Seasonal",
      color: "indigo",
      bgColor: "bg-indigo-100",
      textColor: "text-indigo-700",
    },
    CATEGORY_SPOTLIGHT: {
      icon: "🎯",
      label: "Category Spotlight",
      color: "teal",
      bgColor: "bg-teal-100",
      textColor: "text-teal-700",
    },
    CUSTOM: {
      icon: "✏️",
      label: "Custom",
      color: "gray",
      bgColor: "bg-gray-100",
      textColor: "text-gray-700",
    },
  };
  return configs[type] || configs.FEATURED;
};

// Stats Card Component
const StatsCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}> = ({ icon, label, value, color }) => {
  const colorClasses = {
    purple: "bg-purple-100 text-purple-600",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div
          className={`h-12 w-12 rounded-full flex items-center justify-center ${
            colorClasses[color as keyof typeof colorClasses]
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

// Enhanced Section Card with Media Preview
const SectionCard: React.FC<{
  section: HomeSection;
  onEdit: (section: HomeSection) => void;
  onDelete: (id: string) => void;
  canUpdate: boolean;
  canDelete: boolean;
}> = ({ section, onEdit, onDelete, canUpdate, canDelete }) => {
  const config = getSectionConfig(section.type);

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-200 hover:border-blue-400">
      {/* Header */}
      <div
        className={`${config.bgColor} p-4 flex items-center justify-between`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{section.title}</h3>
            <p className={`text-xs font-medium ${config.textColor}`}>
              {section.customTypeName || config.label}
            </p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            section.isActive
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {section.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Media Preview */}
      {section.media && section.media.length > 0 && (
        <div className="relative h-48 bg-gray-100">
          {section.media[0].type === "IMAGE" ? (
            <img
              src={section.media[0].url}
              alt={section.media[0].altText || section.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <PlayCircle className="h-16 w-16 text-white opacity-70" />
            </div>
          )}
          {section.media.length > 1 && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-semibold">
              +{section.media.length - 1} more
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <div className="p-4 space-y-3">
        {section.subtitle && (
          <p className="text-sm text-gray-600 italic">{section.subtitle}</p>
        )}

        {/* Layout Info */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <LayoutIcon className="h-4 w-4" />
          <span className="capitalize">{section.layout || "grid"}</span>
          {section.layout === "grid" && (
            <span className="text-xs text-gray-500">
              • {section.columns || 4} columns
            </span>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-200">
          <div className="text-center">
            <ImageIcon className="h-4 w-4 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Media</p>
            <p className="text-sm font-bold text-gray-900">
              {section.media?.length || 0}
            </p>
          </div>
          <div className="text-center">
            <LinkIcon className="h-4 w-4 text-purple-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">CTAs</p>
            <p className="text-sm font-bold text-gray-900">
              {section.ctaButtons?.length || 0}
            </p>
          </div>
          <div className="text-center">
            <Package className="h-4 w-4 text-green-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Products</p>
            <p className="text-sm font-bold text-gray-900">
              {section.products?.length || 0}
            </p>
          </div>
          <div className="text-center">
            <Tag className="h-4 w-4 text-orange-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Categories</p>
            <p className="text-sm font-bold text-gray-900">
              {section.categories?.length || 0}
            </p>
          </div>
        </div>

        {/* CTA Buttons Preview */}
        {section.ctaButtons && section.ctaButtons.length > 0 && (
          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-2">CTA Buttons:</p>
            <div className="flex flex-wrap gap-2">
              {section.ctaButtons.slice(0, 2).map((cta, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                >
                  {cta.text}
                </span>
              ))}
              {section.ctaButtons.length > 2 && (
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                  +{section.ctaButtons.length - 2} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {(canUpdate || canDelete) && (
          <div className="flex gap-2 pt-3 border-t border-gray-200">
            {canUpdate && (
              <button
                onClick={() => onEdit(section)}
                className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(section.id)}
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

// Main Component
export const HomeSectionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  // Permissions
  const canCreate = hasPermission("home-sections", "canCreate");
  const canUpdate = hasPermission("home-sections", "canUpdate");
  const canDelete = hasPermission("home-sections", "canDelete");

  // UI State
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState<HomeSection | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | undefined>(
    undefined
  );
  const [filterType, setFilterType] = useState<SectionType | undefined>(
    undefined
  );
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Form State
  const [media, setMedia] = useState<SectionMediaForm[]>([]);
  const [ctaButtons, setCtaButtons] = useState<SectionCTA[]>([]);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#000000");
  const [layout, setLayout] = useState("grid");
  const [columns, setColumns] = useState(4);

  // Media Modal State
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [editingMediaIndex, setEditingMediaIndex] = useState<number | null>(
    null
  );
  const [currentMedia, setCurrentMedia] = useState<Partial<SectionMediaForm>>({
    type: "IMAGE",
    url: "",
    order: 0,
    overlayPosition: "center",
  });

  // CTA Modal State
  const [showCTAModal, setShowCTAModal] = useState(false);
  const [editingCTAIndex, setEditingCTAIndex] = useState<number | null>(null);
  const [currentCTA, setCurrentCTA] = useState<Partial<SectionCTA>>({
    text: "",
    url: "",
    style: "PRIMARY",
    order: 0,
    openNewTab: false,
  });

  // Fetch sections
  const { data: sectionsData, isLoading } = useQuery({
    queryKey: ["home-sections", filterActive, filterType],
    queryFn: async () => {
      const response = await homeSectionApi.getHomeSections({
        limit: 100,
        isActive: filterActive,
        type: filterType,
      });
      return response.data;
    },
  });

  // Fetch products
  const { data: productsData } = useQuery({
    queryKey: ["products-all"],
    queryFn: async () => {
      const response = await productApi.getProducts({ limit: 100 });
      return response.data;
    },
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => {
      const response = await categoryApi.getCategories({ limit: 100 });
      return response.data;
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: homeSectionApi.createHomeSection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-sections"] });
      setShowModal(false);
      resetForm();
      toast.success("Home section created successfully!");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to create home seciton"
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      homeSectionApi.updateHomeSection(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-sections"] });
      setEditingSection(null);
      setShowModal(false);
      resetForm();
      toast.success("Home section updated successfully!");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update home section"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: homeSectionApi.deleteHomeSection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-sections"] });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<CreateHomeSectionFormData>({
    resolver: zodResolver(
      createHomeSectionSchema
    ) as Resolver<CreateHomeSectionFormData>,
  });

  // Watch form values
  const selectedType = watch("type");

  // Reset form
  const resetForm = () => {
    reset();
    setMedia([]);
    setCtaButtons([]);
    setValue("customTypeName", "");
    setBackgroundColor("#ffffff");
    setTextColor("#000000");
    setLayout("grid");
    setColumns(4);
  };

  // Handle Edit Section
  const handleEdit = (section: HomeSection) => {
    setEditingSection(section);
    setValue("type", section.type as any);
    setValue("title", section.title);
    setValue("subtitle", section.subtitle || "");
    setValue("description", section.description || "");
    setValue("isActive", section.isActive);
    setValue("order", section.order);
    setValue("limit", section.limit);
    setValue("showTitle", section.showTitle);
    setValue("showSubtitle", section.showSubtitle);
    setValue("productIds", section.products?.map((p) => p.id.toString()) || []);
    setValue(
      "categoryIds",
      section.categories?.map((c) => c.id.toString()) || []
    );

    setValue("customTypeName", section.customTypeName || "");
    setBackgroundColor(section.backgroundColor || "#ffffff");
    setTextColor(section.textColor || "#000000");
    setLayout(section.layout || "grid");
    setColumns(section.columns || 4);
    setMedia(section.media || []);
    setCtaButtons(section.ctaButtons || []);

    setShowModal(true);
  };

  // Handle Delete
  const handleDelete = (id: string) => {
    if (window.confirm("Delete this section? This cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  // Submit Form
  const onSubmit = async (data: CreateHomeSectionFormData) => {
    setIsUploadingImage(true);
    const uploadToast = toast.loading("Uploading image...");

    try {
      const uploadedMedia = await Promise.all(
        media.map(async (m, idx) => {
          let url = m.url ?? "";

          if (m.file) {
            const res = await s3Api.uploadSingle(m.file, "home-sections");
            url = res.url;
          }

          return {
            type: m.type,
            url,
            order: idx,
            overlayPosition: m.overlayPosition,
            overlayTitle: m.overlayTitle,
            overlaySubtitle: m.overlaySubtitle,
          };
        })
      );

      const payload = {
        ...data,
        customTypeName:
          selectedType === "CUSTOM" ? getValues("customTypeName") : undefined,
        backgroundColor,
        textColor,
        layout,
        columns: layout === "grid" ? columns : undefined,
        media: uploadedMedia,
        ctaButtons: ctaButtons.map((c, idx) => ({
          ...c,
          order: idx,
        })),
      };

      if (editingSection) {
        updateMutation.mutate(
          { id: editingSection.id, data: payload },
          {
            onSuccess: () => {
              toast.success("Section updated successfully", {
                id: uploadToast,
              });
            },
          }
        );
      } else {
        createMutation.mutate(payload, {
          onSuccess: () => {
            toast.success("Section created successfully", {
              id: uploadToast,
            });
          },
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Image upload failed", {
        id: uploadToast,
      });
    } finally {
      setIsUploadingImage(false);
    }
  };


  // Media Handlers
  const handleAddMedia = () => {
    if (editingMediaIndex !== null) {
      const updated = [...media];
      updated[editingMediaIndex] = currentMedia as SectionMedia;
      setMedia(updated);
    } else {
      setMedia([
        ...media,
        { ...currentMedia, order: media.length } as SectionMedia,
      ]);
    }
    setShowMediaModal(false);
    setCurrentMedia({
      type: "IMAGE",
      url: "",
      order: 0,
      overlayPosition: "center",
    });
    setEditingMediaIndex(null);
  };

  const handleEditMedia = (index: number) => {
    setCurrentMedia(media[index]);
    setEditingMediaIndex(index);
    setShowMediaModal(true);
  };

  const handleDeleteMedia = (index: number) => {
    setMedia(media.filter((_, i) => i !== index));
  };

  const handleMoveMedia = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= media.length) return;

    const updated = [...media];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setMedia(updated);
  };

  // CTA Handlers
  const handleAddCTA = () => {
    if (editingCTAIndex !== null) {
      const updated = [...ctaButtons];
      updated[editingCTAIndex] = currentCTA as SectionCTA;
      setCtaButtons(updated);
    } else {
      setCtaButtons([
        ...ctaButtons,
        { ...currentCTA, order: ctaButtons.length } as SectionCTA,
      ]);
    }
    setShowCTAModal(false);
    setCurrentCTA({
      text: "",
      url: "",
      style: "PRIMARY",
      order: 0,
      openNewTab: false,
    });
    setEditingCTAIndex(null);
  };

  const handleEditCTA = (index: number) => {
    setCurrentCTA(ctaButtons[index]);
    setEditingCTAIndex(index);
    setShowCTAModal(true);
  };

  const handleDeleteCTA = (index: number) => {
    setCtaButtons(ctaButtons.filter((_, i) => i !== index));
  };

  const handleMoveCTA = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= ctaButtons.length) return;

    const updated = [...ctaButtons];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setCtaButtons(updated);
  };

  // Calculate stats
  const totalSections = sectionsData?.sections?.length || 0;
  const activeSections =
    sectionsData?.sections?.filter((s) => s.isActive).length || 0;
  const inactiveSections = totalSections - activeSections;

  // Filter sections
  const filteredSections =
    sectionsData?.sections?.filter(
      (section) =>
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  console.log("media", media);
  console.log("currentMedia", currentMedia);
  console.log("selectedType", selectedType);
  console.log("errors", errors);
  console.log("customTypeName", getValues("customTypeName"));

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <Home className="h-7 w-7 text-white" />
              </div>
              Home Sections
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              Manage homepage sections with media, CTAs, and styling
            </p>
          </div>

          {canCreate && (
            <button
              onClick={() => {
                setEditingSection(null);
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl font-medium"
            >
              <Plus className="h-4 w-4" />
              Add Section
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={<Home className="h-6 w-6" />}
            label="Total Sections"
            value={totalSections}
            color="purple"
          />
          <StatsCard
            icon={<CheckCircle className="h-6 w-6" />}
            label="Active"
            value={activeSections}
            color="green"
          />
          <StatsCard
            icon={<XCircle className="h-6 w-6" />}
            label="Inactive"
            value={inactiveSections}
            color="orange"
          />
          <StatsCard
            icon={<Star className="h-6 w-6" />}
            label="Featured"
            value={
              sectionsData?.sections?.filter((s) => s.type === "FEATURED")
                .length || 0
            }
            color="blue"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sections..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <select
              value={filterType || ""}
              onChange={(e) =>
                setFilterType((e.target.value as SectionType) || undefined)
              }
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="">All Types</option>
              <option value="HERO_SLIDER">Hero Slider</option>
              <option value="FEATURED">Featured</option>
              <option value="NEW_ARRIVALS">New Arrivals</option>
              <option value="COLLECTIONS">Collections</option>
              <option value="CATEGORIES">Categories</option>
              <option value="BEST_SELLERS">Best Sellers</option>
              <option value="TRENDING">Trending</option>
              <option value="SEASONAL">Seasonal</option>
              <option value="CATEGORY_SPOTLIGHT">Category Spotlight</option>
              <option value="CUSTOM">Custom</option>
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
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-white text-purple-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "table"
                    ? "bg-white text-purple-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Sections Display */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading sections...</p>
          </div>
        ) : filteredSections.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="h-10 w-10  text-indigo-600" />
            </div>

            <p className="text-gray-700 text-lg font-semibold">
              No sections found
            </p>
            <p className="text-gray-500 text-sm mt-2">
              {searchQuery
                ? "Try adjusting your filters"
                : "Create your first home section"}
            </p>
            {canCreate && !searchQuery && (
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                bg-gradient-to-br
                from-blue-500
                to-indigo-600
                className="mt-4 px-6 py-2 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium"
              >
                Create First Section
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSections.map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                onEdit={handleEdit}
                onDelete={handleDelete}
                canUpdate={canUpdate}
                canDelete={canDelete}
              />
            ))}
          </div>
        )}

        {/* CREATE/EDIT MODAL - PART 2 BELOW */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full my-8">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Home className="h-6 w-6" />
                  {editingSection ? "Edit Home Section" : "Create Home Section"}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingSection(null);
                    resetForm();
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* FORM CONTINUES IN NEXT MESSAGE DUE TO LENGTH */}
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto"
              >
                {/* 1. BASIC INFO SECTION */}
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Basic Information
                  </h3>

                  {/* Section Type Selector */}
                  <SectionTypeSelector
                    value={watch("type")}
                    onChange={(type, customName) => {
                      setValue("type", type as SectionType, {
                        shouldValidate: true,
                        shouldDirty: true,
                        shouldTouch: true,
                      });
                      setValue(
                        "customTypeName",
                        type === "CUSTOM" ? customName || "" : undefined,
                        {
                          shouldValidate: true,
                          shouldDirty: true,
                        }
                      );
                    }}
                    customTypeName={watch("customTypeName")}
                    error={errors.customTypeName?.message}
                  />

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      {...register("title")}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., Featured Products"
                    />
                    {errors.title && (
                      <p className="mt-1.5 text-sm text-red-600">
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  {/* Subtitle */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subtitle (Optional)
                    </label>
                    <input
                      {...register("subtitle")}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Add a descriptive subtitle..."
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      {...register("description")}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Add a longer description..."
                    />
                  </div>
                </div>

                {/* 2. MEDIA MANAGEMENT SECTION */}
                <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Media ({media.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentMedia({
                          type: "IMAGE",
                          url: "",
                          order: media.length,
                          overlayPosition: "center",
                        });
                        setEditingMediaIndex(null);
                        setShowMediaModal(true);
                      }}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Add Media
                    </button>
                  </div>

                  {/* Media List */}
                  <div className="space-y-2">
                    {media.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No media added yet</p>
                        <p className="text-xs">
                          Click "Add Media" to upload images or videos
                        </p>
                      </div>
                    ) : (
                      media.map((item, index) => (
                        <div
                          key={index}
                          className="bg-white p-3 rounded-lg border-2 border-gray-200 flex items-center gap-3"
                        >
                          {/* Thumbnail */}
                          <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                            {item.type === "IMAGE" ? (
                              <img
                                src={
                                  item.file
                                    ? URL.createObjectURL(item.file)
                                    : item.url
                                }
                                alt={item.altText || "Media"}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <Video className="h-8 w-8 text-gray-400" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {item.type === "IMAGE"
                                  ? "📷 Image"
                                  : "🎥 Video"}{" "}
                                #{index + 1}
                              </span>
                              {item.overlayTitle && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                  Has Overlay
                                </span>
                              )}
                            </div>
                            {item.title && (
                              <p className="text-xs text-gray-600 truncate">
                                {item.title}
                              </p>
                            )}
                            {item.overlayTitle && (
                              <p className="text-xs text-gray-500 truncate">
                                "{item.overlayTitle}"
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveMedia(index, "up")}
                              disabled={index === 0}
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveMedia(index, "down")}
                              disabled={index === media.length - 1}
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditMedia(index)}
                              className="p-1 text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMedia(index)}
                              className="p-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 3. CTA BUTTONS SECTION */}
                <div className="space-y-4 bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <LinkIcon className="h-5 w-5" />
                      CTA Buttons ({ctaButtons.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentCTA({
                          text: "",
                          url: "",
                          style: "PRIMARY",
                          order: ctaButtons.length,
                          openNewTab: false,
                        });
                        setEditingCTAIndex(null);
                        setShowCTAModal(true);
                      }}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700text-white rounded-lg text-sm font-medium flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Add Button
                    </button>
                  </div>

                  {/* CTA List */}
                  <div className="space-y-2">
                    {ctaButtons.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <LinkIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No CTA buttons added yet</p>
                        <p className="text-xs">
                          Click "Add Button" to create call-to-action buttons
                        </p>
                      </div>
                    ) : (
                      ctaButtons.map((cta, index) => (
                        <div
                          key={index}
                          className="bg-white p-3 rounded-lg border-2 border-gray-200 flex items-center gap-3"
                        >
                          {/* Style Badge */}
                          <div
                            className={`px-3 py-2 rounded text-xs font-semibold flex-shrink-0 ${
                              cta.style === "PRIMARY"
                                ? "bg-blue-600 text-white"
                                : cta.style === "SECONDARY"
                                ? "bg-gray-600 text-white"
                                : cta.style === "OUTLINE"
                                ? "border-2 border-blue-600 text-blue-600"
                                : "text-blue-600"
                            }`}
                          >
                            {cta.style}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {cta.text}
                            </p>
                            <p className="text-xs text-gray-600 truncate flex items-center gap-1">
                              {cta.url}
                              {cta.openNewTab && (
                                <ExternalLink className="h-3 w-3" />
                              )}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveCTA(index, "up")}
                              disabled={index === 0}
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveCTA(index, "down")}
                              disabled={index === ctaButtons.length - 1}
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditCTA(index)}
                              className="p-1 text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCTA(index)}
                              className="p-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 4. LAYOUT & STYLING SECTION */}
                <div className="space-y-4 bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Layout & Styling
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Layout */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Layout
                      </label>
                      <select
                        value={layout}
                        onChange={(e) => {
                          setLayout(e.target.value);
                          setValue("layout" as any, e.target.value);
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                      >
                        <option value="grid">Grid</option>
                        <option value="carousel">Carousel</option>
                        <option value="list">List</option>
                        <option value="banner">Banner</option>
                      </select>
                    </div>

                    {/* Columns (only for grid) */}
                    {layout === "grid" && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Columns
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={columns}
                          onChange={(e) => {
                            setColumns(Number(e.target.value));
                            setValue("columns" as any, Number(e.target.value));
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    )}

                    {/* Background Color */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Background Color
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => {
                            setBackgroundColor(e.target.value);
                            setValue("backgroundColor" as any, e.target.value);
                          }}
                          className="h-12 w-20 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={backgroundColor}
                          onChange={(e) => {
                            setBackgroundColor(e.target.value);
                            setValue("backgroundColor" as any, e.target.value);
                          }}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>

                    {/* Text Color */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Text Color
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={textColor}
                          onChange={(e) => {
                            setTextColor(e.target.value);
                            setValue("textColor" as any, e.target.value);
                          }}
                          className="h-12 w-20 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={textColor}
                          onChange={(e) => {
                            setTextColor(e.target.value);
                            setValue("textColor" as any, e.target.value);
                          }}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. CONTENT SELECTION */}
                <div className="space-y-4 bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Content Selection
                  </h3>

                  <CategoryProductSelector
                    products={
                      productsData?.products?.map((p) => ({
                        id: p.id.toString(),
                        name: p.name,
                        sellingPrice: p.sellingPrice,
                        media: p.media,
                        category: p.category
                          ? {
                              id: p.category.id.toString(),
                              name: p.category.name,
                            }
                          : undefined,
                      })) || []
                    }
                    categories={
                      categoriesData?.categories?.map((c) => ({
                        id: c.id.toString(),
                        name: c.name,
                        children: c.children?.map((child) => ({
                          id: child.id.toString(),
                          name: child.name,
                        })),
                      })) || []
                    }
                    selectedProductIds={watch("productIds") || []}
                    selectedCategoryIds={watch("categoryIds") || []}
                    onProductsChange={(ids) => setValue("productIds", ids)}
                    onCategoriesChange={(ids) => setValue("categoryIds", ids)}
                    isLoading={false}
                  />
                </div>

                {/* 6. DISPLAY SETTINGS */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Display Settings
                  </h3>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Display Order
                      </label>
                      <input
                        {...register("order")}
                        type="number"
                        min="0"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Lower = appears first
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Item Limit
                      </label>
                      <input
                        {...register("limit")}
                        type="number"
                        min="1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="8"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Max items to show
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switches */}
                  <div className="space-y-3 border-t border-gray-200 pt-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        {...register("showTitle")}
                        type="checkbox"
                        className="h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <div>
                        <span className="text-sm font-semibold text-gray-900">
                          Show Title
                        </span>
                        <p className="text-xs text-gray-500">
                          Display section title on homepage
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        {...register("showSubtitle")}
                        type="checkbox"
                        className="h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <div>
                        <span className="text-sm font-semibold text-gray-900">
                          Show Subtitle
                        </span>
                        <p className="text-xs text-gray-500">
                          Display section subtitle on homepage
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        {...register("isActive")}
                        type="checkbox"
                        className="h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <div>
                        <span className="text-sm font-semibold text-gray-900">
                          Active
                        </span>
                        <p className="text-xs text-gray-500">
                          Section visible to visitors
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingSection(null);
                      resetForm();
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                    className="px-6 py-3 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 font-medium"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {editingSection ? "Update" : "Create"} Section
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MEDIA MODAL */}
        {showMediaModal && (
          <div className="fixed inset-0 bg-black/65 bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
              <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
                <h3 className="text-lg font-bold">
                  {editingMediaIndex !== null ? "Edit Media" : "Add Media"}
                </h3>
                <button
                  onClick={() => {
                    setShowMediaModal(false);
                    setCurrentMedia({
                      type: "IMAGE",
                      url: "",
                      order: 0,
                      overlayPosition: "center",
                    });
                    setEditingMediaIndex(null);
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 h-[70vh] overflow-y-auto">
                {/* Media Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Media Type
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={currentMedia.type === "IMAGE"}
                        onChange={() =>
                          setCurrentMedia({ ...currentMedia, type: "IMAGE" })
                        }
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Image</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={currentMedia.type === "VIDEO"}
                        onChange={() =>
                          setCurrentMedia({ ...currentMedia, type: "VIDEO" })
                        }
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Video</span>
                    </label>
                  </div>
                </div>

                {/* Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {currentMedia.type === "IMAGE" ? "Image" : "Video"} *
                  </label>
                  <ImageUpload
                    value={currentMedia.file || currentMedia.url}
                    onChange={(file) =>
                      setCurrentMedia({ ...currentMedia, file })
                    }
                    accept={
                      currentMedia.type === "IMAGE" ? "image/*" : "video/*"
                    }
                    maxSizeMB={currentMedia.type === "IMAGE" ? 10 : 50}
                  />
                </div>

                {/* Thumbnail (for videos) */}
                {currentMedia.type === "VIDEO" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Thumbnail (Optional)
                    </label>
                    <ImageUpload
                      value={currentMedia.file || currentMedia.url}
                      onChange={(file) =>
                        setCurrentMedia({ ...currentMedia, file })
                      }
                      accept="image/*"
                      maxSizeMB={40}
                    />
                  </div>
                )}

                {/* Alt Text */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Alt Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={currentMedia.altText || ""}
                    onChange={(e) =>
                      setCurrentMedia({
                        ...currentMedia,
                        altText: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the media for accessibility"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={currentMedia.title || ""}
                    onChange={(e) =>
                      setCurrentMedia({
                        ...currentMedia,
                        title: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Media title"
                  />
                </div>

                {/* Overlay Text (for Hero Sliders) */}
                {selectedType === "HERO_SLIDER" && (
                  <>
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        Overlay Text (Optional)
                      </h4>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Overlay Title
                          </label>
                          <input
                            type="text"
                            value={currentMedia.overlayTitle || ""}
                            onChange={(e) =>
                              setCurrentMedia({
                                ...currentMedia,
                                overlayTitle: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Summer Sale"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Overlay Subtitle
                          </label>
                          <input
                            type="text"
                            value={currentMedia.overlaySubtitle || ""}
                            onChange={(e) =>
                              setCurrentMedia({
                                ...currentMedia,
                                overlaySubtitle: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Up to 50% off"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Overlay Position
                          </label>
                          <select
                            value={currentMedia.overlayPosition || "center"}
                            onChange={(e) =>
                              setCurrentMedia({
                                ...currentMedia,
                                overlayPosition: e.target.value as any,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            <option value="center">Center</option>
                            <option value="left">Left</option>
                            <option value="right">Right</option>
                            <option value="top">Top</option>
                            <option value="bottom">Bottom</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMediaModal(false);
                      setCurrentMedia({
                        type: "IMAGE",
                        url: "",
                        order: 0,
                        overlayPosition: "center",
                      });
                      setEditingMediaIndex(null);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddMedia}
                    disabled={!currentMedia.file?.name}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                  >
                    {editingMediaIndex !== null ? "Update" : "Add"} Media
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA MODAL */}
        {showCTAModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
              <div className="bg-purple-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
                <h3 className="text-lg font-bold">
                  {editingCTAIndex !== null
                    ? "Edit CTA Button"
                    : "Add CTA Button"}
                </h3>
                <button
                  onClick={() => {
                    setShowCTAModal(false);
                    setCurrentCTA({
                      text: "",
                      url: "",
                      style: "PRIMARY",
                      order: 0,
                      openNewTab: false,
                    });
                    setEditingCTAIndex(null);
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Button Text */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Button Text *
                  </label>
                  <input
                    type="text"
                    value={currentCTA.text || ""}
                    onChange={(e) =>
                      setCurrentCTA({ ...currentCTA, text: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Shop Now"
                    maxLength={50}
                  />
                </div>

                {/* URL */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    URL *
                  </label>
                  <input
                    type="text"
                    value={currentCTA.url || ""}
                    onChange={(e) =>
                      setCurrentCTA({ ...currentCTA, url: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="/shop or https://example.com"
                  />
                </div>

                {/* Style */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Style
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      ["PRIMARY", "SECONDARY", "OUTLINE", "TEXT"] as CTAStyle[]
                    ).map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setCurrentCTA({ ...currentCTA, style })}
                        className={`px-4 py-3 rounded-lg border-2 font-medium text-sm ${
                          currentCTA.style === style
                            ? style === "PRIMARY"
                              ? "bg-blue-600 text-white border-blue-600"
                              : style === "SECONDARY"
                              ? "bg-gray-600 text-white border-gray-600"
                              : style === "OUTLINE"
                              ? "border-blue-600 text-blue-600"
                              : "border-gray-300 text-blue-600"
                            : "border-gray-300 text-gray-600 hover:border-gray-400"
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Icon (optional) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Icon (Optional)
                  </label>
                  <input
                    type="text"
                    value={currentCTA.icon || ""}
                    onChange={(e) =>
                      setCurrentCTA({ ...currentCTA, icon: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., shopping-cart, arrow-right"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Use lucide-react icon names (e.g., shopping-cart,
                    arrow-right)
                  </p>
                </div>

                {/* Open in New Tab */}
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentCTA.openNewTab || false}
                      onChange={(e) =>
                        setCurrentCTA({
                          ...currentCTA,
                          openNewTab: e.target.checked,
                        })
                      }
                      className="h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <div>
                      <span className="text-sm font-semibold text-gray-900">
                        Open in New Tab
                      </span>
                      <p className="text-xs text-gray-500">
                        Link opens in a new browser tab
                      </p>
                    </div>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCTAModal(false);
                      setCurrentCTA({
                        text: "",
                        url: "",
                        style: "PRIMARY",
                        order: 0,
                        openNewTab: false,
                      });
                      setEditingCTAIndex(null);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCTA}
                    disabled={!currentCTA.text || !currentCTA.url}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
                  >
                    {editingCTAIndex !== null ? "Update" : "Add"} Button
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Permissions Warning */}
        {!canCreate && !canUpdate && !canDelete && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              You have read-only access. Contact your administrator for
              permissions.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};
