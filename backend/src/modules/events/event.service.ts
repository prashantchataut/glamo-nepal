import type { SupabaseClient } from '@supabase/supabase-js'
import { handleSupabaseError } from '../../utils/supabase'

interface EventItem {
  type: string
  entity_id?: string
  metadata?: Record<string, unknown>
  timestamp?: string
}

export async function trackEvents(
  sessionId: string,
  userId: string | undefined,
  events: EventItem[],
  supabase: SupabaseClient
) {
  const eventsJson = events.map((evt) => ({
    type: evt.type,
    entity_id: evt.entity_id || null,
    session_id: sessionId,
    user_id: userId || null,
    metadata: evt.metadata || {},
    timestamp: evt.timestamp || new Date().toISOString(),
  }))

  const { error } = await supabase.rpc('track_events', {
    p_events: eventsJson,
  })

  if (error) handleSupabaseError(error, 'trackEvents')
}