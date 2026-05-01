import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/auth'
import { validateBody } from '../../middleware/validate'
import { authRateLimit, passwordResetRateLimit } from '../../middleware/rateLimit'
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from './auth.schema'
import {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  googleOAuthGetUrl,
  googleOAuthCallback,
  getMe,
} from './auth.controller'

const authRoutes = new Hono<AppEnv>()

authRoutes.post('/register', authRateLimit, validateBody(registerSchema), register)
authRoutes.post('/login', authRateLimit, validateBody(loginSchema), login)
authRoutes.post('/logout', logout)
authRoutes.post('/refresh-token', refreshToken)
authRoutes.get('/verify-email/:token', verifyEmail)
authRoutes.post('/forgot-password', passwordResetRateLimit, validateBody(forgotPasswordSchema), forgotPassword)
authRoutes.post('/reset-password', validateBody(resetPasswordSchema), resetPassword)
authRoutes.get('/google', googleOAuthGetUrl)
authRoutes.get('/google/callback', googleOAuthCallback)
authRoutes.get('/me', authMiddleware, getMe)
authRoutes.post('/change-password', authMiddleware, validateBody(changePasswordSchema), changePassword)

export { authRoutes }