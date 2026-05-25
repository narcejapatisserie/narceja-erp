<template>
  <div class="space-y-5">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">Matérias-Primas</h1>
        <p class="text-sm text-gray-500">{{ store.materials.length }} itens cadastrados</p>
      </div>
      <button @click="openForm()" class="btn-primary flex items-center gap-2">
        <i class="pi pi-plus"></i> Nova Matéria-Prima
      </button>
    </div>

    <!-- Alertas -->
    <div v-if="expiringCount > 0 || lowStockCount > 0" class="flex flex-wrap gap-3">
      <div v-if="lowStockCount > 0" class="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 text-sm rounded-lg px-4 py-2">
        <i class="pi pi-exclamation-triangle"></i>
        <span>{{ lowStockCount }} item(s) com estoque baixo</span>
      </div>
      <div v-if="expiringCount > 0" class="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-sm rounded-lg px-4 py-2">
        <i class="pi pi-clock"></i>
        <span>{{ expiringCount }} item(s) vencendo em 30 dias</span>
      </div>
    </div>

    <!-- Filtros -->
    <div class="card p-4 flex gap-3">
      <div class="relative flex-1">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
        <input v-model="search" type="text" class="input pl-9" placeholder="Buscar..." />
      </div>
      <select v-model="filterAlert" class="input sm:w-44">
        <option value="">Todos</option>
        <option value="low">Estoque baixo</option>
        <option value="expiring">Vencendo em breve</option>
      </select>
    </div>

    <!-- Tabela -->
    <div class="card overflow-hidden">
      <div v-if="store.loading && store.materials.length === 0" class="flex items-center justify-center py-16">
        <i class="pi pi-spin pi-spinner text-narceja-500 text-3xl"></i>
      </div>
      <div v-else-if="filteredMaterials.length === 0" class="flex flex-col items-center justify-center py-16 text-gray-400">
        <i class="pi pi-warehouse text-4xl mb-3"></i>
        <p>Nenhuma matéria-prima encontrada</p>
        <button @click="openForm()" class="btn-primary mt-4 text-sm">Cadastrar primeira</button>
      </div>
      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-800/50">
          <tr class="text-left text-gray-500 dark:text-gray-400">
            <th class="px-4 py-3 font-medium">Nome</th>
            <th class="px-4 py-3 font-medium text-right">Estoque</th>
            <th class="px-4 py-3 font-medium text-right hidden md:table-cell">Custo/Un</th>
            <th class="px-4 py-3 font-medium hidden lg:table-cell">Fornecedor</th>
            <th class="px-4 py-3 font-medium hidden lg:table-cell">Validade</th>
            <th class="px-4 py-3 font-medium text-center">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr
            v-for="rm in filteredMaterials"
            :key="rm.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-800/30"
          >
            <td class="px-4 py-3">
              <p class="font-medium text-gray-900 dark:text-white">{{ rm.name }}</p>
              <p v-if="rm.current_batch" class="text-xs text-gray-400">Lote: {{ rm.current_batch }}</p>
            </td>
            <td class="px-4 py-3 text-right">
              <span :class="['badge', rm.stock_quantity <= rm.min_stock ? 'badge-warning' : 'badge-success']">
                {{ rm.stock_quantity }} {{ rm.unit }}
              </span>
            </td>
            <td class="px-4 py-3 text-right text-gray-600 dark:text-gray-400 hidden md:table-cell">
              {{ formatCurrency(rm.cost_per_unit) }}
            </td>
            <td class="px-4 py-3 text-gray-600 dark:text-gray-400 hidden lg:table-cell">
              {{ rm.supplier?.name || '-' }}
            </td>
            <td class="px-4 py-3 hidden lg:table-cell">
              <span v-if="rm.expiration_date" :class="['badge', isExpiring(rm.expiration_date) ? 'badge-danger' : 'badge-gray']">
                {{ formatDate(rm.expiration_date) }}
              </span>
              <span v-else class="text-gray-400 text-xs">-</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-center gap-1">
                <button @click="openMovement(rm)" class="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors" v-tooltip="'Movimentação'">
                  <i class="pi pi-arrows-v text-sm"></i>
                </button>
                <button @click="openForm(rm)" class="p-1.5 rounded hover:bg-narceja-50 text-narceja-600 transition-colors" v-tooltip="'Editar'">
                  <i class="pi pi-pencil text-sm"></i>
                </button>
                <button @click="handleDelete(rm)" class="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors" v-tooltip="'Excluir'">
                  <i class="pi pi-trash text-sm"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal edição -->
    <Dialog v-model:visible="showForm" :header="editingRm ? 'Editar Matéria-Prima' : 'Nova Matéria-Prima'" modal :style="{ width: '600px' }">
      <RawMaterialForm :material="editingRm" @saved="onSaved" @cancel="showForm = false" />
    </Dialog>

    <!-- Modal movimentação -->
    <Dialog v-model:visible="showMovement" header="Movimentação de Estoque" modal :style="{ width: '500px' }">
      <StockMovementForm :material="movementRm" @saved="onMovementSaved" @cancel="showMovement = false" />
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import { useRawMaterialsStore } from '@/stores/rawMaterials'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { formatCurrency, formatDate } from '@/utils/formatters'
import type { RawMaterial } from '@/types'
import RawMaterialForm from '@/components/rawmaterials/RawMaterialForm.vue'
import StockMovementForm from '@/components/rawmaterials/StockMovementForm.vue'

const store = useRawMaterialsStore()
const toast = useToast()
const confirm = useConfirm()

const search = ref('')
const filterAlert = ref('')
const showForm = ref(false)
const showMovement = ref(false)
const editingRm = ref<RawMaterial | undefined>()
const movementRm = ref<RawMaterial | undefined>()

const today = new Date()
const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

function isExpiring(date: string) {
  return new Date(date) <= in30Days
}

const lowStockCount = computed(() => store.materials.filter(m => m.stock_quantity <= m.min_stock).length)
const expiringCount = computed(() => store.materials.filter(m => m.expiration_date && isExpiring(m.expiration_date)).length)

const filteredMaterials = computed(() => {
  return store.materials.filter(m => {
    const matchSearch = !search.value || m.name.toLowerCase().includes(search.value.toLowerCase())
    const matchAlert = !filterAlert.value
      || (filterAlert.value === 'low' && m.stock_quantity <= m.min_stock)
      || (filterAlert.value === 'expiring' && m.expiration_date && isExpiring(m.expiration_date))
    return matchSearch && matchAlert
  })
})

function openForm(rm?: RawMaterial) {
  editingRm.value = rm
  showForm.value = true
}

function openMovement(rm: RawMaterial) {
  movementRm.value = rm
  showMovement.value = true
}

function onSaved() {
  showForm.value = false
  store.fetchMaterials()
  toast.success(editingRm.value ? 'Atualizado!' : 'Criado!')
}

function onMovementSaved() {
  showMovement.value = false
  store.fetchMaterials()
  toast.success('Movimentação registrada!')
}

async function handleDelete(rm: RawMaterial) {
  const ok = await confirm.confirmDelete(`Deseja excluir "${rm.name}"?`)
  if (!ok) return
  try {
    await store.remove(rm.id)
    toast.success('Excluído!')
  } catch {
    toast.error('Erro ao excluir.')
  }
}

onMounted(() => store.fetchMaterials())
</script>
