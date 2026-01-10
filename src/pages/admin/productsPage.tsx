// import React, { useState } from "react";
// import {
//   useForm,
//   useFieldArray,
//   type SubmitHandler,
//   type Resolver,
// } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import { MainLayout } from "@/components/layouts/mainLayout";
// import { usePermissions } from "@/hooks/usePermissions";

// import {
//   Plus,
//   Edit,
//   Trash2,
//   X,
//   Package,
//   Search,
//   Filter,
//   Grid3x3,
//   List,
//   Eye,
//   Upload,
//   Image as ImageIcon,
//   Tag,
//   Layers,
//   DollarSign,
//   Box,
//   AlertCircle,
//   CheckCircle,
//   Info,
//   ChevronRight,
//   Sparkles,
//   TrendingUp,
//   ShoppingCart,
//   Palette,
//   Ruler,
//   Warehouse as WarehouseIcon,
//   MapPin,
//   User,
//   FileText,
//   Save,
//   ChevronLeft,
// } from "lucide-react";
// import { productApi } from "@/lib/api/product.api";
// import { categoryApi } from "@/lib/api/category.api";
// import { warehouseApi } from "@/lib/api/warehouse.api";
// import {
//   createProductSchema,
//   type CreateProductFormData,
// } from "@/lib/types/product/schema";
// import type { Product } from "@/lib/types/product/prodcut";
// import type { Category } from "@/lib/types/category/category";
// import ProductFormSteps from "@/components/productsFormSteps";

// // Stats Card
// const StatsCard: React.FC<{
//   icon: React.ReactNode;
//   label: string;
//   value: string | number;
//   color: string;
//   subtitle?: string;
//   trend?: string;
// }> = ({ icon, label, value, color, subtitle, trend }) => {
//   const colorMap = {
//     blue: "bg-blue-100 text-blue-600",
//     green: "bg-green-100 text-green-600",
//     orange: "bg-orange-100 text-orange-600",
//     purple: "bg-purple-100 text-purple-600",
//   };

//   return (
//     <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
//       <div className="flex items-center justify-between">
//         <div>
//           <p className="text-sm font-medium text-gray-600">{label}</p>
//           <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
//           {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
//           {trend && (
//             <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
//               <TrendingUp className="h-3 w-3" />
//               {trend}
//             </p>
//           )}
//         </div>
//         <div
//           className={`h-12 w-12 rounded-full flex items-center justify-center ${
//             colorMap[color as keyof typeof colorMap]
//           }`}
//         >
//           {icon}
//         </div>
//       </div>
//     </div>
//   );
// };

// // Product Card
// const ProductCard: React.FC<{
//   product: Product;
//   onEdit: (product: Product) => void;
//   onDelete: (id: string) => void;
//   onView: (id: string) => void;
//   canUpdate: boolean;
//   canDelete: boolean;
// }> = ({ product, onEdit, onDelete, onView, canUpdate, canDelete }) => {
//   const mainImage = product.images?.[0]?.url;

//   return (
//     <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-300 group">
//       {/* Image */}
//       <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200">
//         {mainImage ? (
//           <img
//             src={mainImage}
//             alt={product.name}
//             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
//           />
//         ) : (
//           <div className="w-full h-full flex items-center justify-center">
//             <Package className="h-20 w-20 text-gray-400" />
//           </div>
//         )}

//         {/* Badges */}
//         <div className="absolute top-3 right-3 flex flex-col gap-2">
//           {product.hasVariants && (
//             <span className="px-2.5 py-1 bg-purple-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">
//               <Layers className="h-3 w-3" />
//               {product.variants?.length || 0}
//             </span>
//           )}
//           <span
//             className={`px-2.5 py-1 text-xs font-bold rounded-full shadow-lg ${
//               product.isActive
//                 ? "bg-green-500 text-white"
//                 : "bg-red-500 text-white"
//             }`}
//           >
//             {product.isActive ? "LIVE" : "DRAFT"}
//           </span>
//         </div>

//         {/* Image Count */}
//         {product.images && product.images.length > 1 && (
//           <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black bg-opacity-70 text-white text-xs font-medium rounded-full flex items-center gap-1">
//             <ImageIcon className="h-3 w-3" />
//             {product.images.length}
//           </div>
//         )}
//       </div>

//       {/* Content */}
//       <div className="p-4">
//         {/* Title */}
//         <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-1">
//           {product.name}
//         </h3>

//         {/* Category */}
//         {product.category && (
//           <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
//             <Tag className="h-3.5 w-3.5" />
//             <span>{product.category.name}</span>
//           </div>
//         )}

