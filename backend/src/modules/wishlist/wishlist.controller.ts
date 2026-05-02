import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { ApiResponse } from '../../utils/response'
import * as WishlistService from './wishlist.service'

export async function getWishlist(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const supabase = c.get('supabase')
    const result = await WishlistService.getWishlist(user.id, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to fetch wishlist', 500)
  }
}

export async function addToWishlist(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await WishlistService.addToWishlist(user.id, data.productId, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to add to wishlist', 500)
  }
}

export async function removeFromWishlist(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const { productId } = c.req.param()
    const supabase = c.get('supabase')
    await WishlistService.removeFromWishlist(user.id, productId, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to remove from wishlist', 500)
  }
}

export async function checkWishlistItem(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const { productId } = c.req.param()
    const supabase = c.get('supabase')
    const result = await WishlistService.checkWishlistItem(user.id, productId, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to check wishlist', 500)
  }
}