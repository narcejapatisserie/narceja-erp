<template>
  <div v-if="loading" class="flex items-center justify-center py-20">
    <i class="pi pi-spin pi-spinner text-narceja-500 text-3xl"></i>
  </div>

  <div v-else-if="sale" class="max-w-3xl space-y-5">
    <div class="flex items-center gap-4">
      <RouterLink to="/vendas" class="btn-secondary p-2">
        <i class="pi pi-arrow-left"></i>
      </RouterLink>
      <div class="flex-1">
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">Venda #{{ sale.sale_number }}</h1>
        <p class="text-sm text-gray-500">{{ formatDateTime(sale.created_at) }}</p>
      </div>
      <span :class="['badge text-sm', sale.status === 'completed' ? 'badge-success' : sale.status === 'cancelled' ? 'badge-danger' : 'badge-warning']">
        {{ STATUS_LABELS[sale.status] }}
      </span>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="card p-4">
        <p class="text-xs text-gray-500 mb-1">Total</p>
        <p class="text-xl font-bold text-narceja-700 dark:text-narceja-400">{{ formatCurrency(sale.total) }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-gray-500 mb-1">Pagamento</p>
        <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ PAYMENT_LABELS[sale.payment_method] }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-gray-500 mb-1">Cliente</p>
        <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ sale.customer_name || 'Não informado' }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-gray-500 mb-1">Troco</p>
        <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ formatCurrency(sale.change_amount) }}</p>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="p-4 border-b border-gray-100 dark:border-gray-700">
        <h3 class="font-semibold text-gray-900 dark:text-white">Itens da Venda</h3>
      </div>
      <table class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-800/50">
          <tr class="text-left text-gray-500 dark:text-gray-400">
            <th class="px-4 py-3 font-medium">Produto</th>
            <th class="px-4 py-3 font-medium text-right">Qtd</th>
            <th class="px-4 py-3 font-medium text-right">Preço Unit.</th>
            <th class="px-4 py-3 font-medium text-right">Total</th>
            <th class="px-4 py-3 font-medium text-right hidden md:table-cell">Lucro</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr v-for="item in sale.items" :key="item.id">
            <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ item.product_name }}</td>
            <td class="px-4 py-3 text-right text-gray-600">{{ item.quantity }}</td>
            <td class="px-4 py-3 text-right text-gray-600">{{ formatCurrency(item.unit_price) }}</td>
            <td class="px-4 py-3 text-right font-semibold">{{ formatCurrency(item.total_price) }}</td>
            <td class="px-4 py-3 text-right hidden md:table-cell" :class="item.profit >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ formatCurrency(item.profit) }}
            </td>
          </tr>
        </tbody>
        <tfoot class="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            <td colspan="3" class="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Subtotal</td>
            <td class="px-4 py-3 text-right font-semibold">{{ formatCurrency(sale.subtotal) }}</td>
            <td class="hidden md:table-cell"></td>
          </tr>
          <tr v-if="sale.discount_amount > 0">
            <td colspan="3" class="px-4 py-3 text-right font-semibold text-red-500">Desconto</td>
            <td class="px-4 py-3 text-right font-semibold text-red-500">-{{ formatCurrency(sale.discount_amount) }}</td>
            <td class="hidden md:table-cell"></td>
          </tr>
          <tr>
            <td colspan="3" class="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">Total</td>
            <td class="px-4 py-3 text-right font-bold text-narceja-700 dark:text-narceja-400">{{ formatCurrency(sale.total) }}</td>
            <td class="hidden md:table-cell"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getSale } from '@/services/saleService'
import { formatCurrency, formatDateTime, PAYMENT_LABELS, STATUS_LABELS } from '@/utils/formatters'
import type { Sale } from '@/types'

const route = useRoute()
const sale = ref<Sale | null>(null)
const loading = ref(true)

onMounted(async () => {
  loading.value = true
  try {
    sale.value = await getSale(route.params.id as string)
  } finally {
    loading.value = false
  }
})
</script>
