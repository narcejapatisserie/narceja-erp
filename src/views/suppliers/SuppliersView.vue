<template>
  <div class="space-y-5">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">Fornecedores</h1>
        <p class="text-sm text-gray-500">{{ store.suppliers.length }} fornecedores cadastrados</p>
      </div>
      <button @click="openForm()" class="btn-primary flex items-center gap-2">
        <i class="pi pi-plus"></i> Novo Fornecedor
      </button>
    </div>

    <div class="card p-4">
      <div class="relative">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
        <input v-model="search" type="text" class="input pl-9" placeholder="Buscar fornecedor..." />
      </div>
    </div>

    <div class="card overflow-hidden">
      <div v-if="store.loading" class="flex items-center justify-center py-16">
        <i class="pi pi-spin pi-spinner text-narceja-500 text-3xl"></i>
      </div>
      <div v-else-if="filtered.length === 0" class="flex flex-col items-center justify-center py-16 text-gray-400">
        <i class="pi pi-truck text-4xl mb-3"></i>
        <p>Nenhum fornecedor encontrado</p>
        <button @click="openForm()" class="btn-primary mt-4 text-sm">Cadastrar primeiro</button>
      </div>
      <div v-else class="divide-y divide-gray-100 dark:divide-gray-700">
        <div
          v-for="supplier in filtered"
          :key="supplier.id"
          class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="font-medium text-gray-900 dark:text-white">{{ supplier.name }}</h3>
                <span v-if="supplier.trade_name" class="text-xs text-gray-400">/ {{ supplier.trade_name }}</span>
              </div>
              <div class="flex flex-wrap gap-3 mt-1.5 text-sm text-gray-500">
                <span v-if="supplier.email" class="flex items-center gap-1">
                  <i class="pi pi-envelope text-xs"></i> {{ supplier.email }}
                </span>
                <span v-if="supplier.phone" class="flex items-center gap-1">
                  <i class="pi pi-phone text-xs"></i> {{ supplier.phone }}
                </span>
                <a v-if="supplier.mobile" :href="`https://wa.me/${supplier.mobile.replace(/\D/g,'')}`" target="_blank"
                  class="flex items-center gap-1 text-green-600 hover:text-green-700">
                  <i class="pi pi-whatsapp text-xs"></i> {{ supplier.mobile }}
                </a>
              </div>
              <p v-if="supplier.document" class="text-xs text-gray-400 mt-1">CNPJ/CPF: {{ supplier.document }}</p>
            </div>
            <div class="flex items-center gap-1 flex-shrink-0">
              <button @click="openForm(supplier)" class="p-1.5 rounded hover:bg-narceja-50 text-narceja-600 transition-colors" v-tooltip="'Editar'">
                <i class="pi pi-pencil text-sm"></i>
              </button>
              <button @click="handleDelete(supplier)" class="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors" v-tooltip="'Excluir'">
                <i class="pi pi-trash text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Dialog v-model:visible="showForm" :header="editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'" modal :style="{ width: '600px' }">
      <SupplierForm :supplier="editingSupplier" @saved="onSaved" @cancel="showForm = false" />
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import { useSuppliersStore } from '@/stores/suppliers'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import type { Supplier } from '@/types'
import SupplierForm from '@/components/suppliers/SupplierForm.vue'

const store = useSuppliersStore()
const toast = useToast()
const confirm = useConfirm()

const search = ref('')
const showForm = ref(false)
const editingSupplier = ref<Supplier | undefined>()

const filtered = computed(() =>
  store.suppliers.filter(s => !search.value || s.name.toLowerCase().includes(search.value.toLowerCase()))
)

function openForm(s?: Supplier) {
  editingSupplier.value = s
  showForm.value = true
}

function onSaved() {
  showForm.value = false
  store.fetchSuppliers()
  toast.success(editingSupplier.value ? 'Fornecedor atualizado!' : 'Fornecedor criado!')
}

async function handleDelete(s: Supplier) {
  const ok = await confirm.confirmDelete(`Deseja excluir "${s.name}"?`)
  if (!ok) return
  try {
    await store.remove(s.id)
    toast.success('Fornecedor excluído!')
  } catch {
    toast.error('Erro ao excluir. Verifique se há dependências.')
  }
}

onMounted(() => store.fetchSuppliers())
</script>
