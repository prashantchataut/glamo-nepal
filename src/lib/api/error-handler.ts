import { GlamoApiError } from "@/lib/api/client";

export function getUserMessage(error: unknown): string {
  if (error instanceof GlamoApiError) {
    switch (error.code) {
      case "NETWORK_ERROR":
        return "Unable to connect. Please check your connection.";
      case "API_BASE_URL_MISSING":
        return "Service unavailable. Please try again later.";
      case "PRICE_MISMATCH":
        return "Prices changed. Please refresh and try again.";
      case "INSUFFICIENT_STOCK":
        return error.message || "Out of stock. Please try again.";
      case "UNAUTHORIZED":
        return "Please sign in again.";
      default:
        return error.message || "Something went wrong. Please try again.";
    }
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
