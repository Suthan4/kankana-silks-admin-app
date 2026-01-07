import { z } from "zod";

// Login Schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Register Schema
export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// Create Admin Schema (Super Admin only)
export const createAdminSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
});

export type CreateAdminFormData = z.infer<typeof createAdminSchema>;

// Set Permissions Schema
export const setPermissionsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  module: z.string().min(1, "Module is required"),
  canCreate: z.boolean(),
  canRead: z.boolean(),
  canUpdate: z.boolean(),
  canDelete: z.boolean(),
});

export type SetPermissionsFormData = z.infer<typeof setPermissionsSchema>;
