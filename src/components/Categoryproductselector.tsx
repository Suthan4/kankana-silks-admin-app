// import React, { useState, useMemo } from "react";
// import { MultiSelectAutocomplete } from "./Multiselectautocomplete";
// import { Tag, Package, Info } from "lucide-react";

// interface Product {
//   id: string;
//   name: string;
//   sellingPrice: number;
//   media?: Array<{ url: string }>;
//   category?: { id: string; name: string };
// }

// interface Category {
//   id: string;
//   name: string;
//   children?: Array<{ id: string; name: string }>;
// }

// interface CategoryProductSelectorProps {
//   products: Product[];
//   categories: Category[];
//   selectedProductIds: string[];
//   selectedCategoryIds: string[];
//   onProductsChange: (productIds: string[]) => void;
//   onCategoriesChange: (categoryIds: string[]) => void;
//   isLoading?: boolean;
// }

// type SelectionMode = "products" | "categories" | "both";

// export const CategoryProductSelector: React.FC<
//   CategoryProductSelectorProps
// > = ({
//   products,
//   categories,
//   selectedProductIds,
//   selectedCategoryIds,
//   onProductsChange,
//   onCategoriesChange,
//   isLoading = false,
// }) => {
//   const [selectionMode, setSelectionMode] = useState<SelectionMode>("both");

//   // Get products filtered by selected categories
//   const filteredProducts = useMemo(() => {
//     if (selectedCategoryIds.length === 0) {
//       return products;
//     }

//     return products.filter((product) =>
//       selectedCategoryIds.includes(product.category?.id || "")
//     );
//   }, [products, selectedCategoryIds]);

//   // Prepare options for autocomplete
//   const productOptions = useMemo(() => {
//     const productsToShow =
//       selectionMode === "categories" ? filteredProducts : products;

//     return productsToShow.map((product) => ({
//       id: product.id,
//       label: product.name,
//       subtitle: `₹${product.sellingPrice} • ${
//         product.category?.name || "No category"
//       }`,
//       imageUrl: product.media?.[0]?.url,
//     }));
//   }, [products, filteredProducts, selectionMode]);

//   const categoryOptions = useMemo(() => {
//     return categories.map((category) => ({
//       id: category.id,
//       label: category.name,
//       subtitle:
//         category.children && category.children.length > 0
//           ? `${category.children.length} subcategories`
//           : undefined,
//     }));
//   }, [categories]);

//   // Auto-select products when categories are selected
//   const handleCategoryChange = (categoryIds: string[]) => {
//     onCategoriesChange(categoryIds);

//     if (selectionMode === "categories") {
//       // Auto-select all products from selected categories
//       const categoryProductIds = products
//         .filter((p) => categoryIds.includes(p.category?.id || ""))
//         .map((p) => p.id);

//       onProductsChange(categoryProductIds);
//     }
//   };

//   // Get selected items info
//   const selectedCategoriesCount = selectedCategoryIds.length;
//   const selectedProductsCount = selectedProductIds.length;
//   const categoryProductsCount = filteredProducts.length;

//   return (
//     <div className="space-y-6">
//       {/* Selection Mode */}
//       <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
//         <label className="block text-sm font-semibold text-gray-700 mb-3">
//           Selection Mode
//         </label>
//         <div className="grid grid-cols-3 gap-2">
//           <button
//             type="button"
//             onClick={() => setSelectionMode("categories")}
//             className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
//               selectionMode === "categories"
//                 ? "border-blue-600 bg-blue-50 text-blue-700"
//                 : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
//             }`}
//           >
//             <Tag className="h-4 w-4 mx-auto mb-1" />
//             Categories Only
//           </button>
//           <button
//             type="button"
//             onClick={() => setSelectionMode("products")}
//             className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
//               selectionMode === "products"
//                 ? "border-blue-600 bg-blue-50 text-blue-700"
//                 : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
//             }`}
//           >
//             <Package className="h-4 w-4 mx-auto mb-1" />
//             Products Only
//           </button>
//           <button
//             type="button"
//             onClick={() => setSelectionMode("both")}
//             className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
//               selectionMode === "both"
//                 ? "border-blue-600 bg-blue-50 text-blue-700"
//                 : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
//             }`}
//           >
//             <Info className="h-4 w-4 mx-auto mb-1" />
//             Both
//           </button>
//         </div>
//         <div className="mt-3 text-xs text-gray-600">
//           {selectionMode === "categories" && (
//             <p>
//               🎯 Select categories to automatically include all their products
//             </p>
//           )}
//           {selectionMode === "products" && (
//             <p>🎯 Manually select individual products</p>
//           )}
//           {selectionMode === "both" && (
//             <p>🎯 Select categories first, then add specific products</p>
//           )}
//         </div>
//       </div>

