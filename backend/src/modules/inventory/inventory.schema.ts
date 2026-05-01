import { z } from 'zod'

export const inventoryLogFilterSchema = z.object({
  productId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),
  changeType: z.enum(['RESTOCK', 'SALE', 'ADJUSTMENT', 'RETURN', 'CANCEL_RESTORE']).optional(),
  dateFrom: z.string().datetime({ offset: true }).optional(),
  dateTo: z.string().datetime({ offset: true }).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const stockAdjustSchema = z.object({
  change: z.number().int(),
  reason: z.string().max(500).optional(),
})

export type InventoryLogFilterInput = z.infer<typeof inventoryLogFilterSchema>
export type StockAdjustInput = z.infer<typeof stockAdjustSchema>