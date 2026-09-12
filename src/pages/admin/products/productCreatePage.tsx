import React from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { categoryApi } from "@/lib/api/category.api";
import { warehouseApi } from "@/lib/api/warehouse.api";
import { MainLayout } from "@/components/layouts/mainLayout";
import { ProductFormLayout } from "@/components/products";

export const ProductCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Load categories
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await categoryApi.getCategories({ limit: 100 });
      return response.data;
    },
  });

  // Load active warehouses
  const { data: warehousesData, isLoading: isLoadingWarehouses } = useQuery({
    queryKey: ["warehouses-active"],
    queryFn: async () => {
      const response = await warehouseApi.getActiveWarehouses();
      return response.data;
    },
  });

  const categories = categoriesData?.categories || [];
  const warehouses = warehousesData || [];

  if (isLoadingCategories || isLoadingWarehouses) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-slate-600">
            Initializing product dashboard...
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Full-width borderless dashboard layout */}
      <ProductFormLayout
        productId={id}
        categories={categories}
        warehouses={warehouses}
        onClose={() => navigate("/admin/products")}
        onSuccess={() => navigate("/admin/products")}
      />
    </MainLayout>
  );
};

export default ProductCreatePage;
