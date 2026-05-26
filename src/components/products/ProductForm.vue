<template>
  <form @submit.prevent="handleSubmit" class="space-y-5">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Nome -->
      <div class="md:col-span-2">
        <label class="label">Nome *</label>
        <input v-model="form.name" type="text" class="input" placeholder="Ex: Cone Trufado Chocolate" required />
      </div>

      <!-- Categoria -->
      <div>
        <label class="label">Categoria</label>
        <input v-model="form.category" type="text" class="input" placeholder="Ex: Cones, Trufados..." list="categories-list" />
        <datalist id="categories-list">
          <option v-for="cat in existingCategories" :key="cat" :value="cat" />
        </datalist>
      </div>

      <!-- SKU -->
      <div>
        <label class="label">SKU</label>
        <div class="flex gap-2">
          <input v-model="form.sku" type="text" class="input" placeholder="Gerado automaticamente" />
          <button type="button" @click="generateSku" class="btn-secondary whitespace-nowrap px-3">Gerar</button>
        </div>
      </div>

      <!-- Código de barras -->
      <div>
        <label class="label">Código de Barras</label>
        <div class="flex gap-2">
          <input v-model="form.barcode" type="text" class="input" placeholder="Ex: 7891234567890" />
          <button type="button" @click="generateBarcode" class="btn-secondary px-3">Gerar</button>
        </div>
      </div>

      <!-- Unidade -->
      <div>
        <label class="label">Unidade</label>
        <select v-model="form.unit" class="input">
          <option value="un">Unidade (un)</option>
          <option value="kg">Quilograma (kg)</option>
          <option value="g">Grama (g)</option>
          <option value="l">Litro (l)</option>
          <option value="ml">Mililitro (ml)</option>
        </select>
      </div>

      <!-- Preço de venda -->
      <div>
        <label class="label">Preço de Venda (R$) *</label>
        <input v-model.number="form.sale_price" type="number" step="0.01" min="0" class="input" placeholder="0,00" required />
      </div>

      <!-- Estoque -->
      <div>
        <label class="label">Estoque Atual</label>
        <input v-model.number="form.stock_quantity" type="number" step="0.001" min="0" class="input" placeholder="0" />
      </div>

      <!-- Estoque mínimo -->
      <div>
        <label class="label">Estoque Mínimo (alerta)</label>
        <input v-model.number="form.min_stock" type="number" step="0.001" min="0" class="input" placeholder="0" />
      </div>

      <!-- Imagem -->
      <div class="md:col-span-2">
        <label class="label">Imagem do Produto</label>
        <div class="flex gap-3 items-start">
          <!-- Preview -->
          <div class="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden bg-gray-50 dark:bg-gray-800">
            <img v-if="imagePreview" :src="imagePreview" class="w-full h-full object-cover rounded-xl" @error="imagePreview = ''" />
            <i v-else class="pi pi-image text-gray-300 text-2xl"></i>
          </div>
          <div class="flex-1 space-y-2">
            <!-- Upload de arquivo -->
            <label class="btn-secondary text-sm cursor-pointer flex items-center gap-2 w-full justify-center">
              <i class="pi pi-upload text-sm"></i>
              <span>{{ uploadingImage ? 'Enviando...' : 'Escolher arquivo' }}</span>
              <input type="file" accept="image/*" class="hidden" @change="handleImageUpload" :disabled="uploadingImage" />
            </label>
            <!-- Ou URL -->
            <div class="relative">
              <input v-model="form.image_url" type="url" class="input text-sm pr-8" placeholder="Ou cole uma URL de imagem..." @input="imagePreview = form.image_url" />
              <button v-if="form.image_url" type="button" @click="form.image_url = ''; imagePreview = ''" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <i class="pi pi-times text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Descrição -->
      <div class="md:col-span-2">
        <label class="label">Descrição</label>
        <textarea v-model="form.description" class="input resize-none" rows="2" placeholder="Descrição opcional..."></textarea>
      </div>
    </div>

    <!-- Custos calculados -->
    <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
      <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">💰 Análise de Custo</h4>
      <div class="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p class="text-gray-500 text-xs">Custo (receita)</p>
          <p class="font-bold text-gray-900 dark:text-white">{{ formatCurrency(calculatedCost) }}</p>
        </div>
        <div>
          <p class="text-gray-500 text-xs">Margem</p>
          <p class="font-bold" :class="calculatedMargin >= 30 ? 'text-green-600' : calculatedMargin >= 15 ? 'text-yellow-600' : 'text-red-600'">
            {{ formatPercent(calculatedMargin) }}
          </p>
        </div>
        <div>
          <p class="text-gray-500 text-xs">Lucro p/ unidade</p>
          <p class="font-bold" :class="calculatedProfit >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ formatCurrency(calculatedProfit) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Receita vinculada -->
    <div class="space-y-3">
      <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">🧪 Receita do Produto</h4>

      <!-- Seletor de receita cadastrada -->
      <div>
        <label class="label">Vincular receita cadastrada</label>
        <div class="flex gap-2">
          <select v-model="form.recipe_id" class="input flex-1" @change="onRecipeSelect">
            <option value="">— Sem receita vinculada —</option>
            <option v-for="r in recipes" :key="r.id" :value="r.id">
              {{ r.name }} (rende {{ r.yield_quantity }} {{ r.yield_unit }} · custo {{ formatCurrency(r.cost_per_unit) }}/{{ r.yield_unit }})
            </option>
          </select>
          <RouterLink to="/receitas" target="_blank" class="btn-secondary px-3 flex items-center gap-1 text-sm whitespace-nowrap">
            <i class="pi pi-external-link text-xs"></i>
            <span class="hidden sm:inline">Gerenciar</span>
          </RouterLink>
        </div>
      </div>

      <!-- Resumo da receita selecionada -->
      <div v-if="selectedRecipe" class="bg-narceja-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ selectedRecipe.name }}</span>
          <span class="text-xs badge-secondary">{{ selectedRecipe.yield_quantity }} {{ selectedRecipe.yield_unit }}</span>
        </div>
        <div class="space-y-1">
          <div v-for="ing in selectedRecipe.ingredients" :key="ing.raw_material_id" class="flex justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>{{ ing.raw_material_name }}</span>
            <span>{{ ing.quantity }} {{ ing.unit }} — {{ formatCurrency(ing.cost) }}</span>
          </div>
        </div>
        <div class="pt-1 border-t border-narceja-200 dark:border-gray-600 flex justify-between text-sm font-semibold">
          <span class="text-gray-600 dark:text-gray-400">Custo por unidade</span>
          <span class="text-narceja-700 dark:text-narceja-400">{{ formatCurrency(selectedRecipe.cost_per_unit) }}</span>
        </div>
      </div>

      <!-- Ingredientes adicionais (casquinha, cobertura, etc.) -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="label mb-0 text-xs">Ingredientes adicionais (casquinha, cobertura...)</label>
          <button type="button" @click="addRecipeItem" class="text-xs text-narceja-600 hover:text-narceja-700 flex items-center gap-1">
            <i class="pi pi-plus"></i> Adicionar
          </button>
        </div>
        <div v-if="form.recipe.length === 0" class="text-xs text-gray-400 text-center py-3 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
          Nenhum ingrediente adicional
        </div>
        <div class="space-y-2">
          <div v-for="(item, idx) in form.recipe" :key="idx" class="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
            <select v-model="item.raw_material_id" class="input flex-1 text-sm" @change="updateItemUnit(item)">
              <option value="">Selecionar matéria-prima</option>
              <option v-for="rm in rawMaterials" :key="rm.id" :value="rm.id">{{ rm.name }} ({{ rm.unit }})</option>
            </select>
            <input v-model.number="item.quantity" type="number" step="0.001" min="0" class="input w-24 text-sm" placeholder="Qtd" />
            <span class="text-xs text-gray-500 w-10 text-center">{{ item.unit }}</span>
            <button type="button" @click="form.recipe.splice(idx, 1)" class="text-red-400 hover:text-red-600 p-1">
              <i class="pi pi-times text-sm"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Ações -->
    <div class="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
      <button type="button" @click="$emit('cancel')" class="btn-secondary">Cancelar</button>
      <button type="submit" :disabled="saving" class="btn-primary flex items-center gap-2">
        <i v-if="saving" class="pi pi-spin pi-spinner"></i>
        <span>{{ saving ? 'Salvando...' : (props.product ? 'Atualizar' : 'Criar Produto') }}</span>
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useProductsStore } from '@/stores/products'
import { useRawMaterialsStore } from '@/stores/rawMaterials'
import { useRecipesStore } from '@/stores/recipes'
import { useBarcode } from '@/composables/useBarcode'
import { formatCurrency, formatPercent } from '@/utils/formatters'
import type { Product, RecipeItem, UnitMeasure } from '@/types'

