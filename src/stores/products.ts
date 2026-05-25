import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/services/productService'
import type { Product } from '@/types'

export const useProductsStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const loading = ref(false)

  async function fetchProducts() {
    loading.value = true
    try {
      products.value = await getProducts()
    } finally {
      loading.value = false
    }
  }

  async function create(data: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'cost_price' | 'margin_percent' | 'profit_value'>) {
    const product = await createProduct(data)
    products.value.unshift(product)
    return product
  }

  async function update(id: string, data: Partial<Product>) {
    const product = await updateProduct(id, data)
    const idx = products.value.findIndex(p => p.id === id)
    if (idx !== -1) products.value[idx] = product
    return product
  }

  async function remove(id: string) {
    await deleteProduct(id)
    products.value = products.value.filter(p => p.id !== id)
  }

  return { products, loading, fetchProducts, create, update, remove }
})
