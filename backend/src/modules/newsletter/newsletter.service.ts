import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '../../utils/supabase'
import { createAuditLog } from '../../utils/audit'

interface SubscriberRow {
  id: string
  email: string
  unsubscribe_token: string
  is_active: boolean
  subscribed_at: string
  unsubscribed_at: string | null
}

export async function subscribe(supabase: SupabaseClient, email: string, ip: string, kv: KVNamespace) {
  const rateLimitKey = `newsletter:subscribe:${ip}`
  const currentCount = await kv.get(rateLimitKey)
  const count = currentCount ? parseInt(currentCount, 10) : 0
  if (count >= 3) {
    throw new AppError('Too many subscription attempts. Please try again later.', 429, 'RATE_LIMITED')
  }

  const { data: existing, error: fetchError } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .eq('email', email)
    .single<SubscriberRow>()

  if (existing && existing.is_active) {
    return { message: 'Successfully subscribed' }
  }

  if (existing && !existing.is_active) {
    const { error: updateError } = await supabase
      .from('newsletter_subscribers')
      .update({ is_active: true, unsubscribed_at: null })
      .eq('id', existing.id)

    if (updateError) throw new AppError('Failed to subscribe', 500)
    return { message: 'Successfully subscribed' }
  }

  const { error: insertError } = await supabase
    .from('newsletter_subscribers')
    .insert({ email })

  if (insertError) {
    if (insertError.code === '23505') {
      return { message: 'Successfully subscribed' }
    }
    throw new AppError('Failed to subscribe', 500)
  }

  const newCount = count + 1
  await kv.put(rateLimitKey, String(newCount), { expirationTtl: 3600 })

  return { message: 'Successfully subscribed' }
}

export async function unsubscribe(supabase: SupabaseClient, token: string) {
  if (!token) {
    return { message: 'Unsubscribed successfully' }
  }

  const { data: subscriber, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .eq('unsubscribe_token', token)
    .single<SubscriberRow>()

  if (!subscriber || error) {
    return { message: 'Unsubscribed successfully' }
  }

  if (!subscriber.is_active) {
    return { message: 'Unsubscribed successfully' }
  }

  const { error: updateError } = await supabase
    .from('newsletter_subscribers')
    .update({ is_active: false, unsubscribed_at: new Date().toISOString() })
    .eq('id', subscriber.id)

  if (updateError) throw new AppError('Failed to unsubscribe', 500)

  return { message: 'Unsubscribed successfully' }
}

export async function getSubscribers(supabase: SupabaseClient, filters: { isActive?: boolean; page: number; limit: number }) {
  const { isActive, page, limit } = filters
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('newsletter_subscribers')
    .select('*', { count: 'exact' })
    .order('subscribed_at', { ascending: false })
    .range(from, to)

  if (isActive !== undefined) {
    query = query.eq('is_active', isActive)
  }

  const { data, error, count } = await query

  if (error) throw new AppError('Failed to fetch subscribers', 500)

  return {
    subscribers: data.map(formatSubscriber),
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  }
}

export async function exportSubscribers(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('email, is_active, subscribed_at, unsubscribed_at')
    .order('subscribed_at', { ascending: false })

  if (error) throw new AppError('Failed to export subscribers', 500)

  const header = 'email,is_active,subscribed_at,unsubscribed_at'
  const rows = (data as SubscriberRow[]).map(row =>
    `"${row.email}","${row.is_active}","${row.subscribed_at}","${row.unsubscribed_at || ''}"`
  )

  return [header, ...rows].join('\n')
}

export async function deleteSubscriber(supabase: SupabaseClient, id: string, adminUserId: string) {
  const { data: subscriber, error: fetchError } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .eq('id', id)
    .single<SubscriberRow>()

  if (!subscriber || fetchError) {
    throw new AppError('Subscriber not found', 404, 'NOT_FOUND')
  }

  const { error: deleteError } = await supabase
    .from('newsletter_subscribers')
    .delete()
    .eq('id', id)

  if (deleteError) throw new AppError('Failed to delete subscriber', 500)

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'DELETE',
    entity: 'newsletter_subscribers',
    entityId: id,
    changes: { email: subscriber.email },
  })

  return { message: 'Subscriber deleted successfully' }
}

function formatSubscriber(row: SubscriberRow) {
  return {
    id: row.id,
    email: row.email,
    unsubscribeToken: row.unsubscribe_token,
    isActive: row.is_active,
    subscribedAt: row.subscribed_at,
    unsubscribedAt: row.unsubscribed_at,
  }
}