import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseFormSetError } from "react-hook-form";
import toast from "react-hot-toast";
import { productApi } from "@/lib/api/product.api";
import type {
  CreateProductData,
  PatchProductPayload,
  Product,
  ProductFormValues,
} from "@/lib/types/product";
import { mapApiErrorsToForm } from "@/lib/utils/errorMapper";

/**
 * Query hook to fetch a single product by ID for edit prefilling and caching.
 */
export function useProductQuery(id?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await productApi.getProduct(id);
      return response.data;
    },
    enabled: Boolean(id) && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
  });
}

/**
 * Mutation hook to create a new product.
 * Auto-invalidates ['products'] query cache and maps validation errors to form fields.
 */
export function useCreateProductMutation(setError?: UseFormSetError<ProductFormValues>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateProductData) => {
      const response = await productApi.createProduct(payload);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(
        data?.name
          ? `Product "${data.name}" created successfully!`
          : "Product created successfully!"
      );
    },
    onError: (error) => {
      const errorMessage = mapApiErrorsToForm(error, setError);
      toast.error(errorMessage);
    },
  });
}

/**
 * Mutation hook for partial updates (PATCH /api/products/:id).
 * Allows updating stock, prices, or individual variants without sending untouched fields.
 */
export function usePatchProductMutation(setError?: UseFormSetError<any>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: PatchProductPayload;
    }) => {
      const response = await productApi.patchProduct(id, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", variables.id] });
      toast.success("Changes saved successfully!");
    },
    onError: (error) => {
      const errorMessage = mapApiErrorsToForm(error, setError);
      toast.error(errorMessage);
    },
  });
}

/**
 * Mutation hook for full PUT updates.
 */
export function useUpdateProductMutation(setError?: UseFormSetError<any>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await productApi.updateProduct(id, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", variables.id] });
      toast.success("Product updated successfully!");
    },
    onError: (error) => {
      const errorMessage = mapApiErrorsToForm(error, setError);
      toast.error(errorMessage);
    },
  });
}

/**
 * Mutation hook to delete a product.
 */
export function useDeleteProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await productApi.deleteProduct(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete product");
    },
  });
}

