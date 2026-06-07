import { createClient } from '@libsql/client/web'
import type { Client } from '@libsql/client/web'

export type TursoClient = Client

export function createTursoClient(url: string, authToken: string): TursoClient {
  return createClient({
    url,
    authToken,
  })
}
