<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div v-if="material" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm">
      <p class="font-medium text-gray-900 dark:text-white">{{ material.name }}</p>
      <p class="text-gray-500">Estoque atual: <strong>{{ material.stock_quantity }} {{ material.unit }}</strong></p>
    </div>

    <div>
      <label class="label">Tipo de Movimentação *</label>
      <select v-model="form.movementType" class="input">
        <option value="in">Entrada (compra, devolução)</option>
        <option value="out">Saída (uso, descarte)</option>
        <option value="adjustment">Ajuste de inventário</option>
      </select>
    </div>

    <div>
      <label class="label">Motivo *</label>
      <select v-model="form.reason" class="input">
        <option value="purchase">Compra</option>
        <option value="production">Produção/Uso</option>
        <option value="waste">Descarte/Perda</option>
        <option value="return">Devolução</option>
        <option value="expiration">Vencimento</option>
        <option value="adjustment">Ajuste de inventário</option>
        <option value="initial">Estoque inicial</option>
      </select>
    </div>

    <div>
      <label class="label">Quantidade *</label>
      <div class="flex gap-2 items-center">
        <input v-model.number="form.quantity" type="number" step="0.001" min="0.001" class="input" required placeholder="0" />
        <span class="text-sm text-gray-500 w-10">{{ material?.unit }}</span>
      </div>
      <p v-if="exceedsStock" class="text-xs text-red-500 mt-1 font-medium">
        ⚠ Quantidade excede o estoque disponível ({{ material?.stock_quantity }} {{ material?.unit }})
      </p>
      <p v-else-if="form.quantity && material" class="text-xs text-gray-400 mt-1">
        Estoque após: <strong>{{ newStock }}</strong> {{ material.unit }}
      </p>
    </div>

    <div v-if="form.movementType === 'in'">
      <label class="label">Custo Unitário (R$)</label>
      <input v-model.number="form.unitCost" type="number" step="0.0001" min="0" class="input" placeholder="0,0000" />
    </div>

    <div>
      <label class="label">Lote</label>
      <input v-model="form.batch" type="text" class="input" placeholder="Ex: LOTE-001" />
    </div>

    <div>
      <label class="label">Validade do lote</label>
      <input v-model="form.expirationDate" type="date" class="input" />
    </div>

    <div>
      <label class="label">Observações</label>
      <textarea v-model="form.notes" class="input resize-none" rows="2" placeholder="Observações opcionais..."></textarea>
    </div>

    <div class="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
      <button type="button" @click="$emit('cancel')" class="btn-secondary">Cancelar</button>
      <button type="submit" :disabled="saving || !form.quantity || exceedsStock" class="btn-primary flex items-center gap-2">
        <i v-if="saving" class="pi pi-spin pi-spinner"></i>
        <span>{{ saving ? 'Salvando...' : 'Registrar' }}</span>
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { addStockMovement } from '@/services/rawMaterialService'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import type { RawMaterial, MovementReason } from '@/types'

const props = defineProps<{ material?: RawMaterial }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()

const authStore = useAuthStore()
const toast = useToast()
const saving = ref(false)

const form = ref({
  movementType: 'in' as 'in' | 'out' | 'adjustment',
  reason: 'purchase' as MovementReason,
  quantity: 0,
  unitCost: 0,
  batch: '',
  expirationDate: '',
  notes: '',
})

const newStock = computed(() => {
  if (!props.material || !form.value.quantity) return props.material?.stock_quantity || 0
  if (form.value.movementType === 'in') return props.material.stock_quantity + form.value.quantity
  if (form.value.movementType === 'out') return props.material.stock_quantity - form.value.quantity
  return form.value.quantity
})

const exceedsStock = computed(() =>
  form.value.movementType === 'out' && !!props.material && form.value.quantity > props.material.stock_quantity
)

async function handleSubmit() {
  if (!props.material || !form.value.quantity) return
  if (exceedsStock.value) {
    toast.error(`Quantidade insuficiente. Estoque atual: ${props.material.stock_quantity} ${props.material.unit}`)
    return
  }
  saving.value = true
  try {
    await addStockMovement({
      entityId: props.material.id,
      movementType: form.value.movementType,
      reason: form.value.reason,
      quantity: form.value.quantity,
      currentStock: props.material.stock_quantity,
      unitCost: form.value.unitCost || undefined,
      batch: form.value.batch || undefined,
      expirationDate: form.value.expirationDate || undefined,
      notes: form.value.notes || undefined,
      userId: authStore.profile?.id,
    })
    emit('saved')
  } finally {
    saving.value = false
  }
}
</script>
