import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { extractToken, verifyUser, createSupabaseAdminClient } from '../../_shared/auth.ts';
import { success, error, paginated, notFound, unauthorized, forbidden } from '../../_shared/response.ts';
import { ROLES } from '../../_shared/types.ts';
import {
  productFilterSchema,
  createProductSchema,
  updateProductSchema,
  variantSchema,
  updateVariantSchema,
  stockAdjustSchema,
  idParamSchema,
} from '../../_shared/validation.ts';

const app = new Hono();
app.use('*', cors());

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

app.get('/', async (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const client = createClient(supabaseUrl, supabaseAnonKey);

  const query = c.req.query();
  const filterResult = productFilterSchema.safeParse(query);
  if (!filterResult.success) {
    const errors = filterResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return error('Validation failed', 400, errors);
  }

  const filter = filterResult.data;

  let dbQuery = client
    .from('products')
    .select('id, name, slug, short_description, base_price, sale_price, currency, is_active, is_featured, category_id, brand_id, sku, created_at', { count: 'exact' })
    .is('deleted_at', null)
    .eq('is_active', true);

  if (filter.category) dbQuery = dbQuery.eq('category_id', filter.category);
  if (filter.brand) dbQuery = dbQuery.eq('brand_id', filter.brand);
  if (filter.search) {
    dbQuery = dbQuery.textSearch('search_vector', filter.search, { type: 'websearch', config: 'english' });
  }
  if (filter.minPrice !== undefined) dbQuery = dbQuery.gte('base_price', filter.minPrice);
  if (filter.maxPrice !== undefined) dbQuery = dbQuery.lte('base_price', filter.maxPrice);
  if (filter.featured !== undefined) dbQuery = dbQuery.eq('is_featured', filter.featured);
  if (filter.inStock !== undefined) dbQuery = dbQuery.gt('stock_quantity', 0);
  if (filter.tags) {
    const tags = filter.tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (tags.length > 0) dbQuery = dbQuery.overlaps('tags', tags);
  }

  switch (filter.sort) {
    case 'price-asc':
      dbQuery = dbQuery.order('base_price', { ascending: true });
      break;
    case 'price-desc':
      dbQuery = dbQuery.order('base_price', { ascending: false });
      break;
    case 'best-seller':
      dbQuery = dbQuery.order('stock_quantity', { ascending: false });
      break;
    case 'rating':
      dbQuery = dbQuery.order('created_at', { ascending: false });
      break;
    case 'most-reviewed':
      dbQuery = dbQuery.order('created_at', { ascending: false });
      break;
    default:
      dbQuery = dbQuery.order('created_at', { ascending: false });
  }

  const from = (filter.page - 1) * filter.limit;
  const to = from + filter.limit - 1;
  dbQuery = dbQuery.range(from, to);

  const { data, count, error: dbError } = await dbQuery;
  if (dbError) return error(dbError.message, 500);

  return paginated(data ?? [], count ?? 0, filter.page, filter.limit);
});

app.get('/:slug', async (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const client = createClient(supabaseUrl, supabaseAnonKey);

  const { slug } = c.req.param();

  const { data: product, error: dbError } = await client
    .from('products')
    .select('id, name, slug, description, short_description, sku, category_id, brand_id, base_price, sale_price, cost_price, currency, is_active, is_featured, is_digital, track_inventory, stock_quantity, low_stock_threshold, weight, dimensions, meta_title, meta_description, tags, created_at, updated_at')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single();

  if (dbError || !product) return notFound('Product');

  const [variantsRes, imagesRes] = await Promise.all([
    client
      .from('product_variants')
      .select('id, name, sku, price, sale_price, stock_quantity, attributes, is_active')
      .eq('product_id', product.id)
      .is('deleted_at', null),
    client
      .from('product_images')
      .select('id, url, alt_text, sort_order, is_primary')
      .eq('product_id', product.id)
      .order('sort_order', { ascending: true }),
  ]);

  return success({
    ...product,
    variants: variantsRes.data ?? [],
    images: imagesRes.data ?? [],
  });
});

