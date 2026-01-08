import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  ChevronDown,
  Star,
  Sparkles,
  TrendingUp,
  Calendar,
  Tag,
  Package,
  Grid3x3,
  Target,
  Edit3,
  Home,
} from "lucide-react";

interface SectionTypeOption {
  value: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

interface SectionTypeSelectorProps {
  value?: string;
  onChange: (type: string, customName?: string) => void;
  customTypeName?: string;
  error?: string;
}

const SECTION_TYPES: SectionTypeOption[] = [
  {
    value: "HERO_SLIDER",
    label: "Hero Slider",
    icon: <Home className="h-4 w-4" />,
    color: "text-purple-600",
  },
  {
    value: "NEW_ARRIVALS",
    label: "New Arrivals",
    icon: <Sparkles className="h-4 w-4" />,
    color: "text-blue-600",
  },
  {
    value: "FEATURED",
    label: "Featured",
    icon: <Star className="h-4 w-4" />,
    color: "text-yellow-600",
  },
  {
    value: "COLLECTIONS",
    label: "Collections",
    icon: <Package className="h-4 w-4" />,
    color: "text-green-600",
  },
  {
    value: "CATEGORIES",
    label: "Categories",
    icon: <Tag className="h-4 w-4" />,
    color: "text-pink-600",
  },
  {
    value: "BEST_SELLERS",
    label: "Best Sellers",
    icon: <TrendingUp className="h-4 w-4" />,
    color: "text-red-600",
  },
  {
    value: "TRENDING",
    label: "Trending",
    icon: <TrendingUp className="h-4 w-4" />,
    color: "text-orange-600",
  },
  {
    value: "SEASONAL",
    label: "Seasonal",
    icon: <Calendar className="h-4 w-4" />,
    color: "text-indigo-600",
  },
  {
    value: "CATEGORY_SPOTLIGHT",
    label: "Category Spotlight",
    icon: <Target className="h-4 w-4" />,
    color: "text-teal-600",
  },
  {
    value: "CUSTOM",
    label: "Custom",
    icon: <Edit3 className="h-4 w-4" />,
    color: "text-gray-600",
  },
];

export const SectionTypeSelector: React.FC<SectionTypeSelectorProps> = ({
  value = "FEATURED",
  onChange,
  customTypeName,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const localCustomName = customTypeName;


  const selectedOption = SECTION_TYPES.find((option) => option.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);



  const filteredOptions = SECTION_TYPES.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (optionValue: string) => {
    onChange(
      optionValue,
      optionValue === "CUSTOM" ? localCustomName : undefined
    );
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleCustomNameChange = (name: string) => {
    onChange("CUSTOM", name);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        Section Type *
      </label>

      <div className="relative" ref={dropdownRef}>
        {/* Selected Value Display */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-4 py-3 border rounded-lg text-left flex items-center justify-between transition-colors ${
            error
              ? "border-red-500 focus:ring-2 focus:ring-red-500"
              : "border-gray-300 focus:ring-2 focus:ring-purple-500"
          } focus:outline-none bg-white`}
        >
          <div className="flex items-center gap-3">
            {selectedOption && (
              <span className={selectedOption.color}>
                {selectedOption.icon}
              </span>
            )}
            <span className="text-gray-900 font-medium">
              {selectedOption?.label || "Select type..."}
            </span>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-gray-400 transition-transform ${
              isOpen ? "transform rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search section types..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Options */}
            <div className="max-h-64 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500">
                  No section types found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                      value === option.value ? "bg-purple-50" : ""
                    }`}
                  >
                    <span className={option.color}>{option.icon}</span>
                    <span
                      className={`font-medium ${
                        value === option.value
                          ? "text-purple-700"
                          : "text-gray-900"
                      }`}
                    >
                      {option.label}
                    </span>
                    {value === option.value && (
                      <span className="ml-auto">
                        <div className="h-2 w-2 bg-purple-600 rounded-full" />
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Custom Type Name Input */}
      {value === "CUSTOM" && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Custom Type Name *
          </label>
          <input
            type="text"
            value={localCustomName}
            onChange={(e) => handleCustomNameChange(e.target.value)}
            placeholder="e.g., Brand Story, Testimonials, etc."
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
              error && value === "CUSTOM"
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-purple-500"
            }`}
            maxLength={100}
          />
          <p className="mt-1 text-xs text-gray-500">
            Enter a descriptive name for your custom section type
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
          <span className="font-medium">⚠</span>
          {error}
        </p>
      )}
    </div>
  );
};
