import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CartItem, PaymentMethod } from '@/types'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const discountType = ref<'percent' | 'value' | undefined>(undefined)
  const discountValue = ref(0)
  const paymentMethod = ref<PaymentMethod>('cash')
  const amountPaid = ref(0)
  const customerName = ref('')
  const customerPhone = ref('')
  const notes = ref('')

  const subtotal = computed(() =>
    items.value.reduce((sum, item) => sum + item.total_price, 0)
  )

  const discountAmount = computed(() => {
    if (!discountType.value || discountValue.value <= 0) return 0
    if (discountType.value === 'percent') return subtotal.value * (discountValue.value / 100)
    return Math.min(discountValue.value, subtotal.value)
  })

  const total = computed(() => subtotal.value - discountAmount.value)

  const changeAmount = computed(() => Math.max(0, amountPaid.value - total.value))

  const totalItems = computed(() => items.value.reduce((sum, i) => sum + i.quantity, 0))

  const totalProfit = computed(() => items.value.reduce((sum, i) => sum + i.profit, 0))

  function addItem(item: Omit<CartItem, 'total_price' | 'profit'>) {
    const existing = items.value.find(i => i.product_id === item.product_id)
    if (existing) {
      existing.quantity += item.quantity
      existing.total_price = (existing.unit_price - existing.discount_value) * existing.quantity
      existing.profit = existing.total_price - (existing.cost_price * existing.quantity)
    } else {
      const total_price = (item.unit_price - item.discount_value) * item.quantity
      const profit = total_price - (item.cost_price * item.quantity)
      items.value.push({ ...item, total_price, profit })
    }
  }

  function removeItem(productId: string) {
    items.value = items.value.filter(i => i.product_id !== productId)
  }

  function updateQuantity(productId: string, quantity: number) {
    const item = items.value.find(i => i.product_id === productId)
    if (item) {
      if (quantity <= 0) {
        removeItem(productId)
      } else {
        item.quantity = quantity
        item.total_price = (item.unit_price - item.discount_value) * quantity
        item.profit = item.total_price - (item.cost_price * quantity)
      }
    }
  }

  function clearCart() {
    items.value = []
    discountType.value = undefined
    discountValue.value = 0
    paymentMethod.value = 'cash'
    amountPaid.value = 0
    customerName.value = ''
    customerPhone.value = ''
    notes.value = ''
  }

  return {
    items, discountType, discountValue, paymentMethod, amountPaid,
    customerName, customerPhone, notes,
    subtotal, discountAmount, total, changeAmount, totalItems, totalProfit,
    addItem, removeItem, updateQuantity, clearCart
  }
})
