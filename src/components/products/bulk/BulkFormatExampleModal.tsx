import React, { useState } from "react";
import {
  X,
  Copy,
  CheckCircle2,
  Download,
  FileCode,
  Layers,
  Box,
  ArrowRight,
  Info,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface BulkFormatExampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseFormat: (jsonString: string) => void;
  hasExistingInput: boolean;
}

export const SIMPLE_PRODUCT_TEMPLATE = [
  {
    productGroupId: "KSS-001",
    name: "Kanchipuram Silk Saree - Jade Green",
    productType: "simple",
    categoryPath: "Sarees > Pure Kanchipuram Silks",
    description: "Traditional handwoven pure Kanchipuram silk saree in Jade Green.",
    sku: "KSS-001",
    basePrice: 54999,
    sellingPrice: 49999,
    stock: {
      warehouseId: "WH-01-ID",
      warehouseCode: "WH-01",
      quantity: 25,
      lowStockThreshold: 5,
    },
    weight: 0.8,
    length: 10,
    breadth: 10,
    height: 5,
    hsnCode: "500720",
    artisanName: "Master Weaver Ravi",
    artisanAbout: "3rd generation master silk weaver from Kanchipuram cluster.",
    artisanLocation: "Kanchipuram, Tamil Nadu",
    allowOutOfStockOrders: false,
    hasVideoConsultation: true,
    videoPurchasingEnabled: true,
    videoConsultationNote: "Live video drape available upon appointment.",
    isActive: true,
    specifications: [
      { key: "Fabric", value: "Pure Kanchipuram Silk" },
      { key: "Color", value: "Jade Green" },
      { key: "Zari Type", value: "Pure Gold Zari" },
      { key: "Weave Technique", value: "Korvai Handloom" },
    ],
    metaTitle: "Jade Green Kanchipuram Silk Saree | Kankana Silks",
    metaDesc: "Shop authentic traditional handwoven Jade Green Kanchipuram silk saree with pure gold zari.",
    seo: {
      metaTitle: "Jade Green Kanchipuram Silk Saree | Kankana Silks",
      metaDesc: "Shop authentic traditional handwoven Jade Green Kanchipuram silk saree with pure gold zari.",
      slug: "jade-green-kanchipuram-silk-saree",
      schemaMarkup: "",
    },
    media: [
      {
        type: "IMAGE",
        url: "https://pub-2fbc147a469a4993ad805cbbfb7f8373.r2.dev/products/kss-001-front.jpg",
        altText: "Jade Green saree front view",
        order: 0,
        isActive: true,
      },
      {
        type: "IMAGE",
        url: "https://pub-2fbc147a469a4993ad805cbbfb7f8373.r2.dev/products/kss-001-pallu.jpg",
        altText: "Jade Green saree pallu detail",
        order: 1,
        isActive: true,
      },
    ],
  },
];

export const VARIABLE_PRODUCT_TEMPLATE = [
  {
    productGroupId: "KSS-002",
    name: "Kanchipuram Silk Saree",
    productType: "variable",
    categoryPath: "Sarees > Pure Kanchipuram Silks",
    description: "Traditional handwoven Kanchipuram silk saree available in multiple colors.",
    basePrice: 8000,
    sellingPrice: 6500,
    weight: 0.8,
    length: 10,
    breadth: 10,
    height: 5,
    hsnCode: "500720",
    artisanName: "Weavers Cooperative",
    artisanAbout: "Handloom artisans weaving traditional silk sarees since 1974.",
    artisanLocation: "Kanchipuram, Tamil Nadu",
    allowOutOfStockOrders: false,
    hasVideoConsultation: true,
    videoPurchasingEnabled: false,
    videoConsultationNote: "Consultation available on request.",
    isActive: true,
    specifications: [
      { key: "Fabric", value: "Pure Kanchipuram Silk" },
      { key: "Weave", value: "Handloom" },
    ],
    metaTitle: "Kanchipuram Pure Silk Saree | Kankana Silks",
    metaDesc: "Explore traditional handwoven Kanchipuram silk sarees in vibrant colors with authentic zari.",
    seo: {
      metaTitle: "Kanchipuram Pure Silk Saree | Kankana Silks",
      metaDesc: "Explore traditional handwoven Kanchipuram silk sarees in vibrant colors with authentic zari.",
      slug: "kanchipuram-pure-silk-saree",
    },
    media: [
      {
        type: "IMAGE",
        url: "https://pub-2fbc147a469a4993ad805cbbfb7f8373.r2.dev/products/kss-002-main.jpg",
        altText: "Kanchipuram silk saree main image",
        order: 0,
        isActive: true,
      },
    ],
    variants: [
      {
        title: "Crimson Red — Free Size",
        sku: "KSS-002-RED",
        color: "Crimson Red",
        size: "Free Size",
        fabric: "Pure Silk",
        attributes: {
          Color: "Crimson Red",
          Size: "Free Size",
          Fabric: "Pure Silk",
        },
        basePrice: 6800,
        sellingPrice: 6500,
        price: 6500,
        stock: {
          warehouseId: "WH-01-ID",
          warehouseCode: "WH-01",
          quantity: 10,
          lowStockThreshold: 2,
        },
        weight: 0.8,
        length: 10,
        breadth: 10,
        height: 5,
        media: [
          {
            type: "IMAGE",
            url: "https://pub-2fbc147a469a4993ad805cbbfb7f8373.r2.dev/products/kss-002-red.jpg",
            altText: "Crimson Red saree detail",
            order: 0,
            isActive: true,
          },
        ],
      },
      {
        title: "Royal Blue — Free Size",
        sku: "KSS-002-BLU",
        color: "Royal Blue",
        size: "Free Size",
        fabric: "Pure Silk",
        attributes: {
          Color: "Royal Blue",
          Size: "Free Size",
          Fabric: "Pure Silk",
        },
        basePrice: 7000,
        sellingPrice: 6700,
        price: 6700,
        stock: {
          warehouseId: "WH-01-ID",
          warehouseCode: "WH-01",
          quantity: 15,
          lowStockThreshold: 3,
        },
        weight: 0.8,
        length: 10,
        breadth: 10,
        height: 5,
        media: [
          {
            type: "IMAGE",
            url: "https://pub-2fbc147a469a4993ad805cbbfb7f8373.r2.dev/products/kss-002-blue.jpg",
            altText: "Royal Blue saree detail",
            order: 0,
            isActive: true,
          },
        ],
      },
    ],
  },
];

