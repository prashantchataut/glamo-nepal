import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { AppError } from '../../utils/supabase'
import { ApiResponse } from '../../utils/response'
import * as ProductService from './product.service'

export async function getProducts(c: Context<AppEnv>) {
  try {
    const query = c.req.query()
    const user = c.get('user')
    const supabase = c.get('supabase')
    const kv = c.env.KV
    const isAdmin = user ? ['ADMIN', 'SUPER_ADMIN'].includes(user.role) : false
    const filters = {
      category: query.category,
      brand: query.brand,
      search: query.search,
      minPrice: query.minPrice ? Number(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
      tags: query.tags,
      inStock: query.inStock === 'true',
      featured: query.featured === 'true',
      sort: query.sort || 'newest',
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 24,
      isAdmin,
    }

    const result = await ProductService.getProductsCached(filters, supabase, kv)
    return ApiResponse.paginated(c, 'Products fetched successfully', result.products, result.pagination.total, result.pagination.page, result.pagination.limit)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch products', 500)
  }
}

export async function searchProducts(c: Context<AppEnv>) {
  try {
    const query = c.req.query('q') || ''
    const page = Number(c.req.query('page')) || 1
    const limit = Number(c.req.query('limit')) || 24
    const supabase = c.get('supabase')

    if (!query.trim()) {
      return ApiResponse.error(c, 'Search query is required', 400)
    }

    const result = await ProductService.searchProducts(query, page, limit, supabase)
    return ApiResponse.paginated(c, 'Search results', result.products, result.pagination.total, result.pagination.page, result.pagination.limit)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Search failed', 500)
  }
}

export async function getProductBySlug(c: Context<AppEnv>) {
  try {
    const { slug } = c.req.param()
    const supabase = c.get('supabase')
    const kv = c.env.KV
    const product = await ProductService.getProductBySlug(slug, supabase, kv)

    if (!product) {
      return ApiResponse.error(c, 'Product not found', 404)
    }

    return ApiResponse.success(c, 'Product fetched successfully', product)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch product', 500)
  }
}

export async function createProduct(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const user = c.get('user')
    const supabase = c.get('supabase')
    const kv = c.env.KV

    const product = await ProductService.createProduct(data, user.id, supabase, kv)
    return ApiResponse.success(c, 'Product created successfully', product, 201)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    if (error.message === 'PRODUCT_NOT_FOUND') {
      return ApiResponse.error(c, 'Category not found', 404)
    }
    return ApiResponse.error(c, error.message || 'Failed to create product', 500)
  }
}

export async function updateProduct(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const data = c.get('validatedBody')
    const user = c.get('user')
    const supabase = c.get('supabase')
    const kv = c.env.KV

    const product = await ProductService.updateProduct(id, data, user.id, supabase, kv)
    return ApiResponse.success(c, 'Product updated successfully', product)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    if (error.message === 'PRODUCT_NOT_FOUND') {
      return ApiResponse.error(c, 'Product not found', 404)
    }
    return ApiResponse.error(c, error.message || 'Failed to update product', 500)
  }
}

export async function deleteProduct(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const user = c.get('user')
    const supabase = c.get('supabase')
    const kv = c.env.KV

    await ProductService.softDeleteProduct(id, user.id, supabase, kv)
    return ApiResponse.success(c, 'Product deleted successfully', null)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    if (error.message === 'PRODUCT_NOT_FOUND') {
      return ApiResponse.error(c, 'Product not found', 404)
    }
    return ApiResponse.error(c, error.message || 'Failed to delete product', 500)
  }
}

export async function toggleFeatured(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const user = c.get('user')
    const supabase = c.get('supabase')
    const kv = c.env.KV

    const result = await ProductService.toggleFeatured(id, user.id, supabase, kv)
    return ApiResponse.success(c, 'Product featured status updated', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    if (error.message === 'PRODUCT_NOT_FOUND') {
      return ApiResponse.error(c, 'Product not found', 404)
    }
    return ApiResponse.error(c, error.message || 'Failed to toggle featured', 500)
  }
}

export async function toggleHidden(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const user = c.get('user')
    const supabase = c.get('supabase')
    const kv = c.env.KV

    const result = await ProductService.toggleHidden(id, user.id, supabase, kv)
    return ApiResponse.success(c, 'Product visibility updated', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    if (error.message === 'PRODUCT_NOT_FOUND') {
      return ApiResponse.error(c, 'Product not found', 404)
    }
    return ApiResponse.error(c, error.message || 'Failed to toggle visibility', 500)
  }
}

