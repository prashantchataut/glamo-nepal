import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/firebase-auth'
import { validateBody } from '../../middleware/validate'
import { authRateLimit, passwordResetRateLimit } from '../../middleware/rateLimit'
import { registerSchema, forgotPasswordSchema, resetPasswordSchema, sendVerificationSchema, verifyEmailSchema } from './auth.schema'
import { register, findOrCreateUser, getMe, updateProfile, logout, forgotPassword, resetPassword, sendVerificationEmailController, verifyEmailController } from './auth.controller'

const authRoutes = new Hono<AppEnv>()

authRoutes.post('/register', authRateLimit, validateBody(registerSchema), register)
authRoutes.post('/sync', authMiddleware, findOrCreateUser)
authRoutes.post('/logout', logout)
authRoutes.get('/me', authMiddleware, getMe)
authRoutes.patch('/me', authMiddleware, validateBody(registerSchema.partial()), updateProfile)
authRoutes.post('/forgot-password', passwordResetRateLimit, validateBody(forgotPasswordSchema), forgotPassword)
authRoutes.post('/reset-password', passwordResetRateLimit, validateBody(resetPasswordSchema), resetPassword)
authRoutes.post('/send-verification', passwordResetRateLimit, validateBody(sendVerificationSchema), sendVerificationEmailController)
authRoutes.post('/verify-email', validateBody(verifyEmailSchema), verifyEmailController)

export { authRoutes }