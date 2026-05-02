import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError, handleSupabaseError } from '../../utils/supabase'
import { createAuditLog } from '../../utils/audit'

interface CouponRow {
  id: string
  code: string
  description: string | null
  type: 'PERCENTAGE' | 'FIXED'
  value: number
  min_order_amount: number | null
  max_discount: number | null
  usage_limit: number | null
  usage_count: number
  per_user_limit: number | null
  starts_at: string
  expires_at: string
  is_active: boolean
  created_at: string
  updated_at: string
}

function formatCoupon(row: CouponRow) {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    type: row.type,
    value: row.value,
    minOrderAmount: row.min_order_amount,
    maxDiscount: row.max_discount,
    usageLimit: row.usage_limit,
    usageCount: row.usage_count,
    perUserLimit: row.per_user_limit,
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function calculateDiscount(coupon: CouponRow, cartTotal: number): number {
  let discount = 0
  if (coupon.type === 'PERCENTAGE') {
    discount = cartTotal * (coupon.value / 100)
    if (coupon.max_discount !== null && coupon.max_discount > 0) {
      discount = Math.min(discount, coupon.max_discount)
    }
  } else {
    discount = coupon.value
  }
  return Math.min(discount, cartTotal)
}

export async function createCoupon(
  data: {
    code: string
    description?: string
    type: 'PERCENTAGE' | 'FIXED'
    value: number
    minOrderAmount?: number
    maxDiscount?: number
    usageLimit?: number
    perUserLimit?: number
    startsAt: string
    expiresAt: string
  },
  adminUserId: string,
  supabase: SupabaseClient
) {
  const { data: coupon, error } = await supabase
    .from('coupons')
    .insert({
      code: data.code.toUpperCase(),
      description: data.description ?? null,
      type: data.type,
      value: data.value,
      min_order_amount: data.minOrderAmount ?? null,
      max_discount: data.maxDiscount ?? null,
      usage_limit: data.usageLimit ?? null,
      per_user_limit: data.perUserLimit ?? null,
      starts_at: data.startsAt,
      expires_at: data.expiresAt,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new AppError('Coupon code already exists', 409, 'COUPON_EXISTS')
    }
    handleSupabaseError(error, 'createCoupon')
  }

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'CREATE',
    entity: 'coupons',
    entityId: coupon.id,
    changes: data,
  })

  return formatCoupon(coupon as CouponRow)
}

export async function getAllCoupons(
  filters: { isActive?: boolean; page: number; limit: number },
  supabase: SupabaseClient
) {
  const from = (filters.page - 1) * filters.limit
  const to = from + filters.limit - 1

  let query = supabase
    .from('coupons')
    .select('*', { count: 'exact' })

  if (filters.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive)
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) handleSupabaseError(error, 'getAllCoupons')

  const coupons = (data || []).map((row: CouponRow) => formatCoupon(row))

  return {
    coupons,
    total: count || 0,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil((count || 0) / filters.limit),
  }
}

export async function getCoupon(
  id: string,
  supabase: SupabaseClient
) {
  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !coupon) {
    throw new AppError('Coupon not found', 404, 'COUPON_NOT_FOUND')
  }

  return formatCoupon(coupon as CouponRow)
}

export async function updateCoupon(
  id: string,
  data: Record<string, any>,
  adminUserId: string,
  supabase: SupabaseClient
) {
  const { data: existing, error: fetchError } = await supabase
    .from('coupons')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    throw new AppError('Coupon not found', 404, 'COUPON_NOT_FOUND')
  }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  if (data.code !== undefined) updates.code = data.code.toUpperCase()
  if (data.description !== undefined) updates.description = data.description
  if (data.type !== undefined) updates.type = data.type
  if (data.value !== undefined) updates.value = data.value
  if (data.minOrderAmount !== undefined) updates.min_order_amount = data.minOrderAmount
  if (data.maxDiscount !== undefined) updates.max_discount = data.maxDiscount
  if (data.usageLimit !== undefined) updates.usage_limit = data.usageLimit
  if (data.perUserLimit !== undefined) updates.per_user_limit = data.perUserLimit
  if (data.startsAt !== undefined) updates.starts_at = data.startsAt
  if (data.expiresAt !== undefined) updates.expires_at = data.expiresAt
  if (data.isActive !== undefined) updates.is_active = data.isActive

  const { data: coupon, error } = await supabase
    .from('coupons')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) handleSupabaseError(error, 'updateCoupon')

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'UPDATE',
    entity: 'coupons',
    entityId: id,
    changes: data,
  })

  return formatCoupon(coupon as CouponRow)
}

export async function deleteCoupon(
  id: string,
  adminUserId: string,
  supabase: SupabaseClient
) {
  const { data: existing, error: fetchError } = await supabase
    .from('coupons')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    throw new AppError('Coupon not found', 404, 'COUPON_NOT_FOUND')
  }

  const { error } = await supabase
    .from('coupons')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) handleSupabaseError(error, 'deleteCoupon')

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'SOFT_DELETE',
    entity: 'coupons',
    entityId: id,
  })
}

export async function validateCoupon(
  code: string,
  cartTotal: number,
  supabase: SupabaseClient
) {
  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single()

  if (error || !coupon) {
    throw new AppError('Invalid coupon code', 404, 'COUPON_NOT_FOUND')
  }

  const now = new Date().toISOString()
  if (coupon.starts_at && coupon.starts_at > now) {
    throw new AppError('Coupon is not yet active', 400, 'COUPON_NOT_ACTIVE')
  }
  if (coupon.expires_at && coupon.expires_at < now) {
    throw new AppError('Coupon has expired', 400, 'COUPON_EXPIRED')
  }
  if (coupon.min_order_amount !== null && cartTotal < coupon.min_order_amount) {
    throw new AppError(`Minimum order amount of ${coupon.min_order_amount} required`, 400, 'COUPON_MIN_ORDER_NOT_MET')
  }
  if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
    throw new AppError('Coupon usage limit has been reached', 400, 'COUPON_USAGE_LIMIT_REACHED')
  }

  const discount = calculateDiscount(coupon as CouponRow, cartTotal)

  return {
    ...formatCoupon(coupon as CouponRow),
    discountAmount: discount,
    cartTotal,
  }
}

export async function applyCoupon(
  userId: string,
  code: string,
  cartTotal: number,
  supabase: SupabaseClient
) {
  const result = await validateCoupon(code, cartTotal, supabase)

  const { data: coupon } = await supabase
    .from('coupons')
    .select('id, per_user_limit')
    .eq('code', code.toUpperCase())
    .single()

  if (coupon?.per_user_limit !== null && coupon?.per_user_limit !== undefined) {
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('coupon_id', coupon.id)

    if (count !== null && count >= coupon.per_user_limit) {
      throw new AppError('You have reached the usage limit for this coupon', 400, 'COUPON_USER_LIMIT_REACHED')
    }
  }

  return {
    ...result,
    discountAmount: result.discountAmount,
  }
}