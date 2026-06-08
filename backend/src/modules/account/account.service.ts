import type { Client } from '@libsql/client'
import { AppError, handleDbError, fromSqliteBool, toSqliteBool } from '../../utils/turso-helpers'
import { createAuditLog } from '../../utils/audit'
import { uploadImageToCloudinary, deleteFromCloudinary } from '../../utils/upload'
import type { NetlifyBindings } from '../../types/bindings'

function formatProfile(profile: any, counts: { orderCount: number; wishlistCount: number; addressCount: number }) {
  return {
    id: profile.id,
    email: profile.email,
    phone: profile.phone,
    firstName: profile.first_name,
    lastName: profile.last_name,
    avatarUrl: profile.avatar_url,
    role: profile.role,
    isActive: fromSqliteBool(profile.is_active),
    orderCount: counts.orderCount,
    wishlistCount: counts.wishlistCount,
    addressCount: counts.addressCount,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  }
}

function formatAddress(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    label: row.label,
    fullName: row.full_name,
    phone: row.phone,
    address1: row.address_1,
    addressLine1: row.address_1,
    address2: row.address_2,
    addressLine2: row.address_2,
    city: row.city,
    district: row.district,
    province: row.province,
    ward: row.ward || '',
    postalCode: row.postal_code,
    country: row.country,
    landmark: row.landmark || '',
    isDefault: fromSqliteBool(row.is_default),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getProfile(db: Client, userId: string) {
  const result = await db.execute({
    sql: `SELECT * FROM users WHERE id = ? AND deleted_at IS NULL`,
    args: [userId],
  })

  const profile = result.rows[0]
  if (!profile) throw new AppError('Profile not found', 404, 'PROFILE_NOT_FOUND')

  const [orderResult, wishlistResult, addressResult] = await Promise.all([
    db.execute({ sql: `SELECT COUNT(*) as count FROM orders WHERE user_id = ?`, args: [userId] }),
    db.execute({ sql: `SELECT COUNT(*) as count FROM wishlist_items WHERE user_id = ?`, args: [userId] }),
    db.execute({ sql: `SELECT COUNT(*) as count FROM user_addresses WHERE user_id = ?`, args: [userId] }),
  ])

  return formatProfile(profile, {
    orderCount: Number(orderResult.rows[0]?.count ?? 0),
    wishlistCount: Number(wishlistResult.rows[0]?.count ?? 0),
    addressCount: Number(addressResult.rows[0]?.count ?? 0),
  })
}

export async function updateProfile(db: Client, userId: string, data: { firstName?: string; lastName?: string; phone?: string }, auditUserId: string) {
  const existingResult = await db.execute({
    sql: `SELECT * FROM users WHERE id = ? AND deleted_at IS NULL`,
    args: [userId],
  })

  const profile = existingResult.rows[0]
  if (!profile) throw new AppError('Profile not found', 404, 'PROFILE_NOT_FOUND')

  if (data.phone !== undefined && data.phone !== profile.phone) {
    const phoneResult = await db.execute({
      sql: `SELECT id FROM users WHERE phone = ? AND id != ? LIMIT 1`,
      args: [data.phone, userId],
    })

    if (phoneResult.rows[0]) {
      throw new AppError('Phone number already in use', 409, 'PHONE_EXISTS')
    }
  }

  const updates: string[] = []
  const args: any[] = []

  if (data.firstName !== undefined) { updates.push('first_name = ?'); args.push(data.firstName) }
  if (data.lastName !== undefined) { updates.push('last_name = ?'); args.push(data.lastName) }
  if (data.phone !== undefined) { updates.push('phone = ?'); args.push(data.phone || null) }

  if (updates.length === 0) {
    return formatProfile(profile, { orderCount: 0, wishlistCount: 0, addressCount: 0 })
  }

  updates.push("updated_at = datetime('now')")
  args.push(userId)

  await db.execute({
    sql: `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    args,
  })

  const updateData: Record<string, unknown> = {}
  if (data.firstName !== undefined) updateData.first_name = data.firstName
  if (data.lastName !== undefined) updateData.last_name = data.lastName
  if (data.phone !== undefined) updateData.phone = data.phone

  await createAuditLog(db, {
    userId: auditUserId,
    action: 'UPDATE',
    entity: 'users',
    entityId: userId,
    changes: updateData,
  })

  const updatedResult = await db.execute({
    sql: `SELECT * FROM users WHERE id = ?`,
    args: [userId],
  })

  return formatProfile(updatedResult.rows[0], { orderCount: 0, wishlistCount: 0, addressCount: 0 })
}

export async function uploadAvatar(db: Client, userId: string, file: File, env: NetlifyBindings) {
  const result = await db.execute({
    sql: `SELECT id, avatar_url FROM users WHERE id = ?`,
    args: [userId],
  })

  const profile = result.rows[0]
  if (!profile) throw new AppError('Profile not found', 404, 'PROFILE_NOT_FOUND')

  if (profile.avatar_url) {
    const publicIdMatch = String(profile.avatar_url).match(/upload\/v\d+\/(.+)/)
    if (publicIdMatch) {
      try {
        await deleteFromCloudinary(publicIdMatch[1], env)
      } catch {}
    }
  }

  const uploadResult = await uploadImageToCloudinary(file, `avatars/${userId}`, env)

  await db.execute({
    sql: `UPDATE users SET avatar_url = ? WHERE id = ?`,
    args: [uploadResult.url, userId],
  })

  return { url: uploadResult.url }
}

export async function getAddresses(db: Client, userId: string) {
  const result = await db.execute({
    sql: `SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at ASC`,
    args: [userId],
  })

  return result.rows.map(formatAddress)
}

export async function createAddress(db: Client, userId: string, data: {
  label?: string
  fullName: string
  phone: string
  address1?: string
  addressLine1?: string
  address2?: string
  addressLine2?: string
  ward?: string
  city: string
  district?: string
  province?: string
  postalCode?: string
  country?: string
  landmark?: string
}) {
  const normalizedAddress1 = data.address1 || data.addressLine1 || ''
  const normalizedAddress2 = data.address2 || data.addressLine2 || null

  if (!normalizedAddress1) {
    throw new AppError('Address line is required', 400, 'ADDRESS_REQUIRED')
  }

  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as count FROM user_addresses WHERE user_id = ?`,
    args: [userId],
  })

  const count = Number(countResult.rows[0]?.count ?? 0)
  if (count >= 5) {
    throw new AppError('Maximum 5 addresses allowed', 400, 'MAX_ADDRESSES')
  }

  const isFirst = count === 0
  const id = crypto.randomUUID()

  await db.execute({
    sql: `INSERT INTO user_addresses (id, user_id, label, full_name, phone, address_1, address_2, city, district, province, postal_code, country, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    args: [
      id, userId, data.label || null, data.fullName, data.phone,
      normalizedAddress1, normalizedAddress2, data.city,
      data.district || null, data.province || null, data.postalCode || null,
      data.country || 'Nepal', isFirst ? 1 : 0,
    ],
  })

  const addressResult = await db.execute({
    sql: `SELECT * FROM user_addresses WHERE id = ?`,
    args: [id],
  })

  return formatAddress(addressResult.rows[0])
}

export async function updateAddress(db: Client, userId: string, addressId: string, data: {
  label?: string
  fullName?: string
  phone?: string
  address1?: string
  addressLine1?: string
  address2?: string
  addressLine2?: string
  ward?: string
  city?: string
  district?: string
  province?: string
  postalCode?: string
  country?: string
  landmark?: string
}) {
  const existingResult = await db.execute({
    sql: `SELECT * FROM user_addresses WHERE id = ? AND user_id = ?`,
    args: [addressId, userId],
  })

  const existing = existingResult.rows[0]
  if (!existing) throw new AppError('Address not found', 404, 'ADDRESS_NOT_FOUND')

  const updates: string[] = []
  const args: any[] = []

  if (data.label !== undefined) { updates.push('label = ?'); args.push(data.label || null) }
  if (data.fullName !== undefined) { updates.push('full_name = ?'); args.push(data.fullName) }
  if (data.phone !== undefined) { updates.push('phone = ?'); args.push(data.phone) }
  const normalizedAddress1 = data.address1 || data.addressLine1
  if (normalizedAddress1 !== undefined) { updates.push('address_1 = ?'); args.push(normalizedAddress1) }
  const normalizedAddress2 = data.address2 || data.addressLine2
  if (normalizedAddress2 !== undefined) { updates.push('address_2 = ?'); args.push(normalizedAddress2 || null) }
  if (data.city !== undefined) { updates.push('city = ?'); args.push(data.city) }
  if (data.district !== undefined) { updates.push('district = ?'); args.push(data.district || null) }
  if (data.province !== undefined) { updates.push('province = ?'); args.push(data.province || null) }
  if (data.postalCode !== undefined) { updates.push('postal_code = ?'); args.push(data.postalCode || null) }
  if (data.country !== undefined) { updates.push('country = ?'); args.push(data.country) }

  if (updates.length === 0) {
    return formatAddress(existing)
  }

  updates.push('updated_at = datetime(\'now\')')
  args.push(addressId)

  await db.execute({
    sql: `UPDATE user_addresses SET ${updates.join(', ')} WHERE id = ?`,
    args,
  })

  const updatedResult = await db.execute({
    sql: `SELECT * FROM user_addresses WHERE id = ?`,
    args: [addressId],
  })

  return formatAddress(updatedResult.rows[0])
}

export async function deleteAddress(db: Client, userId: string, addressId: string) {
  const existingResult = await db.execute({
    sql: `SELECT * FROM user_addresses WHERE id = ? AND user_id = ?`,
    args: [addressId, userId],
  })

  const existing = existingResult.rows[0]
  if (!existing) throw new AppError('Address not found', 404, 'ADDRESS_NOT_FOUND')

  const wasDefault = fromSqliteBool(existing.is_default as number)

  await db.execute({
    sql: `DELETE FROM user_addresses WHERE id = ?`,
    args: [addressId],
  })

  if (wasDefault) {
    const nextResult = await db.execute({
      sql: `SELECT id FROM user_addresses WHERE user_id = ? ORDER BY created_at ASC LIMIT 1`,
      args: [userId],
    })

    if (nextResult.rows[0]) {
      await db.execute({
        sql: `UPDATE user_addresses SET is_default = 1 WHERE id = ?`,
        args: [nextResult.rows[0].id],
      })
    }
  }

  return { deleted: true }
}

export async function setDefaultAddress(db: Client, userId: string, addressId: string) {
  const existingResult = await db.execute({
    sql: `SELECT * FROM user_addresses WHERE id = ? AND user_id = ?`,
    args: [addressId, userId],
  })

  const existing = existingResult.rows[0]
  if (!existing) throw new AppError('Address not found', 404, 'ADDRESS_NOT_FOUND')

  await db.execute({
    sql: `UPDATE user_addresses SET is_default = 0 WHERE user_id = ?`,
    args: [userId],
  })

  await db.execute({
    sql: `UPDATE user_addresses SET is_default = 1 WHERE id = ?`,
    args: [addressId],
  })

  const updatedResult = await db.execute({
    sql: `SELECT * FROM user_addresses WHERE id = ?`,
    args: [addressId],
  })

  return formatAddress(updatedResult.rows[0])
}