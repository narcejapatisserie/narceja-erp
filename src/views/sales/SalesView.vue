<template>
  <div class="space-y-5">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <h1 class="text-xl font-bold text-gray-900 dark:text-white">Vendas</h1>
      <RouterLink to="/pdv" class="btn-primary flex items-center gap-2">
        <i class="pi pi-shopping-cart"></i> Ir para PDV
      </RouterLink>
    </div>

    <!-- Filtros -->
    <div class="card p-4 flex flex-col sm:flex-row gap-3">
      <input v-model="filterStart" type="date" class="input sm:w-44" />
      <input v-model="filterEnd" type="date" class="input sm:w-44" />
      <select v-model="filterStatus" class="input sm:w-40">
        <option value="">Todos os status</option>
        <option value="completed">Concluída</option>
        <option value="cancelled">Cancelada</option>
        <option value="refunded">Estornada</option>
      </select>
      <button @click="loadSales" class="btn-primary px-4">Filtrar</button>
      <button @click="loadSales" :disabled="store.loading" class="btn-secondary px-3" v-tooltip="'Recarregar'">
        <i :class="['pi', store.loading ? 'pi-spin pi-spinner' : 'pi-refresh']"></i>
      </button>
    </div>

    <!-- KPIs do período -->
    <div class="grid grid-cols-3 gap-4">
      <div class="card p-4 text-center">
        <p class="text-xs text-gray-500 mb-1">Total do Período</p>
        <p class="text-xl font-bold text-narceja-700 dark:text-narceja-400">{{ formatCurrency(periodTotal) }}</p>
      </div>
      <div class="card p-4 text-center">
        <p class="text-xs text-gray-500 mb-1">Quantidade</p>
        <p class="text-xl font-bold text-gray-900 dark:text-white">{{ periodSales }}</p>
      </div>
      <div class="card p-4 text-center">
        <p class="text-xs text-gray-500 mb-1">Ticket Médio</p>
        <p class="text-xl font-bold text-gray-900 dark:text-white">{{ formatCurrency(avgTicket) }}</p>
      </div>
    </div>

    <!-- Tabela -->
    <div class="card overflow-hidden">
      <div v-if="store.loading && store.sales.length === 0" class="flex items-center justify-center py-16">
        <i class="pi pi-spin pi-spinner text-narceja-500 text-3xl"></i>
      </div>
      <div v-else-if="store.sales.length === 0" class="flex flex-col items-center justify-center py-16 text-gray-400">
        <i class="pi pi-receipt text-4xl mb-3"></i>
        <p>Nenhuma venda no período</p>
      </div>
      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-800/50">
          <tr class="text-left text-gray-500 dark:text-gray-400">
            <th class="px-4 py-3 font-medium">#</th>
            <th class="px-4 py-3 font-medium">Data</th>
            <th class="px-4 py-3 font-medium hidden md:table-cell">Cliente</th>
            <th class="px-4 py-3 font-medium hidden lg:table-cell">Pagamento</th>
            <th class="px-4 py-3 font-medium text-right">Total</th>
            <th class="px-4 py-3 font-medium text-center">Status</th>
            <th class="px-4 py-3 font-medium text-center">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr v-for="sale in store.sales" :key="sale.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/30">
            <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">#{{ sale.sale_number }}</td>
            <td class="px-4 py-3 text-gray-500 text-xs">{{ formatDateTime(sale.created_at) }}</td>
            <td class="px-4 py-3 text-gray-600 dark:text-gray-400 hidden md:table-cell">{{ sale.customer_name || '-' }}</td>
            <td class="px-4 py-3 hidden lg:table-cell">
              <span class="badge-gray badge capitalize">{{ PAYMENT_LABELS[sale.payment_method] || sale.payment_method }}</span>
            </td>
            <td class="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">{{ formatCurrency(sale.total) }}</td>
            <td class="px-4 py-3 text-center">
              <span :class="['badge', sale.status === 'completed' ? 'badge-success' : sale.status === 'cancelled' ? 'badge-danger' : 'badge-warning']">
                {{ STATUS_LABELS[sale.status] }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-center gap-1">
                <RouterLink :to="`/vendas/${sale.id}`" class="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors" v-tooltip="'Ver detalhes'">
                  <i class="pi pi-eye text-sm"></i>
                </RouterLink>
                <button
                  v-if="sale.status === 'completed'"
                  @click="handleCancel(sale)"
                  class="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"
                  v-tooltip="'Cancelar venda'"
                >
                  <i class="pi pi-times text-sm"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSalesStore } from '@/stores/sales'
import { formatCurrency, formatDateTime, PAYMENT_LABELS, STATUS_LABELS } from '@/utils/formatters'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import type { Sale, SaleStatus } from '@/types'

const store = useSalesStore()
const toast = useToast()
const confirm = useConfirm()

const today = new Date().toISOString().split('T')[0]
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
const filterStart = ref(monthStart)
const filterEnd = ref(today)
const filterStatus = ref<SaleStatus | ''>('')

const completedSales = computed(() => store.sales.filter(s => s.status === 'completed'))
const periodTotal = computed(() => completedSales.value.reduce((sum, s) => sum + s.total, 0))
const periodSales = computed(() => completedSales.value.length)
const avgTicket = computed(() => periodSales.value > 0 ? periodTotal.value / periodSales.value : 0)

async function loadSales() {
  const start = new Date(`${filterStart.value}T00:00:00`)
  const end = new Date(`${filterEnd.value}T23:59:59.999`)
  await store.fetchByPeriod(start.toISOString(), end.toISOString(), filterStatus.value || undefined)
}

async function handleCancel(sale: Sale) {
  const ok = await confirm.confirmAction(`Cancelar a venda #${sale.sale_number}? O estoque será devolvido.`, 'Cancelar Venda')
  if (!ok) return
  try {
    await store.cancel(sale.id)
    toast.success('Venda cancelada e estoque devolvido.')
  } catch {
    toast.error('Erro ao cancelar venda.')
  }
}

onMounted(loadSales)
</script>