const props = defineProps<{ product?: Product }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()

const store = useProductsStore()
const rmStore = useRawMaterialsStore()
const recipesStore = useRecipesStore()
const { generateSKU, generateBarcodValue } = useBarcode()

const saving = ref(false)
const rawMaterials = computed(() => rmStore.materials)
const recipes = computed(() => recipesStore.recipes)
const selectedRecipe = computed(() => recipes.value.find(r => r.id === form.value.recipe_id) || null)

const existingCategories = computed(() => {
  const cats = store.products.map(p => p.category).filter(Boolean) as string[]
  return [...new Set(cats)].sort()
})

interface ProductFormData {
  name: string; description: string; category: string; sku: string; barcode: string
  sale_price: number; stock_quantity: number; min_stock: number; unit: UnitMeasure
  recipe: RecipeItem[]; recipe_id: string; is_active: boolean; image_url: string
}

const defaultForm = (): ProductFormData => ({
  name: '', description: '', category: '', sku: '', barcode: '',
  sale_price: 0, stock_quantity: 0, min_stock: 0, unit: 'un',
  recipe: [], recipe_id: '', is_active: true, image_url: '',
})

const form = ref<ProductFormData>(defaultForm())
const imagePreview = ref('')
const uploadingImage = ref(false)

watch(() => props.product, (p) => {
  if (p) {
    form.value = {
      name: p.name,
      description: p.description || '',
      category: p.category || '',
      sku: p.sku || '',
      barcode: p.barcode || '',
      sale_price: p.sale_price,
      stock_quantity: p.stock_quantity,
      min_stock: p.min_stock,
      unit: p.unit,
      recipe: p.recipe ? [...p.recipe] : [],
      recipe_id: (p as any).recipe_id || '',
      is_active: p.is_active,
      image_url: p.image_url || '',
    }
    imagePreview.value = p.image_url || ''
  } else {
    form.value = defaultForm()
    imagePreview.value = ''
  }
}, { immediate: true })

