import { apiRequest } from "@/lib/api/client";

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isApproved: number;
  createdAt: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const reviewApi = {
  getProductReviews: (productId: string, page = 1, limit = 10) =>
    apiRequest<ReviewsResponse>(`/reviews/product/${productId}?page=${page}&limit=${limit}`),

  createReview: (productId: string, data: { rating: number; title?: string; comment?: string }) =>
    apiRequest<Review>(`/reviews`, {
      method: "POST",
      body: JSON.stringify({ ...data, entityId: productId }),
    }),
};