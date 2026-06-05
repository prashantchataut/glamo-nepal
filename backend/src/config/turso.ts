import { createClient, type Client } from '@libsql/client'

export type TursoClient = Client

export function createTursoClient(url: string, authToken: string): TursoClient {
  return createClient({
    url,
    authToken,
  })
}