// // import React, { type JSX } from "react";
// // import {
// //   Package,
// //   Layers,
// //   Upload,
// //   X,
// //   Plus,
// //   DollarSign,
// //   Tag,
// //   FileText,
// //   User,
// //   MapPin,
// //   Warehouse as WarehouseIcon,
// //   Ruler,
// //   Palette,
// //   Box,
// //   AlertCircle,
// //   Info,
// //   CheckCircle,
// //   Trash2,
// // } from "lucide-react";
// // import type { Category } from "@/lib/types/category/category";
// // import type { CreateProductFormData } from "@/lib/types/product/schema";
// // import type { FieldErrors, UseFormRegister } from "react-hook-form";


// // interface ProductFormStepsProps {
// //   currentStep: number;
// //   productType: "simple" | "variable";
// //   setProductType: React.Dispatch<React.SetStateAction<"simple" | "variable">>;
// //   register: UseFormRegister<CreateProductFormData>;
// //   errors: FieldErrors<CreateProductFormData>;
// //   categories?: { categories: Category[] };
// //   warehouses?: any[];
// //   specFields: any[];
// //   appendSpec: (spec: { key: string; value: string }) => void;
// //   removeSpec: (index: number) => void;
// //   imageFields: any[];
// //   appendImage: (image: {
// //     url: string;
// //     altText?: string;
// //     order?: number;
// //   }) => void;
// //   removeImage: (index: number) => void;
// //   variantFields: any[];
// //   appendVariant: (variant: any) => void;
// //   removeVariant: (index: number) => void;
// //   imagePreview: string[];
// //   setImagePreview: React.Dispatch<React.SetStateAction<string[]>>;
// //   handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
// //   watch: any;
// // }

// // // Helper function to render category options with hierarchy
// // const renderCategoryOptions = (
// //   categories: Category[],
// //   level: number = 0
// // ): JSX.Element[] => {
// //   const options: JSX.Element[] = [];

// //   categories.forEach((cat) => {
// //     // Create indentation based on level
// //     const indent = "  ".repeat(level);
// //     const prefix = level > 0 ? "└─ " : "";

// //     options.push(
// //       <option key={cat.id} value={cat.id}>
// //         {indent}
// //         {prefix}
// //         {cat.name}
// //       </option>
// //     );

// //     // Recursively add children
// //     if (cat.children && cat.children.length > 0) {
// //       options.push(...renderCategoryOptions(cat.children, level + 1));
// //     }
// //   });

// //   return options;
// // };

// // const ProductFormSteps: React.FC<ProductFormStepsProps> = ({
// //   currentStep,
// //   productType,
// //   setProductType,
// //   register,
// //   errors,
// //   categories,
// //   warehouses,
// //   specFields,
// //   appendSpec,
// //   removeSpec,
// //   imageFields,
// //   appendImage,
// //   removeImage,
// //   variantFields,
// //   appendVariant,
// //   removeVariant,
// //   imagePreview,
// //   setImagePreview,
// //   handleImageUpload,
// //   watch,
// // }) => {
// //   // Step 1: Product Type Selection
// //   if (currentStep === 1) {
// //     return (
// //       <div className="space-y-4">
// //         <div className="text-center mb-8">
// //           <h3 className="text-2xl font-bold text-gray-900 mb-2">
// //             Choose Product Type
// //           </h3>
// //           <p className="text-gray-600">
// //             Select whether your product has variants like size, color, etc.
// //           </p>
// //         </div>

// //         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //           <button
// //             type="button"
// //             onClick={() => setProductType("simple")}
// //             className={`p-6 border-2 rounded-xl transition-all ${
// //               productType === "simple"
// //                 ? "border-blue-500 bg-blue-50 shadow-lg"
// //                 : "border-gray-200 hover:border-gray-300"
// //             }`}
// //           >
// //             <Package className="h-12 w-12 mx-auto mb-4 text-blue-600" />
// //             <h4 className="text-lg font-bold text-gray-900 mb-2">
// //               Simple Product
// //             </h4>
// //             <p className="text-sm text-gray-600">
// //               Single product with no variations. One price, one SKU.
// //             </p>
// //           </button>

// //           <button
// //             type="button"
// //             onClick={() => setProductType("variable")}
// //             className={`p-6 border-2 rounded-xl transition-all ${
// //               productType === "variable"
// //                 ? "border-purple-500 bg-purple-50 shadow-lg"
// //                 : "border-gray-200 hover:border-gray-300"
// //             }`}
// //           >
// //             <Layers className="h-12 w-12 mx-auto mb-4 text-purple-600" />
// //             <h4 className="text-lg font-bold text-gray-900 mb-2">
// //               Variable Product
// //             </h4>
// //             <p className="text-sm text-gray-600">
// //               Product with variants like size, color, fabric. Multiple SKUs.
// //             </p>
// //           </button>
// //         </div>
// //       </div>
// //     );
// //   }

// //   // Step 2: Basic Information
// //   if (currentStep === 2) {
// //     return (
// //       <div className="space-y-6">
// //         <div>
// //           <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
// //             <FileText className="h-6 w-6 text-blue-600" />
// //             Basic Information
// //           </h3>
// //         </div>

// //         {/* Product Name */}
// //         <div>
// //           <label className="block text-sm font-semibold text-gray-700 mb-2">
// //             Product Name *
// //           </label>
// //           <input
// //             {...register("name")}
// //             type="text"
// //             className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
// //             placeholder="e.g., Handwoven Cotton Saree"
// //           />
// //           {errors.name && (
// //             <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
// //               <AlertCircle className="h-4 w-4" />
// //               {errors.name.message}
// //             </p>
// //           )}
// //         </div>

// //         {/* Description */}
// //         <div>
// //           <label className="block text-sm font-semibold text-gray-700 mb-2">
// //             Description *
// //           </label>
// //           <textarea
// //             {...register("description")}
// //             rows={4}
// //             className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
// //             placeholder="Detailed product description..."
// //           />
// //           {errors.description && (
// //             <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
// //               <AlertCircle className="h-4 w-4" />
// //               {errors.description.message}
// //             </p>
// //           )}
// //         </div>

// //         {/* Category */}
// //         <div>
// //           <label className="block text-sm font-semibold text-gray-700 mb-2">
// //             Category *
// //           </label>
// //           <select
// //             {...register("categoryId")}
// //             className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono text-sm"
// //           >
// //             <option value="">Select a category</option>
// //             {categories?.categories &&
// //               renderCategoryOptions(
// //                 categories.categories.filter((cat) => !cat.parentId) // Only render root categories
// //               )}
// //           </select>
// //           {errors.categoryId && (
// //             <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
// //               <AlertCircle className="h-4 w-4" />
// //               {errors.categoryId.message}
// //             </p>
// //           )}
// //           <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
// //             <Info className="h-3 w-3" />
// //             Nested categories shown with indentation
// //           </p>
// //         </div>

// //         {/* Pricing */}
// //         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
// //           <div>
// //             <label className="block text-sm font-semibold text-gray-700 mb-2">
// //               Base Price *
// //             </label>
// //             <div className="relative">
// //               <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
// //                 ₹
// //               </span>
// //               <input
// //                 {...register("basePrice")}
// //                 type="number"
// //                 step="0.01"
// //                 className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 placeholder="0.00"
// //               />
// //             </div>
// //             {errors.basePrice && (
// //               <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
// //                 <AlertCircle className="h-4 w-4" />
// //                 {errors.basePrice.message}
// //               </p>
// //             )}
// //           </div>

// //           <div>
// //             <label className="block text-sm font-semibold text-gray-700 mb-2">
// //               Selling Price *
// //             </label>
// //             <div className="relative">
// //               <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
// //                 ₹
// //               </span>
// //               <input
// //                 {...register("sellingPrice")}
// //                 type="number"
// //                 step="0.01"
// //                 className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 placeholder="0.00"
// //               />
// //             </div>
// //             {errors.sellingPrice && (
// //               <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
// //                 <AlertCircle className="h-4 w-4" />
// //                 {errors.sellingPrice.message}
// //               </p>
// //             )}
// //           </div>
// //         </div>

// //         {/* HSN Code */}
// //         <div>
// //           <label className="block text-sm font-semibold text-gray-700 mb-2">
// //             HSN Code (Optional)
// //           </label>
// //           <input
// //             {...register("hsnCode")}
// //             type="text"
// //             className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
// //             placeholder="e.g., 5208"
// //           />
// //           <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
// //             <Info className="h-3 w-3" />
// //             HSN code for GST classification
// //           </p>
// //         </div>

// //         {/* Artisan Information */}
// //         <div className="border-t border-gray-200 pt-6">
// //           <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
// //             <User className="h-5 w-5 text-blue-600" />
// //             Artisan Information (Optional)
// //           </h4>

// //           <div className="space-y-4">
// //             <div>
// //               <label className="block text-sm font-medium text-gray-700 mb-2">
// //                 Artisan Name
// //               </label>
// //               <input
// //                 {...register("artisanName")}
// //                 type="text"
// //                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 placeholder="Name of the artisan"
// //               />
// //             </div>

// //             <div>
// //               <label className="block text-sm font-medium text-gray-700 mb-2">
// //                 About Artisan
// //               </label>
// //               <textarea
// //                 {...register("artisanAbout")}
// //                 rows={3}
// //                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 placeholder="Brief description about the artisan..."
// //               />
// //             </div>

// //             <div>
// //               <label className="block text-sm font-medium text-gray-700 mb-2">
// //                 Artisan Location
// //               </label>
// //               <div className="relative">
// //                 <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
// //                 <input
// //                   {...register("artisanLocation")}
// //                   type="text"
// //                   className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                   placeholder="e.g., Varanasi, Uttar Pradesh"
// //                 />
// //               </div>
// //             </div>
// //           </div>
// //         </div>

