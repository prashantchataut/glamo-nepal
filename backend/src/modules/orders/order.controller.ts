import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { AppError } from '../../utils/turso-helpers'
import { ApiResponse } from '../../utils/response'
import { getEnv } from '../../utils/env'
import { initiateKhaltiPayment, buildEsewaPayload } from '../../utils/payment-verify'
import * as OrderService from './order.service'

export async function createOrder(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const db = c.get('db')
    const user = safeUser(c)
    const order = await OrderService.createOrder(data, db, user?.id, c)
    return ApiResponse.success(c, 'Order created successfully', order, 201)
  } catch (error: any) {
    if (error instanceof AppError) {
      if (error.code === 'CUSTOMER_REQUIRED') return ApiResponse.error(c, 'Customer details are required for guest checkout', 400)
      if (error.code === 'PRODUCT_NOT_FOUND') return ApiResponse.error(c, 'One or more products are unavailable', 404)
      if (error.code === 'INSUFFICIENT_STOCK') return ApiResponse.error(c, 'One or more products do not have enough stock', 409)
      if (error.code === 'VARIANT_NOT_FOUND') return ApiResponse.error(c, 'Selected product variant is unavailable', 404)
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to create order', 500)
  }
}

export async function verifyCheckoutPayment(c: Context<AppEnv>) {
  try {
    const { id, provider } = c.req.param()
    if (!['khalti', 'esewa', 'card', 'cards', 'KHALTI', 'ESEWA'].includes(provider)) {
      return ApiResponse.error(c, 'Unsupported payment provider', 400)
    }
    const body = await c.req.json().catch(() => ({})) as { token?: string; pidx?: string; refId?: string; transactionId?: string }
    const token = body.token || body.pidx || body.refId || body.transactionId
    if (!token) return ApiResponse.error(c, 'Payment token is required', 400)
    const db = c.get('db')
    const env = {
      KHALTI_SECRET_KEY: getEnv(c, 'KHALTI_SECRET_KEY'),
      ESEWA_SECRET_KEY: getEnv(c, 'ESEWA_SECRET_KEY'),
      ESEWA_MERCHANT_CODE: getEnv(c, 'ESEWA_MERCHANT_CODE'),
    }
    const order = await OrderService.verifyCheckoutPayment(id, provider, token, db, env)
    return ApiResponse.success(c, 'Payment verified', order)
  } catch (error: any) {
    if (error instanceof AppError) {
      if (error.code === 'ORDER_NOT_FOUND') return ApiResponse.error(c, 'Order not found', 404)
      if (error.code === 'PAYMENT_VERIFICATION_FAILED') return ApiResponse.error(c, error.message, 400)
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to verify payment', 500)
  }
}

export async function listOrders(c: Context<AppEnv>) {
  try {
    const query = c.req.query()
    const db = c.get('db')
    const user = c.get('user')
    const result = await OrderService.listOrders({
      status: query.status,
      paymentStatus: query.paymentStatus,
      paymentMethod: query.paymentMethod,
      userId: query.userId,
      startDate: query.startDate,
      endDate: query.endDate,
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
    }, db, user)
    return ApiResponse.paginated(c, 'Orders fetched successfully', result.orders, result.pagination.total, result.pagination.page, result.pagination.limit)
  } catch (error: any) {
    if (error instanceof AppError) return ApiResponse.error(c, error.message, error.statusCode)
    return ApiResponse.error(c, error.message || 'Failed to fetch orders', 500)
  }
}

export async function getOrder(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const db = c.get('db')
    const user = c.get('user')
    const order = await OrderService.getOrder(id, db, user)
    return ApiResponse.success(c, 'Order fetched successfully', order)
  } catch (error: any) {
    if (error instanceof AppError) {
      if (error.code === 'ORDER_NOT_FOUND') return ApiResponse.error(c, 'Order not found', 404)
      if (error.code === 'ORDER_FORBIDDEN') return ApiResponse.error(c, 'You cannot access this order', 403)
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch order', 500)
  }
}

export async function updateOrderStatus(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const data = c.get('validatedBody')
    const db = c.get('db')
    const user = c.get('user')
    const order = await OrderService.updateOrderStatus(id, data, db, user.id, c)
    return ApiResponse.success(c, 'Order status updated', order)
  } catch (error: any) {
    if (error instanceof AppError) {
      if (error.code === 'ORDER_NOT_FOUND') return ApiResponse.error(c, 'Order not found', 404)
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to update order status', 500)
  }
}

export async function cancelOrder(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const db = c.get('db')
    const user = c.get('user')
    const body = await c.req.json().catch(() => ({})) as { reason?: string }
    const order = await OrderService.cancelOrder(id, db, user, body.reason)
    return ApiResponse.success(c, 'Order cancelled', order)
  } catch (error: any) {
    if (error instanceof AppError) {
      if (error.code === 'ORDER_NOT_FOUND') return ApiResponse.error(c, 'Order not found', 404)
      if (error.code === 'ORDER_FORBIDDEN') return ApiResponse.error(c, 'You cannot cancel this order', 403)
      if (error.code === 'ORDER_NOT_CANCELLABLE') return ApiResponse.error(c, 'This order can no longer be cancelled', 409)
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to cancel order', 500)
  }
}

export async function getPublicOrder(c: Context<AppEnv>) {
  try {
    const { orderNumber } = c.req.param()
    const query = c.req.query()
    const db = c.get('db')
    const order = await OrderService.getPublicOrder(orderNumber, db, query.email, query.phone)
    return ApiResponse.success(c, 'Order fetched successfully', order)
  } catch (error: any) {
    if (error instanceof AppError) {
      if (error.code === 'ORDER_NOT_FOUND') return ApiResponse.error(c, 'Order not found', 404)
      if (error.code === 'ORDER_VERIFICATION_FAILED') return ApiResponse.error(c, error.message, 403)
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch order', 500)
  }
}

function safeUser(c: Context<AppEnv>) {
  try {
    return c.get('user')
  } catch {
    return undefined
  }
}

export async function initiateKhaltiPaymentController(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const db = c.get('db')
    const user = safeUser(c)
    const order = await OrderService.getOrder(id, db, user)

    if (order.paymentMethod !== 'KHALTI' && order.paymentMethod !== 'khalti') {
      return ApiResponse.error(c, 'Order is not a Khalti payment order', 400)
    }
    if (order.paymentStatus === 'PAID') {
      return ApiResponse.error(c, 'Order is already paid', 400)
    }

    const secretKey = getEnv(c, 'KHALTI_SECRET_KEY')
    const publicKey = getEnv(c, 'KHALTI_PUBLIC_KEY') || process.env.KHALTI_PUBLIC_KEY || ''
    const origin = new URL(c.req.url).origin
    const returnUrl = `${origin}/payment/khalti/callback`

    const result = await initiateKhaltiPayment(
      publicKey,
      secretKey,
      returnUrl,
      order.totalAmount,
      order.id,
      order.orderNumber,
    )

    return ApiResponse.success(c, 'Khalti payment initiated', result)
  } catch (error: any) {
    if (error instanceof AppError) return ApiResponse.error(c, error.message, error.statusCode)
    return ApiResponse.error(c, error.message || 'Failed to initiate Khalti payment', 500)
  }
}

export async function initiateEsewaPaymentController(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const db = c.get('db')
    const user = safeUser(c)
    const order = await OrderService.getOrder(id, db, user)

    if (order.paymentMethod !== 'ESEWA' && order.paymentMethod !== 'esewa') {
      return ApiResponse.error(c, 'Order is not an eSewa payment order', 400)
    }
    if (order.paymentStatus === 'PAID') {
      return ApiResponse.error(c, 'Order is already paid', 400)
    }

    const merchantCode = getEnv(c, 'ESEWA_MERCHANT_CODE')
    const isLive = (getEnv(c, 'ESEWA_IS_LIVE') || process.env.ESEWA_IS_LIVE || 'false') === 'true'

    const totalAmount = order.totalAmount / 100
    const transactionUuid = order.orderNumber

    const result = buildEsewaPayload(merchantCode, totalAmount, transactionUuid, isLive)

    return ApiResponse.success(c, 'eSewa payment initiated', result)
  } catch (error: any) {
    if (error instanceof AppError) return ApiResponse.error(c, error.message, error.statusCode)
    return ApiResponse.error(c, error.message || 'Failed to initiate eSewa payment', 500)
  }
}