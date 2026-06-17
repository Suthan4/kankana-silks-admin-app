import React, { useEffect, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
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
  Maximize2,
} from "lucide-react";
import { homeSectionApi } from "@/lib/api/homesection.api";
import { productApi } from "@/lib/api/product.api";
import { categoryApi } from "@/lib/api/category.api";
import {
  type HomeSection,
  type SectionMedia,
  type SectionCTA,
  SectionType,
  type MediaType,
  type CTAStyle,
  type SectionMediaForm,
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
import { BackButton } from "@/components/ui/BackButton";

// ─── Shared compact input class ───────────────────────────────────────────────
const inp =
  "w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors";

// ─── Section type config ──────────────────────────────────────────────────────
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

const LAYOUT_OPTIONS = [
  { value: "grid", label: "Grid", description: "Responsive grid" },
  { value: "carousel", label: "Carousel", description: "Scrollable items" },
  { value: "list", label: "List", description: "Vertical list" },
  { value: "banner", label: "Banner", description: "Full-width" },
  {
    value: "aesthetic-fullscreen",
    label: "Aesthetic FS",
    description: "✨ Immersive",
  },
];

// ─── Stats Card ───────────────────────────────────────────────────────────────
const StatsCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}> = ({ icon, label, value, color }) => {
  const colorClasses: Record<string, string> = {
    purple: "bg-purple-100 text-purple-600",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
  };
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div
          className={`h-10 w-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

// ─── Section Card ─────────────────────────────────────────────────────────────
const SectionCard: React.FC<{
  section: HomeSection;
  onEdit: (s: HomeSection) => void;
  onDelete: (section: HomeSection) => void;
  canUpdate: boolean;
  canDelete: boolean;
}> = ({ section, onEdit, onDelete, canUpdate, canDelete }) => {
  const config = getSectionConfig(section.type);
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-200 hover:border-purple-300">
      <div
        className={`${config.bgColor} px-3 py-2.5 flex items-center justify-between`}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{config.icon}</span>
          <div>
            <h3 className="text-sm font-bold text-gray-900 leading-tight">
              {section.title}
            </h3>
            <p className={`text-xs font-medium ${config.textColor}`}>
              {section.customTypeName || config.label}
            </p>
          </div>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${section.isActive ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
        >
          {section.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {section.media && section.media.length > 0 && (
        <div className="relative h-36 bg-gray-100">
          {section.media[0].type === "IMAGE" ? (
            <img
              src={section.media[0].url}
              alt={section.media[0].altText || section.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <PlayCircle className="h-12 w-12 text-white opacity-70" />
            </div>
          )}
          {section.media.length > 1 && (
            <div className="absolute top-1.5 right-1.5 bg-black/70 text-white px-1.5 py-0.5 rounded text-xs font-semibold">
              +{section.media.length - 1} more
            </div>
          )}
        </div>
      )}

      <div className="p-3 space-y-2">
        {section.subtitle && (
          <p className="text-xs text-gray-500 italic truncate">
            {section.subtitle}
          </p>
        )}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <LayoutIcon className="h-3.5 w-3.5" />
          <span className="capitalize">{section.layout || "grid"}</span>
          {section.layout === "grid" && (
            <span className="text-gray-400">
              • {section.columns || 4} columns
            </span>
          )}
        </div>

        <div className="grid grid-cols-4 gap-1 pt-2 border-t border-gray-100">
          {[
            {
              icon: <ImageIcon className="h-3.5 w-3.5 text-blue-500" />,
              label: "Media",
              val: section.media?.length || 0,
            },
            {
              icon: <LinkIcon className="h-3.5 w-3.5 text-purple-500" />,
              label: "CTAs",
              val: section.ctaButtons?.length || 0,
            },
            {
              icon: <Package className="h-3.5 w-3.5 text-green-500" />,
              label: "Products",
              val: section.products?.length || 0,
            },
            {
              icon: <Tag className="h-3.5 w-3.5 text-orange-500" />,
              label: "Categories",
              val: section.categories?.length || 0,
            },
          ].map(({ icon, label, val }) => (
            <div key={label} className="text-center">
              <div className="flex justify-center mb-0.5">{icon}</div>
              <p className="text-[10px] text-gray-400">{label}</p>
              <p className="text-xs font-bold text-gray-800">{val}</p>
            </div>
          ))}
        </div>

        {section.ctaButtons && section.ctaButtons.length > 0 && (
          <div className="pt-1.5 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 mb-1">CTA Buttons:</p>
            <div className="flex flex-wrap gap-1">
              {section.ctaButtons.slice(0, 2).map((cta, idx) => (
                <span
                  key={idx}
                  className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded"
                >
                  {cta.text}
                </span>
              ))}
              {section.ctaButtons.length > 2 && (
                <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                  +{section.ctaButtons.length - 2} more
                </span>
              )}
            </div>
          </div>
        )}

        {(canUpdate || canDelete) && (
          <div className="flex gap-1.5 pt-2 border-t border-gray-100">
            {canUpdate && (
              <button
                onClick={() => onEdit(section)}
                className="flex-1 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center gap-1 transition-colors"
              >
                <Edit className="h-3 w-3" />
                Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(section)}
                className="flex-1 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center gap-1 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const HomeSectionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const canCreate = hasPermission("home-sections", "canCreate");
  const canUpdate = hasPermission("home-sections", "canUpdate");
  const canDelete = hasPermission("home-sections", "canDelete");

  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState<HomeSection | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | undefined>(
    undefined,
  );
  const [filterType, setFilterType] = useState<SectionType | undefined>(
    undefined,
  );
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [media, setMedia] = useState<SectionMediaForm[]>([]);
  const [ctaButtons, setCtaButtons] = useState<SectionCTA[]>([]);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#000000");
  const [layout, setLayout] = useState("grid");
  const [columns, setColumns] = useState(4);

  const [showMediaModal, setShowMediaModal] = useState(false);
  const [editingMediaIndex, setEditingMediaIndex] = useState<number | null>(
    null,
  );
  const [currentMedia, setCurrentMedia] = useState<Partial<SectionMediaForm>>({
    type: "IMAGE",
    url: "",
    order: 0,
    overlayPosition: "center",
  });

  const [showCTAModal, setShowCTAModal] = useState(false);
  const [editingCTAIndex, setEditingCTAIndex] = useState<number | null>(null);
  const [currentCTA, setCurrentCTA] = useState<Partial<SectionCTA>>({
    text: "",
    url: "",
    style: "PRIMARY",
    order: 0,
    openNewTab: false,
  });

  const { data: sectionsData, isLoading } = useQuery({
    queryKey: ["home-sections", filterActive, filterType],
    queryFn: async () => {
      const r = await homeSectionApi.getHomeSections({
        limit: 100,
        isActive: filterActive,
        type: filterType,
      });
      return r.data;
    },
  });
  const { data: productsData } = useQuery({
    queryKey: ["products-all"],
    queryFn: async () => {
      const r = await productApi.getProducts({ limit: 100 });
      return r.data;
    },
  });
  const { data: categoriesData } = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => {
      const r = await categoryApi.getCategories({ limit: 100 });
      return r.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: homeSectionApi.createHomeSection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-sections"] });
      setShowModal(false);
      resetForm();
      toast.success("Home section created successfully!");
    },
    onError: (e: any) => {
      toast.error(
        e?.response?.data?.message || "Failed to create home section",
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
    onError: (e: any) => {
      toast.error(
        e?.response?.data?.message || "Failed to update home section",
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
    control,
    formState: { errors },
  } = useForm<CreateHomeSectionFormData>({
    resolver: zodResolver(
      createHomeSectionSchema,
    ) as Resolver<CreateHomeSectionFormData>,
    defaultValues: {
      type: SectionType.FEATURED,
    },
  });
  const selectedType = watch("type") ?? "FEATURED";
  useEffect(() => {
    if (!getValues("type")) {
      setValue("type", "FEATURED", { shouldValidate: true });
    }
  }, []);

  const resetForm = () => {
    reset();
    setMedia([]);
    setCtaButtons([]);
    setValue("customTypeName", undefined);
    setBackgroundColor("#ffffff");
    setTextColor("#000000");
    setLayout("grid");
    setColumns(4);
  };

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
      section.categories?.map((c) => c.id.toString()) || [],
    );
    setValue(
      "customTypeName",
      section.type === "CUSTOM" ? section.customTypeName || "" : undefined,
    );
    setBackgroundColor(section.backgroundColor || "#ffffff");
    setTextColor(section.textColor || "#000000");
    setLayout(section.layout || "grid");
    setColumns(section.columns || 4);
    setMedia(section.media || []);
    setCtaButtons(section.ctaButtons || []);
    setShowModal(true);
  };

  const handleDelete = async (section: HomeSection) => {
    if (!window.confirm("Delete this section? This cannot be undone.")) {
      return;
    }

    try {
      // ✅ delete all media from S3
      if (section.media?.length) {
        await Promise.all(
          section.media.map(async (m) => {
            try {
              if (m.url) {
                await s3Api.deleteFileByUrl(m.url);
              }

              // optional thumbnail support
              if ((m as any).thumbnailUrl) {
                await s3Api.deleteFileByUrl((m as any).thumbnailUrl);
              }
            } catch (err) {
              console.error("Failed deleting section media:", err);
            }
          }),
        );
      }

      deleteMutation.mutate(section.id);
    } catch (error) {
      console.error(error);
    }
  };

  const onSubmit = async (data: CreateHomeSectionFormData) => {
    setIsUploadingImage(true);
    const uploadToast = toast.loading("Uploading image...");
    try {
      const uploadedMedia = await Promise.all(
        media.map(async (m, idx) => {
          let url = m.url ?? "";
          if (m.file) {
            // ✅ delete old media while editing
            if (editingSection?.media?.[idx]?.url) {
              try {
                await s3Api.deleteFileByUrl(editingSection.media[idx].url);
              } catch (err) {
                console.error("Failed deleting old section media:", err);
              }
            }

            const res = await s3Api.uploadSingle(m.file, "home-sections");

            url = res.url;
          }
          return {
            type: m.type,
            url,
            order: idx,
            overlayPosition: m.overlayPosition,
            overlayTitle: m.overlayTitle ?? "",
            overlaySubtitle: m.overlaySubtitle ?? "",
          };
        }),
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
          icon: c.icon ?? "",
          order: idx,
        })),
      };
      if (editingSection) {
        updateMutation.mutate(
          { id: editingSection.id, data: payload },
          {
            onSuccess: () =>
              toast.success("Section updated successfully", {
                id: uploadToast,
              }),
          },
        );
      } else {
        createMutation.mutate(payload, {
          onSuccess: () =>
            toast.success("Section created successfully", { id: uploadToast }),
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Image upload failed", { id: uploadToast });
    } finally {
      setIsUploadingImage(false);
      toast.dismiss(uploadToast);
    }
  };

  const handleAddMedia = () => {
    if (editingMediaIndex !== null) {
      const u = [...media];
      u[editingMediaIndex] = currentMedia as SectionMedia;
      setMedia(u);
    } else
      setMedia([
        ...media,
        { ...currentMedia, order: media.length } as SectionMedia,
      ]);
    setShowMediaModal(false);
    setCurrentMedia({
      type: "IMAGE",
      url: "",
      order: 0,
      overlayPosition: "center",
    });
    setEditingMediaIndex(null);
  };
  const handleEditMedia = (i: number) => {
    setCurrentMedia(media[i]);
    setEditingMediaIndex(i);
    setShowMediaModal(true);
  };
  const handleDeleteMedia = (i: number) =>
    setMedia(media.filter((_, x) => x !== i));
  const handleMoveMedia = (i: number, dir: "up" | "down") => {
    const ni = dir === "up" ? i - 1 : i + 1;
    if (ni < 0 || ni >= media.length) return;
    const u = [...media];
    [u[i], u[ni]] = [u[ni], u[i]];
    setMedia(u);
  };

  const handleAddCTA = () => {
    if (editingCTAIndex !== null) {
      const u = [...ctaButtons];
      u[editingCTAIndex] = currentCTA as SectionCTA;
      setCtaButtons(u);
    } else
      setCtaButtons([
        ...ctaButtons,
        { ...currentCTA, order: ctaButtons.length } as SectionCTA,
      ]);
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
  const handleEditCTA = (i: number) => {
    setCurrentCTA(ctaButtons[i]);
    setEditingCTAIndex(i);
    setShowCTAModal(true);
  };
  const handleDeleteCTA = (i: number) =>
    setCtaButtons(ctaButtons.filter((_, x) => x !== i));
  const handleMoveCTA = (i: number, dir: "up" | "down") => {
    const ni = dir === "up" ? i - 1 : i + 1;
    if (ni < 0 || ni >= ctaButtons.length) return;
    const u = [...ctaButtons];
    [u[i], u[ni]] = [u[ni], u[i]];
    setCtaButtons(u);
  };

  const totalSections = sectionsData?.sections?.length || 0;
  const activeSections =
    sectionsData?.sections?.filter((s) => s.isActive).length || 0;
  const filteredSections =
    sectionsData?.sections?.filter(
      (s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  console.log("media", media);
  console.log("currentMedia", currentMedia);
  console.log("selectedType", selectedType);
  console.log("errors", errors);
  console.log("customTypeName", getValues("customTypeName"));

  return (
    <MainLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <Home className="h-5 w-5 text-white" />
                </div>
                Home Sections
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage homepage sections with media, CTAs, and styling
              </p>
            </div>
          </div>
          {canCreate && (
            <button
              onClick={() => {
                setEditingSection(null);
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-sm font-medium shadow-md transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Section
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatsCard
            icon={<Home className="h-5 w-5" />}
            label="Total Sections"
            value={totalSections}
            color="purple"
          />
          <StatsCard
            icon={<CheckCircle className="h-5 w-5" />}
            label="Active"
            value={activeSections}
            color="green"
          />
          <StatsCard
            icon={<XCircle className="h-5 w-5" />}
            label="Inactive"
            value={totalSections - activeSections}
            color="orange"
          />
          <StatsCard
            icon={<Star className="h-5 w-5" />}
            label="Featured"
            value={
              sectionsData?.sections?.filter((s) => s.type === "FEATURED")
                .length || 0
            }
            color="blue"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
          <div className="flex flex-col lg:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sections..."
                className={`${inp} pl-8`}
              />
            </div>
            <select
              value={filterType || ""}
              onChange={(e) =>
                setFilterType((e.target.value as SectionType) || undefined)
              }
              className={`${inp} bg-white`}
            >
              <option value={watch("type")}>All Types</option>
              {[
                "HERO_SLIDER",
                "FEATURED",
                "NEW_ARRIVALS",
                "COLLECTIONS",
                "CATEGORIES",
                "BEST_SELLERS",
                "TRENDING",
                "SEASONAL",
                "CATEGORY_SPOTLIGHT",
                "CUSTOM",
              ].map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <select
              value={
                filterActive === undefined
                  ? "all"
                  : filterActive
                    ? "active"
                    : "inactive"
              }
              onChange={(e) =>
                setFilterActive(
                  e.target.value === "all"
                    ? undefined
                    : e.target.value === "active",
                )
              }
              className={`${inp} bg-white`}
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              {(["grid", "table"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === m ? "bg-white text-purple-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
                >
                  {m === "grid" ? (
                    <Grid3x3 className="h-4 w-4" />
                  ) : (
                    <List className="h-4 w-4" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sections Grid */}
        {isLoading ? (
          <div className="bg-white rounded-lg p-10 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Loading sections...</p>
          </div>
        ) : filteredSections.length === 0 ? (
          <div className="bg-white rounded-lg p-10 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Home className="h-8 w-8 text-indigo-600" />
            </div>
            <p className="text-sm font-semibold text-gray-700">
              No sections found
            </p>
            <p className="text-xs text-gray-400 mt-1">
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
                className="mt-3 px-4 py-2 text-sm bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium"
              >
                Create First Section
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSections.map((s) => (
              <SectionCard
                key={s.id}
                section={s}
                onEdit={handleEdit}
                onDelete={handleDelete}
                canUpdate={canUpdate}
                canDelete={canDelete}
              />
            ))}
          </div>
        )}

        {/* ════ CREATE / EDIT MODAL ════════════════════════════════════════════ */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col"
              style={{ maxHeight: "95vh" }}
            >
              {/* Fixed Header */}
              <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-xl flex-shrink-0">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  {editingSection ? "Edit Home Section" : "Create Home Section"}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingSection(null);
                    resetForm();
                  }}
                  className="h-7 w-7 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col flex-1 min-h-0"
              >
                {/* Scrollable body */}
                <div className="overflow-y-auto flex-1 px-5 py-3 space-y-3">
                  {/* 1 · Basic Info */}
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2.5">
                    <h3 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5" />
                      Basic Information
                    </h3>
                    <Controller
                      control={control}
                      name="type"
                      render={({ field }) => (
                        <SectionTypeSelector
                          value={field.value}
                          customTypeName={watch("customTypeName")}
                          error={
                            errors.type?.message ||
                            errors.customTypeName?.message
                          }
                          onChange={(type, customName) => {
                            field.onChange(type);

                            setValue(
                              "customTypeName",
                              type === "CUSTOM" ? customName : undefined,
                              { shouldValidate: true },
                            );
                          }}
                        />
                      )}
                    />

                    {/* Title + Subtitle side by side */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...register("title")}
                          type="text"
                          className={inp}
                          placeholder="e.g., Featured Products"
                        />
                        {errors.title && (
                          <p className="mt-0.5 text-xs text-red-500">
                            {errors.title.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Subtitle (Optional)
                        </label>
                        <input
                          {...register("subtitle")}
                          type="text"
                          className={inp}
                          placeholder="Add a descriptive subtitle..."
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Description (Optional)
                      </label>
                      <textarea
                        {...register("description")}
                        rows={2}
                        className={`${inp} resize-none`}
                        placeholder="Add a longer description..."
                      />
                    </div>
                  </div>

                  {/* 2 · Media */}
                  <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
                        Media ({media.length}){errors.media?.message}
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
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        Add Media
                      </button>
                    </div>
                    {media.length === 0 ? (
                      <div className="text-center py-5 border-2 border-dashed border-blue-200 rounded-lg bg-white">
                        <ImageIcon className="h-8 w-8 mx-auto mb-1 text-blue-300 opacity-50" />
                        <p className="text-xs text-gray-500">
                          No media added yet
                        </p>
                        <p className="text-[10px] text-gray-400">
                          Click "Add Media" to upload images or videos
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {media.map((item, i) => (
                          <div
                            key={i}
                            className="bg-white px-3 py-2 rounded-lg border border-blue-100 flex items-center gap-2"
                          >
                            <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                              {item.type === "IMAGE" ? (
                                <img
                                  src={
                                    item.file
                                      ? URL.createObjectURL(item.file)
                                      : item.url
                                  }
                                  alt={item.altText || "Media"}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Video className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-gray-800">
                                  {item.type === "IMAGE"
                                    ? "📷 Image"
                                    : "🎥 Video"}{" "}
                                  #{i + 1}
                                </span>
                                {item.overlayTitle && (
                                  <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                                    Has Overlay
                                  </span>
                                )}
                              </div>
                              {item.title && (
                                <p className="text-xs text-gray-500 truncate">
                                  {item.title}
                                </p>
                              )}
                              {item.overlayTitle && (
                                <p className="text-xs text-gray-400 truncate">
                                  "{item.overlayTitle}"
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => handleMoveMedia(i, "up")}
                                disabled={i === 0}
                                className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveMedia(i, "down")}
                                disabled={i === media.length - 1}
                                className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEditMedia(i)}
                                className="p-1 text-blue-500 hover:text-blue-700"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMedia(i)}
                                className="p-1 text-red-400 hover:text-red-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 3 · CTA Buttons */}
                  {(() => {
                    const CTA_ALLOWED_LAYOUTS = [
                      "banner",
                      "aesthetic-fullscreen",
                    ];

                    const isCTAEnabledLayout =
                      CTA_ALLOWED_LAYOUTS.includes(layout);

                    const showCTARemoveWarning =
                      !isCTAEnabledLayout && ctaButtons.length > 0;

                    return (
                      <div className="bg-purple-50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                              <LinkIcon className="h-3.5 w-3.5 text-purple-600" />
                              CTA Buttons ({ctaButtons.length})
                            </h3>

                            {!isCTAEnabledLayout && (
                              <p className="text-[10px] text-gray-500 mt-1">
                                Available only for Banner & Aesthetic FS layouts
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={!isCTAEnabledLayout}
                            onClick={() => {
                              if (!isCTAEnabledLayout) {
                                toast.error(
                                  "CTA buttons are only available for Banner and Aesthetic FS layouts.",
                                );
                                return;
                              }

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
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                              isCTAEnabledLayout
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            <Plus className="h-3 w-3" />
                            Add Button
                          </button>
                        </div>

                        {!isCTAEnabledLayout && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                            <p className="text-xs font-medium text-amber-800">
                              CTA buttons are supported only for Banner and
                              Aesthetic FS layouts.
                            </p>

                            {showCTARemoveWarning && (
                              <p className="text-[11px] text-red-500 mt-1">
                                Please remove existing CTA buttons before
                                changing the layout.
                              </p>
                            )}
                          </div>
                        )}

                        {ctaButtons.length === 0 ? (
                          <div className="text-center py-5 border-2 border-dashed border-purple-200 rounded-lg bg-white">
                            <LinkIcon className="h-8 w-8 mx-auto mb-1 text-purple-300 opacity-50" />

                            <p className="text-xs text-gray-500">
                              No CTA buttons added yet
                            </p>

                            <p className="text-[10px] text-gray-400">
                              Click "Add Button" to create call-to-action
                              buttons
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {ctaButtons.map((cta, i) => (
                              <div
                                key={i}
                                className="bg-white px-3 py-2 rounded-lg border border-purple-100 flex items-center gap-2"
                              >
                                <div
                                  className={`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ${
                                    cta.style === "PRIMARY"
                                      ? "bg-blue-600 text-white"
                                      : cta.style === "SECONDARY"
                                        ? "bg-gray-600 text-white"
                                        : cta.style === "OUTLINE"
                                          ? "border border-blue-600 text-blue-600"
                                          : "text-blue-600"
                                  }`}
                                >
                                  {cta.style}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-800 truncate">
                                    {cta.text}
                                  </p>

                                  <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                                    {cta.url}

                                    {cta.openNewTab && (
                                      <ExternalLink className="h-2.5 w-2.5" />
                                    )}
                                  </p>
                                </div>

                                <div className="flex items-center gap-0.5 flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleMoveCTA(i, "up")}
                                    disabled={i === 0}
                                    className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20"
                                  >
                                    <ArrowUp className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleMoveCTA(i, "down")}
                                    disabled={i === ctaButtons.length - 1}
                                    className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20"
                                  >
                                    <ArrowDown className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleEditCTA(i)}
                                    className="p-1 text-blue-500 hover:text-blue-700"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCTA(i)}
                                    className="p-1 text-red-400 hover:text-red-600"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  {/* <div className="bg-purple-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        <LinkIcon className="h-3.5 w-3.5 text-purple-600" />
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
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        Add Button
                      </button>
                    </div>
                    {ctaButtons.length === 0 ? (
                      <div className="text-center py-5 border-2 border-dashed border-purple-200 rounded-lg bg-white">
                        <LinkIcon className="h-8 w-8 mx-auto mb-1 text-purple-300 opacity-50" />
                        <p className="text-xs text-gray-500">
                          No CTA buttons added yet
                        </p>
                        <p className="text-[10px] text-gray-400">
                          Click "Add Button" to create call-to-action buttons
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {ctaButtons.map((cta, i) => (
                          <div
                            key={i}
                            className="bg-white px-3 py-2 rounded-lg border border-purple-100 flex items-center gap-2"
                          >
                            <div
                              className={`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ${cta.style === "PRIMARY" ? "bg-blue-600 text-white" : cta.style === "SECONDARY" ? "bg-gray-600 text-white" : cta.style === "OUTLINE" ? "border border-blue-600 text-blue-600" : "text-blue-600"}`}
                            >
                              {cta.style}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-800 truncate">
                                {cta.text}
                              </p>
                              <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                                {cta.url}
                                {cta.openNewTab && (
                                  <ExternalLink className="h-2.5 w-2.5" />
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => handleMoveCTA(i, "up")}
                                disabled={i === 0}
                                className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveCTA(i, "down")}
                                disabled={i === ctaButtons.length - 1}
                                className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEditCTA(i)}
                                className="p-1 text-blue-500 hover:text-blue-700"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCTA(i)}
                                className="p-1 text-red-400 hover:text-red-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div> */}

                  {/* 4 · Layout & Styling */}
                  <div className="bg-green-50 rounded-lg p-3 space-y-2.5">
                    <h3 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <Palette className="h-3.5 w-3.5 text-green-600" />
                      Layout & Styling
                    </h3>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Layout Style
                      </label>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-1.5">
                        {LAYOUT_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              const CTA_ALLOWED_LAYOUTS = [
                                "banner",
                                "aesthetic-fullscreen",
                              ];

                              const isChangingToUnsupportedLayout =
                                !CTA_ALLOWED_LAYOUTS.includes(opt.value);

                              if (
                                isChangingToUnsupportedLayout &&
                                ctaButtons.length > 0
                              ) {
                                toast.error(
                                  "Please remove CTA buttons first. CTA buttons are only supported for Banner and Aesthetic FS layouts.",
                                );

                                return;
                              }

                              setLayout(opt.value);
                              setValue("layout" as any, opt.value);
                            }}
                            className={`relative p-2.5 rounded-lg border transition-all text-center ${layout === opt.value ? "border-purple-500 bg-purple-50 shadow-sm" : "border-gray-200 hover:border-gray-300 bg-white"}`}
                          >
                            <span
                              className={`block text-xs font-medium leading-tight ${layout === opt.value ? "text-purple-700" : "text-gray-700"}`}
                            >
                              {opt.label}
                            </span>
                            {layout === opt.value && (
                              <CheckCircle className="absolute top-1 right-1 h-3 w-3 text-purple-500" />
                            )}
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {opt.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {layout === "grid" && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Grid Columns
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={columns}
                            onChange={(e) => {
                              setColumns(Number(e.target.value));
                              setValue(
                                "columns" as any,
                                Number(e.target.value),
                              );
                            }}
                            className={inp}
                          />
                        </div>
                      )}
                      <div className={layout !== "grid" ? "col-span-1" : ""}>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Background Color
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="color"
                            value={backgroundColor}
                            onChange={(e) => {
                              setBackgroundColor(e.target.value);
                              setValue(
                                "backgroundColor" as any,
                                e.target.value,
                              );
                            }}
                            className="h-[30px] w-9 rounded border border-gray-200 cursor-pointer flex-shrink-0"
                          />
                          <input
                            type="text"
                            value={backgroundColor}
                            onChange={(e) => {
                              setBackgroundColor(e.target.value);
                              setValue(
                                "backgroundColor" as any,
                                e.target.value,
                              );
                            }}
                            className={`${inp} font-mono`}
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Text Color
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="color"
                            value={textColor}
                            onChange={(e) => {
                              setTextColor(e.target.value);
                              setValue("textColor" as any, e.target.value);
                            }}
                            className="h-[30px] w-9 rounded border border-gray-200 cursor-pointer flex-shrink-0"
                          />
                          <input
                            type="text"
                            value={textColor}
                            onChange={(e) => {
                              setTextColor(e.target.value);
                              setValue("textColor" as any, e.target.value);
                            }}
                            className={`${inp} font-mono`}
                            placeholder="#000000"
                          />
                        </div>
                      </div>
                    </div>

                    {layout === "aesthetic-fullscreen" && (
                      <div className="bg-white border border-purple-200 rounded-lg p-2.5 flex gap-2">
                        <Maximize2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-purple-900">
                            Aesthetic Fullscreen Mode
                          </p>
                          <p className="text-xs text-purple-700 mt-0.5">
                            Immersive full-screen experience: elegant typography
                            · smooth transitions · overlay text support ·
                            sophisticated buttons
                          </p>
                          <p className="text-[10px] text-purple-400 mt-0.5 italic">
                            💡 Tip: Add overlay titles to your media for the
                            best effect
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 5 · Content Selection */}
                  <div className="bg-purple-50 rounded-lg p-3 space-y-2">
                    <h3 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-purple-600" />
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
                          children: c.children?.map((ch) => ({
                            id: ch.id.toString(),
                            name: ch.name,
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

                  {/* 6 · Display Settings */}
                  <div className="rounded-lg border border-gray-100 p-3 space-y-2.5">
                    <h3 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      Display Settings
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Numeric fields */}
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Display Order
                          </label>
                          <input
                            {...register("order")}
                            type="number"
                            min="0"
                            className={inp}
                            placeholder="0"
                          />
                          <p className="mt-0.5 text-[10px] text-gray-400">
                            Lower = appears first
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Item Limit
                          </label>
                          <input
                            {...register("limit")}
                            type="number"
                            min="1"
                            className={inp}
                            placeholder="8"
                          />
                          <p className="mt-0.5 text-[10px] text-gray-400">
                            Max items to show
                          </p>
                        </div>
                      </div>
                      {/* Toggles */}
                      <div className="space-y-2.5 pt-0.5">
                        {[
                          {
                            field: "showTitle",
                            label: "Show Title",
                            desc: "Display section title on homepage",
                          },
                          {
                            field: "showSubtitle",
                            label: "Show Subtitle",
                            desc: "Display section subtitle on homepage",
                          },
                          {
                            field: "isActive",
                            label: "Active",
                            desc: "Section visible to visitors",
                          },
                        ].map(({ field, label, desc }) => (
                          <label
                            key={field}
                            className="flex items-start gap-2 cursor-pointer group"
                          >
                            <input
                              {...register(field as any)}
                              type="checkbox"
                              className="h-3.5 w-3.5 mt-0.5 text-purple-600 rounded flex-shrink-0 focus:ring-purple-500"
                            />
                            <div>
                              <span className="text-xs font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                                {label}
                              </span>
                              <p className="text-[10px] text-gray-400">
                                {desc}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fixed Footer */}
                <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-white rounded-b-xl flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingSection(null);
                      resetForm();
                    }}
                    className="px-4 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                    className="px-4 py-1.5 text-sm bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg flex items-center gap-1.5 font-medium disabled:opacity-50 transition-all"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        {editingSection ? "Update" : "Create"} Section
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ════ MEDIA MODAL ════════════════════════════════════════════════════ */}
        {showMediaModal && (
          <div className="fixed inset-0 bg-black/65 flex items-center justify-center z-[60] p-4">
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col"
              style={{ maxHeight: "90vh" }}
            >
              <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-t-xl flex-shrink-0">
                <h3 className="text-sm font-bold">
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
                  className="h-7 w-7 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Media Type
                  </label>
                  <div className="flex gap-4">
                    {(["IMAGE", "VIDEO"] as const).map((t) => (
                      <label
                        key={t}
                        className="flex items-center gap-1.5 cursor-pointer"
                      >
                        <input
                          type="radio"
                          checked={currentMedia.type === t}
                          onChange={() =>
                            setCurrentMedia({ ...currentMedia, type: t })
                          }
                          className="h-3.5 w-3.5 text-blue-600"
                        />
                        <span className="text-xs font-medium">{t}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    {currentMedia.type === "IMAGE" ? "Image" : "Video"}{" "}
                    <span className="text-red-500">*</span>
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

                {currentMedia.type === "VIDEO" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
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

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
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
                      className={inp}
                      placeholder="Describe for accessibility"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
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
                      className={inp}
                      placeholder="Media title"
                    />
                  </div>
                </div>

                {selectedType === "HERO_SLIDER" && (
                  <div className="border-t border-gray-100 pt-3 space-y-2">
                    <h4 className="text-xs font-semibold text-gray-700">
                      Overlay Text (Optional)
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
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
                          className={inp}
                          placeholder="e.g., Summer Sale"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
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
                          className={inp}
                          placeholder="e.g., Up to 50% off"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
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
                        className={`${inp} bg-white`}
                      >
                        {["center", "left", "right", "top", "bottom"].map(
                          (p) => (
                            <option key={p} value={p}>
                              {p.charAt(0).toUpperCase() + p.slice(1)}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-white rounded-b-xl flex-shrink-0">
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
                  className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddMedia}
                  disabled={!currentMedia.file?.name}
                  className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 font-medium transition-colors"
                >
                  {editingMediaIndex !== null ? "Update" : "Add"} Media
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════ CTA MODAL ══════════════════════════════════════════════════════ */}
        {showCTAModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col"
              style={{ maxHeight: "90vh" }}
            >
              <div className="flex items-center justify-between px-4 py-3 bg-purple-600 text-white rounded-t-xl flex-shrink-0">
                <h3 className="text-sm font-bold">
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
                  className="h-7 w-7 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Button Text <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={currentCTA.text || ""}
                      onChange={(e) =>
                        setCurrentCTA({ ...currentCTA, text: e.target.value })
                      }
                      className={inp}
                      placeholder="e.g., Shop Now"
                      maxLength={50}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={currentCTA.url || ""}
                      onChange={(e) =>
                        setCurrentCTA({ ...currentCTA, url: e.target.value })
                      }
                      className={inp}
                      placeholder="/shop or https://example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Style
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(
                      ["PRIMARY", "SECONDARY", "OUTLINE", "TEXT"] as CTAStyle[]
                    ).map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setCurrentCTA({ ...currentCTA, style })}
                        className={`py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                          currentCTA.style === style
                            ? style === "PRIMARY"
                              ? "bg-blue-600 text-white border-blue-600"
                              : style === "SECONDARY"
                                ? "bg-gray-600 text-white border-gray-600"
                                : style === "OUTLINE"
                                  ? "border-2 border-blue-600 text-blue-600"
                                  : "border-gray-300 text-blue-600"
                            : "border-gray-300 text-gray-600 hover:border-gray-400"
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Icon (Optional)
                  </label>
                  <input
                    type="text"
                    value={currentCTA.icon || ""}
                    onChange={(e) =>
                      setCurrentCTA({ ...currentCTA, icon: e.target.value })
                    }
                    className={inp}
                    placeholder="e.g., shopping-cart, arrow-right"
                  />
                  <p className="mt-0.5 text-[10px] text-gray-400">
                    Use lucide-react icon names (e.g., shopping-cart,
                    arrow-right)
                  </p>
                </div>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentCTA.openNewTab || false}
                    onChange={(e) =>
                      setCurrentCTA({
                        ...currentCTA,
                        openNewTab: e.target.checked,
                      })
                    }
                    className="h-3.5 w-3.5 mt-0.5 text-purple-600 rounded flex-shrink-0 focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-gray-900">
                      Open in New Tab
                    </span>
                    <p className="text-[10px] text-gray-400">
                      Link opens in a new browser tab
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-white rounded-b-xl flex-shrink-0">
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
                  className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCTA}
                  disabled={!currentCTA.text || !currentCTA.url}
                  className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 font-medium transition-colors"
                >
                  {editingCTAIndex !== null ? "Update" : "Add"} Button
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No Permissions Warning */}
        {!canCreate && !canUpdate && !canDelete && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              You have read-only access. Contact your administrator for
              permissions.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};
