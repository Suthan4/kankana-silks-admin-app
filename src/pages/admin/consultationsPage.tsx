import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layouts/mainLayout";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Video,
  MessageCircle,
  Calendar,
  Clock,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock3,
  User,
  Mail,
  Phone,
  ExternalLink,
  AlertCircle,
  X,
  Save,
  Ban,
  CheckCheck,
} from "lucide-react";
import { consultationApi } from "@/lib/api/consulatation.api";
import type {
  Consultation,
  ConsultationStatus,
  ConsultationPlatform,
} from "@/lib/types/consultation/consultation";
import {
  updateConsultationStatusSchema,
  type UpdateConsultationStatusFormData,
} from "@/lib/types/consultation/schema";

// Status Configuration
const getStatusConfig = (status: ConsultationStatus) => {
  const configs = {
    REQUESTED: {
      icon: <Clock3 className="h-4 w-4" />,
      label: "Requested",
      color: "yellow",
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-700",
      borderColor: "border-yellow-300",
    },
    APPROVED: {
      icon: <CheckCircle className="h-4 w-4" />,
      label: "Approved",
      color: "green",
      bgColor: "bg-green-100",
      textColor: "text-green-700",
      borderColor: "border-green-300",
    },
    REJECTED: {
      icon: <XCircle className="h-4 w-4" />,
      label: "Rejected",
      color: "red",
      bgColor: "bg-red-100",
      textColor: "text-red-700",
      borderColor: "border-red-300",
    },
    COMPLETED: {
      icon: <CheckCheck className="h-4 w-4" />,
      label: "Completed",
      color: "blue",
      bgColor: "bg-blue-100",
      textColor: "text-blue-700",
      borderColor: "border-blue-300",
    },
    CANCELLED: {
      icon: <Ban className="h-4 w-4" />,
      label: "Cancelled",
      color: "gray",
      bgColor: "bg-gray-100",
      textColor: "text-gray-700",
      borderColor: "border-gray-300",
    },
  };
  return configs[status];
};

