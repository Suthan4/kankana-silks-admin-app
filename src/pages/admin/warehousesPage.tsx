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

// Stats Card Component
const StatsCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  subtitle?: string;
}> = ({ icon, label, value, color, subtitle }) => {
  const colorClasses = {
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

// Warehouse Card Component for Grid View
const WarehouseCard: React.FC<{
  warehouse: WarehouseType;
  onEdit: (warehouse: WarehouseType) => void;
  onDelete: (id: string) => void;
  onViewStock: (id: string) => void;
  handleViewStock: (id: string) => void;
  canUpdate: boolean;
  canDelete: boolean;
}> = ({ warehouse, onEdit, onDelete, onViewStock,handleViewStock, canUpdate, canDelete }) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300 relative">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Warehouse className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{warehouse.name}</h3>
              <p className="text-blue-100 text-sm">Code: {warehouse.code}</p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              warehouse.isActive
                ? "bg-green-400 text-green-900"
                : "bg-red-400 text-red-900"
            }`}
          >
            {warehouse.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Location */}
        <div className="flex items-start gap-2 text-gray-700">
          <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">{warehouse.address}</p>
            <p className="text-gray-500">
              {warehouse.city}, {warehouse.state} - {warehouse.pincode}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <Package className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Total Stock</p>
            <p className="text-lg font-bold text-gray-900">--</p>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <Box className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Products</p>
            <p className="text-lg font-bold text-gray-900">--</p>
          </div>
        </div>

        {/* Actions */}
        {/* Actions */}
        <div className="flex gap-2 pt-3">
          {/* View Details */}
          <button
            onClick={() => handleViewStock(warehouse.id)}
            className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <Eye className="h-4 w-4" />
            View Stocks
          </button>

          {(canUpdate || canDelete) && (
            <div className="relative">
              <button
                onClick={() =>
                  setOpenMenuId(
                    openMenuId === warehouse.id ? null : warehouse.id
                  )
                }
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical className="h-5 w-5" />
              </button>

              {openMenuId === warehouse.id && (
                <div className="absolute right-0 top-full mt-2 w-36 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  {canUpdate && (
                    <button
                      onClick={() => {
                        onViewStock(warehouse.id);
                        setOpenMenuId(null);
                      }}
                      className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={() => {
                        onDelete(warehouse.id);
                        setOpenMenuId(null);
                      }}
                      className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
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
    <p className="text-gray-500">{label}</p>
    <p className="font-medium">{value}</p>
  </div>
);

const WarehousesPage = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] =
    useState<WarehouseType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | undefined>(
    undefined
  );
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [viewingWarehouse, setViewingWarehouse] =
    useState<WarehouseType | null>(null);
  const [stockWarehouseId, setStockWarehouseId] = useState<string | null>(null);

  const canCreate = hasPermission("warehouses", "canCreate");
  const canUpdate = hasPermission("warehouses", "canUpdate");
  const canDelete = hasPermission("warehouses", "canDelete");

  const navigate = useNavigate();

  // Fetch warehouses
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


  // Create warehouse mutation
  const createMutation = useMutation({
    mutationFn: warehouseApi.createWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      setShowCreateModal(false);
      reset();
    },
  });

  // Update warehouse mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWarehouseData }) =>
      warehouseApi.updateWarehouse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      setEditingWarehouse(null);
      reset();
    },
  });

  // Delete warehouse mutation
  const deleteMutation = useMutation({
    mutationFn: warehouseApi.deleteWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateWarehouseFormData>({
    resolver: zodResolver(
      createWarehouseSchema
    ) as Resolver<CreateWarehouseFormData>,
  });

  const onSubmit = (data: CreateWarehouseFormData) => {
    if (editingWarehouse) {
      const updateData: UpdateWarehouseData = {
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
      };

      updateMutation.mutate({
        id: editingWarehouse.id,
        data: updateData,
      });
    } else {
      const createData = {
        ...data,
        code: data.code.toUpperCase(),
        country: data.country ?? "India",
        isDefaultPickup: data.isDefaultPickup ?? false,
        isActive: data.isActive ?? true,
      };

      createMutation.mutate(createData);
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
    if (
      window.confirm(
        "Are you sure you want to delete this warehouse? This action cannot be undone."
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  const handleViewStock = (id: string) => {
    setStockWarehouseId(id);
    navigate(`/admin/warehouses/${id}`);
  };

  // Calculate stats
  const totalWarehouses = warehousesData?.warehouses?.length || 0;
  const activeWarehouses =
    warehousesData?.warehouses?.filter((w) => w.isActive).length || 0;
  const inactiveWarehouses = totalWarehouses - activeWarehouses;

  // Filter warehouses
  const filteredWarehouses = warehousesData?.warehouses || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Warehouse className="h-7 w-7 text-blue-600" />
              Warehouses
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage warehouse locations and inventory
            </p>
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
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors whitespace-nowrap shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Warehouse</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={<Warehouse className="h-6 w-6" />}
            label="Total Warehouses"
            value={totalWarehouses}
            color="blue"
            subtitle="All locations"
          />
          <StatsCard
            icon={<CheckCircle className="h-6 w-6" />}
            label="Active"
            value={activeWarehouses}
            color="green"
            subtitle="Operational"
          />
          <StatsCard
            icon={<XCircle className="h-6 w-6" />}
            label="Inactive"
            value={inactiveWarehouses}
            color="orange"
            subtitle="Not operational"
          />
          <StatsCard
            icon={<TrendingUp className="h-6 w-6" />}
            label="Capacity"
            value="85%"
            color="purple"
            subtitle="Overall usage"
          />
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, code, or city..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
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
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>

              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1 ml-2">
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
              </div>
            </div>
          </div>
        </div>

        {/* Warehouses Display */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading warehouses...</p>
          </div>
        ) : filteredWarehouses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Warehouse className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">
              No warehouses found
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {searchQuery
                ? "Try adjusting your search or filters"
                : "Get started by adding your first warehouse"}
            </p>
            {canCreate && !searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first warehouse
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWarehouses.map((warehouse) => (
                  <WarehouseCard
                    key={warehouse.id}
                    warehouse={warehouse}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onViewStock={(id) =>
                      setViewingWarehouse(
                        filteredWarehouses.find((w) => w.id === id) || null
                      )
                    }
                    handleViewStock={handleViewStock}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                  />
                ))}
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
                          Warehouse
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                          Code
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
                      {filteredWarehouses.map((warehouse) => (
                        <tr key={warehouse.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                <Warehouse className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {warehouse.name}
                                </div>
                                <div className="text-sm text-gray-500 lg:hidden">
                                  {warehouse.code}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {warehouse.city}, {warehouse.state}
                            </div>
                            <div className="text-sm text-gray-500">
                              {warehouse.pincode}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 hidden lg:table-cell">
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                              {warehouse.code}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${
                                warehouse.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {warehouse.isActive ? (
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
                            <td className="px-6 py-4 text-right text-sm font-medium">
                              <button
                                onClick={() => handleViewStock(warehouse.id)}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                                View Details
                              </button>
                              {canUpdate && (
                                <button
                                  onClick={() => handleEdit(warehouse)}
                                  className="text-blue-600 hover:text-blue-900 mr-3"
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4 inline" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => handleDelete(warehouse.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete"
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
          </>
        )}

        {viewingWarehouse && (
          <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
            <div className="bg-white w-full max-w-md h-full shadow-xl overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">Warehouse Details</h3>
                <button onClick={() => setViewingWarehouse(null)}>
                  <X />
                </button>
              </div>

              <div className="p-6 space-y-4 text-sm">
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

                <div className="flex gap-2">
                  {viewingWarehouse.isActive && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      Active
                    </span>
                  )}
                  {viewingWarehouse.isDefaultPickup && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
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
                    className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg"
                  >
                    Edit Warehouse
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Warehouse className="h-5 w-5 text-blue-600" />
                  {editingWarehouse ? "Edit Warehouse" : "Add Warehouse"}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingWarehouse(null);
                    reset();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                {/* Error/Success Messages */}
                {(createMutation.isError || updateMutation.isError) && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {(createMutation.error as any)?.message ||
                      (updateMutation.error as any)?.message ||
                      "Failed to save warehouse"}
                  </div>
                )}

                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Warehouse Name *
                    </label>
                    <input
                      {...register("name")}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Main Warehouse"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Warehouse Code *
                    </label>
                    <input
                      {...register("code")}
                      type="text"
                      disabled={!!editingWarehouse}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono"
                      placeholder="WH-01"
                      maxLength={20}
                    />
                    {errors.code && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.code.message}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Unique code (uppercase, alphanumeric)
                    </p>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <textarea
                    {...register("address")}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123 Main Street, Building A"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.address.message}
                    </p>
                  )}
                </div>
                {/* Address Line 2 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2
                  </label>
                  <input
                    {...register("addressLine2")}
                    placeholder="Apartment, Floor (optional)"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  {errors.addressLine2 && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.addressLine2.message}
                    </p>
                  )}
                </div>
                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country *
                  </label>
                  <input
                    {...register("country")}
                    defaultValue="India"
                    disabled={true}
                    className="w-full px-3 py-2 border rounded-lg"
                  />

                  {errors.country && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.country.message}
                    </p>
                  )}
                </div>

                {/* Location Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      {...register("city")}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Mumbai"
                    />
                    {errors.city && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.city.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <input
                      {...register("state")}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Maharashtra"
                    />
                    {errors.state && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.state.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pincode *
                    </label>
                    <input
                      {...register("pincode")}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      placeholder="400001"
                      maxLength={6}
                    />
                    {errors.pincode && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.pincode.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Person *
                    </label>
                    <input
                      {...register("contactPerson")}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Contact Person Name"
                    />

                    {errors.contactPerson && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.contactPerson.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      {...register("phone")}
                      className="w-full px-3 py-2 border rounded-lg font-mono"
                      placeholder="9876543210"
                    />

                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      {...register("email")}
                      type="email"
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="email@example.com"
                    />

                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      {...register("isDefaultPickup")}
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Warehouse is active and operational and Default Pickup
                      Warehouse
                    </span>
                  </label>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingWarehouse(null);
                      reset();
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
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

        {/* Read-Only Notice */}
        {!canCreate && !canUpdate && !canDelete && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              You have read-only access to warehouses. Contact your
              administrator for additional permissions.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};
export default WarehousesPage;
