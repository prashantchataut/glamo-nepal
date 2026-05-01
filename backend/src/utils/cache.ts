export const CACHE_TTL = {
  BANNERS: 600,
  CATEGORIES: 1800,
  SETTINGS: 1800,
  POPUP: 600,
  PRODUCT: 300,
  PRODUCT_LIST: 300,
  BRANDS: 1800,
} as const

export async function getFromCache<T>(
  kv: KVNamespace,
  key: string
): Promise<T | null> {
  const value = await kv.get(key, 'json')
  return value as T | null
}

export async function setCache<T>(
  kv: KVNamespace,
  key: string,
  value: T,
  ttl: number
): Promise<void> {
  await kv.put(key, JSON.stringify(value), { expirationTtl: ttl })
}

export async function deleteCache(
  kv: KVNamespace,
  key: string
): Promise<void> {
  await kv.delete(key)
}

export async function deleteCacheByPrefix(
  kv: KVNamespace,
  prefix: string
): Promise<void> {
  let cursor: string | undefined
  do {
    const list = await kv.list({ prefix, cursor })
    for (const key of list.keys) {
      await kv.delete(key.name)
    }
    cursor = list.list_complete ? undefined : list.cursor
  } while (cursor)
}