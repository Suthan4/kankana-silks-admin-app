import React, { useState, useId } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
  Check,
  Package,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

import { MainLayout } from "@/components/layouts/mainLayout";
import { BackButton } from "@/components/ui/BackButton";
import { productApi } from "@/lib/api/product.api";
import { warehouseApi } from "@/lib/api/warehouse.api";
import { BulkCategoryTreeSelector } from "@/components/products/bulk/BulkCategoryTreeSelector";
import { BulkProductPreviewTable } from "@/components/products/bulk/BulkProductPreviewTable";
import { BulkAddProductModal } from "@/components/products/bulk/BulkAddProductModal";
import type {
  BulkParsedProduct,
  BulkValidationError,
  BulkValidationSummary,
  BulkImportResponse,
} from "@/lib/types/product/bulkProduct";
import type { Warehouse } from "@/lib/types/warehouse/warehouse";

export const BulkProductUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputId = useId();

  // Wizard active step: 1 (Categories), 2 (Prepare/Upload), 3 (Preview & Edit), 4 (Result)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Selected category IDs
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // Products and validation state
  const [products, setProducts] = useState<BulkParsedProduct[]>([]);
  const [validationSummary, setValidationSummary] = useState<BulkValidationSummary | undefined>(undefined);
  const [validationErrors, setValidationErrors] = useState<BulkValidationError[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");

  // Modals & UI States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<BulkImportResponse | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // QUERIES
  // ─────────────────────────────────────────────────────────────────────────

  // 1. Category Tree & Paths
  const { data: categoryData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["bulk-categories-tree"],
    queryFn: async () => {
      const res = await productApi.getBulkCategoryTree();
      return res.data;
    },
  });

  // 2. Active Warehouses
  const { data: warehousesData, isLoading: isLoadingWarehouses } = useQuery({
    queryKey: ["warehouses-active"],
    queryFn: async () => {
      const res = await warehouseApi.getActiveWarehouses();
      return res.data as Warehouse[];
    },
  });

  const categoryTree = categoryData?.tree || [];
  const flatCategories = categoryData?.flatList || [];
  const warehouses = warehousesData || [];

  // Available category paths based on selected categories (or all if none selected)
  const availableCategoryPaths = React.useMemo(() => {
    if (selectedCategoryIds.length > 0) {
      const idSet = new Set(selectedCategoryIds);
      return flatCategories.filter((c) => idSet.has(c.id)).map((c) => c.path);
    }
    return flatCategories.map((c) => c.path);
  }, [flatCategories, selectedCategoryIds]);

  // ─────────────────────────────────────────────────────────────────────────
  // ACTIONS: TEMPLATE DOWNLOAD & EXPORT
  // ─────────────────────────────────────────────────────────────────────────

  const handleDownloadTemplate = async () => {
    try {
      toast.loading("Generating Excel template...", { id: "download-tpl" });
      const blob = await productApi.downloadBulkTemplate(
        selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined
      );

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "kankana-silks-bulk-product-template.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Excel template downloaded!", { id: "download-tpl" });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to download template", { id: "download-tpl" });
    }
  };

  const handleExportWorkbook = async () => {
    if (products.length === 0) {
      toast.error("No products to export.");
      return;
    }

    try {
      toast.loading("Exporting workbook...", { id: "export-wb" });
      const blob = await productApi.exportBulkProducts(products, selectedCategoryIds);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "kankana-silks-products-export.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Workbook exported successfully!", { id: "export-wb" });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to export workbook", { id: "export-wb" });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ACTIONS: FILE UPLOAD & VALIDATION
  // ─────────────────────────────────────────────────────────────────────────

  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      toast.error("Please upload an Excel workbook in .xlsx format.");
      return;
    }

    setUploadedFileName(file.name);
    toast.loading("Parsing and validating workbook...", { id: "validate-file" });

    try {
      const res = await productApi.validateBulkFile(file);
      const validation = res.data;

      if (!validation) {
        throw new Error("Validation returned empty response.");
      }

      setProducts(validation.products);
      setValidationSummary(validation.summary);
      setValidationErrors(validation.errors);
      setCurrentStep(3);

      if (validation.valid) {
        toast.success(`Workbook parsed! All ${validation.summary.totalProducts} products are valid.`, {
          id: "validate-file",
        });
      } else {
        toast.error(
          `Parsed with ${validation.summary.errorCount} issue(s). Review and correct in table below.`,
          { id: "validate-file", duration: 5000 }
        );
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to parse Excel workbook", { id: "validate-file" });
    }
  };

  const handleRevalidateProducts = async () => {
    if (products.length === 0) {
      toast.error("No products to validate.");
      return;
    }

    toast.loading("Re-validating products batch...", { id: "revalidate" });
    try {
      const res = await productApi.validateBulkProducts(products);
      const validation = res.data;

      if (!validation) {
        throw new Error("Validation returned empty response.");
      }

      setProducts(validation.products);
      setValidationSummary(validation.summary);
      setValidationErrors(validation.errors);

      if (validation.valid) {
        toast.success("All products are now completely valid!", { id: "revalidate" });
      } else {
        toast.error(`Found ${validation.summary.errorCount} error(s).`, { id: "revalidate" });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Validation failed", { id: "revalidate" });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ACTIONS: DASHBOARD EDITING & PRODUCT UPDATES
  // ─────────────────────────────────────────────────────────────────────────

  const handleUpdateProduct = (updated: BulkParsedProduct) => {
    setProducts((prev) =>
      prev.map((p) => (p.productGroupId === updated.productGroupId ? updated : p))
    );
    toast.success(`Updated ${updated.name}`);
  };

  const handleDeleteProduct = (productGroupId: string) => {
    setProducts((prev) => prev.filter((p) => p.productGroupId !== productGroupId));
    toast.success("Product removed from import batch");
  };

  const handleAddProduct = (newProduct: BulkParsedProduct) => {
    setProducts((prev) => [...prev, newProduct]);
    setCurrentStep(3);
    toast.success(`Added ${newProduct.name}`);
  };

  const handleDownloadErrorReport = () => {
    if (validationErrors.length === 0) {
      toast.success("No validation errors to report!");
      return;
    }

    const headers = ["Sheet", "Row", "Product Group ID", "Field", "Severity", "Message", "Fix"];
    const rows = validationErrors.map((e) => [
      e.sheet,
      e.row ?? "N/A",
      e.productGroupId ?? "N/A",
      `"${e.field.replace(/"/g, '""')}"`,
      e.severity.toUpperCase(),
      `"${e.message.replace(/"/g, '""')}"`,
      `"${e.fix.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kankana-silks-bulk-import-errors-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ACTIONS: FINAL TRANSACTIONAL IMPORT
  // ─────────────────────────────────────────────────────────────────────────

  const handleConfirmImport = async () => {
    if (products.length === 0) {
      toast.error("No products to import.");
      return;
    }

    setIsImporting(true);
    setIsConfirmModalOpen(false);
    toast.loading("Importing products into catalog...", { id: "bulk-import" });

    try {
      const res = await productApi.importBulkProducts(products);
      const result = res.data;

      if (!result) {
        throw new Error("Import returned empty response.");
      }

      setImportResult(result);
      setCurrentStep(4);
      queryClient.invalidateQueries({ queryKey: ["products"] });

      if (result.successful > 0 && result.failed === 0) {
        toast.success(`Successfully imported all ${result.successful} products!`, {
          id: "bulk-import",
          duration: 6000,
        });
      } else if (result.successful > 0 && result.failed > 0) {
        toast.error(
          `Imported ${result.successful} products, but ${result.failed} product(s) failed.`,
          { id: "bulk-import", duration: 8000 }
        );
      } else {
        toast.error(`Import failed. Please check error details.`, { id: "bulk-import" });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Bulk import failed", { id: "bulk-import" });
    } finally {
      setIsImporting(false);
    }
  };

  const handleRetryFailed = () => {
    if (!importResult) return;
    const failedGroupIds = new Set(
      importResult.results.filter((r) => r.status !== "success").map((r) => r.productGroupId)
    );
    setProducts((prev) => prev.filter((p) => failedGroupIds.has(p.productGroupId)));
    setImportResult(null);
    setCurrentStep(3);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <MainLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-lg text-white shadow-sm">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Bulk Product Upload
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Import simple and variable silk products, variants, SEO, and media using Excel or directly in the dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {products.length > 0 && (
              <button
                type="button"
                onClick={handleExportWorkbook}
                className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition shadow-xs flex items-center gap-1.5"
              >
                <Download className="h-4 w-4 text-emerald-600" />
                Export Workbook
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate("/admin/products")}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
            >
              Exit to Catalog
            </button>
          </div>
        </div>

        {/* Guided Step Progress Bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-2.5 p-2.5 rounded-lg text-left transition ${
                currentStep === 1
                  ? "bg-blue-50 border border-blue-300 text-blue-900 font-bold"
                  : selectedCategoryIds.length > 0
                  ? "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  : "text-slate-400"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                  currentStep === 1
                    ? "bg-blue-600 text-white"
                    : selectedCategoryIds.length > 0
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                1
              </div>
              <div>
                <p className="font-semibold">Categories</p>
                <p className="text-[11px] text-slate-500">
                  {selectedCategoryIds.length > 0
                    ? `${selectedCategoryIds.length} selected`
                    : "Choose categories"}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className={`flex items-center gap-2.5 p-2.5 rounded-lg text-left transition ${
                currentStep === 2
                  ? "bg-blue-50 border border-blue-300 text-blue-900 font-bold"
                  : products.length > 0
                  ? "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  : "text-slate-400"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                  currentStep === 2
                    ? "bg-blue-600 text-white"
                    : products.length > 0
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                2
              </div>
              <div>
                <p className="font-semibold">Upload or Enter</p>
                <p className="text-[11px] text-slate-500">Excel / Dashboard</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => products.length > 0 && setCurrentStep(3)}
              disabled={products.length === 0}
              className={`flex items-center gap-2.5 p-2.5 rounded-lg text-left transition ${
                currentStep === 3
                  ? "bg-blue-50 border border-blue-300 text-blue-900 font-bold"
                  : products.length > 0
                  ? "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  : "text-slate-300 cursor-not-allowed"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                  currentStep === 3
                    ? "bg-blue-600 text-white"
                    : validationSummary && validationSummary.errorCount === 0
                    ? "bg-emerald-500 text-white"
                    : products.length > 0
                    ? "bg-amber-500 text-white"
                    : "bg-slate-200 text-slate-400"
                }`}
              >
                3
              </div>
              <div>
                <p className="font-semibold">Review & Edit</p>
                <p className="text-[11px] text-slate-500">
                  {products.length > 0 ? `${products.length} products` : "Preview batch"}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => importResult && setCurrentStep(4)}
              disabled={!importResult}
              className={`flex items-center gap-2.5 p-2.5 rounded-lg text-left transition ${
                currentStep === 4
                  ? "bg-blue-50 border border-blue-300 text-blue-900 font-bold"
                  : importResult
                  ? "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  : "text-slate-300 cursor-not-allowed"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                  currentStep === 4
                    ? "bg-blue-600 text-white"
                    : importResult
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 text-slate-400"
                }`}
              >
                4
              </div>
              <div>
                <p className="font-semibold">Import Complete</p>
                <p className="text-[11px] text-slate-500">
                  {importResult ? `${importResult.successful} imported` : "Catalog results"}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* STEP 1: CATEGORY SELECTION & TEMPLATE DOWNLOAD                     */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {currentStep === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Step A: Select Categories Visually
                    </h2>
                    <p className="text-xs text-slate-500">
                      Select categories at any depth. The generated Excel workbook will include dropdown validation for these exact category paths.
                    </p>
                  </div>
                </div>

                <BulkCategoryTreeSelector
                  categoriesTree={categoryTree}
                  flatCategories={flatCategories}
                  selectedCategoryIds={selectedCategoryIds}
                  onChange={setSelectedCategoryIds}
                  isLoading={isLoadingCategories}
                />
              </div>
            </div>

            {/* Sidebar: Next actions */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-600 text-white rounded-lg">
                    <Download className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-950 text-sm">
                      Step B: Download Excel Template
                    </h3>
                    <p className="text-xs text-emerald-800">
                      Customized workbook with dropdown validations
                    </p>
                  </div>
                </div>

                <p className="text-xs text-emerald-800 leading-relaxed">
                  The template includes 5 worksheets (Instructions, Products, Variants, SEO, Media) with clear required field markers, sample simple and variable sarees, and dropdowns for your selected categories.
                </p>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition shadow-sm flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download .xlsx Template
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Proceed to Data Preparation
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Once you download your template or if you prefer entering products directly in the dashboard, click Next to continue.
                </p>

                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition shadow-sm flex items-center justify-center gap-2"
                >
                  <span>Continue to Step 2</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* STEP 2: PREPARE WORKBOOK OR DASHBOARD ENTRY                         */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {currentStep === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Option A: Excel File Dropzone */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Workflow A: Upload Excel File</h3>
                    <p className="text-xs text-slate-500">Fill in the workbook offline and upload it here</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Upload your completed <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">.xlsx</code> workbook. All 5 sheets (Products, Variants, SEO, Media) will be parsed and cross-validated immediately.
                </p>

                {/* Dropzone */}
                <label
                  htmlFor={fileInputId}
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-50/50 hover:bg-emerald-50/20 group block"
                >
                  <UploadCloud className="h-12 w-12 text-slate-400 group-hover:text-emerald-600 transition mb-3" />
                  <p className="text-sm font-semibold text-slate-700 group-hover:text-emerald-700">
                    Click to browse or drag & drop .xlsx workbook
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports Microsoft Excel, LibreOffice, and Google Sheets exported workbooks
                  </p>
                  <input
                    id={fileInputId}
                    type="file"
                    accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                </label>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Need the template first?</span>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                >
                  <Download className="h-3.5 w-3.5" /> Download Template
                </button>
              </div>
            </div>

            {/* Option B: Direct Dashboard Entry */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Workflow B: Add in Dashboard</h3>
                    <p className="text-xs text-slate-500">Add products and variants directly in interactive forms</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Prefer working in the browser? Add products and variants directly through our structured modal form. You can preview, live-validate, and even export your work as an Excel file anytime!
                </p>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-600">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Select category path with visual picker</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Support simple and multi-variant sarees/dhotis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Export to .xlsx anytime with full formula parity</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition shadow-sm flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Add First Product in Dashboard
                </button>

                {products.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
                  >
                    View Current Batch ({products.length} products) →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* STEP 3: PREVIEW, VALIDATE & EDIT                                    */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {currentStep === 3 && (
          <div className="space-y-5">
            {/* Validation Banner */}
            {validationSummary && (
              <div
                className={`p-5 rounded-2xl border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  validationSummary.errorCount === 0
                    ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 text-emerald-950"
                    : "bg-gradient-to-r from-amber-50 to-rose-50 border-rose-300 text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      validationSummary.errorCount === 0
                        ? "bg-emerald-600 text-white"
                        : "bg-rose-600 text-white"
                    }`}
                  >
                    {validationSummary.errorCount === 0 ? (
                      <CheckCircle2 className="h-7 w-7" />
                    ) : (
                      <AlertCircle className="h-7 w-7" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold">
                      {validationSummary.errorCount === 0
                        ? "Validation Passed — Ready for Import"
                        : `${validationSummary.errorCount} Validation Error(s) Found`}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {validationSummary.errorCount === 0
                        ? `All ${validationSummary.totalProducts} products (${validationSummary.totalVariants} variants) passed validation.`
                        : "Required fields or data integrity issues need correction before final import."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRevalidateProducts}
                    className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition shadow-xs flex items-center gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-blue-600" />
                    Re-Validate
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsConfirmModalOpen(true)}
                    disabled={products.length === 0}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition shadow-md hover:shadow-lg flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Confirm & Import
                  </button>
                </div>
              </div>
            )}

            {/* Interactive Preview Table */}
            <BulkProductPreviewTable
              products={products}
              summary={validationSummary}
              errors={validationErrors}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onAddProduct={() => setIsAddModalOpen(true)}
              onDownloadErrorReport={handleDownloadErrorReport}
            />
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* STEP 4: IMPORT RESULTS REPORT                                       */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {currentStep === 4 && importResult && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="text-center py-4 space-y-2">
              <div
                className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-lg ${
                  importResult.successful === importResult.total
                    ? "bg-emerald-100 text-emerald-600"
                    : importResult.successful > 0
                    ? "bg-amber-100 text-amber-600"
                    : "bg-rose-100 text-rose-600"
                }`}
              >
                {importResult.successful === importResult.total ? (
                  <CheckCircle2 className="h-10 w-10" />
                ) : (
                  <AlertCircle className="h-10 w-10" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                {importResult.successful === importResult.total
                  ? "Catalog Import Complete!"
                  : "Import Finished with Mixed Results"}
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Each product and its variants were processed within an atomic database transaction.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <p className="text-xs text-slate-500 font-semibold uppercase">Total Submitted</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{importResult.total}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                <p className="text-xs text-emerald-700 font-semibold uppercase">Successful</p>
                <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                  {importResult.successful}
                </p>
              </div>
              <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-center">
                <p className="text-xs text-rose-700 font-semibold uppercase">Failed</p>
                <p className="text-2xl font-extrabold text-rose-600 mt-1">{importResult.failed}</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-center">
                <p className="text-xs text-amber-700 font-semibold uppercase">Skipped</p>
                <p className="text-2xl font-extrabold text-amber-600 mt-1">{importResult.skipped}</p>
              </div>
            </div>

            {/* Detailed Results Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider">
                Product Import Breakdown
              </div>
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Product Group ID</th>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Details / Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importResult.results.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                          {r.productGroupId}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{r.name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{r.sku || "—"}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                              r.status === "success"
                                ? "bg-emerald-100 text-emerald-800"
                                : r.status === "failed"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {r.status === "success" ? (
                            <span className="text-emerald-700 font-medium">
                              Created product #{r.productId}
                            </span>
                          ) : (
                            <span className="text-rose-700">{r.error || "Failed"}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
              {importResult.failed > 0 || importResult.skipped > 0 ? (
                <button
                  type="button"
                  onClick={handleRetryFailed}
                  className="px-4 py-2 bg-amber-50 border border-amber-300 text-amber-900 font-semibold text-xs rounded-lg hover:bg-amber-100 transition flex items-center gap-1.5"
                >
                  <RotateCcw className="h-4 w-4" />
                  Keep & Fix Failed Products
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setProducts([]);
                    setImportResult(null);
                    setCurrentStep(1);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
                >
                  Start New Import
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/admin/products")}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition shadow-sm flex items-center gap-1.5"
                >
                  <Package className="h-4 w-4" />
                  View Products Catalog
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* ADD PRODUCT MODAL                                                   */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <BulkAddProductModal
          isOpen={isAddModalOpen}
          categoryPaths={availableCategoryPaths}
          warehouses={warehouses}
          existingGroupIds={products.map((p) => p.productGroupId)}
          onClose={() => setIsAddModalOpen(false)}
          onAddProduct={handleAddProduct}
        />

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* IMPORT CONFIRMATION MODAL                                           */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {isConfirmModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                <ShieldCheck className="h-6 w-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Confirm Product Import</h3>
                <p className="text-xs text-slate-500">
                  You are about to import {products.length} products into the live catalog.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-700">
                <div className="flex justify-between">
                  <span>Total Products:</span>
                  <strong className="text-slate-900">{products.length}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Valid Products:</span>
                  <strong className="text-emerald-700">
                    {validationSummary?.validProducts ?? products.filter((p) => p.isValid !== false).length}
                  </strong>
                </div>
                {validationSummary && validationSummary.invalidProducts > 0 && (
                  <div className="flex justify-between text-rose-700 font-semibold">
                    <span>Products with Errors (will be skipped):</span>
                    <span>{validationSummary.invalidProducts}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 italic">
                  * Each product is imported atomically. If one product encounters an error, only that product will fail; already-committed products remain saved safely.
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(false)}
                  disabled={isImporting}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={isImporting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  {isImporting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Importing...
                    </>
                  ) : (
                    "Proceed with Import"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default BulkProductUploadPage;

