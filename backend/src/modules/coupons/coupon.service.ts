import type { Client, InValue } from '@libsql/client'
import { AppError, handleDbError, fromSqliteBool, toSqliteBool } from '../../utils/turso-helpers'
import { createAuditLog, type ClientInfo } from '../../utils/audit'

interface CouponRow {
  id: string
  code: string
  description: string | null
  type: string
  value: number
  min_order_amount: number | null
  max_discount: number | null
  usage_limit: number | null
  usage_count: number
  per_user_limit: number | null
  starts_at: string
  expires_at: string
  is_active: number
  created_at: string
  updated_at: string
}

function formatCoupon(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    code: row.code as string,
    description: row.description as string | null,
    type: row.type as string,
    value: row.value as number,
    minOrderAmount: row.min_order_amount as number | null,
    maxDiscount: row.max_discount as number | null,
    usageLimit: row.usage_limit as number | null,
    usageCount: row.usage_count as number,
    perUserLimit: row.per_user_limit as number | null,
    startsAt: row.starts_at as string,
    expiresAt: row.expires_at as string,
    isActive: fromSqliteBool(row.is_active as number),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
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
  db: Client,
  clientInfo?: ClientInfo,
) {
  const id = crypto.randomUUID()
  try {
    await db.execute({
      sql: `INSERT INTO coupons (id, code, description, type, value, min_order_amount, max_discount, usage_limit, per_user_limit, starts_at, expires_at, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
      args: [
        id,
        data.code.toUpperCase(),
        data.description ?? null,
        data.type,
        data.value,
        data.minOrderAmount ?? null,
        data.maxDiscount ?? null,
        data.usageLimit ?? null,
        data.perUserLimit ?? null,
        data.startsAt,
        data.expiresAt,
      ],
    })
  } catch (error: any) {
    if (error?.message?.includes('UNIQUE constraint')) {
      throw new AppError('Coupon code already exists', 409, 'COUPON_EXISTS')
    }
    handleDbError(error, 'createCoupon')
  }

  const result = await db.execute({
    sql: 'SELECT * FROM coupons WHERE id = ?',
    args: [id],
  })

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'CREATE',
    entity: 'coupons',
    entityId: id,
    changes: data,
  }, clientInfo)

  return formatCoupon(result.rows[0])
}

export async function getAllCoupons(
  filters: { isActive?: boolean; page: number; limit: number },
  db: Client
) {
  const offset = (filters.page - 1) * filters.limit

  let countSql = 'SELECT COUNT(*) as count FROM coupons'
  let sql = 'SELECT * FROM coupons'
  const countArgs: InValue[] = []
  const args: InValue[] = []

  if (filters.isActive !== undefined) {
    const activeValue = toSqliteBool(filters.isActive)
    countSql += ' WHERE is_active = ?'
    sql += ' WHERE is_active = ?'
    countArgs.push(activeValue)
    args.push(activeValue)
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  args.push(filters.limit, offset)

  const countResult = await db.execute({ sql: countSql, args: countArgs })
  const total = countResult.rows[0].count as number

  const result = await db.execute({ sql, args })
  const coupons = result.rows.map((row) => formatCoupon(row))

  return {
    coupons,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  }
}

export async function getCoupon(
  id: string,
  db: Client
) {
  const result = await db.execute({
    sql: 'SELECT * FROM coupons WHERE id = ?',
    args: [id],
  })

  if (result.rows.length === 0) {
    throw new AppError('Coupon not found', 404, 'COUPON_NOT_FOUND')
  }

  return formatCoupon(result.rows[0])
}

export async function updateCoupon(
  id: string,
  data: Record<string, any>,
  adminUserId: string,
  db: Client,
  clientInfo?: ClientInfo,
) {
  const existingResult = await db.execute({
    sql: 'SELECT * FROM coupons WHERE id = ?',
    args: [id],
  })

  if (existingResult.rows.length === 0) {
    throw new AppError('Coupon not found', 404, 'COUPON_NOT_FOUND')
  }

  const setClauses: string[] = ['updated_at = datetime(\'now\')']
  const args: InValue[] = []

  if (data.code !== undefined) { setClauses.push('code = ?'); args.push(data.code.toUpperCase()) }
  if (data.description !== undefined) { setClauses.push('description = ?'); args.push(data.description) }
  if (data.type !== undefined) { setClauses.push('type = ?'); args.push(data.type) }
  if (data.value !== undefined) { setClauses.push('value = ?'); args.push(data.value) }
  if (data.minOrderAmount !== undefined) { setClauses.push('min_order_amount = ?'); args.push(data.minOrderAmount) }
  if (data.maxDiscount !== undefined) { setClauses.push('max_discount = ?'); args.push(data.maxDiscount) }
  if (data.usageLimit !== undefined) { setClauses.push('usage_limit = ?'); args.push(data.usageLimit) }
  if (data.perUserLimit !== undefined) { setClauses.push('per_user_limit = ?'); args.push(data.perUserLimit) }
  if (data.startsAt !== undefined) { setClauses.push('starts_at = ?'); args.push(data.startsAt) }
  if (data.expiresAt !== undefined) { setClauses.push('expires_at = ?'); args.push(data.expiresAt) }
  if (data.isActive !== undefined) { setClauses.push('is_active = ?'); args.push(toSqliteBool(data.isActive)) }

  args.push(id)

  await db.execute({
    sql: `UPDATE coupons SET ${setClauses.join(', ')} WHERE id = ?`,
    args,
  })

  const result = await db.execute({
    sql: 'SELECT * FROM coupons WHERE id = ?',
    args: [id],
  })

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'UPDATE',
    entity: 'coupons',
    entityId: id,
    changes: data,
  }, clientInfo)

  return formatCoupon(result.rows[0])
}

export async function deleteCoupon(
  id: string,
  adminUserId: string,
  db: Client,
  clientInfo?: ClientInfo,
) {
  const existingResult = await db.execute({
    sql: 'SELECT * FROM coupons WHERE id = ?',
    args: [id],
  })

  if (existingResult.rows.length === 0) {
    throw new AppError('Coupon not found', 404, 'COUPON_NOT_FOUND')
  }

  await db.execute({
    sql: "UPDATE coupons SET is_active = 0, updated_at = datetime('now') WHERE id = ?",
    args: [id],
  })

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'SOFT_DELETE',
    entity: 'coupons',
    entityId: id,
  }, clientInfo)
}

export async function validateCoupon(
  code: string,
  cartTotal: number,
  db: Client
) {
  const result = await db.execute({
    sql: 'SELECT * FROM coupons WHERE code = ? AND is_active = 1',
    args: [code.toUpperCase()],
  })

  if (result.rows.length === 0) {
    throw new AppError('Invalid coupon code', 404, 'COUPON_NOT_FOUND')
  }

  const coupon = result.rows[0]
  const now = new Date().toISOString()
  if (coupon.starts_at && (coupon.starts_at as string) > now) {
    throw new AppError('Coupon is not yet active', 400, 'COUPON_NOT_ACTIVE')
  }
  if (coupon.expires_at && (coupon.expires_at as string) < now) {
    throw new AppError('Coupon has expired', 400, 'COUPON_EXPIRED')
  }
  if (coupon.min_order_amount !== null && (coupon.min_order_amount as number) > 0 && cartTotal < (coupon.min_order_amount as number) / 100) {
    throw new AppError(`Minimum order amount of NPR ${(coupon.min_order_amount as number) / 100} required`, 400, 'COUPON_MIN_ORDER_NOT_MET')
  }
  if (coupon.usage_limit !== null && (coupon.usage_count as number) >= (coupon.usage_limit as number)) {
    throw new AppError('Coupon usage limit has been reached', 400, 'COUPON_USAGE_LIMIT_REACHED')
  }

  const discount = calculateDiscount(coupon as unknown as CouponRow, cartTotal)

  return {
    ...formatCoupon(coupon),
    discountAmount: discount,
    cartTotal,
  }
}

export async function applyCoupon(
  userId: string,
  code: string,
  cartTotal: number,
  db: Client
) {
  const result = await validateCoupon(code, cartTotal, db)

  const couponResult = await db.execute({
    sql: 'SELECT id, per_user_limit FROM coupons WHERE code = ?',
    args: [code.toUpperCase()],
  })

  if (couponResult.rows.length > 0) {
    const coupon = couponResult.rows[0]
    const perUserLimit = coupon.per_user_limit as number | null

    if (perUserLimit !== null) {
      const orderCountResult = await db.execute({
        sql: 'SELECT COUNT(*) as count FROM orders WHERE user_id = ? AND coupon_id = ?',
        args: [userId, coupon.id],
      })

      const orderCount = orderCountResult.rows[0].count as number
      if (orderCount >= perUserLimit) {
        throw new AppError('You have reached the usage limit for this coupon', 400, 'COUPON_USER_LIMIT_REACHED')
      }
    }
  }

  return {
    ...result,
    discountAmount: result.discountAmount,
  }
}