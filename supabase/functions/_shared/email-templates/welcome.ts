import { renderBaseTemplate } from './base.ts'

export interface WelcomeEmailData {
  customerName: string
  shopUrl: string
}

export function renderWelcomeEmail(data: WelcomeEmailData): string {
  const content = `
    <h2 style="margin:0 0 16px;color:#333;font-size:22px;">Welcome to GLAMO Nepal, ${data.customerName}!</h2>
    <p style="margin:0 0 24px;color:#666;font-size:15px;line-height:1.6;">
      We're thrilled to have you join our community. Discover premium beauty products curated just for you — from skincare essentials to luxurious hair care, we have everything you need to glow.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="width:50%;vertical-align:top;padding-right:12px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:16px;background:#faf7f5;border-radius:8px;text-align:center;">
                <p style="margin:0 0 4px;font-size:20px;">✨</p>
                <p style="margin:0;font-size:14px;font-weight:600;color:#333;">Premium Skincare</p>
                <p style="margin:4px 0 0;font-size:12px;color:#666;">Curated from top brands</p>
              </td>
            </tr>
          </table>
        </td>
        <td style="width:50%;vertical-align:top;padding-left:12px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:16px;background:#faf7f5;border-radius:8px;text-align:center;">
                <p style="margin:0 0 4px;font-size:20px;">🚚</p>
                <p style="margin:0;font-size:14px;font-weight:600;color:#333;">Free Delivery</p>
                <p style="margin:4px 0 0;font-size:12px;color:#666;">On orders over NPR 2,500</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:16px;background:linear-gradient(135deg,#fff9f5,#faf7f5);border-radius:8px;text-align:center;">
          <a href="${data.shopUrl}" style="display:inline-block;background:linear-gradient(135deg,#c4a882,#a08060);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">Start Shopping</a>
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0;color:#999;font-size:13px;line-height:1.5;">
      Follow us on social media for beauty tips, new arrivals, and exclusive offers!
    </p>
  `

  return renderBaseTemplate(content, { previewText: `Welcome to GLAMO Nepal, ${data.customerName}!` })
}