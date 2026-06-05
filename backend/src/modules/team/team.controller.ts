import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { ApiResponse } from '../../utils/response'
import { AppError } from '../../utils/turso-helpers'
import * as TeamService from './team.service'

export async function getTeamMembers(c: Context<AppEnv>) {
  try {
    const db = c.get('db')
    const result = await TeamService.getTeamMembers(db)
    return ApiResponse.success(c, 'Team members fetched', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch team members', 500)
  }
}

export async function createTeamMember(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const db = c.get('db')
    const user = c.get('user')
    const result = await TeamService.createTeamMember(db, data, user.id)
    return ApiResponse.success(c, 'Team member created', result, 201)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to create team member', 500)
  }
}

export async function updateTeamMember(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const data = c.get('validatedBody')
    const db = c.get('db')
    const user = c.get('user')
    const result = await TeamService.updateTeamMember(db, id, data, user.id)
    return ApiResponse.success(c, 'Team member updated', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to update team member', 500)
  }
}

export async function deleteTeamMember(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const db = c.get('db')
    const user = c.get('user')
    await TeamService.deleteTeamMember(db, id, user.id)
    return ApiResponse.success(c, 'Team member deleted', null)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to delete team member', 500)
  }
}