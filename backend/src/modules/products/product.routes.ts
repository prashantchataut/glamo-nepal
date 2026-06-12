import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/firebase-auth'
import { requireRole } from '../../middleware/requireRole'
import { validateBody, validateQuery } from '../../middleware/validate'
import { publicReadRateLimit } from '../../middleware/rateLimit'
import { productFilterSchema, createProductSchema, updateProductSchema, variantSchema, updateVariantSchema, stockAdjustSchema } from './product.schema'
import {
  getProducts,
  searchProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleFeatured,
  toggleHidden,
  uploadProductImages,
  deleteProductImage,
  getProductVariants,
  addVariant,
  updateVariant,
  deleteVariant,
  adjustStock,
} from './product.controller'

const productRoutes = new Hono<AppEnv>()

productRoutes.get('/', publicReadRateLimit, validateQuery(productFilterSchema), getProducts)
productRoutes.get('/search', publicReadRateLimit, searchProducts)
productRoutes.get('/:slug', publicReadRateLimit, getProductBySlug)

productRoutes.post('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(createProductSchema), createProduct)
productRoutes.patch('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(updateProductSchema), updateProduct)
productRoutes.delete('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), deleteProduct)
productRoutes.patch('/:id/toggle-hidden', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), toggleHidden)
productRoutes.patch('/:id/toggle-featured', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), toggleFeatured)
productRoutes.post('/:id/images', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), uploadProductImages)
productRoutes.delete('/:id/images/:imageId', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), deleteProductImage)

productRoutes.get('/:id/variants', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), getProductVariants)
productRoutes.patch('/:id/stock', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(stockAdjustSchema), adjustStock)
productRoutes.post('/:id/variants', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(variantSchema), addVariant)
productRoutes.patch('/:id/variants/:variantId', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(updateVariantSchema), updateVariant)
productRoutes.delete('/:id/variants/:variantId', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), deleteVariant)
productRoutes.patch('/:id/variants/:variantId/stock', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(stockAdjustSchema), adjustStock)

export { productRoutes }
