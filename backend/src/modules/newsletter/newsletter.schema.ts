import { z } from 'zod'

export const subscribeSchema = z.object({
  email: z.string().email(),
  name: z.string().max(255).optional(),
})

export type SubscribeInput = z.infer<typeof subscribeSchema>