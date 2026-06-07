import type { Client } from '@libsql/client'
import { AppError, handleDbError, fromSqliteBool, toSqliteBool } from '../../utils/turso-helpers'
import { createAuditLog } from '../../utils/audit'

function formatReview(row: any, profile?: any) {
  return {
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    rating: row.rating,
    title: row.title,
    comment: row.comment,
    isApproved: fromSqliteBool(row.is_approved),
    userName: profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Anonymous' : 'Anonymous',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getProductReviews(
  productId: string,
  page: number,
  limit: number,
  db: Client
) {
  const offset = (page - 1) * limit

  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as count FROM reviews WHERE product_id = ? AND is_approved = 1 AND deleted_at IS NULL`,
    args: [productId],
  })

  const dataResult = await db.execute({
    sql: `SELECT r.*, u.first_name, u.last_name
          FROM reviews r
          LEFT JOIN users u ON u.id = r.user_id
          WHERE r.product_id = ? AND r.is_approved = 1 AND r.deleted_at IS NULL
          ORDER BY r.created_at DESC
          LIMIT ? OFFSET ?`,
    args: [productId, limit, offset],
  })

  const total = Number(countResult.rows[0]?.count ?? 0)
  const reviews = dataResult.rows.map((row: any) => {
    const profile = row.first_name ? { first_name: row.first_name, last_name: row.last_name } : null
    return formatReview(row, profile)
  })

  return { reviews, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function createReview(
  userId: string,
  data: { productId: string; rating: number; title?: string; comment?: string },
  db: Client
) {
  const existingResult = await db.execute({
    sql: `SELECT id FROM reviews WHERE user_id = ? AND product_id = ? AND deleted_at IS NULL`,
    args: [userId, data.productId],
  })

  if (existingResult.rows[0]) {
    throw new AppError('You have already reviewed this product', 409, 'REVIEW_EXISTS')
  }

  const settingsResult = await db.execute({
    sql: `SELECT value FROM site_settings WHERE key = ?`,
    args: ['review_auto_approve'],
  })

  const isApproved = settingsResult.rows[0]?.value === 'true' || settingsResult.rows[0]?.value === '1'

  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  try {
    await db.execute({
      sql: `INSERT INTO reviews (id, user_id, product_id, rating, title, comment, is_approved, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, userId, data.productId, data.rating, data.title ?? null, data.comment ?? null, toSqliteBool(isApproved), now, now],
    })
  } catch (error: any) {
    if (error?.message?.includes('UNIQUE constraint')) {
      throw new AppError('You have already reviewed this product', 409, 'REVIEW_EXISTS')
    }
    handleDbError(error, 'createReview')
  }

  await createAuditLog(db, {
    userId,
    action: 'CREATE',
    entity: 'reviews',
    entityId: id,
  })

  const reviewResult = await db.execute({
    sql: `SELECT r.*, u.first_name, u.last_name FROM reviews r LEFT JOIN users u ON u.id = r.user_id WHERE r.id = ?`,
    args: [id],
  })

  const review = reviewResult.rows[0]
  const profile = review?.first_name ? { first_name: review.first_name, last_name: review.last_name } : null
  return formatReview(review, profile)
}

export async function updateReview(
  userId: string,
  reviewId: string,
  data: { rating?: number; title?: string; comment?: string },
  db: Client
) {
  const existingResult = await db.execute({
    sql: `SELECT * FROM reviews WHERE id = ? AND deleted_at IS NULL`,
    args: [reviewId],
  })

  const existing = existingResult.rows[0]
  if (!existing) {
    throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND')
  }

  if (String(existing.user_id) !== userId) {
    throw new AppError('You can only edit your own reviews', 403, 'FORBIDDEN')
  }

  const updates: string[] = ['updated_at = ?']
  const args: any[] = [new Date().toISOString()]

  if (data.rating !== undefined) { updates.push('rating = ?'); args.push(data.rating) }
  if (data.title !== undefined) { updates.push('title = ?'); args.push(data.title) }
  if (data.comment !== undefined) { updates.push('comment = ?'); args.push(data.comment) }

  args.push(reviewId)

  await db.execute({
    sql: `UPDATE reviews SET ${updates.join(', ')} WHERE id = ?`,
    args,
  })

  await createAuditLog(db, {
    userId,
    action: 'UPDATE',
    entity: 'reviews',
    entityId: reviewId,
    changes: data,
  })

  const reviewResult = await db.execute({
    sql: `SELECT r.*, u.first_name, u.last_name FROM reviews r LEFT JOIN users u ON u.id = r.user_id WHERE r.id = ?`,
    args: [reviewId],
  })

  const review = reviewResult.rows[0]
  const profile = review?.first_name ? { first_name: review.first_name, last_name: review.last_name } : null
  return formatReview(review, profile)
}

