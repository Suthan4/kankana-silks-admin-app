import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { returnApi, type QueryReturnParams } from "../../lib/api/return.api";
import type { Return, ReturnStatus } from "../../lib/types/return/return";
import {
  Package,
  Search,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  User,
  MessageSquare,
  Image as ImageIcon,
  Truck,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  FileText,
  Calendar,
  MapPin,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { MainLayout } from "@/components/layouts/mainLayout";

const ReturnsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ReturnStatus | "ALL">(
    "ALL",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  const limit = 10;

  // Query params
  const queryParams: QueryReturnParams = {
    page: currentPage,
    limit,
    ...(selectedStatus !== "ALL" && { status: selectedStatus }),
    ...(dateRange.startDate && { startDate: dateRange.startDate }),
    ...(dateRange.endDate && { endDate: dateRange.endDate }),
    sortBy: "createdAt",
    sortOrder: "desc",
  };

  // Fetch returns
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-returns", queryParams],
    queryFn: () => returnApi.getAllReturns(queryParams),
  });

  // Approve return mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      returnApi.approveReturn(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-returns"] });
      toast.success("Return approved successfully");
      setShowApproveModal(false);
      setAdminNotes("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to approve return");
    },
  });

  // Reject return mutation
  const rejectMutation = useMutation({
    mutationFn: ({
      id,
      reason,
      notes,
    }: {
      id: string;
      reason: string;
      notes?: string;
    }) => returnApi.rejectReturn(id, reason, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-returns"] });
      toast.success("Return rejected successfully");
      setShowRejectModal(false);
      setRejectionReason("");
      setAdminNotes("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to reject return");
    },
  });

  // Process refund mutation
  const refundMutation = useMutation({
    mutationFn: (id: string) => returnApi.processRefund(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-returns"] });
      toast.success("Refund initiated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to process refund");
    },
  });

  const returns = data?.data?.returns || [];
  const pagination = data?.data?.pagination;

  // Filter returns by search term
  const filteredReturns = returns.filter(
    (returnItem) =>
      returnItem.returnNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      returnItem.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.order.orderNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  const getStatusColor = (status: ReturnStatus) => {
    const colors: Record<ReturnStatus, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      PICKUP_SCHEDULED: "bg-blue-100 text-blue-800",
      PICKED_UP: "bg-purple-100 text-purple-800",
      IN_TRANSIT: "bg-indigo-100 text-indigo-800",
      RECEIVED: "bg-cyan-100 text-cyan-800",
      INSPECTING: "bg-orange-100 text-orange-800",
      REFUND_INITIATED: "bg-lime-100 text-lime-800",
      REFUND_COMPLETED: "bg-emerald-100 text-emerald-800",
      CLOSED: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: ReturnStatus) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="w-4 h-4" />;
      case "REJECTED":
      case "CLOSED":
        return <XCircle className="w-4 h-4" />;
      case "REFUND_COMPLETED":
        return <DollarSign className="w-4 h-4" />;
      case "PICKED_UP":
      case "IN_TRANSIT":
        return <Truck className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      DEFECTIVE: "Defective Product",
      WRONG_ITEM: "Wrong Item Sent",
      NOT_AS_DESCRIBED: "Not As Described",
      DAMAGED_IN_TRANSIT: "Damaged in Transit",
      SIZE_FIT_ISSUE: "Size/Fit Issue",
      CHANGED_MIND: "Changed Mind",
      BETTER_PRICE: "Found Better Price",
      QUALITY_ISSUE: "Quality Issue",
      OTHER: "Other",
    };
    return labels[reason] || reason;
  };

  const handleApprove = () => {
    if (!selectedReturn) return;
    approveMutation.mutate({
      id: selectedReturn.id,
      notes: adminNotes || undefined,
    });
  };

  const handleReject = () => {
    if (!selectedReturn || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    rejectMutation.mutate({
      id: selectedReturn.id,
      reason: rejectionReason,
      notes: adminNotes || undefined,
    });
  };

  const handleProcessRefund = (returnItem: Return) => {
    if (
      window.confirm(
        `Process refund of ₹${returnItem.refundAmount.toFixed(2)} for return ${
          returnItem.returnNumber
        }?`,
      )
    ) {
      refundMutation.mutate(returnItem.id);
    }
  };

  const exportToCSV = () => {
    if (filteredReturns.length === 0) {
      toast.error("No returns to export");
      return;
    }

    const headers = [
      "Return Number",
      "Order Number",
      "Customer",
      "Email",
      "Reason",
      "Status",
      "Refund Amount",
      "Refund Method",
      "Date",
    ];

    const rows = filteredReturns.map((returnItem) => [
      returnItem.returnNumber,
      returnItem.order.orderNumber,
      `${returnItem.user.firstName} ${returnItem.user.lastName}`,
      returnItem.user.email,
      getReasonLabel(returnItem.reason),
      returnItem.status,
      `₹${returnItem.refundAmount.toFixed(2)}`,
      returnItem.refundMethod,
      format(new Date(returnItem.createdAt), "dd/MM/yyyy HH:mm"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `returns-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Returns exported successfully");
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load returns</p>
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
            Returns Management
          </h1>
          <p className="text-gray-600 mt-1">
            Process return requests and refunds
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Returns</p>
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
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {returns.filter((r) => r.status === "PENDING").length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {returns.filter((r) => r.status === "APPROVED").length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Transit</p>
              <p className="text-2xl font-bold text-purple-600">
                {
                  returns.filter(
                    (r) =>
                      r.status === "PICKED_UP" || r.status === "IN_TRANSIT",
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
              <p className="text-sm text-gray-600">Refund Completed</p>
              <p className="text-2xl font-bold text-emerald-600">
                {returns.filter((r) => r.status === "REFUND_COMPLETED").length}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search returns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) =>
              setSelectedStatus(e.target.value as ReturnStatus | "ALL")
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="PICKUP_SCHEDULED">Pickup Scheduled</option>
            <option value="PICKED_UP">Picked Up</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="RECEIVED">Received</option>
            <option value="INSPECTING">Inspecting</option>
            <option value="REFUND_INITIATED">Refund Initiated</option>
            <option value="REFUND_COMPLETED">Refund Completed</option>
          </select>
          <input
            type="date"
            placeholder="Start Date"
            value={dateRange.startDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, startDate: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="date"
            placeholder="End Date"
            value={dateRange.endDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, endDate: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : filteredReturns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Package className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">No returns found</p>
              <p className="text-gray-400 text-sm mt-2">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Return
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Refund
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReturns.map((returnItem) => (
                  <tr
                    key={returnItem.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {returnItem.returnNumber}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Order: {returnItem.order.orderNumber}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {returnItem.user.firstName} {returnItem.user.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {returnItem.user.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {getReasonLabel(returnItem.reason)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {returnItem.returnItems.length} item(s)
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          ₹{returnItem.refundAmount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {returnItem.refundMethod.replace("_", " ")}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          returnItem.status,
                        )}`}
                      >
                        {getStatusIcon(returnItem.status)}
                        {returnItem.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(returnItem.createdAt), "dd MMM yyyy")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(returnItem.createdAt), "HH:mm")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedReturn(returnItem);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {returnItem.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedReturn(returnItem);
                                setShowApproveModal(true);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Approve Return"
                            >
                              <ThumbsUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedReturn(returnItem);
                                setShowRejectModal(true);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject Return"
                            >
                              <ThumbsDown className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {returnItem.status === "RECEIVED" && (
                          <button
                            onClick={() => handleProcessRefund(returnItem)}
                            disabled={refundMutation.isPending}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Process Refund"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
                  setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
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

      {/* Return Details Modal */}
      {showDetailsModal && selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Return Details - {selectedReturn.returnNumber}
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status & Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Status</p>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      selectedReturn.status,
                    )}`}
                  >
                    {getStatusIcon(selectedReturn.status)}
                    {selectedReturn.status.replace("_", " ")}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Refund Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{selectedReturn.refundAmount.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Customer & Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Customer
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="text-sm font-medium">
                        {selectedReturn.user.firstName}{" "}
                        {selectedReturn.user.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="text-sm font-medium">
                        {selectedReturn.user.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="text-sm font-medium">
                        {selectedReturn.user.phone || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Order Info
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">Order Number</p>
                      <p className="text-sm font-medium">
                        {selectedReturn.order.orderNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Order Total</p>
                      <p className="text-sm font-medium">
                        ₹{selectedReturn.order.total.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Return Date</p>
                      <p className="text-sm font-medium">
                        {format(
                          new Date(selectedReturn.createdAt),
                          "dd MMM yyyy HH:mm",
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Return Reason */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Return Reason
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    {getReasonLabel(selectedReturn.reason)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedReturn.reasonDetails}
                  </p>
                </div>
              </div>

              {/* Return Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Return Items
                </h3>
                <div className="border border-gray-200 rounded-lg divide-y">
                  {selectedReturn.returnItems.map((item) => (
                    <div key={item.id} className="p-4 flex gap-4">
                      {item.product.media[0] && (
                        <img
                          src={item.product.media[0].url}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        {item.variant && (
                          <p className="text-sm text-gray-600">
                            Variant: {item.variant.name}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{item.price.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">
                          Total: ₹{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Images */}
              {selectedReturn.images.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Product Images ({selectedReturn.images.length})
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedReturn.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Return image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
                        onClick={() => window.open(image, "_blank")}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Refund Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Refund Details
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Refund Method</span>
                    <span className="text-sm font-medium">
                      {selectedReturn.refundMethod.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Refund Amount</span>
                    <span className="text-sm font-semibold">
                      ₹{selectedReturn.refundAmount.toFixed(2)}
                    </span>
                  </div>
                  {selectedReturn.razorpayRefundId && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Razorpay ID</span>
                      <span className="text-sm font-mono">
                        {selectedReturn.razorpayRefundId}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              {(selectedReturn.adminNotes ||
                selectedReturn.rejectionReason) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Admin Notes
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    {selectedReturn.rejectionReason && (
                      <div>
                        <p className="text-sm font-medium text-red-600">
                          Rejection Reason:
                        </p>
                        <p className="text-sm text-gray-900">
                          {selectedReturn.rejectionReason}
                        </p>
                      </div>
                    )}
                    {selectedReturn.adminNotes && (
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Notes:
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedReturn.adminNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Shipment Tracking */}
              {selectedReturn.returnShipment && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Return Shipment
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">AWB Code</p>
                      <p className="text-sm font-mono font-medium">
                        {selectedReturn.returnShipment.awb}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Courier</p>
                      <p className="text-sm font-medium">
                        {selectedReturn.returnShipment.courierName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pickup Date</p>
                      <p className="text-sm font-medium">
                        {format(
                          new Date(selectedReturn.returnShipment.pickupDate),
                          "dd MMM yyyy",
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="text-sm font-medium">
                        {selectedReturn.returnShipment.status}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Approve Return
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Return: {selectedReturn.returnNumber}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  Approving this return will schedule a pickup and create a
                  reverse shipment order.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add any internal notes..."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setAdminNotes("");
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {approveMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Approve Return
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Reject Return</h2>
              <p className="text-sm text-gray-600 mt-1">
                Return: {selectedReturn.returnNumber}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-900">
                  Please provide a clear reason for rejection. This will be sent
                  to the customer.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Explain why this return is being rejected..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Internal Notes (Optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add any internal notes..."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                  setAdminNotes("");
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejectMutation.isPending || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {rejectMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Reject Return
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </MainLayout>
  );
};

export default ReturnsPage;
