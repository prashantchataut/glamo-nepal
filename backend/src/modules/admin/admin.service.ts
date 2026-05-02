import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '../../utils/supabase'
import { CACHE_TTL, getFromCache, setCache, deleteCacheByPrefix } from '../../utils/cache'
import { createAuditLog } from '../../utils/audit'

export async function getDashboardStats(supabase: SupabaseClient, kv: KVNamespace) {
  const cacheKey = 'admin:dashboard'
  const cached = await getFromCache<any>(kv, cacheKey)
  if (cached) return cached

  const today = new Date().toISOString().split('T')[0]
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [
    todayOrders,
    monthOrders,
    allTimeOrders,
    orderStatusBreakdown,
    revenueLast30,
    customerCount,
    activeProductCount,
    lowStockProducts,
    outOfStockProducts,
    recentOrders,
    recentUsers,
    topProducts,
    topCategories,
  ] = await Promise.all([
    supabase.from('orders').select('total_amount, payment_status', { count: 'exact' }).gte('created_at', today),
    supabase.from('orders').select('total_amount, payment_status', { count: 'exact' }).gte('created_at', monthStart),
    supabase.from('orders').select('total_amount, payment_status', { count: 'exact' }),
    supabase.from('orders').select('status'),
    supabase.from('orders').select('created_at, total_amount, payment_status').gte('created_at', thirtyDaysAgo).eq('payment_status', 'PAID'),
    supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'CUSTOMER').eq('is_active', true),
    supabase.from('products').select('id', { count: 'exact' }).eq('is_active', true).is('deleted_at', null),
    supabase.from('products').select('id, name, sku, stock_quantity, low_stock_threshold').eq('is_active', true).is('deleted_at', null).lte('stock_quantity', 5),
    supabase.from('products').select('id, name, sku, stock_quantity').eq('is_active', true).is('deleted_at', null).eq('stock_quantity', 0),
    supabase.from('orders').select('id, order_number, total_amount, status, created_at, user_id').order('created_at', { ascending: false }).limit(10),
    supabase.from('profiles').select('id, first_name, last_name, email, role, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('order_items').select('product_id, product_name, quantity').order('quantity', { ascending: false }).limit(10),
    supabase.from('order_items').select('product_id, quantity').limit(1000),
  ])

  const todayRevenue = todayOrders.data?.filter(o => o.payment_status === 'PAID').reduce((sum, o) => sum + (o.total_amount || 0), 0) ?? 0
  const monthRevenue = monthOrders.data?.filter(o => o.payment_status === 'PAID').reduce((sum, o) => sum + (o.total_amount || 0), 0) ?? 0
  const allTimeRevenue = allTimeOrders.data?.filter(o => o.payment_status === 'PAID').reduce((sum, o) => sum + (o.total_amount || 0), 0) ?? 0

  const statusCounts: Record<string, number> = {}
  for (const o of orderStatusBreakdown.data || []) {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1
  }

  const revenueByDay: Record<string, { revenue: number; orders: number }> = {}
  for (const o of revenueLast30.data || []) {
    const date = o.created_at?.split('T')[0]
    if (date) {
      if (!revenueByDay[date]) revenueByDay[date] = { revenue: 0, orders: 0 }
      revenueByDay[date].revenue += o.total_amount || 0
      revenueByDay[date].orders += 1
    }
  }

  const recentOrdersWithUser = await Promise.all(
    (recentOrders.data || []).slice(0, 10).map(async (order) => {
      const { data: user } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', order.user_id)
        .single()
      return {
        ...order,
        customerName: user ? [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Unknown' : 'Unknown',
      }
    })
  )

  const productQtyMap: Record<string, { name: string; totalSold: number }> = {}
  for (const item of topProducts.data || []) {
    if (!productQtyMap[item.product_id]) {
      productQtyMap[item.product_id] = { name: item.product_name, totalSold: 0 }
    }
    productQtyMap[item.product_id].totalSold += item.quantity
  }
  const topProductsList = Object.entries(productQtyMap)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 10)

  const categoryProductMap: Record<string, number> = {}
  const productIds = [...new Set(topCategories.data?.map(item => item.product_id) || [])]
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('id, category_id')
      .in('id', productIds)
    const categoryIds = [...new Set(products?.map(p => p.category_id) || [])]
    if (categoryIds.length > 0) {
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name')
        .in('id', categoryIds)
      const catNameMap: Record<string, string> = {}
      for (const cat of categories || []) {
        catNameMap[cat.id] = cat.name
      }
      const catCountMap: Record<string, number> = {}
      for (const p of products || []) {
        catCountMap[p.category_id] = (catCountMap[p.category_id] || 0) + 1
      }
      for (const [catId, count] of Object.entries(catCountMap)) {
        categoryProductMap[catNameMap[catId] || catId] = count
      }
    }
  }

  const result = {
    today: {
      orders: todayOrders.count ?? 0,
      revenue: todayRevenue,
      newUsers: recentUsers.data?.filter(u => u.created_at?.startsWith(today)).length ?? 0,
    },
    thisMonth: {
      orders: monthOrders.count ?? 0,
      revenue: monthRevenue,
    },
    allTime: {
      orders: allTimeOrders.count ?? 0,
      revenue: allTimeRevenue,
      customers: customerCount.count ?? 0,
      activeProducts: activeProductCount.count ?? 0,
    },
    orderStatusBreakdown: statusCounts,
    revenueLast30Days: revenueByDay,
    inventoryAlerts: {
      lowStock: lowStockProducts.data?.length ?? 0,
      outOfStock: outOfStockProducts.data?.length ?? 0,
      lowStockProducts: lowStockProducts.data?.slice(0, 10) || [],
      outOfStockProducts: outOfStockProducts.data?.slice(0, 10) || [],
    },
    recentActivity: {
      orders: recentOrdersWithUser,
      users: recentUsers.data || [],
    },
    topPerformers: {
      products: topProductsList,
      categories: categoryProductMap,
    },
  }

  await setCache(kv, cacheKey, result, 300)

  return result
}

