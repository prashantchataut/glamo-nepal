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

  console.log(`[Contact Form] From: ${data.name} <${data.email}>, Subject: ${data.subject}`)

  return ApiResponse.success(c, 'Thank you for contacting us! We will get back to you soon.', {
    name: data.name,
    email: data.email,
    subject: data.subject,
  })
}