import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/firebase-auth'
import { validateBody } from '../../middleware/validate'
import { authRateLimit } from '../../middleware/rateLimit'
import { registerSchema } from './auth.schema'
import { register, findOrCreateUser, getMe, updateProfile, logout } from './auth.controller'

const authRoutes = new Hono<AppEnv>()

authRoutes.post('/register', authRateLimit, validateBody(registerSchema), register)
authRoutes.post('/sync', authMiddleware, findOrCreateUser)
authRoutes.post('/logout', logout)
authRoutes.get('/me', authMiddleware, getMe)
authRoutes.patch('/me', authMiddleware, validateBody(registerSchema.partial()), updateProfile)

export { authRoutes }