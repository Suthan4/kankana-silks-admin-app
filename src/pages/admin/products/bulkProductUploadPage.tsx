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
  Search,
  Check,
  Folder,
  FileImage,
  MonitorUp,
  Cloud,
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
  DriveFile,
  BulkParsedMedia,
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

// ─── Product Image Sources Panel ──────────────────────────────────────────────

type ImageSourceMode = "references" | "local" | "drive";

interface DriveBrowseResult {
  files: DriveFile[];
  folders: DriveFolder[];
  nextPageToken?: string | null;
}

interface DriveMatchingPanelProps {
  draftId: string | null;
  products: BulkParsedProduct[];
  imageMatches: ImageMatchResult | null;
  confirmedAssignments: Record<string, string>;
  onMatchComplete: (matches: ImageMatchResult, assignments: Record<string, string>) => Promise<ImageMatchResult | void> | ImageMatchResult | void;
  onAssignMedia: (productGroupId: string, media: BulkParsedMedia[], mode: "replace" | "append") => void;
  getDriveProxyUrl: (fileId: string) => string;
  onPrepareDraft?: () => Promise<void>;
}

const DriveMatchingPanel: React.FC<DriveMatchingPanelProps> = ({
  draftId, products, imageMatches, confirmedAssignments, onMatchComplete, onAssignMedia, getDriveProxyUrl, onPrepareDraft,
}) => {
  const [sourceMode, setSourceMode] = useState<ImageSourceMode>("references");
  const [driveConnected, setDriveConnected] = useState<boolean | null>(null);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [matching, setMatching] = useState(false);
  const [folderError, setFolderError] = useState<string | null>(null);
  const [showAmbiguous, setShowAmbiguous] = useState(false);
  const [pendingAssignments, setPendingAssignments] = useState<Record<string, string>>(confirmedAssignments ?? {});
  const [targetProductGroupId, setTargetProductGroupId] = useState("");
  const [assignmentMode, setAssignmentMode] = useState<"replace" | "append">("replace");

  const [localFiles, setLocalFiles] = useState<Array<{ id: string; file: File; previewUrl: string }>>([]);
  const [uploadingLocal, setUploadingLocal] = useState(false);
  const [localProgress, setLocalProgress] = useState({ completed: 0, total: 0 });
  const localFilesRef = useRef(localFiles);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveFolders, setDriveFolders] = useState<DriveFolder[]>([]);
  const [drivePageToken, setDrivePageToken] = useState<string | null>(null);
  const [driveSearchInput, setDriveSearchInput] = useState("");
  const [driveSearch, setDriveSearch] = useState("");
  const [folderTrail, setFolderTrail] = useState<DriveFolder[]>([]);
  const [selectedDriveFiles, setSelectedDriveFiles] = useState<Record<string, DriveFile>>({});
  const [uploadingDrive, setUploadingDrive] = useState(false);
  const [driveProgress, setDriveProgress] = useState({ completed: 0, total: 0 });

  const targetProduct = products.find((product) => product.productGroupId === targetProductGroupId);

  useEffect(() => { localFilesRef.current = localFiles; }, [localFiles]);
  useEffect(() => () => {
    localFilesRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
  }, []);

  useEffect(() => {
    if (!products.length) setTargetProductGroupId("");
    else if (!products.some((product) => product.productGroupId === targetProductGroupId)) {
      setTargetProductGroupId(products[0].productGroupId);
    }
  }, [products, targetProductGroupId]);

  const checkAndLoadFolders = useCallback(async () => {
    setLoadingFolders(true);
    setFolderError(null);
    try {
      const statusRes = await productApi.getDriveStatus(draftId ?? undefined);
      const connected = Boolean(statusRes.data?.connected);
      setDriveConnected(connected);
      if (!connected) { setFolders([]); return; }
      const res = await productApi.listDriveFolders();
      const raw = res.data;
      const folderList: DriveFolder[] = Array.isArray(raw) ? raw : Array.isArray((raw as any)?.folders) ? (raw as any).folders : [];
      setFolders(folderList);
      setSelectedFolderId((current) => current && folderList.some((folder) => folder.id === current) ? current : (folderList[0]?.id ?? ""));
    } catch (err) {
      setDriveConnected(false);
      setFolderError(humanError(err));
    } finally {
      setLoadingFolders(false);
    }
  }, [draftId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("drive_connected") === "true") {
      params.delete("drive_connected");
      const nextSearch = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (nextSearch ? "?" + nextSearch : ""));
      toast.success("Google Drive connected successfully!");
    }
    void checkAndLoadFolders();
  }, [checkAndLoadFolders]);

  const handleConnectDrive = () => { window.location.href = buildDriveConnectUrl(draftId); };

  const handleMatch = async () => {
    if (!draftId || !selectedFolderId) return;
    setMatching(true);
    try {
      await onPrepareDraft?.();
      const res = await productApi.matchDriveImages(draftId, selectedFolderId);
      const result: ImageMatchResult = (res.data as any)?.imageMatches || (res.data as any);
      if (!result || !Array.isArray(result.matched)) { toast.error("Invalid image matching response from server."); return; }
      await productApi.confirmDriveAssignment(draftId, pendingAssignments);
      const completedMatches = await onMatchComplete(result, pendingAssignments);
      const finalResult = completedMatches || result;
      if (finalResult.matched.length === 0 && finalResult.missing.length > 0) {
        toast.error("No image references matched. Review the filenames or select images manually.");
      } else {
        toast.success("Matched and stored " + finalResult.matched.length + " image(s)." + (finalResult.missing.length ? " " + finalResult.missing.length + " unresolved." : ""));
      }
    } catch (err) { toast.error(humanError(err)); }
    finally { setMatching(false); }
  };

  const assignCandidate = async (entry: AmbiguousEntry, fileId: string) => {
    const next = { ...pendingAssignments, [String(entry.mediaIndex)]: fileId };
    setPendingAssignments(next);
    if (!draftId) return;
    try {
      await productApi.confirmDriveAssignment(draftId, next);
      toast.success("Assignment saved.");
    } catch { toast.error("Failed to save assignment."); }
  };

  const addLocalFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const list = Array.from(fileList);
    const accepted = list.filter((file) => file.type.startsWith("image/"));
    if (accepted.length !== list.length) toast.error((list.length - accepted.length) + " non-image file(s) were skipped.");
    setLocalFiles((previous) => {
      const keys = new Set(previous.map((item) => item.id));
      const additions = accepted.map((file) => ({
        id: file.name + ":" + file.size + ":" + file.lastModified,
        file,
        previewUrl: URL.createObjectURL(file),
      })).filter((item) => !keys.has(item.id));
      return [...previous, ...additions];
    });
  };

  const removeLocalFile = (index: number) => setLocalFiles((previous) => {
    const removed = previous[index];
    if (removed) URL.revokeObjectURL(removed.previewUrl);
    return previous.filter((_item, itemIndex) => itemIndex !== index);
  });

  const moveLocalFile = (index: number, direction: -1 | 1) => {
    setLocalFiles((previous) => {
      const destination = index + direction;
      if (destination < 0 || destination >= previous.length) return previous;
      const next = [...previous];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  };

  const handleUploadLocalFiles = async () => {
    if (!targetProduct) { toast.error("Select a product before uploading images."); return; }
    if (!localFiles.length) { toast.error("Select one or more images first."); return; }
    const media: BulkParsedMedia[] = [];
    const uploadedIds: string[] = [];
    const failedNames: string[] = [];
    setUploadingLocal(true);
    setLocalProgress({ completed: 0, total: localFiles.length });
    try {
      for (let index = 0; index < localFiles.length; index += 1) {
        const item = localFiles[index];
        try {
          const response = await productApi.uploadBulkImageFile(item.file);
          const result = response.data as any;
          if (!result?.url || !/^https:\/\//i.test(result.url)) throw new Error("Storage did not return a valid HTTPS URL.");
          media.push({
            type: "IMAGE", url: result.url, key: result.key, altText: targetProduct.name,
            order: (assignmentMode === "append" ? (targetProduct.media?.length ?? 0) : 0) + media.length, isActive: true, source: "product",
            mimeType: item.file.type, fileSize: item.file.size,
          });
          uploadedIds.push(item.id);
        } catch { failedNames.push(item.file.name); }
        finally { setLocalProgress({ completed: index + 1, total: localFiles.length }); }
      }
      if (media.length) {
        onAssignMedia(targetProduct.productGroupId, media, assignmentMode);
        setLocalFiles((previous) => previous.filter((item) => {
          if (!uploadedIds.includes(item.id)) return true;
          URL.revokeObjectURL(item.previewUrl);
          return false;
        }));
        toast.success("Uploaded " + media.length + " image(s) to storage.");
      }
      if (failedNames.length) toast.error(failedNames.length + " image(s) failed to upload; you can retry them.");
    } finally { setUploadingLocal(false); }
  };

  const loadDriveItems = async (
    folderId: string,
    options: { append?: boolean; pageToken?: string | null; query?: string } = {},
  ) => {
    setDriveLoading(true);
    setDriveError(null);
    try {
      const response = await productApi.listDriveFiles({
        parentId: folderId,
        pageToken: options.pageToken ?? undefined,
        query: options.query ?? driveSearch,
      });
      const data = response.data as any;
      const page: DriveBrowseResult = {
        files: Array.isArray(data) ? data : (data?.files ?? []),
        folders: Array.isArray(data?.folders) ? data.folders : [],
        nextPageToken: data?.nextPageToken ?? null,
      };
      const imageFiles = page.files.filter((file) => file.mimeType?.startsWith("image/"));
      setDriveFiles((previous) => options.append ? [...previous, ...imageFiles] : imageFiles);
      setDriveFolders(page.folders);
      setDrivePageToken(page.nextPageToken ?? null);
    } catch (err) {
      setDriveError(humanError(err) + ". The backend must expose GET /products/bulk/drive/files for this picker.");
    } finally { setDriveLoading(false); }
  };

  const openDrivePicker = () => {
    if (!driveConnected) { toast.error("Connect Google Drive before selecting images."); return; }
    if (!selectedFolderId) { toast.error("Select a Drive folder first."); return; }
    const root = folders.find((folder) => folder.id === selectedFolderId);
    setFolderTrail(root ? [root] : []);
    setDriveSearchInput("");
    setDriveSearch("");
    setSelectedDriveFiles({});
    setPickerOpen(true);
    void loadDriveItems(selectedFolderId, { query: "" });
  };

  const toggleDriveSelection = (file: DriveFile) => setSelectedDriveFiles((previous) => {
    const next = { ...previous };
    if (next[file.id]) delete next[file.id]; else next[file.id] = file;
    return next;
  });

  const moveSelectedDriveFile = (fileId: string, direction: -1 | 1) => {
    setSelectedDriveFiles((previous) => {
      const entries = Object.entries(previous);
      const index = entries.findIndex(([id]) => id === fileId);
      const destination = index + direction;
      if (index < 0 || destination < 0 || destination >= entries.length) return previous;
      [entries[index], entries[destination]] = [entries[destination], entries[index]];
      return Object.fromEntries(entries);
    });
  };

  const navigateToFolder = (folder: DriveFolder, index?: number) => {
    const nextTrail = index === undefined ? [...folderTrail, folder] : folderTrail.slice(0, index + 1);
    setFolderTrail(nextTrail);
    void loadDriveItems(nextTrail[nextTrail.length - 1].id, { query: driveSearch });
  };

  const handleImportDriveSelection = async () => {
    const selected = Object.values(selectedDriveFiles);
    if (!targetProduct || selected.length === 0) { toast.error("Select a product and at least one Drive image."); return; }
    const media: BulkParsedMedia[] = [];
    const failedNames: string[] = [];
    setUploadingDrive(true);
    setDriveProgress({ completed: 0, total: selected.length });
    setPickerOpen(false);
    try {
      for (let index = 0; index < selected.length; index += 1) {
        const driveFile = selected[index];
        try {
          const downloadResponse = await fetch(getDriveProxyUrl(driveFile.id));
          if (!downloadResponse.ok) throw new Error("Drive download failed");
          const blob = await downloadResponse.blob();
          const responseType = downloadResponse.headers.get("content-type") || blob.type;
          if (!responseType.toLowerCase().startsWith("image/")) throw new Error("Drive proxy did not return image content.");
          const file = new File([blob], driveFile.name, { type: driveFile.mimeType || responseType || "image/jpeg" });
          const uploadResponse = await productApi.uploadBulkImageFile(file);
          const result = uploadResponse.data as any;
          if (!result?.url || !/^https:\/\//i.test(result.url)) throw new Error("Storage did not return a valid HTTPS URL.");
          media.push({
            type: "IMAGE", url: result.url, key: result.key, altText: targetProduct.name,
            order: (assignmentMode === "append" ? (targetProduct.media?.length ?? 0) : 0) + media.length, isActive: true, source: "product",
            mimeType: file.type, fileSize: file.size,
          });
        } catch { failedNames.push(driveFile.name); }
        finally { setDriveProgress({ completed: index + 1, total: selected.length }); }
      }
      if (media.length) {
        onAssignMedia(targetProduct.productGroupId, media, assignmentMode);
        setSelectedDriveFiles({});
        toast.success("Uploaded " + media.length + " selected Drive image(s) to storage.");
      }
      if (failedNames.length) toast.error(failedNames.length + " Drive image(s) failed: " + failedNames.slice(0, 3).join(", "));
    } finally { setUploadingDrive(false); }
  };

  const stats = imageMatches ? {
    matched: imageMatches.matched.length,
    missing: imageMatches.missing.length,
    ambiguous: imageMatches.ambiguous.length,
    duplicates: imageMatches.duplicates.length,
  } : null;

  const tabClass = (active: boolean) => classNames(
    "min-w-0 flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-lg border px-1.5 sm:px-2 py-2.5 text-[10px] sm:text-xs font-medium transition-colors",
    active ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100" : "border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:bg-gray-50",
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-indigo-600" />Product Images</h3>
            <p className="text-xs text-gray-500 mt-1">Choose how to add images to your products.</p>
          </div>
          <span className={classNames("shrink-0 text-[10px] rounded-full border px-2 py-1", driveConnected ? "text-green-700 bg-green-50 border-green-200" : "text-gray-500 bg-gray-50 border-gray-200")}>
            {driveConnected === null ? "Checking Drive" : driveConnected ? "Drive connected" : "Drive not connected"}
          </span>
        </div>
      </div>

      <div className="p-3 border-b border-gray-100">
        <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Product image source">
          <button type="button" role="tab" aria-selected={sourceMode === "references"} className={tabClass(sourceMode === "references")} onClick={() => setSourceMode("references")}><Layers className="w-4 h-4" /><span>Existing references</span></button>
          <button type="button" role="tab" aria-selected={sourceMode === "local"} className={tabClass(sourceMode === "local")} onClick={() => setSourceMode("local")}><MonitorUp className="w-4 h-4" /><span>Local upload</span></button>
          <button type="button" role="tab" aria-selected={sourceMode === "drive"} className={tabClass(sourceMode === "drive")} onClick={() => setSourceMode("drive")}><Cloud className="w-4 h-4" /><span>Google Drive</span></button>
        </div>
      </div>

      {sourceMode === "references" && (
        <div className="p-4 space-y-4">
          {driveConnected === null ? <div className="flex items-center gap-2 text-xs text-gray-500 py-4"><Loader2 className="w-4 h-4 animate-spin" />Checking Google Drive connection…</div> : !driveConnected ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">Connect Google Drive to match the references in the product JSON.</div>
              {folderError && <p className="text-xs text-red-600">{folderError}</p>}
              <button type="button" onClick={handleConnectDrive} className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white px-3 py-2.5 text-sm font-medium hover:bg-indigo-700"><Cloud className="w-4 h-4" />Connect Google Drive</button>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Drive folder</label>
                <div className="flex gap-2">
                  <select value={selectedFolderId} onChange={(event) => setSelectedFolderId(event.target.value)} disabled={loadingFolders} className="flex-1 min-w-0 text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"><option value="">Select a folder…</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select>
                  <button type="button" title="Refresh folders" onClick={() => void checkAndLoadFolders()} disabled={loadingFolders} className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50">{loadingFolders ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}</button>
                </div>
                {folderError && <p className="text-xs text-red-600 mt-1">{folderError}</p>}
              </div>
              <button type="button" onClick={() => void handleMatch()} disabled={!draftId || !selectedFolderId || matching} className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">{matching ? <Loader2 className="w-4 h-4 animate-spin" /> : <ZapIcon className="w-4 h-4" />}{matching ? "Matching references…" : "Match existing references"}</button>
              {stats && <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-green-50 p-2"><b className="block text-lg text-green-700">{stats.matched}</b><span className="text-xs text-green-700">Matched</span></div>
                <div className="rounded-lg bg-red-50 p-2"><b className="block text-lg text-red-700">{stats.missing}</b><span className="text-xs text-red-700">Missing</span></div>
                <div className="rounded-lg bg-amber-50 p-2"><b className="block text-lg text-amber-700">{stats.ambiguous}</b><span className="text-xs text-amber-700">Ambiguous</span></div>
                <div className="rounded-lg bg-gray-50 p-2"><b className="block text-lg text-gray-700">{stats.duplicates}</b><span className="text-xs text-gray-600">Duplicates</span></div>
              </div>}
              {imageMatches && imageMatches.missing.length > 0 && <div className="rounded-lg bg-red-50 p-3">
                <p className="text-xs font-semibold text-red-700 mb-1">Missing references ({imageMatches.missing.length})</p>
                <div className="max-h-28 overflow-y-auto text-xs text-red-700 space-y-1">{imageMatches.missing.slice(0, 100).map((entry, index) => <p key={entry.mediaIndex + "-" + index} className="truncate">{entry.reference}{entry.productGroupId ? " — " + entry.productGroupId : ""}</p>)}</div>
                <p className="text-[11px] text-red-600 mt-2">References that cannot be verified are not assigned automatically. Use the Google Drive tab to select images manually.</p>
              </div>}
              {imageMatches && imageMatches.matched.length > 0 && <div><p className="text-xs font-medium text-gray-700 mb-2">Matched images ({imageMatches.matched.length})</p><div className="grid grid-cols-4 gap-2">{imageMatches.matched.slice(0, 8).map((match) => <div key={match.file.id + "-" + match.mediaIndex} className="min-w-0"><div className="aspect-square rounded-lg border overflow-hidden bg-gray-50"><img loading="lazy" src={getDriveProxyUrl(match.file.id)} alt={match.file.name} className="w-full h-full object-cover" /></div><p className="mt-1 truncate text-[10px] text-gray-500" title={match.file.name}>{match.file.name}</p></div>)}</div></div>}
              {imageMatches && imageMatches.ambiguous.length > 0 && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <button type="button" onClick={() => setShowAmbiguous((value) => !value)} className="flex items-center gap-1 text-xs font-medium text-amber-800">{showAmbiguous ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}Resolve {imageMatches.ambiguous.length} ambiguous match(es)</button>
                {showAmbiguous && <div className="mt-3 space-y-3">{imageMatches.ambiguous.map((entry) => <div key={entry.mediaIndex}><p className="text-xs text-amber-900 mb-1">{entry.reference}</p><div className="flex flex-wrap gap-2">{entry.candidates.map((candidate) => <button type="button" key={candidate.id} title={candidate.name} onClick={() => void assignCandidate(entry, candidate.id)} className={classNames("w-14 h-14 rounded border overflow-hidden", pendingAssignments[String(entry.mediaIndex)] === candidate.id ? "border-indigo-500 ring-2 ring-indigo-300" : "border-gray-300")}><img loading="lazy" src={getDriveProxyUrl(candidate.id)} alt={candidate.name} className="w-full h-full object-cover" /></button>)}</div></div>)}</div>}
              </div>}
            </>
          )}
        </div>
      )}

      {sourceMode === "local" && (
        <div className="p-4 space-y-4">
          <div><label className="block text-xs font-medium text-gray-700 mb-1">Assign images to product</label><select value={targetProductGroupId} onChange={(event) => setTargetProductGroupId(event.target.value)} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white" disabled={!products.length}>{products.length === 0 ? <option value="">Parse or add a product first</option> : products.map((product) => <option key={product.productGroupId} value={product.productGroupId}>{product.productGroupId} — {product.name}</option>)}</select></div>
          <div><label className="block text-xs font-medium text-gray-700 mb-1">How should these images be assigned?</label><select value={assignmentMode} onChange={(event) => setAssignmentMode(event.target.value as "replace" | "append")} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"><option value="replace">Replace existing product images (recommended for missing references)</option><option value="append">Append to existing product images</option></select><p className="mt-1 text-[11px] text-gray-500">When replacing, the first selected image becomes the primary image (order 0). Variant-specific media is preserved.</p></div>
          <label onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; }} onDrop={(event) => { event.preventDefault(); addLocalFiles(event.dataTransfer.files); }} className="block cursor-pointer rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-5 text-center hover:border-indigo-400 transition-colors"><MonitorUp className="w-7 h-7 text-indigo-600 mx-auto mb-2" /><span className="block text-sm font-semibold text-gray-800">Choose or drop images from your computer</span><span className="block text-xs text-gray-500 mt-1">Select multiple supported image files.</span><input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => { addLocalFiles(event.target.files); event.currentTarget.value = ""; }} /></label>
          {localFiles.length > 0 && <>
            <div className="flex items-center justify-between text-xs text-gray-600"><span>{localFiles.length} image(s) selected</span><button type="button" onClick={() => { localFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl)); setLocalFiles([]); }} className="text-red-600 hover:underline">Clear all</button></div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto">{localFiles.map((item, index) => <div key={item.id} className="relative min-w-0 rounded-lg border overflow-hidden"><img src={item.previewUrl} alt={item.file.name} className="w-full aspect-square object-cover bg-gray-50" />{index === 0 && <span className="absolute left-1 top-1 rounded bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold text-white">PRIMARY</span>}<button type="button" onClick={() => removeLocalFile(index)} aria-label={"Remove " + item.file.name} className="absolute top-1 right-1 rounded-full bg-white text-red-600 p-1 shadow"><X className="w-3 h-3" /></button><div className="p-1.5"><p className="truncate text-[10px] text-gray-700" title={item.file.name}>{item.file.name}</p><p className="text-[10px] text-gray-400">{(item.file.size / (1024 * 1024)).toFixed(1)} MB</p><div className="mt-1 flex gap-1"><button type="button" disabled={index === 0} onClick={() => moveLocalFile(index, -1)} className="flex-1 rounded border px-1 py-0.5 text-[10px] disabled:opacity-30" title="Move earlier">↑</button><button type="button" disabled={index === localFiles.length - 1} onClick={() => moveLocalFile(index, 1)} className="flex-1 rounded border px-1 py-0.5 text-[10px] disabled:opacity-30" title="Move later">↓</button></div></div></div>)}</div>
            {uploadingLocal && <div><div className="flex justify-between text-xs text-gray-500"><span>Uploading to storage…</span><span>{localProgress.completed}/{localProgress.total}</span></div><div className="h-1.5 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-indigo-600 transition-all" style={{ width: (localProgress.total ? (localProgress.completed / localProgress.total) * 100 : 0) + "%" }} /></div></div>}
            <button type="button" onClick={() => void handleUploadLocalFiles()} disabled={uploadingLocal || !targetProduct} className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">{uploadingLocal ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}{uploadingLocal ? "Uploading images…" : "Upload " + localFiles.length + " image(s) to product"}</button>
          </>}
          <p className="text-[11px] text-gray-400">Image files are uploaded through the existing storage endpoint. Temporary browser previews are not saved as product URLs.</p>
        </div>
      )}

      {sourceMode === "drive" && (
        <div className="p-4 space-y-4">
          <div><label className="block text-xs font-medium text-gray-700 mb-1">Assign images to product</label><select value={targetProductGroupId} onChange={(event) => setTargetProductGroupId(event.target.value)} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white" disabled={!products.length}>{products.length === 0 ? <option value="">Parse or add a product first</option> : products.map((product) => <option key={product.productGroupId} value={product.productGroupId}>{product.productGroupId} — {product.name}</option>)}</select></div>
          <div><label className="block text-xs font-medium text-gray-700 mb-1">How should these images be assigned?</label><select value={assignmentMode} onChange={(event) => setAssignmentMode(event.target.value as "replace" | "append")} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"><option value="replace">Replace existing product images (recommended for missing references)</option><option value="append">Append to existing product images</option></select><p className="mt-1 text-[11px] text-gray-500">When replacing, the first selected image becomes the primary image (order 0). Variant-specific media is preserved.</p></div>
          {!driveConnected ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-3"><p className="text-xs text-amber-800">Connect Google Drive to browse and select images.</p><button type="button" onClick={handleConnectDrive} className="w-full rounded-lg bg-indigo-600 text-white px-3 py-2 text-sm font-medium hover:bg-indigo-700"><Cloud className="w-4 h-4 inline mr-2" />Connect Google Drive</button></div> : <>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Starting folder</label><select value={selectedFolderId} onChange={(event) => setSelectedFolderId(event.target.value)} disabled={loadingFolders} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"><option value="">Select a folder…</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></div>
            <button type="button" onClick={openDrivePicker} disabled={!selectedFolderId || !targetProduct || driveConnected !== true} className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white px-4 py-3 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"><Cloud className="w-4 h-4" />Browse and select Drive images</button>
          </>}
          {uploadingDrive && <div><div className="flex justify-between text-xs text-gray-500"><span>Transferring selected Drive images to storage…</span><span>{driveProgress.completed}/{driveProgress.total}</span></div><div className="h-1.5 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-indigo-600 transition-all" style={{ width: (driveProgress.total ? (driveProgress.completed / driveProgress.total) * 100 : 0) + "%" }} /></div></div>}
          <p className="text-xs text-gray-500">Only images selected for the current product are downloaded and uploaded to storage.</p>
        </div>
      )}

      {pickerOpen && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6">
        <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b p-4 sm:px-6"><div><h3 className="text-base font-semibold text-gray-900">Select Google Drive images</h3><p className="text-xs text-gray-500 mt-1">{targetProduct?.name} · {Object.keys(selectedDriveFiles).length} selected</p></div><button type="button" onClick={() => setPickerOpen(false)} aria-label="Close Drive picker" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><X className="w-5 h-5" /></button></div>
          <div className="flex flex-wrap items-center gap-2 border-b p-3 sm:px-6"><div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto text-xs text-gray-500">{folderTrail.map((folder, index) => <React.Fragment key={folder.id}>{index > 0 && <span>/</span>}<button type="button" onClick={() => navigateToFolder(folder, index)} className="max-w-40 truncate hover:text-indigo-700">{folder.name}</button></React.Fragment>)}</div><form onSubmit={(event) => { event.preventDefault(); setDriveSearch(driveSearchInput); void loadDriveItems(folderTrail[folderTrail.length - 1]?.id ?? selectedFolderId, { query: driveSearchInput }); }} className="flex w-full gap-2 sm:w-auto"><div className="relative flex-1 sm:w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" /><input value={driveSearchInput} onChange={(event) => setDriveSearchInput(event.target.value)} placeholder="Search filenames…" className="w-full rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-sm outline-none focus:border-indigo-500" /></div><button type="submit" className="rounded-lg border px-3 text-sm hover:bg-gray-50">Search</button></form></div>
          {driveError && <div className="mx-4 mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 sm:mx-6">{driveError}</div>}
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            {driveLoading && driveFiles.length === 0 ? <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500"><Loader2 className="w-5 h-5 animate-spin" />Loading Drive files…</div> : <>
              {driveFolders.length > 0 && <div className="mb-5"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Folders</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{driveFolders.map((folder) => <button type="button" key={folder.id} onClick={() => navigateToFolder(folder)} className="flex items-center gap-2 rounded-lg border p-3 text-left hover:border-indigo-300 hover:bg-indigo-50"><Folder className="h-5 w-5 shrink-0 text-indigo-600" /><span className="truncate text-xs font-medium text-gray-700">{folder.name}</span></button>)}</div></div>}
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Images ({driveFiles.length}{drivePageToken ? "+" : ""})</p>
              {driveFiles.length === 0 ? <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center"><FileImage className="mx-auto mb-2 h-8 w-8 text-gray-300" /><p className="text-sm text-gray-600">No images found in this folder.</p><p className="text-xs text-gray-400 mt-1">Try another folder or search term.</p></div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">{driveFiles.map((file) => {
                const selected = Boolean(selectedDriveFiles[file.id]);
                return <button type="button" key={file.id} aria-pressed={selected} onClick={() => toggleDriveSelection(file)} className={classNames("relative min-w-0 overflow-hidden rounded-xl border text-left transition-all", selected ? "border-indigo-600 ring-2 ring-indigo-200" : "border-gray-200 hover:border-indigo-300")}><div className="aspect-square bg-gray-50"><img loading="lazy" src={file.thumbnailLink || getDriveProxyUrl(file.id)} alt={file.name} className="h-full w-full object-cover" onError={(event) => { const image = event.currentTarget; if (image.src !== getDriveProxyUrl(file.id)) image.src = getDriveProxyUrl(file.id); }} /></div><div className="p-2"><p className="truncate text-[11px] font-medium text-gray-700" title={file.name}>{file.name}</p><p className="text-[10px] text-gray-400">{file.size ? (file.size / (1024 * 1024)).toFixed(1) + " MB" : "Image"}</p></div><span className={classNames("absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full border shadow-sm", selected ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-300 bg-white/95 text-transparent")}><Check className="h-3 w-3" /></span></button>;
              })}</div>}
              {drivePageToken && <div className="mt-5 text-center"><button type="button" onClick={() => void loadDriveItems(folderTrail[folderTrail.length - 1]?.id ?? selectedFolderId, { append: true, pageToken: drivePageToken, query: driveSearch })} disabled={driveLoading} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">{driveLoading ? "Loading…" : "Load more images"}</button></div>}
            </>}
          </div>
          {Object.keys(selectedDriveFiles).length > 0 && <div className="max-h-28 overflow-y-auto border-t border-gray-100 px-4 py-2 sm:px-6"><p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Selected order · First image is primary</p><div className="flex gap-2 overflow-x-auto">{Object.values(selectedDriveFiles).map((file, index, items) => <div key={file.id} className="flex min-w-0 items-center gap-1 rounded-lg border border-gray-200 bg-white p-1.5"><span className="text-[10px] text-gray-500">{index + 1}.</span><span title={file.name} className="max-w-28 truncate text-[10px] text-gray-700">{file.name}</span><button type="button" disabled={index === 0} onClick={() => moveSelectedDriveFile(file.id, -1)} className="rounded border px-1 text-[10px] disabled:opacity-30" title="Move earlier">↑</button><button type="button" disabled={index === items.length - 1} onClick={() => moveSelectedDriveFile(file.id, 1)} className="rounded border px-1 text-[10px] disabled:opacity-30" title="Move later">↓</button><button type="button" onClick={() => toggleDriveSelection(file)} className="rounded p-1 text-red-600 hover:bg-red-50" title="Remove"><X className="h-3 w-3" /></button></div>)}</div></div>}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-gray-50 p-3 sm:px-6"><p className="text-xs text-gray-500">{Object.keys(selectedDriveFiles).length} selected · Only selected files will be transferred.</p><div className="flex gap-2"><button type="button" onClick={() => setPickerOpen(false)} className="rounded-lg border bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button><button type="button" onClick={() => void handleImportDriveSelection()} disabled={!Object.keys(selectedDriveFiles).length || uploadingDrive} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"><UploadCloud className="w-4 h-4" />Upload {Object.keys(selectedDriveFiles).length} selected</button></div></div>
        </div>
      </div>}
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
    async (matches: ImageMatchResult, assignments: Record<string, string>): Promise<ImageMatchResult> => {
      let finalMatches = matches;
      const uploadedByDriveId = new Map<string, { url: string; key?: string }>();

      // Only download files the matcher confirmed. Never download the entire Drive folder.
      for (const entry of matches.matched) {
        if (uploadedByDriveId.has(entry.file.id)) continue;
        try {
          const response = await fetch(productApi.getDriveProxyUrl(entry.file.id));
          if (!response.ok) throw new Error("Could not download " + entry.file.name);
          const blob = await response.blob();
          const contentType = response.headers.get("content-type") || blob.type;
          if (!contentType.toLowerCase().startsWith("image/")) {
            throw new Error("Drive proxy returned non-image content for " + entry.file.name);
          }
          const file = new File([blob], entry.file.name, {
            type: entry.file.mimeType || contentType,
          });
          const uploaded = await productApi.uploadBulkImageFile(file);
          const storage = uploaded.data as any;
          if (!storage?.url || !/^https:\/\//i.test(storage.url)) {
            throw new Error("Storage did not return a valid HTTPS URL for " + entry.file.name);
          }
          uploadedByDriveId.set(entry.file.id, { url: storage.url, key: storage.key });
        } catch (error) {
          // Failed transfers are turned back into missing references below.
        }
      }

      if (matches.matched.length > 0) {
        const successfulMatches = matches.matched.filter((entry) => uploadedByDriveId.has(entry.file.id));
        const failedMatches = matches.matched
          .filter((entry) => !uploadedByDriveId.has(entry.file.id))
          .map((entry) => ({
            reference: entry.reference,
            mediaIndex: entry.mediaIndex,
            productGroupId: entry.productGroupId,
            variantSku: entry.variantSku,
          }));
        finalMatches = {
          ...matches,
          matched: successfulMatches,
          missing: [...matches.missing, ...failedMatches],
        };
      }

      setImageMatches(finalMatches);
      setConfirmedAssignments(assignments);
      if (products.length > 0) {
        const matchedProducts = applyDriveMatchesToProducts(
          products,
          finalMatches,
          productApi.getDriveProxyUrl,
        );
        const toStorageMedia = (media: BulkParsedMedia): BulkParsedMedia => {
          if (!media.key) return media;
          const stored = uploadedByDriveId.get(media.key);
          if (!stored || !media.url.includes("/products/bulk/drive-proxy/")) return media;
          return { ...media, url: stored.url, thumbnailUrl: stored.url, key: stored.key };
        };
        const updatedWithImages = matchedProducts.map((product) => {
          const nextMedia = (product.media ?? []).map(toStorageMedia);
          const nextVariants = (product.variants ?? []).map((variant) => ({
            ...variant,
            media: variant.media?.map(toStorageMedia),
          }));
          const allImages: BulkParsedMedia[] = [
            ...nextMedia.map((media) => ({ ...media, source: "product" as const })),
            ...nextVariants.flatMap((variant) =>
              (variant.media ?? []).map((media) => ({
                ...media,
                source: "variant" as const,
                variantSku: variant.sku,
              })),
            ),
          ].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          return { ...product, media: nextMedia, variants: nextVariants, allImages };
        });
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
            // Keep the page state; the user can save the draft explicitly.
          }
        }
      }
      return finalMatches;
    },
    [products, draftId],
  );

  const handleAssignProductMedia = useCallback(
    (productGroupId: string, mediaToAdd: BulkParsedMedia[], mode: "replace" | "append") => {
      const updatedProducts = products.map((product) => {
        if (product.productGroupId !== productGroupId) return product;
        const existingMedia = product.media ?? [];
        const baseMedia = mode === "replace" ? [] : existingMedia;
        const existingUrls = new Set(baseMedia.map((media) => media.url));
        const additions = mediaToAdd
          .filter((media) => !existingUrls.has(media.url))
          .map((media, index) => ({
            ...media,
            order: baseMedia.length + index,
            source: "product" as const,
          }));
        const nextMedia = [...baseMedia, ...additions];
        const variantImages = (product.variants ?? []).flatMap((variant) =>
          (variant.media ?? []).map((media, index) => ({
            ...media,
            source: "variant" as const,
            variantSku: media.variantSku || variant.sku,
            order: media.order ?? (10000 + index),
          })),
        );
        const nextAllImages = [...nextMedia, ...variantImages]
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        return { ...product, media: nextMedia, allImages: nextAllImages };
      });
      setProducts(updatedProducts);
      setRawInput(JSON.stringify(updatedProducts, null, 2));
      setValidationErrors(updatedProducts.flatMap((product) => product.errors || []));
      setIsDirty(true);
      toast.success(
        (mode === "replace" ? "Replaced product images with " : "Added ") +
        mediaToAdd.length + " image(s). Save the draft to persist changes.",
      );
    },
    [products],
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
                products={products}
                imageMatches={imageMatches}
                confirmedAssignments={confirmedAssignments}
                onMatchComplete={handleMatchComplete}
                onAssignMedia={handleAssignProductMedia}
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
