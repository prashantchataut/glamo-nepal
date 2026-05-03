import { renderBaseTemplate } from './base.ts'

export interface LowStockAlertData {
  products: Array<{
    name: string
    sku: string | null
    currentStock: number
    threshold: number
    category?: string
  }>
  adminUrl: string
}

export function renderLowStockAlertEmail(data: LowStockAlertData): string {
  const rows = data.products
    .map(
      (p) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #eee;color:#333;font-size:14px;font-weight:500;">${p.name}</td>
        <td style="padding:12px 0;border-bottom:1px solid #eee;color:#666;font-size:13px;">${p.sku || '—'}</td>
        <td style="padding:12px 0;border-bottom:1px solid #eee;color:#666;font-size:13px;">${p.category || '—'}</td>
        <td style="padding:12px 0;border-bottom:1px solid #eee;color:#e74c3c;font-size:14px;font-weight:600;text-align:center;">${p.currentStock}</td>
        <td style="padding:12px 0;border-bottom:1px solid #eee;color:#999;font-size:13px;text-align:center;">${p.threshold}</td>
      </tr>`
    )
    .join('')

  const content = `
    <h2 style="margin:0 0 8px;color:#333;font-size:22px;">⚠️ Low Stock Alert</h2>
    <p style="margin:0 0 24px;color:#666;font-size:15px;line-height:1.5;">
      The following products are running low on inventory and may need restocking:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <thead>
        <tr>
          <th style="padding:10px 0;border-bottom:2px solid #e74c3c;text-align:left;font-size:13px;color:#999;font-weight:600;">Product</th>
          <th style="padding:10px 0;border-bottom:2px solid #e74c3c;text-align:left;font-size:13px;color:#999;font-weight:600;">SKU</th>
          <th style="padding:10px 0;border-bottom:2px solid #e74c3c;text-align:left;font-size:13px;color:#999;font-weight:600;">Category</th>
          <th style="padding:10px 0;border-bottom:2px solid #e74c3c;text-align:center;font-size:13px;color:#999;font-weight:600;">Stock</th>
          <th style="padding:10px 0;border-bottom:2px solid #e74c3c;text-align:center;font-size:13px;color:#999;font-weight:600;">Threshold</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:16px;background:#faf7f5;border-radius:8px;text-align:center;">
          <a href="${data.adminUrl}" style="display:inline-block;background:linear-gradient(135deg,#c4a882,#a08060);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">Manage Inventory</a>
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0;color:#999;font-size:13px;line-height:1.5;">
      This is an automated alert from GLAMO Nepal. Products are flagged when stock falls below their configured threshold.
    </p>
  `

  return renderBaseTemplate(content, { previewText: `${data.products.length} product(s) low on stock — GLAMO Nepal` })
}