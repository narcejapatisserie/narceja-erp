import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/services/supplierService'
import type { Supplier } from '@/types'

export const useSuppliersStore = defineStore('suppliers', () => {
  const suppliers = ref<Supplier[]>([])
  const loading = ref(false)

  async function fetchSuppliers() {
    loading.value = true
    try {
      suppliers.value = await getSuppliers()
    } catch (e) {
      console.error('[suppliers] fetchSuppliers:', e)
    } finally {
      loading.value = false
    }
  }

  async function create(data: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) {
    const s = await createSupplier(data)
    suppliers.value.unshift(s)
    return s
  }

  async function update(id: string, data: Partial<Supplier>) {
    const s = await updateSupplier(id, data)
    const idx = suppliers.value.findIndex(x => x.id === id)
    if (idx !== -1) suppliers.value[idx] = s
    return s
  }

  async function remove(id: string) {
    await deleteSupplier(id)
    suppliers.value = suppliers.value.filter(s => s.id !== id)
  }

  return { suppliers, loading, fetchSuppliers, create, update, remove }
})