//         {/* Price Section */}
//         <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
//           <div>
//             <p className="text-xs text-gray-500 uppercase tracking-wide">
//               Price
//             </p>
//             <p className="text-2xl font-bold text-blue-600">
//               ₹{product.sellingPrice.toLocaleString()}
//             </p>
//             {product.basePrice !== product.sellingPrice && (
//               <p className="text-xs text-gray-400 line-through">
//                 ₹{product.basePrice.toLocaleString()}
//               </p>
//             )}
//           </div>
//           <div className="text-right">
//             <p className="text-xs text-gray-500 uppercase tracking-wide">SKU</p>
//             <p className="text-sm font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
//               {product.sku}
//             </p>
//           </div>
//         </div>

//         {/* Variants Info */}
//         {product.hasVariants &&
//           product.variants &&
//           product.variants.length > 0 && (
//             <div className="mb-3 p-2.5 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
//               <p className="text-xs font-semibold text-purple-700 flex items-center gap-1.5">
//                 <Layers className="h-3.5 w-3.5" />
//                 {product.variants.length} Variant
//                 {product.variants.length > 1 ? "s" : ""} Available
//               </p>
//               <div className="flex gap-1 mt-1.5 flex-wrap">
//                 {product.variants.slice(0, 3).map((variant, idx) => (
//                   <span
//                     key={idx}
//                     className="text-xs bg-white px-2 py-0.5 rounded border border-purple-200 text-purple-700"
//                   >
//                     {variant.size || variant.color || variant.fabric}
//                   </span>
//                 ))}
//                 {product.variants.length > 3 && (
//                   <span className="text-xs text-purple-600 font-medium">
//                     +{product.variants.length - 3} more
//                   </span>
//                 )}
//               </div>
//             </div>
//           )}

//         {/* Actions */}
//         <div className="grid grid-cols-3 gap-2">
//           <button
//             onClick={() => onView(product.id)}
//             className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1"
//             title="View Details"
//           >
//             <Eye className="h-4 w-4" />
//           </button>
//           {canUpdate && (
//             <button
//               onClick={() => onEdit(product)}
//               className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-1"
//               title="Edit Product"
//             >
//               <Edit className="h-4 w-4" />
//             </button>
//           )}
//           {canDelete && (
//             <button
//               onClick={() => onDelete(product.id)}
//               className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center gap-1"
//               title="Delete Product"
//             >
//               <Trash2 className="h-4 w-4" />
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// // Step Indicator
// const StepIndicator: React.FC<{
//   currentStep: number;
//   totalSteps: number;
//   stepLabels: string[];
// }> = ({ currentStep, totalSteps, stepLabels }) => {
//   return (
//     <div className="mb-8">
//       <div className="flex items-center justify-between">
//         {stepLabels.map((label, index) => {
//           const stepNum = index + 1;
//           const isActive = stepNum === currentStep;
//           const isCompleted = stepNum < currentStep;

//           return (
//             <React.Fragment key={stepNum}>
//               <div className="flex flex-col items-center">
//                 <div
//                   className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
//                     isCompleted
//                       ? "bg-green-500 text-white"
//                       : isActive
//                       ? "bg-blue-600 text-white ring-4 ring-blue-100"
//                       : "bg-gray-200 text-gray-500"
//                   }`}
//                 >
//                   {isCompleted ? <CheckCircle className="h-5 w-5" /> : stepNum}
//                 </div>
//                 <p
//                   className={`text-xs mt-2 font-medium ${
//                     isActive ? "text-blue-600" : "text-gray-500"
//                   }`}
//                 >
//                   {label}
//                 </p>
//               </div>
//               {stepNum < totalSteps && (
//                 <div
//                   className={`flex-1 h-1 mx-2 rounded ${
//                     isCompleted ? "bg-green-500" : "bg-gray-200"
//                   }`}
//                 />
//               )}
//             </React.Fragment>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// const ProductsPage: React.FC = () => {
//   const queryClient = useQueryClient();
//   const { hasPermission } = usePermissions();

//   // UI State
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [filterCategory, setFilterCategory] = useState("");
//   const [filterActive, setFilterActive] = useState<boolean | undefined>(
//     undefined
//   );
//   const [filterHasVariants, setFilterHasVariants] = useState<
//     boolean | undefined
//   >(undefined);

//   // Multi-step form state
//   const [currentStep, setCurrentStep] = useState(1);
//   const [productType, setProductType] = useState<"simple" | "variable">(
//     "simple"
//   );
//   const [imagePreview, setImagePreview] = useState<string[]>([]);