async function handleImageUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    alert('Imagem muito grande. Máximo 5MB.')
    return
  }
  uploadingImage.value = true
  try {
    const { supabase } = await import('@/services/supabase')
    const ext = file.name.split('.').pop()
    const path = `products/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('product-images').getPublicUrl(path)
    form.value.image_url = data.publicUrl
    imagePreview.value = data.publicUrl
  } catch {
    // fallback: usar base64 local
    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target?.result as string
      form.value.image_url = url
      imagePreview.value = url
    }
    reader.readAsDataURL(file)
  } finally {
    uploadingImage.value = false
  }
}

function onRecipeSelect() {
  // custo já é recalculado via computed
}

const calculatedCost = computed(() => {
  // custo da receita vinculada (por unidade)
  const recipeCost = selectedRecipe.value?.cost_per_unit || 0
  // custo dos ingredientes adicionais (casquinha, cobertura...)
  const extraCost = form.value.recipe.reduce((total, item) => {
    const rm = rawMaterials.value.find(m => m.id === item.raw_material_id)
    if (!rm || !item.quantity) return total
    return total + rm.cost_per_unit * item.quantity
  }, 0)
  return recipeCost + extraCost
})

const calculatedProfit = computed(() => form.value.sale_price - calculatedCost.value)
const calculatedMargin = computed(() => {
  if (!form.value.sale_price) return 0
  return (calculatedProfit.value / form.value.sale_price) * 100
})

function generateSku() { form.value.sku = generateSKU(form.value.name || 'PROD') }
function generateBarcode() { form.value.barcode = generateBarcodValue() }

function addRecipeItem() {
  form.value.recipe.push({ raw_material_id: '', quantity: 0, unit: 'kg', cost: 0 })
}

function updateItemUnit(item: RecipeItem) {
  const rm = rawMaterials.value.find(m => m.id === item.raw_material_id)
  if (rm) item.unit = rm.unit
}

async function handleSubmit() {
  saving.value = true
  try {
    const data = {
      ...form.value,
      recipe: form.value.recipe.filter(i => i.raw_material_id && i.quantity > 0),
      recipe_id: form.value.recipe_id || undefined,
      image_url: form.value.image_url || undefined,
      cost_price: calculatedCost.value,
      margin_percent: form.value.sale_price > 0 ? calculatedMargin.value : 0,
      profit_value: calculatedProfit.value,
    }
    if (props.product) {
      await store.update(props.product.id, data)
    } else {
      await store.create(data)
    }
    emit('saved')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  rmStore.fetchMaterials()
  recipesStore.fetchRecipes()
})
</script>
