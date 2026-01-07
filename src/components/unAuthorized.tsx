import React from "react";
import { Link } from "react-router";
import { ShieldAlert } from "lucide-react";

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <ShieldAlert className="h-16 w-16 text-red-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
};