//   const canCreate = hasPermission("products", "canCreate");
//   const canUpdate = hasPermission("products", "canUpdate");
//   const canDelete = hasPermission("products", "canDelete");

//   // Queries
//   const { data: productsData, isLoading } = useQuery({
//     queryKey: [
//       "products",
//       searchQuery,
//       filterCategory,
//       filterActive,
//       filterHasVariants,
//     ],
//     queryFn: async () => {
//       const response = await productApi.getProducts({
//         limit: 100,
//         search: searchQuery || undefined,
//         categoryId: filterCategory || undefined,
//         isActive: filterActive,
//         hasVariants: filterHasVariants,
//       });
//       return response.data;
//     },
//   });

//   const { data: categoriesData } = useQuery({
//     queryKey: ["categories"],
//     queryFn: async () => {
//       const response = await categoryApi.getCategories({ limit: 100 });
//       return response.data;
//     },
//   });

//   const { data: warehousesData } = useQuery({
//     queryKey: ["warehouses-active"],
//     queryFn: async () => {
//       const response = await warehouseApi.getActiveWarehouses();
//       return response.data;
//     },
//   });

//   // Mutations
//   const createMutation = useMutation({
//     mutationFn: productApi.createProduct,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["products"] });
//       setShowCreateModal(false);
//       setCurrentStep(1);
//       reset();
//       setImagePreview([]);
//     },
//   });

//   const deleteMutation = useMutation({
//     mutationFn: productApi.deleteProduct,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["products"] });
//     },
//   });

//   // Form
//   const {
//     register,
//     handleSubmit,
//     reset,
//     control,
//     watch,
//     setValue,
//     formState: { errors },
//   } = useForm<CreateProductFormData>({
//     resolver: zodResolver(
//       createProductSchema
//     ) as Resolver<CreateProductFormData>,
//     defaultValues: {
//       specifications: [],
//       images: [],
//       variants: productType === "variable" ? [] : undefined,
//       stock:
//         productType === "simple" ? { warehouseId: "", quantity: 0 } : undefined,
//     },
//   });

//   const {
//     fields: specFields,
//     append: appendSpec,
//     remove: removeSpec,
//   } = useFieldArray({ control, name: "specifications" });

//   const {
//     fields: imageFields,
//     append: appendImage,
//     remove: removeImage,
//   } = useFieldArray({ control, name: "images" });

//   const {
//     fields: variantFields,
//     append: appendVariant,
//     remove: removeVariant,
//   } = useFieldArray({ control, name: "variants" });

//   // Handlers
//   const onSubmit: SubmitHandler<CreateProductFormData> = (data) => {
//     createMutation.mutate(data);
//   };

//   const handleDelete = (id: string) => {
//     if (window.confirm("Delete this product? This cannot be undone.")) {
//       deleteMutation.mutate(id);
//     }
//   };

//   const handleView = (id: string) => {
//     console.log("View product:", id);
//   };

//   const handleEdit = (product: Product) => {
//     console.log("Edit product:", product);
//   };

//   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = e.target.files;
//     if (files) {
//       Array.from(files).forEach((file) => {
//         const reader = new FileReader();
//         reader.onloadend = () => {
//           const url = reader.result as string;
//           setImagePreview((prev) => [...prev, url]);
//           appendImage({ url, altText: file.name, order: imageFields.length });
//         };
//         reader.readAsDataURL(file);
//       });
//     }
//   };

//   const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 5));
//   const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

//   // Stats
//   const totalProducts = productsData?.products?.length || 0;
//   const activeProducts =
//     productsData?.products?.filter((p) => p.isActive).length || 0;
//   const productsWithVariants =
//     productsData?.products?.filter((p) => p.hasVariants).length || 0;

//   const filteredProducts = productsData?.products || [];

//   const stepLabels = [
//     "Type",
//     "Basic Info",
//     "Images",
//     productType === "variable" ? "Variants" : "Stock",
//     "Review",
//   ];

//   return (
//     <MainLayout>
//       <div className="space-y-6">
//         {/* Header */}
//         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
//               <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
//                 <Package className="h-7 w-7 text-white" />
//               </div>
//               Products
//             </h1>
//             <p className="text-sm text-gray-600 mt-2">
//               Manage your complete product catalog
//             </p>
//           </div>

//           {canCreate && (
//             <button
//               onClick={() => {
//                 reset();
//                 setCurrentStep(1);
//                 setProductType("simple");
//                 setImagePreview([]);
//                 setShowCreateModal(true);
//               }}
//               className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl font-medium"
//             >
//               <Sparkles className="h-4 w-4" />
//               <span className="hidden sm:inline">Create Product</span>
//               <span className="sm:hidden">Create</span>
//             </button>
//           )}
//         </div>

