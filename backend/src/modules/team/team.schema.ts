import { z } from 'zod'

export const createTeamMemberSchema = z.object({
  name: z.string().min(1).max(255),
  role: z.string().min(1).max(255),
  bio: z.string().max(1000).optional(),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
  socialLinks: z.record(z.string(), z.string()).optional(),
})

export const updateTeamMemberSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  role: z.string().min(1).max(255).optional(),
  bio: z.string().max(1000).optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
  socialLinks: z.record(z.string(), z.string()).optional(),
})

export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>