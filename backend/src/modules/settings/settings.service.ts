import type { Client } from "@libsql/client";
import {
  AppError,
  handleDbError,
  safeJsonParse,
} from "../../utils/turso-helpers";
import {
  CACHE_TTL,
  getFromCache,
  setCache,
  deleteCacheByPrefix,
} from "../../utils/cache";
import { createAuditLog } from "../../utils/audit";

const PUBLIC_KEYS = [
  "announcement_texts",
  "free_shipping_threshold",
  "contact_info",
  "delivery_fees",
  "site_logo",
  "site_favicon",
  "og_image",
  "seo_title",
  "seo_description",
  "meta_keywords",
  "llms_txt",
  "ai_store_summary",
  "site_name",
  "support_email",
  "support_phone",
  "support_whatsapp",
  "business_hours",
  "return_policy_summary",
  "shipping_policy_summary",
  "delivery_zones",
  "support_response_templates",
  "homepage_featured_product_ids",
  "instagram_url",
  "facebook_url",
  "tiktok_url",
];

const SETTING_TYPE_MAP: Record<string, string> = {
  free_shipping_threshold: "number",
  cod_fee: "number",
  delivery_fees: "object",
  announcement_texts: "object",
  contact_info: "object",
  maintenance_mode: "boolean",
  max_cart_item_quantity: "number",
  review_auto_approve: "boolean",
  low_stock_threshold_default: "number",
  site_logo: "string",
  site_favicon: "string",
  og_image: "string",
  seo_title: "string",
  seo_description: "string",
  meta_keywords: "string",
  ai_store_summary: "string",
  llms_txt: "string",
  robots_extra: "string",
  nepali_delivery_notice: "string",
  store_pickup_enabled: "boolean",
  cod_enabled: "boolean",
  site_name: "string",
  support_email: "string",
  support_phone: "string",
  support_whatsapp: "string",
  business_hours: "string",
  return_policy_summary: "string",
  shipping_policy_summary: "string",
  delivery_zones: "object",
  support_response_templates: "object",
  homepage_featured_product_ids: "string",
  instagram_url: "string",
  facebook_url: "string",
  tiktok_url: "string",
};

