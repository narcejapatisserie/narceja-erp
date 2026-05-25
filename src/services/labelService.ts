import { supabase } from './supabase'
import type { Label, LabelSize } from '@/types'

export async function getLabels() {
  const { data, error } = await supabase
    .from('labels')
    .select('*, product:products(id, name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Label[]
}

export async function createLabel(label: Omit<Label, 'id' | 'created_at' | 'updated_at' | 'print_count'>) {
  const { data, error } = await supabase.from('labels').insert(label).select().single()
  if (error) throw error
  return data as Label
}

export async function incrementPrintCount(id: string) {
  const { data: current } = await supabase.from('labels').select('print_count').eq('id', id).single()
  const { error } = await supabase.from('labels').update({
    print_count: (current?.print_count || 0) + 1,
    last_printed_at: new Date().toISOString()
  }).eq('id', id)
  if (error) throw error
}

export async function deleteLabel(id: string) {
  const { error } = await supabase.from('labels').delete().eq('id', id)
  if (error) throw error
}