app.post('/', async (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const token = extractToken(c.req.raw);
  if (!token) return unauthorized('No token provided');

  const user = await verifyUser(supabaseUrl, supabaseAnonKey, token);
  if (!user) return unauthorized('Invalid or expired token');
  if (user.role !== ROLES.STAFF && user.role !== ROLES.ADMIN && user.role !== ROLES.SUPER_ADMIN) {
    return forbidden('Insufficient permissions');
  }

  const body = await c.req.json();
  const result = createProductSchema.safeParse(body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return error('Validation failed', 400, errors);
  }

  const adminClient = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey);
  const insertData: Record<string, unknown> = {
    name: result.data.name,
    slug: slugify(result.data.name),
    description: result.data.description ?? null,
    short_description: result.data.shortDescription ?? null,
    sku: result.data.sku ?? null,
    category_id: result.data.categoryId,
    brand_id: result.data.brandId ?? null,
    base_price: result.data.basePrice,
    sale_price: result.data.salePrice ?? null,
    cost_price: result.data.costPrice ?? null,
    currency: result.data.currency,
    is_active: result.data.isActive,
    is_featured: result.data.isFeatured,
    is_digital: result.data.isDigital,
    track_inventory: result.data.trackInventory,
    stock_quantity: result.data.stockQuantity,
    low_stock_threshold: result.data.lowStockThreshold,
    weight: result.data.weight ?? null,
    dimensions: result.data.dimensions ?? null,
    meta_title: result.data.metaTitle ?? null,
    meta_description: result.data.metaDescription ?? null,
    tags: result.data.tags ?? [],
  };

  const { data, error: dbError } = await adminClient
    .from('products')
    .insert(insertData)
    .select()
    .single();

  if (dbError) return error(dbError.message, 500);
  return success(data, 201);
});

app.put('/:id', async (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const token = extractToken(c.req.raw);
  if (!token) return unauthorized('No token provided');

  const user = await verifyUser(supabaseUrl, supabaseAnonKey, token);
  if (!user) return unauthorized('Invalid or expired token');
  if (user.role !== ROLES.STAFF && user.role !== ROLES.ADMIN && user.role !== ROLES.SUPER_ADMIN) {
    return forbidden('Insufficient permissions');
  }

  const { id } = c.req.param();
  const body = await c.req.json();
  const result = updateProductSchema.safeParse(body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return error('Validation failed', 400, errors);
  }

  const adminClient = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey);
  const updateData: Record<string, unknown> = {};
  if (result.data.name !== undefined) {
    updateData.name = result.data.name;
    updateData.slug = slugify(result.data.name);
  }
  if (result.data.description !== undefined) updateData.description = result.data.description;
  if (result.data.shortDescription !== undefined) updateData.short_description = result.data.shortDescription;
  if (result.data.sku !== undefined) updateData.sku = result.data.sku;
  if (result.data.categoryId !== undefined) updateData.category_id = result.data.categoryId;
  if (result.data.brandId !== undefined) updateData.brand_id = result.data.brandId;
  if (result.data.basePrice !== undefined) updateData.base_price = result.data.basePrice;
  if (result.data.salePrice !== undefined) updateData.sale_price = result.data.salePrice;
  if (result.data.costPrice !== undefined) updateData.cost_price = result.data.costPrice;
  if (result.data.currency !== undefined) updateData.currency = result.data.currency;
  if (result.data.isActive !== undefined) updateData.is_active = result.data.isActive;
  if (result.data.isFeatured !== undefined) updateData.is_featured = result.data.isFeatured;
  if (result.data.isDigital !== undefined) updateData.is_digital = result.data.isDigital;
  if (result.data.trackInventory !== undefined) updateData.track_inventory = result.data.trackInventory;
  if (result.data.stockQuantity !== undefined) updateData.stock_quantity = result.data.stockQuantity;
  if (result.data.lowStockThreshold !== undefined) updateData.low_stock_threshold = result.data.lowStockThreshold;
  if (result.data.weight !== undefined) updateData.weight = result.data.weight;
  if (result.data.dimensions !== undefined) updateData.dimensions = result.data.dimensions;
  if (result.data.metaTitle !== undefined) updateData.meta_title = result.data.metaTitle;
  if (result.data.metaDescription !== undefined) updateData.meta_description = result.data.metaDescription;
  if (result.data.tags !== undefined) updateData.tags = result.data.tags;

  const { data, error: dbError } = await adminClient
    .from('products')
    .update(updateData)
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single();

  if (dbError) return error(dbError.message, 500);
  if (!data) return notFound('Product');

  return success(data);
});