//       {/* Categories Selection */}
//       {(selectionMode === "categories" || selectionMode === "both") && (
//         <div>
//           <MultiSelectAutocomplete
//             label="Categories"
//             options={categoryOptions}
//             value={selectedCategoryIds}
//             onChange={handleCategoryChange}
//             placeholder="Search categories..."
//             isLoading={isLoading}
//             emptyMessage="No categories available"
//           />

//           {selectedCategoriesCount > 0 && selectionMode === "categories" && (
//             <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
//               <p className="text-sm text-blue-700">
//                 ✨ {categoryProductsCount} products from{" "}
//                 {selectedCategoriesCount} categor
//                 {selectedCategoriesCount !== 1 ? "ies" : "y"} will be included
//               </p>
//             </div>
//           )}
//         </div>
//       )}

//       {/* Products Selection */}
//       {(selectionMode === "products" || selectionMode === "both") && (
//         <div>
//           <MultiSelectAutocomplete
//             label={
//               selectionMode === "both" && selectedCategoryIds.length > 0
//                 ? `Products (filtered by ${selectedCategoriesCount} categor${
//                     selectedCategoriesCount !== 1 ? "ies" : "y"
//                   })`
//                 : "Products"
//             }
//             options={productOptions}
//             value={selectedProductIds}
//             onChange={onProductsChange}
//             placeholder="Search products..."
//             isLoading={isLoading}
//             showImages={true}
//             emptyMessage={
//               selectedCategoryIds.length > 0 && selectionMode === "both"
//                 ? "No products in selected categories"
//                 : "No products available"
//             }
//           />

//           {selectionMode === "both" &&
//             selectedCategoryIds.length > 0 &&
//             filteredProducts.length > 0 && (
//               <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
//                 <p className="text-sm text-green-700">
//                   ℹ️ Showing {categoryProductsCount} products from selected
//                   categories
//                 </p>
//               </div>
//             )}
//         </div>
//       )}

//       {/* Summary */}
//       {(selectedCategoriesCount > 0 || selectedProductsCount > 0) && (
//         <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
//           <h4 className="text-sm font-semibold text-gray-900 mb-2">
//             Selection Summary
//           </h4>
//           <div className="space-y-1 text-sm text-gray-700">
//             {selectedCategoriesCount > 0 && (
//               <p>
//                 📁 {selectedCategoriesCount} categor
//                 {selectedCategoriesCount !== 1 ? "ies" : "y"} selected
//               </p>
//             )}
//             {selectedProductsCount > 0 && (
//               <p>
//                 📦 {selectedProductsCount} product
//                 {selectedProductsCount !== 1 ? "s" : ""} selected
//               </p>
//             )}
//             {selectionMode === "categories" && (
//               <p className="text-xs text-gray-600 mt-2">
//                 Note: Products are automatically included from selected
//                 categories
//               </p>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
import React, { useState, useMemo } from "react";
import { MultiSelectAutocomplete } from "./Multiselectautocomplete";
import { Tag, Package, Info, ChevronRight, ChevronDown } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  media?: Array<{ url: string }>;
  category?: { id: string; name: string };
  categoryId?: string;
}

interface Category {
  id: string;
  name: string;
parentId?: string | null;
  children?: Category[];
  _count?: {
    products: number;
  };
}

