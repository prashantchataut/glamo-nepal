const KHALTI_VERIFY_URL = 'https://khalti.com/api/v2/payment/verify/'
const ESEWA_VERIFY_URL = 'https://esewa.com.np/api/v2/transaction/status/'

export interface PaymentVerificationResult {
  verified: boolean
  transactionId: string
  amount?: number
  message?: string
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