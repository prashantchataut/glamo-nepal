import morgan from "morgan";
import { Request, Response, NextFunction } from "express";
import { logger } from "@/config/logger";
import { env } from "@/config/env";

const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

const skip = () => env.NODE_ENV === "test";

export const requestLogger = env.NODE_ENV === "production"
  ? morgan("combined", { stream, skip })
  : morgan("dev", { stream, skip });