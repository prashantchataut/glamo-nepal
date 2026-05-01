import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "@/utils/AppError";
import { logger } from "@/config/logger";
import { env } from "@/config/env";

function formatZodErrors(error: ZodError): string[] {
  return error.errors.map((err) => `${err.path.join(".")}: ${err.message}`);
}

function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): AppError {
  switch (error.code) {
    case "P2002":
      return AppError.conflict(
        `Duplicate value for: ${(error.meta?.target as string[])?.join(", ") ?? "field"}`
      );
    case "P2025":
      return AppError.notFound("Record not found");
    case "P2003":
      return AppError.badRequest("Related record not found");
    case "P2011":
      return AppError.badRequest("Required field is missing");
    default:
      return AppError.internal("Database operation failed");
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = 500;
  let message = "Internal server error";
  let errors: unknown[] = [];

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
    errors = formatZodErrors(err);
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const appError = handlePrismaError(err);
    statusCode = appError.statusCode;
    message = appError.message;
  } else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  } else if (err.name === "SyntaxError" && "status" in err && (err as any).status === 400) {
    statusCode = 400;
    message = "Invalid JSON";
  }

  if (statusCode >= 500) {
    logger.error("Unhandled error:", err);
  } else {
    logger.warn(`Client error [${statusCode}]: ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
}