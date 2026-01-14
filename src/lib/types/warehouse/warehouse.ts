export interface Warehouse {
  id: string;

  name: string;
  code: string;

  // Address
  address: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;

  // Contact
  contactPerson: string;
  phone: string;
  email?: string;

  // Shiprocket
  isDefaultPickup: boolean;

  // Status
  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}
export interface CreateWarehouseData {
  name: string;
  code: string;

  address: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;

  contactPerson: string;
  phone: string;
  email?: string;

  isDefaultPickup?: boolean;
  isActive?: boolean;
}

export interface UpdateWarehouseData {
  name?: string;

  address?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;

  contactPerson?: string;
  phone?: string;
  email?: string;

  isDefaultPickup?: boolean;
  isActive?: boolean;
}