export async function getSalesReport(supabase: SupabaseClient, startDate: string, endDate: string, groupBy: string) {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, total_amount, payment_status, payment_method, created_at, order_items(quantity, product_id)')
    .gte('created_at', startDate)
    .lte('created_at', endDate + 'T23:59:59')

  if (error) throw new AppError('Failed to fetch sales report', 500)

  const paidOrders = (orders || []).filter(o => o.payment_status === 'PAID')
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
  const totalOrders = orders?.length ?? 0

  const revenueByPeriod: Record<string, { revenue: number; orders: number }> = {}
  const paymentMethodBreakdown: Record<string, { revenue: number; orders: number }> = {}

  for (const order of orders || []) {
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

  const categoryBreakdown: Record<string, { revenue: number; orders: number }> = {}
  const productIds = [...new Set(
    (orders || []).flatMap(o => (o.order_items || []).map((oi: any) => oi.product_id)).filter(Boolean)
  )]

  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('id, category_id')
      .in('id', productIds)

    const categoryIds = [...new Set(products?.map(p => p.category_id).filter(Boolean) || [])]
    let catNameMap: Record<string, string> = {}
    if (categoryIds.length > 0) {
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name')
        .in('id', categoryIds)
      for (const cat of categories || []) {
        catNameMap[cat.id] = cat.name
      }
    }

    const productCatMap: Record<string, string> = {}
    for (const p of products || []) {
      productCatMap[p.id] = p.category_id
    }

    for (const order of paidOrders) {
      for (const item of (order.order_items || [])) {
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

export async function getNotifications(supabase: SupabaseClient, userId: string, userRole: string, filters: { isRead?: boolean; page: number; limit: number }) {
  const { isRead, page, limit } = filters
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
    // admins see all notifications
  } else {
    query = query.eq('user_id', userId)
  }

  if (isRead !== undefined) {
    query = query.eq('is_read', isRead)
  }

  const { data, error, count } = await query

  if (error) throw new AppError('Failed to fetch notifications', 500)

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('is_read', false)

  return {
    notifications: data || [],
    unreadCount: unreadCount ?? 0,
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  }
}

export async function markNotificationRead(supabase: SupabaseClient, notificationId: string, userId: string, userRole: string) {
  const { data: notification, error: fetchError } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', notificationId)
    .single()

  if (!notification || fetchError) {
    throw new AppError('Notification not found', 404, 'NOT_FOUND')
  }

  if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN' && notification.user_id !== userId) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN')
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) throw new AppError('Failed to mark notification as read', 500)

  return { message: 'Notification marked as read' }
}

export async function markAllNotificationsRead(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) throw new AppError('Failed to mark all notifications as read', 500)

  return { message: 'All notifications marked as read' }
}