// //         {/* Specifications */}
// //         <div className="border-t border-gray-200 pt-6">
// //           <div className="flex items-center justify-between mb-4">
// //             <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
// //               <Tag className="h-5 w-5 text-blue-600" />
// //               Specifications
// //             </h4>
// //             <button
// //               type="button"
// //               onClick={() => appendSpec({ key: "", value: "" })}
// //               className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1"
// //             >
// //               <Plus className="h-4 w-4" />
// //               Add
// //             </button>
// //           </div>

// //           <div className="space-y-3">
// //             {specFields.map((field, index) => (
// //               <div key={field.id} className="flex gap-3">
// //                 <input
// //                   {...register(`specifications.${index}.key` as const)}
// //                   placeholder="Key (e.g., Fabric)"
// //                   className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 />
// //                 <input
// //                   {...register(`specifications.${index}.value` as const)}
// //                   placeholder="Value (e.g., Cotton)"
// //                   className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 />
// //                 <button
// //                   type="button"
// //                   onClick={() => removeSpec(index)}
// //                   className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
// //                 >
// //                   <X className="h-5 w-5" />
// //                 </button>
// //               </div>
// //             ))}
// //           </div>
// //         </div>

// //         {/* Active Status */}
// //         <div className="border-t border-gray-200 pt-6">
// //           <label className="flex items-center space-x-3 cursor-pointer">
// //             <input
// //               {...register("isActive")}
// //               type="checkbox"
// //               className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
// //             />
// //             <div>
// //               <span className="text-sm font-semibold text-gray-900">
// //                 Publish this product
// //               </span>
// //               <p className="text-xs text-gray-500">
// //                 Product will be visible on your store
// //               </p>
// //             </div>
// //           </label>
// //         </div>
// //       </div>
// //     );
// //   }

// //   // Step 3: Images
// //   if (currentStep === 3) {
// //     return (
// //       <div className="space-y-6">
// //         <div>
// //           <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
// //             <Upload className="h-6 w-6 text-blue-600" />
// //             Product Images
// //           </h3>
// //           <p className="text-sm text-gray-600">
// //             Upload high-quality images of your product. First image will be the
// //             main image.
// //           </p>
// //         </div>

// //         {/* Upload Area */}
// //         <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
// //           <input
// //             type="file"
// //             id="image-upload"
// //             multiple
// //             accept="image/*"
// //             onChange={handleImageUpload}
// //             className="hidden"
// //           />
// //           <label
// //             htmlFor="image-upload"
// //             className="cursor-pointer flex flex-col items-center"
// //           >
// //             <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
// //               <Upload className="h-8 w-8 text-blue-600" />
// //             </div>
// //             <p className="text-lg font-semibold text-gray-900 mb-1">
// //               Click to upload images
// //             </p>
// //             <p className="text-sm text-gray-500">
// //               or drag and drop PNG, JPG up to 5MB each
// //             </p>
// //           </label>
// //         </div>

// //         {/* Image Preview Grid */}
// //         {imagePreview.length > 0 && (
// //           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
// //             {imagePreview.map((url, index) => (
// //               <div key={index} className="relative group">
// //                 <img
// //                   src={url}
// //                   alt={`Preview ${index + 1}`}
// //                   className="w-full h-40 object-cover rounded-lg border-2 border-gray-200"
// //                 />
// //                 {index === 0 && (
// //                   <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
// //                     MAIN
// //                   </div>
// //                 )}
// //                 <button
// //                   type="button"
// //                   onClick={() => {
// //                     const newPreviews = imagePreview.filter(
// //                       (_, i) => i !== index
// //                     );
// //                     setImagePreview(newPreviews);
// //                     removeImage(index);
// //                   }}
// //                   className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
// //                 >
// //                   <X className="h-4 w-4" />
// //                 </button>
// //               </div>
// //             ))}
// //           </div>
// //         )}

// //         {imagePreview.length === 0 && (
// //           <div className="text-center py-8 bg-gray-50 rounded-lg">
// //             <p className="text-gray-500">No images uploaded yet</p>
// //           </div>
// //         )}
// //       </div>
// //     );
// //   }

// //   // Step 4: Stock or Variants
// //   if (currentStep === 4) {
// //     if (productType === "simple") {
// //       // Simple Product - Stock Management
// //       return (
// //         <div className="space-y-6">
// //           <div>
// //             <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
// //               <Box className="h-6 w-6 text-blue-600" />
// //               Stock Management
// //             </h3>
// //             <p className="text-sm text-gray-600">
// //               Set the initial stock for this product
// //             </p>
// //           </div>

// //           <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
// //             <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
// //             <div className="text-sm text-blue-900">
// //               <p className="font-semibold mb-1">Simple Product</p>
// //               <p>
// //                 This product has no variants. Set stock for the main warehouse.
// //               </p>
// //             </div>
// //           </div>

// //           {/* Warehouse Selection */}
// //           <div>
// //             <label className="block text-sm font-semibold text-gray-700 mb-2">
// //               Warehouse *
// //             </label>
// //             <select
// //               {...register("stock.warehouseId")}
// //               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
// //             >
// //               <option value="">Select warehouse</option>
// //               {warehouses?.map((wh: any) => (
// //                 <option key={wh.id} value={wh.id}>
// //                   {wh.name} ({wh.code})
// //                 </option>
// //               ))}
// //             </select>
// //             {errors.stock?.warehouseId && (
// //               <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
// //                 <AlertCircle className="h-4 w-4" />
// //                 {errors.stock.warehouseId.message}
// //               </p>
// //             )}
// //           </div>

// //           {/* Quantity */}
// //           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
// //             <div>
// //               <label className="block text-sm font-semibold text-gray-700 mb-2">
// //                 Initial Quantity *
// //               </label>
// //               <input
// //                 {...register("stock.quantity")}
// //                 type="number"
// //                 min="0"
// //                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 placeholder="0"
// //               />
// //               {errors.stock?.quantity && (
// //                 <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
// //                   <AlertCircle className="h-4 w-4" />
// //                   {errors.stock.quantity.message}
// //                 </p>
// //               )}
// //             </div>

// //             <div>
// //               <label className="block text-sm font-semibold text-gray-700 mb-2">
// //                 Low Stock Alert
// //               </label>
// //               <input
// //                 {...register("stock.lowStockThreshold")}
// //                 type="number"
// //                 min="0"
// //                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 placeholder="10"
// //               />
// //               <p className="mt-1.5 text-xs text-gray-500">
// //                 Get notified when stock falls below this number
// //               </p>
// //             </div>
// //           </div>
// //         </div>
// //       );
// //     } else {
// //       // Variable Product - Variants Management
// //       return (
// //         <div className="space-y-6">
// //           <div>
// //             <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
// //               <Layers className="h-6 w-6 text-purple-600" />
// //               Product Variants
// //             </h3>
// //             <p className="text-sm text-gray-600">
// //               Add different variants like sizes, colors, fabrics for this
// //               product
// //             </p>
// //           </div>

// //           <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
// //             <Info className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
// //             <div className="text-sm text-purple-900">
// //               <p className="font-semibold mb-1">Variable Product</p>
// //               <p>Each variant can have its own price, SKU, and stock level.</p>
// //             </div>
// //           </div>

// //           {/* Add Variant Button */}
// //           <button
// //             type="button"
// //             onClick={() =>
// //               appendVariant({
// //                 size: "",
// //                 color: "",
// //                 fabric: "",
// //                 price: 0,
// //                 stock: { warehouseId: "", quantity: 0 },
// //               })
// //             }
// //             className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 text-gray-700 font-medium"
// //           >
// //             <Plus className="h-5 w-5" />
// //             Add Variant
// //           </button>

// //           {/* Variants List */}
// //           <div className="space-y-4">
// //             {variantFields.map((field, index) => (
// //               <div
// //                 key={field.id}
// //                 className="border-2 border-gray-200 rounded-lg p-4 space-y-4"
// //               >
// //                 <div className="flex items-center justify-between">
// //                   <h5 className="font-semibold text-gray-900">
// //                     Variant {index + 1}
// //                   </h5>
// //                   <button
// //                     type="button"
// //                     onClick={() => removeVariant(index)}
// //                     className="text-red-600 hover:bg-red-50 p-2 rounded-lg"
// //                   >
// //                     <Trash2 className="h-4 w-4" />
// //                   </button>
// //                 </div>

// //                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
// //                   <div>
// //                     <label className="block text-xs font-medium text-gray-700 mb-1">
// //                       Size
// //                     </label>
// //                     <div className="relative">
// //                       <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
// //                       <input
// //                         {...register(`variants.${index}.size` as const)}
// //                         placeholder="e.g., M, L, XL"
// //                         className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
// //                       />
// //                     </div>
// //                   </div>

// //                   <div>
// //                     <label className="block text-xs font-medium text-gray-700 mb-1">
// //                       Color
// //                     </label>
// //                     <div className="relative">
// //                       <Palette className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
// //                       <input
// //                         {...register(`variants.${index}.color` as const)}
// //                         placeholder="e.g., Red, Blue"
// //                         className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
// //                       />
// //                     </div>
// //                   </div>

// //                   <div>
// //                     <label className="block text-xs font-medium text-gray-700 mb-1">
// //                       Fabric
// //                     </label>
// //                     <input
// //                       {...register(`variants.${index}.fabric` as const)}
// //                       placeholder="e.g., Cotton"
// //                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
// //                     />
// //                   </div>
// //                 </div>

