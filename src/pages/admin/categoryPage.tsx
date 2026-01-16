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
  FolderTree,
  Eye,
  EyeOff,
  List,
  ChevronRight,
  ChevronDown,
  Grid3x3,
  Loader2,
} from "lucide-react";
import { categoryApi } from "@/lib/api/category.api";
import { s3Api } from "@/lib/api/s3.api";
import type { Category } from "@/lib/types/category/category";
import {
  createCategorySchema,
  type CreateCategoryFormData,
} from "@/lib/types/category/schema";

// Tree node component for hierarchical view
const CategoryTreeNode: React.FC<{
  category: Category;
  level: number;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  canUpdate: boolean;
  canDelete: boolean;
}> = ({ category, level, onEdit, onDelete, canUpdate, canDelete }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <div
        className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
          level > 0 ? `ml-${level * 8}` : ""
        }`}
        style={{ paddingLeft: `${level * 2 + 1}rem` }}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-1 hover:bg-gray-200 rounded transition-colors ${
            !hasChildren ? "invisible" : ""
          }`}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-600" />
          )}
        </button>

        <div className="flex-shrink-0">
          {category.image ? (
            <img
              src={category.image}
              alt={category.name}
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
              <FolderTree className="h-5 w-5 text-gray-500" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {category.name}
            </p>
            <span
              className={`px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${
                category.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {category.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span className="truncate">{category.slug}</span>
            <span className="flex-shrink-0">
              {category._count?.products || 0} products
            </span>
            <span className="hidden sm:inline flex-shrink-0">
              Order: {category.order}
            </span>
          </div>
        </div>

        {(canUpdate || canDelete) && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {canUpdate && (
              <button
                onClick={() => onEdit(category)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(category.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div>
          {category.children?.map((child) => (
            <CategoryTreeNode
              key={child.id}
              category={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              canUpdate={canUpdate}
              canDelete={canDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Card view for mobile
const CategoryCard: React.FC<{
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  canUpdate: boolean;
  canDelete: boolean;
}> = ({ category, onEdit, onDelete, canUpdate, canDelete }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {category.image ? (
          <img
            src={category.image}
            alt={category.name}
            className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
            <FolderTree className="h-8 w-8 text-gray-500" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {category.name}
              </h3>
              <p className="text-sm text-gray-500 truncate">{category.slug}</p>
            </div>
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${
                category.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {category.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-600">
            {category.parent && <span>Parent: {category.parent.name}</span>}
            <span>{category._count?.products || 0} products</span>
            <span>Order: {category.order}</span>
          </div>

          {(canUpdate || canDelete) && (
            <div className="mt-3 flex gap-2">
              {canUpdate && (
                <button
                  onClick={() => onEdit(category)}
                  className="flex-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  Edit
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => onDelete(category.id)}
                  className="flex-1 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CategoriesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<"tree" | "table" | "grid">("tree");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const canCreate = hasPermission("categories", "canCreate");
  const canUpdate = hasPermission("categories", "canUpdate");
  const canDelete = hasPermission("categories", "canDelete");

  // Fetch categories
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await categoryApi.getCategories({ limit: 100 });
      return response.data;
    },
  });

  // Fetch category tree
  const { data: categoryTree } = useQuery({
    queryKey: ["category-tree"],
    queryFn: async () => {
      const response = await categoryApi.getCategoryTree();
      return response.data;
    },
  });

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: categoryApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["category-tree"] });
      setShowCreateModal(false);
      reset();
      setImagePreview("");
      setImageFile(null);
      toast.success("Category created successfully!");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to create category"
      );
    },
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      categoryApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["category-tree"] });
      setEditingCategory(null);
      reset();
      setImagePreview("");
      setImageFile(null);
      setShowCreateModal(false);
      toast.success("Category updated successfully!");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update category"
      );
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: categoryApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["category-tree"] });
      toast.success("Category deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to delete category"
      );
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
    resolver: zodResolver(createCategorySchema),
  });

  const watchedImage = watch("image");

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleImageFile(file);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = "";
  };

  // Process image file with size validation
  const handleImageFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    // Validate file size (10MB = 10 * 1024 * 1024 bytes)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error(
        `Image size must be less than 10MB. Your file is ${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)}MB`
      );
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);

      // 🔑 THIS IS THE MISSING LINE
      setValue("image", result, {
        shouldValidate: true,
        shouldDirty: true,
      });
    };
    reader.readAsDataURL(file);
  };

  // Upload image to S3
  const uploadImageToS3 = async (): Promise<string | null> => {
    if (!imageFile) return null;

    setIsUploadingImage(true);
    const uploadToast = toast.loading("Uploading image...");

    try {
      const response = await s3Api.uploadSingle(imageFile, "categories");

      if (!response.success) {
        throw new Error("Failed to upload image");
      }

      toast.success("Image uploaded successfully!", { id: uploadToast });
      return response.url;
    } catch (error: any) {
      console.error("Image upload error:", error);
      toast.error(error?.response?.data?.message || "Failed to upload image", {
        id: uploadToast,
      });
      throw error;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const onSubmit = async (data: CreateCategoryFormData) => {
    try {
      // Upload image to S3 if there's a new file
      let imageUrl = data.image || "";
      if (imageFile) {
        const uploadedUrl = await uploadImageToS3();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const submitData = {
        ...data,
        parentId: data.parentId ? data.parentId : null,
        isActive: data.isActive ?? true,
        order: data.order ?? 0,
        image: imageUrl,
      };

      if (editingCategory) {
        await updateMutation.mutateAsync({
          id: editingCategory.id,
          data: submitData,
        });
      } else {
        await createMutation.mutateAsync(submitData);
      }
    } catch (error) {
      console.error("Category submit error:", error);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setValue("name", category.name);
    setValue("description", category.description || "");
    setValue("parentId", category.parentId ?? null);
    setValue("metaTitle", category.metaTitle || "");
    setValue("metaDesc", category.metaDesc || "");
    setValue("image", category.image || "");
    setValue("isActive", category.isActive);
    setValue("order", category.order);
    setImagePreview(category.image || "");
    setImageFile(null);
    setShowCreateModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      deleteMutation.mutate(id);
    }
  };

  const rootCategories =
    categoryTree ||
    categoriesData?.categories?.filter((cat) => !cat.parentId) ||
    [];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header with View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage product categories
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("tree")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "tree"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Tree View"
              >
                <FolderTree className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "table"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Grid View"
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
            </div>

            {canCreate && (
              <button
                onClick={() => {
                  setEditingCategory(null);
                  reset({
                    name: "",
                    description: "",
                    parentId: "",
                    metaTitle: "",
                    metaDesc: "",
                    image: "",
                    isActive: true,
                    order: 0,
                  });
                  setImagePreview("");
                  setImageFile(null);
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Category</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
          </div>
        </div>

        {/* Categories Display */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading categories...</p>
          </div>
        ) : categoriesData?.categories?.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FolderTree className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No categories found</p>
            {canCreate && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first category
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Tree View */}
            {viewMode === "tree" && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
                  <p className="text-sm font-medium text-gray-700">
                    Category Hierarchy
                  </p>
                </div>
                <div className="divide-y divide-gray-100">
                  {rootCategories.map((category) => (
                    <CategoryTreeNode
                      key={category.id}
                      category={category}
                      level={0}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      canUpdate={canUpdate}
                      canDelete={canDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Table View */}
            {viewMode === "table" && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Parent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Products
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                          Order
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        {(canUpdate || canDelete) && (
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {categoriesData?.categories?.map((category) => (
                        <tr key={category.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              {category.image ? (
                                <img
                                  src={category.image}
                                  alt={category.name}
                                  className="h-10 w-10 rounded-lg object-cover mr-3"
                                />
                              ) : (
                                <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                                  <FolderTree className="h-5 w-5 text-gray-500" />
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {category.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {category.slug}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {category.parent?.name || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {category._count?.products || 0}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 hidden sm:table-cell">
                            {category.order}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${
                                category.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {category.isActive ? (
                                <>
                                  <Eye className="h-3 w-3 mr-1" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-3 w-3 mr-1" />
                                  Inactive
                                </>
                              )}
                            </span>
                          </td>
                          {(canUpdate || canDelete) && (
                            <td className="px-6 py-4 text-right text-sm font-medium">
                              {canUpdate && (
                                <button
                                  onClick={() => handleEdit(category)}
                                  className="text-blue-600 hover:text-blue-900 mr-3"
                                >
                                  <Edit className="h-4 w-4 inline" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => handleDelete(category.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 className="h-4 w-4 inline" />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoriesData?.categories?.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingCategory ? "Edit Category" : "Create Category"}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingCategory(null);
                    reset();
                    setImagePreview("");
                    setImageFile(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={
                    isUploadingImage ||
                    createMutation.isPending ||
                    updateMutation.isPending
                  }
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    {...register("name")}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Electronics, Clothing, etc."
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    {...register("description")}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Category description..."
                  />
                </div>

                {/* Parent Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Category
                  </label>
                  <select
                    {...register("parentId")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None (Root Category)</option>
                    {categoriesData?.categories
                      ?.filter((cat) => cat.id !== editingCategory?.id)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.parent?.name ? `${cat.parent.name} > ` : ""}
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Image Upload with Drag & Drop */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Image
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
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {imagePreview ? (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-32 w-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview("");
                            setImageFile(null);
                            setValue("image", "");
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          Drag & drop an image here, or click to select
                        </p>
                        <p className="text-xs text-gray-500 mb-2">
                          PNG, JPG, WEBP up to 10MB
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Browse files
                        </label>
                      </>
                    )}
                  </div>
                  {errors.image && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.image.message}
                    </p>
                  )}
                </div>

                {/* Meta Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Title
                    </label>
                    <input
                      {...register("metaTitle")}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="SEO title (max 60 chars)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Description
                    </label>
                    <input
                      {...register("metaDesc")}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="SEO description (max 160 chars)"
                    />
                  </div>
                </div>

                {/* Order & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Order
                    </label>
                    <input
                      {...register("order", { valueAsNumber: true })}
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
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
                      setEditingCategory(null);
                      reset();
                      setImagePreview("");
                      setImageFile(null);
                    }}
                    disabled={
                      isUploadingImage ||
                      createMutation.isPending ||
                      updateMutation.isPending
                    }
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isUploadingImage ||
                      createMutation.isPending ||
                      updateMutation.isPending
                    }
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isUploadingImage ||
                    createMutation.isPending ||
                    updateMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {isUploadingImage ? "Uploading..." : "Saving..."}
                      </>
                    ) : editingCategory ? (
                      "Update Category"
                    ) : (
                      "Create Category"
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
              You have read-only access to categories. Contact your
              administrator for additional permissions.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default CategoriesPage;
