import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { ApiResponse } from '../../utils/response'
import { AppError } from '../../utils/turso-helpers'
import * as PopupService from './popup.service'

export async function getActivePopup(c: Context<AppEnv>) {
  try {
    const db = c.get('db')
    const result = await PopupService.getActivePopup(db)
    return ApiResponse.success(c, 'Active popup fetched', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch active popup', 500)
  }
}

export async function getAllPopups(c: Context<AppEnv>) {
  try {
    const db = c.get('db')
    const result = await PopupService.getAllPopups(db)
    return ApiResponse.success(c, 'Popups fetched', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch popups', 500)
  }
}

export async function getPopupById(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const db = c.get('db')
    const result = await PopupService.getPopupById(db, id)
    return ApiResponse.success(c, 'Popup fetched', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch popup', 500)
  }
}

export async function createPopup(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const db = c.get('db')
    const user = c.get('user')
    const result = await PopupService.createPopup(db, data, user.id)
    return ApiResponse.success(c, 'Popup created', result, 201)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to create popup', 500)
  }
}

export async function updatePopup(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const data = c.get('validatedBody')
    const db = c.get('db')
    const user = c.get('user')
    const result = await PopupService.updatePopup(db, id, data, user.id)
    return ApiResponse.success(c, 'Popup updated', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to update popup', 500)
  }
}

export async function deletePopup(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const db = c.get('db')
    const user = c.get('user')
    await PopupService.deletePopup(db, id, user.id)
    return ApiResponse.success(c, 'Popup deleted', null)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to delete popup', 500)
  }
}