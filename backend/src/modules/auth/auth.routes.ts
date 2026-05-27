import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/auth'
import { validateBody } from '../../middleware/validate'
import { authRateLimit, passwordResetRateLimit } from '../../middleware/rateLimit'
import { registerSchema, loginSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schema'
import { register, login, refreshToken, logout, forgotPassword, resetPassword, getMe } from './auth.controller'

const authRoutes = new Hono<AppEnv>()

authRoutes.post('/register', authRateLimit, validateBody(registerSchema), register)
authRoutes.post('/login', authRateLimit, validateBody(loginSchema), login)
authRoutes.post('/refresh', validateBody(refreshTokenSchema), refreshToken)
authRoutes.post('/forgot-password', passwordResetRateLimit, validateBody(forgotPasswordSchema), forgotPassword)
authRoutes.post('/reset-password', passwordResetRateLimit, validateBody(resetPasswordSchema), resetPassword)
authRoutes.post('/logout', logout)
authRoutes.get('/me', authMiddleware, getMe)

export { authRoutes }