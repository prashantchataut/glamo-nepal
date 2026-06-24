import { z } from 'zod'

export const returnFilterSchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().max(500).default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const createReturnSchema = z.object({
  orderId: z.string().optional(),
  orderNumber: z.string().optional(),
  reason: z.string().min(1).max(120),
  requestedResolution: z.enum(['REFUND', 'EXCHANGE', 'STORE_CREDIT']).default('REFUND'),
  itemCondition: z.enum(['SEALED', 'OPENED', 'DAMAGED', 'LEAKED', 'USED', 'EXPIRED', 'UNKNOWN']).default('UNKNOWN'),
  hygieneStatus: z.enum(['QUARANTINE', 'INSPECT', 'DISPOSE', 'RETURN_TO_STOCK']).default('QUARANTINE'),
  customerNote: z.string().max(500).optional(),
}).refine((value) => Boolean(value.orderId || value.orderNumber), 'Order ID or order number is required')

export const updateReturnSchema = z.object({
  status: z.enum(['REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'INSPECTED', 'REFUNDED', 'EXCHANGED', 'CLOSED']).optional(),
  requestedResolution: z.enum(['REFUND', 'EXCHANGE', 'STORE_CREDIT']).optional(),
  itemCondition: z.enum(['SEALED', 'OPENED', 'DAMAGED', 'LEAKED', 'USED', 'EXPIRED', 'UNKNOWN']).optional(),
  hygieneStatus: z.enum(['QUARANTINE', 'INSPECT', 'DISPOSE', 'RETURN_TO_STOCK']).optional(),
  adminNotes: z.string().max(1000).optional(),
})

export type ReturnFilterInput = z.infer<typeof returnFilterSchema>
export type CreateReturnInput = z.infer<typeof createReturnSchema>
export type UpdateReturnInput = z.infer<typeof updateReturnSchema>
