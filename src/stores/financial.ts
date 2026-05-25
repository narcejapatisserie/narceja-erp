import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getTransactions, createTransaction, updateTransaction, deleteTransaction, payTransaction
} from '@/services/financialService'
import type { FinancialTransaction, TransactionType, AccountStatus } from '@/types'

export const useFinancialStore = defineStore('financial', () => {
  const transactions = ref<FinancialTransaction[]>([])
  const loading = ref(false)

  async function fetchTransactions(filters?: { type?: TransactionType; status?: AccountStatus; startDate?: string; endDate?: string }) {
    loading.value = true
    try {
      transactions.value = await getTransactions(filters)
    } catch (e) {
      console.error('[financial] fetchTransactions:', e)
    } finally {
      loading.value = false
    }
  }

  async function create(data: Omit<FinancialTransaction, 'id' | 'created_at' | 'updated_at'>) {
    const tx = await createTransaction(data)
    transactions.value.unshift(tx)
    return tx
  }

  async function update(id: string, data: Partial<FinancialTransaction>) {
    const tx = await updateTransaction(id, data)
    const idx = transactions.value.findIndex(t => t.id === id)
    if (idx !== -1) transactions.value[idx] = tx
    return tx
  }

  async function remove(id: string) {
    await deleteTransaction(id)
    transactions.value = transactions.value.filter(t => t.id !== id)
  }

  async function pay(id: string, paymentDate: string, paymentMethod: string) {
    const tx = await payTransaction(id, paymentDate, paymentMethod)
    const idx = transactions.value.findIndex(t => t.id === id)
    if (idx !== -1) transactions.value[idx] = tx
    return tx
  }

  return { transactions, loading, fetchTransactions, create, update, remove, pay }
})
