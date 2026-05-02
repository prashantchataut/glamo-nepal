import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { ApiResponse } from '../../utils/response'
import * as WishlistService from './wishlist.service'

export async function getWishlist(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const supabase = c.get('supabase')
    const result = await WishlistService.getWishlist(supabase, user.id)
    return ApiResponse.success(c, 'Wishlist fetched successfully', result)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to fetch wishlist', 500)
  }
}

export async function addToWishlist(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await WishlistService.addItem(supabase, user.id, data.productId)
    return ApiResponse.success(c, 'Item added to wishlist', result, result.action === 'created' ? 201 : 200)
  } catch (error: any) {
    if (error.message === 'PRODUCT_NOT_FOUND') {
      return ApiResponse.error(c, 'Product not found', 404)
    }
    return ApiResponse.error(c, error.message || 'Failed to add to wishlist', 500)
  }
}

export async function removeFromWishlist(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const { productId } = c.req.param()
    const supabase = c.get('supabase')
    await WishlistService.removeItem(supabase, user.id, productId)
    return ApiResponse.success(c, 'Item removed from wishlist', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to remove from wishlist', 500)
  }
}

export async function checkWishlistItem(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const { productId } = c.req.param()
    const supabase = c.get('supabase')
    const result = await WishlistService.checkItem(supabase, user.id, productId)
    return ApiResponse.success(c, 'Wishlist check completed', result)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to check wishlist', 500)
  }
}