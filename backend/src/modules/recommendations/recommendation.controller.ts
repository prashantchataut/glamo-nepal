import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { AppError } from '../../utils/supabase'
import { ApiResponse } from '../../utils/response'
import * as RecommendationService from './recommendation.service'

export async function getRecommendations(c: Context<AppEnv>) {
  try {
    const query = c.get('validatedQuery')
    const supabase = c.get('supabase')

    const products = await RecommendationService.getRecommendations(
      query.context,
      query.product_id,
      query.session_id,
      query.user_id,
      query.limit,
      supabase
    )

    return ApiResponse.success(c, 'Recommendations fetched', products)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch recommendations', 500)
  }
}

export async function getTrending(c: Context<AppEnv>) {
  try {
    const query = c.get('validatedQuery')
    const supabase = c.get('supabase')

    const products = await RecommendationService.getTrending(
      query.window,
      query.category,
      query.limit,
      supabase
    )

    return ApiResponse.success(c, 'Trending products fetched', products)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch trending products', 500)
  }
}