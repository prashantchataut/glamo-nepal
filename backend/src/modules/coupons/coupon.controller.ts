import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { AppError } from '../../utils/supabase'
import { ApiResponse } from '../../utils/response'
import * as CouponService from './coupon.service'

export async function createCoupon(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const user = c.get('user')
    const supabase = c.get('supabase')
    const result = await CouponService.createCoupon(data, user.id, supabase)
    return ApiResponse.success(c, 'Coupon created successfully', result, 201)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to create coupon', 500)
  }
}

export async function getCoupons(c: Context<AppEnv>) {
  try {
    const query = c.get('validatedQuery') || c.req.query()
    const supabase = c.get('supabase')
    const filters = {
      isActive: query.isActive,
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
    }
    const result = await CouponService.getAllCoupons(filters, supabase)
    return ApiResponse.paginated(c, 'Coupons fetched successfully', result.coupons, result.total, result.page, result.limit)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch coupons', 500)
  }
}

export async function getCouponById(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const supabase = c.get('supabase')
    const result = await CouponService.getCoupon(id, supabase)
    return ApiResponse.success(c, 'Coupon fetched successfully', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch coupon', 500)
  }
}

export async function updateCoupon(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const data = c.get('validatedBody')
    const user = c.get('user')
    const supabase = c.get('supabase')
    const result = await CouponService.updateCoupon(id, data, user.id, supabase)
    return ApiResponse.success(c, 'Coupon updated successfully', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to update coupon', 500)
  }
}

export async function deleteCoupon(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const user = c.get('user')
    const supabase = c.get('supabase')
    await CouponService.deleteCoupon(id, user.id, supabase)
    return ApiResponse.success(c, 'Coupon deleted successfully', null)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to delete coupon', 500)
  }
}

export async function validateCouponCode(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await CouponService.validateCoupon(data.code, data.cartTotal, supabase)
    return ApiResponse.success(c, 'Coupon is valid', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to validate coupon', 500)
  }
}

export async function applyCoupon(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await CouponService.applyCoupon(user.id, data.code, data.cartTotal, supabase)
    return ApiResponse.success(c, 'Coupon applied successfully', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to apply coupon', 500)
  }
}