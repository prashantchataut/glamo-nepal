import { z } from 'zod'

export const updateSettingsSchema = z.object({
  siteName: z.string().max(255).optional(),
  siteDescription: z.string().max(1000).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  socialLinks: z.record(z.string(), z.string()).optional(),
  currency: z.string().max(10).optional(),
  shippingFee: z.number().nonnegative().optional(),
  freeShippingThreshold: z.number().nonnegative().optional(),
  taxRate: z.number().nonnegative().optional(),
})

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>