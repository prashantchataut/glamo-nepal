import { z } from 'zod'

export const subscribeSchema = z.object({
  email: z.string().email(),
})

export const subscriberFilterSchema = z.object({
  isActive: z.string().optional().transform(v => v === 'true' ? true : v === 'false' ? false : undefined),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const idParamSchema = z.object({
  id: z.string().uuid(),
})

export type SubscribeInput = z.infer<typeof subscribeSchema>
export type SubscriberFilterInput = z.infer<typeof subscriberFilterSchema>