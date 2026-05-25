<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="md:col-span-2">
        <label class="label">Nome *</label>
        <input v-model="form.name" type="text" class="input" required placeholder="Ex: Chocolate ao leite" />
      </div>
      <div>
        <label class="label">Unidade *</label>
        <select v-model="form.unit" class="input">
          <option value="kg">Quilograma (kg)</option>
          <option value="g">Grama (g)</option>
          <option value="l">Litro (l)</option>
          <option value="ml">Mililitro (ml)</option>
          <option value="un">Unidade (un)</option>
          <option value="cx">Caixa (cx)</option>
          <option value="pct">Pacote (pct)</option>
        </select>
      </div>
      <div>
        <label class="label">Custo por {{ form.unit }} (R$)</label>
        <input v-model.number="form.cost_per_unit" type="number" step="0.0001" min="0" class="input" placeholder="0,0000" />
      </div>
      <div>
        <label class="label">Estoque Atual</label>
        <input v-model.number="form.stock_quantity" type="number" step="0.001" min="0" class="input" placeholder="0" />
      </div>
      <div>
        <label class="label">Estoque Mínimo</label>
        <input v-model.number="form.min_stock" type="number" step="0.001" min="0" class="input" placeholder="0" />
      </div>
      <div>
        <label class="label">Lote Atual</label>
        <input v-model="form.current_batch" type="text" class="input" placeholder="Ex: LOTE-001" />
      </div>
      <div>
        <label class="label">Validade</label>
        <input v-model="form.expiration_date" type="date" class="input" />
      </div>
      <div>
        <label class="label">Fornecedor</label>
        <select v-model="form.supplier_id" class="input">
          <option value="">Nenhum</option>
          <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>
      <div>
        <label class="label">Local de Armazenamento</label>
        <input v-model="form.storage_location" type="text" class="input" placeholder="Ex: Geladeira, Prateleira A..." />
      </div>
      <div class="md:col-span-2">
        <label class="label">Descrição</label>
        <textarea v-model="form.description" class="input resize-none" rows="2" placeholder="Descrição opcional..."></textarea>
      </div>
    </div>

    <div class="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
      <button type="button" @click="$emit('cancel')" class="btn-secondary">Cancelar</button>
      <button type="submit" :disabled="saving" class="btn-primary flex items-center gap-2">
        <i v-if="saving" class="pi pi-spin pi-spinner"></i>
        <span>{{ saving ? 'Salvando...' : (props.material ? 'Atualizar' : 'Criar') }}</span>
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRawMaterialsStore } from '@/stores/rawMaterials'
import { useSuppliersStore } from '@/stores/suppliers'
import type { RawMaterial } from '@/types'

const props = defineProps<{ material?: RawMaterial }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()

const store = useRawMaterialsStore()
const suppliersStore = useSuppliersStore()
const saving = ref(false)
const suppliers = ref(suppliersStore.suppliers)

const defaultForm = () => ({
  name: '', description: '', unit: 'kg' as const, cost_per_unit: 0,
  stock_quantity: 0, min_stock: 0, supplier_id: '', current_batch: '',
  expiration_date: '', storage_location: '', barcode: '', is_active: true,
})

const form = ref(defaultForm())

watch(() => props.material, (m) => {
  if (m) {
    form.value = {
      name: m.name, description: m.description || '', unit: m.unit,
      cost_per_unit: m.cost_per_unit, stock_quantity: m.stock_quantity,
      min_stock: m.min_stock, supplier_id: m.supplier_id || '',
      current_batch: m.current_batch || '', expiration_date: m.expiration_date || '',
      storage_location: m.storage_location || '', barcode: m.barcode || '', is_active: m.is_active,
    }
  } else {
    form.value = defaultForm()
  }
}, { immediate: true })

async function handleSubmit() {
  saving.value = true
  try {
    const data: Omit<RawMaterial, 'id' | 'created_at' | 'updated_at' | 'supplier'> = {
      name: form.value.name,
      description: form.value.description || undefined,
      unit: form.value.unit,
      cost_per_unit: form.value.cost_per_unit,
      stock_quantity: form.value.stock_quantity,
      min_stock: form.value.min_stock,
      supplier_id: form.value.supplier_id || undefined,
      current_batch: form.value.current_batch || undefined,
      expiration_date: form.value.expiration_date || undefined,
      storage_location: form.value.storage_location || undefined,
      barcode: form.value.barcode || undefined,
      is_active: form.value.is_active,
    }
    if (props.material) {
      await store.update(props.material.id, data)
    } else {
      await store.create(data)
    }
    emit('saved')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await suppliersStore.fetchSuppliers()
  suppliers.value = suppliersStore.suppliers
})
</script>