export async function uploadProductImages(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const user = c.get('user')
    const supabase = c.get('supabase')
    const kv = c.env.KV

    const body = await c.req.parseBody()
    const fileArrays = Object.values(body).filter((v): v is File => v instanceof File)
    const files = Array.isArray(fileArrays) ? fileArrays : [fileArrays]

    if (files.length === 0) {
      return ApiResponse.error(c, 'No images provided', 400)
    }

    const images = await ProductService.uploadProductImages(id, files, user.id, supabase, kv, c.env)
    return ApiResponse.success(c, 'Images uploaded successfully', images)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    if (error.message === 'PRODUCT_NOT_FOUND') {
      return ApiResponse.error(c, 'Product not found', 404)
    }
    if (error.message === 'MAX_IMAGES_EXCEEDED') {
      return ApiResponse.error(c, 'Maximum 10 images per product', 400)
    }
    if (error.message.startsWith('Invalid file type') || error.message.startsWith('File size exceeds')) {
      return ApiResponse.error(c, error.message, 400)
    }
    return ApiResponse.error(c, error.message || 'Failed to upload images', 500)
  }
}

export async function deleteProductImage(c: Context<AppEnv>) {
  try {
    const { id, imageId } = c.req.param()
    const user = c.get('user')
    const supabase = c.get('supabase')
    const kv = c.env.KV

    const images = await ProductService.deleteProductImage(id, imageId, user.id, supabase, kv, c.env)
    return ApiResponse.success(c, 'Image deleted successfully', images)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    if (error.message === 'IMAGE_NOT_FOUND') {
      return ApiResponse.error(c, 'Image not found', 404)
    }
    return ApiResponse.error(c, error.message || 'Failed to delete image', 500)
  }
}

export async function getProductVariants(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const supabase = c.get('supabase')
    const variants = await ProductService.getProductVariants(id, supabase)
    return ApiResponse.success(c, 'Variants fetched successfully', variants)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch variants', 500)
  }
}

export async function addVariant(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const data = c.get('validatedBody')
    const user = c.get('user')
    const supabase = c.get('supabase')
    const kv = c.env.KV

    const variant = await ProductService.addVariant(id, data, user.id, supabase, kv)
    return ApiResponse.success(c, 'Variant added successfully', variant, 201)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    if (error.message === 'PRODUCT_NOT_FOUND') {
      return ApiResponse.error(c, 'Product not found', 404)
    }
    return ApiResponse.error(c, error.message || 'Failed to add variant', 500)
  }
}

export async function updateVariant(c: Context<AppEnv>) {
  try {
const { variantId } = c.req.param()
  const data = c.get('validatedBody')
  const user = c.get('user')
  const supabase = c.get('supabase')
  const kv = c.env.KV

  const variant = await ProductService.updateVariant(variantId, data, user.id, supabase, kv)
    return ApiResponse.success(c, 'Variant updated successfully', variant)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    if (error.message === 'VARIANT_NOT_FOUND') {
      return ApiResponse.error(c, 'Variant not found', 404)
    }
    return ApiResponse.error(c, error.message || 'Failed to update variant', 500)
  }
}

export async function deleteVariant(c: Context<AppEnv>) {
  try {
const { variantId } = c.req.param()
  const user = c.get('user')
  const supabase = c.get('supabase')
  const kv = c.env.KV

  await ProductService.deleteVariant(variantId, user.id, supabase, kv)
    return ApiResponse.success(c, 'Variant deleted successfully', null)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    if (error.message === 'VARIANT_NOT_FOUND') {
      return ApiResponse.error(c, 'Variant not found', 404)
    }
    if (error.message === 'VARIANT_IN_ACTIVE_ORDERS') {
      return ApiResponse.error(c, 'Cannot delete variant with active orders', 400)
    }
    return ApiResponse.error(c, error.message || 'Failed to delete variant', 500)
  }
}

export async function adjustStock(c: Context<AppEnv>) {
  try {
    const { id, variantId } = c.req.param()
    const data = c.get('validatedBody')
    const user = c.get('user')
    const supabase = c.get('supabase')
    const kv = c.env.KV

    await ProductService.adjustStock(id, variantId || null, data.change, data.reason, user.id, supabase, kv)
    return ApiResponse.success(c, 'Stock adjusted successfully', null)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    if (error.message === 'PRODUCT_NOT_FOUND' || error.message === 'VARIANT_NOT_FOUND') {
      return ApiResponse.error(c, error.message === 'PRODUCT_NOT_FOUND' ? 'Product not found' : 'Variant not found', 404)
    }
    if (error.message === 'INSUFFICIENT_STOCK') {
      return ApiResponse.error(c, 'Insufficient stock', 400)
    }
    return ApiResponse.error(c, error.message || 'Failed to adjust stock', 500)
  }
}