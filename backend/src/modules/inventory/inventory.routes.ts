import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/auth'
import { requireRole } from '../../middleware/requireRole'
import { validateQuery } from '../../middleware/validate'
import { stockReportFilterSchema, inventoryLogFilterSchema } from './inventory.schema'
import type { ZodSchema } from 'zod'
import { getStockReport, getLowStockAlerts, getInventoryLogs } from './inventory.controller'

const inventoryRoutes = new Hono<AppEnv>()

inventoryRoutes.get('/report', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateQuery(stockReportFilterSchema as ZodSchema<any>), getStockReport)
inventoryRoutes.get('/low-stock', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), getLowStockAlerts)
inventoryRoutes.get('/logs', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateQuery(inventoryLogFilterSchema as ZodSchema<any>), getInventoryLogs)

export { inventoryRoutes }