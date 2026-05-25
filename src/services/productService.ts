import { supabase } from './supabase'
import type { Product } from '@/types'

export async function getProducts(onlyActive = true) {
  let query = supabase.from('products').select('*').order('name')
  if (onlyActive) query = query.eq('is_active', true)
  const { data, error } = await query
  if (error) throw error
  return data as Product[]
}

export async function getProduct(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Product
}

export async function createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'cost_price' | 'margin_percent' | 'profit_value'>) {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single()
  if (error) throw error
  return data as Product
}

export async function updateProduct(id: string, product: Partial<Product>) {
  const { data, error } = await supabase
    .from('products')
    .update(product)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Product
}

export async function deleteProduct(id: string) {
  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', id)
  if (error) throw error
}

export async function uploadProductImage(file: File, productId: string): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `products/${productId}.${ext}`
  const { error } = await supabase.storage.from('products').upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('products').getPublicUrl(path)
  return data.publicUrl
}

export async function getLowStockProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .filter('stock_quantity', 'lte', 'min_stock')
  if (error) throw error
  return data as Product[]
}
