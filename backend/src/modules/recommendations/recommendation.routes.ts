import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { validateQuery } from '../../middleware/validate'
import { recommendationQuerySchema, trendingQuerySchema } from './recommendation.schema'
import type { ZodSchema } from 'zod'
import { getRecommendations, getTrending } from './recommendation.controller'

const recommendationRoutes = new Hono<AppEnv>()

recommendationRoutes.get('/', validateQuery(recommendationQuerySchema as ZodSchema<any>), getRecommendations)
recommendationRoutes.get('/trending', validateQuery(trendingQuerySchema as ZodSchema<any>), getTrending)

export { recommendationRoutes }