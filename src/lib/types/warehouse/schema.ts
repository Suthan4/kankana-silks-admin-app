import z from "zod";

export const createWarehouseSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(20)
    .regex(
      /^[A-Z0-9-]+$/,
      "Code must be uppercase letters, numbers, or hyphens"
    ),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z
    .string()
    .regex(
      /^[1-9][0-9]{5}$/,
      "Invalid pincode (must be 6 digits, starting with 1-9)"
    ),
  isActive: z.boolean().optional(),
});

export const updateWarehouseSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  pincode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/)
    .optional(),
  isActive: z.boolean().optional(),
});

export type CreateWarehouseFormData = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseFormData = z.infer<typeof updateWarehouseSchema>;
