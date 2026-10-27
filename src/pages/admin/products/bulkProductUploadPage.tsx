/**
 * Bulk Product Upload Page — single-page workspace
 *
 * Sections (all on one scrollable page, no wizard):
 *   A. Header + Actions
 *   B. Raw Text / File Input
 *   C. Parsed Products Table
 *   D. Google Drive Image Matching (side panel on ≥1280px, below on smaller)
 *   E. Validation Summary
 *   F. Import Progress
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Download,
  Edit2,
  ExternalLink,
  FileSpreadsheet,
  FolderOpen,
  Image as ImageIcon,
  Info,
  Layers,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  UploadCloud,
  X,
  XCircle,
  ZapIcon,
  Code,
  Copy,
} from "lucide-react";

import { MainLayout } from "@/components/layouts/mainLayout";
import { BackButton } from "@/components/ui/BackButton";
import { BulkProductPreviewTable } from "@/components/products/bulk/BulkProductPreviewTable";
import { BulkProductEditorModal } from "@/components/products/bulk/BulkProductEditorModal";
import { BulkAddProductModal } from "@/components/products/bulk/BulkAddProductModal";
import { BulkFormatExampleModal } from "@/components/products/bulk/BulkFormatExampleModal";
import { productApi } from "@/lib/api/product.api";
import {
  normalizeProduct,
  normalizeProducts,
  resolveCategory,
  validateBulkProduct,
} from "@/lib/utils/bulkProductNormalization";
import { applyDriveMatchesToProducts } from "@/lib/utils/bulkImageUtils";
import type {
  BulkImportDraft,
  BulkImportJob,
  BulkParsedProduct,
  BulkValidationError,
  BulkValidationSummary,
  DriveFolder,
  ImageMatchResult,
  MatchedEntry,
  AmbiguousEntry,
  BulkCategoryNode,
  BulkCategoryLookup,
  BulkWarehouse,
} from "@/lib/types/product/bulkProduct";

// ─── helpers ─────────────────────────────────────────────────────────────────

function classNames(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function humanError(err: unknown): string {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  const e = err as any;
  // Never expose tokens / stack traces
  return e?.message || e?.error || "Unexpected error";
}

function extractProducts(parsedData: any): BulkParsedProduct[] {
  if (!parsedData) return [];
  if (Array.isArray(parsedData)) return parsedData;
  if (Array.isArray(parsedData.products)) return parsedData.products;
  return [];
}

function extractErrors(parsedData: any): BulkValidationError[] {
  if (!parsedData) return [];
  if (Array.isArray(parsedData.errors)) return parsedData.errors;
  const prods = extractProducts(parsedData);
  return prods.flatMap((p) => p.errors ?? []);
}

function summaryFromProducts(
  products: BulkParsedProduct[],
): BulkValidationSummary {
  const errors: BulkValidationError[] = products.flatMap((p) => p.errors ?? []);
  return {
    totalProducts: products.length,
    simpleProducts: products.filter((p) => p.productType === "simple").length,
    variableProducts: products.filter((p) => p.productType === "variable")
      .length,
    totalVariants: products.reduce((s, p) => s + (p.variants?.length ?? 0), 0),
    totalMedia: products.reduce(
      (s, p) =>
        s +
        (p.allImages?.length ??
          (p.media?.length ?? 0) +
            (p.variants?.reduce((vs, v) => vs + (v.media?.length ?? 0), 0) ??
              0)),
      0,
    ),
    validProducts: products.filter(
      (p) =>
        p.isValid !== false && !p.errors?.some((e) => e.severity === "error"),
    ).length,
    invalidProducts: products.filter(
      (p) =>
        p.isValid === false || p.errors?.some((e) => e.severity === "error"),
    ).length,
    errorCount: errors.filter((e) => e.severity === "error").length,
    warningCount: errors.filter((e) => e.severity === "warning").length,
  };
}

const POLLING_INTERVAL = 2500; // ms

// ─── Draft Selector modal ────────────────────────────────────────────────────

interface DraftSelectorProps {
  onSelect: (draft: BulkImportDraft) => void;
  onClose: () => void;
}

const DraftSelector: React.FC<DraftSelectorProps> = ({ onSelect, onClose }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["bulk-drafts"],
    queryFn: async () => {
      const res = await productApi.listDrafts();
      return res.data ?? [];
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Open Draft</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-5 max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading drafts…
            </div>
          )}
          {error && (
            <p className="text-sm text-red-600 py-4">{humanError(error)}</p>
          )}
          {data?.length === 0 && (
            <p className="text-sm text-gray-500 py-4 text-center">
              No saved drafts yet.
            </p>
          )}
          <div className="space-y-2">
            {data?.map((draft) => (
              <button
                key={draft.id}
                onClick={() => onSelect(draft)}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800 truncate">
                    Draft #{draft.id.slice(-8)}
                  </span>
                  <span
                    className={classNames(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      draft.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : draft.status === "FAILED"
                          ? "bg-red-100 text-red-700"
                          : draft.status === "READY_FOR_IMPORT"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600",
                    )}
                  >
                    {draft.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {draft.parsedData?.length ?? 0} product(s) ·{" "}
                  {new Date(draft.updatedAt).toLocaleString()}
                </p>
                {draft.rawInput && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {draft.rawInput.slice(0, 80)}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Delete-draft confirm modal ───────────────────────────────────────────────

interface DeleteDraftModalProps {
  draftId: string;
  onConfirm: () => void;
  onClose: () => void;
  isDeleting: boolean;
}

const DeleteDraftModal: React.FC<DeleteDraftModalProps> = ({
  draftId,
  onConfirm,
  onClose,
  isDeleting,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-2">
        Delete Draft?
      </h2>
      <p className="text-sm text-gray-600 mb-5">
        Draft #{draftId.slice(-8)} and all its data will be permanently deleted.
        This cannot be undone.
      </p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isDeleting}
          className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {isDeleting ? "Deleting…" : "Delete Draft"}
        </button>
      </div>
    </div>
  </div>
);

// ─── Drive Matching Panel ────────────────────────────────────────────────────

/** Build the backend Google OAuth redirect URL, passing the access token so the
 *  backend can identify the user without a separate login step. */
function buildDriveConnectUrl(draftId?: string | null): string {
  const token = localStorage.getItem("accessToken") ?? "";
  const apiBase = (
    import.meta.env.VITE_API_URL || "http://localhost:3000/api"
  ).replace(/\/+$/, "");
  const params = new URLSearchParams({ token });
  if (draftId) params.set("draftId", draftId);
  return `${apiBase}/auth/google?${params.toString()}`;
}