export async function deleteReview(
  userId: string,
  reviewId: string,
  db: Client,
  isAdmin: boolean = false
) {
  const existingResult = await db.execute({
    sql: `SELECT * FROM reviews WHERE id = ? AND deleted_at IS NULL`,
    args: [reviewId],
  })

  const existing = existingResult.rows[0]
  if (!existing) {
    throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND')
  }

  if (!isAdmin && String(existing.user_id) !== userId) {
    throw new AppError('You can only delete your own reviews', 403, 'FORBIDDEN')
  }

  await db.execute({
    sql: `UPDATE reviews SET deleted_at = ? WHERE id = ?`,
    args: [new Date().toISOString(), reviewId],
  })

  await createAuditLog(db, {
    userId,
    action: 'SOFT_DELETE',
    entity: 'reviews',
    entityId: reviewId,
  })
}

export async function getAllReviews(
  filters: { productId?: string; isApproved?: boolean; page: number; limit: number },
  db: Client
) {
  const offset = (filters.page - 1) * filters.limit

  const whereClauses: string[] = ['r.deleted_at IS NULL']
  const args: any[] = []

  if (filters.productId) {
    whereClauses.push('r.product_id = ?')
    args.push(filters.productId)
  }
  if (filters.isApproved !== undefined) {
    whereClauses.push('r.is_approved = ?')
    args.push(toSqliteBool(filters.isApproved))
  }

  const whereStr = whereClauses.join(' AND ')

  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as count FROM reviews r WHERE ${whereStr}`,
    args,
  })

  const dataResult = await db.execute({
    sql: `SELECT r.*, u.first_name, u.last_name
          FROM reviews r
          LEFT JOIN users u ON u.id = r.user_id
          WHERE ${whereStr}
          ORDER BY r.created_at DESC
          LIMIT ? OFFSET ?`,
    args: [...args, filters.limit, offset],
  })

  const total = Number(countResult.rows[0]?.count ?? 0)
  const reviews = dataResult.rows.map((row: any) => {
    const profile = row.first_name ? { first_name: row.first_name, last_name: row.last_name } : null
    return formatReview(row, profile)
  })

  return { reviews, total, page: filters.page, limit: filters.limit, totalPages: Math.ceil(total / filters.limit) }
}

export async function approveReview(
  reviewId: string,
  adminUserId: string,
  db: Client
) {
  const existingResult = await db.execute({
    sql: `SELECT * FROM reviews WHERE id = ? AND deleted_at IS NULL`,
    args: [reviewId],
  })

  if (!existingResult.rows[0]) {
    throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND')
  }

  await db.execute({
    sql: `UPDATE reviews SET is_approved = 1, updated_at = ? WHERE id = ?`,
    args: [new Date().toISOString(), reviewId],
  })

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'APPROVE',
    entity: 'reviews',
    entityId: reviewId,
  })

  const reviewResult = await db.execute({
    sql: `SELECT r.*, u.first_name, u.last_name FROM reviews r LEFT JOIN users u ON u.id = r.user_id WHERE r.id = ?`,
    args: [reviewId],
  })

  const review = reviewResult.rows[0]
  const profile = review?.first_name ? { first_name: review.first_name, last_name: review.last_name } : null
  return formatReview(review, profile)
}

export async function rejectReview(
  reviewId: string,
  adminUserId: string,
  db: Client
) {
  const existingResult = await db.execute({
    sql: `SELECT * FROM reviews WHERE id = ? AND deleted_at IS NULL`,
    args: [reviewId],
  })

  if (!existingResult.rows[0]) {
    throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND')
  }

  await db.execute({
    sql: `UPDATE reviews SET is_approved = 0, updated_at = ? WHERE id = ?`,
    args: [new Date().toISOString(), reviewId],
  })

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'REJECT',
    entity: 'reviews',
    entityId: reviewId,
  })

  const reviewResult = await db.execute({
    sql: `SELECT r.*, u.first_name, u.last_name FROM reviews r LEFT JOIN users u ON u.id = r.user_id WHERE r.id = ?`,
    args: [reviewId],
  })

  const review = reviewResult.rows[0]
  const profile = review?.first_name ? { first_name: review.first_name, last_name: review.last_name } : null
  return formatReview(review, profile)
}