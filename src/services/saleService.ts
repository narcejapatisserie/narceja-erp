import { supabase } from './supabase'
import type { Sale, SaleItem, CartItem, PaymentMethod } from '@/types'

export async function getSales(limit = 50) {
  const { data, error } = await supabase
    .from('sales')
    .select('*, items:sale_items(*)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as Sale[]
}

export async function getSale(id: string) {
  const { data, error } = await supabase
    .from('sales')
    .select('*, items:sale_items(*, product:products(id, name, image_url))')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Sale
}

export async function createSale(params: {
  items: CartItem[]
  customerName?: string
  customerPhone?: string
  discountType?: 'percent' | 'value'
  discountValue: number
  discountAmount: number
  subtotal: number
  total: number
  paymentMethod: PaymentMethod
  amountPaid: number
  changeAmount: number
  notes?: string
  soldBy?: string
}): Promise<Sale> {
  // Inserir com status 'open' para que o trigger AFTER UPDATE possa detectar a transição open→completed
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert({
      status: 'open',
      customer_name: params.customerName,
      customer_phone: params.customerPhone,
      subtotal: params.subtotal,
      discount_type: params.discountType,
      discount_value: params.discountValue,
      discount_amount: params.discountAmount,
      total: params.total,
      payment_method: params.paymentMethod,
      amount_paid: params.amountPaid,
      change_amount: params.changeAmount,
      notes: params.notes,
      sold_by: params.soldBy,
    })
    .select()
    .single()
  if (saleError) throw saleError

  const saleItems: Omit<SaleItem, 'id' | 'created_at'>[] = params.items.map(item => ({
    sale_id: sale.id,
    product_id: item.product_id,
    product_name: item.product_name,
    product_barcode: item.product_barcode,
    quantity: item.quantity,
    unit_price: item.unit_price,
    cost_price: item.cost_price,
    discount_value: item.discount_value,
    total_price: item.total_price,
    total_cost: item.cost_price * item.quantity,
    profit: item.profit,
  }))

  const { error: itemsError } = await supabase.from('sale_items').insert(saleItems)
  if (itemsError) {
    // Rollback: deletar a venda órfã
    await supabase.from('sales').delete().eq('id', sale.id)
    throw itemsError
  }

  // Transição open → completed dispara o trigger que baixa estoque e gera financeiro
  const { data: completedSale, error: updateError } = await supabase
    .from('sales')
    .update({ status: 'completed' })
    .eq('id', sale.id)
    .select()
    .single()
  if (updateError) {
    await supabase.from('sales').delete().eq('id', sale.id)
    throw updateError
  }

  return completedSale as Sale
}

export async function cancelSale(id: string) {
  const { data, error } = await supabase
    .from('sales')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Sale
}

export async function getSalesByPeriod(startDate: string, endDate: string, status?: string) {
  let query = supabase
    .from('sales')
    .select('*, items:sale_items(*)')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw error
  return data as Sale[]
}
