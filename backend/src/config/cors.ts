import { env } from "./env";

interface CorsOriginCallback {
  (err: Error | null, allow?: boolean): void;
}

export const corsOptions = {
  origin: (origin: string | undefined, callback: CorsOriginCallback) => {
    const allowedOrigins = env.CORS_ORIGINS.split(",").map((o) => o.trim());
    if (!origin || allowedOrigins.includes(origin) || env.NODE_ENV === "development") {
      callback(null, true);
    } else {
      callback(new Error(`CORS origin ${origin} not allowed`), false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as string[],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"] as string[],
  exposedHeaders: ["X-Total-Count"] as string[],
  maxAge: 86400,
};