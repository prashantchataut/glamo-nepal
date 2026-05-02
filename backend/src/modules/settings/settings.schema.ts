import { z } from 'zod'

export const updateSettingsSchema = z.object({
  settings: z.array(z.object({
    key: z.string(),
    value: z.any(),
  })),
})

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>