// Platform Configuration
const getPlatformConfig = (platform: ConsultationPlatform) => {
  const configs = {
    ZOOM: {
      icon: <Video className="h-4 w-4" />,
      label: "Zoom",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    WHATSAPP: {
      icon: <MessageCircle className="h-4 w-4" />,
      label: "WhatsApp",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  };
  return configs[platform];
};

// Stats Card Component
const StatsCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}> = ({ icon, label, value, color }) => {
  const colorClasses = {
    yellow: "bg-yellow-100 text-yellow-600",
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
    red: "bg-red-100 text-red-600",
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

// Consultation Card Component
const ConsultationCard: React.FC<{
  consultation: Consultation;
  onUpdateStatus: (consultation: Consultation) => void;
  canUpdate: boolean;
}> = ({ consultation, onUpdateStatus, canUpdate }) => {
  const statusConfig = getStatusConfig(consultation.status);
  const platformConfig = getPlatformConfig(consultation.platform);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-gray-200">
      {/* Header */}
      <div
        className={`${statusConfig.bgColor} p-4 flex items-center justify-between`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-white rounded-lg ${statusConfig.textColor}`}>
            {statusConfig.icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              {consultation.user?.firstName} {consultation.user?.lastName}
            </h3>
            <p className="text-xs text-gray-600">{consultation.user?.email}</p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.textColor}`}
        >
          {statusConfig.label}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Platform */}
        <div
          className={`flex items-center gap-2 ${platformConfig.bgColor} p-2 rounded`}
        >
          <span className={platformConfig.color}>{platformConfig.icon}</span>
          <span className="text-sm font-medium text-gray-900">
            {platformConfig.label}
          </span>
        </div>

        {/* Date & Time */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>{formatDate(consultation.preferredDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Clock className="h-4 w-4 text-gray-400" />
            <span>{consultation.preferredTime}</span>
          </div>
        </div>

        {/* Contact Info */}
        {consultation.user?.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Phone className="h-4 w-4 text-gray-400" />
            <span>{consultation.user.phone}</span>
          </div>
        )}

        {/* Meeting Link (if approved) */}
        {consultation.meetingLink && (
          <div className="pt-3 border-t border-gray-200">
            <a
              href={consultation.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <ExternalLink className="h-4 w-4" />
              Join Meeting
            </a>
          </div>
        )}

        {/* Rejection Reason */}
        {consultation.rejectionReason && (
          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-1">
              Rejection Reason:
            </p>
            <p className="text-sm text-gray-600">
              {consultation.rejectionReason}
            </p>
          </div>
        )}

        {/* Approved By */}
        {consultation.approvedBy && (
          <div className="text-xs text-gray-500">
            Approved by: {consultation.approvedBy}
          </div>
        )}

        {/* Action Button */}
        {canUpdate && consultation.status === "REQUESTED" && (
          <button
            onClick={() => onUpdateStatus(consultation)}
            className="w-full mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Review Request
          </button>
        )}
      </div>
    </div>
  );
};

// Main Component
const ConsultationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  // Permissions
  const canRead = hasPermission("consultations", "canRead");
  const canCreate = hasPermission("consultations", "canCreate");
  const canUpdate = hasPermission("consultations", "canUpdate");

  // UI State
  const [showModal, setShowModal] = useState(false);
  const [selectedConsultation, setSelectedConsultation] =
    useState<Consultation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    ConsultationStatus | undefined
  >(undefined);
  const [filterPlatform, setFilterPlatform] = useState<
    ConsultationPlatform | undefined
  >(undefined);
  const [page, setPage] = useState(1);

  // Fetch consultations
  const { data: consultationsData, isLoading } = useQuery({
    queryKey: ["admin-consultations", page, filterStatus, filterPlatform],
    queryFn: async () => {
      const response = await consultationApi.getAllConsultations({
        page,
        limit: 12,
        status: filterStatus,
        platform: filterPlatform,
        sortBy: "preferredDate",
        sortOrder: "asc",
      });
      return response.data;
    },
    enabled: canRead,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateConsultationStatusFormData;
    }) => consultationApi.updateConsultationStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-consultations"] });
      setShowModal(false);
      setSelectedConsultation(null);
      reset();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UpdateConsultationStatusFormData>({
    resolver: zodResolver(updateConsultationStatusSchema),
  });

  const selectedStatus = watch("status");

  const onSubmit = (data: UpdateConsultationStatusFormData) => {
    if (!selectedConsultation) return;
    updateStatusMutation.mutate({ id: selectedConsultation.id, data });
  };

  const handleUpdateStatus = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    reset({
      status: "APPROVED",
      meetingLink: "",
      rejectionReason: "",
    });
    setShowModal(true);
  };

  // Calculate stats
  const stats =
    consultationsData?.consultations.reduce((acc, c) => {
      acc[c.status.toLowerCase()] = (acc[c.status.toLowerCase()] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

  // Filter consultations
  const filteredConsultations =
    consultationsData?.consultations.filter(
      (consultation) =>
        consultation.user?.firstName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        consultation.user?.lastName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        consultation.user?.email
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase())
    ) || [];

  if (!canRead) {
    return (
      <MainLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to view consultations.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <Video className="h-7 w-7 text-white" />
              </div>
              Consultations
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              Manage customer consultation requests
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={<Clock3 className="h-6 w-6" />}
            label="Requested"
            value={stats.requested || 0}
            color="yellow"
          />
          <StatsCard
            icon={<CheckCircle className="h-6 w-6" />}
            label="Approved"
            value={stats.approved || 0}
            color="green"
          />
          <StatsCard
            icon={<CheckCheck className="h-6 w-6" />}
            label="Completed"
            value={stats.completed || 0}
            color="blue"
          />
          <StatsCard
            icon={<XCircle className="h-6 w-6" />}
            label="Rejected"
            value={stats.rejected || 0}
            color="red"
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
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={filterStatus || ""}
              onChange={(e) =>
                setFilterStatus(
                  (e.target.value as ConsultationStatus) || undefined
                )
              }
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All Status</option>
              <option value="REQUESTED">Requested</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={filterPlatform || ""}
              onChange={(e) =>
                setFilterPlatform(
                  (e.target.value as ConsultationPlatform) || undefined
                )
              }
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All Platforms</option>
              <option value="ZOOM">Zoom</option>
              <option value="WHATSAPP">WhatsApp</option>
            </select>
          </div>
        </div>

        {/* Consultations Grid */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading consultations...</p>
          </div>
        ) : filteredConsultations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 text-lg font-semibold">
              No consultations found
            </p>
            <p className="text-gray-500 text-sm mt-2">
              {searchQuery
                ? "Try adjusting your search"
                : "No consultation requests yet"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredConsultations.map((consultation) => (
                <ConsultationCard
                  key={consultation.id}
                  consultation={consultation}
                  onUpdateStatus={handleUpdateStatus}
                  canUpdate={canUpdate}
                />
              ))}
            </div>

            {/* Pagination */}
            {consultationsData &&
              consultationsData.pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-700">
                    Page {page} of {consultationsData.pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === consultationsData.pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
          </>
        )}

        {/* Update Status Modal */}
        {showModal && selectedConsultation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
              <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
                <h3 className="text-lg font-bold">
                  Update Consultation Status
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedConsultation(null);
                    reset();
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                {/* User Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="h-5 w-5 text-gray-600" />
                    <span className="font-semibold text-gray-900">
                      {selectedConsultation.user?.firstName}{" "}
                      {selectedConsultation.user?.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{selectedConsultation.user?.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(
                        selectedConsultation.preferredDate
                      ).toLocaleDateString()}{" "}
                      at {selectedConsultation.preferredTime}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    {...register("status")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="APPROVED">Approve</option>
                    <option value="REJECTED">Reject</option>
                    <option value="COMPLETED">Mark as Completed</option>
                  </select>
                  {errors.status && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.status.message}
                    </p>
                  )}
                </div>

                {/* Meeting Link (if approved) */}
                {selectedStatus === "APPROVED" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Meeting Link *
                    </label>
                    <input
                      {...register("meetingLink")}
                      type="url"
                      placeholder="https://zoom.us/j/123456789 or WhatsApp link"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.meetingLink && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.meetingLink.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Rejection Reason (if rejected) */}
                {selectedStatus === "REJECTED" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Rejection Reason
                    </label>
                    <textarea
                      {...register("rejectionReason")}
                      rows={3}
                      placeholder="Explain why the consultation is being rejected..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setSelectedConsultation(null);
                      reset();
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateStatusMutation.isPending}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                  >
                    {updateStatusMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Update Status
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ConsultationsPage;
