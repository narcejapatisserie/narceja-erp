<template>
  <div class="space-y-5">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <h1 class="text-xl font-bold text-gray-900 dark:text-white">Controle de Estoque</h1>
      <div class="flex flex-wrap gap-2">
        <button @click="showMovementForm = true" class="btn-primary flex items-center gap-2">
          <i class="pi pi-plus"></i>
          Registrar Movimentação
        </button>
        <button @click="reload" :disabled="loading" class="btn-secondary flex items-center gap-2">
          <i :class="['pi', loading ? 'pi-spin pi-spinner' : 'pi-refresh']"></i>
          Atualizar
        </button>
        <select v-model="filterEntity" class="input w-40">
          <option value="">Todos</option>
          <option value="product">Produtos</option>
          <option value="raw_material">Matérias-Primas</option>
        </select>
        <select v-model="filterType" class="input w-40">
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

      <div v-if="loading && movements.length === 0" class="flex items-center justify-center py-16">
        <i class="pi pi-spin pi-spinner text-narceja-500 text-3xl"></i>
      </div>

      <div v-else-if="filteredMovements.length === 0" class="flex flex-col items-center justify-center py-16 text-gray-400">
        <i class="pi pi-chart-bar text-4xl mb-3"></i>
        <p>Nenhuma movimentação encontrada</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-800/50">
            <tr class="text-left text-gray-500 dark:text-gray-400">
              <th class="px-4 py-3 font-medium">Data</th>
              <th class="px-4 py-3 font-medium">Tipo</th>
              <th class="px-4 py-3 font-medium">Item</th>
              <th class="px-4 py-3 font-medium hidden md:table-cell">Motivo</th>
              <th class="px-4 py-3 font-medium text-right">Qtd</th>
              <th class="px-4 py-3 font-medium text-right hidden md:table-cell">Antes</th>
              <th class="px-4 py-3 font-medium text-right">Após</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-for="m in filteredMovements" :key="m.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/30">
              <td class="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{{ formatDateTime(m.created_at) }}</td>
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
                {{ m.movement_type === 'in' ? '+' : m.movement_type === 'out' ? '-' : '' }}{{ m.quantity }}
              </td>
              <td class="px-4 py-3 text-right text-gray-500 hidden md:table-cell">{{ m.quantity_before }}</td>
              <td class="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">{{ m.quantity_after }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Registrar Movimentação -->
    <Teleport to="body">
      <div v-if="showMovementForm" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md">
          <div class="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
            <h3 class="font-semibold text-gray-900 dark:text-white">Registrar Movimentação</h3>
            <button @click="closeForm" class="text-gray-400 hover:text-gray-600">
              <i class="pi pi-times text-lg"></i>
            </button>
          </div>

          <form @submit.prevent="submitMovement" class="p-5 space-y-4">
            <div>
              <label class="label">Tipo de item</label>
              <select v-model="form.entityType" @change="form.entityId = ''" class="input w-full" required>
                <option value="product">Produto</option>
                <option value="raw_material">Matéria-Prima</option>
              </select>
            </div>

            <div>
              <label class="label">{{ form.entityType === 'product' ? 'Produto' : 'Matéria-Prima' }}</label>
              <select v-model="form.entityId" class="input w-full" required>
                <option value="">Selecione...</option>
                <option
                  v-for="item in entityOptions"
                  :key="item.id"
                  :value="item.id"
                >
                  {{ item.name }} (estoque atual: {{ item.stock_quantity }} {{ item.unit }})
                </option>
              </select>
            </div>

            <div>
              <label class="label">Tipo de movimentação</label>
              <select v-model="form.movementType" class="input w-full" required>
                <option value="in">Entrada</option>
                <option value="out">Saída</option>
                <option value="adjustment">Ajuste (definir quantidade exata)</option>
              </select>
            </div>

            <div>
              <label class="label">
                {{ form.movementType === 'adjustment' ? 'Novo estoque (quantidade absoluta)' : 'Quantidade' }}
              </label>
              <input
                v-model.number="form.quantity"
                type="number"
                min="0.01"
                step="0.01"
                class="input w-full"
                required
              />
              <p v-if="form.movementType !== 'adjustment' && selectedItem" class="text-xs text-gray-400 mt-1">
                Estoque atual: {{ selectedItem.stock_quantity }} →
                <span :class="form.movementType === 'in' ? 'text-green-600' : 'text-red-600'">
                  {{ form.movementType === 'in'
                    ? selectedItem.stock_quantity + (form.quantity || 0)
                    : selectedItem.stock_quantity - (form.quantity || 0) }}
                </span>
              </p>
              <p v-if="exceedsStock" class="text-xs text-red-500 mt-1">
                ⚠️ Quantidade excede estoque disponível ({{ selectedItem?.stock_quantity }})
              </p>
            </div>

            <div>
              <label class="label">Motivo</label>
              <select v-model="form.reason" class="input w-full" required>
                <option value="">Selecione...</option>
                <optgroup v-if="form.movementType === 'in'" label="Entradas">
                  <option value="purchase">Compra</option>
                  <option value="production">Produção</option>
                  <option value="return">Devolução</option>
                  <option value="initial">Estoque Inicial</option>
                  <option value="adjustment">Ajuste Manual</option>
                </optgroup>
                <optgroup v-if="form.movementType === 'out'" label="Saídas">
                  <option value="sale">Venda</option>
                  <option value="waste">Perda</option>
                  <option value="expiration">Vencimento</option>
                  <option value="adjustment">Ajuste Manual</option>
                </optgroup>
                <optgroup v-if="form.movementType === 'adjustment'" label="Ajustes">
                  <option value="adjustment">Inventário / Correção</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label class="label">Observações (opcional)</label>
              <textarea v-model="form.notes" class="input w-full" rows="2" placeholder="Detalhes adicionais..." />
            </div>

            <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>

            <div class="flex gap-3 pt-2">
              <button type="button" @click="closeForm" class="btn-secondary flex-1">Cancelar</button>
              <button type="submit" :disabled="saving || exceedsStock || !form.entityId" class="btn-primary flex-1 flex items-center justify-center gap-2">
                <i v-if="saving" class="pi pi-spin pi-spinner"></i>
                {{ saving ? 'Salvando...' : 'Registrar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getStockMovements, addProductStockMovement } from '@/services/stockService'
import { addStockMovement as addRawMaterialMovement } from '@/services/rawMaterialService'
import { useProductsStore } from '@/stores/products'
import { useRawMaterialsStore } from '@/stores/rawMaterials'
import type { MovementReason } from '@/types'
import { formatDateTime } from '@/utils/formatters'
import type { StockMovement } from '@/types'

const productsStore = useProductsStore()
const rmStore = useRawMaterialsStore()

const movements = ref<StockMovement[]>([])
const loading = ref(true)
const filterEntity = ref('')
const filterType = ref('')
const showMovementForm = ref(false)
const saving = ref(false)
const formError = ref('')

const form = ref<{
  entityType: 'product' | 'raw_material'
  entityId: string
  movementType: 'in' | 'out' | 'adjustment'
  quantity: number
  reason: MovementReason | ''
  notes: string
}>({
  entityType: 'product',
  entityId: '',
  movementType: 'in',
  quantity: 0,
  reason: '',
  notes: '',
})

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

const entityOptions = computed(() => {
  if (form.value.entityType === 'product') {
    return productsStore.products.map(p => ({
      id: p.id,
      name: p.name,
      stock_quantity: p.stock_quantity,
      unit: 'un',
    }))
  }
  return rmStore.materials.map(m => ({
    id: m.id,
    name: m.name,
    stock_quantity: m.stock_quantity,
    unit: m.unit,
  }))
})

const selectedItem = computed(() =>
  entityOptions.value.find(e => e.id === form.value.entityId) || null
)

const exceedsStock = computed(() =>
  form.value.movementType === 'out' &&
  !!selectedItem.value &&
  form.value.quantity > selectedItem.value.stock_quantity
)

function getEntityName(m: StockMovement) {
  if (m.entity_type === 'product') {
    return productsStore.products.find(p => p.id === m.entity_id)?.name || m.entity_id
  }
  return rmStore.materials.find(r => r.id === m.entity_id)?.name || m.entity_id
}

function closeForm() {
  showMovementForm.value = false
  form.value = { entityType: 'product', entityId: '', movementType: 'in', quantity: 0, reason: '' as MovementReason | '', notes: '' }
  formError.value = ''
}

async function submitMovement() {
  if (!form.value.entityId || !form.value.quantity || !form.value.reason) return
  saving.value = true
  formError.value = ''
  try {
    const item = selectedItem.value!
    const reason = form.value.reason as MovementReason
    if (form.value.entityType === 'product') {
      await addProductStockMovement({
        productId: form.value.entityId,
        movementType: form.value.movementType,
        reason,
        quantity: form.value.quantity,
        currentStock: item.stock_quantity,
        notes: form.value.notes || undefined,
      })
    } else {
      await addRawMaterialMovement({
        entityId: form.value.entityId,
        movementType: form.value.movementType,
        reason,
        quantity: form.value.quantity,
        currentStock: item.stock_quantity,
        notes: form.value.notes || undefined,
      })
    }
    closeForm()
    await reload()
  } catch (err: any) {
    formError.value = err.message || 'Erro ao registrar movimentação'
  } finally {
    saving.value = false
  }
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