// //                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //                   <div>
// //                     <label className="block text-xs font-medium text-gray-700 mb-1">
// //                       Price *
// //                     </label>
// //                     <div className="relative">
// //                       <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
// //                         ₹
// //                       </span>
// //                       <input
// //                         {...register(`variants.${index}.price` as const)}
// //                         type="number"
// //                         step="0.01"
// //                         className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
// //                         placeholder="0.00"
// //                       />
// //                     </div>
// //                   </div>

// //                   <div>
// //                     <label className="block text-xs font-medium text-gray-700 mb-1">
// //                       Stock Quantity *
// //                     </label>
// //                     <input
// //                       {...register(`variants.${index}.stock.quantity` as const)}
// //                       type="number"
// //                       min="0"
// //                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
// //                       placeholder="0"
// //                     />
// //                   </div>
// //                 </div>

// //                 <div>
// //                   <label className="block text-xs font-medium text-gray-700 mb-1">
// //                     Warehouse *
// //                   </label>
// //                   <select
// //                     {...register(
// //                       `variants.${index}.stock.warehouseId` as const
// //                     )}
// //                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
// //                   >
// //                     <option value="">Select warehouse</option>
// //                     {warehouses?.map((wh: any) => (
// //                       <option key={wh.id} value={wh.id}>
// //                         {wh.name} ({wh.code})
// //                       </option>
// //                     ))}
// //                   </select>
// //                 </div>
// //               </div>
// //             ))}
// //           </div>

// //           {variantFields.length === 0 && (
// //             <div className="text-center py-12 bg-gray-50 rounded-lg">
// //               <Layers className="h-12 w-12 text-gray-400 mx-auto mb-3" />
// //               <p className="text-gray-500 font-medium">No variants added yet</p>
// //               <p className="text-sm text-gray-400 mt-1">
// //                 Click "Add Variant" to create product variations
// //               </p>
// //             </div>
// //           )}
// //         </div>
// //       );
// //     }
// //   }

// //   // Step 5: Review & Create
// //   if (currentStep === 5) {
// //     const formData = watch();
// //     const categoryName = categories?.categories?.find(
// //       (c) => c.id === formData.categoryId
// //     )?.name;
// //     const warehouseName = warehouses?.find(
// //       (w: any) => w.id === formData.stock?.warehouseId
// //     )?.name;

// //     return (
// //       <div className="space-y-6">
// //         <div>
// //           <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
// //             <CheckCircle className="h-6 w-6 text-green-600" />
// //             Review Your Product
// //           </h3>
// //           <p className="text-sm text-gray-600">
// //             Please review all details before creating the product
// //           </p>
// //         </div>

// //         <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 space-y-4">
// //           {/* Product Type Badge */}
// //           <div className="flex items-center gap-3 flex-wrap">
// //             {productType === "simple" ? (
// //               <div className="px-4 py-2 bg-blue-600 text-white rounded-full flex items-center gap-2 font-semibold">
// //                 <Package className="h-5 w-5" />
// //                 Simple Product
// //               </div>
// //             ) : (
// //               <div className="px-4 py-2 bg-purple-600 text-white rounded-full flex items-center gap-2 font-semibold">
// //                 <Layers className="h-5 w-5" />
// //                 Variable Product
// //               </div>
// //             )}
// //             {formData.isActive && (
// //               <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-semibold">
// //                 Will be Published
// //               </span>
// //             )}
// //           </div>

// //           {/* Basic Info */}
// //           <div className="bg-white rounded-lg p-4 space-y-3">
// //             <h4 className="font-bold text-gray-900 text-lg">
// //               {formData.name || "Product Name"}
// //             </h4>
// //             <p className="text-sm text-gray-600">
// //               {formData.description || "No description provided"}
// //             </p>

// //             {categoryName && (
// //               <div className="flex items-center gap-2 text-sm">
// //                 <Tag className="h-4 w-4 text-gray-500" />
// //                 <span className="text-gray-600">Category:</span>
// //                 <span className="font-medium text-gray-900">
// //                   {categoryName}
// //                 </span>
// //               </div>
// //             )}

// //             <div className="flex items-center gap-6 text-sm pt-2 border-t border-gray-200">
// //               <div>
// //                 <span className="text-gray-500">Selling Price: </span>
// //                 <span className="font-bold text-blue-600 text-xl">
// //                   ₹{Number(formData.sellingPrice || 0).toLocaleString()}
// //                 </span>
// //               </div>
// //               {formData.basePrice &&
// //                 Number(formData.basePrice) !==
// //                   Number(formData.sellingPrice) && (
// //                   <div>
// //                     <span className="text-gray-500">Base Price: </span>
// //                     <span className="line-through text-gray-400">
// //                       ₹{Number(formData.basePrice).toLocaleString()}
// //                     </span>
// //                   </div>
// //                 )}
// //             </div>

// //             {formData.hsnCode && (
// //               <div className="text-sm">
// //                 <span className="text-gray-500">HSN Code: </span>
// //                 <span className="font-medium text-gray-900">
// //                   {formData.hsnCode}
// //                 </span>
// //               </div>
// //             )}
// //           </div>

// //           {/* Artisan Info */}
// //           {(formData.artisanName ||
// //             formData.artisanAbout ||
// //             formData.artisanLocation) && (
// //             <div className="bg-white rounded-lg p-4">
// //               <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
// //                 <User className="h-5 w-5 text-blue-600" />
// //                 Artisan Information
// //               </h5>
// //               <div className="space-y-2 text-sm">
// //                 {formData.artisanName && (
// //                   <div>
// //                     <span className="text-gray-500">Name: </span>
// //                     <span className="font-medium text-gray-900">
// //                       {formData.artisanName}
// //                     </span>
// //                   </div>
// //                 )}
// //                 {formData.artisanLocation && (
// //                   <div className="flex items-center gap-1">
// //                     <MapPin className="h-4 w-4 text-gray-400" />
// //                     <span className="text-gray-600">
// //                       {formData.artisanLocation}
// //                     </span>
// //                   </div>
// //                 )}
// //                 {formData.artisanAbout && (
// //                   <p className="text-gray-600 italic">
// //                     {formData.artisanAbout}
// //                   </p>
// //                 )}
// //               </div>
// //             </div>
// //           )}

// //           {/* Images */}
// //           {imagePreview.length > 0 && (
// //             <div className="bg-white rounded-lg p-4">
// //               <h5 className="font-semibold text-gray-900 mb-3">
// //                 Images ({imagePreview.length})
// //               </h5>
// //               <div className="grid grid-cols-4 gap-2">
// //                 {imagePreview.map((url, idx) => (
// //                   <div key={idx} className="relative">
// //                     <img
// //                       src={url}
// //                       alt={`Preview ${idx + 1}`}
// //                       className="w-full h-20 object-cover rounded-lg border-2 border-gray-200"
// //                     />
// //                     {idx === 0 && (
// //                       <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs font-bold rounded">
// //                         MAIN
// //                       </div>
// //                     )}
// //                   </div>
// //                 ))}
// //               </div>
// //             </div>
// //           )}

// //           {/* Stock (Simple Product) */}
// //           {productType === "simple" && formData.stock && (
// //             <div className="bg-white rounded-lg p-4">
// //               <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
// //                 <Box className="h-5 w-5 text-blue-600" />
// //                 Stock Information
// //               </h5>
// //               <div className="grid grid-cols-2 gap-4 text-sm">
// //                 <div>
// //                   <span className="text-gray-500">Warehouse: </span>
// //                   <span className="font-medium text-gray-900">
// //                     {warehouseName || "Not selected"}
// //                   </span>
// //                 </div>
// //                 <div>
// //                   <span className="text-gray-500">Quantity: </span>
// //                   <span className="font-bold text-blue-600 text-lg">
// //                     {formData.stock.quantity || 0}
// //                   </span>
// //                 </div>
// //                 {formData.stock.lowStockThreshold && (
// //                   <div>
// //                     <span className="text-gray-500">Low Stock Alert: </span>
// //                     <span className="font-medium text-gray-900">
// //                       {formData.stock.lowStockThreshold}
// //                     </span>
// //                   </div>
// //                 )}
// //               </div>
// //             </div>
// //           )}

// //           {/* Variants (Variable Product) */}
// //           {productType === "variable" && variantFields.length > 0 && (
// //             <div className="bg-white rounded-lg p-4">
// //               <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
// //                 <Layers className="h-5 w-5 text-purple-600" />
// //                 Variants ({variantFields.length})
// //               </h5>
// //               <div className="space-y-2">
// //                 {variantFields.map((field, idx) => {
// //                   const variant = formData.variants?.[idx];
// //                   const variantWarehouse = warehouses?.find(
// //                     (w: any) => w.id === variant?.stock?.warehouseId
// //                   );
// //                   const variantLabel =
// //                     [variant?.size, variant?.color, variant?.fabric]
// //                       .filter(Boolean)
// //                       .join(" / ") || `Variant ${idx + 1}`;

// //                   return (
// //                     <div
// //                       key={idx}
// //                       className="p-3 bg-purple-50 rounded-lg border border-purple-200"
// //                     >
// //                       <div className="flex items-center justify-between mb-2">
// //                         <span className="font-semibold text-gray-900">
// //                           {variantLabel}
// //                         </span>
// //                         <span className="text-purple-600 font-bold text-lg">
// //                           ₹{Number(variant?.price || 0).toLocaleString()}
// //                         </span>
// //                       </div>
// //                       <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
// //                         <div>
// //                           <span className="text-gray-500">Stock: </span>
// //                           <span className="font-medium">
// //                             {variant?.stock?.quantity || 0}
// //                           </span>
// //                         </div>
// //                         <div>
// //                           <span className="text-gray-500">Warehouse: </span>
// //                           <span className="font-medium">
// //                             {variantWarehouse?.name || "N/A"}
// //                           </span>
// //                         </div>
// //                       </div>
// //                     </div>
// //                   );
// //                 })}
// //               </div>
// //             </div>
// //           )}

