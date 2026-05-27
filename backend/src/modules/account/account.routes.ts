import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/auth'
import { validateBody } from '../../middleware/validate'
import { updateProfileSchema, createAddressSchema, updateAddressSchema } from './account.schema'
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from './account.controller'

const accountRoutes = new Hono<AppEnv>()

accountRoutes.get('/profile', authMiddleware, getProfile)
accountRoutes.patch('/profile', authMiddleware, validateBody(updateProfileSchema), updateProfile)
accountRoutes.post('/avatar', authMiddleware, uploadAvatar)
accountRoutes.get('/addresses', authMiddleware, getAddresses)
accountRoutes.post('/addresses', authMiddleware, validateBody(createAddressSchema), createAddress)
accountRoutes.patch('/addresses/:id', authMiddleware, validateBody(updateAddressSchema), updateAddress)
accountRoutes.delete('/addresses/:id', authMiddleware, deleteAddress)
accountRoutes.patch('/addresses/:id/default', authMiddleware, setDefaultAddress)

export { accountRoutes }