interface CategoryProductSelectorProps {
  products: Product[];
  categories: Category[];
  selectedProductIds: string[];
  selectedCategoryIds: string[];
  onProductsChange: (productIds: string[]) => void;
  onCategoriesChange: (categoryIds: string[]) => void;
  isLoading?: boolean;
}

type SelectionMode = "products" | "categories" | "both";

// Helper function to get all descendant category IDs
const getAllDescendantIds = (category: Category): string[] => {
  const ids: string[] = [category.id];

  if (category.children && category.children.length > 0) {
    category.children.forEach((child) => {
      ids.push(...getAllDescendantIds(child));
    });
  }

  return ids;
};

// Helper function to check if category or its children have products
const hasProducts = (category: Category, products: Product[]): boolean => {
  // Check if category itself has products
  const directProducts = products.some(
    (p) => p.categoryId === category.id || p.category?.id === category.id
  );

  if (directProducts) return true;

  // Check children recursively
  if (category.children && category.children.length > 0) {
    return category.children.some((child) => hasProducts(child, products));
  }

  return false;
};

// Helper function to get product count for category and its descendants
const getCategoryProductCount = (
  category: Category,
  products: Product[]
): number => {
  const allCategoryIds = getAllDescendantIds(category);
  return products.filter((p) =>
    allCategoryIds.includes(p.categoryId || p.category?.id || "")
  ).length;
};

// Tree node component
interface TreeNodeProps {
  category: Category;
  products: Product[];
  selectedCategoryIds: string[];
  onToggle: (categoryId: string, shouldSelect: boolean) => void;
  level: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  category,
  products,
  selectedCategoryIds,
  onToggle,
  level,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const hasChildren = category.children && category.children.length > 0;
  const categoryHasProducts = hasProducts(category, products);
  const productCount = getCategoryProductCount(category, products);
  const isSelected = selectedCategoryIds.includes(category.id);
  const isDisabled = !categoryHasProducts;

  // Check if all children are selected (for indeterminate state)
  const allDescendantIds = getAllDescendantIds(category);
  const selectedDescendantIds = allDescendantIds.filter((id) =>
    selectedCategoryIds.includes(id)
  );
  const isIndeterminate =
    selectedDescendantIds.length > 0 &&
    selectedDescendantIds.length < allDescendantIds.length &&
    !isSelected;

  const handleToggle = () => {
    if (isDisabled) return;
    onToggle(category.id, !isSelected);
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-colors ${
          isDisabled
            ? "opacity-50 cursor-not-allowed bg-gray-50"
            : isSelected
            ? "bg-blue-50 hover:bg-blue-100"
            : "hover:bg-gray-50 cursor-pointer"
        }`}
        style={{ paddingLeft: `${level * 24 + 12}px` }}
      >
        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors"
            disabled={isDisabled}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-600" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* Checkbox */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={isDisabled}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
            isDisabled
              ? "border-gray-300 bg-gray-100 cursor-not-allowed"
              : isSelected
              ? "bg-blue-600 border-blue-600"
              : isIndeterminate
              ? "bg-blue-200 border-blue-400"
              : "border-gray-300 hover:border-blue-400"
          }`}
        >
          {isSelected && (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7"></path>
            </svg>
          )}
          {isIndeterminate && !isSelected && (
            <div className="w-2 h-2 bg-blue-600 rounded-sm" />
          )}
        </button>

        {/* Category Info */}
        <div
          className="flex-1 flex items-center justify-between min-w-0"
          onClick={handleToggle}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span
              className={`font-medium text-sm truncate ${
                isDisabled
                  ? "text-gray-400"
                  : isSelected
                  ? "text-blue-700"
                  : "text-gray-900"
              }`}
            >
              {category.name}
            </span>
            {hasChildren && (
              <span className="text-xs text-gray-500 flex-shrink-0">
                ({category.children!.length})
              </span>
            )}
          </div>

