import { Hono } from 'hono'
import { handle } from 'hono/netlify'
import app from '../src/index'

export default handle(app)

export const config = {
  path: '/api/*',
}