export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "CONFIRMED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "FAILED"
  | "REFUNDED"
  | "RETURNED";

export type PaymentMethod =
  | "COD"
  | "CARD"
  | "UPI"
  | "NETBANKING"
  | "WALLET"
  | "EMI"
  | "PAYLATER";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

export interface OrderItem {
  id: string;
  orderId: string;
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
    price: number;
    sellingPrice: number;
  };
}

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface Payment {
  id: string;
  orderId: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  refundAmount?: number;
  cardNetwork?: string;
  cardLast4?: string;
  cardType?: string;
  upiId?: string;
  bankName?: string;
  walletName?: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  shiprocketOrderId?: string;
  shiprocketShipmentId?: string;
  trackingNumber?: string;
  awbCode?: string;
  courierName?: string;
  estimatedDelivery?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export interface OrderShippingInfo {
  id: string;
  orderId: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  pickupAddress: string;
  pickupCity: string;
  pickupState: string;
  pickupPincode: string;
  pickupCountry: string;
  pickupPhone?: string;
  pickupEmail?: string;
  totalWeight: number;
  volumetricWeight: number;
  chargeableWeight: number;
  length: number;
  breadth: number;
  height: number;
  selectedCourierCompanyId?: number;
  selectedCourierName?: string;
  selectedCourierCharge?: number;
  selectedCourierEtd?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  shippingCost: number;
  gstAmount: number;
  total: number;
  shippingAddressId: string;
  billingAddressId: string;
  couponId?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  payment?: Payment;
  shipment?: Shipment;
  shippingInfo?: OrderShippingInfo;
  coupon?: {
    id: string;
    code: string;
    description?: string;
  };
}