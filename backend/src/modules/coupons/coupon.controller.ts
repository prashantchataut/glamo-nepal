import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { AppError } from '../../utils/turso-helpers'
import { ApiResponse } from '../../utils/response'
import type { ClientInfo } from '../../utils/audit'
import { extractClientInfo as extractClientInfoShared } from '../../utils/client-info'
import * as CouponService from './coupon.service'

/**
 * Extract IP and user-agent from the request so audit logs record WHO acted
 * AND from where. We delegate to the shared `extractClientInfo` helper so
 * coupon audit entries use the SAME IP-resolution logic as the rest of the
 * backend (Cloudflare cf-connecting-ip -> true-client-ip -> x-forwarded-for
 * -> x-real-ip). The previous local copy only checked x-forwarded-for and
 * lost the IP on Cloudflare-fronted requests, which is why coupon audit
 * rows showed ip_address=NULL.
 */
function extractClientInfo(c: Context<AppEnv>): ClientInfo {
  return extractClientInfoShared(c)
}

export async function createCoupon(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const user = c.get('user')
    const db = c.get('db')
    const clientInfo = extractClientInfo(c)
    const result = await CouponService.createCoupon(data, user?.id ?? 'system', db, clientInfo)
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
    const db = c.get('db')
    const filters = {
      isActive: query.isActive,
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
    }
    const result = await CouponService.getAllCoupons(filters, db)
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
    const db = c.get('db')
    const result = await CouponService.getCoupon(id, db)
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
    const db = c.get('db')
    const clientInfo = extractClientInfo(c)
    const result = await CouponService.updateCoupon(id, data, user?.id ?? 'system', db, clientInfo)
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
    const db = c.get('db')
    const clientInfo = extractClientInfo(c)
    await CouponService.deleteCoupon(id, user?.id ?? 'system', db, clientInfo)
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
    const db = c.get('db')
    const result = await CouponService.validateCoupon(data.code, data.cartTotal, db)
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
    const db = c.get('db')
    const result = await CouponService.applyCoupon(user.id, data.code, data.cartTotal, db)
    return ApiResponse.success(c, 'Coupon applied successfully', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to apply coupon', 500)
  }
}