import type { Client } from '@libsql/client'
import { AppError, handleDbError, fromSqliteBool, safeJsonParse } from '../../utils/turso-helpers'
import { getFromCache, setCache } from '../../utils/cache'
import { createAuditLog } from '../../utils/audit'

export async function getDashboardStats(db: Client) {
  const cacheKey = 'admin:dashboard'
  const cached = await getFromCache<any>(cacheKey)
  if (cached) return cached

  const today = new Date().toISOString().split('T')[0]
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [
    todayOrders,
    monthOrders,
    allTimeOrderStats,
    orderStatusBreakdown,
    revenueLast30,
    customerCount,
    activeProductCount,
    lowStockProducts,
    outOfStockProducts,
    recentOrders,
    recentUsers,
    topProducts,
  ] = await Promise.all([
    db.execute({ sql: `SELECT total_amount, payment_status FROM orders WHERE created_at >= ?`, args: [today] }),
    db.execute({ sql: `SELECT total_amount, payment_status FROM orders WHERE created_at >= ?`, args: [monthStart] }),
    db.execute({ sql: `SELECT COUNT(*) as count, COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN total_amount ELSE 0 END), 0) as total_revenue FROM orders`, args: [] }),
    db.execute({ sql: `SELECT status, COUNT(*) as count FROM orders GROUP BY status`, args: [] }),
    db.execute({ sql: `SELECT DATE(created_at) as date, total_amount, payment_status FROM orders WHERE created_at >= ? AND payment_status = 'PAID'`, args: [thirtyDaysAgo] }),
    db.execute({ sql: `SELECT COUNT(*) as count FROM users WHERE role = 'CUSTOMER' AND is_active = 1`, args: [] }),
    db.execute({ sql: `SELECT COUNT(*) as count FROM products WHERE is_active = 1 AND deleted_at IS NULL`, args: [] }),
    db.execute({ sql: `SELECT id, name, sku, stock_quantity, low_stock_threshold FROM products WHERE is_active = 1 AND deleted_at IS NULL AND stock_quantity <= 5 AND stock_quantity > 0`, args: [] }),
    db.execute({ sql: `SELECT id, name, sku, stock_quantity FROM products WHERE is_active = 1 AND deleted_at IS NULL AND stock_quantity = 0`, args: [] }),
    db.execute({ sql: `SELECT id, order_number, total_amount, status, created_at, user_id FROM orders ORDER BY created_at DESC LIMIT 10`, args: [] }),
    db.execute({ sql: `SELECT id, first_name, last_name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5`, args: [] }),
    db.execute({ sql: `SELECT product_id, product_name, SUM(quantity) as total_sold FROM order_items GROUP BY product_id ORDER BY total_sold DESC LIMIT 10`, args: [] }),
  ])

  const todayRevenue = todayOrders.rows
    .filter((o: any) => o.payment_status === 'PAID')
    .reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0)

  const monthRevenue = monthOrders.rows
    .filter((o: any) => o.payment_status === 'PAID')
    .reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0)

  const allTimeOrdersCount = Number(allTimeOrderStats.rows[0]?.count ?? 0)
  const allTimeRevenue = Number(allTimeOrderStats.rows[0]?.total_revenue ?? 0)

  const statusCounts: Record<string, number> = {}
  for (const row of orderStatusBreakdown.rows) {
    statusCounts[String(row.status)] = Number(row.count)
  }

  const revenueByDay: Record<string, { revenue: number; orders: number }> = {}
  for (const row of revenueLast30.rows) {
    const date = String(row.date)
    if (date) {
      if (!revenueByDay[date]) revenueByDay[date] = { revenue: 0, orders: 0 }
      revenueByDay[date].revenue += Number(row.total_amount) || 0
      revenueByDay[date].orders += 1
    }
  }

  const userIds = [...new Set(recentOrders.rows.map((o: any) => String(o.user_id)))]
  const userMap: Record<string, string> = {}
  if (userIds.length > 0) {
    const userPlaceholders = userIds.map(() => '?').join(',')
    const usersResult = await db.execute({
      sql: `SELECT id, first_name, last_name FROM users WHERE id IN (${userPlaceholders})`,
      args: userIds,
    })
    for (const u of usersResult.rows) {
      userMap[String(u.id)] = [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Unknown'
    }
  }
  const recentOrdersWithUser = recentOrders.rows.map((order: any) => ({
    ...order,
    customerName: userMap[String(order.user_id)] || 'Unknown',
  }))

  const topProductsList = topProducts.rows.map((row: any) => ({
    id: row.product_id,
    name: row.product_name,
    totalSold: Number(row.total_sold),
  }))

  const categoryProductResult = await db.execute({
    sql: `SELECT p.id, p.category_id, c.name as category_name
          FROM order_items oi
          JOIN products p ON p.id = oi.product_id
          LEFT JOIN categories c ON c.id = p.category_id
          LIMIT 1000`,
    args: [],
  })

  const categoryProductMap: Record<string, number> = {}
  for (const row of categoryProductResult.rows) {
    const catName = String(row.category_name || 'Uncategorized')
    categoryProductMap[catName] = (categoryProductMap[catName] || 0) + 1
  }

  const result = {
    today: {
      orders: todayOrders.rows.length,
      revenue: todayRevenue,
      newUsers: recentUsers.rows.filter((u: any) => String(u.created_at).startsWith(today)).length,
    },
    thisMonth: {
      orders: monthOrders.rows.length,
      revenue: monthRevenue,
    },
    allTime: {
      orders: allTimeOrdersCount,
      revenue: allTimeRevenue,
      customers: Number(customerCount.rows[0]?.count ?? 0),
      activeProducts: Number(activeProductCount.rows[0]?.count ?? 0),
    },
    orderStatusBreakdown: statusCounts,
    revenueLast30Days: revenueByDay,
    inventoryAlerts: {
      lowStock: lowStockProducts.rows.length,
      outOfStock: outOfStockProducts.rows.length,
      lowStockProducts: lowStockProducts.rows.slice(0, 10),
      outOfStockProducts: outOfStockProducts.rows.slice(0, 10),
    },
    recentActivity: {
      orders: recentOrdersWithUser,
      users: recentUsers.rows,
    },
    topPerformers: {
      products: topProductsList,
      categories: categoryProductMap,
    },
  }

  await setCache(cacheKey, result, 300)

  return result
}

