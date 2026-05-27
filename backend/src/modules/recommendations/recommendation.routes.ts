import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { validateQuery } from '../../middleware/validate'
import { recommendationQuerySchema, trendingQuerySchema } from './recommendation.schema'
import { getRecommendations, getTrending } from './recommendation.controller'

const recommendationRoutes = new Hono<AppEnv>()

recommendationRoutes.get('/', validateQuery(recommendationQuerySchema), getRecommendations)
recommendationRoutes.get('/trending', validateQuery(trendingQuerySchema), getTrending)

export { recommendationRoutes }