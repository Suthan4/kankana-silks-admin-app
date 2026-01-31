import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { shipmentApi } from "../../lib/api/shipment.api";
import { orderApi } from "../../lib/api/order.api";
import {
  Truck,
  Search,
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
  Zap,
  AlertTriangle,
  Info,
  Ban,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import type { Order } from "../../lib/types/order/order";
import { MainLayout } from "@/components/layouts/mainLayout";
import TrackingModal from "@/components/trackingModal";

const ShipmentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showShiprocketDetailsModal, setShowShiprocketDetailsModal] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [shiprocketDetails, setShiprocketDetails] = useState<any>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const limit = 10;

  // Fetch orders
  const { data, isLoading, error, refetch ,isFetching} = useQuery({
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
      toast.success("✅ Shipment created successfully in Shiprocket");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create shipment");
    },
  });

  // Generate AWB mutation
  const generateAwbMutation = useMutation({
    mutationFn: ({ orderId, courierId }: { orderId: string; courierId: number }) =>
      shipmentApi.generateAwb({ orderId, courierId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("✅ AWB generated successfully! You can now download label/manifest or schedule pickup.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to generate AWB");
    },
  });

  // Schedule pickup mutation
  const schedulePickupMutation = useMutation({
    mutationFn: (orderId: string) => shipmentApi.schedulePickup(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("✅ Pickup scheduled successfully!");
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
        toast.success("✅ Label downloaded successfully!");
      } else {
        toast.error("Label URL not found in response");
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
        toast.success("✅ Manifest downloaded successfully!");
      } else {
        toast.error("Manifest URL not found in response");
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to generate manifest");
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
      toast.error(error.response?.data?.message || "Failed to mark as delivered");
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
    mutationFn: (orderId: string) => shipmentApi.getShiprocketOrderDetails(orderId),
    onSuccess: (data) => {
      setShiprocketDetails(data?.data);
      setShowShiprocketDetailsModal(true);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to fetch Shiprocket details");
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

  // ✅ NEW: Check if order can be processed for shipment
  const canProcessShipment = (order: Order): boolean => {
    const inactiveStatuses = ["CANCELLED", "REFUNDED", "FAILED", "RETURNED"];
    return !inactiveStatuses.includes(order.status);
  };

  // ✅ NEW: Get reason why order cannot be processed
  const getInactiveReason = (order: Order): string => {
    switch (order.status) {
      case "CANCELLED":
        return "Order has been cancelled";
      case "REFUNDED":
        return "Order has been refunded";
      case "FAILED":
        return "Order payment failed";
      case "RETURNED":
        return "Order has been returned";
      default:
        return "Order cannot be processed";
    }
  };

  // Helper functions
  const hasAwb = (order: Order) => order.shipment?.awbCode ? true : false;
  const hasPickup = (order: Order) => order.shipment?.shippedAt ? true : false;
  const isDelivered = (order: Order) => order.shipment?.deliveredAt ? true : false;

  // Get selected courier from shippingInfo
  const getSelectedCourier = (order: Order) => {
    return {
      courierId: order.shippingInfo?.selectedCourierCompanyId,
      courierName: order.shippingInfo?.selectedCourierName,
      courierCharge: order.shippingInfo?.selectedCourierCharge,
    };
  };

  // Generate AWB using customer's selected courier
  const handleGenerateAwb = (order: Order) => {
    if (!canProcessShipment(order)) {
      toast.error(`❌ ${getInactiveReason(order)}`);
      return;
    }

    const courier = getSelectedCourier(order);
    
    if (!courier.courierId) {
      toast.error("⚠️ No courier selected by customer. This shouldn't happen!");
      return;
    }

    const shiprocketShipmentId = order.shipment?.shiprocketShipmentId;
    if (!shiprocketShipmentId) {
      toast.error("⚠️ Shiprocket Order ID not found!");
      return;
    }

    generateAwbMutation.mutate({
      orderId: order.id,
      courierId: courier.courierId,
    });
  };

  // Handle Schedule Pickup with validation
  const handleSchedulePickup = (order: Order) => {
    if (!canProcessShipment(order)) {
      toast.error(`❌ ${getInactiveReason(order)}`);
      return;
    }

    if (!hasAwb(order)) {
      toast.error("⚠️ Please generate AWB first before scheduling pickup!");
      return;
    }
    schedulePickupMutation.mutate(order.id);
  };

  // Handle Generate Label with validation
  const handleGenerateLabel = (order: Order) => {
    if (!hasAwb(order)) {
      toast.error("⚠️ Please generate AWB first before downloading label!");
      return;
    }
    generateLabelMutation.mutate(order.id);
  };

  // Handle Generate Manifest with validation
  const handleGenerateManifest = (order: Order) => {
    if (!hasAwb(order)) {
      toast.error("⚠️ Please generate AWB first before downloading manifest!");
      return;
    }
    generateManifestMutation.mutate(order.id);
  };

  // Handle Create Shipment with validation
  const handleCreateShipment = (order: Order) => {
    if (!canProcessShipment(order)) {
      toast.error(`❌ ${getInactiveReason(order)}`);
      return;
    }
    createShipmentMutation.mutate(order.id);
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
              <RefreshCw
                className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
              />
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
                  {
                    orders.filter((o) => !o.shipment && canProcessShipment(o))
                      .length
                  }
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
                      Order Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shipment Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tracking
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => {
                    const selectedCourier = getSelectedCourier(order);
                    const isActive = canProcessShipment(order);

                    return (
                      <React.Fragment key={order.id}>
                        <tr
                          className={`hover:bg-gray-50 transition-colors ${!isActive ? "bg-gray-50" : ""}`}
                        >
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
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                !isActive
                                  ? "bg-red-100 text-red-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {!isActive && <Ban className="w-3 h-3" />}
                              {order.status}
                            </span>
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
                                {/* ✅ Show inactive order warning */}
                                {!isActive && (
                                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                                    <Ban className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                      <p className="text-sm font-semibold text-red-900">
                                        Order Cannot Be Processed
                                      </p>
                                      <p className="text-xs text-red-800 mt-1">
                                        {getInactiveReason(order)}. Shipment
                                        actions are disabled for this order.
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* Only show workflow and actions if order is active */}
                                {isActive && (
                                  <>
                                    {/* Workflow Progress Indicator */}
                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                      <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                        Shipment Workflow
                                      </h4>
                                      <div className="flex items-center gap-2">
                                        {/* Step 1: Create Shipment */}
                                        <div className="flex items-center gap-2">
                                          <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                              order.shipment
                                                ? "bg-green-500 text-white"
                                                : "bg-gray-300 text-gray-600"
                                            }`}
                                          >
                                            {order.shipment ? (
                                              <CheckCircle className="w-5 h-5" />
                                            ) : (
                                              "1"
                                            )}
                                          </div>
                                          <span className="text-xs font-medium">
                                            Create
                                          </span>
                                        </div>

                                        <div className="flex-1 h-1 bg-gray-300">
                                          <div
                                            className={`h-full ${order.shipment ? "bg-green-500" : "bg-gray-300"}`}
                                          />
                                        </div>

                                        {/* Step 2: Generate AWB */}
                                        <div className="flex items-center gap-2">
                                          <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                              hasAwb(order)
                                                ? "bg-green-500 text-white"
                                                : "bg-gray-300 text-gray-600"
                                            }`}
                                          >
                                            {hasAwb(order) ? (
                                              <CheckCircle className="w-5 h-5" />
                                            ) : (
                                              "2"
                                            )}
                                          </div>
                                          <span className="text-xs font-medium">
                                            AWB
                                          </span>
                                        </div>

                                        <div className="flex-1 h-1 bg-gray-300">
                                          <div
                                            className={`h-full ${hasAwb(order) ? "bg-green-500" : "bg-gray-300"}`}
                                          />
                                        </div>

                                        {/* Step 3: Schedule Pickup */}
                                        <div className="flex items-center gap-2">
                                          <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                              hasPickup(order)
                                                ? "bg-green-500 text-white"
                                                : "bg-gray-300 text-gray-600"
                                            }`}
                                          >
                                            {hasPickup(order) ? (
                                              <CheckCircle className="w-5 h-5" />
                                            ) : (
                                              "3"
                                            )}
                                          </div>
                                          <span className="text-xs font-medium">
                                            Pickup
                                          </span>
                                        </div>

                                        <div className="flex-1 h-1 bg-gray-300">
                                          <div
                                            className={`h-full ${hasPickup(order) ? "bg-green-500" : "bg-gray-300"}`}
                                          />
                                        </div>

                                        {/* Step 4: Delivered */}
                                        <div className="flex items-center gap-2">
                                          <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                              isDelivered(order)
                                                ? "bg-green-500 text-white"
                                                : "bg-gray-300 text-gray-600"
                                            }`}
                                          >
                                            {isDelivered(order) ? (
                                              <CheckCircle className="w-5 h-5" />
                                            ) : (
                                              "4"
                                            )}
                                          </div>
                                          <span className="text-xs font-medium">
                                            Delivered
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Customer's Selected Courier Info */}
                                    {selectedCourier.courierName &&
                                      !order.shipment && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                                          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                          <div>
                                            <p className="text-sm font-semibold text-blue-900">
                                              Customer Selected Courier
                                            </p>
                                            <p className="text-xs text-blue-800 mt-1">
                                              <strong>
                                                {selectedCourier.courierName}
                                              </strong>{" "}
                                              (₹
                                              {selectedCourier.courierCharge}) -
                                              This courier will be used
                                              automatically when you generate
                                              AWB.
                                            </p>
                                          </div>
                                        </div>
                                      )}

                                    {/* Shipment Actions */}
                                    <div>
                                      <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                        Available Actions
                                      </h4>
                                      <div className="flex flex-wrap gap-2">
                                        {/* Step 1: Create Shipment */}
                                        {!order.shipment && (
                                          <button
                                            onClick={() =>
                                              handleCreateShipment(order)
                                            }
                                            disabled={
                                              createShipmentMutation.isPending
                                            }
                                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                                          >
                                            <Package className="w-4 h-4" />
                                            1. Create Shipment
                                          </button>
                                        )}

                                        {/* Step 2: Generate AWB */}
                                        {order.shipment &&
                                          !hasAwb(order) &&
                                          !isDelivered(order) && (
                                            <button
                                              onClick={() =>
                                                handleGenerateAwb(order)
                                              }
                                              disabled={
                                                generateAwbMutation.isPending
                                              }
                                              className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm disabled:opacity-50"
                                            >
                                              <Zap className="w-4 h-4" />
                                              {generateAwbMutation.isPending
                                                ? "Generating AWB..."
                                                : `2. Generate AWB (${selectedCourier.courierName})`}
                                            </button>
                                          )}

                                        {/* AWB Generated Actions - Only show if not delivered */}
                                        {hasAwb(order) &&
                                          !isDelivered(order) && (
                                            <>
                                              {/* Print Label */}
                                              <button
                                                onClick={() =>
                                                  handleGenerateLabel(order)
                                                }
                                                disabled={
                                                  generateLabelMutation.isPending
                                                }
                                                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                                              >
                                                <Printer className="w-4 h-4" />
                                                Download Label
                                              </button>

                                              {/* Print Manifest */}
                                              <button
                                                onClick={() =>
                                                  handleGenerateManifest(order)
                                                }
                                                disabled={
                                                  generateManifestMutation.isPending
                                                }
                                                className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm disabled:opacity-50"
                                              >
                                                <FileText className="w-4 h-4" />
                                                Download Manifest
                                              </button>

                                              {/* Step 3: Schedule Pickup - Only if not picked up yet */}
                                              {!hasPickup(order) && (
                                                <button
                                                  onClick={() =>
                                                    handleSchedulePickup(order)
                                                  }
                                                  disabled={
                                                    schedulePickupMutation.isPending
                                                  }
                                                  className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50"
                                                >
                                                  <PlayCircle className="w-4 h-4" />
                                                  3. Schedule Pickup
                                                </button>
                                              )}
                                            </>
                                          )}

                                        {/* Mark as Delivered - Only show if picked up but not delivered */}
                                        {hasPickup(order) &&
                                          !isDelivered(order) && (
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

                                        {/* Shiprocket Details - Always available if shipment exists */}
                                        {order.shipment && (
                                          <button
                                            onClick={() => {
                                              setSelectedOrder(order);
                                              const shiprocketOrderId =
                                                order?.shipment
                                                  ?.shiprocketOrderId;
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

                                    {/* Warning Message if AWB not generated */}
                                    {order.shipment &&
                                      !hasAwb(order) &&
                                      !isDelivered(order) && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                                          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                          <div>
                                            <p className="text-sm font-semibold text-yellow-900">
                                              AWB Not Generated
                                            </p>
                                            <p className="text-xs text-yellow-800 mt-1">
                                              You must generate AWB before you
                                              can download label/manifest or
                                              schedule pickup. Click "Generate
                                              AWB" above to continue with{" "}
                                              <strong>
                                                {selectedCourier.courierName}
                                              </strong>
                                              .
                                            </p>
                                          </div>
                                        </div>
                                      )}

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
                                            {order.shipment.awbCode || (
                                              <span className="text-red-600">
                                                Not Generated
                                              </span>
                                            )}
                                          </p>
                                        </div>
                                        <div className="bg-white p-3 rounded border border-gray-200">
                                          <p className="text-xs text-gray-600 mb-1">
                                            Courier
                                          </p>
                                          <p className="text-sm font-medium text-gray-900">
                                            {order.shipment.courierName ||
                                              selectedCourier.courierName ||
                                              "-"}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}

                                {/* Shipping Address - Always show */}
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

        {/* Tracking Modal */}
        <TrackingModal
          isOpen={showTrackingModal}
          onClose={() => setShowTrackingModal(false)}
          trackingData={trackingData}
          orderNumber={selectedOrder?.orderNumber}
        />

        {/* Shiprocket Details Modal */}
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
              <div className="p-6">
                <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
                  {JSON.stringify(shiprocketDetails, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ShipmentsPage;