<template>
  <div v-if="loading" class="flex items-center justify-center py-20">
    <i class="pi pi-spin pi-spinner text-narceja-500 text-3xl"></i>
  </div>

  <div v-else-if="product" class="space-y-6 max-w-4xl">
    <div class="flex items-center gap-4">
      <RouterLink to="/produtos" class="btn-secondary p-2">
        <i class="pi pi-arrow-left"></i>
      </RouterLink>
      <div class="flex-1">
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">{{ product.name }}</h1>
        <p v-if="product.category" class="text-sm text-gray-500">{{ product.category }}</p>
      </div>
      <button @click="showEdit = true" class="btn-primary flex items-center gap-2">
        <i class="pi pi-pencil"></i> Editar
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="card p-5">
        <p class="text-xs text-gray-500 mb-1">Preço de Venda</p>
        <p class="text-2xl font-bold text-narceja-700 dark:text-narceja-400">{{ formatCurrency(product.sale_price) }}</p>
      </div>
      <div class="card p-5">
        <p class="text-xs text-gray-500 mb-1">Custo</p>
        <p class="text-2xl font-bold text-gray-700 dark:text-gray-300">{{ formatCurrency(product.cost_price) }}</p>
      </div>
      <div class="card p-5">
        <p class="text-xs text-gray-500 mb-1">Margem / Lucro</p>
        <p class="text-2xl font-bold" :class="product.margin_percent >= 30 ? 'text-green-600' : 'text-yellow-600'">
          {{ formatPercent(product.margin_percent) }}
        </p>
        <p class="text-xs text-gray-400">{{ formatCurrency(product.profit_value) }} por unidade</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div class="card p-5 space-y-3">
        <h3 class="font-semibold text-gray-900 dark:text-white">Informações</h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between"><span class="text-gray-500">SKU</span><span class="font-medium">{{ product.sku || '-' }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Código de Barras</span><span class="font-medium">{{ product.barcode || '-' }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Unidade</span><span class="font-medium">{{ product.unit }}</span></div>
          <div class="flex justify-between">
            <span class="text-gray-500">Estoque</span>
            <span :class="['font-medium', product.stock_quantity <= product.min_stock ? 'text-yellow-600' : 'text-green-600']">
              {{ product.stock_quantity }} {{ product.unit }}
            </span>
          </div>
          <div class="flex justify-between"><span class="text-gray-500">Estoque Mín.</span><span class="font-medium">{{ product.min_stock }} {{ product.unit }}</span></div>
        </div>
        <div v-if="product.barcode" class="pt-2">
          <svg :id="`barcode-${product.id}`"></svg>
        </div>
      </div>

      <div class="card p-5">
        <h3 class="font-semibold text-gray-900 dark:text-white mb-3">Receita</h3>
        <div v-if="!product.recipe || product.recipe.length === 0" class="text-sm text-gray-400">Nenhum ingrediente cadastrado.</div>
        <div v-else class="space-y-2 text-sm">
          <div v-for="item in product.recipe" :key="item.raw_material_id" class="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-gray-700 last:border-0">
            <span class="text-gray-700 dark:text-gray-300">{{ getRawMaterialName(item.raw_material_id) }}</span>
            <span class="text-gray-500">{{ item.quantity }} {{ item.unit }}</span>
          </div>
        </div>
      </div>
    </div>

    <Dialog v-model:visible="showEdit" header="Editar Produto" modal :style="{ width: '700px' }">
      <ProductForm :product="product" @saved="onSaved" @cancel="showEdit = false" />
    </Dialog>
  </div>

  <div v-else class="text-center py-20 text-gray-400">
    <p>Produto não encontrado.</p>
    <RouterLink to="/produtos" class="btn-primary mt-4 inline-block">Voltar</RouterLink>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import Dialog from 'primevue/dialog'
import { getProduct } from '@/services/productService'
import { useRawMaterialsStore } from '@/stores/rawMaterials'
import { useBarcode } from '@/composables/useBarcode'
import { formatCurrency, formatPercent } from '@/utils/formatters'
import type { Product } from '@/types'
import ProductForm from '@/components/products/ProductForm.vue'

const route = useRoute()
const rmStore = useRawMaterialsStore()
const { generateBarcode } = useBarcode()

const product = ref<Product | null>(null)
const loading = ref(true)
const showEdit = ref(false)

async function load() {
  loading.value = true
  try {
    const [p] = await Promise.all([
      getProduct(route.params.id as string),
      rmStore.fetchMaterials(),
    ])
    product.value = p
    await nextTick()
    if (product.value?.barcode) {
      generateBarcode(`barcode-${product.value.id}`, product.value.barcode)
    }
  } finally {
    loading.value = false
  }
}

function getRawMaterialName(id: string) {
  const found = rmStore.materials.find(m => m.id === id)
  return found ? found.name : `(material removido)`
}

async function onSaved() {
  showEdit.value = false
  await load()
}

onMounted(load)
</script>
