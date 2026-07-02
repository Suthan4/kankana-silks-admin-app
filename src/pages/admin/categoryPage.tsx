import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Eye,
  EyeOff,
  FolderTree,
  Grid3x3,
  Link2,
  List,
  Loader2,
  Plus,
  Trash2,
  Unlink,
  Upload,
  X,
} from "lucide-react";

import { MainLayout } from "@/components/layouts/mainLayout";
import { BackButton } from "@/components/ui/BackButton";
import { usePermissions } from "@/hooks/usePermissions";
import { categoryApi } from "@/lib/api/category.api";
import { s3Api } from "@/lib/api/s3.api";
import type {
  Category,
  CreateCategoryData,
  UpdateCategoryData,
} from "@/lib/types/category/category";
import {
  createCategorySchema,
  linkCategorySchema,
  type CreateCategoryFormData,
  type CreateCategoryFormInput,
  type LinkCategoryFormData,
  type LinkCategoryFormInput,
} from "@/lib/types/category/schema";

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.message || fallback;

const getParentNames = (category: Category): string[] => {
  if (category.parents?.length) {
    return category.parents.map((parent) => parent.name);
  }

  if (category.parentPlacements?.length) {
    return category.parentPlacements
      .map((placement) => placement.parent?.name)
      .filter((name): name is string => Boolean(name));
  }

  return category.parent ? [category.parent.name] : [];
};

