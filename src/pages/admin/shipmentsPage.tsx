import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { shipmentApi } from "../../lib/api/shipment.api";
import { orderApi } from "../../lib/api/order.api";
import {
  Truck,
  Search,
  Download,
  Eye,
  RefreshCw,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Printer,
  Calendar,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  PlayCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import type { Order } from "../../lib/types/order/order";
import { MainLayout } from "@/components/layouts/mainLayout";

const ShipmentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showCouriersModal, setShowCouriersModal] = useState(false);
  const [showShiprocketDetailsModal, setShowShiprocketDetailsModal] =
    useState(false);
  const [availableCouriers, setAvailableCouriers] = useState<any[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<number | null>(null);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [shiprocketDetails, setShiprocketDetails] = useState<any>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const limit = 10;

  // Fetch orders that need shipment processing
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-orders", { page: currentPage, limit }],
    queryFn: () =>
      orderApi.getAllOrders({
        page: currentPage,
        limit,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
  });

  // Create shipment mutation
  const createShipmentMutation = useMutation({
    mutationFn: (orderId: string) => shipmentApi.createShipment({ orderId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Shipment created successfully in Shiprocket");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create shipment");
    },
  });

  // Get available couriers mutation
  const getCouriersMutation = useMutation({
    mutationFn: (orderId: string) => shipmentApi.getAvailableCouriers(orderId),
    onSuccess: (data) => {
      setAvailableCouriers(
        data?.data?.couriers?.couriers?.available_courier_companies || [],
      );
      setShowCouriersModal(true);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to fetch couriers");
    },
  });

  // Assign courier mutation
  const assignCourierMutation = useMutation({
    mutationFn: ({
      orderId,
      courierId,
    }: {
      orderId: string;
      courierId: number;
    }) => shipmentApi.assignCourier({ orderId, courierId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("AWB generated successfully");
      setShowCouriersModal(false);
      setSelectedCourier(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to assign courier");
    },
  });

  // Schedule pickup mutation
  const schedulePickupMutation = useMutation({
    mutationFn: (orderId: string) => shipmentApi.schedulePickup(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Pickup scheduled successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to schedule pickup");
    },
  });

  // Generate label mutation
  const generateLabelMutation = useMutation({
    mutationFn: (orderId: string) => shipmentApi.generateLabel(orderId),
    onSuccess: (data) => {
      const labelUrl = data?.data?.label_url;
      if (labelUrl) {
        window.open(labelUrl, "_blank");
        toast.success("Label generated successfully");
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to generate label");
    },
  });

  // Generate manifest mutation
  const generateManifestMutation = useMutation({
    mutationFn: (orderId: string) => shipmentApi.generateManifest(orderId),
    onSuccess: (data) => {
      const manifestUrl = data?.data?.manifest_url;
      if (manifestUrl) {
        window.open(manifestUrl, "_blank");
        toast.success("Manifest generated successfully");
      }
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to generate manifest",
      );
    },
  });

  // Mark as delivered mutation
  const markDeliveredMutation = useMutation({
    mutationFn: (orderId: string) => shipmentApi.markAsDelivered(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order marked as delivered");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to mark as delivered",
      );
    },
  });

  // Track shipment mutation
  const trackShipmentMutation = useMutation({
    mutationFn: (orderId: string) => shipmentApi.trackShipment(orderId),
    onSuccess: (data) => {
      setTrackingData(data?.data);
      setShowTrackingModal(true);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to track shipment");
    },
  });

  // Get Shiprocket details mutation
  const getShiprocketDetailsMutation = useMutation({
    mutationFn: (orderId: string) =>
      shipmentApi.getShiprocketOrderDetails(orderId),
    onSuccess: (data) => {
      setShiprocketDetails(data?.data);
      setShowShiprocketDetailsModal(true);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to fetch Shiprocket details",
      );
    },
  });

  const orders = data?.data?.orders || [];
  const pagination = data?.data?.pagination;

  // Filter orders by search term
  const filteredOrders = orders.filter(
    (order) =>
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getShipmentStatusColor = (order: Order) => {
    if (!order.shipment) return "bg-gray-100 text-gray-800";
    if (order.shipment.deliveredAt) return "bg-green-100 text-green-800";
    if (order.shipment.shippedAt) return "bg-purple-100 text-purple-800";
    if (order.shipment.awbCode) return "bg-blue-100 text-blue-800";
    return "bg-yellow-100 text-yellow-800";
  };

  const getShipmentStatus = (order: Order) => {
    if (!order.shipment) return "Not Created";
    if (order.shipment.deliveredAt) return "Delivered";
    if (order.shipment.shippedAt) return "Shipped";
    if (order.shipment.awbCode) return "AWB Generated";
    return "Created";
  };

  const handleAssignCourier = () => {
    if (!selectedOrder || !selectedCourier) {
      toast.error("Please select a courier");
      return;
    }
    assignCourierMutation.mutate({
      orderId: selectedOrder.id,
      courierId: selectedCourier,
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load orders</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Shipments Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage shipments and Shiprocket integration
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pagination?.total || 0}
                </p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Shipment</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {orders.filter((o) => !o.shipment).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Transit</p>
                <p className="text-2xl font-bold text-purple-600">
                  {
                    orders.filter(
                      (o) => o.shipment?.shippedAt && !o.shipment?.deliveredAt,
                    ).length
                  }
                </p>
              </div>
              <Truck className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-green-600">
                  {orders.filter((o) => o.shipment?.deliveredAt).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
        {/* Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by order number or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Package className="w-16 h-16 text-gray-400 mb-4" />
                <p className="text-gray-600 text-lg">No orders found</p>
                <p className="text-gray-400 text-sm mt-2">
                  Try adjusting your search
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shipment Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tracking
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Courier
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => {
                    console.log("order", order);

                    return (
                      <React.Fragment key={order.id}>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {order.orderNumber}
                              </p>
                              <p className="text-xs text-gray-500">
                                {format(
                                  new Date(order.createdAt),
                                  "dd MMM yyyy",
                                )}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {order.user.firstName} {order.user.lastName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {order.user.email}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getShipmentStatusColor(
                                order,
                              )}`}
                            >
                              {getShipmentStatus(order)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {order.shipment?.awbCode ? (
                              <div>
                                <p className="text-sm font-mono text-gray-900">
                                  {order.shipment.awbCode}
                                </p>
                                <button
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    trackShipmentMutation.mutate(order.id);
                                  }}
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  Track
                                </button>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {order.shipment?.courierName ? (
                              <p className="text-sm text-gray-900">
                                {order.shipment.courierName}
                              </p>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() =>
                                setExpandedOrderId(
                                  expandedOrderId === order.id
                                    ? null
                                    : order.id,
                                )
                              }
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              {expandedOrderId === order.id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Actions Row */}
                        {expandedOrderId === order.id && (
                          <tr className="bg-gray-50">
                            <td colSpan={6} className="px-6 py-4">
                              <div className="space-y-4">
                                {/* Shipment Actions */}
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                    Shipment Actions
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {!order.shipment && (
                                      <button
                                        onClick={() => {
                                          setSelectedOrder(order);
                                          createShipmentMutation.mutate(
                                            order.id,
                                          );
                                        }}
                                        disabled={
                                          createShipmentMutation.isPending
                                        }
                                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                                      >
                                        <Package className="w-4 h-4" />
                                        Create Shipment
                                      </button>
                                    )}

                                    {order.shipment &&
                                      !order.shipment.awbCode && (
                                        <>
                                          <button
                                            onClick={() => {
                                              setSelectedOrder(order);
                                              getCouriersMutation.mutate(
                                                order.id,
                                              );
                                            }}
                                            disabled={
                                              getCouriersMutation.isPending
                                            }
                                            className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm disabled:opacity-50"
                                          >
                                            <Truck className="w-4 h-4" />
                                            Select Courier & Generate AWB
                                          </button>
                                        </>
                                      )}

                                    {order.shipment?.awbCode &&
                                      !order.shipment.shippedAt && (
                                        <button
                                          onClick={() =>
                                            schedulePickupMutation.mutate(
                                              order.id,
                                            )
                                          }
                                          disabled={
                                            schedulePickupMutation.isPending
                                          }
                                          className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50"
                                        >
                                          <PlayCircle className="w-4 h-4" />
                                          Schedule Pickup
                                        </button>
                                      )}

                                    {order.shipment?.awbCode && (
                                      <>
                                        <button
                                          onClick={() =>
                                            generateLabelMutation.mutate(
                                              order.id,
                                            )
                                          }
                                          disabled={
                                            generateLabelMutation.isPending
                                          }
                                          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                                        >
                                          <Printer className="w-4 h-4" />
                                          Print Label
                                        </button>

                                        <button
                                          onClick={() =>
                                            generateManifestMutation.mutate(
                                              order.id,
                                            )
                                          }
                                          disabled={
                                            generateManifestMutation.isPending
                                          }
                                          className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm disabled:opacity-50"
                                        >
                                          <FileText className="w-4 h-4" />
                                          Print Manifest
                                        </button>
                                      </>
                                    )}

                                    {order.shipment?.shippedAt &&
                                      !order.shipment.deliveredAt && (
                                        <button
                                          onClick={() =>
                                            markDeliveredMutation.mutate(
                                              order.id,
                                            )
                                          }
                                          disabled={
                                            markDeliveredMutation.isPending
                                          }
                                          className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm disabled:opacity-50"
                                        >
                                          <CheckCircle className="w-4 h-4" />
                                          Mark as Delivered
                                        </button>
                                      )}

                                    {order.shipment && (
                                      <button
                                        onClick={() => {
                                          setSelectedOrder(order);
                                          const shiprocketOrderId =
                                            order?.shipment?.shiprocketOrderId;
                                          if (!shiprocketOrderId) return;
                                          getShiprocketDetailsMutation.mutate(
                                            shiprocketOrderId,
                                          );
                                        }}
                                        disabled={
                                          getShiprocketDetailsMutation.isPending
                                        }
                                        className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm disabled:opacity-50"
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                        Shiprocket Details
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Shipment Info */}
                                {order.shipment && (
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white p-3 rounded border border-gray-200">
                                      <p className="text-xs text-gray-600 mb-1">
                                        Shiprocket Order ID
                                      </p>
                                      <p className="text-sm font-mono text-gray-900">
                                        {order.shipment.shiprocketOrderId ||
                                          "-"}
                                      </p>
                                    </div>
                                    <div className="bg-white p-3 rounded border border-gray-200">
                                      <p className="text-xs text-gray-600 mb-1">
                                        AWB Code
                                      </p>
                                      <p className="text-sm font-mono text-gray-900">
                                        {order.shipment.awbCode || "-"}
                                      </p>
                                    </div>
                                    <div className="bg-white p-3 rounded border border-gray-200">
                                      <p className="text-xs text-gray-600 mb-1">
                                        Courier
                                      </p>
                                      <p className="text-sm font-medium text-gray-900">
                                        {order.shipment.courierName || "-"}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* Shipping Address */}
                                <div className="bg-white p-4 rounded border border-gray-200">
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    Shipping Address
                                  </h4>
                                  <div className="text-sm text-gray-600">
                                    <p className="font-medium text-gray-900">
                                      {order.shippingAddress.fullName}
                                    </p>
                                    <p>{order.shippingAddress.addressLine1}</p>
                                    {order.shippingAddress.addressLine2 && (
                                      <p>
                                        {order.shippingAddress.addressLine2}
                                      </p>
                                    )}
                                    <p>
                                      {order.shippingAddress.city},{" "}
                                      {order.shippingAddress.state} -{" "}
                                      {order.shippingAddress.pincode}
                                    </p>
                                    <p className="mt-1">
                                      Phone: {order.shippingAddress.phone}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {(currentPage - 1) * limit + 1} to{" "}
                {Math.min(currentPage * limit, pagination.total)} of{" "}
                {pagination.total} results
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-4 py-1 border border-gray-300 rounded-lg bg-gray-50">
                  {currentPage} / {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(pagination.totalPages, p + 1),
                    )
                  }
                  disabled={currentPage === pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Select Courier Modal */}
        {showCouriersModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Select Courier & Generate AWB
                </h2>
                <button
                  onClick={() => {
                    setShowCouriersModal(false);
                    setSelectedCourier(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    Order: {selectedOrder.orderNumber} | Total: ₹
                    {selectedOrder.total.toFixed(2)}
                  </p>
                </div>

                {availableCouriers.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No couriers available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableCouriers.map((courier: any) => (
                      <div
                        key={courier.courier_company_id}
                        onClick={() =>
                          setSelectedCourier(courier.courier_company_id)
                        }
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedCourier === courier.courier_company_id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  selectedCourier === courier.courier_company_id
                                    ? "border-blue-500 bg-blue-500"
                                    : "border-gray-300"
                                }`}
                              >
                                {selectedCourier ===
                                  courier.courier_company_id && (
                                  <CheckCircle className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {courier.courier_name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Delivery: {courier.estimated_delivery_days}{" "}
                                  days
                                  {courier.is_surface && " (Surface)"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              ₹{courier.freight_charge}
                            </p>
                            {courier.rating && (
                              <p className="text-sm text-yellow-600">
                                ★ {courier.rating}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowCouriersModal(false);
                    setSelectedCourier(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignCourier}
                  disabled={!selectedCourier || assignCourierMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {assignCourierMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating AWB...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Generate AWB
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Tracking Modal */}
        {showTrackingModal && trackingData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Shipment Tracking
                </h2>
                <button
                  onClick={() => setShowTrackingModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {trackingData.tracking_data?.shipment_track?.[0] && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">AWB Code</p>
                        <p className="text-sm font-mono font-medium">
                          {
                            trackingData.tracking_data.shipment_track[0]
                              .awb_code
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Current Status</p>
                        <p className="text-sm font-medium">
                          {
                            trackingData.tracking_data.shipment_track[0]
                              .current_status
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Destination</p>
                        <p className="text-sm font-medium">
                          {
                            trackingData.tracking_data.shipment_track[0]
                              .destination
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Origin</p>
                        <p className="text-sm font-medium">
                          {trackingData.tracking_data.shipment_track[0].origin}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Tracking History
                  </h3>
                  <div className="space-y-4">
                    {trackingData.tracking_data?.shipment_track_activities?.map(
                      (activity: any, index: number) => (
                        <div key={index} className="flex gap-4 relative">
                          {index !==
                            trackingData.tracking_data.shipment_track_activities
                              .length -
                              1 && (
                            <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-gray-200" />
                          )}
                          <div className="relative">
                            <div className="w-4 h-4 rounded-full bg-blue-600 mt-1" />
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {activity.sr_status_label}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {activity.activity}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {activity.location}
                                </p>
                              </div>
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(
                                  new Date(activity.date),
                                  "dd MMM yyyy HH:mm",
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shiprocket Details Modal - Beautiful Interactive UI */}
        {showShiprocketDetailsModal && shiprocketDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Shiprocket Order Details
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Order #{shiprocketDetails.data?.channel_order_id}
                  </p>
                </div>
                <button
                  onClick={() => setShowShiprocketDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Status Banner */}
                <div
                  className={`p-4 rounded-lg border-2 ${
                    shiprocketDetails.data?.status === "DELIVERED"
                      ? "bg-green-50 border-green-500"
                      : shiprocketDetails.data?.status === "SHIPPED"
                        ? "bg-blue-50 border-blue-500"
                        : shiprocketDetails.data?.status === "CANCELED"
                          ? "bg-red-50 border-red-500"
                          : "bg-yellow-50 border-yellow-500"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Order Status
                      </p>
                      <p className="text-2xl font-bold">
                        {shiprocketDetails.data?.status || "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Payment Method</p>
                      <p className="text-lg font-semibold capitalize">
                        {shiprocketDetails.data?.payment_method || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">
                        {shiprocketDetails.data?.customer_name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">
                        {shiprocketDetails.data?.customer_email || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">
                        {shiprocketDetails.data?.customer_phone || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">City</p>
                      <p className="font-medium">
                        {shiprocketDetails.data?.customer_city || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">Shipping Address</p>
                    <p className="font-medium">
                      {shiprocketDetails.data?.customer_address || "N/A"}
                      {shiprocketDetails.data?.customer_address_2 &&
                        `, ${shiprocketDetails.data.customer_address_2}`}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {shiprocketDetails.data?.customer_city},{" "}
                      {shiprocketDetails.data?.customer_state} -{" "}
                      {shiprocketDetails.data?.customer_pincode}
                    </p>
                  </div>
                </div>

                {/* Shipment Details */}
                {shiprocketDetails.data?.shipments && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Truck className="w-5 h-5" />
                      Shipment Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">AWB Number</p>
                        <p className="font-mono font-bold text-lg">
                          {shiprocketDetails.data.shipments.awb ||
                            "Not Generated"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Courier</p>
                        <p className="font-medium">
                          {shiprocketDetails.data.shipments.courier ||
                            "Not Assigned"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Weight</p>
                        <p className="font-medium">
                          {shiprocketDetails.data.shipments.weight || "0"} kg
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Dimensions</p>
                        <p className="font-medium">
                          {shiprocketDetails.data.shipments.dimensions || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <p className="font-semibold">
                          {shiprocketDetails.data.shipments.status || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">ETD</p>
                        <p className="font-medium">
                          {shiprocketDetails.data.shipments.etd || "N/A"}
                        </p>
                      </div>
                    </div>
                    {shiprocketDetails.data.shipments.awb_assign_date && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <p className="text-sm text-gray-600">
                          AWB Assigned Date
                        </p>
                        <p className="font-medium">
                          {shiprocketDetails.data.shipments.awb_assign_date}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Order Items */}
                {shiprocketDetails.data?.products &&
                  shiprocketDetails.data.products.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Order Items
                      </h3>
                      <div className="space-y-3">
                        {shiprocketDetails.data.products.map((product: any) => (
                          <div
                            key={product.id}
                            className="bg-white border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">
                                  {product.name}
                                </p>
                                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-gray-600">SKU: </span>
                                    <span className="font-mono">
                                      {product.sku}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">
                                      Quantity:{" "}
                                    </span>
                                    <span className="font-semibold">
                                      {product.quantity}
                                    </span>
                                  </div>
                                  {product.hsn && (
                                    <div>
                                      <span className="text-gray-600">
                                        HSN:{" "}
                                      </span>
                                      <span>{product.hsn}</span>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-gray-600">
                                      Weight:{" "}
                                    </span>
                                    <span>{product.weight || 0} kg</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <p className="text-sm text-gray-600">Price</p>
                                <p className="text-lg font-bold">
                                  ₹{product.price?.toFixed(2) || "0.00"}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Pickup Location */}
                {shiprocketDetails.data?.pickup_address && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Pickup Location
                    </h3>
                    <div>
                      <p className="font-semibold">
                        {shiprocketDetails.data.pickup_address.name}
                      </p>
                      <p className="text-sm mt-1">
                        {shiprocketDetails.data.pickup_address.address}
                        {shiprocketDetails.data.pickup_address.address_2 &&
                          `, ${shiprocketDetails.data.pickup_address.address_2}`}
                      </p>
                      <p className="text-sm">
                        {shiprocketDetails.data.pickup_address.city},{" "}
                        {shiprocketDetails.data.pickup_address.state} -{" "}
                        {shiprocketDetails.data.pickup_address.pin_code}
                      </p>
                      <p className="text-sm mt-2">
                        <span className="text-gray-600">Phone: </span>
                        {shiprocketDetails.data.pickup_address.phone}
                      </p>
                      <p className="text-sm">
                        <span className="text-gray-600">Email: </span>
                        {shiprocketDetails.data.pickup_address.email}
                      </p>
                    </div>
                  </div>
                )}

                {/* Order Financials */}
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Order Summary
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">
                        ₹{shiprocketDetails.data?.total?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                    {shiprocketDetails.data?.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>
                          -₹{shiprocketDetails.data.discount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {shiprocketDetails.data?.tax > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax</span>
                        <span className="font-medium">
                          ₹{shiprocketDetails.data.tax.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-purple-300 flex justify-between">
                      <span className="font-semibold text-lg">Total</span>
                      <span className="font-bold text-lg text-purple-900">
                        ₹
                        {Number(shiprocketDetails.data?.net_total ?? 0).toFixed(2) ||
                          shiprocketDetails.data?.total?.toFixed(2) ||
                          "0.00"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Important Dates */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Order Date</p>
                    <p className="font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {shiprocketDetails.data?.order_date || "N/A"}
                    </p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Created At</p>
                    <p className="font-semibold flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {shiprocketDetails.data?.created_at || "N/A"}
                    </p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                    <p className="font-semibold flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      {shiprocketDetails.data?.updated_at || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Risk Assessment */}
                {shiprocketDetails.data?.extra_info && (
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Risk Assessment
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">RTO Risk</p>
                        <p
                          className={`font-semibold uppercase ${
                            shiprocketDetails.data.extra_info.rto_risk === "low"
                              ? "text-green-600"
                              : shiprocketDetails.data.extra_info.rto_risk ===
                                  "high"
                                ? "text-red-600"
                                : "text-yellow-600"
                          }`}
                        >
                          {shiprocketDetails.data.extra_info.rto_risk || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Address Risk</p>
                        <p
                          className={`font-semibold uppercase ${
                            shiprocketDetails.data.extra_info.address_risk ===
                            "low"
                              ? "text-green-600"
                              : shiprocketDetails.data.extra_info
                                    .address_risk === "high"
                                ? "text-red-600"
                                : "text-yellow-600"
                          }`}
                        >
                          {shiprocketDetails.data.extra_info.address_risk ||
                            "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Order Risk</p>
                        <p
                          className={`font-semibold uppercase ${
                            shiprocketDetails.data.extra_info.order_risk ===
                            "low"
                              ? "text-green-600"
                              : shiprocketDetails.data.extra_info.order_risk ===
                                  "high"
                                ? "text-red-600"
                                : "text-yellow-600"
                          }`}
                        >
                          {shiprocketDetails.data.extra_info.order_risk ||
                            "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ShipmentsPage;