export const BulkFormatExampleModal: React.FC<BulkFormatExampleModalProps> = ({
  isOpen,
  onClose,
  onUseFormat,
  hasExistingInput,
}) => {
  const [activeTab, setActiveTab] = useState<"simple" | "variable">("simple");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentTemplate =
    activeTab === "simple" ? SIMPLE_PRODUCT_TEMPLATE : VARIABLE_PRODUCT_TEMPLATE;
  const jsonString = JSON.stringify(currentTemplate, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString).then(() => {
      setCopied(true);
      toast.success("JSON template copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const filename =
      activeTab === "simple"
        ? "kankana-silks-simple-product-template.json"
        : "kankana-silks-variable-product-template.json";
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Template downloaded as ${filename}`);
  };

  const handleUseThisFormat = () => {
    if (
      hasExistingInput &&
      !window.confirm(
        "Loading this template will replace the content currently in your input editor. Do you want to continue?"
      )
    ) {
      return;
    }
    onUseFormat(jsonString);
    onClose();
    toast.success("Example template loaded into the JSON editor!");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Supported JSON Product Formats</h3>
              <p className="text-xs text-slate-500">
                Complete schemas for Simple and Variable products with Stock, Media, and SEO
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("simple")}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === "simple"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Box className="h-3.5 w-3.5" />
              Simple Product
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("variable")}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === "variable"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Variable Product (with Variants)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg text-slate-700 hover:bg-white transition bg-slate-50"
            >
              {copied ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied" : "Copy JSON"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg text-slate-700 hover:bg-white transition bg-slate-50"
            >
              <Download className="h-3.5 w-3.5 text-indigo-600" />
              Download Template
            </button>
            <button
              type="button"
              onClick={handleUseThisFormat}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-xs"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              Use This Format
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Explanation banner */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 text-xs space-y-2">
            <div className="flex items-center gap-2 text-indigo-900 font-semibold">
              <Info className="h-4 w-4 text-indigo-600 shrink-0" />
              {activeTab === "simple"
                ? "Simple Product Specification"
                : "Variable Product Specification"}
            </div>
            <p className="text-indigo-800 leading-relaxed">
              {activeTab === "simple" ? (
                <>
                  A <strong>simple product</strong> has no variants. Its inventory, stock quantity,
                  warehouse, specifications, and media belong directly to the product root.
                </>
              ) : (
                <>
                  A <strong>variable product</strong> defines a product group with multiple child
                  variants. Each variant must specify its own SKU, title, size/color/fabric
                  attributes, price, inventory quantity, warehouse, and optional variant-specific
                  images.
                </>
              )}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-indigo-900 pt-1 border-t border-indigo-200">
              <div>
                <strong>Required fields:</strong> <code>productGroupId</code>, <code>name</code>,{" "}
                <code>categoryPath</code>, <code>basePrice</code>, <code>sellingPrice</code>,{" "}
                {activeTab === "simple" ? (
                  <code>stock (warehouseId & quantity)</code>
                ) : (
                  <code>variants (at least 1 with sku & price)</code>
                )}
              </div>
              <div>
                <strong>Category resolution:</strong> <code>categoryPath</code> is automatically
                resolved to its canonical ID and name (e.g. "Sarees &gt; Pure Kanchipuram Silks").
              </div>
              <div>
                <strong>Google Drive Images:</strong> Image URLs can be direct links (R2/S3) or
                filenames/Drive IDs matched via Google Drive Matching on this page.
              </div>
              <div>
                <strong>Inventory:</strong> Warehouse identifiers should correspond to valid
                warehouses. If omitted, default active warehouse is automatically assigned.
              </div>
            </div>
          </div>

          {/* JSON code block */}
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-900 text-slate-100 shadow-inner">
            <div className="px-4 py-2 border-b border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>{activeTab === "simple" ? "simple-product.json" : "variable-product.json"}</span>
              <span className="text-[10px] text-slate-500">Read-only template</span>
            </div>
            <pre className="p-4 text-xs font-mono leading-relaxed overflow-x-auto text-emerald-300 max-h-96">
              {jsonString}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-white shrink-0">
          <p className="text-xs text-slate-500">
            Click <strong>Use This Format</strong> to start editing right away.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleUseThisFormat}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              Use This Format
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

