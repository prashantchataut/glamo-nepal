# Phase 5: Admin Dashboard API + Transactional Emails — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the admin dashboard API endpoints and the transactional email system (Resend) for the GLAMO Nepal Supabase Edge Functions backend.

**Architecture:** Supabase Edge Functions (Deno runtime) using Hono framework. Email templates are pure TypeScript functions returning HTML strings, stored in `_shared/email-templates/`. Email triggers are dedicated Edge Functions that fetch data from Supabase, render templates, and call the Resend API. Admin dashboard lives in the existing `api/admin/index.ts` Edge Function with Hono routing. Audit logging uses a shared helper that inserts to the `audit_logs` table.

**Tech Stack:** Supabase Edge Functions (Deno), Hono, TypeScript, Resend API, Zod, @supabase/supabase-js

---

## File Structure

### New Files

| File | Purpose |
|------|---------|
| `supabase/functions/_shared/email-templates/order-confirmation.ts` | Order confirmation email HTML template |
| `supabase/functions/_shared/email-templates/order-status-update.ts` | Order status change notification email template |
| `supabase/functions/_shared/email-templates/order-cancelled.ts` | Order cancelled notification email template |
| `supabase/functions/_shared/email-templates/low-stock-alert.ts` | Low stock alert email to admin template |
| `supabase/functions/_shared/email-templates/welcome.ts` | Welcome email for new users template |
| `supabase/functions/_shared/email-templates/base.ts` | Shared base HTML email layout |
| `supabase/functions/_shared/email.ts` | Resend API helper: sendEmail function |
| `supabase/functions/_shared/audit.ts` | Audit logging helper: createAuditLog |
| `supabase/functions/emails/order-confirmation/index.ts` | Order confirmation email trigger Edge Function |
| `supabase/functions/emails/order-status-update/index.ts` | Order status update email trigger Edge Function |
| `supabase/functions/emails/low-stock-alert/index.ts` | Low stock alert email trigger Edge Function |
| `supabase/functions/api/admin/index.ts` | Admin dashboard API (dashboard stats, recent orders, users, role changes, audit logs) |

### Modified Files

| File | Change |
|------|--------|
| None | All files are new in this phase |

---

## Part A: Email Templates & Helper

### Task 1: Create Base Email Template

**Files:**
- Create: `supabase/functions/_shared/email-templates/base.ts`

- [ ] **Step 1: Create the base HTML email layout**

This shared base template provides the GLAMO Nepal branded email wrapper used by all email templates. It uses inline styles for maximum email client compatibility.

```typescript
// supabase/functions/_shared/email-templates/base.ts

export interface BaseEmailData {
  previewText: string
}

export function renderBaseTemplate(content: string, data: BaseEmailData): string {
  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>GLAMO Nepal</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #f9f5f3; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f9f5f3;font-family:'Helvetica Neue',Arial,sans-serif;">
  <!--[if mso]>
  <table width="600" cellpadding="0" cellspacing="0" align="center"><tr><td>
  <![endif]-->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f5f3;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:600px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#c4a882,#a08060);padding:30px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:2px;">GLAMO NEPAL</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:1px;">Premium Beauty &amp; Skincare</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="background-color:#faf7f5;padding:20px 40px;text-align:center;font-size:12px;color:#999;">
              <p style="margin:0;">&copy; ${year} GLAMO Nepal. All rights reserved.</p>
              <p style="margin:4px 0 0;">Kathmandu, Nepal &middot; <a href="https://glamonepal.com" style="color:#a08060;text-decoration:none;">glamonepal.com</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <!--[if mso]>
  </td></tr></table>
  <![endif]-->
</body>
</html>`
}
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/_shared/email-templates/base.ts
git commit -m "feat: add base email template with GLAMO Nepal branding"
```

---

### Task 2: Create Order Confirmation Email Template

**Files:**
- Create: `supabase/functions/_shared/email-templates/order-confirmation.ts`

- [ ] **Step 1: Create the order confirmation email template**

```typescript
// supabase/functions/_shared/email-templates/order-confirmation.ts

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
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/_shared/email-templates/order-confirmation.ts
git commit -m "feat: add order confirmation email template"
```

---

### Task 3: Create Order Status Update Email Template

**Files:**
- Create: `supabase/functions/_shared/email-templates/order-status-update.ts`

- [ ] **Step 1: Create the order status update email template**

```typescript
// supabase/functions/_shared/email-templates/order-status-update.ts

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
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/_shared/email-templates/order-status-update.ts
git commit -m "feat: add order status update email template"
```

---

### Task 4: Create Order Cancelled Email Template

**Files:**
- Create: `supabase/functions/_shared/email-templates/order-cancelled.ts`

- [ ] **Step 1: Create the order cancelled email template**

```typescript
// supabase/functions/_shared/email-templates/order-cancelled.ts

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
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/_shared/email-templates/order-cancelled.ts
git commit -m "feat: add order cancelled email template"
```

---

### Task 5: Create Low Stock Alert Email Template

**Files:**
- Create: `supabase/functions/_shared/email-templates/low-stock-alert.ts`

- [ ] **Step 1: Create the low stock alert email template**

```typescript
// supabase/functions/_shared/email-templates/low-stock-alert.ts

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
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/_shared/email-templates/low-stock-alert.ts
git commit -m "feat: add low stock alert email template"
```

---

### Task 6: Create Welcome Email Template

**Files:**
- Create: `supabase/functions/_shared/email-templates/welcome.ts`

- [ ] **Step 1: Create the welcome email template**

```typescript
// supabase/functions/_shared/email-templates/welcome.ts

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
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/_shared/email-templates/welcome.ts
git commit -m "feat: add welcome email template"
```

---

### Task 7: Create Email Sending Helper

**Files:**
- Create: `supabase/functions/_shared/email.ts`

- [ ] **Step 1: Create the Resend API email helper**

This shared module provides the `sendEmail` function that all email trigger Edge Functions will use. It calls the Resend API directly via `fetch` (no SDK dependency needed in Deno).

```typescript
// supabase/functions/_shared/email.ts

