import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getRawMaterials, createRawMaterial, updateRawMaterial, deleteRawMaterial } from '@/services/rawMaterialService'
import type { RawMaterial } from '@/types'

export const useRawMaterialsStore = defineStore('rawMaterials', () => {
  const materials = ref<RawMaterial[]>([])
  const loading = ref(false)

  async function fetchMaterials() {
    loading.value = true
    try {
      materials.value = await getRawMaterials()
    } finally {
      loading.value = false
    }
  }

  async function create(data: Omit<RawMaterial, 'id' | 'created_at' | 'updated_at'>) {
    const rm = await createRawMaterial(data)
    materials.value.unshift(rm)
    return rm
  }

  async function update(id: string, data: Partial<RawMaterial>) {
    const rm = await updateRawMaterial(id, data)
    const idx = materials.value.findIndex(m => m.id === id)
    if (idx !== -1) materials.value[idx] = rm
    return rm
  }

  async function remove(id: string) {
    await deleteRawMaterial(id)
    materials.value = materials.value.filter(m => m.id !== id)
  }

  return { materials, loading, fetchMaterials, create, update, remove }
})