// //           {/* Specifications */}
// //           {specFields.length > 0 && (
// //             <div className="bg-white rounded-lg p-4">
// //               <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
// //                 <Tag className="h-5 w-5 text-blue-600" />
// //                 Specifications ({specFields.length})
// //               </h5>
// //               <div className="grid grid-cols-2 gap-3 text-sm">
// //                 {specFields.map((field, idx) => {
// //                   const spec = formData.specifications?.[idx];
// //                   return spec?.key && spec?.value ? (
// //                     <div key={idx} className="p-2 bg-gray-50 rounded">
// //                       <span className="text-gray-500 font-medium">
// //                         {spec.key}:{" "}
// //                       </span>
// //                       <span className="text-gray-900">{spec.value}</span>
// //                     </div>
// //                   ) : null;
// //                 })}
// //               </div>
// //             </div>
// //           )}
// //         </div>

// //         <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
// //           <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
// //           <div className="text-sm text-yellow-900">
// //             <p className="font-semibold">Ready to create?</p>
// //             <p>Once created, you can still edit this product anytime.</p>
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return null;
// // };

// // export default ProductFormSteps;
// import React, { type JSX, useState } from "react";
// import {
//   Package,
//   Layers,
//   Upload,
//   X,
//   Plus,
//   DollarSign,
//   Tag,
//   FileText,
//   User,
//   MapPin,
//   Warehouse as WarehouseIcon,
//   Ruler,
//   Palette,
//   Box,
//   AlertCircle,
//   Info,
//   CheckCircle,
//   Trash2,
//   GripVertical,
//   Star,
//   ImageIcon,
// } from "lucide-react";
// import type { Category } from "@/lib/types/category/category";
// import type { CreateProductFormData } from "@/lib/types/product/schema";
// import type { FieldErrors, UseFormRegister } from "react-hook-form";

// interface ImagePreviewItem {
//   file: File;
//   preview: string;
//   isPrimary: boolean;
//   id: string;
// }

// interface ProductFormStepsProps {
//   currentStep: number;
//   productType: "simple" | "variable";
//   setProductType: React.Dispatch<React.SetStateAction<"simple" | "variable">>;
//   register: UseFormRegister<CreateProductFormData>;
//   errors: FieldErrors<CreateProductFormData>;
//   categories?: { categories: Category[] };
//   warehouses?: any[];
//   specFields: any[];
//   appendSpec: (spec: { key: string; value: string }) => void;
//   removeSpec: (index: number) => void;
//   imageFields: any[];
//   appendImage: (image: {
//     url: string;
//     altText?: string;
//     order?: number;
//   }) => void;
//   removeImage: (index: number) => void;
//   variantFields: any[];
//   appendVariant: (variant: any) => void;
//   removeVariant: (index: number) => void;
//   imagePreviews: ImagePreviewItem[];
//   setImagePreviews: React.Dispatch<React.SetStateAction<ImagePreviewItem[]>>;
//   handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
//   watch: any;
// }

// // Helper function to render category options with hierarchy
// const renderCategoryOptions = (
//   categories: Category[],
//   level: number = 0
// ): JSX.Element[] => {
//   const options: JSX.Element[] = [];

//   categories.forEach((cat) => {
//     // Create indentation based on level
//     const indent = "  ".repeat(level);
//     const prefix = level > 0 ? "└─ " : "";

//     options.push(
//       <option key={cat.id} value={cat.id}>
//         {indent}
//         {prefix}
//         {cat.name}
//       </option>
//     );

//     // Recursively add children
//     if (cat.children && cat.children.length > 0) {
//       options.push(...renderCategoryOptions(cat.children, level + 1));
//     }
//   });

//   return options;
// };

// const ProductFormSteps: React.FC<ProductFormStepsProps> = ({
//   currentStep,
//   productType,
//   setProductType,
//   register,
//   errors,
//   categories,
//   warehouses,
//   specFields,
//   appendSpec,
//   removeSpec,
//   imageFields,
//   appendImage,
//   removeImage,
//   variantFields,
//   appendVariant,
//   removeVariant,
//   imagePreviews,
//   setImagePreviews,
//   handleImageUpload,
//   watch,
// }) => {
//   const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

//   // Drag and drop handlers
//   const handleDragStart = (index: number) => {
//     setDraggedIndex(index);
//   };

//   const handleDragOver = (e: React.DragEvent, index: number) => {
//     e.preventDefault();
//     if (draggedIndex === null || draggedIndex === index) return;

//     const newPreviews = [...imagePreviews];
//     const draggedItem = newPreviews[draggedIndex];
//     newPreviews.splice(draggedIndex, 1);
//     newPreviews.splice(index, 0, draggedItem);

//     setImagePreviews(newPreviews);
//     setDraggedIndex(index);
//   };

//   const handleDragEnd = () => {
//     setDraggedIndex(null);
//   };

//   const handleSetPrimary = (id: string) => {
//     setImagePreviews((prev) =>
//       prev.map((img) => ({
//         ...img,
//         isPrimary: img.id === id,
//       }))
//     );
//   };

//   const handleRemoveImage = (id: string) => {
//     const index = imagePreviews.findIndex((img) => img.id === id);
//     setImagePreviews((prev) => {
//       const newPreviews = prev.filter((img) => img.id !== id);
//       // If removing primary image and there are others, make first one primary
//       if (prev[index]?.isPrimary && newPreviews.length > 0) {
//         newPreviews[0].isPrimary = true;
//       }
//       return newPreviews;
//     });
//     removeImage(index);
//   };

//   // Step 1: Product Type Selection
//   if (currentStep === 1) {
//     return (
//       <div className="space-y-4">
//         <div className="text-center mb-8">
//           <h3 className="text-2xl font-bold text-gray-900 mb-2">
//             Choose Product Type
//           </h3>
//           <p className="text-gray-600">
//             Select whether your product has variants like size, color, etc.
//           </p>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <button
//             type="button"
//             onClick={() => setProductType("simple")}
//             className={`p-6 border-2 rounded-xl transition-all ${
//               productType === "simple"
//                 ? "border-blue-500 bg-blue-50 shadow-lg"
//                 : "border-gray-200 hover:border-gray-300"
//             }`}
//           >
//             <Package className="h-12 w-12 mx-auto mb-4 text-blue-600" />
//             <h4 className="text-lg font-bold text-gray-900 mb-2">
//               Simple Product
//             </h4>
//             <p className="text-sm text-gray-600">
//               Single product with no variations. One price, one SKU.
//             </p>
//           </button>

//           <button
//             type="button"
//             onClick={() => setProductType("variable")}
//             className={`p-6 border-2 rounded-xl transition-all ${
//               productType === "variable"
//                 ? "border-purple-500 bg-purple-50 shadow-lg"
//                 : "border-gray-200 hover:border-gray-300"
//             }`}
//           >
//             <Layers className="h-12 w-12 mx-auto mb-4 text-purple-600" />
//             <h4 className="text-lg font-bold text-gray-900 mb-2">
//               Variable Product
//             </h4>
//             <p className="text-sm text-gray-600">
//               Product with variants like size, color, fabric. Multiple SKUs.
//             </p>
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // Step 2: Basic Information
//   if (currentStep === 2) {
//     return (
//       <div className="space-y-6">
//         <div>
//           <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
//             <FileText className="h-6 w-6 text-blue-600" />
//             Basic Information
//           </h3>
//         </div>

//         {/* Product Name */}
//         <div>
//           <label className="block text-sm font-semibold text-gray-700 mb-2">
//             Product Name *
//           </label>
//           <input
//             {...register("name")}
//             type="text"
//             className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             placeholder="e.g., Handwoven Cotton Saree"
//           />
//           {errors.name && (
//             <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
//               <AlertCircle className="h-4 w-4" />
//               {errors.name.message}
//             </p>
//           )}
//         </div>

//         {/* Description */}
//         <div>
//           <label className="block text-sm font-semibold text-gray-700 mb-2">
//             Description *
//           </label>
//           <textarea
//             {...register("description")}
//             rows={4}
//             className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             placeholder="Detailed product description..."
//           />
//           {errors.description && (
//             <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
//               <AlertCircle className="h-4 w-4" />
//               {errors.description.message}
//             </p>
//           )}
//         </div>

//         {/* Category */}
//         <div>
//           <label className="block text-sm font-semibold text-gray-700 mb-2">
//             Category *
//           </label>
//           <select
//             {...register("categoryId")}
//             className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono text-sm"
//           >
//             <option value="">Select a category</option>
//             {categories?.categories &&
//               renderCategoryOptions(
//                 categories.categories.filter((cat) => !cat.parentId)
//               )}
//           </select>
//           {errors.categoryId && (
//             <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
//               <AlertCircle className="h-4 w-4" />
//               {errors.categoryId.message}
//             </p>
//           )}
//           <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
//             <Info className="h-3 w-3" />
//             Nested categories shown with indentation
//           </p>
//         </div>

//         {/* Pricing */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-2">
//               Base Price *
//             </label>
//             <div className="relative">
//               <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
//                 ₹
//               </span>
//               <input
//                 {...register("basePrice")}
//                 type="number"
//                 step="0.01"
//                 className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 placeholder="0.00"
//               />
//             </div>
//             {errors.basePrice && (
//               <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
//                 <AlertCircle className="h-4 w-4" />
//                 {errors.basePrice.message}
//               </p>
//             )}
//           </div>