const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_ADDRESS = 'GLAMO Nepal <noreply@glamonepal.com>'
const REPLY_TO = 'support@glamonepal.com'

export interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

export interface SendEmailResult {
  success: boolean
  id?: string
  error?: string
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) {
    console.error('RESEND_API_KEY environment variable is not set')
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  const recipients = Array.isArray(params.to) ? params.to : [params.to]

  const payload = {
    from: FROM_ADDRESS,
    to: recipients,
    subject: params.subject,
    html: params.html,
    reply_to: params.replyTo || REPLY_TO,
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Resend API error:', response.status, data)
      return { success: false, error: `Resend API error: ${response.status} ${JSON.stringify(data)}` }
    }

    console.log(`Email sent successfully to ${recipients.join(', ')}, id: ${data.id}`)
    return { success: true, id: data.id }
  } catch (error) {
    console.error('Failed to send email via Resend:', error)
    return { success: false, error: String(error) }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/_shared/email.ts
git commit -m "feat: add Resend API email sending helper"
```

---

### Task 8: Create Audit Logging Helper

**Files:**
- Create: `supabase/functions/_shared/audit.ts`

- [ ] **Step 1: Create the audit logging helper**

This mirrors the existing `backend/src/utils/audit.ts` but adapted for Supabase Edge Functions using the service role client.

```typescript
// supabase/functions/_shared/audit.ts

import { createClient } from 'jsr:@supabase/supabase-js@2'

export interface AuditLogParams {
  userId?: string
  action: string
  entity: string
  entityId?: string
  changes?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for audit logging')
    return
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { error } = await supabase.from('audit_logs').insert({
      user_id: params.userId ?? null,
      action: params.action,
      entity: params.entity,
      entity_id: params.entityId ?? null,
      changes: params.changes ?? null,
      ip_address: params.ipAddress ?? null,
      user_agent: params.userAgent ?? null,
    })

    if (error) {
      console.error('Failed to create audit log:', error)
    }
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/_shared/audit.ts
git commit -m "feat: add audit logging helper for Edge Functions"
```

---

## Part B: Email Trigger Edge Functions

### Task 9: Create Order Confirmation Email Edge Function

**Files:**
- Create: `supabase/functions/emails/order-confirmation/index.ts`

- [ ] **Step 1: Create the order confirmation email trigger**

This Edge Function is called after payment verification succeeds. It fetches the order with items and customer data, renders the confirmation email, and sends it via Resend.

```typescript
// supabase/functions/emails/order-confirmation/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { sendEmail } from '../_shared/email.ts'
import { renderOrderConfirmationEmail } from '../_shared/email-templates/order-confirmation.ts'
import type { OrderConfirmationData } from '../_shared/email-templates/order-confirmation.ts'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order_id } = await req.json()

    if (!order_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'order_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://glamonepal.com'

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ success: false, error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch order items
    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order_id)
      .order('created_at', { ascending: true })

    // Fetch customer profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, phone')
      .eq('id', order.user_id)
      .single()

    if (!profile?.email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Customer email not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const customerName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Customer'
    const shippingAddr = (order.shipping_address || {}) as Record<string, unknown>

    const emailData: OrderConfirmationData = {
      orderNumber: order.order_number,
      customerName,
      items: (items || []).map((item: Record<string, unknown>) => ({
        name: item.product_name as string,
        variantName: item.variant_name as string | undefined,
        quantity: item.quantity as number,
        unitPrice: item.unit_price as number,
        totalPrice: item.total_price as number,
        imageUrl: item.image_url as string | undefined,
      })),
      subtotal: order.subtotal,
      shippingCharge: order.shipping_charge,
      discountAmount: order.discount_amount,
      totalAmount: order.total_amount,
      shippingAddress: {
        fullName: (shippingAddr.fullName as string) || customerName,
        phone: (shippingAddr.phone as string) || profile.phone || '',
        address1: (shippingAddr.address1 as string) || (shippingAddr.addressLine1 as string) || '',
        address2: (shippingAddr.address2 as string) || (shippingAddr.addressLine2 as string) || '',
        city: (shippingAddr.city as string) || '',
        district: (shippingAddr.district as string) || '',
        province: (shippingAddr.province as string) || '',
        postalCode: (shippingAddr.postalCode as string) || '',
        country: (shippingAddr.country as string) || 'Nepal',
      },
      paymentMethod: order.payment_method,
      orderDate: new Date(order.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      orderUrl: `${frontendUrl}/account/orders/${order.order_number}`,
    }

    const html = renderOrderConfirmationEmail(emailData)
    const result = await sendEmail({
      to: profile.email,
      subject: `Order Confirmed — #${order.order_number}`,
      html,
    })

    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Order confirmation email error:', error)
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/emails/order-confirmation/index.ts
git commit -m "feat: add order confirmation email Edge Function"
```

---

### Task 10: Create Order Status Update Email Edge Function

**Files:**
- Create: `supabase/functions/emails/order-status-update/index.ts`

- [ ] **Step 1: Create the order status update email trigger**

```typescript
// supabase/functions/emails/order-status-update/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { sendEmail } from '../_shared/email.ts'
import { renderOrderStatusUpdateEmail } from '../_shared/email-templates/order-status-update.ts'
import type { OrderStatusUpdateData } from '../_shared/email-templates/order-status-update.ts'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order_id, new_status, comment, tracking_carrier, tracking_number, tracking_url } = await req.json()

    if (!order_id || !new_status) {
      return new Response(
        JSON.stringify({ success: false, error: 'order_id and new_status are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://glamonepal.com'

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ success: false, error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch order items
    const { data: items } = await supabase
      .from('order_items')
      .select('product_name, variant_name, quantity')
      .eq('order_id', order_id)

    // Fetch customer profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .eq('id', order.user_id)
      .single()

    if (!profile?.email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Customer email not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const customerName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Customer'

    const emailData: OrderStatusUpdateData = {
      orderNumber: order.order_number,
      customerName,
      newStatus: new_status,
      comment: comment || undefined,
      trackingInfo: tracking_number
        ? {
            carrier: tracking_carrier,
            trackingNumber: tracking_number,
            trackingUrl: tracking_url,
          }
        : undefined,
      items: (items || []).map((item: Record<string, unknown>) => ({
        name: item.product_name as string,
        variantName: item.variant_name as string | undefined,
        quantity: item.quantity as number,
      })),
      orderUrl: `${frontendUrl}/account/orders/${order.order_number}`,
    }

    const html = renderOrderStatusUpdateEmail(emailData)
    const result = await sendEmail({
      to: profile.email,
      subject: `Order #${order.order_number} — ${new_status}`,
      html,
    })

    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Order status update email error:', error)
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/emails/order-status-update/index.ts
git commit -m "feat: add order status update email Edge Function"
```

---

### Task 11: Create Low Stock Alert Email Edge Function

**Files:**
- Create: `supabase/functions/emails/low-stock-alert/index.ts`

- [ ] **Step 1: Create the low stock alert email trigger**

```typescript
// supabase/functions/emails/low-stock-alert/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { sendEmail } from '../_shared/email.ts'
import { renderLowStockAlertEmail } from '../_shared/email-templates/low-stock-alert.ts'
import type { LowStockAlertData } from '../_shared/email-templates/low-stock-alert.ts'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const product_id = body.product_id

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://glamonepal.com'
    const adminEmails = (Deno.env.get('ADMIN_EMAILS') || 'admin@glamonepal.com').split(',').map((e: string) => e.trim())

    let lowStockProducts: Array<{
      name: string
      sku: string | null
      currentStock: number
      threshold: number
      category?: string
    }> = []

    if (product_id) {
      // Alert for a specific product
      const { data: product, error } = await supabase
        .from('products')
        .select('id, name, sku, stock_quantity, low_stock_threshold, category_id')
        .eq('id', product_id)
        .is('deleted_at', null)
        .single()

      if (error || !product) {
        return new Response(
          JSON.stringify({ success: false, error: 'Product not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      let category: string | undefined
      if (product.category_id) {
        const { data: cat } = await supabase
          .from('categories')
          .select('name')
          .eq('id', product.category_id)
          .single()
        category = cat?.name
      }

      lowStockProducts = [{
        name: product.name,
        sku: product.sku,
        currentStock: product.stock_quantity,
        threshold: product.low_stock_threshold,
        category,
      }]
    } else {
      // Alert for all low-stock products
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, sku, stock_quantity, low_stock_threshold, category_id')
        .eq('is_active', true)
        .is('deleted_at', null)
        .lte('stock_quantity', 5)
        .order('stock_quantity', { ascending: true })
        .limit(50)

      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to fetch products' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Fetch categories in batch
      const categoryIds = [...new Set((products || []).map((p: Record<string, unknown>) => p.category_id).filter(Boolean))]
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name')
        .in('id', categoryIds)

      const catMap: Record<string, string> = {}
      for (const cat of categories || []) {
        catMap[cat.id] = cat.name
      }

      lowStockProducts = (products || []).map((p: Record<string, unknown>) => ({
        name: p.name as string,
        sku: p.sku as string | null,
        currentStock: p.stock_quantity as number,
        threshold: p.low_stock_threshold as number,
        category: p.category_id ? catMap[p.category_id as string] : undefined,
      }))
    }

    if (lowStockProducts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No low-stock products found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const emailData: LowStockAlertData = {
      products: lowStockProducts,
      adminUrl: `${frontendUrl}/admin/inventory`,
    }

    const html = renderLowStockAlertEmail(emailData)
    const result = await sendEmail({
      to: adminEmails,
      subject: `Low Stock Alert — ${lowStockProducts.length} product(s) need restocking`,
      html,
    })

    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Low stock alert email error:', error)
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/emails/low-stock-alert/index.ts
git commit -m "feat: add low stock alert email Edge Function"
```

---

## Part C: Admin Dashboard API

### Task 12: Create Admin Dashboard Edge Function

**Files:**
- Create: `supabase/functions/api/admin/index.ts`

This is the full admin API with dashboard stats, recent orders, user management, and audit logs. It uses Hono routing within a single Edge Function, following the pattern from the existing `backend/` codebase.

- [ ] **Step 1: Create the admin dashboard Edge Function**

```typescript
// supabase/functions/api/admin/index.ts

import { Hono } from 'https://deno.land/x/hono@v4.1.5/mod.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../../_shared/cors.ts'
import { createAuditLog } from '../../_shared/audit.ts'

const app = new Hono()

// Helper to create service role Supabase client
function getServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
}

// Helper to create user-scoped Supabase client from JWT
function getUserClient(token: string) {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
}

// Helper: extract user from JWT, verify admin role
async function requireAdmin(req: Request): Promise<{ id: string; email: string; role: string } | Response> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing authorization header' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = getUserClient(token)

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['ADMIN', 'SUPER_ADMIN'].includes(profile.role)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Insufficient permissions' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return profile
}

// Helper: require SUPER_ADMIN role
async function requireSuperAdmin(req: Request): Promise<{ id: string; email: string; role: string } | Response> {
  const result = await requireAdmin(req)
  if (result instanceof Response) return result

  if (result.role !== 'SUPER_ADMIN') {
    return new Response(
      JSON.stringify({ success: false, error: 'SUPER_ADMIN access required' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return result
}

// Helper: success response
function success(data: unknown, message = 'Success', status = 200) {
  return new Response(
    JSON.stringify({ success: true, message, data }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Helper: error response
function error(message: string, status = 500) {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Helper: paginated response
function paginated(data: unknown[], total: number, page: number, limit: number, message = 'Success') {
  return new Response(
    JSON.stringify({
      success: true,
      message,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// ==========================================
// GET /admin/dashboard/stats
// ==========================================
app.get('/dashboard/stats', async (c) => {
  const admin = await requireAdmin(c.req.raw)
  if (admin instanceof Response) return admin

  const supabase = getServiceClient()
  const today = new Date().toISOString().split('T')[0]
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [
    todayOrders,
    monthOrders,
    allTimeOrders,
    orderStatusBreakdown,
    revenueLast30,
    customerCount,
    activeProductCount,
    lowStockProducts,
    outOfStockProducts,
    recentOrders,
    topProducts,
  ] = await Promise.all([
    supabase.from('orders').select('total_amount, payment_status', { count: 'exact' }).gte('created_at', today),
    supabase.from('orders').select('total_amount, payment_status', { count: 'exact' }).gte('created_at', monthStart),
    supabase.from('orders').select('total_amount, payment_status', { count: 'exact' }),
    supabase.from('orders').select('status'),
    supabase.from('orders').select('created_at, total_amount, payment_status').gte('created_at', thirtyDaysAgo).eq('payment_status', 'PAID'),
    supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'CUSTOMER').eq('is_active', true),
    supabase.from('products').select('id', { count: 'exact' }).eq('is_active', true).is('deleted_at', null),
    supabase.from('products').select('id, name, sku, stock_quantity, low_stock_threshold').eq('is_active', true).is('deleted_at', null).lte('stock_quantity', 5),
    supabase.from('products').select('id, name, sku, stock_quantity').eq('is_active', true).is('deleted_at', null).eq('stock_quantity', 0),
    supabase.from('orders').select('id, order_number, total_amount, status, payment_status, created_at, user_id').order('created_at', { ascending: false }).limit(20),
    supabase.from('order_items').select('product_id, product_name, quantity').order('quantity', { ascending: false }).limit(10),
  ])

  const todayRevenue = todayOrders.data?.filter((o: Record<string, unknown>) => o.payment_status === 'PAID').reduce((sum: number, o: Record<string, unknown>) => sum + (o.total_amount as number || 0), 0) ?? 0
  const monthRevenue = monthOrders.data?.filter((o: Record<string, unknown>) => o.payment_status === 'PAID').reduce((sum: number, o: Record<string, unknown>) => sum + (o.total_amount as number || 0), 0) ?? 0
  const allTimeRevenue = allTimeOrders.data?.filter((o: Record<string, unknown>) => o.payment_status === 'PAID').reduce((sum: number, o: Record<string, unknown>) => sum + (o.total_amount as number || 0), 0) ?? 0

  const statusCounts: Record<string, number> = {}
  for (const o of orderStatusBreakdown.data || []) {
    statusCounts[o.status as string] = (statusCounts[o.status as string] || 0) + 1
  }

  const revenueByDay: Record<string, { revenue: number; orders: number }> = {}
  for (const o of revenueLast30.data || []) {
    const date = (o.created_at as string)?.split('T')[0]
    if (date) {
      if (!revenueByDay[date]) revenueByDay[date] = { revenue: 0, orders: 0 }
      revenueByDay[date].revenue += (o.total_amount as number || 0)
      revenueByDay[date].orders += 1
    }
  }

  const avgOrderValue = allTimeOrders.count && allTimeOrders.count > 0 ? Math.round(allTimeRevenue / allTimeOrders.count) : 0

  const productQtyMap: Record<string, { name: string; totalSold: number }> = {}
  for (const item of topProducts.data || []) {
    const pid = item.product_id as string
    if (!productQtyMap[pid]) {
      productQtyMap[pid] = { name: item.product_name as string, totalSold: 0 }
    }
    productQtyMap[pid].totalSold += item.quantity as number
  }
  const topProductsList = Object.entries(productQtyMap)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 10)

  return success({
    today: {
      orders: todayOrders.count ?? 0,
      revenue: todayRevenue,
    },
    thisMonth: {
      orders: monthOrders.count ?? 0,
      revenue: monthRevenue,
    },
    allTime: {
      orders: allTimeOrders.count ?? 0,
      revenue: allTimeRevenue,
      customers: customerCount.count ?? 0,
      activeProducts: activeProductCount.count ?? 0,
      avgOrderValue,
    },
    orderStatusBreakdown: statusCounts,
    revenueLast30Days: revenueByDay,
    inventoryAlerts: {
      lowStock: lowStockProducts.data?.length ?? 0,
      outOfStock: outOfStockProducts.data?.length ?? 0,
      lowStockProducts: lowStockProducts.data?.slice(0, 10) || [],
      outOfStockProducts: outOfStockProducts.data?.slice(0, 10) || [],
    },
    topProducts: topProductsList,
  })
})

// ==========================================
// GET /admin/dashboard/recent-orders
// ==========================================
app.get('/dashboard/recent-orders', async (c) => {
  const admin = await requireAdmin(c.req.raw)
  if (admin instanceof Response) return admin

  const supabase = getServiceClient()

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_number, total_amount, status, payment_status, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return error('Failed to fetch recent orders', 500)

  const ordersWithUser = await Promise.all(
    (orders || []).map(async (order: Record<string, unknown>) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', order.user_id as string)
        .single()

      return {
        ...order,
        customerName: profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Unknown' : 'Unknown',
        customerEmail: profile?.email || null,
      }
    })
  )

  return success(ordersWithUser)
})

// ==========================================
// GET /admin/users
// ==========================================
app.get('/users', async (c) => {
  const admin = await requireAdmin(c.req.raw)
  if (admin instanceof Response) return admin

  const supabase = getServiceClient()
  const url = new URL(c.req.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20')))
  const search = url.searchParams.get('search') || ''
  const role = url.searchParams.get('role') || ''

  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('profiles')
    .select('id, first_name, last_name, email, phone, role, is_active, created_at, updated_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
  }
  if (role) {
    query = query.eq('role', role)
  }

  const { data, error: queryError, count } = await query
  if (queryError) return error('Failed to fetch users', 500)

  const usersWithOrders = await Promise.all(
    (data || []).map(async (user: Record<string, unknown>) => {
      const { count: orderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id as string)
      return { ...user, orderCount: orderCount ?? 0 }
    })
  )

  return paginated(usersWithOrders, count ?? 0, page, limit)
})

// ==========================================
// PUT /admin/users/:id/role
// ==========================================
app.put('/users/:id/role', async (c) => {
  const admin = await requireSuperAdmin(c.req.raw)
  if (admin instanceof Response) return admin

  const userId = c.req.param('id')
  const body = await c.req.json()
  const { role } = body

  if (!role || !['CUSTOMER', 'STAFF', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
    return error('Invalid role. Must be CUSTOMER, STAFF, ADMIN, or SUPER_ADMIN', 400)
  }

  const supabase = getServiceClient()

  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .single()

  if (fetchError || !profile) return error('User not found', 404)

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (updateError) return error('Failed to update user role', 500)

  await createAuditLog({
    userId: admin.id,
    action: 'UPDATE_ROLE',
    entity: 'profiles',
    entityId: userId,
    changes: { previousRole: profile.role, newRole: role },
    ipAddress: c.req.raw.headers.get('x-forwarded-for') || undefined,
    userAgent: c.req.raw.headers.get('user-agent') || undefined,
  })

  return success(null, 'User role updated successfully')
})

// ==========================================
// PUT /admin/users/:id/status
// ==========================================
app.put('/users/:id/status', async (c) => {
  const admin = await requireAdmin(c.req.raw)
  if (admin instanceof Response) return admin

  const userId = c.req.param('id')
  const body = await c.req.json()
  const { is_active } = body

  if (typeof is_active !== 'boolean') {
    return error('is_active must be a boolean', 400)
  }

  const supabase = getServiceClient()

  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('id, is_active')
    .eq('id', userId)
    .single()

  if (fetchError || !profile) return error('User not found', 404)

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ is_active })
    .eq('id', userId)

  if (updateError) return error('Failed to update user status', 500)

  if (!is_active) {
    try {
      await supabase.auth.admin.signOut(userId)
    } catch (e) {
      console.error('Failed to sign out user sessions:', e)
    }
  }

  await createAuditLog({
    userId: admin.id,
    action: is_active ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
    entity: 'profiles',
    entityId: userId,
    changes: { previousStatus: profile.is_active, newStatus: is_active },
    ipAddress: c.req.raw.headers.get('x-forwarded-for') || undefined,
    userAgent: c.req.raw.headers.get('user-agent') || undefined,
  })

  return success(null, `User ${is_active ? 'activated' : 'deactivated'} successfully`)
})

// ==========================================
// GET /admin/audit-logs
// ==========================================
app.get('/audit-logs', async (c) => {
  const admin = await requireSuperAdmin(c.req.raw)
  if (admin instanceof Response) return admin

  const supabase = getServiceClient()
  const url = new URL(c.req.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50')))
  const entity = url.searchParams.get('entity') || ''
  const entityId = url.searchParams.get('entity_id') || ''
  const userId = url.searchParams.get('user_id') || ''

  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (entity) query = query.eq('entity', entity)
  if (entityId) query = query.eq('entity_id', entityId)
  if (userId) query = query.eq('user_id', userId)

  const { data, error: queryError, count } = await query
  if (queryError) return error('Failed to fetch audit logs', 500)

  return paginated(data || [], count ?? 0, page, limit)
})

// ==========================================
// CORS preflight
// ==========================================
app.options('/*', (c) => {
  return new Response('ok', { headers: corsHeaders })
})

// ==========================================
// Serve
// ==========================================
Deno.serve(app.fetch)
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/api/admin/index.ts
git commit -m "feat: add admin dashboard API with stats, users, audit logs"
```

---

## Part D: Audit Logging Middleware

### Task 13: Create Audit Logging Documentation & Integration Guide

The `createAuditLog` helper was created in Task 8. This task documents how it should be integrated into all admin write operations.

**Files:**
- None (documentation only in this plan)

- [ ] **Step 1: Document audit log integration pattern**

The `createAuditLog` function in `supabase/functions/_shared/audit.ts` should be called after every admin write operation. The pattern is:

1. Perform the mutation (update, insert, delete)
2. Call `createAuditLog` with the admin's user ID, action name, entity, entity ID, and before/after changes
3. Never await `createAuditLog` with error handling that could fail the main operation — it logs errors internally

**Audit log actions used across the system:**

| Action | Entity | When |
|--------|--------|------|
| `UPDATE_ROLE` | `profiles` | Admin changes user role |
| `ACTIVATE_USER` | `profiles` | Admin activates user |
| `DEACTIVATE_USER` | `profiles` | Admin deactivates user |
| `UPDATE_STATUS` | `orders` | Admin updates order status |
| `CANCEL` | `orders` | Order is cancelled |
| `CREATE_PRODUCT` | `products` | Admin creates product |
| `UPDATE_PRODUCT` | `products` | Admin updates product |
| `DELETE_PRODUCT` | `products` | Admin soft-deletes product |
| `UPDATE_INVENTORY` | `products` | Stock adjustment |
| `CREATE_COUPON` | `coupons` | Admin creates coupon |
| `UPDATE_COUPON` | `coupons` | Admin updates coupon |
| `DELETE_COUPON` | `coupons` | Admin deletes coupon |

**The `createAuditLog` function signature:**

```typescript
interface AuditLogParams {
  userId?: string
  action: string
  entity: string
  entityId?: string
  changes?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}
```

**Integration in admin Edge Function example:**

```typescript
await createAuditLog({
  userId: admin.id,
  action: 'UPDATE_ROLE',
  entity: 'profiles',
  entityId: userId,
  changes: { previousRole: profile.role, newRole: role },
  ipAddress: req.headers.get('x-forwarded-for') || undefined,
  userAgent: req.headers.get('user-agent') || undefined,
})
```

- [ ] **Step 2: Verify audit_logs table exists**

The `audit_logs` table was created in Phase 1 migration (`0004_foundation.sql`). Verify it has the correct schema:

```sql
-- Verify in Supabase SQL editor:
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
ORDER BY ordinal_position;
```

Expected columns: `id`, `user_id`, `action`, `entity`, `entity_id`, `changes`, `ip_address`, `user_agent`, `created_at`

- [ ] **Step 3: Commit**

No file changes for this documentation step. The `createAuditLog` helper was already committed in Task 8.

---

## Verification

### Task 14: Verify All Files Compile and Structure Is Correct

- [ ] **Step 1: Verify file structure**

Run:
```bash
find supabase/functions -name "*.ts" | sort
```

Expected output:
```
supabase/functions/_shared/audit.ts
supabase/functions/_shared/cors.ts
supabase/functions/_shared/email.ts
supabase/functions/_shared/email-templates/base.ts
supabase/functions/_shared/email-templates/order-confirmation.ts
supabase/functions/_shared/email-templates/order-cancelled.ts
supabase/functions/_shared/email-templates/order-status-update.ts
supabase/functions/_shared/email-templates/low-stock-alert.ts
supabase/functions/_shared/email-templates/welcome.ts
supabase/functions/api/admin/index.ts
supabase/functions/emails/order-confirmation/index.ts
supabase/functions/emails/order-status-update/index.ts
supabase/functions/emails/low-stock-alert/index.ts
```

Note: `_shared/cors.ts`, `_shared/response.ts`, `_shared/validation.ts`, `_shared/types.ts`, `_shared/auth.ts` are from Phase 2 and should already exist.

- [ ] **Step 2: Verify TypeScript compilation**

If a `tsconfig.json` exists in the `supabase/` directory:
```bash
cd supabase && npx tsc --noEmit
```

If not, manually verify that all imports resolve correctly:
- `../_shared/cors.ts` imports from email Edge Functions
- `../../_shared/cors.ts` imports from admin Edge Function
- `../_shared/email.ts` imports from email Edge Functions
- `../../_shared/email.ts` imports from admin Edge Function (if needed)
- `../../_shared/audit.ts` imports from admin Edge Function
- All template imports from `../_shared/email-templates/*.ts` or `../../_shared/email-templates/*.ts`

- [ ] **Step 3: Verify Resend API key is configured**

Check that `RESEND_API_KEY` is set in the Supabase project's Edge Function secrets:
```bash
supabase secrets list
```

Should show `RESEND_API_KEY`. If not:
```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxx
```

- [ ] **Step 4: Verify email sending works (manual test)**

Deploy the `emails/order-confirmation` function and test with:
```bash
curl -i --request POST \
  --url https://<project-ref>.supabase.co/functions/v1/order-confirmation \
  --header 'Authorization: Bearer <anon_key>' \
  --header 'Content-Type: application/json' \
  --data '{"order_id": "<test_order_id>"}'
```

Expected: 200 response with `{"success": true, "id": "..."}` and email received.

- [ ] **Step 5: Verify admin dashboard endpoints work (manual test)**

Test each endpoint with a valid admin JWT:
```bash
# Dashboard stats
curl -H "Authorization: Bearer <admin_jwt>" \
  https://<project-ref>.supabase.co/functions/v1/admin/dashboard/stats

# Recent orders
curl -H "Authorization: Bearer <admin_jwt>" \
  https://<project-ref>.supabase.co/functions/v1/admin/dashboard/recent-orders

# Users list
curl -H "Authorization: Bearer <admin_jwt>" \
  https://<project-ref>.supabase.co/functions/v1/admin/users?page=1&limit=10

# Audit logs
curl -H "Authorization: Bearer <admin_jwt>" \
  https://<project-ref>.supabase.co/functions/v1/admin/audit-logs?page=1&limit=20
```

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete Phase 5 — admin dashboard API and transactional email system"
```

---

## Summary

This plan creates **13 new files** across 4 parts:

| Part | Files | Purpose |
|------|-------|---------|
| A: Email Templates | 6 files (base + 5 templates) | HTML email templates with GLAMO Nepal branding |
| B: Email Helpers | 2 files (email.ts + audit.ts) | Resend API sender and audit logging helper |
| C: Email Triggers | 3 Edge Functions | Order confirmation, status update, low stock alert |
| D: Admin API | 1 Edge Function (5 routes) | Dashboard stats, recent orders, users, role changes, audit logs |

**API Endpoints:**

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/emails/order-confirmation` | Service | Send order confirmation email |
| POST | `/emails/order-status-update` | Service | Send order status update email |
| POST | `/emails/low-stock-alert` | Service | Send low stock alert to admin |
| GET | `/admin/dashboard/stats` | ADMIN+ | Dashboard statistics |
| GET | `/admin/dashboard/recent-orders` | ADMIN+ | Last 20 orders with user info |
| GET | `/admin/users` | ADMIN+ | Paginated user list |
| PUT | `/admin/users/:id/role` | SUPER_ADMIN | Change user role |
| PUT | `/admin/users/:id/status` | ADMIN+ | Activate/deactivate user |
| GET | `/admin/audit-logs` | SUPER_ADMIN | Paginated audit logs |