          {/* Product Count Badge */}
          <span
            className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
              isDisabled
                ? "bg-gray-200 text-gray-500"
                : productCount > 0
                ? "bg-green-100 text-green-700"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {productCount} {productCount === 1 ? "product" : "products"}
          </span>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="ml-2">
          {category.children!.map((child) => (
            <TreeNode
              key={child.id}
              category={child}
              products={products}
              selectedCategoryIds={selectedCategoryIds}
              onToggle={onToggle}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CategoryProductSelector: React.FC<
  CategoryProductSelectorProps
> = ({
  products,
  categories,
  selectedProductIds,
  selectedCategoryIds,
  onProductsChange,
  onCategoriesChange,
  isLoading = false,
}) => {
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("both");

  // Get products filtered by selected categories
  const filteredProducts = useMemo(() => {
    if (selectedCategoryIds.length === 0) {
      return products;
    }

    // Get all descendant category IDs from selected categories
    const allSelectedCategoryIds = new Set<string>();

    const addCategoryAndDescendants = (categoryId: string) => {
      allSelectedCategoryIds.add(categoryId);

      const findAndAddChildren = (cats: Category[]) => {
        for (const cat of cats) {
          if (cat.id === categoryId && cat.children) {
            cat.children.forEach((child) => {
              addCategoryAndDescendants(child.id);
            });
          } else if (cat.children) {
            findAndAddChildren(cat.children);
          }
        }
      };

      findAndAddChildren(categories);
    };

    selectedCategoryIds.forEach(addCategoryAndDescendants);

    return products.filter((product) =>
      allSelectedCategoryIds.has(
        product.categoryId || product.category?.id || ""
      )
    );
  }, [products, selectedCategoryIds, categories]);

  // Prepare options for product autocomplete
  const productOptions = useMemo(() => {
    const productsToShow =
      selectionMode === "categories" ? filteredProducts : products;

    return productsToShow.map((product) => ({
      id: product.id,
      label: product.name,
      subtitle: `₹${product.sellingPrice} • ${
        product.category?.name || "No category"
      }`,
      imageUrl: product.media?.[0]?.url,
    }));
  }, [products, filteredProducts, selectionMode]);

  // Handle category toggle with auto-selection of children
  const handleCategoryToggle = (categoryId: string, shouldSelect: boolean) => {
    const category = findCategoryById(categories, categoryId);
    if (!category) return;

    // Get all descendant IDs (including the category itself)
    const allIds = getAllDescendantIds(category);

    // Filter out categories without products
    const validIds = allIds.filter((id) => {
      const cat = findCategoryById(categories, id);
      return cat && hasProducts(cat, products);
    });

    let newSelectedIds: string[];

    if (shouldSelect) {
      // Add all valid descendant IDs
      newSelectedIds = [...new Set([...selectedCategoryIds, ...validIds])];
    } else {
      // Remove all descendant IDs
      newSelectedIds = selectedCategoryIds.filter(
        (id) => !validIds.includes(id)
      );
    }

    onCategoriesChange(newSelectedIds);

    // Auto-select products if in "categories" mode
    if (selectionMode === "categories") {
      const categoryProductIds = products
        .filter((p) =>
          newSelectedIds.includes(p.categoryId || p.category?.id || "")
        )
        .map((p) => p.id);
      onProductsChange(categoryProductIds);
    }
  };

  // Helper to find category by ID recursively
  const findCategoryById = (cats: Category[], id: string): Category | null => {
    for (const cat of cats) {
      if (cat.id === id) return cat;
      if (cat.children) {
        const found = findCategoryById(cat.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Get selected items info
  const selectedCategoriesCount = selectedCategoryIds.length;
  const selectedProductsCount = selectedProductIds.length;
  const categoryProductsCount = filteredProducts.length;

  // Get root categories (categories without parent)
  const rootCategories = useMemo(() => {
    if (!categories?.length) return [];

    // 1) gather all child ids
    const childIds = new Set<string>();

    const collectChildIds = (cats: Category[]) => {
      for (const c of cats) {
        if (c.children?.length) {
          for (const child of c.children) {
            childIds.add(child.id);
          }
          collectChildIds(c.children);
        }
      }
    };

    collectChildIds(categories);

      // 2) Remove categories that are already present as a child in the tree
      const uniqueRoots = categories.filter((cat) => {
        // prefer actual root (parentId null)
        if (cat.parentId === null) return true;

        // if this category is already inside parent's children[] => don't show as root
        if (childIds.has(cat.id)) return false;

        return true;
      });

    // 3) Dedupe by ID (extra safety)
    const map = new Map<string, Category>();
    for (const c of uniqueRoots) map.set(c.id, c);

    return Array.from(map.values());
  }, [categories]);


  return (
    <div className="space-y-6">
      {/* Selection Mode */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Selection Mode
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setSelectionMode("categories")}
            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
              selectionMode === "categories"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            <Tag className="h-4 w-4 mx-auto mb-1" />
            Categories Only
          </button>
          <button
            type="button"
            onClick={() => setSelectionMode("products")}
            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
              selectionMode === "products"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            <Package className="h-4 w-4 mx-auto mb-1" />
            Products Only
          </button>
          <button
            type="button"
            onClick={() => setSelectionMode("both")}
            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
              selectionMode === "both"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            <Info className="h-4 w-4 mx-auto mb-1" />
            Both
          </button>
        </div>
        <div className="mt-3 text-xs text-gray-600">
          {selectionMode === "categories" && (
            <p>
              🎯 Select categories to automatically include all their products
            </p>
          )}
          {selectionMode === "products" && (
            <p>🎯 Manually select individual products</p>
          )}
          {selectionMode === "both" && (
            <p>🎯 Select categories first, then add specific products</p>
          )}
        </div>
      </div>

      {/* Categories Tree Selection */}
      {(selectionMode === "categories" || selectionMode === "both") && (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Categories
          </label>

          <div className="border-2 border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto bg-white">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Loading categories...</p>
              </div>
            ) : rootCategories.length === 0 ? (
              <div className="text-center py-8">
                <Tag className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-500">No categories available</p>
              </div>
            ) : (
              <div className="space-y-1">
                {rootCategories.map((category) => (
                  <TreeNode
                    key={category.id}
                    category={category}
                    products={products}
                    selectedCategoryIds={selectedCategoryIds}
                    onToggle={handleCategoryToggle}
                    level={0}
                  />
                ))}
              </div>
            )}
          </div>

          {selectedCategoriesCount > 0 && selectionMode === "categories" && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                ✨ {categoryProductsCount} products from{" "}
                {selectedCategoriesCount} categor
                {selectedCategoriesCount !== 1 ? "ies" : "y"} will be included
              </p>
            </div>
          )}
        </div>
      )}

      {/* Products Selection */}
      {(selectionMode === "products" || selectionMode === "both") && (
        <div>
          <MultiSelectAutocomplete
            label={
              selectionMode === "both" && selectedCategoryIds.length > 0
                ? `Products (filtered by ${selectedCategoriesCount} categor${
                    selectedCategoriesCount !== 1 ? "ies" : "y"
                  })`
                : "Products"
            }
            options={productOptions}
            value={selectedProductIds}
            onChange={onProductsChange}
            placeholder="Search products..."
            isLoading={isLoading}
            showImages={true}
            emptyMessage={
              selectedCategoryIds.length > 0 && selectionMode === "both"
                ? "No products in selected categories"
                : "No products available"
            }
          />

          {selectionMode === "both" &&
            selectedCategoryIds.length > 0 &&
            filteredProducts.length > 0 && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  ℹ️ Showing {categoryProductsCount} products from selected
                  categories
                </p>
              </div>
            )}
        </div>
      )}

      {/* Summary */}
      {(selectedCategoriesCount > 0 || selectedProductsCount > 0) && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            Selection Summary
          </h4>
          <div className="space-y-1 text-sm text-gray-700">
            {selectedCategoriesCount > 0 && (
              <p>
                📁 {selectedCategoriesCount} categor
                {selectedCategoriesCount !== 1 ? "ies" : "y"} selected
              </p>
            )}
            {selectedProductsCount > 0 && (
              <p>
                📦 {selectedProductsCount} product
                {selectedProductsCount !== 1 ? "s" : ""} selected
              </p>
            )}
            {selectionMode === "categories" && (
              <p className="text-xs text-gray-600 mt-2">
                Note: Products are automatically included from selected
                categories
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};