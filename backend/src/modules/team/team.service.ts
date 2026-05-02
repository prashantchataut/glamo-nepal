import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError, handleSupabaseError } from '../../utils/supabase'
import { createAuditLog } from '../../utils/audit'

export async function getTeamMembers(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) handleSupabaseError(error, 'getTeamMembers')
  return data
}

export async function createTeamMember(supabase: SupabaseClient, data: any, adminUserId: string) {
  const insertData: Record<string, any> = {
    name: data.name,
    role: data.role,
    bio: data.bio ?? null,
    image_url: data.imageUrl ?? null,
    sort_order: data.sortOrder ?? 0,
    is_active: true,
  }

  const { data: member, error } = await supabase
    .from('team_members')
    .insert(insertData)
    .select()
    .single()

  if (error) handleSupabaseError(error, 'createTeamMember')

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'CREATE',
    entity: 'team_member',
    entityId: member.id,
    changes: data,
  })

  return member
}

export async function updateTeamMember(supabase: SupabaseClient, id: string, data: any, adminUserId: string) {
  const updateData: Record<string, any> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.role !== undefined) updateData.role = data.role
  if (data.bio !== undefined) updateData.bio = data.bio
  if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl
  if (data.sortOrder !== undefined) updateData.sort_order = data.sortOrder

  const { data: member, error } = await supabase
    .from('team_members')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) handleSupabaseError(error, 'updateTeamMember')
  if (!member) throw new AppError('Team member not found', 404)

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'UPDATE',
    entity: 'team_member',
    entityId: id,
    changes: data,
  })

  return member
}

export async function deleteTeamMember(supabase: SupabaseClient, id: string, adminUserId: string) {
  const { data: existing, error: fetchError } = await supabase
    .from('team_members')
    .select('id')
    .eq('id', id)
    .single()

  if (fetchError) handleSupabaseError(fetchError, 'fetchTeamMemberForDelete')
  if (!existing) throw new AppError('Team member not found', 404)

  const { error } = await supabase
    .from('team_members')
    .update({ is_active: false })
    .eq('id', id)

  if (error) handleSupabaseError(error, 'deleteTeamMember')

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'DELETE',
    entity: 'team_member',
    entityId: id,
  })
}