import React, { useState, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  Search,
  CheckSquare,
  Square,
  Folder,
  Tag,
  X,
  Layers,
  Check,
} from "lucide-react";
import type { BulkCategoryNode, BulkCategoryLookup } from "@/lib/types/product/bulkProduct";

interface BulkCategoryTreeSelectorProps {
  categoriesTree: BulkCategoryNode[];
  flatCategories: BulkCategoryLookup[];
  selectedCategoryIds: string[];
  onChange: (selectedIds: string[]) => void;
  isLoading?: boolean;
}

export const BulkCategoryTreeSelector: React.FC<BulkCategoryTreeSelectorProps> = ({
  categoriesTree,
  flatCategories,
  selectedCategoryIds,
  onChange,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    () => new Set(categoriesTree.map((c) => c.id))
  );

  const flatMap = useMemo(() => {
    const map = new Map<string, BulkCategoryLookup>();
    for (const c of flatCategories) {
      map.set(c.id, c);
    }
    return map;
  }, [flatCategories]);

  // Toggle expanded state for a node
  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const traverse = (nodes: BulkCategoryNode[]) => {
      for (const n of nodes) {
        allIds.add(n.id);
        if (n.children && n.children.length > 0) {
          traverse(n.children);
        }
      }
    };
    traverse(categoriesTree);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Helper to gather all descendant IDs of a category node
  const getDescendantIds = (node: BulkCategoryNode): string[] => {
    const ids: string[] = [node.id];
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        ids.push(...getDescendantIds(child));
      }
    }
    return ids;
  };

  // Toggle single category selection
  const handleToggleSelect = (node: BulkCategoryNode, includeDescendants = false) => {
    const idsToToggle = includeDescendants ? getDescendantIds(node) : [node.id];
    const isCurrentlySelected = selectedCategoryIds.includes(node.id);

    if (isCurrentlySelected) {
      // Remove these IDs
      const toRemove = new Set(idsToToggle);
      onChange(selectedCategoryIds.filter((id) => !toRemove.has(id)));
    } else {
      // Add these IDs
      const next = new Set([...selectedCategoryIds, ...idsToToggle]);
      onChange(Array.from(next));
    }
  };

  const handleRemoveCategory = (id: string) => {
    onChange(selectedCategoryIds.filter((item) => item !== id));
  };

  const handleSelectAll = () => {
    onChange(flatCategories.map((c) => c.id));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  // Filter tree by search term
  const filteredTree = useMemo(() => {
    if (!searchTerm.trim()) return categoriesTree;

    const term = searchTerm.toLowerCase();

    const filterNode = (node: BulkCategoryNode): BulkCategoryNode | null => {
      const nameMatches = node.name.toLowerCase().includes(term);
      const pathMatches = node.path.toLowerCase().includes(term);

      const filteredChildren = (node.children || [])
        .map(filterNode)
        .filter((child): child is BulkCategoryNode => child !== null);

      if (nameMatches || pathMatches || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        };
      }
      return null;
    };

    return categoriesTree
      .map(filterNode)
      .filter((n): n is BulkCategoryNode => n !== null);
  }, [categoriesTree, searchTerm]);

  // Recursive Tree Node Renderer
  const renderNode = (node: BulkCategoryNode, level = 0) => {
    const isExpanded = expandedNodes.has(node.id) || Boolean(searchTerm);
    const isSelected = selectedCategoryIds.includes(node.id);
    const hasChildren = node.children && node.children.length > 0;

    // Check if some children are selected
    const allDescendantIds = getDescendantIds(node);
    const selectedDescendants = allDescendantIds.filter((id) =>
      selectedCategoryIds.includes(id)
    );
    const isPartiallySelected =
      selectedDescendants.length > 0 &&
      selectedDescendants.length < allDescendantIds.length &&
      !isSelected;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center justify-between py-2 px-3 rounded-lg text-sm transition-colors group ${
            isSelected
              ? "bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200"
              : "hover:bg-slate-100/70 border border-transparent"
          }`}
          style={{ paddingLeft: `${Math.max(level * 22, 10)}px` }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Expand / Collapse Icon */}
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(node.id)}
                className="p-1 rounded hover:bg-slate-200/70 text-slate-500 hover:text-slate-800 transition"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <span className="w-6 inline-block" />
            )}

            {/* Checkbox */}
            <button
              type="button"
              onClick={() => handleToggleSelect(node, false)}
              className="flex items-center text-slate-700 hover:text-blue-600 transition"
            >
              {isSelected ? (
                <div className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
              ) : isPartiallySelected ? (
                <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-600 flex items-center justify-center">
                  <div className="w-2 h-0.5 bg-blue-600" />
                </div>
              ) : (
                <Square className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
              )}
            </button>

            {/* Category Icon & Name */}
            <div
              className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
              onClick={() => handleToggleSelect(node, false)}
            >
              {hasChildren ? (
                <Folder
                  className={`h-4 w-4 shrink-0 ${
                    isSelected ? "text-blue-600" : "text-amber-500"
                  }`}
                />
              ) : (
                <Tag
                  className={`h-4 w-4 shrink-0 ${
                    isSelected ? "text-blue-600" : "text-emerald-500"
                  }`}
                />
              )}
              <span
                className={`truncate font-medium ${
                  isSelected
                    ? "text-blue-900 font-semibold"
                    : "text-slate-700"
                }`}
              >
                {node.name}
              </span>

              {/* Leaf vs Branch Badge */}
              {hasChildren ? (
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded font-medium shrink-0">
                  Parent ({node.children.length})
                </span>
              ) : (
                <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] rounded font-medium shrink-0 border border-emerald-200">
                  Assignable Leaf
                </span>
              )}
            </div>
          </div>

          {/* Quick Action: Select with all descendants */}
          {hasChildren && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleSelect(node, true);
              }}
              title="Include this category and all subcategories"
              className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 font-medium transition shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              + All Subcategories
            </button>
          )}
        </div>

        {/* Child Nodes */}
        {hasChildren && isExpanded && (
          <div className="space-y-0.5 mt-0.5">
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Category Tree Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search and control bar */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search categories by name or path..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
            <button
              type="button"
              onClick={expandAll}
              className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-md text-slate-700 font-medium transition"
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-md text-slate-700 font-medium transition"
            >
              Collapse All
            </button>
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-2.5 py-1.5 bg-blue-50 border border-blue-300 hover:bg-blue-100 rounded-md text-blue-700 font-medium transition"
            >
              Select All
            </button>
            {selectedCategoryIds.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="px-2.5 py-1.5 bg-rose-50 border border-rose-300 hover:bg-rose-100 rounded-md text-rose-700 font-medium transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Tree View */}
        <div className="p-3 max-h-[360px] overflow-y-auto space-y-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <p className="text-sm text-slate-500">Loading category hierarchy...</p>
            </div>
          ) : filteredTree.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Layers className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">No categories found</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchTerm
                  ? "Try searching for a different category name."
                  : "No categories currently exist in the database."}
              </p>
            </div>
          ) : (
            filteredTree.map((rootNode) => renderNode(rootNode, 0))
          )}
        </div>
      </div>

      {/* Selected Categories Pills */}
      {selectedCategoryIds.length > 0 && (
        <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare className="h-4 w-4 text-blue-600" />
              Selected Categories ({selectedCategoryIds.length})
            </span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-rose-600 hover:text-rose-800 font-medium"
            >
              Remove All
            </button>
          </div>

          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pt-1">
            {selectedCategoryIds.map((id) => {
              const cat = flatMap.get(id);
              if (!cat) return null;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-white text-blue-800 border border-blue-300 shadow-xs"
                >
                  <span className="text-blue-500 font-mono text-[10px] mr-0.5">
                    {cat.path}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(id)}
                    className="p-0.5 hover:bg-blue-100 rounded-full text-blue-400 hover:text-blue-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
          <p className="text-xs text-blue-700 italic">
            * The Excel template will restrict product dropdown choices strictly to your selected category paths.
          </p>
        </div>
      )}
    </div>
  );
};

