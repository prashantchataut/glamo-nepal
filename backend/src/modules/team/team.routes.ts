import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/auth'
import { requireRole } from '../../middleware/requireRole'
import { validateBody } from '../../middleware/validate'
import { createTeamMemberSchema, updateTeamMemberSchema } from './team.schema'
import {
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from './team.controller'

const teamRoutes = new Hono<AppEnv>()

teamRoutes.get('/', getTeamMembers)
teamRoutes.post('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(createTeamMemberSchema), createTeamMember)
teamRoutes.patch('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(updateTeamMemberSchema), updateTeamMember)
teamRoutes.delete('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), deleteTeamMember)

export { teamRoutes }