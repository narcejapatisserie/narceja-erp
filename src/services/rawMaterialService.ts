import { supabase } from './supabase'
import type { RawMaterial, StockMovement, MovementReason } from '@/types'

export async function getRawMaterials(onlyActive = true) {
  let query = supabase.from('raw_materials').select('*, supplier:suppliers(id, name)').order('name')
  if (onlyActive) query = query.eq('is_active', true)
  const { data, error } = await query
  if (error) throw error
  return data as RawMaterial[]
}

export async function getRawMaterial(id: string) {
  const { data, error } = await supabase
    .from('raw_materials')
    .select('*, supplier:suppliers(id, name)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as RawMaterial
}

export async function createRawMaterial(rm: Omit<RawMaterial, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase.from('raw_materials').insert(rm).select().single()
  if (error) throw error
  return data as RawMaterial
}

export async function updateRawMaterial(id: string, rm: Partial<RawMaterial>) {
  const { data, error } = await supabase.from('raw_materials').update(rm).eq('id', id).select().single()
  if (error) throw error
  return data as RawMaterial
}

export async function deleteRawMaterial(id: string) {
  const { error } = await supabase.from('raw_materials').update({ is_active: false }).eq('id', id)
  if (error) throw error
}

export async function addStockMovement(params: {
  entityId: string
  movementType: 'in' | 'out' | 'adjustment'
  reason: MovementReason
  quantity: number
  currentStock: number
  unitCost?: number
  batch?: string
  expirationDate?: string
  notes?: string
  userId?: string
}) {
  const quantityAfter = params.movementType === 'in'
    ? params.currentStock + params.quantity
    : params.movementType === 'out'
    ? params.currentStock - params.quantity
    : params.quantity

  const { error: moveError } = await supabase.from('stock_movements').insert({
    entity_type: 'raw_material',
    entity_id: params.entityId,
    movement_type: params.movementType,
    reason: params.reason,
    quantity: params.quantity,
    quantity_before: params.currentStock,
    quantity_after: quantityAfter,
    unit_cost: params.unitCost,
    total_cost: params.unitCost ? params.unitCost * params.quantity : undefined,
    batch: params.batch,
    expiration_date: params.expirationDate,
    notes: params.notes,
    created_by: params.userId,
  })
  if (moveError) throw moveError

  const { error: updateError } = await supabase
    .from('raw_materials')
    .update({ stock_quantity: quantityAfter })
    .eq('id', params.entityId)
  if (updateError) throw updateError
}

export async function getExpiringMaterials() {
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  const { data, error } = await supabase
    .from('raw_materials')
    .select('*')
    .eq('is_active', true)
    .not('expiration_date', 'is', null)
    .lte('expiration_date', thirtyDaysFromNow.toISOString().split('T')[0])
    .order('expiration_date')
  if (error) throw error
  return data as RawMaterial[]
}
