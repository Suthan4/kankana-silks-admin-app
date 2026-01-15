import React, { useState } from "react";
import { Globe, Tag, Package, Users, Info } from "lucide-react";
import { CategoryProductSelector } from "./Categoryproductselector";

interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  media?: Array<{ url: string }>;
  category?: { id: string; name: string };
}

interface Category {
  id: string;
  name: string;
  children?: Array<{ id: string; name: string }>;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export enum CouponScope {
  ALL = "ALL",
  CATEGORY = "CATEGORY",
  PRODUCT = "PRODUCT",
}

export enum CouponUserEligibility {
  ALL = "ALL",
  SPECIFIC_USERS = "SPECIFIC_USERS",
  FIRST_TIME = "FIRST_TIME",
  NEW_USERS = "NEW_USERS",
}

interface CouponScopeSelectorProps {
  // Scope
  scope: CouponScope;
  onScopeChange: (scope: CouponScope) => void;
  selectedCategoryIds: string[];
  selectedProductIds: string[];
  onCategoriesChange: (ids: string[]) => void;
  onProductsChange: (ids: string[]) => void;

  // User Eligibility
  userEligibility: CouponUserEligibility;
  onUserEligibilityChange: (eligibility: CouponUserEligibility) => void;
  selectedUserIds: string[];
  onUsersChange: (ids: string[]) => void;
  newUserDays?: number;
  onNewUserDaysChange: (days: number) => void;

