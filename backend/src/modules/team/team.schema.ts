import { z } from 'zod'

export const createTeamMemberSchema = z.object({
  name: z.string().min(1).max(200),
  role: z.string().min(1).max(200),
  bio: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().default(0),
})

export const updateTeamMemberSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  role: z.string().min(1).max(200).optional(),
  bio: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().optional(),
})

export const idParamSchema = z.object({
  id: z.string().uuid(),
})

export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>