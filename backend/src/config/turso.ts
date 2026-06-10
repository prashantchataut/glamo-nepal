import { createClient as createWebClient } from '@libsql/client/web'
import type { Client } from '@libsql/client/web'

export type TursoClient = Client

const clientCache = new Map<string, TursoClient>()

function isLocalUrl(url: string): boolean {
  return url.startsWith('file:') || url === ':memory:'
}

export function createTursoClient(url: string, authToken: string): TursoClient {
  const cacheKey = `${url}::${authToken}`
  const cached = clientCache.get(cacheKey)
  if (cached) return cached

  let client: TursoClient
  if (isLocalUrl(url)) {
    const { createRequire } = require('node:module') as typeof import('node:module')
    const nodeRequire = createRequire(`${process.cwd()}/package.json`)
    const { createClient } = nodeRequire('@libsql/client') as typeof import('@libsql/client')
    client = createClient({ url })
  } else {
    client = createWebClient({ url, authToken }) as TursoClient
  }

  clientCache.set(cacheKey, client)
  return client
}