function formatSetting(row: any) {
  return {
    id: row.id,
    key: row.key,
    value: safeJsonParse(row.value, row.value),
    group: row.group_name,
    groupName: row.group_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const DEFAULT_SETTINGS: Array<{ key: string; value: any; group: string }> = [
  { key: "free_shipping_threshold", value: 2500, group: "shipping" },
  { key: "cod_fee", value: 50, group: "shipping" },
  {
    key: "delivery_fees",
    value: { kathmandu_valley: 100, outside_valley: 0, free_above: 2500 },
    group: "shipping",
  },
  { key: "cod_enabled", value: true, group: "payment" },
  { key: "store_pickup_enabled", value: false, group: "shipping" },
  {
    key: "nepali_delivery_notice",
    value:
      "Delivery is currently available inside Kathmandu Valley. We confirm orders by phone before dispatch.",
    group: "shipping",
  },
  {
    key: "announcement_texts",
    value: ["Free delivery above NPR 2,500 inside Kathmandu Valley"],
    group: "general",
  },
  {
    key: "contact_info",
    value: {
      phone: "+977-9800000000",
      email: "hello@glamonepal.com",
      address: "Naya Baneshwor, Kathmandu",
    },
    group: "general",
  },
  { key: "site_name", value: "GLAMO NEPAL", group: "general" },
  { key: "support_email", value: "support@glamonepal.com", group: "support" },
  { key: "support_phone", value: "+977-9800000000", group: "support" },
  { key: "support_whatsapp", value: "+9779800000000", group: "support" },
  { key: "business_hours", value: "Sunday-Friday, 10:00 AM-6:00 PM", group: "support" },
  { key: "return_policy_summary", value: "Returns are reviewed for hygiene safety. Opened beauty items are quarantined by default.", group: "support" },
  { key: "shipping_policy_summary", value: "Kathmandu Valley delivery is available with Cash on Delivery where enabled.", group: "shipping" },
  { key: "delivery_zones", value: [{ name: "Kathmandu Valley", fee: 100, cod: true, estimate: "1-3 business days" }], group: "shipping" },
  {
    key: "support_response_templates",
    value: [
      { title: "Order confirmation", text: "Namaste, we received your order and will confirm it by phone before dispatch." },
      { title: "Return received", text: "Namaste, we received your return request. Beauty items are inspected for hygiene safety before resolution." },
      { title: "Delivery follow-up", text: "Namaste, your GLAMO Nepal order is being prepared for delivery. Please keep your phone reachable." }
    ],
    group: "support",
  },
  { key: "homepage_featured_product_ids", value: "", group: "content" },
  { key: "instagram_url", value: "", group: "social" },
  { key: "facebook_url", value: "", group: "social" },
  { key: "tiktok_url", value: "", group: "social" },
  { key: "maintenance_mode", value: false, group: "operations" },
  { key: "max_cart_item_quantity", value: 10, group: "operations" },
  { key: "review_auto_approve", value: false, group: "reviews" },
  { key: "low_stock_threshold_default", value: 5, group: "inventory" },
  { key: "site_logo", value: "", group: "media" },
  { key: "site_favicon", value: "", group: "media" },
  { key: "og_image", value: "", group: "media" },
  {
    key: "seo_title",
    value: "GLAMO NEPAL — Premium Beauty & Cosmetics in Nepal",
    group: "discovery",
  },
  {
    key: "seo_description",
    value:
      "Shop authentic skincare, makeup and beauty products in Nepal with delivery in Kathmandu Valley.",
    group: "discovery",
  },
  {
    key: "meta_keywords",
    value: "beauty Nepal, skincare Kathmandu, makeup Nepal, cosmetics Nepal",
    group: "discovery",
  },
  {
    key: "ai_store_summary",
    value:
      "GLAMO NEPAL is a beauty ecommerce store in Kathmandu, Nepal selling skincare, makeup and beauty products with Cash on Delivery where available.",
    group: "discovery",
  },
  {
    key: "llms_txt",
    value:
      "# GLAMO NEPAL\n\nBeauty ecommerce store in Kathmandu, Nepal. Key pages: /shop, /brands, /collections, /faq, /shipping-policy, /return-policy, /contact.",
    group: "discovery",
  },
  { key: "robots_extra", value: "", group: "discovery" },
];

async function ensureDefaultSettings(db: Client) {
  for (const setting of DEFAULT_SETTINGS) {
    const value =
      typeof setting.value === "object"
        ? JSON.stringify(setting.value)
        : String(setting.value);
    await db.execute({
      sql: `INSERT INTO site_settings (id, key, value, group_name, created_at, updated_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now')) ON CONFLICT(key) DO NOTHING`,
      args: [crypto.randomUUID(), setting.key, value, setting.group],
    });
  }
}

export async function getPublicSettings(db: Client) {
  await ensureDefaultSettings(db);
  const cacheKey = "settings:public";
  const cached = await getFromCache<Record<string, any>>(cacheKey);
  if (cached) return cached;

  const placeholders = PUBLIC_KEYS.map(() => "?").join(",");
  const result = await db.execute({
    sql: `SELECT key, value FROM site_settings WHERE key IN (${placeholders})`,
    args: PUBLIC_KEYS,
  });

  const settings: Record<string, any> = {};
  for (const row of result.rows) {
    settings[String(row.key)] = safeJsonParse(row.value as string, row.value);
  }

  await setCache(cacheKey, settings, CACHE_TTL.SETTINGS);

  return settings;
}

export async function getAllSettings(db: Client) {
  await ensureDefaultSettings(db);
  const result = await db.execute({
    sql: `SELECT * FROM site_settings ORDER BY group_name ASC`,
    args: [],
  });

  return result.rows.map(formatSetting);
}

export async function updateSettings(
  db: Client,
  settings: { key: string; value: any }[],
  adminUserId: string,
) {
  const validKeys = Object.keys(SETTING_TYPE_MAP);

  for (const setting of settings) {
    if (!validKeys.includes(setting.key)) {
      throw new AppError(
        `Invalid setting key: ${setting.key}`,
        400,
        "INVALID_KEY",
      );
    }

    const expectedType = SETTING_TYPE_MAP[setting.key];
    if (!validateType(setting.value, expectedType)) {
      throw new AppError(
        `Invalid value type for ${setting.key}: expected ${expectedType}`,
        400,
        "INVALID_TYPE",
      );
    }
  }

  for (const setting of settings) {
    const valueStr =
      typeof setting.value === "object"
        ? JSON.stringify(setting.value)
        : String(setting.value);

    await db.execute({
      sql: `INSERT INTO site_settings (id, key, value, group_name, created_at, updated_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now')) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')`,
      args: [
        crypto.randomUUID(),
        setting.key,
        valueStr,
        getGroupName(setting.key),
        valueStr,
      ],
    });
  }

  await deleteCacheByPrefix("settings:");

  await createAuditLog(db, {
    userId: adminUserId,
    action: "UPDATE",
    entity: "site_settings",
    changes: {
      settings: settings.map((s) => ({ key: s.key, value: s.value })),
    },
  });

  return { message: "Settings updated successfully" };
}

function validateType(value: any, expectedType: string): boolean {
  if (expectedType === "number")
    return typeof value === "number" && !isNaN(value);
  if (expectedType === "boolean") return typeof value === "boolean";
  if (expectedType === "string") return typeof value === "string";
  if (expectedType === "object")
    return value !== null && typeof value === "object";
  return true;
}

function getGroupName(key: string): string {
  const groupMap: Record<string, string> = {
    free_shipping_threshold: "shipping",
    cod_fee: "shipping",
    delivery_fees: "shipping",
    announcement_texts: "general",
    contact_info: "general",
    maintenance_mode: "general",
    max_cart_item_quantity: "general",
    review_auto_approve: "general",
    low_stock_threshold_default: "inventory",
    site_logo: "media",
    site_favicon: "media",
    og_image: "media",
    seo_title: "discovery",
    seo_description: "discovery",
    meta_keywords: "discovery",
    ai_store_summary: "discovery",
    llms_txt: "discovery",
    robots_extra: "discovery",
    nepali_delivery_notice: "shipping",
    store_pickup_enabled: "shipping",
    cod_enabled: "payment",
    site_name: "general",
    support_email: "support",
    support_phone: "support",
    support_whatsapp: "support",
    business_hours: "support",
    return_policy_summary: "support",
    shipping_policy_summary: "shipping",
    delivery_zones: "shipping",
    support_response_templates: "support",
    homepage_featured_product_ids: "content",
    instagram_url: "social",
    facebook_url: "social",
    tiktok_url: "social",
  };
  return groupMap[key] || "general";
}
