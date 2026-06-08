import { z } from 'zod'

export const contactFormSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  phone: z.string().max(30).optional(),
  subject: z.string().min(1).max(300),
  message: z.string().min(1).max(5000),
})

export type ContactFormInput = z.infer<typeof contactFormSchema>