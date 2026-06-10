import { z } from 'zod'

const eventTypeSchema = z.enum([
  'product_view',
  'add_to_cart',
  'wishlist_toggle',
  'search_query',
  'category_view',
  'checkout_start',
  'purchase_success',
])

const eventItemSchema = z.object({
  type: eventTypeSchema,
  entity_id: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string().optional(),
})

export const trackEventsSchema = z.object({
  session_id: z.string().min(1).max(128),
  user_id: z.string().min(1).max(128).optional(),
  events: z.array(eventItemSchema).min(1).max(50),
})

export type TrackEventsInput = z.infer<typeof trackEventsSchema>
export type EventItemInput = z.infer<typeof eventItemSchema>