app.delete('/:id', async (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const token = extractToken(c.req.raw);
  if (!token) return unauthorized('No token provided');

  const user = await verifyUser(supabaseUrl, supabaseAnonKey, token);
  if (!user) return unauthorized('Invalid or expired token');
  if (user.role !== ROLES.STAFF && user.role !== ROLES.ADMIN && user.role !== ROLES.SUPER_ADMIN) {
    return forbidden('Insufficient permissions');
  }

  const { id } = c.req.param();
  const adminClient = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey);

  const { data, error: dbError } = await adminClient
    .from('products')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single();

  if (dbError) return error(dbError.message, 500);
  if (!data) return notFound('Product');

  return success({ message: 'Product deleted' });
});

app.post('/:id/variants', async (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const token = extractToken(c.req.raw);
  if (!token) return unauthorized('No token provided');

  const user = await verifyUser(supabaseUrl, supabaseAnonKey, token);
  if (!user) return unauthorized('Invalid or expired token');
  if (user.role !== ROLES.STAFF && user.role !== ROLES.ADMIN && user.role !== ROLES.SUPER_ADMIN) {
    return forbidden('Insufficient permissions');
  }

  const { id } = c.req.param();
  const body = await c.req.json();
  const result = variantSchema.safeParse(body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return error('Validation failed', 400, errors);
  }

  const adminClient = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey);

  const { data: product } = await adminClient
    .from('products')
    .select('id')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (!product) return notFound('Product');

  const { data, error: dbError } = await adminClient
    .from('product_variants')
    .insert({
      product_id: id,
      name: result.data.name,
      sku: result.data.sku ?? null,
      price: result.data.price,
      sale_price: result.data.salePrice ?? null,
      stock_quantity: result.data.stockQuantity ?? 0,
      attributes: result.data.attributes ?? {},
    })
    .select()
    .single();

  if (dbError) return error(dbError.message, 500);
  return success(data, 201);
});

app.put('/:id/variants/:variantId', async (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const token = extractToken(c.req.raw);
  if (!token) return unauthorized('No token provided');

  const user = await verifyUser(supabaseUrl, supabaseAnonKey, token);
  if (!user) return unauthorized('Invalid or expired token');
  if (user.role !== ROLES.STAFF && user.role !== ROLES.ADMIN && user.role !== ROLES.SUPER_ADMIN) {
    return forbidden('Insufficient permissions');
  }

  const { id, variantId } = c.req.param();
  const body = await c.req.json();
  const result = updateVariantSchema.safeParse(body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return error('Validation failed', 400, errors);
  }

  const adminClient = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey);
  const updateData: Record<string, unknown> = {};
  if (result.data.name !== undefined) updateData.name = result.data.name;
  if (result.data.sku !== undefined) updateData.sku = result.data.sku;
  if (result.data.price !== undefined) updateData.price = result.data.price;
  if (result.data.salePrice !== undefined) updateData.sale_price = result.data.salePrice;
  if (result.data.stockQuantity !== undefined) updateData.stock_quantity = result.data.stockQuantity;
  if (result.data.attributes !== undefined) updateData.attributes = result.data.attributes;
  if (result.data.isActive !== undefined) updateData.is_active = result.data.isActive;

  const { data, error: dbError } = await adminClient
    .from('product_variants')
    .update(updateData)
    .eq('id', variantId)
    .eq('product_id', id)
    .is('deleted_at', null)
    .select()
    .single();

  if (dbError) return error(dbError.message, 500);
  if (!data) return notFound('Variant');

  return success(data);
});

app.delete('/:id/variants/:variantId', async (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const token = extractToken(c.req.raw);
  if (!token) return unauthorized('No token provided');

  const user = await verifyUser(supabaseUrl, supabaseAnonKey, token);
  if (!user) return unauthorized('Invalid or expired token');
  if (user.role !== ROLES.STAFF && user.role !== ROLES.ADMIN && user.role !== ROLES.SUPER_ADMIN) {
    return forbidden('Insufficient permissions');
  }

  const { id, variantId } = c.req.param();
  const adminClient = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey);

  const { data, error: dbError } = await adminClient
    .from('product_variants')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', variantId)
    .eq('product_id', id)
    .is('deleted_at', null)
    .select()
    .single();

  if (dbError) return error(dbError.message, 500);
  if (!data) return notFound('Variant');

  return success({ message: 'Variant deleted' });
});

