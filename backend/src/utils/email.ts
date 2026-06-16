import type { CloudflareBindings } from '../types/bindings'

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  env: CloudflareBindings
): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'GLAMO Nepal <noreply@glamonepal.com>',
      to: [to],
      subject,
      html,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    console.error(`Resend API error: ${response.status} ${response.statusText}`, body)
    throw new Error(`Failed to send email: ${response.status} ${response.statusText}`)
  }
}

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GLAMO Nepal</title>
</head>
<body style="margin:0;padding:0;background-color:#f9f5f3;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f5f3;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#c4a882,#a08060);padding:30px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:2px;">GLAMO NEPAL</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="background-color:#faf7f5;padding:20px 40px;text-align:center;font-size:12px;color:#999;">
              <p style="margin:0;">&copy; ${new Date().getFullYear()} GLAMO Nepal. All rights reserved.</p>
              <p style="margin:4px 0 0;">Kathmandu, Nepal</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function verifyEmail(name: string, url: string): string {
  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#333;font-size:22px;">Welcome, ${name}!</h2>
    <p style="margin:0 0 24px;color:#666;font-size:15px;line-height:1.6;">
      Thank you for joining GLAMO Nepal. Please verify your email address to get started.
    </p>
    <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#c4a882,#a08060);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
      Verify Email Address
    </a>
    <p style="margin:24px 0 0;color:#999;font-size:13px;">
      If you didn't create an account, you can safely ignore this email.
    </p>
  `)
}

export function passwordReset(name: string, url: string): string {
  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#333;font-size:22px;">Hi ${name},</h2>
    <p style="margin:0 0 24px;color:#666;font-size:15px;line-height:1.6;">
      We received a request to reset your password. Click the button below to choose a new one.
    </p>
    <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#c4a882,#a08060);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
      Reset Password
    </a>
    <p style="margin:24px 0 0;color:#999;font-size:13px;">
      If you didn't request this, your account is safe — you can ignore this email.
    </p>
  `)
}

export function orderConfirmation(order: {
  orderNumber: string
  items: { name: string; quantity: number; price: number }[]
  total: number
  shippingAddress: string
}): string {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;color:#333;font-size:14px;">${item.name}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;color:#333;font-size:14px;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;color:#333;font-size:14px;text-align:right;">NPR ${item.price.toLocaleString()}</td>
      </tr>`
    )
    .join('')

  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#333;font-size:22px;">Order Confirmed!</h2>
    <p style="margin:0 0 8px;color:#666;font-size:15px;">Order <strong>#${order.orderNumber}</strong> has been placed successfully.</p>
    <p style="margin:0 0 24px;color:#666;font-size:13px;">Shipping to: ${order.shippingAddress}</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <thead>
        <tr>
          <th style="padding:10px 0;border-bottom:2px solid #c4a882;text-align:left;font-size:13px;color:#999;font-weight:600;">Item</th>
          <th style="padding:10px 0;border-bottom:2px solid #c4a882;text-align:center;font-size:13px;color:#999;font-weight:600;">Qty</th>
          <th style="padding:10px 0;border-bottom:2px solid #c4a882;text-align:right;font-size:13px;color:#999;font-weight:600;">Price</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <p style="margin:0;font-size:18px;font-weight:700;color:#333;text-align:right;">Total: NPR ${order.total.toLocaleString()}</p>
  `)
}

export function orderStatusUpdate(
  order: { orderNumber: string; items: { name: string }[] },
  status: string
): string {
  const itemsList = order.items.map((i) => i.name).join(', ')
  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#333;font-size:22px;">Order Update</h2>
    <p style="margin:0 0 8px;color:#666;font-size:15px;">Your order <strong>#${order.orderNumber}</strong> status has been updated.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr>
        <td style="padding:16px;background:#faf7f5;border-radius:8px;text-align:center;">
          <p style="margin:0 0 4px;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:1px;">Current Status</p>
          <p style="margin:0;font-size:20px;font-weight:700;color:#c4a882;">${status}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#666;font-size:14px;">Items: ${itemsList}</p>
  `)
}

export function welcome(name: string): string {
  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#333;font-size:22px;">Welcome to GLAMO Nepal, ${name}!</h2>
    <p style="margin:0 0 24px;color:#666;font-size:15px;line-height:1.6;">
      We're thrilled to have you join our community. Discover premium beauty products curated just for you.
    </p>
    <a href="https://glamonepal.com" style="display:inline-block;background:linear-gradient(135deg,#c4a882,#a08060);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
      Start Shopping
    </a>
  `)
}

export function lowStockAlert(
  products: { name: string; sku: string; stock: number }[]
): string {
  const rows = products
    .map(
      (p) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;color:#333;font-size:14px;">${p.name}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;color:#666;font-size:14px;">${p.sku}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;color:#e74c3c;font-size:14px;font-weight:600;text-align:center;">${p.stock}</td>
      </tr>`
    )
    .join('')

  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#333;font-size:22px;">Low Stock Alert</h2>
    <p style="margin:0 0 24px;color:#666;font-size:15px;">The following products are running low on inventory:</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <thead>
        <tr>
          <th style="padding:10px 0;border-bottom:2px solid #e74c3c;text-align:left;font-size:13px;color:#999;font-weight:600;">Product</th>
          <th style="padding:10px 0;border-bottom:2px solid #e74c3c;text-align:left;font-size:13px;color:#999;font-weight:600;">SKU</th>
          <th style="padding:10px 0;border-bottom:2px solid #e74c3c;text-align:center;font-size:13px;color:#999;font-weight:600;">Stock</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `)
}

export async function sendPasswordReset(email: string, token: string, env: CloudflareBindings): Promise<void> {
  const resetUrl = `${env.FRONTEND_URL || 'https://glamonepal.com'}/reset-password?token=${token}`
  const html = baseTemplate(`
    <h2 style="margin:0 0 16px;color:#333;font-size:22px;">Reset Your Password</h2>
    <p style="margin:0 0 24px;color:#666;font-size:15px;">We received a request to reset your GLAMO Nepal account password. Click the button below to set a new password:</p>
    <a href="${resetUrl}" style="display:inline-block;background-color:#c8553d;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;margin:0 0 24px;">Reset Password</a>
    <p style="margin:0 0 12px;color:#999;font-size:13px;">This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
    <p style="margin:0;color:#999;font-size:13px;">If the button above does not work, copy and paste this URL into your browser:</p>
    <p style="margin:4px 0 0;word-break:break-all;color:#c8553d;font-size:13px;">${resetUrl}</p>
  `)
  await sendEmail(email, 'Reset Your GLAMO Nepal Password', html, env)
}

export async function sendVerificationEmail(email: string, name: string, token: string, env: CloudflareBindings): Promise<void> {
  const verifyUrl = `${env.FRONTEND_URL || 'https://glamonepal.com'}/verify-email?token=${token}`
  const html = verifyEmail(name || 'there', verifyUrl)
  await sendEmail(email, 'Verify Your GLAMO Nepal Email', html, env)
}

export { sendEmail }