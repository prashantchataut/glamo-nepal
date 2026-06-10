export const CACHE_TTL = {
  BANNERS: 600,
  CATEGORIES: 1800,
  SETTINGS: 1800,
  POPUP: 600,
  PRODUCT: 300,
  PRODUCT_LIST: 300,
  BRANDS: 1800,
  BLOG_LIST: 300,
} as const

const memoryCache = new Map<string, { value: unknown; expires: number }>()

// Periodically clean up expired entries
const cleanupTimer = setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of Array.from(memoryCache.entries())) {
    if (entry.expires < now) {
      memoryCache.delete(key)
    }
  }
}, 60_000)
if (typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
  cleanupTimer.unref()
}

export async function getFromCache<T>(key: string): Promise<T | null> {
  const entry = memoryCache.get(key)
  if (!entry) return null
  if (entry.expires < Date.now()) {
    memoryCache.delete(key)
    return null
  }
  return entry.value as T
}

export async function setCache<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  memoryCache.set(key, { value, expires: Date.now() + ttlSeconds * 1000 })
}

export async function deleteCache(key: string): Promise<void> {
  memoryCache.delete(key)
}

export async function deleteCacheByPrefix(prefix: string): Promise<void> {
  for (const key of Array.from(memoryCache.keys())) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key)
    }
  }
}