interface CategoryTreeNodeProps {
  category: Category;
  level: number;
  incomingPlacementId?: string;
  incomingPlacementOrder?: number;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onLink: (parentId: string) => void;
  onUnlink: (placementId: string, categoryName: string) => void;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

const CategoryTreeNode: React.FC<CategoryTreeNodeProps> = ({
  category,
  level,
  incomingPlacementId,
  incomingPlacementOrder,
  onEdit,
  onDelete,
  onLink,
  onUnlink,
  canCreate,
  canUpdate,
  canDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const childPlacements = (category.childPlacements ?? []).filter((placement) =>
    Boolean(placement.child),
  );
  const hasChildren = childPlacements.length > 0;

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <div
        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
        style={{ paddingLeft: `${level * 2 + 1}rem` }}
      >
        <button
          type="button"
          onClick={() => setIsExpanded((value) => !value)}
          className={`rounded p-1 transition-colors hover:bg-gray-200 ${
            !hasChildren ? "invisible" : ""
          }`}
          aria-label={isExpanded ? "Collapse category" : "Expand category"}
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200">
              <FolderTree className="h-5 w-5 text-gray-500" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium text-gray-900">
              {category.name}
            </p>

            {category.isRoot && (
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-800">
                Root
              </span>
            )}

            <span
              className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                category.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {category.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="truncate">{category.slug}</span>
            <span>{category._count?.products ?? 0} products</span>
            <span className="hidden sm:inline">
              Category order: {category.order}
            </span>
            {incomingPlacementOrder !== undefined && (
              <span>Placement order: {incomingPlacementOrder}</span>
            )}
          </div>
        </div>

        {(canCreate || canUpdate || canDelete) && (
          <div className="flex flex-shrink-0 items-center gap-1">
            {canCreate && (
              <button
                type="button"
                onClick={() => onLink(category.id)}
                className="rounded-lg p-2 text-purple-600 transition-colors hover:bg-purple-50"
                title="Link an existing category under this category"
              >
                <Link2 className="h-4 w-4" />
              </button>
            )}

            {canUpdate && (
              <button
                type="button"
                onClick={() => onEdit(category)}
                className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                title="Edit category"
              >
                <Edit className="h-4 w-4" />
              </button>
            )}

            {incomingPlacementId && canDelete && (
              <button
                type="button"
                onClick={() => onUnlink(incomingPlacementId, category.name)}
                className="rounded-lg p-2 text-orange-600 transition-colors hover:bg-orange-50"
                title="Unlink from this parent"
              >
                <Unlink className="h-4 w-4" />
              </button>
            )}

            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(category)}
                className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                title="Delete category"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div>
          {childPlacements.map((placement) => (
            <CategoryTreeNode
              key={placement.id}
              category={placement.child as Category}
              level={level + 1}
              incomingPlacementId={placement.id}
              incomingPlacementOrder={placement.order}
              onEdit={onEdit}
              onDelete={onDelete}
              onLink={onLink}
              onUnlink={onUnlink}
              canCreate={canCreate}
              canUpdate={canUpdate}
              canDelete={canDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface CategoryCardProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onLink: (parentId: string) => void;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onEdit,
  onDelete,
  onLink,
  canCreate,
  canUpdate,
  canDelete,
}) => {
  const parentNames = getParentNames(category);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        {category.image ? (
          <img
            src={category.image}
            alt={category.name}
            className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gray-200">
            <FolderTree className="h-8 w-8 text-gray-500" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-base font-semibold text-gray-900">
                  {category.name}
                </h3>
                {category.isRoot && (
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-800">
                    Root
                  </span>
                )}
              </div>
              <p className="truncate text-sm text-gray-500">{category.slug}</p>
            </div>

            <span
              className={`flex-shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                category.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {category.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-600">
            <span>
              Parents: {parentNames.length ? parentNames.join(", ") : "None"}
            </span>
            <span>{category._count?.products ?? 0} products</span>
            <span>Order: {category.order}</span>
          </div>

          {(canCreate || canUpdate || canDelete) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {canCreate && (
                <button
                  type="button"
                  onClick={() => onLink(category.id)}
                  className="flex-1 rounded-lg bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-600 transition-colors hover:bg-purple-100"
                >
                  Link child
                </button>
              )}

              {canUpdate && (
                <button
                  type="button"
                  onClick={() => onEdit(category)}
                  className="flex-1 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100"
                >
                  Edit
                </button>
              )}

              {canDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(category)}
                  className="flex-1 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
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

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<"tree" | "table" | "grid">("tree");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const canCreate = hasPermission("categories", "canCreate");
  const canUpdate = hasPermission("categories", "canUpdate");
  const canDelete = hasPermission("categories", "canDelete");

  const invalidateCategoryQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
      queryClient.invalidateQueries({ queryKey: ["category-tree"] }),
    ]);
  };

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await categoryApi.getCategories({
        limit: 100,
        sortBy: "order",
        sortOrder: "asc",
      });
      return response.data;
    },
  });

  const { data: categoryTree } = useQuery({
    queryKey: ["category-tree"],
    queryFn: async () => {
      const response = await categoryApi.getCategoryTree();
      return response.data;
    },
  });

  const categoryOptions = useMemo(
    () =>
      [...(categoriesData?.categories ?? [])].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    [categoriesData?.categories],
  );

  const rootCategories = useMemo(() => {
    const tree = categoryTree ?? [];
    const roots = tree.filter(
      (category) =>
        category.isRoot || (category.parentPlacements?.length ?? 0) === 0,
    );

    return roots.length > 0 ? roots : tree;
  }, [categoryTree]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateCategoryFormInput, unknown, CreateCategoryFormData>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      parentId: undefined,
      isRoot: false,
      metaTitle: "",
      metaDesc: "",
      image: "",
      isActive: true,
      order: 0,
      hasVideoConsultation: false,
      videoPurchasingEnabled: false,
      videoConsultationNote: "",
    },
  });

  const {
    register: registerLink,
    handleSubmit: handleLinkSubmit,
    reset: resetLink,
    watch: watchLink,
    formState: { errors: linkErrors },
  } = useForm<LinkCategoryFormInput, unknown, LinkCategoryFormData>({
    resolver: zodResolver(linkCategorySchema),
    defaultValues: {
      parentId: "",
      childId: "",
      order: 0,
    },
  });

  const watchedParentId = watch("parentId");
  const watchedLinkParentId = watchLink("parentId");

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    reset();
    setImagePreview("");
    setImageFile(null);
  };

  const closeLinkModal = () => {
    setShowLinkModal(false);
    resetLink({ parentId: "", childId: "", order: 0 });
  };

  const createMutation = useMutation({
    mutationFn: categoryApi.createCategory,
    onSuccess: async () => {
      await invalidateCategoryQueries();
      closeCategoryModal();
      toast.success("Category created successfully!");
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to create category"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryData }) =>
      categoryApi.updateCategory(id, data),
    onSuccess: async () => {
      await invalidateCategoryQueries();
      closeCategoryModal();
      toast.success("Category updated successfully!");
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to update category"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoryApi.deleteCategory,
    onSuccess: async () => {
      await invalidateCategoryQueries();
      toast.success("Category deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to delete category"));
    },
  });

  const linkMutation = useMutation({
    mutationFn: categoryApi.linkCategory,
    onSuccess: async () => {
      await invalidateCategoryQueries();
      closeLinkModal();
      toast.success("Category linked successfully!");
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to link category"));
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: categoryApi.unlinkCategory,
    onSuccess: async () => {
      await invalidateCategoryQueries();
      toast.success("Category unlinked successfully!");
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to unlink category"));
    },
  });

  const openCreateModal = () => {
    setEditingCategory(null);
    reset({
      name: "",
      description: "",
      parentId: undefined,
      isRoot: false,
      metaTitle: "",
      metaDesc: "",
      image: "",
      isActive: true,
      order: 0,
      hasVideoConsultation: false,
      videoPurchasingEnabled: false,
      videoConsultationNote: "",
    });
    setImagePreview("");
    setImageFile(null);
    setShowCategoryModal(true);
  };

  const openLinkModal = (parentId?: string) => {
    resetLink({
      parentId: parentId ?? "",
      childId: "",
      order: 0,
    });
    setShowLinkModal(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    reset({
      name: category.name,
      description: category.description ?? "",
      parentId: undefined,
      isRoot: category.isRoot ?? false,
      metaTitle: category.metaTitle ?? "",
      metaDesc: category.metaDesc ?? "",
      image: category.image ?? "",
      isActive: category.isActive,
      order: category.order,
      hasVideoConsultation: category.hasVideoConsultation ?? false,
      videoPurchasingEnabled: category.videoPurchasingEnabled ?? false,
      videoConsultationNote: category.videoConsultationNote ?? "",
    });
    setImagePreview(category.image ?? "");
    setImageFile(null);
    setShowCategoryModal(true);
  };

  const handleImageFile = (file: File) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG and WEBP images are allowed");
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(
        `Image size must be less than 10MB. Your file is ${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)}MB`,
      );
      return;
    }

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setValue("image", result, {
        shouldValidate: true,
        shouldDirty: true,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];
    if (file) handleImageFile(file);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleImageFile(file);
    event.target.value = "";
  };

  const uploadImageToS3 = async (): Promise<string | null> => {
    if (!imageFile) return null;

    setIsUploadingImage(true);
    const uploadToast = toast.loading("Uploading image...");

    try {
      const response = await s3Api.uploadSingle(imageFile, "categories");
      if (!response.success) throw new Error("Failed to upload image");

      toast.success("Image uploaded successfully!", { id: uploadToast });
      return response.url;
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Failed to upload image"), {
        id: uploadToast,
      });
      throw error;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const onSubmit = async (data: CreateCategoryFormData) => {
    try {
      let imageUrl = data.image ?? "";
      const previousImageUrl = editingCategory?.image;

      if (imageFile) {
        const uploadedUrl = await uploadImageToS3();
        if (uploadedUrl) imageUrl = uploadedUrl;
      }

      if (editingCategory) {
        const updateData: UpdateCategoryData = {
          name: data.name,
          description: data.description,
          isRoot: data.isRoot ?? false,
          metaTitle: data.metaTitle,
          metaDesc: data.metaDesc,
          image: imageUrl,
          isActive: data.isActive ?? true,
          order: data.order ?? 0,
          hasVideoConsultation: data.hasVideoConsultation ?? false,
          videoPurchasingEnabled: data.videoPurchasingEnabled ?? false,
          videoConsultationNote: data.videoConsultationNote,
        };

        await updateMutation.mutateAsync({
          id: editingCategory.id,
          data: updateData,
        });

        if (imageFile && previousImageUrl && previousImageUrl !== imageUrl) {
          try {
            await s3Api.deleteFileByUrl(previousImageUrl);
          } catch (error) {
            console.error("Failed to delete old category image:", error);
          }
        }

        return;
      }

      const createData: CreateCategoryData = {
        name: data.name,
        description: data.description,
        parentId: data.parentId || undefined,
        isRoot: data.parentId ? false : (data.isRoot ?? false),
        metaTitle: data.metaTitle,
        metaDesc: data.metaDesc,
        image: imageUrl,
        isActive: data.isActive ?? true,
        order: data.order ?? 0,
        hasVideoConsultation: data.hasVideoConsultation ?? false,
        videoPurchasingEnabled: data.videoPurchasingEnabled ?? false,
        videoConsultationNote: data.videoConsultationNote,
      };

      await createMutation.mutateAsync(createData);
    } catch (error) {
      console.error("Category submit error:", error);
    }
  };

  const onLinkSubmit = async (data: LinkCategoryFormData) => {
    try {
      await linkMutation.mutateAsync({
        parentId: data.parentId,
        childId: data.childId,
        order: data.order ?? 0,
      });
    } catch (error) {
      console.error("Link category error:", error);
    }
  };

  const handleDelete = async (category: Category) => {
    const confirmed = window.confirm(
      `Delete “${category.name}”? This deletes the category itself, not only a placement.`,
    );
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(category.id);

      if (category.image) {
        try {
          await s3Api.deleteFileByUrl(category.image);
        } catch (error) {
          console.error("Failed to delete category image from S3:", error);
        }
      }
    } catch (error) {
      console.error("Delete category error:", error);
    }
  };

  const handleUnlink = async (placementId: string, categoryName: string) => {
    const confirmed = window.confirm(
      `Unlink “${categoryName}” from this parent? The category itself will not be deleted.`,
    );
    if (!confirmed) return;

    try {
      await unlinkMutation.mutateAsync(placementId);
    } catch (error) {
      console.error("Unlink category error:", error);
    }
  };

  const isCategorySaving =
    isUploadingImage || createMutation.isPending || updateMutation.isPending;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage categories and link one category under multiple parents
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setViewMode("tree")}
                className={`rounded-md p-2 transition-colors ${
                  viewMode === "tree"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Tree view"
              >
                <FolderTree className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`rounded-md p-2 transition-colors ${
                  viewMode === "table"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Table view"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`rounded-md p-2 transition-colors ${
                  viewMode === "grid"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Grid view"
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
            </div>

            {canCreate && (
              <>
                <button
                  type="button"
                  onClick={() => openLinkModal()}
                  className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-purple-700 transition-colors hover:bg-purple-100"
                >
                  <Link2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Link Existing</span>
                  <span className="sm:hidden">Link</span>
                </button>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Category</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-lg bg-white p-12 text-center shadow-md">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-600" />
            <p className="mt-4 text-gray-500">Loading categories...</p>
          </div>
        ) : categoriesData?.categories.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow-md">
            <FolderTree className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <p className="text-gray-500">No categories found</p>
            {canCreate && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-4 font-medium text-blue-600 hover:text-blue-700"
              >
                Create your first category
              </button>
            )}
          </div>
        ) : (
          <>
            {viewMode === "tree" && (
              <div className="overflow-hidden rounded-lg bg-white shadow-md">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-sm font-medium text-gray-700">
                    Placement-based category hierarchy
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
                      onLink={openLinkModal}
                      onUnlink={handleUnlink}
                      canCreate={canCreate}
                      canUpdate={canUpdate}
                      canDelete={canDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {viewMode === "table" && (
              <div className="overflow-hidden rounded-lg bg-white shadow-md">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Parents
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Products
                        </th>
                        <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 sm:table-cell">
                          Order
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Status
                        </th>
                        {(canCreate || canUpdate || canDelete) && (
                          <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200 bg-white">
                      {categoriesData?.categories.map((category) => {
                        const parentNames = getParentNames(category);

                        return (
                          <tr key={category.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                {category.image ? (
                                  <img
                                    src={category.image}
                                    alt={category.name}
                                    className="mr-3 h-10 w-10 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200">
                                    <FolderTree className="h-5 w-5 text-gray-500" />
                                  </div>
                                )}

                                <div>
                                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                    {category.name}
                                    {category.isRoot && (
                                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-800">
                                        Root
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {category.slug}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4 text-sm text-gray-500">
                              {parentNames.length
                                ? parentNames.join(", ")
                                : "-"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {category._count?.products ?? 0}
                            </td>
                            <td className="hidden px-6 py-4 text-sm text-gray-900 sm:table-cell">
                              {category.order}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold leading-5 ${
                                  category.isActive
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {category.isActive ? (
                                  <>
                                    <Eye className="mr-1 h-3 w-3" /> Active
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="mr-1 h-3 w-3" /> Inactive
                                  </>
                                )}
                              </span>
                            </td>

                            {(canCreate || canUpdate || canDelete) && (
                              <td className="px-6 py-4 text-right text-sm font-medium">
                                {canCreate && (
                                  <button
                                    type="button"
                                    onClick={() => openLinkModal(category.id)}
                                    className="mr-3 text-purple-600 hover:text-purple-900"
                                    title="Link child"
                                  >
                                    <Link2 className="inline h-4 w-4" />
                                  </button>
                                )}
                                {canUpdate && (
                                  <button
                                    type="button"
                                    onClick={() => handleEdit(category)}
                                    className="mr-3 text-blue-600 hover:text-blue-900"
                                    title="Edit"
                                  >
                                    <Edit className="inline h-4 w-4" />
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(category)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Delete"
                                  >
                                    <Trash2 className="inline h-4 w-4" />
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {viewMode === "grid" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categoriesData?.categories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onLink={openLinkModal}
                    canCreate={canCreate}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {showCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingCategory ? "Edit Category" : "Create Category"}
                </h2>
                <button
                  type="button"
                  onClick={closeCategoryModal}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isCategorySaving}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Name *
                  </label>
                  <input
                    {...register("name")}
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Electronics, Clothing, etc."
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    {...register("description")}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Category description..."
                  />
                </div>

                {!editingCategory && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Create under parent
                    </label>
                    <select
                      {...register("parentId")}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No parent</option>
                      {categoryOptions.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name} ({category.slug})
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      This creates the category and its first placement
                      together.
                    </p>
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    {...register("isRoot")}
                    type="checkbox"
                    disabled={!editingCategory && Boolean(watchedParentId)}
                    className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500 disabled:opacity-50"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Show as a root/top-level category
                  </label>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Category Image
                  </label>
                  <div
                    onDrop={handleDrop}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
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
                          className="h-32 w-32 rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview("");
                            setImageFile(null);
                            setValue("image", "", {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }}
                          className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white transition-colors hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto mb-2 h-12 w-12 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-600">
                          Drag and drop an image here, or select a file
                        </p>
                        <p className="mb-2 text-xs text-gray-500">
                          JPG, PNG or WEBP up to 10MB
                        </p>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="category-image-upload"
                        />
                        <label
                          htmlFor="category-image-upload"
                          className="cursor-pointer font-medium text-blue-600 hover:text-blue-700"
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Meta Title
                    </label>
                    <input
                      {...register("metaTitle")}
                      type="text"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="SEO title (max 70 chars)"
                    />
                    {errors.metaTitle && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.metaTitle.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Meta Description
                    </label>
                    <input
                      {...register("metaDesc")}
                      type="text"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="SEO description (max 160 chars)"
                    />
                    {errors.metaDesc && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.metaDesc.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Category Order
                    </label>
                    <input
                      {...register("order", { valueAsNumber: true })}
                      type="number"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.order && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.order.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <div className="flex h-10 items-center">
                      <input
                        {...register("isActive")}
                        type="checkbox"
                        className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="mb-3 text-sm font-semibold text-gray-900">
                    Video Features
                  </h4>

                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        {...register("hasVideoConsultation")}
                        type="checkbox"
                        className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        Enable Video Consultation
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        {...register("videoPurchasingEnabled")}
                        type="checkbox"
                        className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        Enable Video Purchasing
                      </label>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Video Consultation Note
                      </label>
                      <textarea
                        {...register("videoConsultationNote")}
                        rows={2}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Add instructions for video consultation..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                  <button
                    type="button"
                    onClick={closeCategoryModal}
                    disabled={isCategorySaving}
                    className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCategorySaving}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isCategorySaving ? (
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

        {showLinkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Link Existing Category
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    The child category remains available in its other
                    placements.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeLinkModal}
                  disabled={linkMutation.isPending}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form
                onSubmit={handleLinkSubmit(onLinkSubmit)}
                className="space-y-4 p-6"
              >
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Parent Category *
                  </label>
                  <select
                    {...registerLink("parentId")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select parent category</option>
                    {categoryOptions.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name} ({category.slug})
                      </option>
                    ))}
                  </select>
                  {linkErrors.parentId && (
                    <p className="mt-1 text-sm text-red-600">
                      {linkErrors.parentId.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Category To Link *
                  </label>
                  <select
                    {...registerLink("childId")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select category</option>
                    {categoryOptions
                      .filter((category) => category.id !== watchedLinkParentId)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name} ({category.slug})
                        </option>
                      ))}
                  </select>
                  {linkErrors.childId && (
                    <p className="mt-1 text-sm text-red-600">
                      {linkErrors.childId.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Placement Order
                  </label>
                  <input
                    {...registerLink("order", { valueAsNumber: true })}
                    type="number"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {linkErrors.order && (
                    <p className="mt-1 text-sm text-red-600">
                      {linkErrors.order.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                  <button
                    type="button"
                    onClick={closeLinkModal}
                    disabled={linkMutation.isPending}
                    className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={linkMutation.isPending}
                    className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {linkMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Linking...
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4" /> Link Category
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {!canCreate && !canUpdate && !canDelete && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
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
