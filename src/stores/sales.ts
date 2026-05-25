import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getSales, getSale, createSale, cancelSale, getSalesByPeriod } from '@/services/saleService'
import type { Sale, CartItem, PaymentMethod, SaleStatus } from '@/types'

export const useSalesStore = defineStore('sales', () => {
  const sales = ref<Sale[]>([])
  const currentSale = ref<Sale | null>(null)
  const loading = ref(false)

  async function fetchSales() {
    loading.value = true
    try {
      sales.value = await getSales()
    } catch (e) {
      console.error('[sales] fetchSales:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchByPeriod(startDate: string, endDate: string, status?: SaleStatus) {
    loading.value = true
    try {
      sales.value = await getSalesByPeriod(startDate, endDate, status)
    } catch (e) {
      console.error('[sales] fetchByPeriod:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchSale(id: string) {
    currentSale.value = await getSale(id)
    return currentSale.value
  }

  async function create(params: {
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
  }) {
    loading.value = true
    try {
      const sale = await createSale(params)
      sales.value.unshift(sale)
      return sale
    } finally {
      loading.value = false
    }
  }

  async function cancel(id: string) {
    const sale = await cancelSale(id)
    const idx = sales.value.findIndex(s => s.id === id)
    if (idx !== -1) sales.value[idx] = sale
    return sale
  }

  return { sales, currentSale, loading, fetchSales, fetchSale, fetchByPeriod, create, cancel }
})
