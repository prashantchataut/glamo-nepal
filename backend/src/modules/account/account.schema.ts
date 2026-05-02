import { z } from 'zod'

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
})

export const createAddressSchema = z.object({
  label: z.string().min(1).max(50),
  fullName: z.string().min(1).max(200),
  phone: z.string().min(1).max(20),
  addressLine1: z.string().min(1).max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().default('Nepal'),
  isDefault: z.boolean().default(false),
})

export const updateAddressSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  fullName: z.string().min(1).max(200).optional(),
  phone: z.string().min(1).max(20).optional(),
  addressLine1: z.string().min(1).max(200).optional(),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().optional(),
  isDefault: z.boolean().optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type CreateAddressInput = z.infer<typeof createAddressSchema>
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>