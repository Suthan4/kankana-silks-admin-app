import type { Order } from "../order/order";

export type ReturnReason =
  | "DEFECTIVE"
  | "WRONG_ITEM"
  | "NOT_AS_DESCRIBED"
  | "DAMAGED_IN_TRANSIT"
  | "SIZE_FIT_ISSUE"
  | "CHANGED_MIND"
  | "BETTER_PRICE"
  | "QUALITY_ISSUE"
  | "OTHER";

export type ReturnStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "PICKUP_SCHEDULED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "RECEIVED"
  | "INSPECTING"
  | "REFUND_INITIATED"
  | "REFUND_COMPLETED"
  | "CLOSED";

export type RefundMethod = "ORIGINAL_PAYMENT" | "BANK_TRANSFER" | "STORE_CREDIT";

export interface ReturnItem {
  id: string;
  returnId: string;
  orderItemId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    sku: string;
    slug: string;
    media: Array<{
      id: string;
      url: string;
      type: string;
    }>;
  };
  variant?: {
    id: string;
    name: string;
    sku: string;
  };
  orderItem: {
    id: string;
    quantity: number;
    price: number;
  };
}

export interface ReturnShipment {
  id: string;
  shiprocketOrderId: string;
  awb: string;
  courierName: string;
  pickupDate: string;
  trackingUrl?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnMedia {
  id: string;
  returnId: string;
  type: "IMAGE" | "VIDEO";
  url: string;
  key?: string;
  thumbnailUrl?: string;
  mimeType?: string;
  fileSize?: number;
  duration?: number;
  width?: number;
  height?: number;
  order: number;
  description?: string;
  createdAt: string;
}

export interface Return {
  id: string;
  returnNumber: string;
  userId: string;
  orderId: string;
  reason: ReturnReason;
  reasonDetails: string;
  images: string[];
  status: ReturnStatus;
  refundAmount: number;
  refundMethod: RefundMethod;
  bankDetails?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
  };
  adminNotes?: string;
  rejectionReason?: string;
  returnShipmentId?: string;
  razorpayRefundId?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  order: Order;
  returnItems: ReturnItem[];
  returnShipment?: ReturnShipment;
  media: ReturnMedia[];
}