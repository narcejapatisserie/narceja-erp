import { supabase } from './supabase'
import type { FinancialTransaction, TransactionType, TransactionCategory, AccountStatus } from '@/types'

export async function getTransactions(filters?: {
  type?: TransactionType
  status?: AccountStatus
  startDate?: string
  endDate?: string
  category?: TransactionCategory
}) {
  let query = supabase
    .from('financial_transactions')
    .select('*, supplier:suppliers(id, name)')
    .order('due_date', { ascending: false })

  if (filters?.type) query = query.eq('type', filters.type)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.category) query = query.eq('category', filters.category)
  if (filters?.startDate) query = query.gte('due_date', filters.startDate)
  if (filters?.endDate) query = query.lte('due_date', filters.endDate)

  const { data, error } = await query
  if (error) throw error
  return data as FinancialTransaction[]
}

export async function getTransaction(id: string) {
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*, supplier:suppliers(id, name)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as FinancialTransaction
}

export async function createTransaction(tx: Omit<FinancialTransaction, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase.from('financial_transactions').insert(tx).select().single()
  if (error) throw error
  return data as FinancialTransaction
}

export async function updateTransaction(id: string, tx: Partial<FinancialTransaction>) {
  const { data, error } = await supabase.from('financial_transactions').update(tx).eq('id', id).select().single()
  if (error) throw error
  return data as FinancialTransaction
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase.from('financial_transactions').delete().eq('id', id)
  if (error) throw error
}

export async function payTransaction(id: string, paymentDate: string, paymentMethod: string) {
  const { data, error } = await supabase
    .from('financial_transactions')
    .update({ status: 'paid', payment_date: paymentDate, payment_method: paymentMethod })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as FinancialTransaction
}

export async function getDashboardKpis() {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const todayStart = `${today}T00:00:00.000Z`
  const todayEnd = `${today}T23:59:59.999Z`
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  const [incomeResult, expenseResult, todaySalesResult, monthSalesResult] = await Promise.all([
    supabase
      .from('financial_transactions')
      .select('amount')
      .eq('type', 'income')
      .eq('status', 'paid')
      .gte('payment_date', monthStart)
      .lte('payment_date', monthEnd),
    supabase
      .from('financial_transactions')
      .select('amount')
      .eq('type', 'expense')
      .eq('status', 'paid')
      .gte('payment_date', monthStart)
      .lte('payment_date', monthEnd),
    supabase
      .from('sales')
      .select('id, total')
      .eq('status', 'completed')
      .gte('created_at', todayStart)
      .lte('created_at', todayEnd),
    supabase
      .from('sales')
      .select('id, total')
      .eq('status', 'completed')
      .gte('created_at', `${monthStart}T00:00:00.000Z`)
      .lte('created_at', `${monthEnd}T23:59:59.999Z`),
  ])

  const revenue_month = (incomeResult.data || []).reduce((sum, t) => sum + Number(t.amount), 0)
  const expenses_month = (expenseResult.data || []).reduce((sum, t) => sum + Number(t.amount), 0)
  const todaySales = todaySalesResult.data || []
  const monthSales = monthSalesResult.data || []

  return {
    revenue_today: todaySales.reduce((sum, s) => sum + Number(s.total), 0),
    revenue_month,
    expenses_month,
    profit_month: revenue_month - expenses_month,
    sales_count_today: todaySales.length,
    sales_count_month: monthSales.length,
  }
}

export async function getCashFlow(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .gte('due_date', startDate)
    .lte('due_date', endDate)
    .order('due_date')
  if (error) throw error
  return data as FinancialTransaction[]
}

// Busca vendas por período agrupadas por dia (1 query)
export async function getSalesByDayRange(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('sales')
    .select('id, total, created_at')
    .eq('status', 'completed')
    .gte('created_at', `${startDate}T00:00:00.000Z`)
    .lte('created_at', `${endDate}T23:59:59.999Z`)
    .order('created_at')
  if (error) throw error
  return data || []
}
