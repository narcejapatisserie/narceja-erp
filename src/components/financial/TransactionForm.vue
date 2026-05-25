<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="label">Tipo *</label>
        <select v-model="form.type" class="input">
          <option value="income">Receita</option>
          <option value="expense">Despesa</option>
        </select>
      </div>
      <div>
        <label class="label">Categoria *</label>
        <select v-model="form.category" class="input">
          <option value="sale">Venda</option>
          <option value="purchase">Compra</option>
          <option value="salary">Salário</option>
          <option value="rent">Aluguel</option>
          <option value="utilities">Utilidades</option>
          <option value="maintenance">Manutenção</option>
          <option value="marketing">Marketing</option>
          <option value="taxes">Impostos</option>
          <option value="other">Outros</option>
        </select>
      </div>
      <div class="md:col-span-2">
        <label class="label">Descrição *</label>
        <input v-model="form.description" type="text" class="input" required placeholder="Ex: Compra de chocolate" />
      </div>
      <div>
        <label class="label">Valor (R$) *</label>
        <input v-model.number="form.amount" type="number" step="0.01" min="0.01" class="input" required placeholder="0,00" />
      </div>
      <div>
        <label class="label">Vencimento *</label>
        <input v-model="form.due_date" type="date" class="input" required />
      </div>
      <div>
        <label class="label">Status</label>
        <select v-model="form.status" class="input">
          <option value="pending">Pendente</option>
          <option value="paid">Pago</option>
          <option value="overdue">Vencido</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>
      <div v-if="form.status === 'paid'">
        <label class="label">Data de Pagamento</label>
        <input v-model="form.payment_date" type="date" class="input" />
      </div>
      <div>
        <label class="label">Forma de Pagamento</label>
        <select v-model="form.payment_method" class="input">
          <option value="">Não informado</option>
          <option value="cash">Dinheiro</option>
          <option value="pix">PIX</option>
          <option value="credit_card">Cartão de Crédito</option>
          <option value="debit_card">Cartão de Débito</option>
          <option value="voucher">Voucher</option>
        </select>
      </div>
      <div>
        <label class="label">Fornecedor</label>
        <select v-model="form.supplier_id" class="input">
          <option value="">Nenhum</option>
          <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>
      <div class="md:col-span-2">
        <label class="label">Observações</label>
        <textarea v-model="form.notes" class="input resize-none" rows="2" placeholder="Observações opcionais..."></textarea>
      </div>
    </div>

    <div class="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
      <button type="button" @click="$emit('cancel')" class="btn-secondary">Cancelar</button>
      <button type="submit" :disabled="saving" class="btn-primary flex items-center gap-2">
        <i v-if="saving" class="pi pi-spin pi-spinner"></i>
        <span>{{ saving ? 'Salvando...' : (props.transaction ? 'Atualizar' : 'Criar') }}</span>
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useFinancialStore } from '@/stores/financial'
import { useSuppliersStore } from '@/stores/suppliers'
import { useAuthStore } from '@/stores/auth'
import type { FinancialTransaction, PaymentMethod, TransactionType, TransactionCategory, AccountStatus } from '@/types'

const props = defineProps<{ transaction?: FinancialTransaction }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()

const store = useFinancialStore()
const suppliersStore = useSuppliersStore()
const authStore = useAuthStore()
const suppliers = computed(() => suppliersStore.suppliers)
const saving = ref(false)

const today = new Date().toISOString().split('T')[0]

interface FormData {
  type: TransactionType
  category: TransactionCategory
  description: string
  amount: number
  due_date: string
  payment_date: string
  status: AccountStatus
  payment_method: PaymentMethod | ''
  supplier_id: string
  notes: string
}

const defaultForm = (): FormData => ({
  type: 'expense',
  category: 'other',
  description: '',
  amount: 0,
  due_date: today,
  payment_date: '',
  status: 'pending',
  payment_method: '',
  supplier_id: '',
  notes: '',
})

const form = ref<FormData>(defaultForm())

watch(() => props.transaction, (tx) => {
  if (tx) {
    form.value = {
      type: tx.type, category: tx.category, description: tx.description,
      amount: tx.amount, due_date: tx.due_date, payment_date: tx.payment_date || '',
      status: tx.status, payment_method: (tx.payment_method || '') as PaymentMethod | '',
      supplier_id: tx.supplier_id || '', notes: tx.notes || '',
    }
  } else {
    form.value = defaultForm()
  }
}, { immediate: true })

async function handleSubmit() {
  saving.value = true
  try {
    const data: Omit<FinancialTransaction, 'id' | 'created_at' | 'updated_at' | 'supplier'> = {
      type: form.value.type,
      category: form.value.category,
      description: form.value.description,
      amount: form.value.amount,
      due_date: form.value.due_date,
      status: form.value.status,
      payment_date: form.value.payment_date || undefined,
      payment_method: (form.value.payment_method as PaymentMethod) || undefined,
      supplier_id: form.value.supplier_id || undefined,
      notes: form.value.notes || undefined,
      created_by: authStore.profile?.id,
    }
    if (props.transaction) {
      await store.update(props.transaction.id, data)
    } else {
      await store.create(data)
    }
    emit('saved')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  suppliersStore.fetchSuppliers()
})
</script>
