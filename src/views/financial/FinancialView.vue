<template>
  <div class="space-y-5">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <h1 class="text-xl font-bold text-gray-900 dark:text-white">Financeiro</h1>
      <div class="flex gap-2">
        <button @click="loadTransactions" :disabled="store.loading" class="btn-secondary flex items-center gap-2">
          <i :class="['pi', store.loading ? 'pi-spin pi-spinner' : 'pi-refresh']"></i>
          Atualizar
        </button>
        <button @click="openForm()" class="btn-primary flex items-center gap-2">
          <i class="pi pi-plus"></i> Novo Lançamento
        </button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card p-4 text-center">
        <p class="text-xs text-gray-500 mb-1">Receitas</p>
        <p class="text-xl font-bold text-green-600">{{ formatCurrency(totalIncome) }}</p>
      </div>
      <div class="card p-4 text-center">
        <p class="text-xs text-gray-500 mb-1">Despesas</p>
        <p class="text-xl font-bold text-red-600">{{ formatCurrency(totalExpense) }}</p>
      </div>
      <div class="card p-4 text-center">
        <p class="text-xs text-gray-500 mb-1">Saldo</p>
        <p class="text-xl font-bold" :class="balance >= 0 ? 'text-green-600' : 'text-red-600'">{{ formatCurrency(balance) }}</p>
      </div>
      <div class="card p-4 text-center">
        <p class="text-xs text-gray-500 mb-1">A Pagar</p>
        <p class="text-xl font-bold text-yellow-600">{{ formatCurrency(pendingExpenses) }}</p>
      </div>
    </div>

    <!-- Filtros -->
    <div class="card p-4 flex flex-wrap gap-3">
      <select v-model="filterType" class="input w-36">
        <option value="">Todos</option>
        <option value="income">Receitas</option>
        <option value="expense">Despesas</option>
      </select>
      <select v-model="filterStatus" class="input w-40">
        <option value="">Todos os status</option>
        <option value="pending">Pendentes</option>
        <option value="paid">Pagos</option>
        <option value="overdue">Vencidos</option>
        <option value="cancelled">Cancelados</option>
      </select>
      <input v-model="filterStart" type="date" class="input w-40" />
      <input v-model="filterEnd" type="date" class="input w-40" />
      <button @click="loadTransactions" class="btn-primary px-4">Filtrar</button>
    </div>

    <!-- Tabela -->
    <div class="card overflow-hidden">
      <div v-if="store.loading && store.transactions.length === 0" class="flex items-center justify-center py-16">
        <i class="pi pi-spin pi-spinner text-narceja-500 text-3xl"></i>
      </div>
      <div v-else-if="store.transactions.length === 0" class="flex flex-col items-center justify-center py-16 text-gray-400">
        <i class="pi pi-wallet text-4xl mb-3"></i>
        <p>Nenhum lançamento encontrado</p>
        <button @click="openForm()" class="btn-primary mt-4 text-sm">Criar primeiro lançamento</button>
      </div>
      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-800/50">
          <tr class="text-left text-gray-500 dark:text-gray-400">
            <th class="px-4 py-3 font-medium">Descrição</th>
            <th class="px-4 py-3 font-medium hidden md:table-cell">Categoria</th>
            <th class="px-4 py-3 font-medium">Vencimento</th>
            <th class="px-4 py-3 font-medium text-right">Valor</th>
            <th class="px-4 py-3 font-medium text-center">Status</th>
            <th class="px-4 py-3 font-medium text-center">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr v-for="tx in store.transactions" :key="tx.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/30">
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <span :class="['w-2 h-2 rounded-full flex-shrink-0', tx.type === 'income' ? 'bg-green-500' : 'bg-red-500']"></span>
                <span class="text-gray-900 dark:text-white font-medium">{{ tx.description }}</span>
              </div>
            </td>
            <td class="px-4 py-3 text-gray-500 hidden md:table-cell capitalize">{{ CATEGORY_LABELS[tx.category] }}</td>
            <td class="px-4 py-3 text-gray-500">{{ formatDate(tx.due_date) }}</td>
            <td class="px-4 py-3 text-right font-semibold" :class="tx.type === 'income' ? 'text-green-600' : 'text-red-600'">
              {{ tx.type === 'income' ? '+' : '-' }}{{ formatCurrency(tx.amount) }}
            </td>
            <td class="px-4 py-3 text-center">
              <span :class="['badge',
                tx.status === 'paid' ? 'badge-success' :
                tx.status === 'overdue' ? 'badge-danger' :
                tx.status === 'cancelled' ? 'badge-secondary' :
                'badge-warning']">
                {{ STATUS_LABELS[tx.status] }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-center gap-1">
                <button
                  v-if="tx.status === 'pending'"
                  @click="handlePay(tx)"
                  class="p-1.5 rounded hover:bg-green-50 text-green-600 transition-colors"
                  v-tooltip="'Marcar como pago'"
                >
                  <i class="pi pi-check text-sm"></i>
                </button>
                <button @click="openForm(tx)" class="p-1.5 rounded hover:bg-narceja-50 text-narceja-600 transition-colors" v-tooltip="'Editar'">
                  <i class="pi pi-pencil text-sm"></i>
                </button>
                <button @click="handleDelete(tx)" class="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors" v-tooltip="'Excluir'">
                  <i class="pi pi-trash text-sm"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Dialog v-model:visible="showForm" :header="editingTx ? 'Editar Lançamento' : 'Novo Lançamento'" modal :style="{ width: '600px' }">
      <TransactionForm :transaction="editingTx" @saved="onSaved" @cancel="showForm = false" />
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import { useFinancialStore } from '@/stores/financial'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { formatCurrency, formatDate, CATEGORY_LABELS, STATUS_LABELS } from '@/utils/formatters'
import type { FinancialTransaction, TransactionType, AccountStatus } from '@/types'
import TransactionForm from '@/components/financial/TransactionForm.vue'

const store = useFinancialStore()
const toast = useToast()
const confirm = useConfirm()

const today = new Date().toISOString().split('T')[0]
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
const filterStart = ref(monthStart)
const filterEnd = ref(monthEnd)
const filterType = ref<TransactionType | ''>('')
const filterStatus = ref<AccountStatus | ''>('')
const showForm = ref(false)
const editingTx = ref<FinancialTransaction | undefined>()

const totalIncome = computed(() =>
  store.transactions
    .filter(t => t.type === 'income' && (t.status === 'paid' || t.status === 'pending'))
    .reduce((s, t) => s + t.amount, 0)
)
const totalExpense = computed(() =>
  store.transactions
    .filter(t => t.type === 'expense' && (t.status === 'paid' || t.status === 'pending'))
    .reduce((s, t) => s + t.amount, 0)
)
const balance = computed(() => totalIncome.value - totalExpense.value)
const pendingExpenses = computed(() =>
  store.transactions.filter(t => t.type === 'expense' && t.status === 'pending').reduce((s, t) => s + t.amount, 0)
)

async function loadTransactions() {
  await store.fetchTransactions({
    type: filterType.value || undefined,
    status: filterStatus.value || undefined,
    startDate: filterStart.value,
    endDate: filterEnd.value,
  })
}

function openForm(tx?: FinancialTransaction) {
  editingTx.value = tx
  showForm.value = true
}

function onSaved() {
  showForm.value = false
  loadTransactions()
  toast.success(editingTx.value ? 'Lançamento atualizado!' : 'Lançamento criado!')
}

async function handlePay(tx: FinancialTransaction) {
  const ok = await confirm.confirmAction(`Marcar "${tx.description}" como pago?`)
  if (!ok) return
  try {
    await store.pay(tx.id, today, tx.payment_method || 'cash')
    toast.success('Marcado como pago!')
  } catch {
    toast.error('Erro ao atualizar.')
  }
}

async function handleDelete(tx: FinancialTransaction) {
  const ok = await confirm.confirmDelete(`Excluir "${tx.description}"?`)
  if (!ok) return
  try {
    await store.remove(tx.id)
    toast.success('Excluído!')
  } catch {
    toast.error('Erro ao excluir.')
  }
}

onMounted(loadTransactions)
</script>
