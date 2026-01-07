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
  Eye,
  EyeOff,
  Sparkles,
  TrendingUp,
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
} from "lucide-react";
import { homeSectionApi } from "@/lib/api/homesection.api";
import { productApi } from "@/lib/api/product.api";
import { categoryApi } from "@/lib/api/category.api";

import {
  type HomeSection,
  SectionType,
} from "@/lib/types/heroSection/herosection";
import { createHomeSectionSchema, type CreateHomeSectionFormData } from "@/lib/types/heroSection/schema";

// Section Type Icons and Colors
const getSectionConfig = (type: SectionType) => {
  const configs = {
    FEATURED: {
      icon: <Star className="h-5 w-5" />,
      color: "purple",
      bgColor: "bg-purple-100",
      textColor: "text-purple-700",
      borderColor: "border-purple-300",
      label: "Featured",
    },
    NEW_ARRIVALS: {
      icon: <Sparkles className="h-5 w-5" />,
      color: "blue",
      bgColor: "bg-blue-100",
      textColor: "text-blue-700",
      borderColor: "border-blue-300",
      label: "New Arrivals",
    },
    BEST_SELLERS: {
      icon: <TrendingUp className="h-5 w-5" />,
      color: "green",
      bgColor: "bg-green-100",
      textColor: "text-green-700",
      borderColor: "border-green-300",
      label: "Best Sellers",
    },
    TRENDING: {
      icon: <TrendingUp className="h-5 w-5" />,
      color: "orange",
      bgColor: "bg-orange-100",
      textColor: "text-orange-700",
      borderColor: "border-orange-300",
      label: "Trending",
    },
    SEASONAL: {
      icon: <Calendar className="h-5 w-5" />,
      color: "pink",
      bgColor: "bg-pink-100",
      textColor: "text-pink-700",
      borderColor: "border-pink-300",
      label: "Seasonal",
    },
    CATEGORY_SPOTLIGHT: {
      icon: <Tag className="h-5 w-5" />,
      color: "indigo",
      bgColor: "bg-indigo-100",
      textColor: "text-indigo-700",
      borderColor: "border-indigo-300",
      label: "Category Spotlight",
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
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
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

// Section Card Component
const SectionCard: React.FC<{
  section: HomeSection;
  onEdit: (section: HomeSection) => void;
  onDelete: (id: string) => void;
  canUpdate: boolean;
  canDelete: boolean;
}> = ({ section, onEdit, onDelete, canUpdate, canDelete }) => {
  const config = getSectionConfig(section.type);

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-300">
      {/* Header with gradient */}
      <div className={`${config.bgColor} border-b ${config.borderColor} p-4`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-white rounded-lg ${config.textColor}`}>
              {config.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {section.title}
              </h3>
              <p className={`text-xs font-medium ${config.textColor}`}>
                {config.label}
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
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {section.subtitle && (
          <p className="text-sm text-gray-600 italic">{section.subtitle}</p>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-200">
          <div className="text-center">
            <Package className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Products</p>
            <p className="text-lg font-bold text-gray-900">
              {section.products?.length || 0}
            </p>
          </div>
          <div className="text-center">
            <Tag className="h-5 w-5 text-purple-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Categories</p>
            <p className="text-lg font-bold text-gray-900">
              {section.categories?.length || 0}
            </p>
          </div>
          <div className="text-center">
            <Layers className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Limit</p>
            <p className="text-lg font-bold text-gray-900">{section.limit}</p>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-200 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span>Display Order:</span>
            <span className="font-semibold text-gray-900">{section.order}</span>
          </div>
        </div>

        {/* Actions */}
        {(canUpdate || canDelete) && (
          <div className="flex gap-2 pt-3">
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

export const HomeSectionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
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

  const canCreate = hasPermission("home-sections", "canCreate");
  const canUpdate = hasPermission("home-sections", "canUpdate");
  const canDelete = hasPermission("home-sections", "canDelete");

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

  // Fetch products for multi-select
  const { data: productsData } = useQuery({
    queryKey: ["products-all"],
    queryFn: async () => {
      const response = await productApi.getProducts({ limit: 100 });
      return response.data;
    },
  });

  // Fetch categories for multi-select
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
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      homeSectionApi.updateHomeSection(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-sections"] });
      setEditingSection(null);
      setShowModal(false);
      reset();
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
    formState: { errors },
  } = useForm<CreateHomeSectionFormData>({
    resolver: zodResolver(
      createHomeSectionSchema
    ) as Resolver<CreateHomeSectionFormData>,
  });

  const onSubmit = (data: CreateHomeSectionFormData) => {
    const submitData = {
      ...data,
      isActive: data.isActive ?? true,
      order: data.order ?? 0,
      limit: data.limit ?? 8,
    };

    if (editingSection) {
      updateMutation.mutate({ id: editingSection.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (section: HomeSection) => {
    setEditingSection(section);
    setValue("type", section.type as any);
    setValue("title", section.title);
    setValue("subtitle", section.subtitle || "");
    setValue("isActive", section.isActive);
    setValue("order", section.order);
    setValue("limit", section.limit);
    setValue("productIds", section.products?.map((p) => p.id.toString()) || []);
    setValue(
      "categoryIds",
      section.categories?.map((c) => c.id.toString()) || []
    );
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Delete this home section? This cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  // Calculate stats
  const totalSections = sectionsData?.sections?.length || 0;
  const activeSections =
    sectionsData?.sections?.filter((s) => s.isActive).length || 0;
  const inactiveSections = totalSections - activeSections;

  // Filter sections by search
  const filteredSections =
    sectionsData?.sections?.filter(
      (section) =>
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                <Home className="h-7 w-7 text-white" />
              </div>
              Home Sections
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              Manage homepage sections and featured content
            </p>
          </div>

          {canCreate && (
            <button
              onClick={() => {
                setEditingSection(null);
                reset({
                  type: "FEATURED",
                  title: "",
                  subtitle: "",
                  isActive: true,
                  order: 0,
                  limit: 8,
                  productIds: [],
                  categoryIds: [],
                });
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl font-medium"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Section</span>
              <span className="sm:hidden">Add</span>
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
                placeholder="Search sections by title..."
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
              <option value="FEATURED">Featured</option>
              <option value="NEW_ARRIVALS">New Arrivals</option>
              <option value="BEST_SELLERS">Best Sellers</option>
              <option value="TRENDING">Trending</option>
              <option value="SEASONAL">Seasonal</option>
              <option value="CATEGORY_SPOTLIGHT">Category Spotlight</option>
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
              <Home className="h-10 w-10 text-purple-600" />
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
                onClick={() => setShowModal(true)}
                className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
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

        {/* Create/Edit Modal - Will add in next part */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Home className="h-6 w-6" />
                  {editingSection ? "Edit Home Section" : "Create Home Section"}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingSection(null);
                    reset();
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                {/* Section Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Section Type *
                  </label>
                  <select
                    {...register("type")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="FEATURED">⭐ Featured</option>
                    <option value="NEW_ARRIVALS">✨ New Arrivals</option>
                    <option value="BEST_SELLERS">📈 Best Sellers</option>
                    <option value="TRENDING">🔥 Trending</option>
                    <option value="SEASONAL">📅 Seasonal</option>
                    <option value="CATEGORY_SPOTLIGHT">
                      🏷️ Category Spotlight
                    </option>
                  </select>
                  {errors.type && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.type.message}
                    </p>
                  )}
                </div>

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
                    <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
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

                {/* Order & Limit */}
                <div className="grid grid-cols-2 gap-4">
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
                      Lower numbers appear first
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
                      Max items to display
                    </p>
                  </div>
                </div>

                {/* Products Multi-Select */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Products (Optional)
                  </label>
                  <select
                    {...register("productIds")}
                    multiple
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    size={5}
                  >
                    {productsData?.products?.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - ₹{product.sellingPrice}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Hold Ctrl/Cmd to select multiple products
                  </p>
                </div>

                {/* Categories Multi-Select */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Categories (Optional)
                  </label>
                  <select
                    {...register("categoryIds")}
                    multiple
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    size={5}
                  >
                    {categoriesData?.categories?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Hold Ctrl/Cmd to select multiple categories
                  </p>
                </div>

                {/* Active Status */}
                <div className="border-t border-gray-200 pt-6">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      {...register("isActive")}
                      type="checkbox"
                      className="h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <div>
                      <span className="text-sm font-semibold text-gray-900">
                        Active on Homepage
                      </span>
                      <p className="text-xs text-gray-500">
                        Section will be visible to visitors
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingSection(null);
                      reset();
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
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
