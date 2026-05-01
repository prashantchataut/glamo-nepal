import { Response } from "express";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  pagination: PaginationMeta | null;
}

interface ErrorResponse {
  success: false;
  message: string;
  errors: unknown[];
}

export class ApiResponse {
  static success<T>(
    res: Response,
    message: string,
    data: T,
    statusCode = 200,
    pagination: PaginationMeta | null = null
  ): Response<SuccessResponse<T>> {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      pagination,
    });
  }

  static error(
    res: Response,
    message: string,
    statusCode = 500,
    errors: unknown[] = []
  ): Response<ErrorResponse> {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }

  static paginated<T>(
    res: Response,
    message: string,
    data: T[],
    total: number,
    page: number,
    limit: number
  ): Response<SuccessResponse<T[]>> {
    const totalPages = Math.ceil(total / limit);
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  }
}