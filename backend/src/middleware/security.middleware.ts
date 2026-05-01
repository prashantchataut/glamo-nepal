import helmet from "helmet";
import hpp from "hpp";
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import { corsOptions } from "@/config/cors";
import { generalRateLimit, apiRateLimit } from "./rateLimit.middleware";
import { sanitizeBody } from "@/utils/sanitize";
import { env } from "@/config/env";

export function applySecurityMiddleware(app: express.Application): void {
  app.set("trust proxy", 1);
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        connectSrc: ["'self'", env.FRONTEND_URL],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  }));
  app.use(cors(corsOptions));
  app.use(hpp());
  app.use(cookieParser());
  app.use(express.json({ limit: "10mb" }));
  app.use(sanitizeBody);
  app.use(generalRateLimit);
  app.use(apiRateLimit);
}