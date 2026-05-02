import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { ApiResponse } from '../../utils/response'
import * as ReviewService from './review.service'

export async function getProductReviews(c: Context<AppEnv>) {
  try {
    const { productId } = c.req.param()
    const supabase = c.get('supabase')
    const result = await ReviewService.getProductReviews(productId, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to fetch reviews', 500)
  }
}

export async function createReview(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await ReviewService.createReview(user.id, data, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
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
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to update review', 500)
  }
}

export async function deleteReview(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const { id } = c.req.param()
    const supabase = c.get('supabase')
    await ReviewService.deleteReview(user.id, id, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to delete review', 500)
  }
}

export async function getAdminReviews(c: Context<AppEnv>) {
  try {
    const supabase = c.get('supabase')
    const result = await ReviewService.getAdminReviews(supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to fetch admin reviews', 500)
  }
}

export async function approveReview(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const supabase = c.get('supabase')
    const result = await ReviewService.approveReview(id, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to approve review', 500)
  }
}

export async function rejectReview(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const supabase = c.get('supabase')
    const result = await ReviewService.rejectReview(id, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to reject review', 500)
  }
}