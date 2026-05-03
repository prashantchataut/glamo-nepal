import { renderBaseTemplate } from './base.ts'

export interface OrderConfirmationData {
  orderNumber: string
  customerName: string
  items: Array<{
    name: string
    variantName?: string
    quantity: number
    unitPrice: number
    totalPrice: number
    imageUrl?: string
  }>
  subtotal: number
  shippingCharge: number
  discountAmount: number
  totalAmount: number
  shippingAddress: {
    fullName: string
    phone: string
    address1: string
    address2?: string
    city: string
    district?: string
    province?: string
    postalCode?: string
    country: string
  }
  paymentMethod: string
  orderDate: string
  orderUrl: string
}

function formatNPR(amount: number): string {
  return `NPR ${amount.toLocaleString()}`
}

function formatPaymentMethod(method: string): string {
  const map: Record<string, string> = {
    KHALTI: 'Khalti',
    ESEWA: 'eSewa',
    CASH_ON_DELIVERY: 'Cash on Delivery',
    BANK_TRANSFER: 'Bank Transfer',
  }
  return map[method] || method
}

function formatAddress(addr: OrderConfirmationData['shippingAddress']): string {
  const parts = [
    addr.fullName,
    addr.address1,
    addr.address2,
    addr.city,
    addr.district,
    addr.province,
    addr.postalCode,
    addr.country,
  ].filter(Boolean)
  return parts.join(', ')
}

export function renderOrderConfirmationEmail(data: OrderConfirmationData): string {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #eee;color:#333;font-size:14px;vertical-align:top;">
          ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.name}" width="48" height="48" style="border-radius:6px;margin-right:8px;vertical-align:middle;" />` : ''}
          <strong>${item.name}</strong>${item.variantName ? `<br/><span style="color:#888;font-size:12px;">${item.variantName}</span>` : ''}
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #eee;color:#333;font-size:14px;text-align:center;">${item.quantity}</td>
        <td style="padding:12px 0;border-bottom:1px solid #eee;color:#333;font-size:14px;text-align:right;">${formatNPR(item.totalPrice)}</td>
      </tr>`
    )
    .join('')

  const discountRow = data.discountAmount > 0
    ? `<tr>
        <td style="padding:6px 0;color:#666;font-size:14px;">Discount</td>
        <td style="padding:6px 0;color:#c4a882;font-size:14px;text-align:right;">-${formatNPR(data.discountAmount)}</td>
      </tr>`
    : ''

  const content = `
    <h2 style="margin:0 0 8px;color:#333;font-size:22px;">Order Confirmed!</h2>
    <p style="margin:0 0 6px;color:#666;font-size:15px;">Hi ${data.customerName},</p>
    <p style="margin:0 0 24px;color:#666;font-size:15px;">Your order <strong>#${data.orderNumber}</strong> has been placed successfully on ${data.orderDate}.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <thead>
        <tr>
          <th style="padding:10px 0;border-bottom:2px solid #c4a882;text-align:left;font-size:13px;color:#999;font-weight:600;">Item</th>
          <th style="padding:10px 0;border-bottom:2px solid #c4a882;text-align:center;font-size:13px;color:#999;font-weight:600;">Qty</th>
          <th style="padding:10px 0;border-bottom:2px solid #c4a882;text-align:right;font-size:13px;color:#999;font-weight:600;">Price</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:6px 0;color:#666;font-size:14px;">Subtotal</td>
        <td style="padding:6px 0;color:#333;font-size:14px;text-align:right;">${formatNPR(data.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#666;font-size:14px;">Shipping</td>
        <td style="padding:6px 0;color:#333;font-size:14px;text-align:right;">${data.shippingCharge === 0 ? 'Free' : formatNPR(data.shippingCharge)}</td>
      </tr>
      ${discountRow}
      <tr style="border-top:2px solid #c4a882;">
        <td style="padding:12px 0 0;font-size:18px;font-weight:700;color:#333;">Total</td>
        <td style="padding:12px 0 0;font-size:18px;font-weight:700;color:#333;text-align:right;">${formatNPR(data.totalAmount)}</td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="width:50%;vertical-align:top;padding-right:16px;">
          <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Shipping Address</p>
          <p style="margin:0;font-size:14px;color:#333;line-height:1.5;">${formatAddress(data.shippingAddress)}</p>
        </td>
        <td style="width:50%;vertical-align:top;padding-left:16px;">
          <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Payment Method</p>
          <p style="margin:0;font-size:14px;color:#333;">${formatPaymentMethod(data.paymentMethod)}</p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:16px;background:#faf7f5;border-radius:8px;text-align:center;">
          <a href="${data.orderUrl}" style="display:inline-block;background:linear-gradient(135deg,#c4a882,#a08060);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">View Order Details</a>
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0;color:#999;font-size:13px;line-height:1.5;">
      If you have any questions about your order, please contact us at <a href="mailto:support@glamonepal.com" style="color:#a08060;">support@glamonepal.com</a>.
    </p>
  `

  return renderBaseTemplate(content, { previewText: `Order #${data.orderNumber} confirmed — GLAMO Nepal` })
}