//         {/* Stats */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//           <StatsCard
//             icon={<Package className="h-6 w-6" />}
//             label="Total Products"
//             value={totalProducts}
//             color="blue"
//             subtitle="In catalog"
//             trend="+12% this month"
//           />
//           <StatsCard
//             icon={<CheckCircle className="h-6 w-6" />}
//             label="Active"
//             value={activeProducts}
//             color="green"
//             subtitle="Live on store"
//           />
//           <StatsCard
//             icon={<Layers className="h-6 w-6" />}
//             label="With Variants"
//             value={productsWithVariants}
//             color="purple"
//             subtitle="Variable products"
//           />
//           <StatsCard
//             icon={<ShoppingCart className="h-6 w-6" />}
//             label="Orders"
//             value="1,234"
//             color="orange"
//             subtitle="This month"
//             trend="+8%"
//           />
//         </div>

//         {/* Filters */}
//         <div className="bg-white rounded-lg shadow-md p-4">
//           <div className="flex flex-col lg:flex-row gap-4">
//             <div className="flex-1 relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//               <input
//                 type="text"
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 placeholder="Search products by name, SKU, or description..."
//                 className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>

//             <select
//               value={filterCategory}
//               onChange={(e) => setFilterCategory(e.target.value)}
//               className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
//             >
//               <option value="">All Categories</option>
//               {categoriesData?.categories?.map((cat: Category) => (
//                 <option key={cat.id} value={cat.id}>
//                   {cat.name}
//                 </option>
//               ))}
//             </select>

//             <select
//               value={
//                 filterActive === undefined
//                   ? "all"
//                   : filterActive
//                   ? "active"
//                   : "inactive"
//               }
//               onChange={(e) => {
//                 const value = e.target.value;
//                 setFilterActive(
//                   value === "all" ? undefined : value === "active"
//                 );
//               }}
//               className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
//             >
//               <option value="all">All Status</option>
//               <option value="active">Active Only</option>
//               <option value="inactive">Inactive Only</option>
//             </select>

//             <select
//               value={
//                 filterHasVariants === undefined
//                   ? "all"
//                   : filterHasVariants
//                   ? "variable"
//                   : "simple"
//               }
//               onChange={(e) => {
//                 const value = e.target.value;
//                 setFilterHasVariants(
//                   value === "all" ? undefined : value === "variable"
//                 );
//               }}
//               className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
//             >
//               <option value="all">All Types</option>
//               <option value="simple">Simple</option>
//               <option value="variable">Variable</option>
//             </select>

//             <div className="flex items-center bg-gray-100 rounded-lg p-1">
//               <button
//                 onClick={() => setViewMode("grid")}
//                 className={`p-2 rounded-md transition-colors ${
//                   viewMode === "grid"
//                     ? "bg-white text-blue-600 shadow-sm"
//                     : "text-gray-600 hover:text-gray-900"
//                 }`}
//               >
//                 <Grid3x3 className="h-4 w-4" />
//               </button>
//               <button
//                 onClick={() => setViewMode("table")}
//                 className={`p-2 rounded-md transition-colors ${
//                   viewMode === "table"
//                     ? "bg-white text-blue-600 shadow-sm"
//                     : "text-gray-600 hover:text-gray-900"
//                 }`}
//               >
//                 <List className="h-4 w-4" />
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Products Display */}
//         {isLoading ? (
//           <div className="bg-white rounded-lg shadow-md p-12 text-center">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
//             <p className="mt-4 text-gray-500">Loading products...</p>
//           </div>
//         ) : filteredProducts.length === 0 ? (
//           <div className="bg-white rounded-lg shadow-md p-12 text-center">
//             <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
//               <Package className="h-10 w-10 text-blue-600" />
//             </div>
//             <p className="text-gray-700 text-lg font-semibold">
//               No products found
//             </p>
//             <p className="text-gray-500 text-sm mt-2">
//               {searchQuery || filterCategory
//                 ? "Try adjusting your filters"
//                 : "Get started by creating your first product"}
//             </p>
//             {canCreate && !searchQuery && (
//               <button
//                 onClick={() => setShowCreateModal(true)}
//                 className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
//               >
//                 Create First Product
//               </button>
//             )}
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//             {filteredProducts.map((product) => (
//               <ProductCard
//                 key={product.id}
//                 product={product}
//                 onEdit={handleEdit}
//                 onDelete={handleDelete}
//                 onView={handleView}
//                 canUpdate={canUpdate}
//                 canDelete={canDelete}
//               />
//             ))}
//           </div>
//         )}

