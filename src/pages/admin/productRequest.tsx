import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { MainLayout } from "@/components/layouts/mainLayout";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  Calendar,
  User,
  ShoppingBag,
  Loader2,
  Search,
  Filter,
} from "lucide-react";
import {
  productRequestApi,
  type ProductRequest,
} from "@/lib/api/product-request.api";

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config = {
    PENDING: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock },
    APPROVED: { bg: "bg-blue-100", text: "text-blue-800", icon: CheckCircle },
    REJECTED: { bg: "bg-red-100", text: "text-red-800", icon: XCircle },
    FULFILLED: {
      bg: "bg-green-100",
      text: "text-green-800",
      icon: ShoppingBag,
    },
    CANCELLED: { bg: "bg-gray-100", text: "text-gray-800", icon: XCircle },
  };

  const {
    bg,
    text,
    icon: Icon,
  } = config[status as keyof typeof config] || config.PENDING;

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-semibold ${bg} ${text} flex items-center gap-1.5 w-fit`}
    >
      <Icon className="h-3.5 w-3.5" />
      {status}
    </span>
  );
};

const ProductRequestsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [selectedRequest, setSelectedRequest] = useState<ProductRequest | null>(
    null,
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [estimatedAvailability, setEstimatedAvailability] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const canUpdate = hasPermission("product-requests", "canUpdate");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-product-requests", page, statusFilter],
    queryFn: async () => {
      const response = await productRequestApi.getAllRequests({
        page,
        limit: 20,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      return response.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      productRequestApi.approveRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-product-requests"] });
      setShowApproveModal(false);
      setSelectedRequest(null);
      setAdminNote("");
      setEstimatedAvailability("");
      toast.success("Request approved!");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to approve request",
      );
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      productRequestApi.rejectRequest(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-product-requests"] });
      setShowRejectModal(false);
      setSelectedRequest(null);
      setAdminNote("");
      toast.success("Request rejected");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to reject request");
    },
  });

  const filteredRequests =
    data?.requests?.filter(
      (req) =>
        req.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.user.email.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                <MessageSquare className="h-7 w-7 text-white" />
              </div>
              Product Requests
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              Manage customer requests for out-of-stock products
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {["PENDING", "APPROVED", "REJECTED", "FULFILLED"].map((status) => {
            const count =
              data?.requests?.filter((r) => r.status === status).length || 0;
            return (
              <div key={status} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {status}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {count}
                    </p>
                  </div>
                  <StatusBadge status={status} />
                </div>
              </div>
            );
          })}
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
                placeholder="Search by product, request number, or customer email..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="FULFILLED">Fulfilled</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Requests Table */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto" />
            <p className="mt-4 text-gray-500">Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No product requests found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Request
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {request.requestNumber}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {request.product.media?.[0]?.url && (
                            <img
                              src={request.product.media[0].url}
                              alt={request.product.name}
                              className="h-10 w-10 rounded object-cover mr-3"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {request.product.name}
                            </div>
                            {request.variant && (
                              <div className="text-xs text-gray-500">
                                {[
                                  request.variant.size,
                                  request.variant.color,
                                  request.variant.fabric,
                                ]
                                  .filter(Boolean)
                                  .join(" / ")}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {request.user.firstName} {request.user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {request.quantity}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4 inline" />
                        </button>
                        {canUpdate && request.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowApproveModal(true);
                              }}
                              className="text-green-600 hover:text-green-900"
                            >
                              <CheckCircle className="h-4 w-4 inline" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowRejectModal(true);
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              <XCircle className="h-4 w-4 inline" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between bg-white px-6 py-3 rounded-lg shadow-md">
            <div className="text-sm text-gray-700">
              Page {data.pagination.page} of {data.pagination.totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.pagination.totalPages}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
                <h3 className="text-xl font-bold">Request Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2"
                >
                  ×
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Request Number</p>
                  <p className="text-lg font-semibold">
                    {selectedRequest.requestNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <StatusBadge status={selectedRequest.status} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Product</p>
                  <p className="text-lg font-semibold">
                    {selectedRequest.product.name}
                  </p>
                  {selectedRequest.variant && (
                    <p className="text-sm text-gray-500">
                      Variant:{" "}
                      {[
                        selectedRequest.variant.size,
                        selectedRequest.variant.color,
                        selectedRequest.variant.fabric,
                      ]
                        .filter(Boolean)
                        .join(" / ")}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quantity</p>
                  <p className="text-lg font-semibold">
                    {selectedRequest.quantity}
                  </p>
                </div>
                {selectedRequest.customerNote && (
                  <div>
                    <p className="text-sm text-gray-600">Customer Note</p>
                    <p className="text-sm text-gray-900">
                      {selectedRequest.customerNote}
                    </p>
                  </div>
                )}
                {selectedRequest.adminNote && (
                  <div>
                    <p className="text-sm text-gray-600">Admin Note</p>
                    <p className="text-sm text-gray-900">
                      {selectedRequest.adminNote}
                    </p>
                  </div>
                )}
                {selectedRequest.estimatedAvailability && (
                  <div>
                    <p className="text-sm text-gray-600">
                      Estimated Availability
                    </p>
                    <p className="text-sm text-gray-900">
                      {new Date(
                        selectedRequest.estimatedAvailability,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Approve Modal */}
        {showApproveModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="bg-green-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
                <h3 className="text-xl font-bold">Approve Request</h3>
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="text-white"
                >
                  ×
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Note (Optional)
                  </label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Add any notes..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Availability (Optional)
                  </label>
                  <input
                    type="date"
                    value={estimatedAvailability}
                    onChange={(e) => setEstimatedAvailability(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowApproveModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      approveMutation.mutate({
                        id: selectedRequest.id,
                        data: {
                          adminNote: adminNote || undefined,
                          estimatedAvailability:
                            estimatedAvailability || undefined,
                        },
                      })
                    }
                    disabled={approveMutation.isPending}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
                  >
                    {approveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : (
                      "Approve"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
                <h3 className="text-xl font-bold">Reject Request</h3>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="text-white"
                >
                  ×
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Explain why this request is being rejected..."
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRejectModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!adminNote.trim()) {
                        toast.error("Rejection reason is required");
                        return;
                      }
                      rejectMutation.mutate({
                        id: selectedRequest.id,
                        note: adminNote,
                      });
                    }}
                    disabled={rejectMutation.isPending}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
                  >
                    {rejectMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : (
                      "Reject"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ProductRequestsPage;
