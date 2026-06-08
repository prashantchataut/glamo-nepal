import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { contactRateLimit } from '../../middleware/rateLimit'
import { validateBody } from '../../middleware/validate'
import { contactFormSchema } from './contact.schema'
import { submitContactForm } from './contact.controller'

const contactRoutes = new Hono<AppEnv>()

contactRoutes.post('/', contactRateLimit, validateBody(contactFormSchema), submitContactForm)

export { contactRoutes }