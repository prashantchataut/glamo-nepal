import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { AppError } from '../../utils/supabase'
import { ApiResponse } from '../../utils/response'
import * as ReviewService from './review.service'

export async function getProductReviews(c: Context<AppEnv>) {
  try {
    const { productId } = c.req.param()
    const page = Number(c.req.query('page')) || 1
    const limit = Number(c.req.query('limit')) || 20
    const supabase = c.get('supabase')
    const result = await ReviewService.getProductReviews(productId, page, limit, supabase)
    return ApiResponse.paginated(c, 'Reviews fetched successfully', result.reviews, result.total, result.page, result.limit)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch reviews', 500)
  }
}

export async function createReview(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await ReviewService.createReview(user.id, data, supabase)
    return ApiResponse.success(c, 'Review created successfully', result, 201)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to create review', 500)
  }
}

export async function updateReview(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const { id } = c.req.param()
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await ReviewService.updateReview(user.id, id, data, supabase)
    return ApiResponse.success(c, 'Review updated successfully', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to update review', 500)
  }
}

export async function deleteReview(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const { id } = c.req.param()
    const supabase = c.get('supabase')
    await ReviewService.deleteReview(user.id, id, supabase)
    return ApiResponse.success(c, 'Review deleted successfully', null)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to delete review', 500)
  }
}

export async function getAdminReviews(c: Context<AppEnv>) {
  try {
    const query = c.get('validatedQuery') || c.req.query()
    const supabase = c.get('supabase')
    const filters = {
      productId: query.productId,
      isApproved: query.isApproved,
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
    }
    const result = await ReviewService.getAllReviews(filters, supabase)
    return ApiResponse.paginated(c, 'Reviews fetched successfully', result.reviews, result.total, result.page, result.limit)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch reviews', 500)
  }
}

export async function approveReview(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const user = c.get('user')
    const supabase = c.get('supabase')
    const result = await ReviewService.approveReview(id, user.id, supabase)
    return ApiResponse.success(c, 'Review approved successfully', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to approve review', 500)
  }
}

export async function rejectReview(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const user = c.get('user')
    const supabase = c.get('supabase')
    const result = await ReviewService.rejectReview(id, user.id, supabase)
    return ApiResponse.success(c, 'Review rejected successfully', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to reject review', 500)
  }
}