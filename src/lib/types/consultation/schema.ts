import z from "zod";

export const ConsultationPlatformEnum = z.enum(["ZOOM", "WHATSAPP"]);

export const ConsultationStatusEnum = z.enum([
  "REQUESTED",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
  "CANCELLED",
]);

// Create Consultation Schema
export const createConsultationSchema = z
  .object({
    productId: z.string().optional(),
    categoryId: z.string().optional(),
    platform: ConsultationPlatformEnum,
    preferredDate: z.string().min(1, "Date is required"),
    preferredTime: z
      .string()
      .regex(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Invalid time format (HH:MM)"
      ),
  })
  .refine((data) => data.productId || data.categoryId, {
    message: "Either product or category must be selected",
    path: ["productId"],
  });

export type CreateConsultationFormData = z.infer<
  typeof createConsultationSchema
>;

// Update Status Schema (Admin)
export const updateConsultationStatusSchema = z.object({
  status: ConsultationStatusEnum,
  meetingLink: z
    .string()
    .url("Invalid meeting link")
    .optional()
    .or(z.literal("")),
  rejectionReason: z.string().optional().or(z.literal("")),
});

export type UpdateConsultationStatusFormData = z.infer<
  typeof updateConsultationStatusSchema
>;
