import React, { useState, useRef, useEffect } from "react";
import { Search, X, Check, ChevronDown } from "lucide-react";

interface Option {
  id: string;
  label: string;
  subtitle?: string;
  imageUrl?: string;
}

interface MultiSelectAutocompleteProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  isLoading?: boolean;
  showImages?: boolean;
  emptyMessage?: string;
}

export const MultiSelectAutocomplete: React.FC<
  MultiSelectAutocompleteProps
> = ({
  options,
  value,
  onChange,
  placeholder = "Search...",
  label,
  error,
  isLoading = false,
  showImages = false,
  emptyMessage = "No options found",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected options
  const selectedOptions = options.filter((opt) => value.includes(opt.id));

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleOption = (optionId: string) => {
    if (value.includes(optionId)) {
      onChange(value.filter((id) => id !== optionId));
    } else {
      onChange([...value, optionId]);
    }
  };

  const handleRemoveOption = (optionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((id) => id !== optionId));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Selected Items Display */}
      <div
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        className={`min-h-[48px] px-4 py-2 border-2 rounded-lg cursor-text transition-all ${
          isOpen
            ? "border-blue-500 ring-2 ring-blue-200"
            : error
            ? "border-red-500"
            : "border-gray-300 hover:border-gray-400"
        } ${isLoading ? "opacity-50" : ""}`}
      >
        <div className="flex flex-wrap gap-2 items-center">
          {selectedOptions.map((option) => (
            <span
              key={option.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium"
            >
              {showImages && option.imageUrl && (
                <img
                  src={option.imageUrl}
                  alt={option.label}
                  className="w-4 h-4 rounded object-cover"
                />
              )}
              <span className="max-w-[200px] truncate">{option.label}</span>
              <button
                type="button"
                onClick={(e) => handleRemoveOption(option.id, e)}
                className="hover:bg-blue-200 rounded p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          {/* Search Input */}
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={
              selectedOptions.length === 0 ? placeholder : "Search more..."
            }
            className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
            disabled={isLoading}
          />

          {/* Actions */}
          <div className="flex items-center gap-1 ml-auto">
            {selectedOptions.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearAll();
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Clear all"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            )}
            <ChevronDown
              className={`h-4 w-4 text-gray-500 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-blue-500 rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm">Loading...</p>
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{emptyMessage}</p>
              {searchQuery && (
                <p className="text-xs mt-1">No results for "{searchQuery}"</p>
              )}
            </div>
          ) : (
            <div className="py-2">
              {filteredOptions.map((option) => {
                const isSelected = value.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleToggleOption(option.id)}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-blue-50 transition-colors ${
                      isSelected ? "bg-blue-50" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-300"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>

                    {/* Image */}
                    {showImages && option.imageUrl && (
                      <img
                        src={option.imageUrl}
                        alt={option.label}
                        className="w-10 h-10 rounded object-cover flex-shrink-0"
                      />
                    )}

                    {/* Text */}
                    <div className="flex-1 text-left min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          isSelected ? "text-blue-700" : "text-gray-900"
                        }`}
                      >
                        {option.label}
                      </p>
                      {option.subtitle && (
                        <p className="text-xs text-gray-500 truncate">
                          {option.subtitle}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}

      {/* Selected Count */}
      {selectedOptions.length > 0 && (
        <p className="mt-1.5 text-xs text-gray-500">
          {selectedOptions.length} item{selectedOptions.length !== 1 ? "s" : ""}{" "}
          selected
        </p>
      )}
    </div>
  );
};
