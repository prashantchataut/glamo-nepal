import { describe, expect, it, vi, beforeEach } from 'vitest'
import { calculateDeliveryFee } from '../utils/delivery'

const mocks = vi.hoisted(() => ({
  getOrder: vi.fn(),
  initiateKhaltiPayment: vi.fn(),
  buildEsewaPayload: vi.fn(),
  signEsewaPayload: vi.fn(),
}))

vi.mock('../modules/orders/order.service', () => ({
  getOrder: mocks.getOrder,
}))

vi.mock('../utils/payment-verify', () => ({
  initiateKhaltiPayment: mocks.initiateKhaltiPayment,
  buildEsewaPayload: mocks.buildEsewaPayload,
  signEsewaPayload: mocks.signEsewaPayload,
}))

function createContext(provider: string) {
  return {
    env: {
      KHALTI_PUBLIC_KEY: 'test-public-key',
      KHALTI_SECRET_KEY: 'test-secret-key',
      ESEWA_MERCHANT_CODE: 'EPAYTEST',
      ESEWA_SECRET_KEY: 'esewa-secret',
      ESEWA_IS_LIVE: 'false',
    },
    req: {
      url: 'https://glamo.test/api/v1/checkout/orders/order-1/payments/initiate',
      param: () => ({ id: 'order-1', provider }),
    },
    get: (key: string) => {
      if (key === 'db') return {}
      return undefined
    },
    json: vi.fn((body, status) => ({ body, status })),
  }
}

describe('checkout total contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getOrder.mockResolvedValue({
      id: 'order-1',
      orderNumber: 'GLM-2026-0001',
      paymentMethod: 'KHALTI',
      paymentStatus: 'PENDING',
      totalAmount: 1234,
    })
    mocks.initiateKhaltiPayment.mockResolvedValue({ paymentUrl: 'https://pay.test', pidx: 'pidx-1' })
    mocks.buildEsewaPayload.mockReturnValue({ url: 'https://esewa.test', payload: { total_amount: '1234' } })
    mocks.signEsewaPayload.mockImplementation(async (payload) => payload)
  })

  it('uses the checkout delivery fee table expected by the storefront', () => {
    expect(calculateDeliveryFee(1000, 'Kathmandu', 'Bagmati')).toBe(100)
    expect(calculateDeliveryFee(1000, 'Lalitpur', 'Bagmati')).toBe(100)
    expect(calculateDeliveryFee(1000, 'Bhaktapur', 'Bagmati')).toBe(120)
    expect(calculateDeliveryFee(1000, 'Chitwan', 'Bagmati')).toBe(190)
    expect(calculateDeliveryFee(2500, 'Kathmandu', 'Bagmati')).toBe(0)
  })

  it('initiates Khalti with the order display total converted to paisa', async () => {
    const { initiateKhaltiPaymentController } = await import('../modules/orders/order.controller')

    await initiateKhaltiPaymentController(createContext('khalti') as never)

    expect(mocks.initiateKhaltiPayment).toHaveBeenCalledWith(
      'test-public-key',
      'test-secret-key',
      'https://glamo.test/payment/khalti/callback',
      123400,
      'order-1',
      'GLM-2026-0001',
    )
  })

  it('initiates eSewa with the order display total without a second conversion', async () => {
    mocks.getOrder.mockResolvedValue({
      id: 'order-1',
      orderNumber: 'GLM-2026-0001',
      paymentMethod: 'ESEWA',
      paymentStatus: 'PENDING',
      totalAmount: 1234,
    })
    const { initiateEsewaPaymentController } = await import('../modules/orders/order.controller')

    await initiateEsewaPaymentController(createContext('esewa') as never)

    expect(mocks.buildEsewaPayload).toHaveBeenCalledWith(
      'EPAYTEST',
      1234,
      'GLM-2026-0001',
      false,
      'esewa-secret',
    )
  })
})
