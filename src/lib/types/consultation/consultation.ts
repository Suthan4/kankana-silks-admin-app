// Consultation Types

export const ConsultationPlatform = {
  ZOOM: "ZOOM",
  WHATSAPP: "WHATSAPP",
} as const;

export type ConsultationPlatform =
  (typeof ConsultationPlatform)[keyof typeof ConsultationPlatform];

export const ConsultationStatus = {
  REQUESTED: "REQUESTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type ConsultationStatus =
  (typeof ConsultationStatus)[keyof typeof ConsultationStatus];

export interface Consultation {
  id: string;
  userId: string;
  productId?: string;
  categoryId?: string;
  platform: ConsultationPlatform;
  preferredDate: string;
  preferredTime: string;
  status: ConsultationStatus;
  meetingLink?: string;
  approvedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

export interface CreateConsultationData {
  productId?: string;
  categoryId?: string;
  platform: ConsultationPlatform;
  preferredDate: string;
  preferredTime: string;
}

export interface UpdateConsultationStatusData {
  status: ConsultationStatus;
  meetingLink?: string;
  rejectionReason?: string;
}

export interface QueryConsultationParams {
  page?: number;
  limit?: number;
  status?: ConsultationStatus;
  platform?: ConsultationPlatform;
  startDate?: string;
  endDate?: string;
  sortBy?: "preferredDate" | "createdAt";
  sortOrder?: "asc" | "desc";
}
