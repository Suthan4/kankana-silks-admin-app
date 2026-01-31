import React from "react";
import {
  XCircle,
  Package,
  MapPin,
  Calendar,
  Truck,
  CheckCircle,
  Clock,
  User,
  Weight,
  ExternalLink,
  AlertCircle,
  XOctagon,
  PackageCheck,
  Navigation,
} from "lucide-react";
import { format } from "date-fns";

interface TrackingData {
  tracking_data: {
    track_status: number;
    shipment_status: number;
    shipment_track: Array<{
      id: number;
      awb_code: string;
      courier_company_id: number;
      shipment_id: number;
      order_id: number;
      pickup_date: string;
      delivered_date: string;
      weight: string;
      packages: number;
      current_status: string;
      delivered_to: string;
      destination: string;
      consignee_name: string;
      origin: string;
      courier_agent_details: any;
      courier_name: string;
      edd: string;
      pod: string;
      pod_status: string;
      rto_delivered_date: string;
      return_awb_code: string;
      updated_time_stamp: string;
    }>;
    shipment_track_activities: any;
    track_url: string;
    etd: string;
    qc_response: string;
    is_return: boolean;
    order_tag: string;
  };
}

interface TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackingData: TrackingData;
  orderNumber?: string;
}

const TrackingModal: React.FC<TrackingModalProps> = ({
  isOpen,
  onClose,
  trackingData,
  orderNumber,
}) => {
  if (!isOpen) return null;

  const shipmentInfo = trackingData?.tracking_data?.shipment_track?.[0];
  const trackUrl = trackingData?.tracking_data?.track_url;

  if (!shipmentInfo) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Tracking Information
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No tracking information available</p>
          </div>
        </div>
      </div>
    );
  }

  // Get status color and icon
  const getStatusInfo = (status: string) => {
    const statusLower = status.toLowerCase();

    if (statusLower.includes("delivered")) {
      return {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: <PackageCheck className="w-5 h-5" />,
        label: "Delivered",
      };
    }
    if (statusLower.includes("transit") || statusLower.includes("shipped")) {
      return {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: <Truck className="w-5 h-5" />,
        label: "In Transit",
      };
    }
    if (statusLower.includes("pickup") || statusLower.includes("picked")) {
      return {
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: <Package className="w-5 h-5" />,
        label: "Picked Up",
      };
    }
    if (statusLower.includes("cancel")) {
      return {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: <XOctagon className="w-5 h-5" />,
        label: "Cancelled",
      };
    }
    if (statusLower.includes("pending")) {
      return {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <Clock className="w-5 h-5" />,
        label: "Pending",
      };
    }

    return {
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: <Package className="w-5 h-5" />,
      label: status,
    };
  };

  const statusInfo = getStatusInfo(shipmentInfo.current_status);

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === "" || dateStr === "NA") return "Not available";
    try {
      return format(new Date(dateStr), "dd MMM yyyy, hh:mm a");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Navigation className="w-6 h-6 text-blue-600" />
              Shipment Tracking
            </h2>
            {orderNumber && (
              <p className="text-sm text-gray-600 mt-1">Order #{orderNumber}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Status Banner */}
          <div
            className={`${statusInfo.color} border-2 rounded-lg p-6 flex items-center justify-between`}
          >
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-full p-3 shadow-sm">
                {statusInfo.icon}
              </div>
              <div>
                <p className="text-sm font-medium opacity-80">Current Status</p>
                <p className="text-2xl font-bold mt-1">
                  {shipmentInfo.current_status}
                </p>
              </div>
            </div>
            {trackUrl && (
              <a
                href={trackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Track on Shiprocket
              </a>
            )}
          </div>

          {/* Shipment Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AWB Code */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="bg-white rounded-lg p-2">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 font-medium">
                    AWB Code (Tracking Number)
                  </p>
                  <p className="text-lg font-mono font-bold text-gray-900 mt-1">
                    {shipmentInfo.awb_code}
                  </p>
                </div>
              </div>
            </div>

            {/* Courier */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="bg-white rounded-lg p-2">
                  <Truck className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 font-medium">
                    Courier Service
                  </p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {shipmentInfo.courier_name}
                  </p>
                </div>
              </div>
            </div>

            {/* Weight & Packages */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="bg-white rounded-lg p-2">
                  <Weight className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 font-medium">
                    Shipment Details
                  </p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {shipmentInfo.weight} kg • {shipmentInfo.packages}{" "}
                    {shipmentInfo.packages === 1 ? "Package" : "Packages"}
                  </p>
                </div>
              </div>
            </div>

            {/* Estimated Delivery */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="bg-white rounded-lg p-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 font-medium">
                    Expected Delivery
                  </p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {formatDate(shipmentInfo.edd)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Route Information */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Shipment Route
            </h3>
            <div className="flex items-center justify-between">
              {/* Origin */}
              <div className="text-center flex-1">
                <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2 shadow-sm">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-600">Origin</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {shipmentInfo.origin}
                </p>
              </div>

              {/* Arrow */}
              <div className="flex-1 flex items-center justify-center">
                <div className="h-1 bg-gradient-to-r from-blue-400 to-purple-400 flex-1 mx-4 relative">
                  <Truck className="w-6 h-6 text-purple-600 absolute -top-2.5 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-1" />
                </div>
              </div>

              {/* Destination */}
              <div className="text-center flex-1">
                <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2 shadow-sm">
                  <MapPin className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-sm font-medium text-gray-600">Destination</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {shipmentInfo.destination}
                </p>
              </div>
            </div>
          </div>

          {/* Consignee Information */}
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600" />
              Consignee Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 font-medium">Name</p>
                <p className="text-base font-semibold text-gray-900 mt-1">
                  {shipmentInfo.consignee_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">
                  Delivery Location
                </p>
                <p className="text-base font-semibold text-gray-900 mt-1">
                  {shipmentInfo.delivered_to || shipmentInfo.destination}
                </p>
              </div>
            </div>
          </div>

          {/* Dates Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pickup Date */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <p className="text-xs text-gray-600 font-medium">Pickup Date</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {formatDate(shipmentInfo.pickup_date)}
              </p>
            </div>

            {/* Delivered Date */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <p className="text-xs text-gray-600 font-medium">
                  Delivered Date
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {formatDate(shipmentInfo.delivered_date)}
              </p>
            </div>

            {/* POD Status */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-purple-600" />
                <p className="text-xs text-gray-600 font-medium">
                  Proof of Delivery
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {shipmentInfo.pod || "Not Available"}
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold">Tracking Information</p>
                <p className="mt-1 text-blue-800">
                  Shipment ID:{" "}
                  <span className="font-mono">{shipmentInfo.shipment_id}</span>{" "}
                  • Order ID:{" "}
                  <span className="font-mono">{shipmentInfo.order_id}</span>
                  {trackingData.tracking_data.is_return && (
                    <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-xs font-semibold">
                      Return Shipment
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingModal;
