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

function cleanupMemoryCache(): void {
  const now = Date.now()
  for (const [key, entry] of Array.from(memoryCache.entries())) {
    if (entry.expires < now) {
      memoryCache.delete(key)
    }
  }
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
  if (memoryCache.size > 10000) {
    cleanupMemoryCache()
  }
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

// Redis-backed cache functions for use within Hono request context
// These check Redis first, then fall back to memory cache
export async function getFromCacheWithRedis<T>(
  key: string,
  redisUrl: string,
  redisToken: string,
): Promise<T | null> {
  try {
    const res = await fetch(`${redisUrl}/get/${key}`, {
      headers: { Authorization: `Bearer ${redisToken}` },
    })
    if (res.ok) {
      const data = await res.json() as { result: string | null }
      if (data.result) return JSON.parse(data.result) as T
    }
  } catch {
    // Redis read failure is non-critical
  }
  return getFromCache<T>(key)
}

export async function setCacheWithRedis<T>(
  key: string,
  value: T,
  ttlSeconds: number,
  redisUrl: string,
  redisToken: string,
): Promise<void> {
  await setCache(key, value, ttlSeconds)
  try {
    await fetch(`${redisUrl}/set/${key}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${redisToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([JSON.stringify(value), 'EX', String(ttlSeconds)]),
    })
  } catch {
    // Redis write failure is non-critical
  }
}

export async function deleteCacheWithRedis(
  key: string,
  redisUrl: string,
  redisToken: string,
): Promise<void> {
  await deleteCache(key)
  try {
    await fetch(`${redisUrl}/del/${key}`, {
      headers: { Authorization: `Bearer ${redisToken}` },
    })
  } catch {
    // Non-critical
  }
}

export async function deleteCacheByPrefixWithRedis(
  prefix: string,
  redisUrl: string,
  redisToken: string,
): Promise<void> {
  await deleteCacheByPrefix(prefix)
  try {
    const res = await fetch(`${redisUrl}/keys/${prefix}*`, {
      headers: { Authorization: `Bearer ${redisToken}` },
    })
    if (res.ok) {
      const data = await res.json() as { result: string[] | null }
      if (data.result && data.result.length > 0) {
        await fetch(`${redisUrl}/del/${data.result.join('/')}`, {
          headers: { Authorization: `Bearer ${redisToken}` },
        })
      }
    }
  } catch {
    // Non-critical
  }
}