  // Data
  products: Product[];
  categories: Category[];
  users?: User[];
  isLoading?: boolean;
}

export const CouponScopeSelector: React.FC<CouponScopeSelectorProps> = ({
  scope,
  onScopeChange,
  selectedCategoryIds,
  selectedProductIds,
  onCategoriesChange,
  onProductsChange,
  userEligibility,
  onUserEligibilityChange,
  selectedUserIds,
  onUsersChange,
  newUserDays,
  onNewUserDaysChange,
  products,
  categories,
  users = [],
  isLoading = false,
}) => {
  return (
    <div className="space-y-6">
      {/* SCOPE SECTION */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Coupon Scope
        </h4>

        {/* Scope Type Selector */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            type="button"
            onClick={() => onScopeChange(CouponScope.ALL)}
            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
              scope === CouponScope.ALL
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            <Globe className="h-4 w-4 mx-auto mb-1" />
            All Products
          </button>
          <button
            type="button"
            onClick={() => onScopeChange(CouponScope.CATEGORY)}
            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
              scope === CouponScope.CATEGORY
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            <Tag className="h-4 w-4 mx-auto mb-1" />
            By Category
          </button>
          <button
            type="button"
            onClick={() => onScopeChange(CouponScope.PRODUCT)}
            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
              scope === CouponScope.PRODUCT
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            <Package className="h-4 w-4 mx-auto mb-1" />
            Specific Products
          </button>
        </div>

        {/* Scope Description */}
        <div className="text-xs text-gray-600 bg-white p-3 rounded border border-gray-200">
          {scope === CouponScope.ALL && (
            <p>✓ Applies to all products in the store</p>
          )}
          {scope === CouponScope.CATEGORY && (
            <p>✓ Applies only to products in selected categories</p>
          )}
          {scope === CouponScope.PRODUCT && (
            <p>✓ Applies only to specific products you select</p>
          )}
        </div>

        {/* Category/Product Selection */}
        {(scope === CouponScope.CATEGORY || scope === CouponScope.PRODUCT) && (
          <div className="mt-4">
            <CategoryProductSelector
              products={products}
              categories={categories}
              selectedProductIds={selectedProductIds}
              selectedCategoryIds={selectedCategoryIds}
              onProductsChange={onProductsChange}
              onCategoriesChange={onCategoriesChange}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>

      {/* USER ELIGIBILITY SECTION */}
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Users className="h-4 w-4" />
          User Eligibility
        </h4>

        {/* Eligibility Type Selector */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={() => onUserEligibilityChange(CouponUserEligibility.ALL)}
            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
              userEligibility === CouponUserEligibility.ALL
                ? "border-purple-600 bg-purple-50 text-purple-700"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            <Globe className="h-4 w-4 mx-auto mb-1" />
            All Users
          </button>
          <button
            type="button"
            onClick={() =>
              onUserEligibilityChange(CouponUserEligibility.FIRST_TIME)
            }
            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
              userEligibility === CouponUserEligibility.FIRST_TIME
                ? "border-purple-600 bg-purple-50 text-purple-700"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            <Users className="h-4 w-4 mx-auto mb-1" />
            First Time Buyers
          </button>
          <button
            type="button"
            onClick={() =>
              onUserEligibilityChange(CouponUserEligibility.NEW_USERS)
            }
            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
              userEligibility === CouponUserEligibility.NEW_USERS
                ? "border-purple-600 bg-purple-50 text-purple-700"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            <Users className="h-4 w-4 mx-auto mb-1" />
            New Users
          </button>
          <button
            type="button"
            onClick={() =>
              onUserEligibilityChange(CouponUserEligibility.SPECIFIC_USERS)
            }
            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
              userEligibility === CouponUserEligibility.SPECIFIC_USERS
                ? "border-purple-600 bg-purple-50 text-purple-700"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            <Users className="h-4 w-4 mx-auto mb-1" />
            Specific Users
          </button>
        </div>

        {/* Eligibility Description */}
        <div className="text-xs text-gray-600 bg-white p-3 rounded border border-gray-200">
          {userEligibility === CouponUserEligibility.ALL && (
            <p>✓ Any user can use this coupon</p>
          )}
          {userEligibility === CouponUserEligibility.FIRST_TIME && (
            <p>✓ Only users who haven't made any purchase yet</p>
          )}
          {userEligibility === CouponUserEligibility.NEW_USERS && (
            <p>✓ Only users registered within specified days</p>
          )}
          {userEligibility === CouponUserEligibility.SPECIFIC_USERS && (
            <p>✓ Only specific users you select</p>
          )}
        </div>

        {/* NEW_USERS - Days Input */}
        {userEligibility === CouponUserEligibility.NEW_USERS && (
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              New User Period (Days) *
            </label>
            <input
              type="number"
              min="1"
              value={newUserDays || ""}
              onChange={(e) => onNewUserDaysChange(parseInt(e.target.value))}
              placeholder="e.g., 30"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Users registered within last {newUserDays || "X"} days can use
              this coupon
            </p>
          </div>
        )}

        {/* SPECIFIC_USERS - User Selection */}
        {userEligibility === CouponUserEligibility.SPECIFIC_USERS && (
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Users *
            </label>
            {/* Add MultiSelectAutocomplete for users here */}
            <p className="text-sm text-gray-600">
              User selection component would go here
            </p>
          </div>
        )}
      </div>

      {/* SUMMARY */}
      {(selectedCategoryIds.length > 0 ||
        selectedProductIds.length > 0 ||
        selectedUserIds.length > 0) && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Coupon Restrictions Summary
          </h4>
          <div className="space-y-1 text-sm text-gray-700">
            {scope === CouponScope.ALL && <p>🌐 Applies to all products</p>}
            {scope === CouponScope.CATEGORY &&
              selectedCategoryIds.length > 0 && (
                <p>
                  📁 Applies to {selectedCategoryIds.length} categor
                  {selectedCategoryIds.length !== 1 ? "ies" : "y"}
                </p>
              )}
            {scope === CouponScope.PRODUCT && selectedProductIds.length > 0 && (
              <p>
                📦 Applies to {selectedProductIds.length} specific product
                {selectedProductIds.length !== 1 ? "s" : ""}
              </p>
            )}
            {userEligibility !== CouponUserEligibility.ALL && (
              <p className="text-purple-700 font-medium">
                👥 Restricted to{" "}
                {userEligibility === CouponUserEligibility.FIRST_TIME
                  ? "first-time buyers"
                  : userEligibility === CouponUserEligibility.NEW_USERS
                  ? `users registered within ${newUserDays || "X"} days`
                  : `${selectedUserIds.length} specific user${
                      selectedUserIds.length !== 1 ? "s" : ""
                    }`}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