//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-2">
//               Selling Price *
//             </label>
//             <div className="relative">
//               <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
//                 ₹
//               </span>
//               <input
//                 {...register("sellingPrice")}
//                 type="number"
//                 step="0.01"
//                 className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 placeholder="0.00"
//               />
//             </div>
//             {errors.sellingPrice && (
//               <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
//                 <AlertCircle className="h-4 w-4" />
//                 {errors.sellingPrice.message}
//               </p>
//             )}
//           </div>
//         </div>

//         {/* HSN Code */}
//         <div>
//           <label className="block text-sm font-semibold text-gray-700 mb-2">
//             HSN Code (Optional)
//           </label>
//           <input
//             {...register("hsnCode")}
//             type="text"
//             className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             placeholder="e.g., 5208"
//           />
//           <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
//             <Info className="h-3 w-3" />
//             HSN code for GST classification
//           </p>
//         </div>

//         {/* Artisan Information */}
//         <div className="border-t border-gray-200 pt-6">
//           <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
//             <User className="h-5 w-5 text-blue-600" />
//             Artisan Information (Optional)
//           </h4>

//           <div className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Artisan Name
//               </label>
//               <input
//                 {...register("artisanName")}
//                 type="text"
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 placeholder="Name of the artisan"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 About Artisan
//               </label>
//               <textarea
//                 {...register("artisanAbout")}
//                 rows={3}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 placeholder="Brief description about the artisan..."
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Artisan Location
//               </label>
//               <div className="relative">
//                 <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//                 <input
//                   {...register("artisanLocation")}
//                   type="text"
//                   className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   placeholder="e.g., Varanasi, Uttar Pradesh"
//                 />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Specifications */}
//         <div className="border-t border-gray-200 pt-6">
//           <div className="flex items-center justify-between mb-4">
//             <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
//               <Tag className="h-5 w-5 text-blue-600" />
//               Specifications
//             </h4>
//             <button
//               type="button"
//               onClick={() => appendSpec({ key: "", value: "" })}
//               className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1"
//             >
//               <Plus className="h-4 w-4" />
//               Add
//             </button>
//           </div>

//           <div className="space-y-3">
//             {specFields.map((field, index) => (
//               <div key={field.id} className="flex gap-3">
//                 <input
//                   {...register(`specifications.${index}.key` as const)}
//                   placeholder="Key (e.g., Fabric)"
//                   className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//                 <input
//                   {...register(`specifications.${index}.value` as const)}
//                   placeholder="Value (e.g., Cotton)"
//                   className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => removeSpec(index)}
//                   className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
//                 >
//                   <X className="h-5 w-5" />
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Active Status */}
//         <div className="border-t border-gray-200 pt-6">
//           <label className="flex items-center space-x-3 cursor-pointer">
//             <input
//               {...register("isActive")}
//               type="checkbox"
//               className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
//             />
//             <div>
//               <span className="text-sm font-semibold text-gray-900">
//                 Publish this product
//               </span>
//               <p className="text-xs text-gray-500">
//                 Product will be visible on your store
//               </p>
//             </div>
//           </label>
//         </div>
//       </div>
//     );
//   }

//   // Step 3: Images with Drag & Drop
//   if (currentStep === 3) {
//     return (
//       <div className="space-y-6">
//         <div>
//           <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
//             <Upload className="h-6 w-6 text-blue-600" />
//             Product Images
//           </h3>
//           <p className="text-sm text-gray-600">
//             Upload images and drag to reorder. Click the star to set primary
//             image.
//           </p>
//         </div>

//         {/* Upload Area */}
//         <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
//           <input
//             type="file"
//             id="image-upload"
//             multiple
//             accept="image/*"
//             onChange={handleImageUpload}
//             className="hidden"
//           />
//           <label
//             htmlFor="image-upload"
//             className="cursor-pointer flex flex-col items-center"
//           >
//             <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
//               <Upload className="h-8 w-8 text-blue-600" />
//             </div>
//             <p className="text-lg font-semibold text-gray-900 mb-1">
//               Click to upload images
//             </p>
//             <p className="text-sm text-gray-500">
//               or drag and drop PNG, JPG up to 5MB each
//             </p>
//           </label>
//         </div>

//         {/* Image Preview Grid with Drag & Drop */}
//         {imagePreviews.length > 0 && (
//           <div className="space-y-4">
//             <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
//               <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
//               <p className="text-sm text-blue-900">
//                 <strong>Drag</strong> to reorder, <strong>Click star</strong> to
//                 set as primary image
//               </p>
//             </div>

//             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
//               {imagePreviews.map((item, index) => (
//                 <div
//                   key={item.id}
//                   draggable
//                   onDragStart={() => handleDragStart(index)}
//                   onDragOver={(e) => handleDragOver(e, index)}
//                   onDragEnd={handleDragEnd}
//                   className={`relative group cursor-move border-2 rounded-lg overflow-hidden transition-all ${
//                     item.isPrimary
//                       ? "border-blue-500 ring-2 ring-blue-200"
//                       : "border-gray-200 hover:border-blue-300"
//                   } ${draggedIndex === index ? "opacity-50" : ""}`}
//                 >
//                   <img
//                     src={item.preview}
//                     alt={`Preview ${index + 1}`}
//                     className="w-full h-40 object-cover"
//                   />

//                   {/* Drag Handle */}
//                   <div className="absolute top-2 left-2 p-1 bg-black bg-opacity-50 rounded cursor-move">
//                     <GripVertical className="h-4 w-4 text-white" />
//                   </div>

//                   {/* Primary Badge */}
//                   {item.isPrimary && (
//                     <div className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded flex items-center gap-1">
//                       <Star className="h-3 w-3 fill-white" />
//                       PRIMARY
//                     </div>
//                   )}

//                   {/* Actions Overlay */}
//                   <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
//                     {!item.isPrimary && (
//                       <button
//                         type="button"
//                         onClick={() => handleSetPrimary(item.id)}
//                         className="p-2 bg-white hover:bg-blue-50 rounded-full transition-colors"
//                         title="Set as primary"
//                       >
//                         <Star className="h-4 w-4 text-blue-600" />
//                       </button>
//                     )}
//                     <button
//                       type="button"
//                       onClick={() => handleRemoveImage(item.id)}
//                       className="p-2 bg-white hover:bg-red-50 rounded-full transition-colors"
//                       title="Remove image"
//                     >
//                       <Trash2 className="h-4 w-4 text-red-600" />
//                     </button>
//                   </div>

//                   {/* Order Badge */}
//                   <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-70 text-white text-xs font-bold rounded">
//                     #{index + 1}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {imagePreviews.length === 0 && (
//           <div className="text-center py-8 bg-gray-50 rounded-lg">
//             <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
//             <p className="text-gray-500">No images uploaded yet</p>
//           </div>
//         )}
//       </div>
//     );
//   }

//   // Step 4: Stock or Variants (unchanged)
//   if (currentStep === 4) {
//     if (productType === "simple") {
//       return (
//         <div className="space-y-6">
//           <div>
//             <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
//               <Box className="h-6 w-6 text-blue-600" />
//               Stock Management
//             </h3>
//             <p className="text-sm text-gray-600">
//               Set the initial stock for this product
//             </p>
//           </div>

//           <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
//             <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
//             <div className="text-sm text-blue-900">
//               <p className="font-semibold mb-1">Simple Product</p>
//               <p>
//                 This product has no variants. Set stock for the main warehouse.
//               </p>
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-2">
//               Warehouse *
//             </label>
//             <select
//               {...register("stock.warehouseId")}
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
//             >
//               <option value="">Select warehouse</option>
//               {warehouses?.map((wh: any) => (
//                 <option key={wh.id} value={wh.id}>
//                   {wh.name} ({wh.code})
//                 </option>
//               ))}
//             </select>
//             {errors.stock?.warehouseId && (
//               <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
//                 <AlertCircle className="h-4 w-4" />
//                 {errors.stock.warehouseId.message}
//               </p>
//             )}
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">
//                 Initial Quantity *
//               </label>
//               <input
//                 {...register("stock.quantity")}
//                 type="number"
//                 min="0"
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 placeholder="0"
//               />
//               {errors.stock?.quantity && (
//                 <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
//                   <AlertCircle className="h-4 w-4" />
//                   {errors.stock.quantity.message}
//                 </p>
//               )}
//             </div>

//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">
//                 Low Stock Alert
//               </label>
//               <input
//                 {...register("stock.lowStockThreshold")}
//                 type="number"
//                 min="0"
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 placeholder="10"
//               />
//               <p className="mt-1.5 text-xs text-gray-500">
//                 Get notified when stock falls below this number
//               </p>
//             </div>
//           </div>
//         </div>
//       );
//     } else {
//       return (
//         <div className="space-y-6">
//           <div>
//             <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
//               <Layers className="h-6 w-6 text-purple-600" />
//               Product Variants
//             </h3>
//             <p className="text-sm text-gray-600">
//               Add different variants like sizes, colors, fabrics for this
//               product
//             </p>
//           </div>

//           <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
//             <Info className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
//             <div className="text-sm text-purple-900">
//               <p className="font-semibold mb-1">Variable Product</p>
//               <p>Each variant can have its own price, SKU, and stock level.</p>
//             </div>
//           </div>

//           <button
//             type="button"
//             onClick={() =>
//               appendVariant({
//                 size: "",
//                 color: "",
//                 fabric: "",
//                 price: 0,
//                 stock: { warehouseId: "", quantity: 0 },
//               })
//             }
//             className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 text-gray-700 font-medium"
//           >
//             <Plus className="h-5 w-5" />
//             Add Variant
//           </button>

