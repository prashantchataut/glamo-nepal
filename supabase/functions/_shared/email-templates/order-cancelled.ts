import { renderBaseTemplate } from './base.ts'

export interface OrderCancelledData {
  orderNumber: string
  customerName: string
  cancellationReason: string
  refundAmount?: number
  refundMethod?: string
  refundTimeline?: string
  items: Array<{
    name: string
    variantName?: string
    quantity: number
    totalPrice: number
  }>
  orderUrl: string
}

function formatNPR(amount: number): string {
  return `NPR ${amount.toLocaleString()}`
}

export function renderOrderCancelledEmail(data: OrderCancelledData): string {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;color:#333;font-size:14px;">
          ${item.name}${item.variantName ? ` (${item.variantName})` : ''}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;color:#333;font-size:14px;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;color:#333;font-size:14px;text-align:right;">${formatNPR(item.totalPrice)}</td>
      </tr>`
    )
    .join('')

  const refundHtml = data.refundAmount !== undefined
    ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="padding:16px;background:#f0faf0;border-radius:8px;border-left:4px solid #27ae60;">
          <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Refund Information</p>
          <p style="margin:0 0 4px;font-size:16px;font-weight:600;color:#27ae60;">${formatNPR(data.refundAmount)}</p>
          ${data.refundMethod ? `<p style="margin:0;font-size:13px;color:#666;">Refund to: ${data.refundMethod}</p>` : ''}
          ${data.refundTimeline ? `<p style="margin:4px 0 0;font-size:13px;color:#666;">Expected within: ${data.refundTimeline}</p>` : ''}
        </td>
      </tr>
    </table>`
    : ''

  const content = `
    <h2 style="margin:0 0 16px;color:#333;font-size:22px;">Order Cancelled</h2>
    <p style="margin:0 0 8px;color:#666;font-size:15px;">Hi ${data.customerName},</p>
    <p style="margin:0 0 24px;color:#666;font-size:15px;">Your order <strong>#${data.orderNumber}</strong> has been cancelled.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
      <tr>
        <td style="padding:12px;background:#fff5f5;border-radius:8px;border-left:4px solid #e74c3c;">
          <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Reason</p>
          <p style="margin:0;font-size:14px;color:#333;">${data.cancellationReason}</p>
        </td>
      </tr>
    </table>

    ${refundHtml}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <thead>
        <tr>
          <th style="padding:10px 0;border-bottom:2px solid #e74c3c;text-align:left;font-size:13px;color:#999;font-weight:600;">Item</th>
          <th style="padding:10px 0;border-bottom:2px solid #e74c3c;text-align:center;font-size:13px;color:#999;font-weight:600;">Qty</th>
          <th style="padding:10px 0;border-bottom:2px solid #e74c3c;text-align:right;font-size:13px;color:#999;font-weight:600;">Price</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <p style="margin:0 0 24px;color:#666;font-size:14px;line-height:1.5;">
      If you believe this cancellation was made in error or have any questions, please contact us at <a href="mailto:support@glamonepal.com" style="color:#a08060;">support@glamonepal.com</a>.
    </p>
  `

  return renderBaseTemplate(content, { previewText: `Order #${data.orderNumber} has been cancelled` })
}