app.post('/:id/images', async (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const token = extractToken(c.req.raw);
  if (!token) return unauthorized('No token provided');

  const user = await verifyUser(supabaseUrl, supabaseAnonKey, token);
  if (!user) return unauthorized('Invalid or expired token');
  if (user.role !== ROLES.STAFF && user.role !== ROLES.ADMIN && user.role !== ROLES.SUPER_ADMIN) {
    return forbidden('Insufficient permissions');
  }

  const { id } = c.req.param();
  const body = await c.req.json();

  if (!body.url) return error('Image url is required', 400);

  const adminClient = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey);

  const { data: product } = await adminClient
    .from('products')
    .select('id')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (!product) return notFound('Product');

  const { data, error: dbError } = await adminClient
    .from('product_images')
    .insert({
      product_id: id,
      url: body.url,
      public_id: body.publicId ?? null,
      alt_text: body.altText ?? null,
      sort_order: body.sortOrder ?? 0,
      is_primary: body.isPrimary ?? false,
    })
    .select()
    .single();

  if (dbError) return error(dbError.message, 500);
  return success(data, 201);
});

app.put('/:id/images/:imageId', async (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const token = extractToken(c.req.raw);
  if (!token) return unauthorized('No token provided');

  const user = await verifyUser(supabaseUrl, supabaseAnonKey, token);
  if (!user) return unauthorized('Invalid or expired token');
  if (user.role !== ROLES.STAFF && user.role !== ROLES.ADMIN && user.role !== ROLES.SUPER_ADMIN) {
    return forbidden('Insufficient permissions');
  }

  const { id, imageId } = c.req.param();
  const body = await c.req.json();

  const adminClient = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey);
  const updateData: Record<string, unknown> = {};
  if (body.url !== undefined) updateData.url = body.url;
  if (body.publicId !== undefined) updateData.public_id = body.publicId;
  if (body.altText !== undefined) updateData.alt_text = body.altText;
  if (body.sortOrder !== undefined) updateData.sort_order = body.sortOrder;
  if (body.isPrimary !== undefined) updateData.is_primary = body.isPrimary;

  const { data, error: dbError } = await adminClient
    .from('product_images')
    .update(updateData)
    .eq('id', imageId)
    .eq('product_id', id)
    .select()
    .single();

  if (dbError) return error(dbError.message, 500);
  if (!data) return notFound('Image');

  return success(data);
});

app.delete('/:id/images/:imageId', async (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const token = extractToken(c.req.raw);
  if (!token) return unauthorized('No token provided');

  const user = await verifyUser(supabaseUrl, supabaseAnonKey, token);
  if (!user) return unauthorized('Invalid or expired token');
  if (user.role !== ROLES.STAFF && user.role !== ROLES.ADMIN && user.role !== ROLES.SUPER_ADMIN) {
    return forbidden('Insufficient permissions');
  }

  const { id, imageId } = c.req.param();
  const adminClient = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey);

  const { error: dbError } = await adminClient
    .from('product_images')
    .delete()
    .eq('id', imageId)
    .eq('product_id', id);

  if (dbError) return error(dbError.message, 500);

  return success({ message: 'Image deleted' });
});

app.post('/:id/stock', async (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const token = extractToken(c.req.raw);
  if (!token) return unauthorized('No token provided');

  const user = await verifyUser(supabaseUrl, supabaseAnonKey, token);
  if (!user) return unauthorized('Invalid or expired token');
  if (user.role !== ROLES.STAFF && user.role !== ROLES.ADMIN && user.role !== ROLES.SUPER_ADMIN) {
    return forbidden('Insufficient permissions');
  }

  const { id } = c.req.param();
  const body = await c.req.json();
  const result = stockAdjustSchema.safeParse(body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return error('Validation failed', 400, errors);
  }

  const adminClient = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey);

  const { data: product, error: fetchError } = await adminClient
    .from('products')
    .select('stock_quantity')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (fetchError || !product) return notFound('Product');

  const newStock = product.stock_quantity + result.data.change;
  if (newStock < 0) return error('Insufficient stock', 400);

  const { data, error: dbError } = await adminClient
    .from('products')
    .update({ stock_quantity: newStock })
    .eq('id', id)
    .select()
    .single();

  if (dbError) return error(dbError.message, 500);

  await adminClient.from('inventory_logs').insert({
    product_id: id,
    variant_id: null,
    change_type: result.data.change > 0 ? 'MANUAL_ADD' : 'MANUAL_REMOVE',
    quantity: Math.abs(result.data.change),
    previous_stock: product.stock_quantity,
    new_stock: newStock,
    reason: result.data.reason ?? null,
    performed_by: user.id,
  });

  return success(data);
});

Deno.serve(app.fetch);