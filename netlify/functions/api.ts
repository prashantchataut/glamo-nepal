import { handle } from 'hono/netlify'
import app from '../../backend/src/index'

export default handle(app)

export const config = {
  path: '/api/*',
}