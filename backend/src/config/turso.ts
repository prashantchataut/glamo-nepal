import { createClient as createWebClient } from '@libsql/client/web'
import type { Client } from '@libsql/client/web'

export type TursoClient = Client

export function createTursoClient(url: string, authToken: string): TursoClient {
  return createWebClient({ url, authToken }) as TursoClient
}