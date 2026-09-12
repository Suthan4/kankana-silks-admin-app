import React from "react";
import { Loader2, Save, Undo2 } from "lucide-react";

export interface FormActionBarProps {
  isDirty: boolean;
  isSubmitting?: boolean;
  onDiscard: () => void;
  onSave: () => void;
  saveLabel?: string;
  discardLabel?: string;
  className?: string;
}

/**
 * Shopify-style sticky bottom action bar that appears whenever the form has unsaved edits.
 */
export const FormActionBar: React.FC<FormActionBarProps> = ({
  isDirty,
  isSubmitting = false,
  onDiscard,
  onSave,
  saveLabel = "Save Changes",
  discardLabel = "Discard Changes",
  className = "",
}) => {
  if (!isDirty) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 text-white backdrop-blur-md border-t border-gray-800 shadow-2xl transition-all duration-300 transform translate-y-0 ${className}`}
      role="region"
      aria-label="Unsaved form changes bar"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Unsaved Changes Indicator */}
        <div className="flex items-center gap-2.5 text-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <span className="font-medium text-gray-200">Unsaved changes</span>
          <span className="text-xs text-gray-400 hidden md:inline">
            — Be sure to save before leaving this page.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onDiscard}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 hover:text-white rounded-lg border border-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Undo2 className="h-4 w-4" />
            {discardLabel}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>{saveLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
