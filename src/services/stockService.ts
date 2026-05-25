import { supabase } from './supabase'
import type { StockMovement, MovementReason } from '@/types'

export async function getStockMovements(entityType?: 'product' | 'raw_material', entityId?: string, limit = 100) {
  let query = supabase
    .from('stock_movements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (entityType) query = query.eq('entity_type', entityType)
  if (entityId) query = query.eq('entity_id', entityId)

  const { data, error } = await query
  if (error) throw error
  return data as StockMovement[]
}

export async function addProductStockMovement(params: {
  productId: string
  movementType: 'in' | 'out' | 'adjustment'
  reason: MovementReason
  quantity: number
  currentStock: number
  unitCost?: number
  notes?: string
  userId?: string
}) {
  const quantityAfter = params.movementType === 'in'
    ? params.currentStock + params.quantity
    : params.movementType === 'out'
    ? params.currentStock - params.quantity
    : params.quantity

  const { error: moveError } = await supabase.from('stock_movements').insert({
    entity_type: 'product',
    entity_id: params.productId,
    movement_type: params.movementType,
    reason: params.reason,
    quantity: params.quantity,
    quantity_before: params.currentStock,
    quantity_after: quantityAfter,
    unit_cost: params.unitCost,
    notes: params.notes,
    created_by: params.userId,
  })
  if (moveError) throw moveError

  const { error: updateError } = await supabase
    .from('products')
    .update({ stock_quantity: quantityAfter })
    .eq('id', params.productId)
  if (updateError) throw updateError
}
