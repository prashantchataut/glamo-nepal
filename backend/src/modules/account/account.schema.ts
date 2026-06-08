import { z } from 'zod'

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
})

export const createAddressSchema = z.object({
  label: z.string().max(50).optional(),
  fullName: z.string().min(1).max(200),
  phone: z.string().min(1).max(20),
  address1: z.string().min(1).max(300).optional(),
  addressLine1: z.string().min(1).max(300).optional(),
  address2: z.string().max(300).optional(),
  addressLine2: z.string().max(300).optional(),
  ward: z.string().max(20).optional(),
  city: z.string().min(1).max(100),
  district: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().default('Nepal'),
  landmark: z.string().max(120).optional(),
}).refine((value) => Boolean(value.address1 || value.addressLine1), 'Address line is required')

export const updateAddressSchema = z.object({
  label: z.string().max(50).optional(),
  fullName: z.string().min(1).max(200).optional(),
  phone: z.string().min(1).max(20).optional(),
  address1: z.string().min(1).max(300).optional(),
  addressLine1: z.string().min(1).max(300).optional(),
  address2: z.string().max(300).optional(),
  addressLine2: z.string().max(300).optional(),
  ward: z.string().max(20).optional(),
  city: z.string().min(1).max(100).optional(),
  district: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().optional(),
  landmark: z.string().max(120).optional(),
})

export const idParamSchema = z.object({
  id: z.string().uuid(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type CreateAddressInput = z.infer<typeof createAddressSchema>
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>