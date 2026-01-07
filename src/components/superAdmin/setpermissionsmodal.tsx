import React, { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Save,
  Check,
  ChevronDown,
  Search,
  Package,
  ShoppingCart,
  Users,
  Warehouse,
  Star,
  RotateCcw,
  MessageSquare,
  Truck,
  FolderTree,
  Loader2,
} from "lucide-react";
import type { User } from "@/lib/types/user/user";
import { adminUserApi } from "@/lib/api/api.auth.service";

interface SetPermissionsModalProps {
  user: User;
  onClose: () => void;
}

interface Module {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

interface ModulePermissions {
  module: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

const AVAILABLE_MODULES: Module[] = [
  {
    id: "products",
    name: "Products",
    icon: <Package className="h-5 w-5" />,
    description: "Manage product catalog",
  },
  {
    id: "orders",
    name: "Orders",
    icon: <ShoppingCart className="h-5 w-5" />,
    description: "Handle customer orders",
  },
  {
    id: "categories",
    name: "Categories",
    icon: <FolderTree className="h-5 w-5" />,
    description: "Organize product categories",
  },
  {
    id: "users",
    name: "Users",
    icon: <Users className="h-5 w-5" />,
    description: "Manage user accounts",
  },
  {
    id: "warehouses",
    name: "Warehouses",
    icon: <Warehouse className="h-5 w-5" />,
    description: "Warehouse management",
  },
  {
    id: "reviews",
    name: "Reviews",
    icon: <Star className="h-5 w-5" />,
    description: "Customer reviews",
  },
  {
    id: "returns",
    name: "Returns",
    icon: <RotateCcw className="h-5 w-5" />,
    description: "Return requests",
  },
  {
    id: "consultations",
    name: "Consultations",
    icon: <MessageSquare className="h-5 w-5" />,
    description: "Customer consultations",
  },
  {
    id: "shipments",
    name: "Shipments",
    icon: <Truck className="h-5 w-5" />,
    description: "Shipping management",
  },
];

export const SetPermissionsModal: React.FC<SetPermissionsModalProps> = ({
  user,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [modulePermissions, setModulePermissions] = useState<
    Record<string, ModulePermissions>
  >({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch existing permissions
  const { data: permissionsData, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ["permissions", user.id],
    queryFn: async () => {
      const response = await adminUserApi.getUserPermissions(user.id);
      return response.data;
    },
  });

  // Initialize permissions from existing data
  useEffect(() => {
    if (permissionsData && Array.isArray(permissionsData)) {
      const initialPermissions: Record<string, ModulePermissions> = {};
      const initialModules: string[] = [];

      permissionsData.forEach((perm: any) => {
        initialPermissions[perm.module] = {
          module: perm.module,
          canCreate: perm.canCreate,
          canRead: perm.canRead,
          canUpdate: perm.canUpdate,
          canDelete: perm.canDelete,
        };
        initialModules.push(perm.module);
      });

      setModulePermissions(initialPermissions);
      setSelectedModules(initialModules);
    }
  }, [permissionsData]);

  // Set permissions mutation
  const setPermissionsMutation = useMutation({
    mutationFn: adminUserApi.setPermissions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions", user.id] });
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredModules = AVAILABLE_MODULES.filter(
    (module) =>
      module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleModule = (moduleId: string) => {
    if (selectedModules.includes(moduleId)) {
      setSelectedModules(selectedModules.filter((m) => m !== moduleId));
      const newPermissions = { ...modulePermissions };
      delete newPermissions[moduleId];
      setModulePermissions(newPermissions);
    } else {
      setSelectedModules([...selectedModules, moduleId]);
      // Initialize with default permissions
      setModulePermissions({
        ...modulePermissions,
        [moduleId]: {
          module: moduleId,
          canCreate: false,
          canRead: true, // Default read access
          canUpdate: false,
          canDelete: false,
        },
      });
    }
  };

  const updatePermission = (
    moduleId: string,
    permission: keyof Omit<ModulePermissions, "module">,
    value: boolean
  ) => {
    setModulePermissions({
      ...modulePermissions,
      [moduleId]: {
        ...modulePermissions[moduleId],
        [permission]: value,
      },
    });
  };

  const handleSaveAll = async () => {
    try {
      // Save permissions for all selected modules
      const promises = selectedModules.map((moduleId) => {
        const perms = modulePermissions[moduleId];
        return adminUserApi.setPermissions({
          userId: user.id,
          module: moduleId,
          canCreate: perms.canCreate,
          canRead: perms.canRead,
          canUpdate: perms.canUpdate,
          canDelete: perms.canDelete,
        });
      });

      await Promise.all(promises);
      queryClient.invalidateQueries({ queryKey: ["permissions", user.id] });
      onClose();
    } catch (error) {
      console.error("Error saving permissions:", error);
    }
  };

  const getModuleInfo = (moduleId: string) =>
    AVAILABLE_MODULES.find((m) => m.id === moduleId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Set Permissions
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {user.firstName} {user.lastName} ({user.email})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Loading State */}
          {isLoadingPermissions && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              <span className="ml-3 text-gray-600">Loading permissions...</span>
            </div>
          )}

          {!isLoadingPermissions && (
            <>
              {/* Module Selector with Autocomplete */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Modules *
                </label>
                <div className="relative" ref={dropdownRef}>
                  {/* Selected Modules Display */}
                  <div
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-full min-h-[42px] px-3 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 cursor-pointer bg-white"
                  >
                    {selectedModules.length === 0 ? (
                      <span className="text-gray-400">
                        Select modules to grant permissions...
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedModules.map((moduleId) => {
                          const module = getModuleInfo(moduleId);
                          return (
                            <span
                              key={moduleId}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm"
                            >
                              {module?.icon}
                              {module?.name}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleModule(moduleId);
                                }}
                                className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <ChevronDown
                      className={`absolute right-3 top-3 h-5 w-5 text-gray-400 transition-transform ${
                        showDropdown ? "transform rotate-180" : ""
                      }`}
                    />
                  </div>

                  {/* Dropdown */}
                  {showDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
                      {/* Search */}
                      <div className="p-2 border-b border-gray-200">
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search modules..."
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                      </div>

                      {/* Module List */}
                      <div className="overflow-y-auto max-h-60">
                        {filteredModules.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            No modules found
                          </div>
                        ) : (
                          filteredModules.map((module) => {
                            const isSelected = selectedModules.includes(
                              module.id
                            );
                            return (
                              <div
                                key={module.id}
                                onClick={() => toggleModule(module.id)}
                                className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                                  isSelected ? "bg-blue-50" : ""
                                }`}
                              >
                                <div
                                  className={`flex-shrink-0 w-5 h-5 border-2 rounded flex items-center justify-center ${
                                    isSelected
                                      ? "bg-blue-600 border-blue-600"
                                      : "border-gray-300"
                                  }`}
                                >
                                  {isSelected && (
                                    <Check className="h-3 w-3 text-white" />
                                  )}
                                </div>
                                <div
                                  className={`flex-shrink-0 ${
                                    isSelected
                                      ? "text-blue-600"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {module.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-sm font-medium ${
                                      isSelected
                                        ? "text-blue-900"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {module.name}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {module.description}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {selectedModules.length} module(s) selected
                </p>
              </div>

              {/* Permissions Grid */}
              {selectedModules.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">
                      Module Permissions
                    </h3>
                    <span className="text-xs text-gray-500">
                      Configure CRUD permissions for each module
                    </span>
                  </div>

                  <div className="space-y-3">
                    {selectedModules.map((moduleId) => {
                      const module = getModuleInfo(moduleId);
                      const perms = modulePermissions[moduleId];

                      return (
                        <div
                          key={moduleId}
                          className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex-shrink-0 text-blue-600">
                              {module?.icon}
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">
                                {module?.name}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {module?.description}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <label className="flex items-center space-x-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={perms?.canCreate || false}
                                onChange={(e) =>
                                  updatePermission(
                                    moduleId,
                                    "canCreate",
                                    e.target.checked
                                  )
                                }
                                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">
                                Create
                              </span>
                            </label>

                            <label className="flex items-center space-x-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={perms?.canRead || false}
                                onChange={(e) =>
                                  updatePermission(
                                    moduleId,
                                    "canRead",
                                    e.target.checked
                                  )
                                }
                                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">
                                Read
                              </span>
                            </label>

                            <label className="flex items-center space-x-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={perms?.canUpdate || false}
                                onChange={(e) =>
                                  updatePermission(
                                    moduleId,
                                    "canUpdate",
                                    e.target.checked
                                  )
                                }
                                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">
                                Update
                              </span>
                            </label>

                            <label className="flex items-center space-x-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={perms?.canDelete || false}
                                onChange={(e) =>
                                  updatePermission(
                                    moduleId,
                                    "canDelete",
                                    e.target.checked
                                  )
                                }
                                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">
                                Delete
                              </span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {selectedModules.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">
                    No modules selected
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Select modules above to configure permissions
                  </p>
                </div>
              )}

              {/* Success/Error Messages */}
              {setPermissionsMutation.isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {(setPermissionsMutation.error as any)?.message ||
                    "Failed to save permissions"}
                </div>
              )}

              {setPermissionsMutation.isSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Permissions saved successfully!
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {selectedModules.length > 0 && (
              <>
                Configuring permissions for{" "}
                <strong>{selectedModules.length}</strong> module(s)
              </>
            )}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              disabled={
                setPermissionsMutation.isPending || selectedModules.length === 0
              }
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {setPermissionsMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save All Permissions
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};