//         {/* Create Product Modal - Part 2 coming next */}
//         {showCreateModal && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//             <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
//               {/* Header */}
//               <div className="sticky top-0 ">
//                 <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
//                   <div className="flex items-center gap-3">
//                     <Sparkles className="h-6 w-6" />
//                     <div>
//                       <h2 className="text-xl font-bold">Create New Product</h2>
//                       <p className="text-sm text-blue-100">
//                         Step {currentStep} of 5
//                       </p>
//                     </div>
//                   </div>
//                   <button
//                     onClick={() => {
//                       setShowCreateModal(false);
//                       setCurrentStep(1);
//                       reset();
//                     }}
//                     className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
//                   >
//                     <X className="h-6 w-6" />
//                   </button>
//                 </div>
//                 <div className="p-6">
//                   <StepIndicator
//                     currentStep={currentStep}
//                     totalSteps={5}
//                     stepLabels={stepLabels}
//                   />
//                 </div>
//               </div>
//               <div className="p-6 h-[60vh] overflow-y-auto">
//                 <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//                   {/* Render appropriate step */}
//                   <ProductFormSteps
//                     currentStep={currentStep}
//                     productType={productType}
//                     setProductType={setProductType}
//                     register={register}
//                     errors={errors}
//                     categories={categoriesData}
//                     warehouses={warehousesData}
//                     specFields={specFields}
//                     appendSpec={appendSpec}
//                     removeSpec={removeSpec}
//                     imageFields={imageFields}
//                     appendImage={appendImage}
//                     removeImage={removeImage}
//                     variantFields={variantFields}
//                     appendVariant={appendVariant}
//                     removeVariant={removeVariant}
//                     imagePreview={imagePreview}
//                     setImagePreview={setImagePreview}
//                     handleImageUpload={handleImageUpload}
//                     watch={watch}
//                   />

//                   {/* Navigation Buttons */}
//                   <div className="sticky bottom-0 flex justify-between pt-6">
//                     {currentStep > 1 && (
//                       <button
//                         type="button"
//                         onClick={prevStep}
//                         className="px-4 py-2.5 bg-gray-50 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium inline-flex items-center gap-2"
//                       >
//                         <ChevronLeft className="h-4 w-4" />
//                         Previous
//                       </button>
//                     )}
//                     {currentStep < 5 ? (
//                       <button
//                         type="button"
//                         onClick={nextStep}
//                         className="ml-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2"
//                       >
//                         Next
//                         <ChevronRight className="h-4 w-4" />
//                       </button>
//                     ) : (
//                       <button
//                         type="submit"
//                         disabled={createMutation.isPending}
//                         className="ml-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
//                       >
//                         {createMutation.isPending ? (
//                           <>
//                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
//                             Creating...
//                           </>
//                         ) : (
//                           <>
//                             <Save className="h-4 w-4" />
//                             Create Product
//                           </>
//                         )}
//                       </button>
//                     )}
//                   </div>
//                 </form>
//               </div>
//             </div>
//           </div>
//         )}

//         {!canCreate && !canUpdate && !canDelete && (
//           <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
//             <p className="text-sm text-yellow-800">
//               You have read-only access. Contact your administrator for
//               permissions.
//             </p>
//           </div>
//         )}
//       </div>
//     </MainLayout>
//   );
// };

