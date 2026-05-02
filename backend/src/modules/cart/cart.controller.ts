import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { AppError } from '../../utils/supabase'
import { ApiResponse } from '../../utils/response'
import * as CartService from './cart.service'

export async function getCart(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const supabase = c.get('supabase')
    const result = await CartService.getCart(supabase, user.id)
    return ApiResponse.success(c, 'Cart fetched successfully', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch cart', 500)
  }
}

export async function addToCart(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await CartService.addItem(supabase, user.id, data)
    return ApiResponse.success(c, 'Item added to cart', result, result.action === 'created' ? 201 : 200)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to add to cart', 500)
  }
}

export async function updateCartItem(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const { id } = c.req.param()
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await CartService.updateItem(supabase, user.id, id, data.quantity)
    return ApiResponse.success(c, 'Cart item updated', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to update cart item', 500)
  }
}

export async function removeCartItem(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const { id } = c.req.param()
    const supabase = c.get('supabase')
    await CartService.removeItem(supabase, user.id, id)
    return ApiResponse.success(c, 'Cart item removed', null)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to remove cart item', 500)
  }
}

export async function clearCart(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const supabase = c.get('supabase')
    await CartService.clearCart(supabase, user.id)
    return ApiResponse.success(c, 'Cart cleared', null)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to clear cart', 500)
  }
}