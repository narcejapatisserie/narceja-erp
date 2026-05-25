<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="label">Razão Social *</label>
        <input v-model="form.name" type="text" class="input" required placeholder="Nome do fornecedor" />
      </div>
      <div>
        <label class="label">Nome Fantasia</label>
        <input v-model="form.trade_name" type="text" class="input" placeholder="Nome fantasia" />
      </div>
      <div>
        <label class="label">CNPJ/CPF</label>
        <input v-model="form.document" type="text" class="input" placeholder="00.000.000/0001-00" />
      </div>
      <div>
        <label class="label">Contato</label>
        <input v-model="form.contact_name" type="text" class="input" placeholder="Nome do contato" />
      </div>
      <div>
        <label class="label">E-mail</label>
        <input v-model="form.email" type="email" class="input" placeholder="email@fornecedor.com" />
      </div>
      <div>
        <label class="label">Telefone</label>
        <input v-model="form.phone" type="tel" class="input" placeholder="(11) 1234-5678" />
      </div>
      <div>
        <label class="label">WhatsApp</label>
        <input v-model="form.mobile" type="tel" class="input" placeholder="(11) 99999-9999" />
      </div>
      <div class="md:col-span-2">
        <label class="label">Observações</label>
        <textarea v-model="form.notes" class="input resize-none" rows="2" placeholder="Observações..."></textarea>
      </div>
    </div>

    <div class="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
      <button type="button" @click="$emit('cancel')" class="btn-secondary">Cancelar</button>
      <button type="submit" :disabled="saving" class="btn-primary flex items-center gap-2">
        <i v-if="saving" class="pi pi-spin pi-spinner"></i>
        <span>{{ saving ? 'Salvando...' : (props.supplier ? 'Atualizar' : 'Criar') }}</span>
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSuppliersStore } from '@/stores/suppliers'
import type { Supplier } from '@/types'

const props = defineProps<{ supplier?: Supplier }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()

const store = useSuppliersStore()
const saving = ref(false)

const defaultForm = () => ({
  name: '', trade_name: '', document: '', email: '', phone: '',
  mobile: '', contact_name: '', notes: '', is_active: true,
})

const form = ref(defaultForm())

watch(() => props.supplier, (s) => {
  if (s) {
    form.value = {
      name: s.name, trade_name: s.trade_name || '', document: s.document || '',
      email: s.email || '', phone: s.phone || '', mobile: s.mobile || '',
      contact_name: s.contact_name || '', notes: s.notes || '', is_active: s.is_active,
    }
  } else {
    form.value = defaultForm()
  }
}, { immediate: true })

async function handleSubmit() {
  saving.value = true
  try {
    const data: Omit<Supplier, 'id' | 'created_at' | 'updated_at'> = {
      name: form.value.name,
      trade_name: form.value.trade_name || undefined,
      document: form.value.document || undefined,
      email: form.value.email || undefined,
      phone: form.value.phone || undefined,
      mobile: form.value.mobile || undefined,
      contact_name: form.value.contact_name || undefined,
      notes: form.value.notes || undefined,
      is_active: form.value.is_active,
    }
    if (props.supplier) {
      await store.update(props.supplier.id, data)
    } else {
      await store.create(data)
    }
    emit('saved')
  } finally {
    saving.value = false
  }
}
</script>
