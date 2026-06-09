"use client";

import { useCallback, useEffect, useState } from "react";
import { Star, MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { reviewApi, type Review } from "@/lib/api/reviews";
import { useAuthStore } from "@/store/useAuthStore";

function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 16,
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(i + 1)}
          className={cn(
            "transition",
            readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"
          )}
          aria-label={`${i + 1} star${i > 0 ? "s" : ""}`}
        >
          <Star
            size={size}
            fill={i < value ? "currentColor" : "none"}
            className={i < value ? "text-secondary" : "text-neutral-300"}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const date = new Date(review.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="rounded-[1.25rem] border border-neutral-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-neutral-950">{review.userName}</p>
          <p className="mt-0.5 text-xs text-neutral-500">{date}</p>
        </div>
        <StarRating value={review.rating} readOnly size={14} />
      </div>
      {review.title && (
        <p className="mt-3 text-sm font-semibold text-neutral-950">{review.title}</p>
      )}
      {review.comment && (
        <p className="mt-2 text-sm leading-7 text-neutral-600">{review.comment}</p>
      )}
    </div>
  );
}

function ReviewForm({
  productId,
  onSuccess,
}: {
  productId: string;
  onSuccess: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (rating === 0) {
        toast.error("Please select a rating");
        return;
      }
      setIsSubmitting(true);
      try {
        await reviewApi.createReview(productId, {
          rating,
          title: title.trim() || undefined,
          comment: comment.trim() || undefined,
        });
        toast.success("Review submitted!");
        setRating(0);
        setTitle("");
        setComment("");
        onSuccess();
      } catch {
        toast.error("Failed to submit review");
      } finally {
        setIsSubmitting(false);
      }
    },
    [productId, rating, title, comment, onSuccess]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-neutral-950">Your rating</label>
        <div className="mt-2">
          <StarRating value={rating} onChange={setRating} size={22} />
        </div>
      </div>
      <label className="block space-y-2 text-sm font-semibold text-neutral-950">
        Title (optional)
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          maxLength={120}
          className="mt-1 w-full rounded-xl border border-neutral-200 bg-brand-bgLight px-4 py-3 text-sm text-neutral-950 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-neutral-400"
        />
      </label>
      <label className="block space-y-2 text-sm font-semibold text-neutral-950">
        Your review (optional)
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share details about your experience with this product"
          rows={4}
          maxLength={1000}
          className="mt-1 w-full rounded-xl border border-neutral-200 bg-brand-bgLight px-4 py-3 text-sm leading-7 text-neutral-950 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-neutral-400"
        />
      </label>
      <button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-neutral-950 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-primary disabled:cursor-not-allowed disabled:bg-neutral-300"
      >
        {isSubmitting ? "Submitting..." : "Submit review"}
      </button>
    </form>
  );
}

export function ReviewSection({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const user = useAuthStore((s) => s.user);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await reviewApi.getProductReviews(productId, page, 5);
      const data = result.data;
      setReviews(data.reviews ?? []);
      setTotalCount(data.pagination?.total ?? 0);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch {
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, [productId, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-[0_18px_70px_-54px_rgba(26,21,18,0.55)] md:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-neutral-950">
              Customer reviews
            </h2>
            {totalCount > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <StarRating value={Math.round(avgRating)} readOnly size={16} />
                <span className="text-sm text-neutral-500">
                  {avgRating.toFixed(1)} out of 5 ({totalCount} review
                  {totalCount !== 1 ? "s" : ""})
                </span>
              </div>
            )}
          </div>
          {user ? (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="btn-press inline-flex items-center gap-2 rounded-full bg-neutral-950 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-primary"
            >
              <MessageSquarePlus size={15} />
              {showForm ? "Cancel" : "Write a review"}
            </button>
          ) : (
            <p className="text-sm text-neutral-500">
              <a href="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </a>{" "}
              to write a review
            </p>
          )}
        </div>

        {showForm && user && (
          <div className="mt-6 rounded-[1.25rem] border border-neutral-200 bg-brand-bgLight p-5">
            <ReviewForm productId={productId} onSuccess={fetchReviews} />
          </div>
        )}

        <div className="mt-6 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 animate-pulse rounded-[1.25rem] bg-neutral-100"
                />
              ))}
            </div>
          ) : reviews.length > 0 ? (
            <>
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-neutral-500">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
                <Star size={28} />
              </div>
              <p className="mt-4 font-display text-lg font-semibold text-neutral-950">
                No reviews yet
              </p>
              <p className="mt-2 text-sm text-neutral-500">
                Be the first to share your thoughts on this product.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}