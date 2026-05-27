import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError, handleSupabaseError } from '../../utils/supabase'
import { createAuditLog } from '../../utils/audit'

interface ReviewRow {
  id: string
  user_id: string
  product_id: string
  rating: number
  title: string | null
  comment: string | null
  is_approved: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

interface ProfileRow {
  id: string
  first_name: string | null
  last_name: string | null
}

function formatReview(row: ReviewRow, profile?: ProfileRow | null) {
  return {
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    rating: row.rating,
    title: row.title,
    comment: row.comment,
    isApproved: row.is_approved,
    userName: profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Anonymous' : 'Anonymous',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getProductReviews(
  productId: string,
  page: number,
  limit: number,
  supabase: SupabaseClient
) {
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from('reviews')
    .select('*, profiles!reviews_user_id_fkey(id, first_name, last_name)', { count: 'exact' })
    .eq('product_id', productId)
    .eq('is_approved', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) handleSupabaseError(error, 'getProductReviews')

  const reviews = (data || []).map((row: any) => {
    const profile = row.profiles as ProfileRow | null
    return formatReview(row as ReviewRow, profile)
  })

  return { reviews, total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) }
}

export async function createReview(
  userId: string,
  data: { productId: string; rating: number; title?: string; comment?: string },
  supabase: SupabaseClient
) {
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', data.productId)
    .is('deleted_at', null)
    .maybeSingle()

  if (existing) {
    throw new AppError('You have already reviewed this product', 409, 'REVIEW_EXISTS')
  }

  const { data: settingsRow } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'review_auto_approve')
    .single()

  const isApproved = settingsRow?.value === 'true' || settingsRow?.value === true

  const { data: review, error } = await supabase
    .from('reviews')
    .insert({
      user_id: userId,
      product_id: data.productId,
      rating: data.rating,
      title: data.title ?? null,
      comment: data.comment ?? null,
      is_approved: isApproved,
    })
    .select('*, profiles!reviews_user_id_fkey(id, first_name, last_name)')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new AppError('You have already reviewed this product', 409, 'REVIEW_EXISTS')
    }
    handleSupabaseError(error, 'createReview')
  }

  await createAuditLog(supabase, {
    userId,
    action: 'CREATE',
    entity: 'reviews',
    entityId: review.id,
  })

  const profile = (review as any).profiles as ProfileRow | null
  return formatReview(review as ReviewRow, profile)
}

export async function updateReview(
  userId: string,
  reviewId: string,
  data: { rating?: number; title?: string; comment?: string },
  supabase: SupabaseClient
) {
  const { data: existing, error: fetchError } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', reviewId)
    .is('deleted_at', null)
    .single()

  if (fetchError || !existing) {
    throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND')
  }

  if (existing.user_id !== userId) {
    throw new AppError('You can only edit your own reviews', 403, 'FORBIDDEN')
  }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  if (data.rating !== undefined) updates.rating = data.rating
  if (data.title !== undefined) updates.title = data.title
  if (data.comment !== undefined) updates.comment = data.comment

  const { data: review, error } = await supabase
    .from('reviews')
    .update(updates)
    .eq('id', reviewId)
    .select('*, profiles!reviews_user_id_fkey(id, first_name, last_name)')
    .single()

  if (error) handleSupabaseError(error, 'updateReview')

  await createAuditLog(supabase, {
    userId,
    action: 'UPDATE',
    entity: 'reviews',
    entityId: reviewId,
    changes: data,
  })

  const profile = (review as any).profiles as ProfileRow | null
  return formatReview(review as ReviewRow, profile)
}

export async function deleteReview(
  userId: string,
  reviewId: string,
  supabase: SupabaseClient,
  isAdmin: boolean = false
) {
  const { data: existing, error: fetchError } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', reviewId)
    .is('deleted_at', null)
    .single()

  if (fetchError || !existing) {
    throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND')
  }

  if (!isAdmin && existing.user_id !== userId) {
    throw new AppError('You can only delete your own reviews', 403, 'FORBIDDEN')
  }

  const { error } = await supabase
    .from('reviews')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', reviewId)

  if (error) handleSupabaseError(error, 'deleteReview')

  await createAuditLog(supabase, {
    userId,
    action: 'SOFT_DELETE',
    entity: 'reviews',
    entityId: reviewId,
  })
}

export async function getAllReviews(
  filters: { productId?: string; isApproved?: boolean; page: number; limit: number },
  supabase: SupabaseClient
) {
  const from = (filters.page - 1) * filters.limit
  const to = from + filters.limit - 1

  let query = supabase
    .from('reviews')
    .select('*, profiles!reviews_user_id_fkey(id, first_name, last_name)', { count: 'exact' })
    .is('deleted_at', null)

  if (filters.productId) {
    query = query.eq('product_id', filters.productId)
  }
  if (filters.isApproved !== undefined) {
    query = query.eq('is_approved', filters.isApproved)
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) handleSupabaseError(error, 'getAllReviews')

  const reviews = (data || []).map((row: any) => {
    const profile = row.profiles as ProfileRow | null
    return formatReview(row as ReviewRow, profile)
  })

  return { reviews, total: count || 0, page: filters.page, limit: filters.limit, totalPages: Math.ceil((count || 0) / filters.limit) }
}

export async function approveReview(
  reviewId: string,
  adminUserId: string,
  supabase: SupabaseClient
) {
  const { data: existing, error: fetchError } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', reviewId)
    .is('deleted_at', null)
    .single()

  if (fetchError || !existing) {
    throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND')
  }

  const { data: review, error } = await supabase
    .from('reviews')
    .update({ is_approved: true, updated_at: new Date().toISOString() })
    .eq('id', reviewId)
    .select('*, profiles!reviews_user_id_fkey(id, first_name, last_name)')
    .single()

  if (error) handleSupabaseError(error, 'approveReview')

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'APPROVE',
    entity: 'reviews',
    entityId: reviewId,
  })

  const profile = (review as any).profiles as ProfileRow | null
  return formatReview(review as ReviewRow, profile)
}

export async function rejectReview(
  reviewId: string,
  adminUserId: string,
  supabase: SupabaseClient
) {
  const { data: existing, error: fetchError } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', reviewId)
    .is('deleted_at', null)
    .single()

  if (fetchError || !existing) {
    throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND')
  }

  const { data: review, error } = await supabase
    .from('reviews')
    .update({ is_approved: false, updated_at: new Date().toISOString() })
    .eq('id', reviewId)
    .select('*, profiles!reviews_user_id_fkey(id, first_name, last_name)')
    .single()

  if (error) handleSupabaseError(error, 'rejectReview')

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'REJECT',
    entity: 'reviews',
    entityId: reviewId,
  })

  const profile = (review as any).profiles as ProfileRow | null
  return formatReview(review as ReviewRow, profile)
}