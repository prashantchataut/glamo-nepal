import { z } from 'zod'

function stripHtml(v: string): string {
  return v.replace(/<[^>]*>/g, '')
}

export const contactFormSchema = z.object({
  name: z.string().min(1).max(200).transform(v => stripHtml(v)),
  email: z.string().email().max(200),
  phone: z.string().max(30).optional().transform(v => v ? stripHtml(v) : v),
  subject: z.string().min(1).max(300).transform(v => stripHtml(v)),
  message: z.string().min(1).max(5000).transform(v => stripHtml(v)),
})

export type ContactFormInput = z.infer<typeof contactFormSchema>