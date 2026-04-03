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
  Warehouse,
  MapPin,
  Package,
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  Eye,
  TrendingUp,
  Box,
  CheckCircle,
  XCircle,
  Grid3x3,
  List,
} from "lucide-react";
import { warehouseApi } from "@/lib/api/warehouse.api";
import {
  type UpdateWarehouseData,
  type Warehouse as WarehouseType,
} from "@/lib/types/warehouse/warehouse";
import {
  createWarehouseSchema,
  type CreateWarehouseFormData,
} from "@/lib/types/warehouse/schema";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { BackButton } from "@/components/ui/BackButton";

// Stats Card Component
const StatsCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  subtitle?: string;
}> = ({ icon, label, value, color, subtitle }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div
          className={`h-10 w-10 rounded-lg flex items-center justify-center ${
            colorClasses[color as keyof typeof colorClasses]
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

// Warehouse Card Component for Grid View
const WarehouseCard: React.FC<{
  warehouse: WarehouseType;
  onEdit: (warehouse: WarehouseType) => void;
  onDelete: (id: string) => void;
  onViewStock: (id: string) => void;
  handleViewStock: (id: string) => void;
  canUpdate: boolean;
  canDelete: boolean;
}> = ({
  warehouse,
  onEdit,
  onDelete,
  onViewStock,
  handleViewStock,
  canUpdate,
  canDelete,
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-blue-300 relative">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-t-lg text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-white/20 rounded-lg flex items-center justify-center">
              <Warehouse className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">
                {warehouse.name}
              </h3>
              <p className="text-blue-100 text-xs">Code: {warehouse.code}</p>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${warehouse.isActive ? "bg-green-400 text-green-900" : "bg-red-400 text-red-900"}`}
          >
            {warehouse.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="p-3 space-y-2">
        <div className="flex items-start gap-1.5 text-gray-700">
          <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-medium truncate">{warehouse.address}</p>
            <p className="text-gray-500">
              {warehouse.city}, {warehouse.state} - {warehouse.pincode}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
          <div className="text-center p-1.5 bg-blue-50 rounded-lg">
            <Package className="h-4 w-4 text-blue-600 mx-auto mb-0.5" />
            <p className="text-xs text-gray-500">Stock</p>
            <p className="text-sm font-bold text-gray-900">--</p>
          </div>
          <div className="text-center p-1.5 bg-green-50 rounded-lg">
            <Box className="h-4 w-4 text-green-600 mx-auto mb-0.5" />
            <p className="text-xs text-gray-500">Products</p>
            <p className="text-sm font-bold text-gray-900">--</p>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => handleViewStock(warehouse.id)}
            className="flex-1 px-2 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <Eye className="h-3.5 w-3.5" />
            View Stocks
          </button>

          {(canUpdate || canDelete) && (
            <div className="relative">
              <button
                onClick={() =>
                  setOpenMenuId(
                    openMenuId === warehouse.id ? null : warehouse.id,
                  )
                }
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {openMenuId === warehouse.id && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  {canUpdate && (
                    <button
                      onClick={() => {
                        onViewStock(warehouse.id);
                        setOpenMenuId(null);
                      }}
                      className="w-full px-3 py-2 text-xs text-left hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => {
                        onDelete(warehouse.id);
                        setOpenMenuId(null);
                      }}
                      className="w-full px-3 py-2 text-xs text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Detail = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <p className="text-gray-500 text-xs">{label}</p>
    <p className="font-medium text-sm">{value}</p>
  </div>
);

// Compact Form Field
const Field = ({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-0.5">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="mt-0.5 text-xs text-red-500">{error}</p>}
  </div>
);

const inputCls =
  "w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500";

const WarehousesPage = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] =
    useState<WarehouseType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | undefined>(
    undefined,
  );
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [viewingWarehouse, setViewingWarehouse] =
    useState<WarehouseType | null>(null);
  const [stockWarehouseId, setStockWarehouseId] = useState<string | null>(null);

  const canCreate = hasPermission("warehouses", "canCreate");
  const canUpdate = hasPermission("warehouses", "canUpdate");
  const canDelete = hasPermission("warehouses", "canDelete");
  const navigate = useNavigate();

  const { data: warehousesData, isLoading } = useQuery({
    queryKey: ["warehouses", searchQuery, filterActive],
    queryFn: async () => {
      const response = await warehouseApi.getWarehouses({
        limit: 100,
        search: searchQuery || undefined,
        isActive: filterActive,
      });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: warehouseApi.createWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      setShowCreateModal(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWarehouseData }) =>
      warehouseApi.updateWarehouse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      setEditingWarehouse(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: warehouseApi.deleteWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
    onError: (error) => {
      toast.error(error?.message);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateWarehouseFormData>({
    mode: "all",
    resolver: zodResolver(
      createWarehouseSchema,
    ) as Resolver<CreateWarehouseFormData>,
  });

  const onSubmit = (data: CreateWarehouseFormData) => {
    if (editingWarehouse) {
      updateMutation.mutate({
        id: editingWarehouse.id,
        data: {
          name: data.name,
          address: data.address,
          addressLine2: data.addressLine2,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          country: data.country,
          contactPerson: data.contactPerson,
          phone: data.phone,
          email: data.email,
          isDefaultPickup: data.isDefaultPickup,
          isActive: data.isActive,
        },
      });
    } else {
      createMutation.mutate({
        ...data,
        code: data.code.toUpperCase(),
        country: data.country ?? "India",
        isDefaultPickup: data.isDefaultPickup ?? false,
        isActive: data.isActive ?? true,
      });
    }
  };

  const handleEdit = (warehouse: WarehouseType) => {
    setEditingWarehouse(warehouse);
    setValue("name", warehouse.name);
    setValue("code", warehouse.code);
    setValue("address", warehouse.address);
    setValue("addressLine2", warehouse.addressLine2);
    setValue("city", warehouse.city);
    setValue("state", warehouse.state);
    setValue("pincode", warehouse.pincode);
    setValue("country", warehouse.country);
    setValue("contactPerson", warehouse.contactPerson);
    setValue("phone", warehouse.phone);
    setValue("email", warehouse.email);
    setValue("isDefaultPickup", warehouse.isDefaultPickup);
    setValue("isActive", warehouse.isActive);
    setShowCreateModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Delete this warehouse? This cannot be undone."))
      deleteMutation.mutate(id);
  };

  const handleViewStock = (id: string) => {
    setStockWarehouseId(id);
    navigate(`/admin/warehouses/${id}`);
  };

  const totalWarehouses = warehousesData?.warehouses?.length || 0;
  const activeWarehouses =
    warehousesData?.warehouses?.filter((w) => w.isActive).length || 0;
  const filteredWarehouses = warehousesData?.warehouses || [];

  return (
    <MainLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Warehouse className="h-6 w-6 text-blue-600" />
                Warehouses
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage warehouse locations and inventory
              </p>
            </div>
          </div>
          {canCreate && (
            <button
              onClick={() => {
                setEditingWarehouse(null);
                reset({
                  name: "",
                  code: "",
                  address: "",
                  addressLine2: "",
                  city: "",
                  state: "",
                  pincode: "",
                  country: "India",
                  contactPerson: "",
                  phone: "",
                  email: "",
                  isDefaultPickup: false,
                  isActive: true,
                });
                setShowCreateModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm shadow-sm whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Warehouse</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatsCard
            icon={<Warehouse className="h-5 w-5" />}
            label="Total"
            value={totalWarehouses}
            color="blue"
            subtitle="All locations"
          />
          <StatsCard
            icon={<CheckCircle className="h-5 w-5" />}
            label="Active"
            value={activeWarehouses}
            color="green"
            subtitle="Operational"
          />
          <StatsCard
            icon={<XCircle className="h-5 w-5" />}
            label="Inactive"
            value={totalWarehouses - activeWarehouses}
            color="orange"
            subtitle="Not operational"
          />
          <StatsCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Capacity"
            value="85%"
            color="purple"
            subtitle="Overall usage"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, code, or city..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <select
                value={
                  filterActive === undefined
                    ? "all"
                    : filterActive
                      ? "active"
                      : "inactive"
                }
                onChange={(e) => {
                  const v = e.target.value;
                  setFilterActive(v === "all" ? undefined : v === "active");
                }}
                className="text-sm px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5 ml-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                  title="Grid"
                >
                  <Grid3x3 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === "table" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                  title="Table"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="bg-white rounded-lg border border-gray-100 p-10 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-3 text-sm text-gray-500">Loading warehouses...</p>
          </div>
        ) : filteredWarehouses.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-100 p-10 text-center">
            <Warehouse className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              {searchQuery ? "No results found" : "No warehouses yet"}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {searchQuery
                ? "Try adjusting your search"
                : "Get started by adding your first warehouse"}
            </p>
            {canCreate && !searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Create warehouse →
              </button>
            )}
          </div>
        ) : (
          <>
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWarehouses.map((w) => (
                  <WarehouseCard
                    key={w.id}
                    warehouse={w}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onViewStock={(id) =>
                      setViewingWarehouse(
                        filteredWarehouses.find((x) => x.id === id) || null,
                      )
                    }
                    handleViewStock={handleViewStock}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                  />
                ))}
              </div>
            )}
            {viewMode === "table" && (
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Warehouse
                        </th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Location
                        </th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                          Code
                        </th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Status
                        </th>
                        {(canUpdate || canDelete) && (
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredWarehouses.map((w) => (
                        <tr key={w.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Warehouse className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {w.name}
                                </div>
                                <div className="text-xs text-gray-400 lg:hidden">
                                  {w.code}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-700">
                              {w.city}, {w.state}
                            </div>
                            <div className="text-xs text-gray-400">
                              {w.pincode}
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">
                              {w.code}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 inline-flex items-center text-xs font-semibold rounded-full ${w.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                            >
                              {w.isActive ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Inactive
                                </>
                              )}
                            </span>
                          </td>
                          {(canUpdate || canDelete) && (
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleViewStock(w.id)}
                                className="text-xs text-blue-600 hover:text-blue-800 mr-3 inline-flex items-center gap-1"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View
                              </button>
                              {canUpdate && (
                                <button
                                  onClick={() => handleEdit(w)}
                                  className="text-blue-600 hover:text-blue-800 mr-2"
                                  title="Edit"
                                >
                                  <Edit className="h-3.5 w-3.5 inline" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => handleDelete(w.id)}
                                  className="text-red-500 hover:text-red-700"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5 inline" />
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
          </>
        )}

        {/* View Details Drawer */}
        {viewingWarehouse && (
          <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
            <div className="bg-white w-full max-w-sm h-full shadow-xl overflow-y-auto">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-base font-semibold">Warehouse Details</h3>
                <button
                  onClick={() => setViewingWarehouse(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 space-y-3 text-sm">
                <Detail label="Name" value={viewingWarehouse.name} />
                <Detail label="Code" value={viewingWarehouse.code} />
                <Detail label="Address" value={viewingWarehouse.address} />
                <Detail
                  label="Location"
                  value={`${viewingWarehouse.city}, ${viewingWarehouse.state} - ${viewingWarehouse.pincode}`}
                />
                <Detail label="Country" value={viewingWarehouse.country} />
                <Detail
                  label="Contact"
                  value={viewingWarehouse.contactPerson}
                />
                <Detail label="Phone" value={viewingWarehouse.phone} />
                <Detail label="Email" value={viewingWarehouse.email ?? "—"} />
                <div className="flex gap-2 pt-1">
                  {viewingWarehouse.isActive && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                      Active
                    </span>
                  )}
                  {viewingWarehouse.isDefaultPickup && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                      Default Pickup
                    </span>
                  )}
                </div>
                {canUpdate && (
                  <button
                    onClick={() => {
                      setViewingWarehouse(null);
                      handleEdit(viewingWarehouse);
                    }}
                    className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 text-sm rounded-lg"
                  >
                    Edit Warehouse
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── COMPACT ADD/EDIT MODAL ── */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col"
              style={{ maxHeight: "95vh" }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <div className="h-7 w-7 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Warehouse className="h-4 w-4 text-blue-600" />
                  </div>
                  {editingWarehouse ? "Edit Warehouse" : "Add New Warehouse"}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingWarehouse(null);
                    reset();
                  }}
                  className="h-7 w-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form — scrolls only if content truly overflows */}
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col flex-1 min-h-0"
              >
                <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
                  {/* Error banner */}
                  {(createMutation.isError || updateMutation.isError) && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {(createMutation.error as any)?.message ||
                        (updateMutation.error as any)?.message ||
                        "Failed to save warehouse"}
                    </div>
                  )}

                  {/* Row 1: Name + Code */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Warehouse Name"
                      required
                      error={errors.name?.message}
                    >
                      <input
                        {...register("name")}
                        type="text"
                        className={inputCls}
                        placeholder="Main Warehouse"
                      />
                    </Field>
                    <Field
                      label="Warehouse Code"
                      required
                      error={errors.code?.message}
                    >
                      <input
                        {...register("code")}
                        type="text"
                        disabled={!!editingWarehouse}
                        className={`${inputCls} uppercase font-mono disabled:bg-gray-50 disabled:text-gray-400`}
                        placeholder="WH-01"
                        maxLength={20}
                      />
                      <p className="mt-0.5 text-xs text-gray-400">
                        Unique (alphanumeric)
                      </p>
                    </Field>
                  </div>

                  {/* Row 2: Address + Address Line 2 */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Address"
                      required
                      error={errors.address?.message}
                    >
                      <textarea
                        {...register("address")}
                        rows={2}
                        className={inputCls}
                        placeholder="123 Main Street, Building A"
                        style={{ resize: "none" }}
                      />
                    </Field>
                    <Field
                      label="Address Line 2"
                      error={errors.addressLine2?.message}
                    >
                      <input
                        {...register("addressLine2")}
                        className={inputCls}
                        placeholder="Apartment, Floor (optional)"
                      />
                    </Field>
                  </div>

                  {/* Row 3: City + State + Pincode */}
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="City" required error={errors.city?.message}>
                      <input
                        {...register("city")}
                        type="text"
                        className={inputCls}
                        placeholder="Mumbai"
                      />
                    </Field>
                    <Field label="State" required error={errors.state?.message}>
                      <input
                        {...register("state")}
                        type="text"
                        className={inputCls}
                        placeholder="Maharashtra"
                      />
                    </Field>
                    <Field
                      label="Pincode"
                      required
                      error={errors.pincode?.message}
                    >
                      <input
                        {...register("pincode")}
                        type="text"
                        className={`${inputCls} font-mono`}
                        placeholder="400001"
                        maxLength={6}
                      />
                    </Field>
                  </div>

                  {/* Row 4: Country (disabled) */}
                  <Field
                    label="Country"
                    required
                    error={errors.country?.message}
                  >
                    <input
                      {...register("country")}
                      defaultValue="India"
                      disabled
                      className={`${inputCls} bg-gray-50 text-gray-500 cursor-not-allowed`}
                    />
                  </Field>

                  {/* Row 5: Contact + Phone + Email */}
                  <div className="grid grid-cols-3 gap-3">
                    <Field
                      label="Contact Person"
                      required
                      error={errors.contactPerson?.message}
                    >
                      <input
                        {...register("contactPerson")}
                        className={inputCls}
                        placeholder="Person Name"
                      />
                    </Field>
                    <Field label="Phone" required error={errors.phone?.message}>
                      <input
                        {...register("phone")}
                        className={`${inputCls} font-mono`}
                        placeholder="9876543210"
                      />
                    </Field>
                    <Field label="Email" required error={errors.email?.message}>
                      <input
                        {...register("email")}
                        type="email"
                        className={inputCls}
                        placeholder="email@example.com"
                      />
                    </Field>
                  </div>

                  {/* Row 6: Toggles */}
                  <div className="flex items-center gap-6 py-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        {...register("isActive")}
                        type="checkbox"
                        className="h-3.5 w-3.5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-600 font-medium">
                        Active & Operational
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        {...register("isDefaultPickup")}
                        type="checkbox"
                        className="h-3.5 w-3.5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-600 font-medium">
                        Default Pickup Warehouse
                      </span>
                    </label>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100 flex-shrink-0 bg-gray-50 rounded-b-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingWarehouse(null);
                      reset();
                    }}
                    className="px-4 py-1.5 text-sm bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                    className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3.5 w-3.5" />
                        {editingWarehouse
                          ? "Update Warehouse"
                          : "Create Warehouse"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {!canCreate && !canUpdate && !canDelete && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-700">
              You have read-only access. Contact your administrator for
              additional permissions.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default WarehousesPage;
