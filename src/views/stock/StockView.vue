<template>
  <div class="space-y-5">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <h1 class="text-xl font-bold text-gray-900 dark:text-white">Controle de Estoque</h1>
      <div class="flex gap-2">
        <button @click="reload" :disabled="loading" class="btn-secondary flex items-center gap-2">
          <i :class="['pi', loading ? 'pi-spin pi-spinner' : 'pi-refresh']"></i>
          Atualizar
        </button>
        <select v-model="filterEntity" class="input w-44">
          <option value="">Todos</option>
          <option value="product">Produtos</option>
          <option value="raw_material">Matérias-Primas</option>
        </select>
        <select v-model="filterType" class="input w-44">
          <option value="">Todos os tipos</option>
          <option value="in">Entradas</option>
          <option value="out">Saídas</option>
          <option value="adjustment">Ajustes</option>
        </select>
      </div>
    </div>

    <!-- Cards resumo -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card p-4 text-center">
        <p class="text-xs text-gray-500 mb-1">Total Produtos</p>
        <p class="text-2xl font-bold text-narceja-700 dark:text-narceja-400">{{ totalProducts }}</p>
        <p class="text-xs text-gray-400">itens ativos</p>
      </div>
      <div class="card p-4 text-center">
        <p class="text-xs text-gray-500 mb-1">Estoque Baixo</p>
        <p class="text-2xl font-bold text-yellow-600">{{ lowStockProducts }}</p>
        <p class="text-xs text-gray-400">produtos</p>
      </div>
      <div class="card p-4 text-center">
        <p class="text-xs text-gray-500 mb-1">Matérias-Primas</p>
        <p class="text-2xl font-bold text-blue-600">{{ totalMaterials }}</p>
        <p class="text-xs text-gray-400">itens ativos</p>
      </div>
      <div class="card p-4 text-center">
        <p class="text-xs text-gray-500 mb-1">Movimentações Hoje</p>
        <p class="text-2xl font-bold text-green-600">{{ todayMovements }}</p>
        <p class="text-xs text-gray-400">registros</p>
      </div>
    </div>

    <!-- Movimentações -->
    <div class="card overflow-hidden">
      <div class="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <h3 class="font-semibold text-gray-900 dark:text-white">Últimas Movimentações</h3>
        <span class="text-sm text-gray-500">{{ filteredMovements.length }} registros</span>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-16">
        <i class="pi pi-spin pi-spinner text-narceja-500 text-3xl"></i>
      </div>

      <div v-else-if="filteredMovements.length === 0" class="flex flex-col items-center justify-center py-16 text-gray-400">
        <i class="pi pi-chart-bar text-4xl mb-3"></i>
        <p>Nenhuma movimentação encontrada</p>
      </div>

      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-800/50">
          <tr class="text-left text-gray-500 dark:text-gray-400">
            <th class="px-4 py-3 font-medium">Data</th>
            <th class="px-4 py-3 font-medium">Tipo</th>
            <th class="px-4 py-3 font-medium">Item</th>
            <th class="px-4 py-3 font-medium hidden md:table-cell">Motivo</th>
            <th class="px-4 py-3 font-medium text-right">Qtd</th>
            <th class="px-4 py-3 font-medium text-right hidden md:table-cell">Saldo Antes</th>
            <th class="px-4 py-3 font-medium text-right">Saldo Após</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr v-for="m in filteredMovements" :key="m.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/30">
            <td class="px-4 py-3 text-gray-500 text-xs">{{ formatDateTime(m.created_at) }}</td>
            <td class="px-4 py-3">
              <span :class="['badge', m.movement_type === 'in' ? 'badge-success' : m.movement_type === 'out' ? 'badge-danger' : 'badge-info']">
                {{ m.movement_type === 'in' ? 'Entrada' : m.movement_type === 'out' ? 'Saída' : 'Ajuste' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ getEntityName(m) }}</p>
              <span class="text-xs text-gray-400">{{ m.entity_type === 'product' ? 'Produto' : 'Matéria-Prima' }}</span>
            </td>
            <td class="px-4 py-3 text-gray-600 dark:text-gray-400 hidden md:table-cell capitalize">{{ m.reason }}</td>
            <td class="px-4 py-3 text-right font-medium" :class="m.movement_type === 'in' ? 'text-green-600' : 'text-red-600'">
              {{ m.movement_type === 'in' ? '+' : '-' }}{{ m.quantity }}
            </td>
            <td class="px-4 py-3 text-right text-gray-500 hidden md:table-cell">{{ m.quantity_before }}</td>
            <td class="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">{{ m.quantity_after }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getStockMovements } from '@/services/stockService'
import { useProductsStore } from '@/stores/products'
import { useRawMaterialsStore } from '@/stores/rawMaterials'
import { formatDateTime } from '@/utils/formatters'
import type { StockMovement } from '@/types'

const productsStore = useProductsStore()
const rmStore = useRawMaterialsStore()

const movements = ref<StockMovement[]>([])
const loading = ref(true)
const filterEntity = ref('')
const filterType = ref('')

const totalProducts = computed(() => productsStore.products.length)
const lowStockProducts = computed(() => productsStore.products.filter(p => p.stock_quantity <= p.min_stock).length)
const totalMaterials = computed(() => rmStore.materials.length)
const todayMovements = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return movements.value.filter(m => m.created_at.startsWith(today)).length
})

const filteredMovements = computed(() => {
  return movements.value.filter(m => {
    const matchEntity = !filterEntity.value || m.entity_type === filterEntity.value
    const matchType = !filterType.value || m.movement_type === filterType.value
    return matchEntity && matchType
  })
})

function getEntityName(m: StockMovement) {
  if (m.entity_type === 'product') {
    return productsStore.products.find(p => p.id === m.entity_id)?.name || m.entity_id
  }
  return rmStore.materials.find(r => r.id === m.entity_id)?.name || m.entity_id
}

async function reload() {
  loading.value = true
  try {
    await Promise.all([
      productsStore.fetchProducts(),
      rmStore.fetchMaterials(),
    ])
    movements.value = await getStockMovements()
  } finally {
    loading.value = false
  }
}

onMounted(reload)
</script>
