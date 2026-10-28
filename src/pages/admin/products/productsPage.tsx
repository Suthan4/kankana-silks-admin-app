import React, { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layouts/mainLayout';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Plus,
  Edit,
  Trash2,
  X,
  Package,
  Search,
  Grid3x3,
  List,
  Eye,
  Image as ImageIcon,
  Tag,
  Layers,
  Box,
  AlertCircle,
  CheckCircle,
  Sparkles,
  TrendingUp,
  ShoppingCart,
  Warehouse as WarehouseIcon,
  MapPin,
  User,
  Video,
  Play,
  FileSpreadsheet,
  GitMerge,
} from 'lucide-react';
import { productApi } from '@/lib/api/product.api';
import { categoryApi } from '@/lib/api/category.api';
import { warehouseApi } from '@/lib/api/warehouse.api';
import type { Product } from '@/lib/types/product/prodcut';
import type { Category } from '@/lib/types/category/category';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router';
import { BackButton } from '@/components/ui/BackButton';

// ---------------------------------------------------------------------------
// StatsCard
// ---------------------------------------------------------------------------
const StatsCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  subtitle?: string;
  trend?: string;
}> = React.memo(({ icon, label, value, color, subtitle, trend }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
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
        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${colorMap[color] ?? ''}`}>
          {icon}
        </div>
      </div>
    </div>
  );
});
StatsCard.displayName = 'StatsCard';

// ---------------------------------------------------------------------------
// ProductCard
// ---------------------------------------------------------------------------
const ProductCard: React.FC<{
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onView: (product: Product) => void;
  canUpdate: boolean;
  canDelete: boolean;
  selectable?: boolean;
  selectedForConsolidation?: boolean;
  onToggleSelection?: (id: string) => void;
}> = React.memo(({ product, onEdit, onDelete, onView, canUpdate, canDelete, selectable = false, selectedForConsolidation = false, onToggleSelection }) => {
  const primaryMedia = product.media?.find((m) => m.order === 0) || product.media?.[0];
  const isVideo = primaryMedia?.type === 'VIDEO';
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-300 group">
      <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200">
        {selectable && (
          <label className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-lg bg-white/95 px-2.5 py-2 text-xs font-semibold text-slate-800 shadow-md">
            <input type="checkbox" checked={selectedForConsolidation} disabled={product.hasVariants || !product.isActive} onChange={() => onToggleSelection?.(product.id)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed" aria-label={`Select ${product.name} for consolidation`} />
            <span>{selectedForConsolidation ? 'Selected' : 'Select'}</span>
          </label>
        )}
        {primaryMedia ? (
          isVideo ? (
            <div className="relative w-full h-full">
              {primaryMedia.thumbnailUrl ? (
                <img src={primaryMedia.thumbnailUrl} alt={primaryMedia.altText || product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <Video className="h-20 w-20 text-gray-400" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                  <Play className="h-8 w-8 text-gray-800 ml-1" />
                </div>
              </div>
            </div>
          ) : (
            <img src={primaryMedia.url} alt={primaryMedia.altText || product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          )
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
          <span className={`px-2.5 py-1 text-xs font-bold rounded-full shadow-lg ${product.isActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            {product.isActive ? 'LIVE' : 'DRAFT'}
          </span>
        </div>
        {product.media && product.media.length > 1 && (
          <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black bg-opacity-70 text-white text-xs font-medium rounded-full flex items-center gap-1">
            <ImageIcon className="h-3 w-3" />
            {product.media.length}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-1">{product.name}</h3>
        {product.category && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
            <Tag className="h-3.5 w-3.5" />
            <span>{product.category.name}</span>
          </div>
        )}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Price</p>
            <p className="text-2xl font-bold text-blue-600">&#8377;{product.sellingPrice.toLocaleString()}</p>
            {product.basePrice !== product.sellingPrice && (
              <p className="text-xs text-gray-400 line-through">&#8377;{product.basePrice.toLocaleString()}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide">SKU</p>
            <p className="text-sm font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">{product.sku}</p>
          </div>
        </div>
        {product.hasVariants && product.variants && product.variants.length > 0 && (
          <div className="mb-3 p-2.5 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <p className="text-xs font-semibold text-purple-700 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              {product.variants.length} Variant{product.variants.length > 1 ? 's' : ''} Available
            </p>
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {product.variants.slice(0, 3).map((variant, idx) => (
                <span key={idx} className="text-xs bg-white px-2 py-0.5 rounded border border-purple-200 text-purple-700">
                  {variant.size || variant.color || variant.fabric}
                </span>
              ))}
              {product.variants.length > 3 && (
                <span className="text-xs text-purple-600 font-medium">+{product.variants.length - 3} more</span>
              )}
            </div>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => onView(product)} className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center" title="View Details">
            <Eye className="h-4 w-4" />
          </button>
          {canUpdate && (
            <button onClick={() => onEdit(product)} className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center" title="Edit Product">
              <Edit className="h-4 w-4" />
            </button>
          )}
          {canDelete && (
            <button onClick={() => onDelete(product.id)} className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center" title="Delete Product">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
ProductCard.displayName = 'ProductCard';

// ---------------------------------------------------------------------------
// ViewProductModal
// ---------------------------------------------------------------------------
const ViewProductModal: React.FC<{
  product: Product;
  onClose: () => void;
  onEdit?: (product: Product) => void;
  canUpdate: boolean;
}> = ({ product, onClose, onEdit, canUpdate }) => {
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const selectedMedia = product.media?.[selectedMediaIndex];
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Product Details</h2>
              <p className="text-sm text-blue-100">{product.sku}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canUpdate && onEdit && (
              <button onClick={() => { onClose(); onEdit(product); }} className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2">
                <Edit className="h-4 w-4" /> Edit
              </button>
            )}
            <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                {selectedMedia ? (
                  selectedMedia.type === 'VIDEO' ? (
                    <video src={selectedMedia.url} controls className="w-full h-full object-cover" poster={selectedMedia.thumbnailUrl}>
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img src={selectedMedia.url} alt={selectedMedia.altText || product.name} className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-24 w-24 text-gray-400" />
                  </div>
                )}
              </div>
              {product.media && product.media.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.media.map((m, idx) => (
                    <button key={idx} onClick={() => setSelectedMediaIndex(idx)} className={`aspect-square rounded-lg overflow-hidden border-2 transition-all relative ${selectedMediaIndex === idx ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'}`}>
                      {m.type === 'VIDEO' ? (
                        <>
                          {m.thumbnailUrl ? <img src={m.thumbnailUrl} alt={m.altText || `Video ${idx+1}`} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-800"><Video className="h-8 w-8 text-gray-400" /></div>}
                          <div className="absolute inset-0 flex items-center justify-center"><Play className="h-6 w-6 text-white drop-shadow-lg" /></div>
                        </>
                      ) : (
                        <img src={m.url} alt={m.altText || `Image ${idx+1}`} className="w-full h-full object-cover" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-2 flex-wrap">
                {product.hasVariants && (
                  <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Layers className="h-4 w-4" /> Variable Product
                  </span>
                )}
                <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h3>
                {product.category && <div className="flex items-center gap-2 text-gray-600"><Tag className="h-4 w-4" /><span>{product.category.name}</span></div>}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-baseline gap-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Selling Price</p>
                    <p className="text-4xl font-bold text-blue-600">&#8377;{product.sellingPrice.toLocaleString()}</p>
                  </div>
                  {product.basePrice !== product.sellingPrice && (
                    <div>
                      <p className="text-sm text-gray-500">Base Price</p>
                      <p className="text-xl text-gray-400 line-through">&#8377;{product.basePrice.toLocaleString()}</p>
                    </div>
                  )}
                </div>
                {product.basePrice !== product.sellingPrice && (
                  <p className="text-sm text-green-600 font-medium mt-2">
                    Save &#8377;{(product.basePrice - product.sellingPrice).toLocaleString()} ({Math.round(((product.basePrice - product.sellingPrice) / product.basePrice) * 100)}% off)
                  </p>
                )}
              </div>
              {product.hsnCode && <div><p className="text-sm text-gray-600">HSN Code</p><p className="text-lg font-semibold text-gray-900">{product.hsnCode}</p></div>}
              {(product.artisanName || product.artisanAbout || product.artisanLocation) && (
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><User className="h-5 w-5 text-amber-600" />Artisan Information</h4>
                  {product.artisanName && <p className="font-medium text-gray-900 mb-1">{product.artisanName}</p>}
                  {product.artisanLocation && <p className="text-sm text-gray-600 flex items-center gap-1 mb-2"><MapPin className="h-4 w-4" />{product.artisanLocation}</p>}
                  {product.artisanAbout && <p className="text-sm text-gray-700 italic">{product.artisanAbout}</p>}
                </div>
              )}
              {product.specifications && product.specifications.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Tag className="h-5 w-5 text-blue-600" />Specifications</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {product.specifications.map((spec, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{spec.key}</p>
                        <p className="text-sm font-semibold text-gray-900">{spec.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {product.hasVariants && product.variants && product.variants.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Layers className="h-5 w-5 text-purple-600" />Available Variants ({product.variants.length})</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {product.variants.map((variant, idx) => {
                      const label = [variant.size, variant.color, variant.fabric].filter(Boolean).join(' / ') || `Variant ${idx + 1}`;
                      const vStock = product.stock?.find((s) => s.variantId === variant.id);
                      return (
                        <div key={idx} className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900">{label}</span>
                            <span className="text-purple-600 font-bold text-lg">&#8377;{Number(variant.price || 0).toLocaleString()}</span>
                          </div>
                          {vStock && (
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>Stock: <strong className="text-gray-900">{vStock.quantity}</strong></span>
                              {vStock.warehouse && <span className="flex items-center gap-1"><WarehouseIcon className="h-3 w-3" />{vStock.warehouse.name}</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {!product.hasVariants && product.stock && product.stock.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Box className="h-5 w-5 text-green-600" />Stock Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-sm text-gray-600 mb-1">Quantity</p><p className="text-2xl font-bold text-green-600">{product.stock[0].quantity}</p></div>
                    {product.stock[0].warehouse && (
                      <div><p className="text-sm text-gray-600 mb-1">Warehouse</p><p className="text-sm font-semibold text-gray-900">{product.stock[0].warehouse.name}</p><p className="text-xs text-gray-500">{product.stock[0].warehouse.code}</p></div>
                    )}
                  </div>
                  {product.stock[0].lowStockThreshold && <p className="text-sm text-gray-600 mt-3">Low stock alert at {product.stock[0].lowStockThreshold} units</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// ProductsPage
// ---------------------------------------------------------------------------
const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [filterHasVariants, setFilterHasVariants] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [selectedProductMap, setSelectedProductMap] = useState<Record<string, Product>>({});
  const [showConsolidationModal, setShowConsolidationModal] = useState(false);
  const [consolidationParentId, setConsolidationParentId] = useState('');
  const [consolidationAttributeName, setConsolidationAttributeName] = useState<'color' | 'size' | 'fabric' | 'style'>('color');
  const [consolidationValues, setConsolidationValues] = useState<Record<string, string>>({});

  const canCreate = hasPermission('products', 'canCreate');
  const canUpdate = hasPermission('products', 'canUpdate');
  const canDelete = hasPermission('products', 'canDelete');

  const { data: productsData, isLoading, isFetching } = useQuery({
    queryKey: ['products', searchQuery, filterCategory, filterActive, filterHasVariants, page, pageSize],
    queryFn: async () => {
      // Explicitly preserve false values: inactive/simple filters are valid filters,
      // not the same as an omitted query parameter.
      const response = await productApi.getProducts({
        page,
        limit: pageSize,
        search: searchQuery.trim() || undefined,
        categoryId: filterCategory || undefined,
        ...(filterActive !== undefined ? { isActive: filterActive } : {}),
        ...(filterHasVariants !== undefined ? { hasVariants: filterHasVariants } : {}),
      });
      const data = response.data as typeof response.data & {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
      };
      // The admin endpoint returns pagination fields at the top level,
      // while the shared API type models them under pagination. Normalize both.
      return {
        ...data,
        pagination: data.pagination ?? {
          page: data.page ?? page,
          limit: data.limit ?? pageSize,
          total: data.total ?? data.products?.length ?? 0,
          totalPages: data.totalPages ?? Math.max(1, Math.ceil((data.total ?? data.products?.length ?? 0) / pageSize)),
        },
      };
    },
    placeholderData: (previousData) => previousData,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => { const r = await categoryApi.getCategories({ limit: 100 }); return r.data; },
  });

  const { data: warehousesData, isLoading: isLoadingWarehouses } = useQuery({
    queryKey: ['warehouses-active'],
    queryFn: async () => { const r = await warehouseApi.getActiveWarehouses(); return r.data; },
  });
  const hasWarehouses = warehousesData && warehousesData.length > 0;

  const consolidationMutation = useMutation({
    mutationFn: productApi.consolidateSimpleProducts,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      setSelectedProductMap({});
      setConsolidationValues({});
      setShowConsolidationModal(false);
      setConsolidationParentId('');
      toast.success('Products consolidated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Unable to consolidate these products');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: productApi.deleteProduct,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); toast.success('Product deleted successfully!'); },
    onError: () => { toast.error('Failed to delete product'); },
  });

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('Delete this product? This cannot be undone.')) deleteMutation.mutate(id);
  }, [deleteMutation]);

  const handleView = useCallback((product: Product) => { setSelectedProduct(product); setShowViewModal(true); }, []);

  const handleEdit = useCallback((product: Product) => { navigate(`/admin/products/${product.id}/edit`); }, [navigate]);

  const filteredProducts = productsData?.products || [];
  const pagination = productsData?.pagination;
  const totalProducts = pagination?.total ?? filteredProducts.length;
  // The other cards describe the currently loaded page; total catalog size comes
  // from server pagination rather than the number of items on this page.
  const activeProducts = filteredProducts.filter((p) => p.isActive).length;
  const productsWithVariants = filteredProducts.filter((p) => p.hasVariants).length;

  const categoryPaths = useMemo(() => {
    const all = categoriesData?.categories || [];
    const byId = new Map(all.map((category: Category) => [String(category.id), category]));
    const buildPath = (category: Category, visited = new Set<string>()): string => {
      const id = String(category.id);
      if (visited.has(id)) return category.name;
      const nextVisited = new Set(visited);
      nextVisited.add(id);
      const parent = category.parents?.[0]
        || category.parent
        || (category.parentId ? byId.get(String(category.parentId)) : undefined);
      return parent ? `${buildPath(parent, nextVisited)} › ${category.name}` : category.name;
    };
    return all.map((category: Category) => ({ id: String(category.id), name: category.name, path: buildPath(category) }))
      .sort((a, b) => a.path.localeCompare(b.path));
  }, [categoriesData]);

  const visibleCategoryOptions = useMemo(() => {
    const term = categorySearch.trim().toLocaleLowerCase();
    return categoryPaths.filter((category) => !term || category.path.toLocaleLowerCase().includes(term) || category.name.toLocaleLowerCase().includes(term));
  }, [categoryPaths, categorySearch]);

  const selectedCategoryPath = categoryPaths.find((category) => category.id === filterCategory)?.path || '';
  const selectedConsolidationProducts = Object.values(selectedProductMap);
  const selectedConsolidationIds = Object.keys(selectedProductMap);
  const toggleConsolidationSelection = useCallback((product: Product) => {
    if (product.hasVariants || !product.isActive) return;
    setSelectedProductMap((current) => {
      const next = { ...current };
      if (next[product.id]) {
        delete next[product.id];
      } else {
        next[product.id] = product;
      }
      return next;
    });
  }, []);
  const openConsolidationModal = () => {
    if (selectedConsolidationProducts.length < 2) {
      toast.error('Select at least two simple products first');
      return;
    }
    const first = selectedConsolidationProducts[0];
    setConsolidationParentId(first.id);
    setConsolidationValues((current) => {
      const next = { ...current };
      selectedConsolidationProducts.forEach((product) => {
        if (!next[product.id]) {
          const parts = product.name.split(/\s[-–|]\s/);
          next[product.id] = parts.length > 1 ? parts[parts.length - 1].trim() : '';
        }
      });
      return next;
    });
    setShowConsolidationModal(true);
  };
  const submitConsolidation = (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedConsolidationProducts.length < 2 || !consolidationParentId) return;
    if (selectedConsolidationProducts.some((product) => !consolidationValues[product.id]?.trim())) {
      toast.error('Enter a variant value for every selected product');
      return;
    }
    const normalized = selectedConsolidationProducts.map((product) => consolidationValues[product.id].trim().toLocaleLowerCase());
    if (new Set(normalized).size !== normalized.length) {
      toast.error('Variant values must be unique');
      return;
    }
    if (!window.confirm('Consolidate these products? The selected parent will remain active. Other products will be archived, not deleted. This action changes catalog/cart/inventory relationships and should be reviewed before confirming.')) return;
    consolidationMutation.mutate({
      parentProductId: consolidationParentId,
      attributeName: consolidationAttributeName,
      products: selectedConsolidationProducts.map((product) => ({
        productId: product.id,
        attributeValue: consolidationValues[product.id].trim(),
      })),
    });
  };


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
                  <Package className="h-7 w-7 text-white" />
                </div>
                Products
              </h1>
              <p className="text-sm text-gray-600 mt-2">Manage your complete product catalog</p>
            </div>
          </div>
          {canCreate && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/admin/products/bulk-upload')}
                disabled={!isLoadingWarehouses && !hasWarehouses}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg transition-all shadow-sm hover:shadow font-medium text-sm disabled:opacity-65 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span className="hidden sm:inline">Bulk Upload</span>
                <span className="sm:hidden">Bulk</span>
              </button>
              <button
                onClick={() => navigate('/admin/products/new')}
                disabled={!isLoadingWarehouses && !hasWarehouses}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl font-medium text-sm disabled:opacity-65 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Create Product</span>
                <span className="sm:hidden">Create</span>
              </button>
            </div>
          )}
        </div>

        {/* Warehouse Warning */}
        {!isLoadingWarehouses && !hasWarehouses && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl shadow-lg p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <WarehouseIcon className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" /> Warehouse Required
                </h3>
                <p className="text-gray-700 mb-4">You need to create at least one warehouse before adding products.</p>
                <button onClick={() => { window.location.href = '/admin/warehouses'; }} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg transition-all shadow-md font-medium">
                  <Plus className="h-4 w-4" /> Create Warehouse
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard icon={<Package className="h-6 w-6" />} label="Total Products" value={totalProducts} color="blue" subtitle="In catalog" trend="+12% this month" />
          <StatsCard icon={<CheckCircle className="h-6 w-6" />} label="Active" value={activeProducts} color="green" subtitle="Live on store" />
          <StatsCard icon={<Layers className="h-6 w-6" />} label="With Variants" value={productsWithVariants} color="purple" subtitle="Variable products" />
          <StatsCard icon={<ShoppingCart className="h-6 w-6" />} label="Orders" value="1,234" color="orange" subtitle="This month" trend="+8%" />
        </div>

        {/* Search and filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(260px,1.5fr)_minmax(220px,1fr)_repeat(2,minmax(145px,.65fr))_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} placeholder="Search name, SKU, description..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" />
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={categoryPickerOpen ? categorySearch : (selectedCategoryPath || '')}
                onFocus={() => { setCategoryPickerOpen(true); setCategorySearch(''); }}
                onChange={(e) => { setCategorySearch(e.target.value); setCategoryPickerOpen(true); }}
                onKeyDown={(e) => { if (e.key === 'Escape') setCategoryPickerOpen(false); if (e.key === 'Enter' && visibleCategoryOptions[0]) { setFilterCategory(visibleCategoryOptions[0].id); setCategorySearch(''); setCategoryPickerOpen(false); setPage(1); } }}
                placeholder="All categories · Search hierarchy"
                aria-label="Filter by category hierarchy"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-9 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
              {filterCategory && <button type="button" onClick={() => { setFilterCategory(''); setCategorySearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700" aria-label="Clear category"><X className="h-4 w-4" /></button>}
              {categoryPickerOpen && (
                <>
                  <button type="button" aria-label="Close category suggestions" className="fixed inset-0 z-20 cursor-default" onClick={() => setCategoryPickerOpen(false)} />
                  <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                    <button type="button" onClick={() => { setFilterCategory(''); setCategorySearch(''); setCategoryPickerOpen(false); setPage(1); }} className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition hover:bg-blue-50 ${!filterCategory ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}>All categories</button>
                    {visibleCategoryOptions.length ? visibleCategoryOptions.map((category) => (
                      <button type="button" key={category.id} onClick={() => { setFilterCategory(category.id); setCategorySearch(''); setCategoryPickerOpen(false); setPage(1); }} className={`w-full rounded-lg px-3 py-2 text-left transition hover:bg-blue-50 ${filterCategory === category.id ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}>
                        <span className="block text-xs text-slate-500">{category.path.includes(' › ') ? category.path.split(' › ').slice(0, -1).join(' › ') : 'Top-level category'}</span>
                        <span className="block truncate text-sm font-medium">{category.name}</span>
                      </button>
                    )) : <p className="px-3 py-5 text-center text-sm text-slate-500">No matching categories</p>}
                  </div>
                </>
              )}
            </div>

            <select value={filterActive === undefined ? 'all' : filterActive ? 'active' : 'inactive'} onChange={(e) => { const value = e.target.value; setFilterActive(value === 'all' ? undefined : value === 'active'); setPage(1); }} aria-label="Filter by status" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100">
              <option value="all">All statuses</option><option value="active">Active only</option><option value="inactive">Inactive only</option>
            </select>
            <select value={filterHasVariants === undefined ? 'all' : filterHasVariants ? 'variable' : 'simple'} onChange={(e) => { const value = e.target.value; setFilterHasVariants(value === 'all' ? undefined : value === 'variable'); setPage(1); }} aria-label="Filter by product type" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100">
              <option value="all">All types</option><option value="simple">Simple</option><option value="variable">Variable</option>
            </select>
            <div className="flex items-center justify-start gap-1 rounded-xl bg-slate-100 p-1 xl:justify-self-end">
              <button type="button" onClick={() => setViewMode('grid')} aria-label="Grid view" className={`rounded-lg p-2.5 transition ${viewMode === 'grid' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}><Grid3x3 className="h-4 w-4" /></button>
              <button type="button" onClick={() => setViewMode('table')} aria-label="Table view" className={`rounded-lg p-2.5 transition ${viewMode === 'table' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}><List className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span>{pagination ? `Showing ${filteredProducts.length ? (page - 1) * pageSize + 1 : 0}–${Math.min((page - 1) * pageSize + filteredProducts.length, pagination.total)} of ${pagination.total} products` : 'Filtering products'}{isFetching ? ' · Updating…' : ''}</span>
            {(searchQuery || filterCategory || filterActive !== undefined || filterHasVariants !== undefined) && <button type="button" onClick={() => { setSearchQuery(''); setFilterCategory(''); setFilterActive(undefined); setFilterHasVariants(undefined); setCategorySearch(''); setPage(1); }} className="font-semibold text-blue-700 hover:text-blue-900">Clear all filters</button>}
          </div>
        </div>

        {canUpdate && selectedConsolidationProducts.length > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm"><GitMerge className="h-5 w-5" /></div>
              <div><p className="font-semibold text-slate-900">{selectedConsolidationProducts.length} simple product{selectedConsolidationProducts.length === 1 ? '' : 's'} selected</p><p className="text-xs text-slate-600">Choose a parent product and turn the selected products into variants without recreating them.</p></div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setSelectedProductMap({})} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Clear selection</button>
              <button type="button" disabled={selectedConsolidationProducts.length < 2} onClick={openConsolidationModal} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"><GitMerge className="h-4 w-4" />Consolidate as variants</button>
            </div>
          </div>
        )}

        {/* Products Display */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-4 text-gray-500">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-10 w-10 text-blue-600" />
            </div>
            <p className="text-gray-700 text-lg font-semibold">No products found</p>
            <p className="text-gray-500 text-sm mt-2">{searchQuery || filterCategory ? 'Try adjusting your filters' : 'Get started by creating your first product'}</p>
            {canCreate && !searchQuery && (
              <button onClick={() => navigate('/admin/products/new')} disabled={!isLoadingWarehouses && !hasWarehouses} className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-65 disabled:cursor-not-allowed">
                Create First Product
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onEdit={handleEdit} onDelete={handleDelete} onView={handleView} canUpdate={canUpdate} canDelete={canDelete} selectable={canUpdate} selectedForConsolidation={Boolean(selectedProductMap[product.id])} onToggleSelection={() => toggleConsolidationSelection(product)} />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-[850px] w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="px-3 py-3 font-semibold">Select</th><th className="px-4 py-3 font-semibold">Product</th><th className="px-4 py-3 font-semibold">Category</th><th className="px-4 py-3 font-semibold">Price</th><th className="px-4 py-3 font-semibold">Type</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 text-right font-semibold">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product) => {
                    const media = product.media?.find((item) => item.order === 0) || product.media?.[0];
                    return <tr key={product.id} className="transition hover:bg-slate-50/80">
                      <td className="px-3 py-3"><input type="checkbox" checked={Boolean(selectedProductMap[product.id])} disabled={!canUpdate || product.hasVariants || !product.isActive} onChange={() => toggleConsolidationSelection(product)} aria-label={`Select ${product.name} for consolidation`} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-30" /></td>
                      <td className="px-4 py-3"><div className="flex min-w-[250px] items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">{media?.type === 'IMAGE' ? <img src={media.url} alt={media.altText || product.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Package className="h-5 w-5 text-slate-400" /></div>}</div>
                        <div className="min-w-0"><p className="truncate font-semibold text-slate-900">{product.name}</p><p className="mt-0.5 font-mono text-xs text-slate-500">{product.sku}</p></div>
                      </div></td>
                      <td className="px-4 py-3 text-slate-600">{product.category?.name || '—'}</td>
                      <td className="px-4 py-3"><p className="font-semibold text-slate-900">₹{Number(product.sellingPrice).toLocaleString('en-IN')}</p>{product.basePrice !== product.sellingPrice && <p className="text-xs text-slate-400 line-through">₹{Number(product.basePrice).toLocaleString('en-IN')}</p>}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${product.hasVariants ? 'bg-violet-50 text-violet-700' : 'bg-slate-100 text-slate-700'}`}>{product.hasVariants ? 'Variable' : 'Simple'}</span></td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${product.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{product.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td className="px-4 py-3"><div className="flex justify-end gap-1.5">
                        <button type="button" onClick={() => handleView(product)} aria-label={`View ${product.name}`} className="rounded-lg bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"><Eye className="h-4 w-4" /></button>
                        {canUpdate && <button type="button" onClick={() => handleEdit(product)} aria-label={`Edit ${product.name}`} className="rounded-lg bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"><Edit className="h-4 w-4" /></button>}
                        {canDelete && <button type="button" onClick={() => handleDelete(product.id)} aria-label={`Delete ${product.name}`} className="rounded-lg bg-rose-50 p-2 text-rose-700 hover:bg-rose-100"><Trash2 className="h-4 w-4" /></button>}
                      </div></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {pagination && pagination.totalPages > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span>Rows per page</span>
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 outline-none focus:border-blue-500">
                <option value={12}>12</option><option value={24}>24</option><option value={48}>48</option>
              </select>
              <span className="text-slate-400">Page {pagination.page} of {pagination.totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page <= 1 || isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
              <span className="min-w-20 text-center text-sm font-semibold text-slate-700">{pagination.page} / {pagination.totalPages}</span>
              <button type="button" disabled={page >= pagination.totalPages || isFetching} onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && selectedProduct && (
          <ViewProductModal product={selectedProduct} onClose={() => { setShowViewModal(false); setSelectedProduct(null); }} onEdit={handleEdit} canUpdate={canUpdate} />
        )}

        {showConsolidationModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <form onSubmit={submitConsolidation} className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-200 bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-5 text-white">
                <div className="flex items-start gap-3"><div className="rounded-xl bg-white/15 p-2.5"><GitMerge className="h-5 w-5" /></div><div><h2 className="text-xl font-bold">Consolidate simple products</h2><p className="mt-1 text-sm text-blue-100">Reuse existing products as variants. No product recreation or image re-upload.</p></div></div>
                <button type="button" onClick={() => setShowConsolidationModal(false)} aria-label="Close consolidation dialog" className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-5 overflow-y-auto p-6">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><strong>Before you continue:</strong> products must represent the same underlying item and use the same category. The chosen parent remains active; the other products are archived, while their SKUs, images, inventory, and order history are preserved.</div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">Variant attribute</label>
                  <select value={consolidationAttributeName} onChange={(e) => setConsolidationAttributeName(e.target.value as 'color' | 'size' | 'fabric' | 'style')} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100">
                    <option value="color">Color</option><option value="size">Size</option><option value="fabric">Fabric</option><option value="style">Style</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500">Each selected product becomes one variant using this attribute and the value you provide below.</p>
                </div>
                <div className="space-y-3">
                  <div><h3 className="text-sm font-semibold text-slate-800">Choose the parent product</h3><p className="text-xs text-slate-500">This product keeps its catalog identity, URL/slug, description, and SKU.</p></div>
                  {selectedConsolidationProducts.map((product) => (
                    <div key={product.id} className={`grid grid-cols-1 gap-3 rounded-xl border p-3 sm:grid-cols-[auto_minmax(0,1fr)_minmax(160px,.8fr)] sm:items-center ${consolidationParentId === product.id ? 'border-blue-300 bg-blue-50/70' : 'border-slate-200'}`}>
                      <input type="radio" name="consolidation-parent" value={product.id} checked={consolidationParentId === product.id} onChange={() => setConsolidationParentId(product.id)} aria-label={`Keep ${product.name} as parent product`} className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{product.name}</p><p className="mt-0.5 text-xs text-slate-500">SKU: {product.sku} · ₹{Number(product.sellingPrice).toLocaleString('en-IN')}</p>{consolidationParentId === product.id && <span className="mt-1 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">Parent product</span>}</div>
                      <div><label className="mb-1 block text-xs font-semibold text-slate-600">{consolidationAttributeName[0].toUpperCase() + consolidationAttributeName.slice(1)} value</label><input required maxLength={120} value={consolidationValues[product.id] || ''} onChange={(e) => setConsolidationValues((current) => ({ ...current, [product.id]: e.target.value }))} placeholder={consolidationAttributeName === 'color' ? 'e.g. Wine, Peach, Emerald Green' : `Enter ${consolidationAttributeName}`} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100" /></div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">The operation runs in a database transaction. If validation or migration fails, all changes roll back. Review the selected products and attribute values carefully before confirming.</div>
              </div>
              <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setShowConsolidationModal(false)} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={consolidationMutation.isPending || selectedConsolidationProducts.length < 2 || selectedConsolidationProducts.some((product) => !consolidationValues[product.id]?.trim())} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{consolidationMutation.isPending ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Consolidating…</> : <><GitMerge className="h-4 w-4" />Confirm consolidation</>}</button>
              </div>
            </form>
          </div>
        )}

        {!canCreate && !canUpdate && !canDelete && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">You have read-only access. Contact your administrator for permissions.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ProductsPage;
