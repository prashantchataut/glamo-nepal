import { z } from 'zod'

export const productFilterSchema = z.object({
  category: z.string().optional(),
  brand: z.string().optional(),
  search: z.string().optional(),
  q: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  tags: z.string().optional(),
  concern: z.string().optional(),
  skinType: z.string().optional(),
  madeInNepal: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
  inStock: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
  featured: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
  perPage: z.coerce.number().int().positive().max(100).optional(),
  sort: z.enum(['newest', 'featured', 'price-asc', 'price-desc', 'best-seller', 'best-sellers', 'most-reviewed', 'rating']).default('newest'),
  page: z.coerce.number().int().positive().max(500).default(1),
  limit: z.coerce.number().int().positive().max(100).default(24),
})

const tagsTransform = z.union([
  z.array(z.string()),
  z.string().transform((v: string) => v.split(',').map((t: string) => t.trim()).filter(Boolean)),
])

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  sku: z.string().optional(),
  categoryId: z.string().min(1),
  brandId: z.string().optional(),
  basePrice: z.number().positive(),
  salePrice: z.number().positive().optional(),
  costPrice: z.number().nonnegative().optional(),
  currency: z.string().default('NPR'),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isDigital: z.boolean().default(false),
  trackInventory: z.boolean().default(true),
  stockQuantity: z.number().int().default(0),
  lowStockThreshold: z.number().int().default(5),
  weight: z.number().positive().optional(),
  dimensions: z.string().optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(500).optional(),
  tags: tagsTransform.optional().default([]),
  attributes: z.record(z.string(), z.unknown()).optional().default({}),
})

export const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  sku: z.string().optional(),
  categoryId: z.string().min(1).optional(),
  brandId: z.string().nullable().optional(),
  basePrice: z.number().positive().optional(),
  salePrice: z.number().positive().nullable().optional(),
  costPrice: z.number().nonnegative().nullable().optional(),
  currency: z.string().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isDigital: z.boolean().optional(),
  trackInventory: z.boolean().optional(),
  stockQuantity: z.number().int().optional(),
  lowStockThreshold: z.number().int().optional(),
  weight: z.number().positive().nullable().optional(),
  dimensions: z.string().nullable().optional(),
  metaTitle: z.string().max(255).nullable().optional(),
  metaDescription: z.string().max(500).nullable().optional(),
  tags: tagsTransform.optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
})

const attributesTransform = z.union([
  z.record(z.string(), z.string()),
  z.string().transform((v: string) => JSON.parse(v)),
])

export const variantSchema = z.object({
  name: z.string().min(1).max(255),
  sku: z.string().optional(),
  price: z.number().positive(),
  salePrice: z.number().positive().optional(),
  stockQuantity: z.number().int().default(0),
  attributes: attributesTransform.optional().default({}),
})

export const updateVariantSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  sku: z.string().optional(),
  price: z.number().positive().optional(),
  salePrice: z.number().positive().nullable().optional(),
  stockQuantity: z.number().int().optional(),
  attributes: attributesTransform.optional(),
  isActive: z.boolean().optional(),
})

export const stockAdjustSchema = z.object({
  change: z.number().int(),
  reason: z.string().max(500).optional(),
})

export type ProductFilterInput = z.infer<typeof productFilterSchema>
export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type VariantInput = z.infer<typeof variantSchema>
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>
export type StockAdjustInput = z.infer<typeof stockAdjustSchema>