import z from "zod";

export const createWarehouseSchema = z.object({
  name: z.string().min(1).max(100),
  code: z
    .string()
    .min(2)
    .max(20)
    .regex(/^[A-Z0-9-]+$/),

  address: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/),
  country: z.string().default("India"),

  contactPerson: z.string().min(1),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  email: z.string().email().optional(),

  isDefaultPickup: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
export const updateWarehouseSchema = z.object({
  name: z.string().min(1).max(100).optional(),

  // Address
  address: z.string().min(1).optional(),
  addressLine2: z.string().optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  pincode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, "Invalid pincode")
    .optional(),
  country: z.string().optional(),

  // Contact
  contactPerson: z.string().min(1).optional(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid phone number")
    .optional(),
  email: z.string().email("Invalid email").optional(),

  // Shiprocket
  isDefaultPickup: z.boolean().optional(),

  // Status
  isActive: z.boolean().optional(),
});


export type CreateWarehouseFormData = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseFormData = z.infer<typeof updateWarehouseSchema>;
