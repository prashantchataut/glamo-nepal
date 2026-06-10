import { z } from 'zod'

export const stockReportFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  lowStockOnly: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  outOfStockOnly: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
})

export const inventoryLogFilterSchema = z.object({
  productId: z.string().min(1).max(64).optional(),
  changeType: z.enum(['RESTOCK', 'SALE', 'ADJUSTMENT', 'RETURN', 'CANCEL_RESTORE']).optional(),
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const stockAdjustSchema = z.object({
  change: z.number().int(),
  reason: z.string().max(500).optional(),
})

export type InventoryLogFilterInput = z.infer<typeof inventoryLogFilterSchema>
export type StockAdjustInput = z.infer<typeof stockAdjustSchema>