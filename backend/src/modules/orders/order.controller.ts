import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { ApiResponse } from '../../utils/response'
import * as OrderService from './order.service'

export async function createOrder(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const user = safeUser(c)
    const order = await OrderService.createOrder(data, c.env.DB, user?.id)
    return ApiResponse.success(c, 'Order created successfully', order, 201)
  } catch (error: any) {
    if (error.message === 'CUSTOMER_REQUIRED') return ApiResponse.error(c, 'Customer details are required for guest checkout', 400)
    if (error.message?.startsWith('PRODUCT_NOT_FOUND')) return ApiResponse.error(c, 'One or more products are unavailable', 404)
    if (error.message?.startsWith('INSUFFICIENT_STOCK')) return ApiResponse.error(c, 'One or more products do not have enough stock', 409)
    if (error.message === 'VARIANT_NOT_FOUND') return ApiResponse.error(c, 'Selected product variant is unavailable', 404)
    return ApiResponse.error(c, error.message || 'Failed to create order', 500)
  }
}


export async function verifyCheckoutPayment(c: Context<AppEnv>) {
  try {
    const { id, provider } = c.req.param()
    if (!['khalti', 'esewa', 'card', 'cards', 'KHALTI', 'ESEWA'].includes(provider)) return ApiResponse.error(c, 'Unsupported payment provider', 400)
    const body = await c.req.json().catch(() => ({})) as { token?: string; pidx?: string; refId?: string; transactionId?: string }
    const token = body.token || body.pidx || body.refId || body.transactionId
    if (!token) return ApiResponse.error(c, 'Payment token is required', 400)
    const order = await OrderService.markOrderPaymentVerified(id, provider, token, c.env.DB)
    return ApiResponse.success(c, 'Payment verified', order)
  } catch (error: any) {
    if (error.message === 'ORDER_NOT_FOUND') return ApiResponse.error(c, 'Order not found', 404)
    return ApiResponse.error(c, error.message || 'Failed to verify payment', 500)
  }
}

export async function listOrders(c: Context<AppEnv>) {
  try {
    const query = c.req.query()
    const user = c.get('user')
    const result = await OrderService.listOrders({
      status: query.status,
      paymentStatus: query.paymentStatus,
      paymentMethod: query.paymentMethod,
      userId: query.userId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
    }, c.env.DB, user)
    return ApiResponse.paginated(c, 'Orders fetched successfully', result.orders, result.pagination.total, result.pagination.page, result.pagination.limit)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to fetch orders', 500)
  }
}

export async function getOrder(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const user = c.get('user')
    const order = await OrderService.getOrder(id, c.env.DB, user)
    return ApiResponse.success(c, 'Order fetched successfully', order)
  } catch (error: any) {
    if (error.message === 'ORDER_NOT_FOUND') return ApiResponse.error(c, 'Order not found', 404)
    if (error.message === 'ORDER_FORBIDDEN') return ApiResponse.error(c, 'You cannot access this order', 403)
    return ApiResponse.error(c, error.message || 'Failed to fetch order', 500)
  }
}

export async function updateOrderStatus(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const data = c.get('validatedBody')
    const user = c.get('user')
    const order = await OrderService.updateOrderStatus(id, data, c.env.DB, user.id)
    return ApiResponse.success(c, 'Order status updated', order)
  } catch (error: any) {
    if (error.message === 'ORDER_NOT_FOUND') return ApiResponse.error(c, 'Order not found', 404)
    return ApiResponse.error(c, error.message || 'Failed to update order status', 500)
  }
}

export async function cancelOrder(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const user = c.get('user')
    const body = await c.req.json().catch(() => ({})) as { reason?: string }
    const order = await OrderService.cancelOrder(id, c.env.DB, user, body.reason)
    return ApiResponse.success(c, 'Order cancelled', order)
  } catch (error: any) {
    if (error.message === 'ORDER_NOT_FOUND') return ApiResponse.error(c, 'Order not found', 404)
    if (error.message === 'ORDER_FORBIDDEN') return ApiResponse.error(c, 'You cannot cancel this order', 403)
    if (error.message === 'ORDER_NOT_CANCELLABLE') return ApiResponse.error(c, 'This order can no longer be cancelled', 409)
    return ApiResponse.error(c, error.message || 'Failed to cancel order', 500)
  }
}

function safeUser(c: Context<AppEnv>) {
  try {
    return c.get('user')
  } catch {
    return undefined
  }
}
