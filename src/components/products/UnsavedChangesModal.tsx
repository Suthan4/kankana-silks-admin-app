import React, { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

export interface UnsavedChangesModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

/**
 * Shopify-grade confirmation modal warning users of unsaved form changes.
 */
export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title = "Unsaved changes",
  message = "You have unsaved changes. Are you sure you want to leave? Changes you made will be lost.",
  confirmText = "Leave Page",
  cancelText = "Keep Editing",
}) => {
  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-changes-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden scale-100 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-3 text-amber-600">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3
              id="unsaved-changes-title"
              className="text-lg font-semibold text-gray-900"
            >
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-3">
          <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 bg-gray-50 px-6 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-gray-300 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-hidden focus:ring-2 focus:ring-red-500 transition-colors shadow-xs"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
