import rateLimit from "express-rate-limit";
import { env } from "@/config/env";

export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: env.NODE_ENV === "production" ? 100 : 1000,
  message: {
    success: false,
    message: "API rate limit exceeded",
  },
  standardHeaders: true,
  legacyHeaders: false,
});