import React, { useCallback, useState } from 'react';
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
}> = React.memo(({ product, onEdit, onDelete, onView, canUpdate, canDelete }) => {
  const primaryMedia = product.media?.find((m) => m.order === 0) || product.media?.[0];
  const isVideo = primaryMedia?.type === 'VIDEO';
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-300 group">
      <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200">
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

  const canCreate = hasPermission('products', 'canCreate');
  const canUpdate = hasPermission('products', 'canUpdate');
  const canDelete = hasPermission('products', 'canDelete');

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', searchQuery, filterCategory, filterActive, filterHasVariants],
    queryFn: async () => {
      const response = await productApi.getProducts({ limit: 100, search: searchQuery || undefined, categoryId: filterCategory || undefined, isActive: filterActive, hasVariants: filterHasVariants });
      return response.data;
    },
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

  const totalProducts = productsData?.products?.length || 0;
  const activeProducts = productsData?.products?.filter((p) => p.isActive).length || 0;
  const productsWithVariants = productsData?.products?.filter((p) => p.hasVariants).length || 0;
  const filteredProducts = productsData?.products || [];

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
            <button
              onClick={() => navigate('/admin/products/new')}
              disabled={!isLoadingWarehouses && !hasWarehouses}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl font-medium disabled:opacity-65 disabled:cursor-not-allowed"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Create Product</span>
              <span className="sm:hidden">Create</span>
            </button>
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

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products by name, SKU, or description..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">All Categories</option>
              {categoriesData?.categories?.map((cat: Category) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
            <select value={filterActive === undefined ? 'all' : filterActive ? 'active' : 'inactive'} onChange={(e) => setFilterActive(e.target.value === 'all' ? undefined : e.target.value === 'active')} className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <select value={filterHasVariants === undefined ? 'all' : filterHasVariants ? 'variable' : 'simple'} onChange={(e) => setFilterHasVariants(e.target.value === 'all' ? undefined : e.target.value === 'variable')} className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="all">All Types</option>
              <option value="simple">Simple</option>
              <option value="variable">Variable</option>
            </select>
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}><Grid3x3 className="h-4 w-4" /></button>
              <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}><List className="h-4 w-4" /></button>
            </div>
          </div>
        </div>

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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onEdit={handleEdit} onDelete={handleDelete} onView={handleView} canUpdate={canUpdate} canDelete={canDelete} />
            ))}
          </div>
        )}

        {/* View Modal */}
        {showViewModal && selectedProduct && (
          <ViewProductModal product={selectedProduct} onClose={() => { setShowViewModal(false); setSelectedProduct(null); }} onEdit={handleEdit} canUpdate={canUpdate} />
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
