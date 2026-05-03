import { renderBaseTemplate } from './base.ts'

export interface OrderStatusUpdateData {
  orderNumber: string
  customerName: string
  newStatus: string
  comment?: string
  trackingInfo?: {
    carrier?: string
    trackingNumber?: string
    trackingUrl?: string
  }
  items: Array<{
    name: string
    variantName?: string
    quantity: number
  }>
  orderUrl: string
}

function formatStatus(status: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Pending', color: '#f39c12' },
    CONFIRMED: { label: 'Confirmed', color: '#3498db' },
    PROCESSING: { label: 'Processing', color: '#9b59b6' },
    SHIPPED: { label: 'Shipped', color: '#2ecc71' },
    DELIVERED: { label: 'Delivered', color: '#27ae60' },
    CANCELLED: { label: 'Cancelled', color: '#e74c3c' },
    REFUNDED: { label: 'Refunded', color: '#95a5a6' },
  }
  return map[status] || { label: status, color: '#c4a882' }
}

export function renderOrderStatusUpdateEmail(data: OrderStatusUpdateData): string {
  const { label, color } = formatStatus(data.newStatus)
  const itemsList = data.items.map((i) => `${i.name}${i.variantName ? ` (${i.variantName})` : ''} × ${i.quantity}`).join(', ')

  const trackingHtml = data.trackingInfo && data.trackingInfo.trackingNumber
    ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="padding:16px;background:#f0f8ff;border-radius:8px;border-left:4px solid #3498db;">
          <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Tracking Information</p>
          ${data.trackingInfo.carrier ? `<p style="margin:0 0 4px;font-size:14px;color:#333;">Carrier: ${data.trackingInfo.carrier}</p>` : ''}
          <p style="margin:0;font-size:14px;color:#333;">Tracking: <strong>${data.trackingInfo.trackingNumber}</strong></p>
          ${data.trackingInfo.trackingUrl ? `<a href="${data.trackingInfo.trackingUrl}" style="color:#3498db;font-size:13px;">Track your package →</a>` : ''}
        </td>
      </tr>
    </table>`
    : ''

  const commentHtml = data.comment
    ? `<p style="margin:16px 0 0;color:#666;font-size:14px;font-style:italic;">"${data.comment}"</p>`
    : ''

  const content = `
    <h2 style="margin:0 0 16px;color:#333;font-size:22px;">Order Update</h2>
    <p style="margin:0 0 8px;color:#666;font-size:15px;">Hi ${data.customerName},</p>
    <p style="margin:0 0 24px;color:#666;font-size:15px;">Your order <strong>#${data.orderNumber}</strong> status has been updated.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="padding:20px;background:#faf7f5;border-radius:8px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Current Status</p>
          <p style="margin:0;font-size:24px;font-weight:700;color:${color};">${label}</p>
        </td>
      </tr>
    </table>

    ${trackingHtml}
    ${commentHtml}

    <p style="margin:0 0 8px;color:#666;font-size:14px;">Items: ${itemsList}</p>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:16px;background:#faf7f5;border-radius:8px;text-align:center;">
          <a href="${data.orderUrl}" style="display:inline-block;background:linear-gradient(135deg,#c4a882,#a08060);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">View Order</a>
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0;color:#999;font-size:13px;line-height:1.5;">
      If you have any questions, please contact us at <a href="mailto:support@glamonepal.com" style="color:#a08060;">support@glamonepal.com</a>.
    </p>
  `

  return renderBaseTemplate(content, { previewText: `Order #${data.orderNumber} — ${label}` })
}