// export default ProductsPage;
import React, { useState } from "react";
import {
  useForm,
  useFieldArray,
  type SubmitHandler,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layouts/mainLayout";
import { usePermissions } from "@/hooks/usePermissions";

import {
  Plus,
  Edit,
  Trash2,
  X,
  Package,
  Search,
  Filter,
  Grid3x3,
  List,
  Eye,
  Upload,
  Image as ImageIcon,
  Tag,
  Layers,
  DollarSign,
  Box,
  AlertCircle,
  CheckCircle,
  Info,
  ChevronRight,
  Sparkles,
  TrendingUp,
  ShoppingCart,
  Palette,
  Ruler,
  Warehouse as WarehouseIcon,
  MapPin,
  User,
  FileText,
  Save,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { productApi } from "@/lib/api/product.api";
import { categoryApi } from "@/lib/api/category.api";
import { warehouseApi } from "@/lib/api/warehouse.api";
import {
  createProductSchema,
  type CreateProductFormData,
} from "@/lib/types/product/schema";
import type { Product } from "@/lib/types/product/prodcut";
import type { Category } from "@/lib/types/category/category";
import ProductFormSteps from "@/components/productsFormSteps";
import { s3Api } from "@/lib/api/s3.api";
import { toast } from "react-hot-toast";


interface ImagePreviewItem {
  file: File;
  preview: string;
  isPrimary: boolean;
  id: string;
}

// Stats Card (unchanged)
const StatsCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  subtitle?: string;
  trend?: string;
}> = ({ icon, label, value, color, subtitle, trend }) => {
  const colorMap = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {trend}
            </p>
          )}
        </div>
        <div
          className={`h-12 w-12 rounded-full flex items-center justify-center ${
            colorMap[color as keyof typeof colorMap]
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

// Product Card (unchanged)
const ProductCard: React.FC<{
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  canUpdate: boolean;
  canDelete: boolean;
}> = ({ product, onEdit, onDelete, onView, canUpdate, canDelete }) => {
  const mainImage = product.images?.[0]?.url;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-300 group">
      <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200">
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-20 w-20 text-gray-400" />
          </div>
        )}

        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {product.hasVariants && (
            <span className="px-2.5 py-1 bg-purple-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">
              <Layers className="h-3 w-3" />
              {product.variants?.length || 0}
            </span>
          )}
          <span
            className={`px-2.5 py-1 text-xs font-bold rounded-full shadow-lg ${
              product.isActive
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {product.isActive ? "LIVE" : "DRAFT"}
          </span>
        </div>

        {product.images && product.images.length > 1 && (
          <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black bg-opacity-70 text-white text-xs font-medium rounded-full flex items-center gap-1">
            <ImageIcon className="h-3 w-3" />
            {product.images.length}
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-1">
          {product.name}
        </h3>

        {product.category && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
            <Tag className="h-3.5 w-3.5" />
            <span>{product.category.name}</span>
          </div>
        )}

        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Price
            </p>
            <p className="text-2xl font-bold text-blue-600">
              ₹{product.sellingPrice.toLocaleString()}
            </p>
            {product.basePrice !== product.sellingPrice && (
              <p className="text-xs text-gray-400 line-through">
                ₹{product.basePrice.toLocaleString()}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide">SKU</p>
            <p className="text-sm font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
              {product.sku}
            </p>
          </div>
        </div>

        {product.hasVariants &&
          product.variants &&
          product.variants.length > 0 && (
            <div className="mb-3 p-2.5 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
              <p className="text-xs font-semibold text-purple-700 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                {product.variants.length} Variant
                {product.variants.length > 1 ? "s" : ""} Available
              </p>
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {product.variants.slice(0, 3).map((variant, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-white px-2 py-0.5 rounded border border-purple-200 text-purple-700"
                  >
                    {variant.size || variant.color || variant.fabric}
                  </span>
                ))}
                {product.variants.length > 3 && (
                  <span className="text-xs text-purple-600 font-medium">
                    +{product.variants.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onView(product.id)}
            className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          {canUpdate && (
            <button
              onClick={() => onEdit(product)}
              className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-1"
              title="Edit Product"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(product.id)}
              className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center gap-1"
              title="Delete Product"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Step Indicator (unchanged)
const StepIndicator: React.FC<{
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}> = ({ currentStep, totalSteps, stepLabels }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {stepLabels.map((label, index) => {
          const stepNum = index + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;

          return (
            <React.Fragment key={stepNum}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isActive
                      ? "bg-blue-600 text-white ring-4 ring-blue-100"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isCompleted ? <CheckCircle className="h-5 w-5" /> : stepNum}
                </div>
                <p
                  className={`text-xs mt-2 font-medium ${
                    isActive ? "text-blue-600" : "text-gray-500"
                  }`}
                >
                  {label}
                </p>
              </div>
              {stepNum < totalSteps && (
                <div
                  className={`flex-1 h-1 mx-2 rounded ${
                    isCompleted ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  // UI State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | undefined>(
    undefined
  );
  const [filterHasVariants, setFilterHasVariants] = useState<
    boolean | undefined
  >(undefined);

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const [productType, setProductType] = useState<"simple" | "variable">(
    "simple"
  );
  const [imagePreviews, setImagePreviews] = useState<ImagePreviewItem[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const canCreate = hasPermission("products", "canCreate");
  const canUpdate = hasPermission("products", "canUpdate");
  const canDelete = hasPermission("products", "canDelete");

  // Queries
  const { data: productsData, isLoading } = useQuery({
    queryKey: [
      "products",
      searchQuery,
      filterCategory,
      filterActive,
      filterHasVariants,
    ],
    queryFn: async () => {
      const response = await productApi.getProducts({
        limit: 100,
        search: searchQuery || undefined,
        categoryId: filterCategory || undefined,
        isActive: filterActive,
        hasVariants: filterHasVariants,
      });
      return response.data;
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await categoryApi.getCategories({ limit: 100 });
      return response.data;
    },
  });

  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses-active"],
    queryFn: async () => {
      const response = await warehouseApi.getActiveWarehouses();
      return response.data;
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: productApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowCreateModal(false);
      setCurrentStep(1);
      reset();
      setImagePreviews([]);
      toast.success("Product created successfully!");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create product");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: productApi.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete product");
    },
  });

  // Form
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateProductFormData>({
    resolver: zodResolver(
      createProductSchema
    ) as Resolver<CreateProductFormData>,
    defaultValues: {
      specifications: [],
      images: [],
      variants: productType === "variable" ? [] : undefined,
      stock:
        productType === "simple" ? { warehouseId: "", quantity: 0 } : undefined,
    },
  });

  const {
    fields: specFields,
    append: appendSpec,
    remove: removeSpec,
  } = useFieldArray({ control, name: "specifications" });

  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({ control, name: "images" });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({ control, name: "variants" });

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const preview = reader.result as string;
        const id = `${Date.now()}-${index}`;

        setImagePreviews((prev) => [
          ...prev,
          {
            file,
            preview,
            isPrimary: prev.length === 0, // First image is primary by default
            id,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = "";
  };

  // Upload images to S3 and get URLs
  const uploadImagesToS3 = async (): Promise<string[]> => {
    if (imagePreviews.length === 0) return [];

    setIsUploadingImages(true);
    const uploadToast = toast.loading("Uploading images...");

    try {
      // Sort images: primary first, then by order
      const sortedImages = [...imagePreviews].sort((a, b) => {
        if (a.isPrimary) return -1;
        if (b.isPrimary) return 1;
        return 0;
      });

      const files = sortedImages.map((img) => img.file);

      // Upload multiple files at once
      const response = await s3Api.uploadMultiple(files, "products");

      if (!response.success) {
        throw new Error("Failed to upload images");
      }
      console.log("response", response);
      

      const urls = response.files?.map((item:any) => item.url);

      toast.success("Images uploaded successfully!", { id: uploadToast });
      return urls;
    } catch (error: any) {
      console.error("Image upload error:", error);
      toast.error(error?.response?.data?.message || "Failed to upload images", {
        id: uploadToast,
      });
      throw error;
    } finally {
      setIsUploadingImages(false);
    }
  };

  // Form Submit Handler
  const onSubmit: SubmitHandler<CreateProductFormData> = async (data) => {
    try {
      // Upload images first if any
      let imageUrls: string[] = [];
      if (imagePreviews.length > 0) {
        imageUrls = await uploadImagesToS3();
      }

      // Prepare images payload
      const images = imageUrls.map((url, index) => ({
        url,
        altText: `${data.name} - Image ${index + 1}`,
        order: index,
      }));

      // Create product with image URLs
      const productData = {
        ...data,
        images,
      };
      console.log("prodcutData", productData);

      await createMutation.mutateAsync(productData);
    } catch (error) {
      console.error("Product creation error:", error);
      // Error toast already handled in uploadImagesToS3 or mutation
    }
  };

  console.log("errors",errors);
  
  // Other Handlers
  const handleDelete = (id: string) => {
    if (window.confirm("Delete this product? This cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = (id: string) => {
    console.log("View product:", id);
    // toast.info("View product feature coming soon!");
     toast((t) => (
       <span>
         View <b>Prodcut</b> feature coming soon!
         <button onClick={() => toast.dismiss(t.id)}>Dismiss</button>
       </span>
     ));
  };

  const handleEdit = (product: Product) => {
    console.log("Edit product:", product);
    // toast.info("Edit product feature coming soon!");
    toast((t) => (
      <span>
        Edit <b>Prodcut</b> feature coming soon!
        <button onClick={() => toast.dismiss(t.id)}>Dismiss</button>
      </span>
    ));
  };

  const nextStep = () => {
    // Validate current step before moving forward
    if (currentStep === 1 && !productType) {
      toast.error("Please select a product type");
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  // Stats
  const totalProducts = productsData?.products?.length || 0;
  const activeProducts =
    productsData?.products?.filter((p) => p.isActive).length || 0;
  const productsWithVariants =
    productsData?.products?.filter((p) => p.hasVariants).length || 0;

  const filteredProducts = productsData?.products || [];

  const stepLabels = [
    "Type",
    "Basic Info",
    "Images",
    productType === "variable" ? "Variants" : "Stock",
    "Review",
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <Package className="h-7 w-7 text-white" />
              </div>
              Products
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              Manage your complete product catalog
            </p>
          </div>

          {canCreate && (
            <button
              onClick={() => {
                reset();
                setCurrentStep(1);
                setProductType("simple");
                setImagePreviews([]);
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl font-medium"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Create Product</span>
              <span className="sm:hidden">Create</span>
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={<Package className="h-6 w-6" />}
            label="Total Products"
            value={totalProducts}
            color="blue"
            subtitle="In catalog"
            trend="+12% this month"
          />
          <StatsCard
            icon={<CheckCircle className="h-6 w-6" />}
            label="Active"
            value={activeProducts}
            color="green"
            subtitle="Live on store"
          />
          <StatsCard
            icon={<Layers className="h-6 w-6" />}
            label="With Variants"
            value={productsWithVariants}
            color="purple"
            subtitle="Variable products"
          />
          <StatsCard
            icon={<ShoppingCart className="h-6 w-6" />}
            label="Orders"
            value="1,234"
            color="orange"
            subtitle="This month"
            trend="+8%"
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
                placeholder="Search products by name, SKU, or description..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All Categories</option>
              {categoriesData?.categories?.map((cat: Category) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
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
              onChange={(e) => {
                const value = e.target.value;
                setFilterActive(
                  value === "all" ? undefined : value === "active"
                );
              }}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            <select
              value={
                filterHasVariants === undefined
                  ? "all"
                  : filterHasVariants
                  ? "variable"
                  : "simple"
              }
              onChange={(e) => {
                const value = e.target.value;
                setFilterHasVariants(
                  value === "all" ? undefined : value === "variable"
                );
              }}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Types</option>
              <option value="simple">Simple</option>
              <option value="variable">Variable</option>
            </select>

            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "table"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Products Display */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-10 w-10 text-blue-600" />
            </div>
            <p className="text-gray-700 text-lg font-semibold">
              No products found
            </p>
            <p className="text-gray-500 text-sm mt-2">
              {searchQuery || filterCategory
                ? "Try adjusting your filters"
                : "Get started by creating your first product"}
            </p>
            {canCreate && !searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Create First Product
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                canUpdate={canUpdate}
                canDelete={canDelete}
              />
            ))}
          </div>
        )}

        {/* Create Product Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
              {/* Header */}
              <div className="sticky top-0">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-6 w-6" />
                    <div>
                      <h2 className="text-xl font-bold">Create New Product</h2>
                      <p className="text-sm text-blue-100">
                        Step {currentStep} of 5
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setCurrentStep(1);
                      reset();
                      setImagePreviews([]);
                    }}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                    disabled={isUploadingImages || createMutation.isPending}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="p-6">
                  <StepIndicator
                    currentStep={currentStep}
                    totalSteps={5}
                    stepLabels={stepLabels}
                  />
                </div>
              </div>

              {/* Form Content */}
              <div className="p-6 h-[60vh] overflow-y-auto">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <ProductFormSteps
                    currentStep={currentStep}
                    productType={productType}
                    setProductType={setProductType}
                    register={register}
                    errors={errors}
                    categories={categoriesData}
                    warehouses={warehousesData}
                    specFields={specFields}
                    appendSpec={appendSpec}
                    removeSpec={removeSpec}
                    imageFields={imageFields}
                    appendImage={appendImage}
                    removeImage={removeImage}
                    variantFields={variantFields}
                    appendVariant={appendVariant}
                    removeVariant={removeVariant}
                    imagePreviews={imagePreviews}
                    setImagePreviews={setImagePreviews}
                    handleImageUpload={handleImageUpload}
                    watch={watch}
                  />

                  {/* Navigation Buttons */}
                  <div className="sticky bottom-0 flex justify-between pt-6 bg-gradient-to-t from-white via-white to-transparent pb-4">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={prevStep}
                        disabled={isUploadingImages || createMutation.isPending}
                        className="px-4 py-2.5 bg-gray-50 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </button>
                    )}
                    {currentStep < 5 ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        disabled={isUploadingImages || createMutation.isPending}
                        className="ml-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isUploadingImages || createMutation.isPending}
                        className="ml-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploadingImages || createMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {isUploadingImages
                              ? "Uploading Images..."
                              : "Creating..."}
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Create Product
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </form>
              </div>
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

export default ProductsPage;