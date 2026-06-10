import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { ApiResponse } from '../../utils/response'

export async function submitContactForm(c: Context<AppEnv>) {
  const data = c.get('validatedBody') as {
    name: string
    email: string
    phone?: string
    subject: string
    message: string
  }

  const db = c.get('db')

  try {
    await db.execute({
      sql: `INSERT INTO contact_submissions (id, name, email, phone, subject, message, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'new', datetime('now'), datetime('now'))`,
      args: [crypto.randomUUID(), data.name, data.email.toLowerCase(), data.phone || null, data.subject, data.message],
    })
  } catch (error) {
    console.error('[Contact Form] Failed to persist submission:', error)
  }

  try {
    const env = c.env
    if (env?.RESEND_API_KEY) {
      const { default: sendEmailDirect } = await import('../../utils/email')
      const contactEmail = (env as any).CONTACT_EMAIL || (env as any).FROM_EMAIL || 'admin@glamonepal.com'
      await sendEmailDirect(
        contactEmail,
        `[Contact Form] ${data.subject}`,
        `<p><strong>Name:</strong> ${data.name}</p><p><strong>Email:</strong> ${data.email}</p>${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}<p><strong>Message:</strong></p><p>${data.message}</p>`,
        env,
      )
    }
  } catch (error) {
    console.error('[Contact Form] Failed to send notification email:', error)
  }

  return ApiResponse.success(c, 'Thank you for contacting us! We will get back to you soon.', {
    name: data.name,
    subject: data.subject,
  })
}