export async function getAuditLogs(supabase: SupabaseClient, filters: { entity?: string; entityId?: string; userId?: string; page: number; limit: number }) {
  const { entity, entityId, userId, page, limit } = filters
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (entity) query = query.eq('entity', entity)
  if (entityId) query = query.eq('entity_id', entityId)
  if (userId) query = query.eq('user_id', userId)

  const { data, error, count } = await query

  if (error) throw new AppError('Failed to fetch audit logs', 500)

  return {
    logs: data || [],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  }
}

export async function getUsers(supabase: SupabaseClient, filters: { search?: string; role?: string; isActive?: boolean; page: number; limit: number }) {
  const { search, role, isActive, page, limit } = filters
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('profiles')
    .select('id, first_name, last_name, email, phone, role, is_active, created_at, updated_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
  }
  if (role) query = query.eq('role', role)
  if (isActive !== undefined) query = query.eq('is_active', isActive)

  const { data, error, count } = await query

  if (error) throw new AppError('Failed to fetch users', 500)

  const usersWithOrders = await Promise.all(
    (data || []).map(async (user) => {
      const { count: orderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
      return {
        ...user,
        orderCount: orderCount ?? 0,
      }
    })
  )

  return {
    users: usersWithOrders,
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  }
}

export async function getUser(supabase: SupabaseClient, id: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile || error) {
    throw new AppError('User not found', 404, 'NOT_FOUND')
  }

  const { count: orderCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .eq('user_id', id)

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, status, total_amount, payment_status, created_at')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  const { count: totalSpentResult } = await supabase
    .from('orders')
    .select('total_amount', { count: 'exact' })
    .eq('user_id', id)
    .eq('payment_status', 'PAID')

  const totalSpent = totalSpentResult
    ? (orders || []).reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0)
    : 0

  return {
    ...profile,
    orderCount: orderCount ?? 0,
    recentOrders: orders || [],
    totalSpent,
  }
}

export async function updateUserRole(supabase: SupabaseClient, userId: string, role: string, adminUserId: string) {
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .single()

  if (!profile || fetchError) {
    throw new AppError('User not found', 404, 'NOT_FOUND')
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (error) throw new AppError('Failed to update user role', 500)

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'UPDATE_ROLE',
    entity: 'profiles',
    entityId: userId,
    changes: { previousRole: profile.role, newRole: role },
  })

  return { message: 'User role updated successfully' }
}

export async function updateUserStatus(supabase: SupabaseClient, userId: string, isActive: boolean, adminUserId: string) {
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('id, is_active')
    .eq('id', userId)
    .single()

  if (!profile || fetchError) {
    throw new AppError('User not found', 404, 'NOT_FOUND')
  }

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId)

  if (error) throw new AppError('Failed to update user status', 500)

  if (!isActive) {
    try {
      await supabase.auth.admin.signOut(userId)
    } catch (e) {
      console.error('Failed to sign out user sessions:', e)
    }
  }

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
    entity: 'profiles',
    entityId: userId,
    changes: { previousStatus: profile.is_active, newStatus: isActive },
  })

  return { message: `User ${isActive ? 'activated' : 'deactivated'} successfully` }
}