//           <div className="space-y-4">
//             {variantFields.map((field, index) => (
//               <div
//                 key={field.id}
//                 className="border-2 border-gray-200 rounded-lg p-4 space-y-4"
//               >
//                 <div className="flex items-center justify-between">
//                   <h5 className="font-semibold text-gray-900">
//                     Variant {index + 1}
//                   </h5>
//                   <button
//                     type="button"
//                     onClick={() => removeVariant(index)}
//                     className="text-red-600 hover:bg-red-50 p-2 rounded-lg"
//                   >
//                     <Trash2 className="h-4 w-4" />
//                   </button>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-700 mb-1">
//                       Size
//                     </label>
//                     <div className="relative">
//                       <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//                       <input
//                         {...register(`variants.${index}.size` as const)}
//                         placeholder="e.g., M, L, XL"
//                         className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
//                       />
//                     </div>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-700 mb-1">
//                       Color
//                     </label>
//                     <div className="relative">
//                       <Palette className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//                       <input
//                         {...register(`variants.${index}.color` as const)}
//                         placeholder="e.g., Red, Blue"
//                         className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
//                       />
//                     </div>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-700 mb-1">
//                       Fabric
//                     </label>
//                     <input
//                       {...register(`variants.${index}.fabric` as const)}
//                       placeholder="e.g., Cotton"
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-700 mb-1">
//                       Price *
//                     </label>
//                     <div className="relative">
//                       <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
//                         ₹
//                       </span>
//                       <input
//                         {...register(`variants.${index}.price` as const)}
//                         type="number"
//                         step="0.01"
//                         className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
//                         placeholder="0.00"
//                       />
//                     </div>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-700 mb-1">
//                       Stock Quantity *
//                     </label>
//                     <input
//                       {...register(`variants.${index}.stock.quantity` as const)}
//                       type="number"
//                       min="0"
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
//                       placeholder="0"
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-xs font-medium text-gray-700 mb-1">
//                     Warehouse *
//                   </label>
//                   <select
//                     {...register(
//                       `variants.${index}.stock.warehouseId` as const
//                     )}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
//                   >
//                     <option value="">Select warehouse</option>
//                     {warehouses?.map((wh: any) => (
//                       <option key={wh.id} value={wh.id}>
//                         {wh.name} ({wh.code})
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {variantFields.length === 0 && (
//             <div className="text-center py-12 bg-gray-50 rounded-lg">
//               <Layers className="h-12 w-12 text-gray-400 mx-auto mb-3" />
//               <p className="text-gray-500 font-medium">No variants added yet</p>
//               <p className="text-sm text-gray-400 mt-1">
//                 Click "Add Variant" to create product variations
//               </p>
//             </div>
//           )}
//         </div>
//       );
//     }
//   }

//   // Step 5: Review & Create (updated to show images correctly)
//   if (currentStep === 5) {
//     const formData = watch();
//     const categoryName = categories?.categories?.find(
//       (c) => c.id === formData.categoryId
//     )?.name;
//     const warehouseName = warehouses?.find(
//       (w: any) => w.id === formData.stock?.warehouseId
//     )?.name;

//     return (
//       <div className="space-y-6">
//         <div>
//           <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
//             <CheckCircle className="h-6 w-6 text-green-600" />
//             Review Your Product
//           </h3>
//           <p className="text-sm text-gray-600">
//             Please review all details before creating the product
//           </p>
//         </div>

//         <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 space-y-4">
//           <div className="flex items-center gap-3 flex-wrap">
//             {productType === "simple" ? (
//               <div className="px-4 py-2 bg-blue-600 text-white rounded-full flex items-center gap-2 font-semibold">
//                 <Package className="h-5 w-5" />
//                 Simple Product
//               </div>
//             ) : (
//               <div className="px-4 py-2 bg-purple-600 text-white rounded-full flex items-center gap-2 font-semibold">
//                 <Layers className="h-5 w-5" />
//                 Variable Product
//               </div>
//             )}
//             {formData.isActive && (
//               <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-semibold">
//                 Will be Published
//               </span>
//             )}
//           </div>

//           <div className="bg-white rounded-lg p-4 space-y-3">
//             <h4 className="font-bold text-gray-900 text-lg">
//               {formData.name || "Product Name"}
//             </h4>
//             <p className="text-sm text-gray-600">
//               {formData.description || "No description provided"}
//             </p>

//             {categoryName && (
//               <div className="flex items-center gap-2 text-sm">
//                 <Tag className="h-4 w-4 text-gray-500" />
//                 <span className="text-gray-600">Category:</span>
//                 <span className="font-medium text-gray-900">
//                   {categoryName}
//                 </span>
//               </div>
//             )}

//             <div className="flex items-center gap-6 text-sm pt-2 border-t border-gray-200">
//               <div>
//                 <span className="text-gray-500">Selling Price: </span>
//                 <span className="font-bold text-blue-600 text-xl">
//                   ₹{Number(formData.sellingPrice || 0).toLocaleString()}
//                 </span>
//               </div>
//               {formData.basePrice &&
//                 Number(formData.basePrice) !==
//                   Number(formData.sellingPrice) && (
//                   <div>
//                     <span className="text-gray-500">Base Price: </span>
//                     <span className="line-through text-gray-400">
//                       ₹{Number(formData.basePrice).toLocaleString()}
//                     </span>
//                   </div>
//                 )}
//             </div>

//             {formData.hsnCode && (
//               <div className="text-sm">
//                 <span className="text-gray-500">HSN Code: </span>
//                 <span className="font-medium text-gray-900">
//                   {formData.hsnCode}
//                 </span>
//               </div>
//             )}
//           </div>

//           {(formData.artisanName ||
//             formData.artisanAbout ||
//             formData.artisanLocation) && (
//             <div className="bg-white rounded-lg p-4">
//               <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
//                 <User className="h-5 w-5 text-blue-600" />
//                 Artisan Information
//               </h5>
//               <div className="space-y-2 text-sm">
//                 {formData.artisanName && (
//                   <div>
//                     <span className="text-gray-500">Name: </span>
//                     <span className="font-medium text-gray-900">
//                       {formData.artisanName}
//                     </span>
//                   </div>
//                 )}
//                 {formData.artisanLocation && (
//                   <div className="flex items-center gap-1">
//                     <MapPin className="h-4 w-4 text-gray-400" />
//                     <span className="text-gray-600">
//                       {formData.artisanLocation}
//                     </span>
//                   </div>
//                 )}
//                 {formData.artisanAbout && (
//                   <p className="text-gray-600 italic">
//                     {formData.artisanAbout}
//                   </p>
//                 )}
//               </div>
//             </div>
//           )}

//           {imagePreviews.length > 0 && (
//             <div className="bg-white rounded-lg p-4">
//               <h5 className="font-semibold text-gray-900 mb-3">
//                 Images ({imagePreviews.length})
//               </h5>
//               <div className="grid grid-cols-4 gap-2">
//                 {imagePreviews.map((item, idx) => (
//                   <div key={item.id} className="relative">
//                     <img
//                       src={item.preview}
//                       alt={`Preview ${idx + 1}`}
//                       className="w-full h-20 object-cover rounded-lg border-2 border-gray-200"
//                     />
//                     {item.isPrimary && (
//                       <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs font-bold rounded flex items-center gap-0.5">
//                         <Star className="h-2.5 w-2.5 fill-white" />
//                         PRIMARY
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {productType === "simple" && formData.stock && (
//             <div className="bg-white rounded-lg p-4">
//               <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
//                 <Box className="h-5 w-5 text-blue-600" />
//                 Stock Information
//               </h5>
//               <div className="grid grid-cols-2 gap-4 text-sm">
//                 <div>
//                   <span className="text-gray-500">Warehouse: </span>
//                   <span className="font-medium text-gray-900">
//                     {warehouseName || "Not selected"}
//                   </span>
//                 </div>
//                 <div>
//                   <span className="text-gray-500">Quantity: </span>
//                   <span className="font-bold text-blue-600 text-lg">
//                     {formData.stock.quantity || 0}
//                   </span>
//                 </div>
//                 {formData.stock.lowStockThreshold && (
//                   <div>
//                     <span className="text-gray-500">Low Stock Alert: </span>
//                     <span className="font-medium text-gray-900">
//                       {formData.stock.lowStockThreshold}
//                     </span>
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}

//           {productType === "variable" && variantFields.length > 0 && (
//             <div className="bg-white rounded-lg p-4">
//               <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
//                 <Layers className="h-5 w-5 text-purple-600" />
//                 Variants ({variantFields.length})
//               </h5>
//               <div className="space-y-2">
//                 {variantFields.map((field, idx) => {
//                   const variant = formData.variants?.[idx];
//                   const variantWarehouse = warehouses?.find(
//                     (w: any) => w.id === variant?.stock?.warehouseId
//                   );
//                   const variantLabel =
//                     [variant?.size, variant?.color, variant?.fabric]
//                       .filter(Boolean)
//                       .join(" / ") || `Variant ${idx + 1}`;

//                   return (
//                     <div
//                       key={idx}
//                       className="p-3 bg-purple-50 rounded-lg border border-purple-200"
//                     >
//                       <div className="flex items-center justify-between mb-2">
//                         <span className="font-semibold text-gray-900">
//                           {variantLabel}
//                         </span>
//                         <span className="text-purple-600 font-bold text-lg">
//                           ₹{Number(variant?.price || 0).toLocaleString()}
//                         </span>
//                       </div>
//                       <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
//                         <div>
//                           <span className="text-gray-500">Stock: </span>
//                           <span className="font-medium">
//                             {variant?.stock?.quantity || 0}
//                           </span>
//                         </div>
//                         <div>
//                           <span className="text-gray-500">Warehouse: </span>
//                           <span className="font-medium">
//                             {variantWarehouse?.name || "N/A"}
//                           </span>
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           )}

//           {specFields.length > 0 && (
//             <div className="bg-white rounded-lg p-4">
//               <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
//                 <Tag className="h-5 w-5 text-blue-600" />
//                 Specifications ({specFields.length})
//               </h5>
//               <div className="grid grid-cols-2 gap-3 text-sm">
//                 {specFields.map((field, idx) => {
//                   const spec = formData.specifications?.[idx];
//                   return spec?.key && spec?.value ? (
//                     <div key={idx} className="p-2 bg-gray-50 rounded">
//                       <span className="text-gray-500 font-medium">
//                         {spec.key}:{" "}
//                       </span>
//                       <span className="text-gray-900">{spec.value}</span>
//                     </div>
//                   ) : null;
//                 })}
//               </div>
//             </div>
//           )}
//         </div>

//         <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
//           <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
//           <div className="text-sm text-yellow-900">
//             <p className="font-semibold">Ready to create?</p>
//             <p>Images will be uploaded to S3. This may take a moment.</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return null;
// };

// export default ProductFormSteps;

import React, { type JSX, useState } from "react";
import {
  Package,
  Layers,
  Upload,
  X,
  Plus,
  DollarSign,
  Tag,
  FileText,
  User,
  MapPin,
  Warehouse as WarehouseIcon,
  Ruler,
  Palette,
  Box,
  AlertCircle,
  Info,
  CheckCircle,
  Trash2,
  GripVertical,
  Star,
  ImageIcon,
} from "lucide-react";
import type { Category } from "@/lib/types/category/category";
import type { CreateProductFormData } from "@/lib/types/product/schema";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

interface ImagePreviewItem {
  file: File;
  preview: string;
  isPrimary: boolean;
  id: string;
}

interface ProductFormStepsProps {
  currentStep: number;
  productType: "simple" | "variable";
  setProductType: React.Dispatch<React.SetStateAction<"simple" | "variable">>;
  register: UseFormRegister<CreateProductFormData>;
  errors: FieldErrors<CreateProductFormData>;
  categories?: { categories: Category[] };
  warehouses?: any[];
  specFields: any[];
  appendSpec: (spec: { key: string; value: string }) => void;
  removeSpec: (index: number) => void;
  imageFields: any[];
  appendImage: (image: {
    url: string;
    altText?: string;
    order?: number;
  }) => void;
  removeImage: (index: number) => void;
  variantFields: any[];
  appendVariant: (variant: any) => void;
  removeVariant: (index: number) => void;
  imagePreviews: ImagePreviewItem[];
  setImagePreviews: React.Dispatch<React.SetStateAction<ImagePreviewItem[]>>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  watch: any;
}

// Helper function to render category options with hierarchy
const renderCategoryOptions = (
  categories: Category[],
  level: number = 0
): JSX.Element[] => {
  const options: JSX.Element[] = [];

  categories.forEach((cat) => {
    // Create indentation based on level
    const indent = "  ".repeat(level);
    const prefix = level > 0 ? "└─ " : "";

    options.push(
      <option key={cat.id} value={cat.id}>
        {indent}
        {prefix}
        {cat.name}
      </option>
    );

    // Recursively add children
    if (cat.children && cat.children.length > 0) {
      options.push(...renderCategoryOptions(cat.children, level + 1));
    }
  });

  return options;
};

const ProductFormSteps: React.FC<ProductFormStepsProps> = ({
  currentStep,
  productType,
  setProductType,
  register,
  errors,
  categories,
  warehouses,
  specFields,
  appendSpec,
  removeSpec,
  imageFields,
  appendImage,
  removeImage,
  variantFields,
  appendVariant,
  removeVariant,
  imagePreviews,
  setImagePreviews,
  handleImageUpload,
  watch,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newPreviews = [...imagePreviews];
    const draggedItem = newPreviews[draggedIndex];
    newPreviews.splice(draggedIndex, 1);
    newPreviews.splice(index, 0, draggedItem);

    setImagePreviews(newPreviews);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSetPrimary = (id: string) => {
    setImagePreviews((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === id,
      }))
    );
  };

  const handleRemoveImage = (id: string) => {
    const index = imagePreviews.findIndex((img) => img.id === id);
    setImagePreviews((prev) => {
      const newPreviews = prev.filter((img) => img.id !== id);
      // If removing primary image and there are others, make first one primary
      if (prev[index]?.isPrimary && newPreviews.length > 0) {
        newPreviews[0].isPrimary = true;
      }
      return newPreviews;
    });
    removeImage(index);
  };

  // Step 1: Product Type Selection
  if (currentStep === 1) {
    return (
      <div className="space-y-4">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Choose Product Type
          </h3>
          <p className="text-gray-600">
            Select whether your product has variants like size, color, etc.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setProductType("simple")}
            className={`p-6 border-2 rounded-xl transition-all ${
              productType === "simple"
                ? "border-blue-500 bg-blue-50 shadow-lg"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <Package className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              Simple Product
            </h4>
            <p className="text-sm text-gray-600">
              Single product with no variations. One price, one SKU.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setProductType("variable")}
            className={`p-6 border-2 rounded-xl transition-all ${
              productType === "variable"
                ? "border-purple-500 bg-purple-50 shadow-lg"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <Layers className="h-12 w-12 mx-auto mb-4 text-purple-600" />
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              Variable Product
            </h4>
            <p className="text-sm text-gray-600">
              Product with variants like size, color, fabric. Multiple SKUs.
            </p>
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Basic Information
  if (currentStep === 2) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Basic Information
          </h3>
        </div>

        {/* Product Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Product Name *
          </label>
          <input
            {...register("name")}
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Handwoven Cotton Saree"
          />
          {errors.name && (
            <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            {...register("description")}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Detailed product description..."
          />
          {errors.description && (
            <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Category *
          </label>
          <select
            {...register("categoryId")}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono text-sm"
          >
            <option value="">Select a category</option>
            {categories?.categories &&
              renderCategoryOptions(
                categories.categories.filter((cat) => !cat.parentId)
              )}
          </select>
          {errors.categoryId && (
            <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.categoryId.message}
            </p>
          )}
          <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
            <Info className="h-3 w-3" />
            Nested categories shown with indentation
          </p>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Base Price *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                ₹
              </span>
              <input
                {...register("basePrice")}
                type="number"
                step="0.01"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            {errors.basePrice && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.basePrice.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Selling Price *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                ₹
              </span>
              <input
                {...register("sellingPrice")}
                type="number"
                step="0.01"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            {errors.sellingPrice && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.sellingPrice.message}
              </p>
            )}
          </div>
        </div>

        {/* HSN Code */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            HSN Code (Optional)
          </label>
          <input
            {...register("hsnCode")}
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 5208"
          />
          <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
            <Info className="h-3 w-3" />
            HSN code for GST classification
          </p>
        </div>

        {/* Artisan Information */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Artisan Information (Optional)
          </h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Artisan Name
              </label>
              <input
                {...register("artisanName")}
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Name of the artisan"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                About Artisan
              </label>
              <textarea
                {...register("artisanAbout")}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description about the artisan..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Artisan Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register("artisanLocation")}
                  type="text"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Varanasi, Uttar Pradesh"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Tag className="h-5 w-5 text-blue-600" />
              Specifications
            </h4>
            <button
              type="button"
              onClick={() => appendSpec({ key: "", value: "" })}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>

          <div className="space-y-3">
            {specFields.map((field, index) => (
              <div key={field.id} className="flex gap-3">
                <input
                  {...register(`specifications.${index}.key` as const)}
                  placeholder="Key (e.g., Fabric)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  {...register(`specifications.${index}.value` as const)}
                  placeholder="Value (e.g., Cotton)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeSpec(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Active Status */}
        <div className="border-t border-gray-200 pt-6">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              {...register("isActive")}
              type="checkbox"
              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-semibold text-gray-900">
                Publish this product
              </span>
              <p className="text-xs text-gray-500">
                Product will be visible on your store
              </p>
            </div>
          </label>
        </div>
      </div>
    );
  }

  // Step 3: Images with Drag & Drop
  if (currentStep === 3) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Upload className="h-6 w-6 text-blue-600" />
            Product Images
          </h3>
          <p className="text-sm text-gray-600">
            Upload images and drag to reorder. Click the star to set primary
            image.
          </p>
        </div>

        {/* Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            id="image-upload"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <label
            htmlFor="image-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-1">
              Click to upload images
            </p>
            <p className="text-sm text-gray-500">
              or drag and drop PNG, JPG up to 5MB each
            </p>
          </label>
        </div>

        {/* Image Preview Grid with Drag & Drop */}
        {imagePreviews.length > 0 && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <p className="text-sm text-blue-900">
                <strong>Drag</strong> to reorder, <strong>Click star</strong> to
                set as primary image
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {imagePreviews.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`relative group cursor-move border-2 rounded-lg overflow-hidden transition-all ${
                    item.isPrimary
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-gray-200 hover:border-blue-300"
                  } ${draggedIndex === index ? "opacity-50" : ""}`}
                >
                  <img
                    src={item.preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-40 object-cover"
                  />

                  {/* Drag Handle */}
                  <div className="absolute top-2 left-2 p-1 bg-black bg-opacity-50 rounded cursor-move">
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>

                  {/* Primary Badge */}
                  {item.isPrimary && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded flex items-center gap-1">
                      <Star className="h-3 w-3 fill-white" />
                      PRIMARY
                    </div>
                  )}

                  {/* Actions Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    {!item.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(item.id)}
                        className="p-2 bg-white hover:bg-blue-50 rounded-full transition-colors"
                        title="Set as primary"
                      >
                        <Star className="h-4 w-4 text-blue-600" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(item.id)}
                      className="p-2 bg-white hover:bg-red-50 rounded-full transition-colors"
                      title="Remove image"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>

                  {/* Order Badge */}
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-70 text-white text-xs font-bold rounded">
                    #{index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {imagePreviews.length === 0 && (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No images uploaded yet</p>
          </div>
        )}
      </div>
    );
  }

  // Step 4: Stock or Variants (unchanged)
  if (currentStep === 4) {
    if (productType === "simple") {
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Box className="h-6 w-6 text-blue-600" />
              Stock Management
            </h3>
            <p className="text-sm text-gray-600">
              Set the initial stock for this product
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Simple Product</p>
              <p>
                This product has no variants. Set stock for the main warehouse.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Warehouse *
            </label>
            <select
              {...register("stock.warehouseId")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select warehouse</option>
              {warehouses?.map((wh: any) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
            {errors.stock?.warehouseId && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.stock.warehouseId.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Initial Quantity *
              </label>
              <input
                {...register("stock.quantity")}
                type="number"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
              {errors.stock?.quantity && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.stock.quantity.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Low Stock Alert
              </label>
              <input
                {...register("stock.lowStockThreshold")}
                type="number"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Get notified when stock falls below this number
              </p>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Layers className="h-6 w-6 text-purple-600" />
              Product Variants
            </h3>
            <p className="text-sm text-gray-600">
              Add different variants like sizes, colors, fabrics for this
              product
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-purple-900">
              <p className="font-semibold mb-1">Variable Product</p>
              <p>Each variant can have its own price, SKU, and stock level.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              appendVariant({
                size: "",
                color: "",
                fabric: "",
                price: 0,
                stock: { warehouseId: "", quantity: 0 },
              })
            }
            className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 text-gray-700 font-medium"
          >
            <Plus className="h-5 w-5" />
            Add Variant
          </button>

          <div className="space-y-4">
            {variantFields.map((field, index) => (
              <div
                key={field.id}
                className="border-2 border-gray-200 rounded-lg p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-gray-900">
                    Variant {index + 1}
                  </h5>
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="text-red-600 hover:bg-red-50 p-2 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Size
                    </label>
                    <div className="relative">
                      <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...register(`variants.${index}.size` as const)}
                        placeholder="e.g., M, L, XL"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <div className="relative">
                      <Palette className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...register(`variants.${index}.color` as const)}
                        placeholder="e.g., Red, Blue"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Fabric
                    </label>
                    <input
                      {...register(`variants.${index}.fabric` as const)}
                      placeholder="e.g., Cotton"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Price *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        ₹
                      </span>
                      <input
                        {...register(`variants.${index}.price` as const)}
                        type="number"
                        step="0.01"
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Stock Quantity *
                    </label>
                    <input
                      {...register(`variants.${index}.stock.quantity` as const)}
                      type="number"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Warehouse *
                  </label>
                  <select
                    {...register(
                      `variants.${index}.stock.warehouseId` as const
                    )}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="">Select warehouse</option>
                    {warehouses?.map((wh: any) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name} ({wh.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          {variantFields.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Layers className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No variants added yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Click "Add Variant" to create product variations
              </p>
            </div>
          )}
        </div>
      );
    }
  }

  // Step 5: Review & Create (updated to show images correctly)
  if (currentStep === 5) {
    const formData = watch();
    const categoryName = categories?.categories?.find(
      (c) => c.id === formData.categoryId
    )?.name;
    const warehouseName = warehouses?.find(
      (w: any) => w.id === formData.stock?.warehouseId
    )?.name;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Review Your Product
          </h3>
          <p className="text-sm text-gray-600">
            Please review all details before creating the product
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            {productType === "simple" ? (
              <div className="px-4 py-2 bg-blue-600 text-white rounded-full flex items-center gap-2 font-semibold">
                <Package className="h-5 w-5" />
                Simple Product
              </div>
            ) : (
              <div className="px-4 py-2 bg-purple-600 text-white rounded-full flex items-center gap-2 font-semibold">
                <Layers className="h-5 w-5" />
                Variable Product
              </div>
            )}
            {formData.isActive && (
              <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-semibold">
                Will be Published
              </span>
            )}
          </div>

          <div className="bg-white rounded-lg p-4 space-y-3">
            <h4 className="font-bold text-gray-900 text-lg">
              {formData.name || "Product Name"}
            </h4>
            <p className="text-sm text-gray-600">
              {formData.description || "No description provided"}
            </p>

            {categoryName && (
              <div className="flex items-center gap-2 text-sm">
                <Tag className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Category:</span>
                <span className="font-medium text-gray-900">
                  {categoryName}
                </span>
              </div>
            )}

            <div className="flex items-center gap-6 text-sm pt-2 border-t border-gray-200">
              <div>
                <span className="text-gray-500">Selling Price: </span>
                <span className="font-bold text-blue-600 text-xl">
                  ₹{Number(formData.sellingPrice || 0).toLocaleString()}
                </span>
              </div>
              {formData.basePrice &&
                Number(formData.basePrice) !==
                  Number(formData.sellingPrice) && (
                  <div>
                    <span className="text-gray-500">Base Price: </span>
                    <span className="line-through text-gray-400">
                      ₹{Number(formData.basePrice).toLocaleString()}
                    </span>
                  </div>
                )}
            </div>

            {formData.hsnCode && (
              <div className="text-sm">
                <span className="text-gray-500">HSN Code: </span>
                <span className="font-medium text-gray-900">
                  {formData.hsnCode}
                </span>
              </div>
            )}
          </div>

          {(formData.artisanName ||
            formData.artisanAbout ||
            formData.artisanLocation) && (
            <div className="bg-white rounded-lg p-4">
              <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Artisan Information
              </h5>
              <div className="space-y-2 text-sm">
                {formData.artisanName && (
                  <div>
                    <span className="text-gray-500">Name: </span>
                    <span className="font-medium text-gray-900">
                      {formData.artisanName}
                    </span>
                  </div>
                )}
                {formData.artisanLocation && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      {formData.artisanLocation}
                    </span>
                  </div>
                )}
                {formData.artisanAbout && (
                  <p className="text-gray-600 italic">
                    {formData.artisanAbout}
                  </p>
                )}
              </div>
            </div>
          )}

          {imagePreviews.length > 0 && (
            <div className="bg-white rounded-lg p-4">
              <h5 className="font-semibold text-gray-900 mb-3">
                Images ({imagePreviews.length})
              </h5>
              <div className="grid grid-cols-4 gap-2">
                {imagePreviews.map((item, idx) => (
                  <div key={item.id} className="relative">
                    <img
                      src={item.preview}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-20 object-cover rounded-lg border-2 border-gray-200"
                    />
                    {item.isPrimary && (
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs font-bold rounded flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5 fill-white" />
                        PRIMARY
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {productType === "simple" && formData.stock && (
            <div className="bg-white rounded-lg p-4">
              <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Box className="h-5 w-5 text-blue-600" />
                Stock Information
              </h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Warehouse: </span>
                  <span className="font-medium text-gray-900">
                    {warehouseName || "Not selected"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Quantity: </span>
                  <span className="font-bold text-blue-600 text-lg">
                    {formData.stock.quantity || 0}
                  </span>
                </div>
                {formData.stock.lowStockThreshold && (
                  <div>
                    <span className="text-gray-500">Low Stock Alert: </span>
                    <span className="font-medium text-gray-900">
                      {formData.stock.lowStockThreshold}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {productType === "variable" && variantFields.length > 0 && (
            <div className="bg-white rounded-lg p-4">
              <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Layers className="h-5 w-5 text-purple-600" />
                Variants ({variantFields.length})
              </h5>
              <div className="space-y-2">
                {variantFields.map((field, idx) => {
                  const variant = formData.variants?.[idx];
                  const variantWarehouse = warehouses?.find(
                    (w: any) => w.id === variant?.stock?.warehouseId
                  );
                  const variantLabel =
                    [variant?.size, variant?.color, variant?.fabric]
                      .filter(Boolean)
                      .join(" / ") || `Variant ${idx + 1}`;

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-purple-50 rounded-lg border border-purple-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">
                          {variantLabel}
                        </span>
                        <span className="text-purple-600 font-bold text-lg">
                          ₹{Number(variant?.price || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>
                          <span className="text-gray-500">Stock: </span>
                          <span className="font-medium">
                            {variant?.stock?.quantity || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Warehouse: </span>
                          <span className="font-medium">
                            {variantWarehouse?.name || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {specFields.length > 0 && (
            <div className="bg-white rounded-lg p-4">
              <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Tag className="h-5 w-5 text-blue-600" />
                Specifications ({specFields.length})
              </h5>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {specFields.map((field, idx) => {
                  const spec = formData.specifications?.[idx];
                  return spec?.key && spec?.value ? (
                    <div key={idx} className="p-2 bg-gray-50 rounded">
                      <span className="text-gray-500 font-medium">
                        {spec.key}:{" "}
                      </span>
                      <span className="text-gray-900">{spec.value}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-900">
            <p className="font-semibold">Ready to create?</p>
            <p>Images will be uploaded to S3. This may take a moment.</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ProductFormSteps;