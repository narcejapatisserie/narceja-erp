<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">Produtos</h1>
        <p class="text-sm text-gray-500">{{ filteredProducts.length }} produtos cadastrados</p>
      </div>
      <button @click="openForm()" class="btn-primary flex items-center gap-2">
        <i class="pi pi-plus"></i>
        <span>Novo Produto</span>
      </button>
    </div>

    <!-- Filtros -->
    <div class="card p-4 flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
        <input v-model="search" type="text" class="input pl-9" placeholder="Buscar produto..." />
      </div>
      <select v-model="filterCategory" class="input sm:w-48">
        <option value="">Todas as categorias</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
    </div>

    <!-- Loading / Vazio -->
    <div v-if="store.loading && store.products.length === 0" class="card flex items-center justify-center py-16">
      <i class="pi pi-spin pi-spinner text-narceja-500 text-3xl"></i>
    </div>
    <div v-else-if="filteredProducts.length === 0" class="card flex flex-col items-center justify-center py-16 text-gray-400">
      <i class="pi pi-box text-4xl mb-3"></i>
      <p>Nenhum produto encontrado</p>
      <button @click="openForm()" class="btn-primary mt-4 text-sm">Cadastrar primeiro produto</button>
    </div>

    <!-- Mobile: cards -->
    <div v-else class="sm:hidden space-y-3">
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="card p-4"
      >
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-narceja-100 dark:bg-narceja-900/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img v-if="product.image_url" :src="product.image_url" class="w-full h-full object-cover rounded-xl" />
            <i v-else class="pi pi-box text-narceja-500"></i>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{{ product.name }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ product.category || 'Sem categoria' }}</p>
          </div>
          <span :class="['badge flex-shrink-0', product.stock_quantity <= product.min_stock ? 'badge-warning' : 'badge-success']">
            {{ product.stock_quantity }} {{ product.unit }}
          </span>
        </div>
        <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div class="flex gap-4 text-sm">
            <div>
              <p class="text-xs text-gray-400">Preço</p>
              <p class="font-semibold text-gray-900 dark:text-white">{{ formatCurrency(product.sale_price) }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Custo</p>
              <p class="text-gray-600 dark:text-gray-400">{{ formatCurrency(product.cost_price) }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Margem</p>
              <p :class="product.margin_percent >= 30 ? 'text-green-600' : product.margin_percent >= 15 ? 'text-yellow-600' : 'text-red-600'">
                {{ formatPercent(product.margin_percent) }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <RouterLink :to="`/produtos/${product.id}`" class="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600">
              <i class="pi pi-eye text-sm"></i>
            </RouterLink>
            <button @click="openForm(product)" class="p-2 rounded-lg hover:bg-narceja-50 dark:hover:bg-narceja-900/20 text-narceja-600">
              <i class="pi pi-pencil text-sm"></i>
            </button>
            <button @click="handleDelete(product)" class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
              <i class="pi pi-trash text-sm"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop: tabela com scroll horizontal -->
    <div v-if="!store.loading || store.products.length > 0" class="card overflow-hidden hidden sm:block">
      <div class="overflow-x-auto">
        <table class="w-full text-sm min-w-[600px]">
          <thead class="bg-gray-50 dark:bg-gray-800/50">
            <tr class="text-left text-gray-500 dark:text-gray-400">
              <th class="px-4 py-3 font-medium">Produto</th>
              <th class="px-4 py-3 font-medium">Categoria</th>
              <th class="px-4 py-3 font-medium text-right">Preço</th>
              <th class="px-4 py-3 font-medium text-right">Custo</th>
              <th class="px-4 py-3 font-medium text-right">Margem</th>
              <th class="px-4 py-3 font-medium text-right">Estoque</th>
              <th class="px-4 py-3 font-medium text-center">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr
              v-for="product in filteredProducts"
              :key="product.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-lg bg-narceja-100 dark:bg-narceja-900/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img v-if="product.image_url" :src="product.image_url" class="w-full h-full object-cover rounded-lg" />
                    <i v-else class="pi pi-box text-narceja-500 text-sm"></i>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">{{ product.name }}</p>
                    <p v-if="product.sku" class="text-xs text-gray-400">SKU: {{ product.sku }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ product.category || '-' }}</td>
              <td class="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">{{ formatCurrency(product.sale_price) }}</td>
              <td class="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{{ formatCurrency(product.cost_price) }}</td>
              <td class="px-4 py-3 text-right">
                <span :class="product.margin_percent >= 30 ? 'text-green-600' : product.margin_percent >= 15 ? 'text-yellow-600' : 'text-red-600'">
                  {{ formatPercent(product.margin_percent) }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <span :class="['badge', product.stock_quantity <= product.min_stock ? 'badge-warning' : 'badge-success']">
                  {{ product.stock_quantity }} {{ product.unit }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-center gap-1">
                  <RouterLink :to="`/produtos/${product.id}`" class="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors" v-tooltip="'Ver detalhes'">
                    <i class="pi pi-eye text-sm"></i>
                  </RouterLink>
                  <button @click="openForm(product)" class="p-1.5 rounded hover:bg-narceja-50 dark:hover:bg-narceja-900/20 text-narceja-600 transition-colors" v-tooltip="'Editar'">
                    <i class="pi pi-pencil text-sm"></i>
                  </button>
                  <button @click="handleDelete(product)" class="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors" v-tooltip="'Excluir'">
                    <i class="pi pi-trash text-sm"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de produto -->
    <Dialog v-model:visible="showForm" :header="editingProduct ? 'Editar Produto' : 'Novo Produto'" modal :style="{ width: '700px' }" :maximizable="true">
      <ProductForm
        :product="editingProduct"
        @saved="onSaved"
        @cancel="showForm = false"
      />
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import Dialog from 'primevue/dialog'
import { useProductsStore } from '@/stores/products'
import { formatCurrency, formatPercent } from '@/utils/formatters'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import type { Product } from '@/types'
import ProductForm from '@/components/products/ProductForm.vue'

const store = useProductsStore()
const toast = useToast()
const confirm = useConfirm()

const search = ref('')
const filterCategory = ref('')
const showForm = ref(false)
const editingProduct = ref<Product | undefined>()

const categories = computed(() => {
  const cats = store.products.map(p => p.category).filter(Boolean) as string[]
  return [...new Set(cats)].sort()
})

const filteredProducts = computed(() => {
  return store.products.filter(p => {
    const matchSearch = !search.value || p.name.toLowerCase().includes(search.value.toLowerCase()) || p.sku?.toLowerCase().includes(search.value.toLowerCase())
    const matchCat = !filterCategory.value || p.category === filterCategory.value
    return matchSearch && matchCat
  })
})

function openForm(product?: Product) {
  editingProduct.value = product
  showForm.value = true
}

function onSaved() {
  showForm.value = false
  store.fetchProducts()
  toast.success(editingProduct.value ? 'Produto atualizado!' : 'Produto criado!')
}

async function handleDelete(product: Product) {
  const ok = await confirm.confirmDelete(`Deseja excluir "${product.name}"?`)
  if (!ok) return
  try {
    await store.remove(product.id)
    toast.success('Produto excluído!')
  } catch {
    toast.error('Erro ao excluir produto.')
  }
}

onMounted(() => store.fetchProducts())
</script>
