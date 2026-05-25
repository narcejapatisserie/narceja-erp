import { supabase } from './supabase'
import type { Supplier } from '@/types'

export async function getSuppliers(onlyActive = true) {
  let query = supabase.from('suppliers').select('*').order('name')
  if (onlyActive) query = query.eq('is_active', true)
  const { data, error } = await query
  if (error) throw error
  return data as Supplier[]
}

export async function getSupplier(id: string) {
  const { data, error } = await supabase.from('suppliers').select('*').eq('id', id).single()
  if (error) throw error
  return data as Supplier
}

export async function createSupplier(supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase.from('suppliers').insert(supplier).select().single()
  if (error) throw error
  return data as Supplier
}

export async function updateSupplier(id: string, supplier: Partial<Supplier>) {
  const { data, error } = await supabase.from('suppliers').update(supplier).eq('id', id).select().single()
  if (error) throw error
  return data as Supplier
}

export async function deleteSupplier(id: string) {
  const { error } = await supabase.from('suppliers').update({ is_active: false }).eq('id', id)
  if (error) throw error
}
