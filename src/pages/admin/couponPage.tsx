import React, { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layouts/mainLayout";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Ticket,
  Plus,
  Edit,
  Trash2,
  X,
  Search,
  Copy,
  Check,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Percent,
  Tag,
  AlertCircle,
  Save,
  Info,
} from "lucide-react";
import { couponApi } from "@/lib/api/coupon.api";
import type { Coupon } from "@/lib/types/coupon/coupon";
import {
  createCouponSchema,
  updateCouponSchema,
  type CreateCouponFormData,
  type UpdateCouponFormData,
} from "@/lib/types/coupon/schema";

// Stats Card
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

// Coupon Card
const CouponCard: React.FC<{
  coupon: Coupon;
  onEdit: (coupon: Coupon) => void;
  onDelete: (id: string) => void;
  canUpdate: boolean;
  canDelete: boolean;
}> = ({ coupon, onEdit, onDelete, canUpdate, canDelete }) => {
  const [copied, setCopied] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isExpired = new Date(coupon.validUntil) < new Date();
  const isUpcoming = new Date(coupon.validFrom) > new Date();
  const usagePercentage = coupon.maxUsage
    ? (coupon.usageCount / coupon.maxUsage) * 100
    : 0;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 ${
        !coupon.isActive
          ? "border-gray-300 opacity-60"
          : isExpired
          ? "border-red-300"
          : isUpcoming
          ? "border-yellow-300"
          : "border-green-300"
      }`}
    >
      <div
        className={`p-4 ${
          !coupon.isActive
            ? "bg-gray-100"
            : isExpired
            ? "bg-red-50"
            : isUpcoming
            ? "bg-yellow-50"
            : "bg-green-50"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Ticket
              className={`h-5 w-5 ${
                !coupon.isActive
                  ? "text-gray-600"
                  : isExpired
                  ? "text-red-600"
                  : isUpcoming
                  ? "text-yellow-600"
                  : "text-green-600"
              }`}
            />
            <span
              className={`px-2 py-1 rounded text-xs font-semibold ${
                !coupon.isActive
                  ? "bg-gray-200 text-gray-700"
                  : isExpired
                  ? "bg-red-200 text-red-700"
                  : isUpcoming
                  ? "bg-yellow-200 text-yellow-700"
                  : "bg-green-200 text-green-700"
              }`}
            >
              {!coupon.isActive
                ? "Inactive"
                : isExpired
                ? "Expired"
                : isUpcoming
                ? "Upcoming"
                : "Active"}
            </span>
          </div>
          {coupon.discountType === "PERCENTAGE" ? (
            <div className="flex items-center gap-1 text-purple-600">
              <Percent className="h-4 w-4" />
              <span className="text-lg font-bold">{coupon.discountValue}%</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-green-600">
              <DollarSign className="h-4 w-4" />
              <span className="text-lg font-bold">₹{coupon.discountValue}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border-2 border-dashed border-gray-300">
          <Tag className="h-4 w-4 text-gray-600" />
          <span className="font-mono font-bold text-lg text-gray-900 flex-1">
            {coupon.code}
          </span>
          <button
            onClick={copyToClipboard}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {coupon.description && (
          <p className="text-sm text-gray-600">{coupon.description}</p>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Min. Order:</span>
            <span className="font-semibold text-gray-900">
              ₹{coupon.minOrderValue}
            </span>
          </div>
          {coupon.maxUsage && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Usage:</span>
                <span className="font-semibold text-gray-900">
                  {coupon.usageCount}/{coupon.maxUsage}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    usagePercentage >= 90
                      ? "bg-red-600"
                      : usagePercentage >= 70
                      ? "bg-yellow-600"
                      : "bg-green-600"
                  }`}
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
            </div>
          )}
          {coupon.perUserLimit && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Per User:</span>
              <span className="font-semibold text-gray-900">
                {coupon.perUserLimit}
              </span>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-gray-200 space-y-1 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>
              {formatDate(coupon.validFrom)} - {formatDate(coupon.validUntil)}
            </span>
          </div>
        </div>

        {(canUpdate || canDelete) && (
          <div className="flex gap-2 pt-3 border-t border-gray-200">
            {canUpdate && (
              <button
                onClick={() => onEdit(coupon)}
                className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(coupon.id)}
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

// Main Component
export const CouponsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const canCreate = hasPermission("coupons", "canCreate");
  const canUpdate = hasPermission("coupons", "canUpdate");
  const canDelete = hasPermission("coupons", "canDelete");

  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | undefined>(
    undefined
  );

  const { data: couponsData, isLoading } = useQuery({
    queryKey: ["admin-coupons", filterActive],
    queryFn: async () => {
      const response = await couponApi.getCoupons({
        limit: 50,
        isActive: filterActive,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: couponApi.createCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      setShowModal(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCouponFormData }) =>
      couponApi.updateCoupon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      setEditingCoupon(null);
      setShowModal(false);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: couponApi.deleteCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateCouponFormData>({
    resolver: zodResolver(
      editingCoupon ? updateCouponSchema : createCouponSchema
    ) as Resolver<CreateCouponFormData>,
  });

  const discountType = watch("discountType");

  const onSubmit = (data: CreateCouponFormData | UpdateCouponFormData) => {
    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon.id, data });
    } else {
      createMutation.mutate(data as CreateCouponFormData);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    reset({
      code: coupon.code,
      description: coupon.description || "",
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue,
      maxUsage: coupon.maxUsage || ("" as any),
      perUserLimit: coupon.perUserLimit || ("" as any),
      validFrom: new Date(coupon.validFrom).toISOString().split("T")[0],
      validUntil: new Date(coupon.validUntil).toISOString().split("T")[0],
      isActive: coupon.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Delete this coupon?")) {
      deleteMutation.mutate(id);
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const totalCoupons = couponsData?.coupons.length || 0;
  const activeCoupons =
    couponsData?.coupons.filter((c) => c.isActive).length || 0;
  const expiredCoupons =
    couponsData?.coupons.filter((c) => new Date(c.validUntil) < new Date())
      .length || 0;
  const totalUsage =
    couponsData?.coupons.reduce((sum, c) => sum + c.usageCount, 0) || 0;

  const filteredCoupons =
    couponsData?.coupons.filter((coupon) =>
      coupon.code.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <Ticket className="h-7 w-7 text-white" />
              </div>
              Coupons
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              Manage discount codes and offers
            </p>
          </div>

          {canCreate && (
            <button
              onClick={() => {
                setEditingCoupon(null);
                reset({
                  code: "",
                  description: "",
                  discountType: "PERCENTAGE",
                  discountValue: 0,
                  minOrderValue: 0,
                  validFrom: today,
                  validUntil: "",
                  isActive: true,
                } as any);
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl font-medium"
            >
              <Plus className="h-4 w-4" />
              Create Coupon
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={<Ticket className="h-6 w-6" />}
            label="Total"
            value={totalCoupons}
            color="purple"
          />
          <StatsCard
            icon={<TrendingUp className="h-6 w-6" />}
            label="Active"
            value={activeCoupons}
            color="green"
          />
          <StatsCard
            icon={<AlertCircle className="h-6 w-6" />}
            label="Expired"
            value={expiredCoupons}
            color="orange"
          />
          <StatsCard
            icon={<Users className="h-6 w-6" />}
            label="Usage"
            value={totalUsage}
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
                placeholder="Search by code..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <select
              value={
                filterActive === undefined
                  ? "all"
                  : filterActive
                  ? "active"
                  : "inactive"
              }
              onChange={(e) =>
                setFilterActive(
                  e.target.value === "all"
                    ? undefined
                    : e.target.value === "active"
                )
              }
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Coupons Grid */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
            <p className="mt-4 text-gray-500">Loading...</p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 text-lg font-semibold">
              No coupons found
            </p>
            {canCreate && !searchQuery && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 px-6 py-2 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium"
              >
                Create First Coupon
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCoupons.map((coupon) => (
              <CouponCard
                key={coupon.id}
                coupon={coupon}
                onEdit={handleEdit}
                onDelete={handleDelete}
                canUpdate={canUpdate}
                canDelete={canDelete}
              />
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-8">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
                <h3 className="text-lg font-bold">
                  {editingCoupon ? "Edit Coupon" : "Create Coupon"}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingCoupon(null);
                    reset();
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-y-auto h-[70vh]">
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="p-6 space-y-4"
                >
                  {/* Code */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Code *
                    </label>
                    <input
                      {...register("code")}
                      type="text"
                      disabled={!!editingCoupon}
                      placeholder="SAVE20"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase disabled:bg-gray-100"
                    />
                    {errors.code && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.code.message}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      {...register("description")}
                      rows={2}
                      placeholder="Get 20% off on orders above ₹1000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Discount Type & Value */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Type *
                      </label>
                      <select
                        {...register("discountType")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                      >
                        <option value="PERCENTAGE">Percentage</option>
                        <option value="FIXED">Fixed Amount</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Value *
                      </label>
                      <div className="relative">
                        {discountType === "PERCENTAGE" ? (
                          <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        ) : (
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        )}
                        <input
                          {...register("discountValue")}
                          type="number"
                          step="0.01"
                          placeholder="20"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      {errors.discountValue && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.discountValue.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Min Order Value */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Minimum Order Value
                    </label>
                    <input
                      {...register("minOrderValue")}
                      type="number"
                      step="0.01"
                      placeholder="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Usage Limits */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Max Usage (Optional)
                      </label>
                      <input
                        {...register("maxUsage")}
                        type="number"
                        placeholder="Unlimited"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Per User (Optional)
                      </label>
                      <input
                        {...register("perUserLimit")}
                        type="number"
                        placeholder="1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  {/* Validity */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Valid From *
                      </label>
                      <input
                        {...register("validFrom")}
                        type="date"
                        min={today}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      {errors.validFrom && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.validFrom.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Valid Until *
                      </label>
                      <input
                        {...register("validUntil")}
                        type="date"
                        min={today}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      {errors.validUntil && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.validUntil.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Active Toggle */}
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      {...register("isActive")}
                      type="checkbox"
                      className="h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <div>
                      <span className="text-sm font-semibold text-gray-900">
                        Active
                      </span>
                      <p className="text-xs text-gray-500">
                        Coupon can be used
                      </p>
                    </div>
                  </label>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingCoupon(null);
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
                      className="px-4 py-2 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                    >
                      {createMutation.isPending || updateMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          {editingCoupon ? "Update" : "Create"}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};
