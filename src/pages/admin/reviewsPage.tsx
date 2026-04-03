import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  reviewApi,
  type QueryReviewParams,
  type Review,
} from "@/lib/api/review.api";
import { toast } from "react-hot-toast";
import { BackButton } from "@/components/ui/BackButton";

// Star rating component
const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          }`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

const ReviewsPage = () => {
  const queryClient = useQueryClient();

  // State
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<QueryReviewParams>({
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch reviews with TanStack Query
  const {
    data: reviewsData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin-reviews", page, filters],
    queryFn: () =>
      reviewApi.getAllReviews({
        page,
        ...filters,
      }),
    staleTime: 30000, // 30 seconds
    retry: 2,
  });

  // Approve/Reject mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, isApproved }: { id: string; isApproved: boolean }) =>
      reviewApi.approveReview(id, { isApproved }),
    onSuccess: (response, variables) => {
      toast.success(
        `Review ${variables.isApproved ? "approved" : "rejected"} successfully`,
      );
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update review");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => reviewApi.adminDeleteReview(id),
    onSuccess: () => {
      toast.success("Review deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete review");
    },
  });

  // Handlers
  const handleApproveReview = (reviewId: string, isApproved: boolean) => {
    approveMutation.mutate({ id: reviewId, isApproved });
  };

  const handleDeleteReview = (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    deleteMutation.mutate(reviewId);
  };

  const handleFilterChange = (newFilters: Partial<QueryReviewParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1); // Reset to first page when filters change
  };

  // Extract data
  const reviews = reviewsData?.data?.reviews || [];
  const pagination = reviewsData?.data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <BackButton />
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Review Management
              </h1>
              <p className="text-slate-600 text-sm">
                Moderate and manage customer reviews
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        {reviewsData?.data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Reviews</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {pagination.total}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Pending Review</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {reviews.filter((r) => !r.isApproved).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Verified Purchase</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {reviews.filter((r) => r.isVerifiedPurchase).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Rating Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Rating
            </label>
            <select
              value={filters.rating || ""}
              onChange={(e) =>
                handleFilterChange({
                  rating: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          {/* Approval Status */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Status
            </label>
            <select
              value={
                filters.isApproved === undefined
                  ? ""
                  : filters.isApproved
                    ? "true"
                    : "false"
              }
              onChange={(e) =>
                handleFilterChange({
                  isApproved:
                    e.target.value === ""
                      ? undefined
                      : e.target.value === "true",
                })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="true">Approved</option>
              <option value="false">Pending</option>
            </select>
          </div>

          {/* Verified Purchase */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Purchase
            </label>
            <select
              value={
                filters.isVerifiedPurchase === undefined
                  ? ""
                  : filters.isVerifiedPurchase
                    ? "true"
                    : "false"
              }
              onChange={(e) =>
                handleFilterChange({
                  isVerifiedPurchase:
                    e.target.value === ""
                      ? undefined
                      : e.target.value === "true",
                })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) =>
                handleFilterChange({
                  sortBy: e.target.value as QueryReviewParams["sortBy"],
                })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="createdAt">Date</option>
              <option value="rating">Rating</option>
              <option value="helpfulCount">Helpful Count</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Order
            </label>
            <select
              value={filters.sortOrder}
              onChange={(e) =>
                handleFilterChange({
                  sortOrder: e.target.value as "asc" | "desc",
                })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <svg
            className="w-12 h-12 text-red-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-red-900 mb-1">
            Failed to load reviews
          </h3>
          <p className="text-red-600">
            {error instanceof Error ? error.message : "An error occurred"}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && reviews.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <svg
            className="w-16 h-16 text-slate-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            No reviews found
          </h3>
          <p className="text-slate-500">
            Try adjusting your filters to see more results
          </p>
        </div>
      )}

      {/* Reviews List */}
      {!isLoading && !isError && reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  {/* Product Image */}
                  {review.product.media?.[0] && (
                    <img
                      src={review.product.media[0].url}
                      alt={review.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}

                  <div className="flex-1">
                    {/* Product Name */}
                    <h3 className="font-semibold text-slate-900 mb-1">
                      {review.product.name}
                    </h3>

                    {/* User Info */}
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                      <span className="font-medium">
                        {review.user.firstName} {review.user.lastName}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                      {review.isVerifiedPurchase && (
                        <>
                          <span className="text-slate-400">•</span>
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Verified Purchase
                          </span>
                        </>
                      )}
                    </div>

                    {/* Rating */}
                    <StarRating rating={review.rating} />
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      review.isApproved
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {review.isApproved ? "Approved" : "Pending"}
                  </span>
                </div>
              </div>

              {/* Review Comment */}
              {review.comment && (
                <p className="text-slate-700 mb-4 leading-relaxed">
                  {review.comment}
                </p>
              )}

              {/* Review Media */}
              {review.media && review.media.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto">
                  {review.media.map((media) => (
                    <img
                      key={media.id}
                      src={media.thumbnailUrl || media.url}
                      alt="Review media"
                      className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(media.url, "_blank")}
                    />
                  ))}
                </div>
              )}

              {/* Legacy Images */}
              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto">
                  {review.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Review image ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(image, "_blank")}
                    />
                  ))}
                </div>
              )}

              {/* Helpful Count */}
              {review.helpfulCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                    />
                  </svg>
                  <span>{review.helpfulCount} people found this helpful</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-slate-200">
                {!review.isApproved ? (
                  <button
                    onClick={() => handleApproveReview(review.id, true)}
                    disabled={approveMutation.isPending}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {approveMutation.isPending ? "Processing..." : "Approve"}
                  </button>
                ) : (
                  <button
                    onClick={() => handleApproveReview(review.id, false)}
                    disabled={approveMutation.isPending}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {approveMutation.isPending ? "Processing..." : "Unapprove"}
                  </button>
                )}
                <button
                  onClick={() => handleDeleteReview(review.id)}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </button>
                <button
                  onClick={() => {
                    setSelectedReview(review);
                    setShowModal(true);
                  }}
                  className="px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium text-sm"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !isError && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === pagination.totalPages ||
                  Math.abs(p - page) <= 2,
              )
              .map((p, idx, arr) => (
                <React.Fragment key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="text-slate-400">...</span>
                  )}
                  <button
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      p === page
                        ? "bg-purple-500 text-white"
                        : "bg-white border border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))}
          </div>

          <button
            onClick={() =>
              setPage((p) => Math.min(pagination.totalPages, p + 1))
            }
            disabled={page === pagination.totalPages}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {showModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  Review Details
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    Product
                  </label>
                  <p className="text-slate-900 font-medium">
                    {selectedReview.product.name}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-600">
                    Customer
                  </label>
                  <p className="text-slate-900">
                    {selectedReview.user.firstName}{" "}
                    {selectedReview.user.lastName}
                  </p>
                  <p className="text-sm text-slate-500">
                    {selectedReview.user.email}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-600">
                    Rating
                  </label>
                  <div className="mt-1">
                    <StarRating rating={selectedReview.rating} />
                  </div>
                </div>

                {selectedReview.comment && (
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Comment
                    </label>
                    <p className="text-slate-900 mt-1">
                      {selectedReview.comment}
                    </p>
                  </div>
                )}

                {selectedReview.order && (
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Order
                    </label>
                    <p className="text-slate-900">
                      {selectedReview.order.orderNumber}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-slate-600">
                    Status
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedReview.isApproved
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {selectedReview.isApproved ? "Approved" : "Pending"}
                    </span>
                    {selectedReview.isVerifiedPurchase && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-600">
                    Created
                  </label>
                  <p className="text-slate-900">
                    {new Date(selectedReview.createdAt).toLocaleString()}
                  </p>
                </div>

                {selectedReview.helpfulCount > 0 && (
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Helpful Votes
                    </label>
                    <p className="text-slate-900">
                      {selectedReview.helpfulCount}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsPage;
