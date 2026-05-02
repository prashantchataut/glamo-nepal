import { z } from 'zod'

export const updateUserRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']),
})

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
})

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>