export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleSupabaseError(error: any, context: string): never {
  console.error(`Supabase error in ${context}:`, error)
  throw new AppError(
    error.message || 'Database operation failed',
    error.code === '23505' ? 409 : 500,
    error.code
  )
}

export function assertSingle<T>(data: T[] | null, entity: string): T {
  if (!data || data.length === 0) {
    throw new AppError(`${entity}_NOT_FOUND`, 404)
  }
  if (data.length > 1) {
    throw new AppError(`Multiple ${entity} found`, 500)
  }
  return data[0]
}

export function sanitizeUser(user: Record<string, unknown>) {
  const safe = { ...user }
  delete safe.password_hash
  delete safe.refresh_token
  return safe
}