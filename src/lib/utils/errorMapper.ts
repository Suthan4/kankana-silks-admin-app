import type { UseFormSetError, FieldValues, Path } from "react-hook-form";
import axios from "axios";

export interface ApiValidationErrorItem {
  field?: string;
  path?: string;
  message: string;
}

export interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  errors?: ApiValidationErrorItem[] | Record<string, string | string[]>;
  details?: any;
  status?: number;
}

/**
 * Maps backend API error responses directly to React Hook Form field errors
 * and extracts a clean top-level error message for toast alerts.
 */
export function mapApiErrorsToForm<T extends FieldValues>(
  error: unknown,
  setError?: UseFormSetError<T>
): string {
  let errorData: ApiErrorResponse | undefined;
  let status: number | undefined;

  if (axios.isAxiosError(error)) {
    errorData = error.response?.data as ApiErrorResponse | undefined;
    status = error.response?.status;
  } else if (typeof error === "object" && error !== null) {
    errorData = error as ApiErrorResponse;
  }

  const defaultMessage = "An unexpected error occurred. Please try again.";
  const topLevelMessage = errorData?.message || (error as any)?.message || defaultMessage;

  if (!setError || !errorData) {
    return topLevelMessage;
  }

  // Handle Array of error items: [{ field: "variants.0.sku", message: "..." }]
  if (Array.isArray(errorData.errors)) {
    errorData.errors.forEach((err) => {
      const fieldPath = err.field || err.path;
      if (fieldPath) {
        setError(fieldPath as Path<T>, {
          type: "server",
          message: err.message,
        });
      }
    });
  }
  // Handle Key-Value error map: { "sku": "Already in use", "basePrice": "Must be > 0" }
  else if (errorData.errors && typeof errorData.errors === "object") {
    Object.entries(errorData.errors).forEach(([field, msg]) => {
      const message = Array.isArray(msg) ? msg[0] : msg;
      if (field && message) {
        setError(field as Path<T>, {
          type: "server",
          message,
        });
      }
    });
  }

  // Handle HTTP 409 Conflict (e.g., Duplicate SKU)
  if (status === 409 || topLevelMessage.toLowerCase().includes("sku already exists")) {
    // If field wasn't already mapped, assign to root sku
    setError("sku" as Path<T>, {
      type: "server",
      message: topLevelMessage.includes("SKU") ? topLevelMessage : "SKU already exists",
    });
  }

  return topLevelMessage;
}

