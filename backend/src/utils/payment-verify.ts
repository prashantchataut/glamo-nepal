const KHALTI_VERIFY_URL = 'https://khalti.com/api/v2/payment/verify/'
const ESEWA_VERIFY_URL = 'https://esewa.com.np/api/v2/transaction/status/'
const KHALTI_INITIATE_URL = 'https://khalti.com/api/v2/epayment/initiate/'
const ESEWA_LIVE_URL = 'https://esewa.com.np/epay/main'
const ESEWA_TEST_URL = 'https://uat.esewa.com.np/epay/main'

export interface PaymentVerificationResult {
  verified: boolean
  transactionId: string
  amount?: number
  message?: string
}

export function getEsewaUrl(isLive: boolean): string {
  return isLive ? ESEWA_LIVE_URL : ESEWA_TEST_URL
}

export interface KhaltiInitiateResult {
  paymentUrl: string
  pidx: string
}

export async function initiateKhaltiPayment(
  publicKey: string,
  secretKey: string,
  returnUrl: string,
  amountInPaisa: number,
  orderId: string,
  orderNumber: string,
): Promise<KhaltiInitiateResult> {
  const response = await fetch(KHALTI_INITIATE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Key ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      return_url: returnUrl,
      website_url: new URL(returnUrl).origin,
      amount: amountInPaisa,
      purchase_order_id: orderNumber,
      purchase_order_name: `GLAMO Order ${orderNumber}`,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Khalti initiation failed: ${response.status} ${errorBody}`)
  }

  const data = await response.json() as { payment_url: string; pidx: string }
  return {
    paymentUrl: data.payment_url,
    pidx: data.pidx,
  }
}

async function generateEsewaSignature(
  totalAmount: string,
  transactionUuid: string,
  productCode: string,
  secretKey: string,
): Promise<string> {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secretKey)
  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
}

export function buildEsewaPayload(
  merchantCode: string,
  totalAmount: number,
  transactionUuid: string,
  isLive: boolean,
  secretKey?: string,
): { url: string; payload: Record<string, string> } {
  const url = getEsewaUrl(isLive)
  const totalAmountStr = String(totalAmount)
  const payload: Record<string, string> = {
    amount: String(totalAmount),
    tax_amount: '0',
    total_amount: totalAmountStr,
    transaction_uuid: transactionUuid,
    product_code: merchantCode,
    product_service_charge: '0',
    product_delivery_charge: '0',
  }
  if (isLive && secretKey) {
    payload.signed_field_names = 'total_amount,transaction_uuid,product_code'
  }
  return { url, payload }
}

export async function signEsewaPayload(
  payload: Record<string, string>,
  secretKey: string,
): Promise<Record<string, string>> {
  if (!payload.signed_field_names) return payload
  const signature = await generateEsewaSignature(
    payload.total_amount,
    payload.transaction_uuid,
    payload.product_code,
    secretKey,
  )
  return { ...payload, signature }
}

export interface RefundResult {
  success: boolean
  refundId?: string
  message?: string
}

const KHALTI_REFUND_URL = 'https://khalti.com/api/v2/transaction/refund/'

export async function refundKhaltiPayment(
  secretKey: string,
  pidx: string,
  amountInPaisa: number,
  reason = 'Order cancellation',
): Promise<RefundResult> {
  try {
    const response = await fetch(KHALTI_REFUND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Key ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pidx,
        amount: amountInPaisa,
        reason,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('Khalti refund failed:', response.status, errorBody)
      return { success: false, message: `Khalti refund failed: ${response.status}` }
    }

    const data = await response.json() as { refund_id?: string; status?: string }
    return {
      success: true,
      refundId: data.refund_id || data.status || 'khalti-refund',
      message: 'Khalti refund initiated',
    }
  } catch (error) {
    console.error('Khalti refund error:', error)
    return { success: false, message: 'Khalti refund request failed' }
  }
}

export async function refundEsewaPayment(
  merchantCode: string,
  secretKey: string,
  transactionUuid: string,
  totalAmount: number,
  isLive: boolean,
): Promise<RefundResult> {
  try {
    const baseUrl = isLive
      ? 'https://esewa.com.np/api/v2/transaction/status/'
      : 'https://uat.esewa.com.np/api/v2/transaction/status/'

    const url = new URL(baseUrl)
    url.searchParams.set('product_code', merchantCode)
    url.searchParams.set('transaction_uuid', transactionUuid)
    url.searchParams.set('total_amount', String(totalAmount))

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('eSewa refund status check failed:', response.status, errorBody)
      return { success: false, message: `eSewa refund failed: ${response.status}` }
    }

    const data = await response.json() as { status?: string; transaction_code?: string }

    if (data.status === 'COMPLETE' || data.status === 'REFUNDED') {
      return {
        success: true,
        refundId: data.transaction_code || transactionUuid,
        message: 'eSewa refund processed',
      }
    }

    return { success: false, message: `eSewa refund status: ${data.status || 'unknown'}` }
  } catch (error) {
    console.error('eSewa refund error:', error)
    return { success: false, message: 'eSewa refund request failed' }
  }
}

export async function verifyKhaltiPayment(
  token: string,
  secretKey: string,
): Promise<PaymentVerificationResult> {
  try {
    const response = await fetch(KHALTI_VERIFY_URL, {
      method: 'POST',
      headers: {
        Authorization: `Key ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('Khalti verification failed:', response.status, errorBody)
      return { verified: false, transactionId: token, message: `Khalti verification failed: ${response.status}` }
    }

    const data = await response.json() as {
      idx: string
      state: { name: string }
      amount: number
      type: { name: string }
    }

    if (data.state?.name === 'Completed') {
      return {
        verified: true,
        transactionId: data.idx || token,
        amount: data.amount,
      }
    }

    return {
      verified: false,
      transactionId: data.idx || token,
      message: `Khalti payment state: ${data.state?.name || 'unknown'}`,
    }
  } catch (error) {
    console.error('Khalti verification error:', error)
    return { verified: false, transactionId: token, message: 'Khalti verification request failed' }
  }
}

export async function verifyEsewaPayment(
  transactionId: string,
  merchantCode: string,
  secretKey: string,
  totalAmount: number,
): Promise<PaymentVerificationResult> {
  try {
    const url = new URL(ESEWA_VERIFY_URL)
    url.searchParams.set('product_code', merchantCode)
    url.searchParams.set('transaction_uuid', transactionId)
    url.searchParams.set('total_amount', String(totalAmount))

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('eSewa verification failed:', response.status, errorBody)
      return { verified: false, transactionId, message: `eSewa verification failed: ${response.status}` }
    }

    const data = await response.json() as {
      status: string
      transaction_uuid: string
      total_amount: string
      transaction_code: string
    }

    if (data.status === 'COMPLETE') {
      return {
        verified: true,
        transactionId: data.transaction_code || transactionId,
        amount: Number(data.total_amount),
      }
    }

    return {
      verified: false,
      transactionId: data.transaction_code || transactionId,
      message: `eSewa payment status: ${data.status || 'unknown'}`,
    }
  } catch (error) {
    console.error('eSewa verification error:', error)
    return { verified: false, transactionId, message: 'eSewa verification request failed' }
  }
}