interface DriveMatchingPanelProps {
  draftId: string | null;
  imageMatches: ImageMatchResult | null;
  confirmedAssignments: Record<string, string>;
  onMatchComplete: (
    matches: ImageMatchResult,
    assignments: Record<string, string>,
  ) => void;
  getDriveProxyUrl: (fileId: string) => string;
  onPrepareDraft?: () => Promise<void>;
}

const DriveMatchingPanel: React.FC<DriveMatchingPanelProps> = ({
  draftId,
  imageMatches,
  confirmedAssignments,
  onMatchComplete,
  getDriveProxyUrl,
  onPrepareDraft,
}) => {
  const [driveConnected, setDriveConnected] = useState<boolean | null>(null); // null = loading
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [matching, setMatching] = useState(false);
  const [folderError, setFolderError] = useState<string | null>(null);
  const [showAmbiguous, setShowAmbiguous] = useState(false);
  const [pendingAssignments, setPendingAssignments] = useState<
    Record<string, string>
  >(confirmedAssignments ?? {});

  // Check connection status first, then load folders if connected
  const checkAndLoadFolders = useCallback(
    async (forceReload = false) => {
      setLoadingFolders(true);
      setFolderError(null);
      try {
        // 1. Check if Drive is connected for this user
        const statusRes = await productApi.getDriveStatus(draftId ?? undefined);
        const { connected } = statusRes.data ?? { connected: false };
        setDriveConnected(connected);

        if (!connected) {
          setLoadingFolders(false);
          return;
        }

        // 2. Drive is connected — load the folder list
        const res = await productApi.listDriveFolders();
        const raw = res.data;
        const folderList = Array.isArray(raw)
          ? raw
          : Array.isArray((raw as any)?.folders)
            ? (raw as any).folders
            : [];
        setFolders(folderList);
      } catch (err: any) {
        const msg = humanError(err);
        setDriveConnected(false);
        setFolderError(msg);
      } finally {
        setLoadingFolders(false);
      }
    },
    [draftId],
  );

  // On mount — also handle the ?drive_connected=true callback from Google OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const justConnected = params.get("drive_connected") === "true";
    if (justConnected) {
      // Clean the query param so a page refresh doesn't re-trigger
      params.delete("drive_connected");
      const newSearch = params.toString();
      window.history.replaceState(
        {},
        "",
        window.location.pathname + (newSearch ? `?${newSearch}` : ""),
      );
      toast.success("Google Drive connected successfully!");
    }
    checkAndLoadFolders();
  }, [checkAndLoadFolders]);

  const handleConnectDrive = () => {
    // Navigate the current tab to the backend OAuth redirect endpoint.
    // The backend will redirect to Google, then back to /admin/products/bulk-upload?drive_connected=true
    window.location.href = buildDriveConnectUrl(draftId);
  };

  const loadFolders = useCallback(
    () => checkAndLoadFolders(true),
    [checkAndLoadFolders],
  );

  const handleMatch = async () => {
    if (!draftId || !selectedFolderId) return;
    setMatching(true);
    try {
      if (onPrepareDraft) {
        await onPrepareDraft();
      }
      const res = await productApi.matchDriveImages(draftId, selectedFolderId);
      const matchResult: ImageMatchResult =
        (res.data as any)?.imageMatches || (res.data as any);
      if (matchResult && Array.isArray(matchResult.matched)) {
        await productApi.confirmDriveAssignment(draftId, pendingAssignments);
        onMatchComplete(matchResult, pendingAssignments);
        toast.success(
          `Matched ${matchResult.matched.length} image(s). ` +
            (matchResult.missing.length > 0
              ? `${matchResult.missing.length} missing.`
              : ""),
        );
      } else {
        toast.error("Invalid image matching response from server.");
      }
    } catch (err) {
      toast.error(humanError(err));
    } finally {
      setMatching(false);
    }
  };

  const assignCandidate = async (entry: AmbiguousEntry, fileId: string) => {
    const newAssignments = {
      ...pendingAssignments,
      [String(entry.mediaIndex)]: fileId,
    };
    setPendingAssignments(newAssignments);
    if (draftId) {
      try {
        await productApi.confirmDriveAssignment(draftId, newAssignments);
        toast.success("Assignment saved.");
      } catch {
        toast.error("Failed to save assignment.");
      }
    }
  };

  const stats = imageMatches
    ? {
        matched: imageMatches.matched.length,
        missing: imageMatches.missing.length,
        ambiguous: imageMatches.ambiguous.length,
        duplicates: imageMatches.duplicates.length,
        total: imageMatches.totalMedia,
      }
    : null;

  // Show loading spinner while checking status
  if (driveConnected === null) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-600" />
            Google Drive Image Matching
          </h3>
        </div>
        <div className="p-6 flex items-center justify-center text-gray-400 gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Checking Drive connection…</span>
        </div>
      </div>
    );
  }

  // Show connect prompt when Drive is not yet authorized
  if (!driveConnected) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-600" />
            Google Drive Image Matching
          </h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-800">
                Google Drive not connected
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Connect your Google account to browse Drive folders and match
                images to your products automatically.
              </p>
            </div>
          </div>

          {folderError && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2">
              {folderError}
            </p>
          )}

          <button
            onClick={handleConnectDrive}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Connect to Google Drive
          </button>

          <p className="text-xs text-gray-400 text-center">
            You will be redirected to Google to authorize read-only Drive
            access. After approving, you'll return here automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-indigo-600" />
          Google Drive Image Matching
        </h3>
        {/* Connected badge + disconnect link */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
            <CheckCircle2 className="w-3 h-3" />
            Connected
          </span>
          <button
            onClick={handleConnectDrive}
            title="Re-authorize Google Drive"
            className="text-xs text-gray-400 hover:text-indigo-600 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Folder selector */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Drive Folder
          </label>
          <div className="flex gap-2">
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              disabled={loadingFolders}
            >
              <option value="">Select a folder…</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <button
              onClick={loadFolders}
              disabled={loadingFolders}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50"
              title="Refresh folders"
            >
              {loadingFolders ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </button>
          </div>
          {folderError && (
            <p className="text-xs text-red-600 mt-1">{folderError}</p>
          )}
          {folders.length === 0 && !loadingFolders && !folderError && (
            <p className="text-xs text-gray-400 mt-1">
              No folders found in your Drive.
            </p>
          )}
        </div>

        {/* Match button */}
        <button
          onClick={handleMatch}
          disabled={!draftId || !selectedFolderId || matching}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {matching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Matching images…
            </>
          ) : (
            <>
              <ZapIcon className="w-4 h-4" />
              Match Images
            </>
          )}
        </button>

        {!draftId && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2">
            Save or create a draft first to match images.
          </p>
        )}

        {/* Stats */}
        {stats && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-green-50 rounded-lg p-2 text-center">
                <span className="block text-lg font-bold text-green-700">
                  {stats.matched}
                </span>
                <span className="text-xs text-green-600">Matched</span>
              </div>
              <div className="bg-red-50 rounded-lg p-2 text-center">
                <span className="block text-lg font-bold text-red-700">
                  {stats.missing}
                </span>
                <span className="text-xs text-red-600">Missing</span>
              </div>
              <div className="bg-amber-50 rounded-lg p-2 text-center">
                <span className="block text-lg font-bold text-amber-700">
                  {stats.ambiguous}
                </span>
                <span className="text-xs text-amber-600">Ambiguous</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <span className="block text-lg font-bold text-gray-700">
                  {stats.duplicates}
                </span>
                <span className="text-xs text-gray-600">Duplicates</span>
              </div>
            </div>

            {/* Matched thumbnails (first 6) */}
            {imageMatches!.matched.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">
                  Matched Images
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {imageMatches!.matched
                    .slice(0, 6)
                    .map((m: MatchedEntry, i) => (
                      <div
                        key={i}
                        className="relative w-12 h-12 rounded border border-gray-200 overflow-hidden bg-gray-100"
                        title={m.file.name}
                      >
                        {m.file.thumbnailLink ? (
                          <img
                            src={getDriveProxyUrl(m.file.id)}
                            alt={m.file.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <ImageIcon className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                    ))}
                  {imageMatches!.matched.length > 6 && (
                    <div className="w-12 h-12 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-500 bg-gray-50">
                      +{imageMatches!.matched.length - 6}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ambiguous — manual resolve */}
            {imageMatches!.ambiguous.length > 0 && (
              <div>
                <button
                  onClick={() => setShowAmbiguous((s) => !s)}
                  className="text-xs text-amber-700 font-medium flex items-center gap-1 hover:underline"
                >
                  {showAmbiguous ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                  Resolve {imageMatches!.ambiguous.length} ambiguous match(es)
                </button>
                {showAmbiguous && (
                  <div className="mt-2 space-y-3">
                    {imageMatches!.ambiguous.map(
                      (entry: AmbiguousEntry, ei) => (
                        <div
                          key={ei}
                          className="border border-amber-200 rounded-lg p-2 bg-amber-50"
                        >
                          <p className="text-xs font-medium text-amber-800 mb-1 truncate">
                            {entry.reference || `Media #${entry.mediaIndex}`}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {entry.candidates.map((c) => (
                              <button
                                key={c.id}
                                onClick={() => assignCandidate(entry, c.id)}
                                className={classNames(
                                  "relative w-14 h-14 rounded border overflow-hidden",
                                  pendingAssignments[
                                    String(entry.mediaIndex)
                                  ] === c.id
                                    ? "border-indigo-500 ring-2 ring-indigo-300"
                                    : "border-gray-300 hover:border-indigo-400",
                                )}
                                title={c.name}
                              >
                                {c.thumbnailLink ? (
                                  <img
                                    src={getDriveProxyUrl(c.id)}
                                    alt={c.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (
                                        e.target as HTMLImageElement
                                      ).style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <div className="flex items-center justify-center h-full bg-gray-100">
                                    <ImageIcon className="w-4 h-4 text-gray-400" />
                                  </div>
                                )}
                                {pendingAssignments[
                                  String(entry.mediaIndex)
                                ] === c.id && (
                                  <div className="absolute top-0 right-0 bg-indigo-600 rounded-bl p-0.5">
                                    <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-amber-700 mt-1">
                            {entry.productGroupId &&
                              `Product: ${entry.productGroupId}`}
                            {entry.variantSku &&
                              ` · Variant: ${entry.variantSku}`}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Missing refs */}
            {imageMatches!.missing.length > 0 && (
              <div className="bg-red-50 rounded-lg p-2">
                <p className="text-xs font-medium text-red-700 mb-1">
                  Missing ({imageMatches!.missing.length})
                </p>
                <ul className="text-xs text-red-600 space-y-0.5 max-h-20 overflow-y-auto">
                  {imageMatches!.missing.map((m, i) => (
                    <li key={i} className="truncate">
                      {m.reference || `Media #${m.mediaIndex}`}
                      {m.productGroupId && ` — ${m.productGroupId}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Validation Summary ───────────────────────────────────────────────────────

interface ValidationSummaryProps {
  summary: BulkValidationSummary | undefined;
  imageMatches: ImageMatchResult | null;
  onFilterChange: (filter: "all" | "valid" | "error" | "warning") => void;
  activeFilter: "all" | "valid" | "error" | "warning";
}

const ValidationSummaryPanel: React.FC<ValidationSummaryProps> = ({
  summary,
  imageMatches,
  onFilterChange,
  activeFilter,
}) => {
  if (!summary) return null;

  const hasBlockers = summary.errorCount > 0;
  const matchedCount = imageMatches?.matched.length ?? 0;
  const unresolvedCount =
    (imageMatches?.missing.length ?? 0) + (imageMatches?.ambiguous.length ?? 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">
          Validation Summary
        </h3>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-gray-50 rounded-lg p-2">
            <span className="block text-base font-bold text-gray-900">
              {summary.totalProducts}
            </span>
            <span className="text-xs text-gray-500">Products</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <span className="block text-base font-bold text-gray-900">
              {summary.totalVariants}
            </span>
            <span className="text-xs text-gray-500">Variants</span>
          </div>
          <div
            className={classNames(
              "rounded-lg p-2",
              matchedCount > 0 ? "bg-green-50" : "bg-gray-50",
            )}
          >
            <span
              className={classNames(
                "block text-base font-bold",
                matchedCount > 0 ? "text-green-700" : "text-gray-900",
              )}
            >
              {matchedCount}/{imageMatches?.totalMedia ?? summary.totalMedia}
            </span>
            <span className="text-xs text-gray-500">Images matched</span>
          </div>
          <div
            className={classNames(
              "rounded-lg p-2",
              unresolvedCount > 0 ? "bg-amber-50" : "bg-gray-50",
            )}
          >
            <span
              className={classNames(
                "block text-base font-bold",
                unresolvedCount > 0 ? "text-amber-700" : "text-gray-900",
              )}
            >
              {unresolvedCount}
            </span>
            <span className="text-xs text-gray-500">Unresolved</span>
          </div>
        </div>

        {/* Blocking errors */}
        {hasBlockers && (
          <div className="flex items-start gap-2 bg-red-50 rounded-lg p-2">
            <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-red-700">
                {summary.errorCount} blocking error(s)
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Fix all errors before importing.
              </p>
            </div>
          </div>
        )}
        {summary.warningCount > 0 && (
          <div className="flex items-start gap-2 bg-amber-50 rounded-lg p-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              {summary.warningCount} warning(s) — import still allowed.
            </p>
          </div>
        )}
        {!hasBlockers && summary.totalProducts > 0 && (
          <div className="flex items-start gap-2 bg-green-50 rounded-lg p-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
            <p className="text-xs text-green-700">
              All {summary.validProducts} product(s) are valid.
            </p>
          </div>
        )}

        {/* Filter buttons */}
        {summary.totalProducts > 0 && (
          <div className="flex gap-1.5">
            {(["all", "valid", "error", "warning"] as const).map((f) => (
              <button
                key={f}
                onClick={() => onFilterChange(f)}
                className={classNames(
                  "flex-1 text-xs py-1.5 rounded-md border transition-colors font-medium",
                  activeFilter === f
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50",
                )}
              >
                {f === "all"
                  ? "All"
                  : f === "valid"
                    ? "Valid"
                    : f === "error"
                      ? "Errors"
                      : "Warnings"}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Import Progress Panel ────────────────────────────────────────────────────

interface ImportProgressPanelProps {
  job: BulkImportJob | null;
  onRetry: () => void;
  isRetrying: boolean;
}

const ImportProgressPanel: React.FC<ImportProgressPanelProps> = ({
  job,
  onRetry,
  isRetrying,
}) => {
  if (!job) return null;

  const pct =
    job.total > 0
      ? Math.round((job.processed / job.total) * 100)
      : (job.progress ?? 0);
  const isDone = job.status === "completed" || job.status === "failed";
  const isRunning = job.status === "pending" || job.status === "processing";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mt-4">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          {isRunning && (
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          )}
          {job.status === "completed" && (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          )}
          {job.status === "failed" && (
            <XCircle className="w-4 h-4 text-red-600" />
          )}
          Import Progress
        </h3>
        <span
          className={classNames(
            "text-xs px-2 py-0.5 rounded-full font-medium",
            job.status === "completed"
              ? "bg-green-100 text-green-700"
              : job.status === "failed"
                ? "bg-red-100 text-red-700"
                : job.status === "processing"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-600",
          )}
        >
          {job.status}
        </span>
      </div>
      <div className="p-4 space-y-3">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>
              {job.processed}/{job.total} processed
            </span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={classNames(
                "h-full rounded-full transition-all duration-500",
                job.status === "failed" ? "bg-red-500" : "bg-indigo-600",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Counts */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-green-50 rounded-lg p-2">
            <span className="block text-sm font-bold text-green-700">
              {job.successful}
            </span>
            <span className="text-xs text-green-600">Successful</span>
          </div>
          <div className="bg-red-50 rounded-lg p-2">
            <span className="block text-sm font-bold text-red-700">
              {job.failed}
            </span>
            <span className="text-xs text-red-600">Failed</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <span className="block text-sm font-bold text-gray-700">
              {job.total - job.processed}
            </span>
            <span className="text-xs text-gray-600">Remaining</span>
          </div>
        </div>

        {/* Job-level error */}
        {job.error && (
          <div className="bg-red-50 rounded-lg p-3 text-xs text-red-700">
            {job.error}
          </div>
        )}

        {/* Per-item results */}
        {job.results && job.results.length > 0 && (
          <div className="max-h-48 overflow-y-auto space-y-1">
            {job.results.map((r, i) => (
              <div
                key={i}
                className={classNames(
                  "flex items-center justify-between text-xs p-2 rounded",
                  r.status === "success"
                    ? "bg-green-50 text-green-700"
                    : r.status === "failed"
                      ? "bg-red-50 text-red-700"
                      : "bg-gray-50 text-gray-600",
                )}
              >
                <span className="truncate font-medium">
                  {r.name || r.productGroupId}
                </span>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {r.status === "success" && (
                    <CheckCircle2 className="w-3 h-3" />
                  )}
                  {r.status === "failed" && (
                    <span
                      className="text-red-600 max-w-[120px] truncate"
                      title={r.error}
                    >
                      {r.error}
                    </span>
                  )}
                  {r.status === "skipped" && <span>skipped</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Retry on failure */}
        {job.status === "failed" && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {isRetrying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Retry Failed Items
          </button>
        )}

        {job.status === "completed" && (
          <div className="bg-green-50 rounded-lg p-3 text-sm text-green-700 text-center font-medium">
            ✓ Import complete — {job.successful} product(s) created
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const BulkProductUploadPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // ─ State ────────────────────────────────────────────────────────────────

  const [rawInput, setRawInput] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<string>("DRAFT");
  const [imageMatches, setImageMatches] = useState<ImageMatchResult | null>(
    null,
  );
  const [confirmedAssignments, setConfirmedAssignments] = useState<
    Record<string, string>
  >({});
  const [products, setProducts] = useState<BulkParsedProduct[]>([]);
  const [validationErrors, setValidationErrors] = useState<
    BulkValidationError[]
  >([]);
  const [productFilter, setProductFilter] = useState<
    "all" | "valid" | "error" | "warning"
  >("all");
  const [showFormatExample, setShowFormatExample] = useState(false);

  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<BulkImportJob | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [showDraftSelector, setShowDraftSelector] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<BulkParsedProduct | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showJsonViewer, setShowJsonViewer] = useState(false);

  // ─ Categories & Warehouses queries ──────────────────────────────────────────
  const { data: categoryData } = useQuery({
    queryKey: ["bulk-categories"],
    queryFn: async () => {
      const res = await productApi.getBulkCategoryTree();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: warehouseData } = useQuery({
    queryKey: ["bulk-warehouses"],
    queryFn: async () => {
      const res = await productApi.getWarehouses();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const categoriesTree: BulkCategoryNode[] = categoryData?.tree ?? [];
  const flatCategories: BulkCategoryLookup[] = categoryData?.flatList ?? [];
  const warehouses: BulkWarehouse[] = warehouseData?.warehouses ?? [];

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─ Lifecycle & In-flight guards ───────────────────────────────────────────
  const loadedDraftIdRef = useRef<string | null>(null);
  const inFlightDraftIdRef = useRef<string | null>(null);
  const flatCategoriesRef = useRef(flatCategories);
  flatCategoriesRef.current = flatCategories;
  const warehousesRef = useRef(warehouses);
  warehousesRef.current = warehouses;

  // ─ Computed ─────────────────────────────────────────────────────────────

  const summary =
    products.length > 0 ? summaryFromProducts(products) : undefined;
  const hasBlockers = (summary?.errorCount ?? 0) > 0;
  const canImport =
    !hasBlockers &&
    products.length > 0 &&
    !!draftId &&
    job?.status !== "processing" &&
    job?.status !== "pending";

  const importDisabledReason = !draftId
    ? "Create or open a draft first."
    : products.length === 0
      ? "Parse products first."
      : hasBlockers
        ? `Fix ${summary!.errorCount} error(s) before importing.`
        : job?.status === "processing" || job?.status === "pending"
          ? "Import is already running."
          : null;

  // ─ Poll job status ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!jobId || job?.status === "completed" || job?.status === "failed")
      return;
    const timer = setInterval(async () => {
      try {
        const res = await productApi.getJobStatus(jobId);
        if (res.data) {
          setJob(res.data);
          if (res.data.status === "completed") {
            toast.success("Import complete!");
            queryClient.invalidateQueries({ queryKey: ["bulk-drafts"] });
          } else if (res.data.status === "failed") {
            toast.error("Import failed. See details below.");
          }
        }
      } catch {
        // ignore transient polling errors
      }
    }, POLLING_INTERVAL);
    return () => clearInterval(timer);
  }, [jobId, job?.status, queryClient]);

  // ─ Prompt on unsaved changes ─────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // ─ Actions ──────────────────────────────────────────────────────────────

  const syncDraftUrl = useCallback(
    (id: string | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const current = next.get("draftId");
          if (id) {
            if (current !== id) {
              next.set("draftId", id);
              return next;
            }
          } else {
            if (current) {
              next.delete("draftId");
              return next;
            }
          }
          return prev;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const loadDraft = useCallback(
    (draft: BulkImportDraft, options?: { showToast?: boolean }) => {
      loadedDraftIdRef.current = draft.id;
      setDraftId(draft.id);
      setDraftStatus(draft.status);
      const rawProds = extractProducts(draft.parsedData);
      const normalized = normalizeProducts(
        rawProds,
        flatCategoriesRef.current,
        warehousesRef.current,
      );
      setProducts(normalized);
      setRawInput(
        draft.rawInput ??
          (normalized.length > 0 ? JSON.stringify(normalized, null, 2) : ""),
      );
      setImageMatches(draft.imageMatches ?? null);
      setConfirmedAssignments(draft.confirmedAssignments ?? {});
      setValidationErrors(normalized.flatMap((p) => p.errors || []));
      setJob(null);
      setJobId(null);
      setIsDirty(false);
      setShowDraftSelector(false);
      localStorage.setItem("active_bulk_draft_id", draft.id);
      syncDraftUrl(draft.id);

      if (options?.showToast !== false) {
        toast.success(`Draft #${draft.id.slice(-8)} loaded.`, {
          id: `bulk-draft-loaded-${draft.id}`,
        });
      }
    },
    [syncDraftUrl],
  );

  const handleReloadDraft = useCallback(async () => {
    if (!draftId) return;
    const tid = toast.loading(`Reloading draft #${draftId.slice(-8)}…`);
    try {
      const res = await productApi.getDraft(draftId);
      if (res.data) {
        loadDraft(res.data, { showToast: false });
        toast.success(`Draft #${draftId.slice(-8)} reloaded.`, { id: tid });
      }
    } catch (err) {
      toast.error(humanError(err), { id: tid });
    }
  }, [draftId, loadDraft]);

  // ─ Auto-enrich in-memory products when categories/warehouses load ──────────
  useEffect(() => {
    if (flatCategories.length === 0 && warehouses.length === 0) return;
    setProducts((prev) => {
      if (prev.length === 0) return prev;
      let hasChanges = false;
      const next = prev.map((p) => {
        let pChanged = false;
        let catId = p.categoryId;
        let catName = p.categoryName;
        let catPath = p.categoryPath;

        if (flatCategories.length > 0 && (!catName || !catId) && catPath) {
          const resolved = resolveCategory(catPath, catId, flatCategories);
          if (
            resolved.categoryId !== catId ||
            resolved.categoryName !== catName
          ) {
            catId = resolved.categoryId || catId;
            catName = resolved.categoryName || catName;
            catPath = resolved.categoryPath || catPath;
            pChanged = true;
          }
        }

        let stock = p.stock;
        if (
          warehouses.length > 0 &&
          stock &&
          !stock.warehouseCode &&
          stock.warehouseId
        ) {
          const w = warehouses.find((wh) => wh.id === stock?.warehouseId);
          if (w?.code) {
            stock = { ...stock, warehouseCode: w.code };
            pChanged = true;
          }
        }

        if (pChanged) {
          hasChanges = true;
          const updated: BulkParsedProduct = {
            ...p,
            categoryId: catId,
            categoryName: catName,
            categoryPath: catPath,
            stock,
          };
          const errs = validateBulkProduct(updated, flatCategories, warehouses);
          return {
            ...updated,
            isValid: !errs.some((e) => e.severity === "error"),
            errors: errs.length > 0 ? errs : undefined,
          };
        }
        return p;
      });

      return hasChanges ? next : prev;
    });
  }, [flatCategories, warehouses]);

  // ─ Auto-restore draft on mount from URL, localStorage, or listDrafts ───────
  useEffect(() => {
    let isCancelled = false;

    const initDraft = async () => {
      const queryDraftId = searchParams.get("draftId");
      const targetId =
        queryDraftId || localStorage.getItem("active_bulk_draft_id");

      // Nothing to load
      if (!targetId) {
        if (loadedDraftIdRef.current) return;
        try {
          const res = await productApi.listDrafts();
          if (isCancelled) return;
          const drafts = res.data ?? [];
          if (drafts.length > 0) {
            const activeDraft =
              drafts.find((d) => d.status !== "COMPLETED") || drafts[0];
            if (
              activeDraft &&
              !isCancelled &&
              loadedDraftIdRef.current !== activeDraft.id
            ) {
              loadDraft(activeDraft);
            }
          }
        } catch {
          // silent fallback
        }
        return;
      }

      // If already loaded in state, don't re-fetch
      if (loadedDraftIdRef.current === targetId) {
        return;
      }

      // If already being fetched, don't duplicate request
      if (inFlightDraftIdRef.current === targetId) {
        return;
      }

      inFlightDraftIdRef.current = targetId;

      try {
        const res = await productApi.getDraft(targetId);
        if (isCancelled) return;
        if (res.data) {
          loadDraft(res.data);
          return;
        }
      } catch (err) {
        if (isCancelled) return;

        // If explicitly requested via URL draftId, report error without false success
        if (queryDraftId) {
          toast.error(
            `Draft #${queryDraftId.slice(-8)} could not be loaded: ${humanError(err)}`,
            { id: `bulk-draft-error-${queryDraftId}` },
          );
          localStorage.removeItem("active_bulk_draft_id");
          syncDraftUrl(null);
          return;
        }

        // Stale localStorage draft ID
        localStorage.removeItem("active_bulk_draft_id");

        // Try falling back to available drafts
        try {
          const listRes = await productApi.listDrafts();
          if (isCancelled) return;
          const drafts = listRes.data ?? [];
          if (drafts.length > 0) {
            const activeDraft =
              drafts.find((d) => d.status !== "COMPLETED") || drafts[0];
            if (
              activeDraft &&
              !isCancelled &&
              loadedDraftIdRef.current !== activeDraft.id
            ) {
              loadDraft(activeDraft);
            }
          }
        } catch {
          // silent fallback
        }
      } finally {
        if (inFlightDraftIdRef.current === targetId) {
          inFlightDraftIdRef.current = null;
        }
      }
    };

    initDraft();

    return () => {
      isCancelled = true;
    };
  }, [searchParams, loadDraft, syncDraftUrl]);

  const handleSaveDraft = async () => {
    const serializedProducts =
      products.length > 0 ? JSON.stringify(products, null, 2) : "";
    const effectiveInput = serializedProducts || rawInput.trim();
    if (!effectiveInput && products.length === 0) {
      toast.error("Nothing to save — enter product data first.");
      return;
    }
    setIsSaving(true);
    try {
      if (draftId) {
        const res = await productApi.updateDraft(draftId, {
          rawInput: effectiveInput,
          parsedData: products.length > 0 ? products : undefined,
          confirmedAssignments,
        });
        if (res.data) {
          setDraftStatus(res.data.status);
          setRawInput(effectiveInput);
          localStorage.setItem("active_bulk_draft_id", res.data.id);
          toast.success("Draft saved.", {
            id: `bulk-draft-save-${res.data.id}`,
          });
        }
      } else {
        const res = await productApi.createDraft(effectiveInput);
        if (res.data) {
          loadedDraftIdRef.current = res.data.id;
          setDraftId(res.data.id);
          setDraftStatus(res.data.status);
          setRawInput(effectiveInput);
          if (products.length > 0) {
            await productApi.updateDraft(res.data.id, {
              parsedData: products,
              confirmedAssignments,
            });
          }
          localStorage.setItem("active_bulk_draft_id", res.data.id);
          syncDraftUrl(res.data.id);
          toast.success("Draft created.", {
            id: `bulk-draft-create-${res.data.id}`,
          });
          queryClient.invalidateQueries({ queryKey: ["bulk-drafts"] });
        }
      }
      setIsDirty(false);
    } catch (err) {
      toast.error(humanError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleParse = async () => {
    if (!rawInput.trim()) {
      toast.error("Enter product data first.");
      return;
    }
    setIsParsing(true);
    const tid = toast.loading("Parsing products…");
    try {
      let isDirectJson = false;
      let parsedJson: any = null;
      try {
        parsedJson = JSON.parse(rawInput);
        isDirectJson = true;
      } catch {
        isDirectJson = false;
      }

      if (isDirectJson) {
        const rawList = Array.isArray(parsedJson) ? parsedJson : [parsedJson];
        const normalized = normalizeProducts(
          rawList,
          flatCategories,
          warehouses,
        );
        setProducts(normalized);
        const errs = normalized.flatMap((p) => p.errors || []);
        setValidationErrors(errs);

        let currentDraftId = draftId;
        if (!currentDraftId) {
          const createRes = await productApi.createDraft(rawInput);
          if (createRes.data) {
            currentDraftId = createRes.data.id;
            setDraftId(currentDraftId);
            setDraftStatus(createRes.data.status);
            localStorage.setItem("active_bulk_draft_id", currentDraftId);
            const url = new URL(window.location.href);
            url.searchParams.set("draftId", currentDraftId);
            window.history.replaceState({}, "", url.toString());
            queryClient.invalidateQueries({ queryKey: ["bulk-drafts"] });
          }
        }
        if (currentDraftId) {
          await productApi.updateDraft(currentDraftId, {
            rawInput,
            parsedData: normalized,
          });
        }
        setIsDirty(false);
        toast.success(`Parsed ${normalized.length} product(s).`, { id: tid });
      } else {
        let draft: BulkImportDraft | undefined;
        if (draftId) {
          const res = await productApi.parseDraftText(draftId, rawInput);
          draft = res.data;
        } else {
          const createRes = await productApi.createDraft(rawInput);
          if (createRes.data) {
            setDraftId(createRes.data.id);
            const parseRes = await productApi.parseDraftText(
              createRes.data.id,
              rawInput,
            );
            draft = parseRes.data;
            queryClient.invalidateQueries({ queryKey: ["bulk-drafts"] });
          }
        }
        if (draft) {
          loadedDraftIdRef.current = draft.id;
          setDraftStatus(draft.status);
          const rawProds = extractProducts(draft.parsedData);
          const normalized = normalizeProducts(
            rawProds,
            flatCategoriesRef.current,
            warehousesRef.current,
          );
          setProducts(normalized);
          setValidationErrors(normalized.flatMap((p) => p.errors || []));
          localStorage.setItem("active_bulk_draft_id", draft.id);
          syncDraftUrl(draft.id);
          setIsDirty(false);
          toast.success(`Parsed ${normalized.length} product(s).`, { id: tid });
        }
      }
    } catch (err) {
      toast.error(humanError(err), { id: tid });
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsParsing(true);
    const tid = toast.loading(`Uploading ${file.name}…`);
    try {
      let draft: BulkImportDraft | undefined;
      if (draftId) {
        const res = await productApi.parseDraftFile(draftId, file);
        draft = res.data;
      } else {
        const createRes = await productApi.createDraft("");
        if (createRes.data) {
          setDraftId(createRes.data.id);
          const parseRes = await productApi.parseDraftFile(
            createRes.data.id,
            file,
          );
          draft = parseRes.data;
          queryClient.invalidateQueries({ queryKey: ["bulk-drafts"] });
        }
      }
      if (draft) {
        loadedDraftIdRef.current = draft.id;
        setDraftStatus(draft.status);
        const rawProds = extractProducts(draft.parsedData);
        const normalized = normalizeProducts(
          rawProds,
          flatCategoriesRef.current,
          warehousesRef.current,
        );
        setProducts(normalized);
        setRawInput(
          draft.rawInput ||
            (normalized.length > 0 ? JSON.stringify(normalized, null, 2) : ""),
        );
        setValidationErrors(normalized.flatMap((p) => p.errors || []));
        localStorage.setItem("active_bulk_draft_id", draft.id);
        syncDraftUrl(draft.id);
        setIsDirty(false);
        toast.success(`Parsed ${normalized.length} product(s) from file.`, {
          id: tid,
        });
      }
    } catch (err) {
      toast.error(humanError(err), { id: tid });
    } finally {
      setIsParsing(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!draftId) return;
    try {
      await productApi.deleteDraft(draftId);
      loadedDraftIdRef.current = null;
      setDraftId(null);
      setDraftStatus("DRAFT");
      setRawInput("");
      setProducts([]);
      setValidationErrors([]);
      setImageMatches(null);
      setConfirmedAssignments({});
      setJob(null);
      setJobId(null);
      setIsDirty(false);
      setShowDeleteConfirm(false);
      localStorage.removeItem("active_bulk_draft_id");
      syncDraftUrl(null);
      queryClient.invalidateQueries({ queryKey: ["bulk-drafts"] });
      toast.success("Draft deleted.");
    } catch (err) {
      toast.error(humanError(err));
    }
  };

  const handleImport = async () => {
    if (!draftId || !canImport) return;
    setIsImporting(true);
    const tid = toast.loading("Starting import…");
    try {
      const res = await productApi.startDraftImport(draftId);
      if (res.data) {
        setJob(res.data);
        setJobId(res.data.jobId);
        setDraftStatus("IMPORTING");
        toast.success("Import job started.", { id: tid });
      }
    } catch (err) {
      toast.error(humanError(err), { id: tid });
    } finally {
      setIsImporting(false);
    }
  };

  const handleRetryJob = async () => {
    if (!jobId) return;
    try {
      const res = await productApi.retryJob(jobId);
      if (res.data) {
        setJob(res.data);
        toast.success("Retrying failed items…");
      }
    } catch (err) {
      toast.error(humanError(err));
    }
  };

  const handleMatchComplete = useCallback(
    async (matches: ImageMatchResult, assignments: Record<string, string>) => {
      setImageMatches(matches);
      setConfirmedAssignments(assignments);
      if (products.length > 0) {
        const updatedWithImages = applyDriveMatchesToProducts(
          products,
          matches,
          productApi.getDriveProxyUrl,
        );
        setProducts(updatedWithImages);
        const serialized = JSON.stringify(updatedWithImages, null, 2);
        setRawInput(serialized);
        setIsDirty(true);
        if (draftId) {
          try {
            await productApi.updateDraft(draftId, {
              rawInput: serialized,
              parsedData: updatedWithImages,
              confirmedAssignments: assignments,
            });
          } catch {
            // background
          }
        }
      }
    },
    [products, draftId],
  );

  const handleUpdateProduct = useCallback((updated: BulkParsedProduct) => {
    setProducts((prev) => {
      const next = prev.map((p) =>
        p.productGroupId === updated.productGroupId ? updated : p,
      );
      setRawInput(JSON.stringify(next, null, 2));
      return next;
    });
    setValidationErrors((prev) => {
      const remaining = prev.filter(
        (e) => e.productGroupId !== updated.productGroupId,
      );
      return [...remaining, ...(updated.errors || [])];
    });
    setIsDirty(true);
  }, []);

  const handleDeleteProduct = useCallback((productGroupId: string) => {
    setProducts((prev) => {
      const next = prev.filter((p) => p.productGroupId !== productGroupId);
      setRawInput(JSON.stringify(next, null, 2));
      return next;
    });
    setValidationErrors((prev) =>
      prev.filter((e) => e.productGroupId !== productGroupId),
    );
    setIsDirty(true);
  }, []);

  const handleBulkUpdateProducts = useCallback(
    (updatedProducts: BulkParsedProduct[]) => {
      setProducts(updatedProducts);
      setRawInput(JSON.stringify(updatedProducts, null, 2));
      setValidationErrors(updatedProducts.flatMap((p) => p.errors || []));
      setIsDirty(true);
    },
    [],
  );

  const handleAddProduct = useCallback(
    (newProduct: BulkParsedProduct) => {
      const normalized = normalizeProduct(
        newProduct,
        flatCategories,
        warehouses,
      );
      const valErrors = validateBulkProduct(
        normalized,
        flatCategories,
        warehouses,
      );
      const withErrors: BulkParsedProduct = {
        ...normalized,
        isValid: !valErrors.some((e) => e.severity === "error"),
        errors: valErrors.length > 0 ? valErrors : undefined,
      };
      setProducts((prev) => {
        const next = [...prev, withErrors];
        setRawInput(JSON.stringify(next, null, 2));
        return next;
      });
      setValidationErrors((prev) => [...prev, ...valErrors]);
      setIsDirty(true);
      toast.success(`Product "${newProduct.name}" added to batch.`);
    },
    [flatCategories, warehouses],
  );

  // ─ Render ────────────────────────────────────────────────────────────────

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Left: title */}
              <div className="flex items-center gap-3">
                <BackButton />
                <div>
                  <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                    Bulk Product Upload
                  </h1>
                  <p className="text-xs text-gray-500">
                    Prepare, preview, and import multiple products at once.
                    {draftId && (
                      <span className="ml-2 text-indigo-600 font-medium">
                        Draft #{draftId.slice(-8)}
                        {isDirty && " · unsaved changes"}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Right: actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Draft status badge */}
                {draftId && (
                  <span
                    className={classNames(
                      "text-xs px-2 py-1 rounded-full font-medium",
                      draftStatus === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : draftStatus === "FAILED"
                          ? "bg-red-100 text-red-700"
                          : draftStatus === "READY_FOR_IMPORT"
                            ? "bg-blue-100 text-blue-700"
                            : draftStatus === "IMPORTING"
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-gray-100 text-gray-600",
                    )}
                  >
                    {draftStatus}
                  </span>
                )}

                <button
                  onClick={() => setShowDraftSelector(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FolderOpen className="w-4 h-4" />
                  Open Draft
                </button>

                {draftId && (
                  <button
                    onClick={handleReloadDraft}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    title="Reload current draft from server"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reload
                  </button>
                )}

                <button
                  onClick={handleSaveDraft}
                  disabled={
                    isSaving || (!rawInput.trim() && products.length === 0)
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Draft
                </button>

                {draftId && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete draft"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {/* Primary import button */}
                <div className="relative group">
                  <button
                    onClick={handleImport}
                    disabled={!canImport || isImporting}
                    className={classNames(
                      "flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors",
                      canImport
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed",
                    )}
                  >
                    {isImporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UploadCloud className="w-4 h-4" />
                    )}
                    Import Products
                  </button>
                  {importDisabledReason && (
                    <div className="absolute right-0 top-full mt-1 z-10 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                      {importDisabledReason}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────────── */}
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col xl:flex-row gap-6">
            {/* ── Left column (input + products) ─────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-5">
              {/* B. Product input */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    Product Details Input
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowFormatExample(true)}
                      className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Info className="w-3.5 h-3.5" />
                      View JSON Format
                    </button>
                    {/* File upload */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,.csv,.tsv,.xlsx"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                        e.target.value = "";
                      }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isParsing}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      Upload File
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <textarea
                    value={rawInput}
                    onChange={(e) => {
                      setRawInput(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Paste JSON, CSV, or TSV product data here…"
                    rows={12}
                    className="w-full text-sm font-mono border border-gray-300 rounded-lg px-3 py-2.5 resize-y focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-gray-50 placeholder-gray-400"
                    spellCheck={false}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-400">
                      {rawInput.length} char{rawInput.length !== 1 ? "s" : ""}
                      {isDirty && " · unsaved"}
                    </p>
                    <button
                      onClick={handleParse}
                      disabled={isParsing || !rawInput.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {isParsing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ZapIcon className="w-4 h-4" />
                      )}
                      Parse Products
                    </button>
                  </div>
                </div>
              </div>

              {/* C. Parsed Products Table */}
              {products.length > 0 && (
                <div>
                  <BulkProductPreviewTable
                    products={products}
                    summary={summary}
                    errors={validationErrors}
                    filterStatus={productFilter}
                    onFilterChange={setProductFilter}
                    onUpdateProduct={handleUpdateProduct}
                    onDeleteProduct={handleDeleteProduct}
                    onAddProduct={() => setShowAddModal(true)}
                    onEditProduct={(p) => setEditingProduct(p)}
                    flatCategories={flatCategories}
                    categoriesTree={categoriesTree}
                    onBulkUpdateProducts={handleBulkUpdateProducts}
                    getDriveProxyUrl={productApi.getDriveProxyUrl}
                    onDownloadErrorReport={() => {
                      const blob = new Blob(
                        [JSON.stringify(validationErrors, null, 2)],
                        { type: "application/json" },
                      );
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "bulk-errors.json";
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  />
                </div>
              )}

              {products.length === 0 && rawInput.length === 0 && (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
                  <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    Paste product data above or upload a file to get started.
                  </p>
                </div>
              )}

              {/* F. Import Progress (mobile / below products) */}
              {job && (
                <div className="xl:hidden">
                  <ImportProgressPanel
                    job={job}
                    onRetry={handleRetryJob}
                    isRetrying={false}
                  />
                </div>
              )}
            </div>

            {/* ── Right column (Drive + Validation + Progress on desktop) ─────── */}
            <div className="xl:w-80 2xl:w-96 space-y-4 shrink-0">
              {/* D. Drive matching */}
              <DriveMatchingPanel
                draftId={draftId}
                imageMatches={imageMatches}
                confirmedAssignments={confirmedAssignments}
                onMatchComplete={handleMatchComplete}
                getDriveProxyUrl={productApi.getDriveProxyUrl}
                onPrepareDraft={async () => {
                  if (draftId && products.length > 0) {
                    await productApi.updateDraft(draftId, {
                      rawInput: JSON.stringify(products, null, 2),
                      parsedData: products,
                      confirmedAssignments,
                    });
                  }
                }}
              />

              {/* E. Validation Summary */}
              <ValidationSummaryPanel
                summary={summary}
                imageMatches={imageMatches}
                onFilterChange={setProductFilter}
                activeFilter={productFilter}
              />

              {/* Download template helper */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Excel Template
                </p>
                <button
                  onClick={async () => {
                    const tid = toast.loading("Generating template…");
                    try {
                      const blob = await productApi.downloadBulkTemplate();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "kankana-silks-bulk-template.xlsx";
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success("Template downloaded.", { id: tid });
                    } catch (err) {
                      toast.error(humanError(err), { id: tid });
                    }
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4 text-indigo-600" />
                  Download Excel Template
                </button>
              </div>

              {/* JSON Inspector Panel */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowJsonViewer((s) => !s)}
                  className="w-full flex items-center justify-between p-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition"
                >
                  <span className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-indigo-600" />
                    Generated JSON ({products.length})
                  </span>
                  {showJsonViewer ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                {showJsonViewer && (
                  <div className="border-t border-gray-200 bg-slate-900 text-slate-100 p-3">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                        Synced with form state
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            JSON.stringify(products, null, 2),
                          );
                          toast.success("JSON copied to clipboard!");
                        }}
                        className="flex items-center gap-1 text-[11px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition font-medium cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                    </div>
                    <pre className="text-[10px] font-mono leading-relaxed max-h-72 overflow-auto text-emerald-400">
                      {JSON.stringify(products, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* F. Import Progress (desktop) */}
              {job && (
                <ImportProgressPanel
                  job={job}
                  onRetry={handleRetryJob}
                  isRetrying={false}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {editingProduct && (
        <BulkProductEditorModal
          product={editingProduct}
          categoriesTree={categoriesTree}
          flatCategories={flatCategories}
          warehouses={warehouses}
          isOpen={Boolean(editingProduct)}
          onClose={() => setEditingProduct(null)}
          onSave={(updated) => {
            handleUpdateProduct(updated);
            setEditingProduct(null);
          }}
          getThumbnailUrl={productApi.getDriveProxyUrl}
        />
      )}

      {showAddModal && (
        <BulkAddProductModal
          flatCategories={flatCategories}
          warehouses={warehouses}
          existingGroupIds={products.map((p) => p.productGroupId)}
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAddProduct={handleAddProduct}
        />
      )}

      {showDraftSelector && (
        <DraftSelector
          onSelect={loadDraft}
          onClose={() => setShowDraftSelector(false)}
        />
      )}
      {showDeleteConfirm && draftId && (
        <DeleteDraftModal
          draftId={draftId}
          onConfirm={handleDeleteDraft}
          onClose={() => setShowDeleteConfirm(false)}
          isDeleting={false}
        />
      )}
      {showFormatExample && (
        <BulkFormatExampleModal
          isOpen={showFormatExample}
          onClose={() => setShowFormatExample(false)}
          onUseFormat={(json) => {
            setRawInput(json);
            setIsDirty(true);
          }}
          hasExistingInput={rawInput.trim().length > 0}
        />
      )}
    </MainLayout>
  );
};

export default BulkProductUploadPage;