export async function getSalesReport(db: Client, startDate: string, endDate: string, groupBy: string) {
  const ordersResult = await db.execute({
    sql: `SELECT o.id, o.total_amount, o.payment_status, o.payment_method, o.created_at,
          oi.quantity, oi.product_id
          FROM orders o
          LEFT JOIN order_items oi ON oi.order_id = o.id
          WHERE o.created_at >= ? AND o.created_at <= ?`,
    args: [startDate, endDate + 'T23:59:59'],
  })

  const ordersMap = new Map<string, any>()
  for (const row of ordersResult.rows) {
    const orderId = String(row.id)
    if (!ordersMap.has(orderId)) {
      ordersMap.set(orderId, {
        id: orderId,
        total_amount: Number(row.total_amount),
        payment_status: String(row.payment_status),
        payment_method: String(row.payment_method || 'UNKNOWN'),
        created_at: String(row.created_at),
        order_items: [],
      })
    }
    if (row.product_id) {
      ordersMap.get(orderId).order_items.push({
        product_id: String(row.product_id),
        quantity: Number(row.quantity),
      })
    }
  }

  const orders = Array.from(ordersMap.values())
  const paidOrders = orders.filter(o => o.payment_status === 'PAID')
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
  const totalOrders = orders.length

  const revenueByPeriod: Record<string, { revenue: number; orders: number }> = {}
  const paymentMethodBreakdown: Record<string, { revenue: number; orders: number }> = {}

  for (const order of orders) {
    const date = order.created_at?.split('T')[0]
    if (!date) continue

    let periodKey: string
    if (groupBy === 'month') {
      periodKey = date.substring(0, 7)
    } else if (groupBy === 'week') {
      const d = new Date(date)
      const weekNum = Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7)
      periodKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-W${weekNum}`
    } else {
      periodKey = date
    }

    if (!revenueByPeriod[periodKey]) revenueByPeriod[periodKey] = { revenue: 0, orders: 0 }
    if (order.payment_status === 'PAID') {
      revenueByPeriod[periodKey].revenue += order.total_amount || 0
    }
    revenueByPeriod[periodKey].orders += 1

    const method = order.payment_method || 'UNKNOWN'
    if (!paymentMethodBreakdown[method]) paymentMethodBreakdown[method] = { revenue: 0, orders: 0 }
    if (order.payment_status === 'PAID') {
      paymentMethodBreakdown[method].revenue += order.total_amount || 0
    }
    paymentMethodBreakdown[method].orders += 1
  }

  const productIds = [...new Set(
    orders.flatMap(o => o.order_items.map((oi: any) => oi.product_id)).filter(Boolean)
  )]

  const categoryBreakdown: Record<string, { revenue: number; orders: number }> = {}

  if (productIds.length > 0) {
    const placeholders = productIds.map(() => '?').join(',')
    const productsResult = await db.execute({
      sql: `SELECT id, category_id FROM products WHERE id IN (${placeholders})`,
      args: productIds,
    })

    const categoryIds = [...new Set(productsResult.rows.map((p: any) => p.category_id).filter(Boolean))]
    const catNameMap: Record<string, string> = {}

    if (categoryIds.length > 0) {
      const catPlaceholders = categoryIds.map(() => '?').join(',')
      const categoriesResult = await db.execute({
        sql: `SELECT id, name FROM categories WHERE id IN (${catPlaceholders})`,
        args: categoryIds,
      })
      for (const cat of categoriesResult.rows) {
        catNameMap[String(cat.id)] = String(cat.name)
      }
    }

    const productCatMap: Record<string, string> = {}
    for (const p of productsResult.rows) {
      productCatMap[String(p.id)] = String(p.category_id)
    }

    for (const order of paidOrders) {
      for (const item of order.order_items) {
        const catId = productCatMap[item.product_id]
        const catName = catId ? catNameMap[catId] || catId : 'Uncategorized'
        if (!categoryBreakdown[catName]) categoryBreakdown[catName] = { revenue: 0, orders: 0 }
        categoryBreakdown[catName].revenue += (item.quantity || 0) * (order.total_amount / (order.order_items?.length || 1))
        categoryBreakdown[catName].orders += 1
      }
    }
  }

  return {
    startDate,
    endDate,
    groupBy,
    totalRevenue,
    totalOrders,
    revenueByPeriod,
    paymentMethodBreakdown,
    categoryBreakdown,
  }
}

export async function getNotifications(db: Client, userId: string, userRole: string, filters: { isRead?: boolean; page: number; limit: number }) {
  const { isRead, page, limit } = filters
  const offset = (page - 1) * limit

  const whereClauses: string[] = []
  const args: any[] = []

  if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
    whereClauses.push('user_id = ?')
    args.push(userId)
  }

  if (isRead !== undefined) {
    whereClauses.push(`is_read = ${isRead ? 1 : 0}`)
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

  const dataResult = await db.execute({
    sql: `SELECT * FROM notifications ${whereStr} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    args: [...args, limit, offset],
  })

  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as count FROM notifications ${whereStr}`,
    args,
  })

  const total = Number(countResult.rows[0]?.count ?? 0)

  const unreadResult = await db.execute({
    sql: `SELECT COUNT(*) as count FROM notifications WHERE is_read = 0`,
    args: [],
  })

  return {
    notifications: dataResult.rows,
    unreadCount: Number(unreadResult.rows[0]?.count ?? 0),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export async function markNotificationRead(db: Client, notificationId: string, userId: string, userRole: string) {
  const result = await db.execute({
    sql: `SELECT * FROM notifications WHERE id = ?`,
    args: [notificationId],
  })

  const notification = result.rows[0]
  if (!notification) {
    throw new AppError('Notification not found', 404, 'NOT_FOUND')
  }

  if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN' && String(notification.user_id) !== userId) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN')
  }

  await db.execute({
    sql: `UPDATE notifications SET is_read = 1 WHERE id = ?`,
    args: [notificationId],
  })

  return { message: 'Notification marked as read' }
}

export async function markAllNotificationsRead(db: Client, userId: string) {
  await db.execute({
    sql: `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`,
    args: [userId],
  })

  return { message: 'All notifications marked as read' }
}

export async function getAuditLogs(db: Client, filters: { entity?: string; entityId?: string; userId?: string; page: number; limit: number }) {
  const { entity, entityId, userId, page, limit } = filters
  const offset = (page - 1) * limit

  const whereClauses: string[] = []
  const args: any[] = []

  if (entity) {
    whereClauses.push('entity = ?')
    args.push(entity)
  }
  if (entityId) {
    whereClauses.push('entity_id = ?')
    args.push(entityId)
  }
  if (userId) {
    whereClauses.push('user_id = ?')
    args.push(userId)
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

  const dataResult = await db.execute({
    sql: `SELECT * FROM audit_logs ${whereStr} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    args: [...args, limit, offset],
  })

  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as count FROM audit_logs ${whereStr}`,
    args,
  })

  const total = Number(countResult.rows[0]?.count ?? 0)

  return {
    logs: dataResult.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export async function getUsers(db: Client, filters: { search?: string; role?: string; isActive?: boolean; page: number; limit: number }) {
  const { search, role, isActive, page, limit } = filters
  const offset = (page - 1) * limit

  const whereClauses: string[] = []
  const args: any[] = []

  if (search) {
    whereClauses.push(`(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)`)
    const searchPattern = `%${search}%`
    args.push(searchPattern, searchPattern, searchPattern)
  }
  if (role) {
    whereClauses.push('role = ?')
    args.push(role)
  }
  if (isActive !== undefined) {
    whereClauses.push(`is_active = ${isActive ? 1 : 0}`)
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

  const dataResult = await db.execute({
    sql: `SELECT id, first_name, last_name, email, phone, role, is_active, created_at, updated_at FROM users ${whereStr} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    args: [...args, limit, offset],
  })

  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as count FROM users ${whereStr}`,
    args,
  })

  const total = Number(countResult.rows[0]?.count ?? 0)

  const usersWithOrders = await Promise.all(
    dataResult.rows.map(async (user: any) => {
      const orderCountResult = await db.execute({
        sql: `SELECT COUNT(*) as count FROM orders WHERE user_id = ?`,
        args: [user.id],
      })
      return {
        ...user,
        is_active: fromSqliteBool(user.is_active as number),
        orderCount: Number(orderCountResult.rows[0]?.count ?? 0),
      }
    })
  )

  return {
    users: usersWithOrders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export async function getUser(db: Client, id: string) {
  const result = await db.execute({
    sql: `SELECT * FROM users WHERE id = ?`,
    args: [id],
  })

  const profile = result.rows[0]
  if (!profile) {
    throw new AppError('User not found', 404, 'NOT_FOUND')
  }

  const orderCountResult = await db.execute({
    sql: `SELECT COUNT(*) as count FROM orders WHERE user_id = ?`,
    args: [id],
  })

  const ordersResult = await db.execute({
    sql: `SELECT id, order_number, status, total_amount, payment_status, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`,
    args: [id],
  })

  const totalSpentResult = await db.execute({
    sql: `SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE user_id = ? AND payment_status = 'PAID'`,
    args: [id],
  })

  return {
    ...profile,
    is_active: fromSqliteBool(profile.is_active as number),
    orderCount: Number(orderCountResult.rows[0]?.count ?? 0),
    recentOrders: ordersResult.rows,
    totalSpent: Number(totalSpentResult.rows[0]?.total ?? 0),
  }
}

export async function updateUserRole(db: Client, userId: string, role: string, adminUserId: string) {
  const result = await db.execute({
    sql: `SELECT id, role FROM users WHERE id = ?`,
    args: [userId],
  })

  const profile = result.rows[0]
  if (!profile) {
    throw new AppError('User not found', 404, 'NOT_FOUND')
  }

  await db.execute({
    sql: `UPDATE users SET role = ? WHERE id = ?`,
    args: [role, userId],
  })

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'UPDATE_ROLE',
    entity: 'users',
    entityId: userId,
    changes: { previousRole: profile.role, newRole: role },
  })

  return { message: 'User role updated successfully' }
}

export async function updateUserStatus(db: Client, userId: string, isActive: boolean, adminUserId: string) {
  const result = await db.execute({
    sql: `SELECT id, is_active FROM users WHERE id = ?`,
    args: [userId],
  })

  const profile = result.rows[0]
  if (!profile) {
    throw new AppError('User not found', 404, 'NOT_FOUND')
  }

  await db.execute({
    sql: `UPDATE users SET is_active = ? WHERE id = ?`,
    args: [isActive ? 1 : 0, userId],
  })

  await createAuditLog(db, {
    userId: adminUserId,
    action: isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
    entity: 'users',
    entityId: userId,
    changes: { previousStatus: fromSqliteBool(profile.is_active as number), newStatus: isActive },
  })

  return { message: `User ${isActive ? 'activated' : 'deactivated'} successfully` }
}