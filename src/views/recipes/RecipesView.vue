<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between gap-3">
      <h1 class="text-xl font-bold text-gray-900 dark:text-white">Receitas</h1>
      <button @click="openCreate" class="btn-primary flex items-center gap-2">
        <i class="pi pi-plus"></i>
        <span class="hidden sm:inline">Nova Receita</span>
      </button>
    </div>

    <!-- Lista -->
    <div v-if="store.loading" class="flex justify-center py-12">
      <i class="pi pi-spin pi-spinner text-2xl text-narceja-500"></i>
    </div>

    <div v-else-if="store.recipes.length === 0" class="card p-12 flex flex-col items-center gap-3 text-gray-400">
      <i class="pi pi-book text-4xl"></i>
      <p>Nenhuma receita cadastrada</p>
      <button @click="openCreate" class="btn-primary text-sm">Criar primeira receita</button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
        v-for="recipe in store.recipes"
        :key="recipe.id"
        class="card p-4 space-y-3"
      >
        <div class="flex items-start justify-between gap-2">
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white">{{ recipe.name }}</h3>
            <p v-if="recipe.description" class="text-xs text-gray-500 mt-0.5">{{ recipe.description }}</p>
          </div>
          <div class="flex gap-1 flex-shrink-0">
            <button @click="openEdit(recipe)" class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
              <i class="pi pi-pencil text-sm"></i>
            </button>
            <button @click="confirmDelete(recipe)" class="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500">
              <i class="pi pi-trash text-sm"></i>
            </button>
          </div>
        </div>

        <!-- Ingredientes -->
        <div class="space-y-1">
          <div
            v-for="ing in recipe.ingredients"
            :key="ing.raw_material_id"
            class="flex items-center justify-between text-sm"
          >
            <span class="text-gray-600 dark:text-gray-400 truncate">{{ ing.raw_material_name || ing.raw_material_id }}</span>
            <span class="text-gray-500 text-xs flex-shrink-0 ml-2">{{ ing.quantity }} {{ ing.unit }}</span>
          </div>
        </div>

        <!-- Rodapé -->
        <div class="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-sm">
          <span class="text-gray-500">Rende {{ recipe.yield_quantity }} {{ recipe.yield_unit }}</span>
          <div class="text-right">
            <p class="text-xs text-gray-400">Custo total</p>
            <p class="font-semibold text-narceja-700 dark:text-narceja-400">{{ formatCurrency(recipe.cost_total) }}</p>
            <p class="text-xs text-gray-400">{{ formatCurrency(recipe.cost_per_unit) }}/{{ recipe.yield_unit }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Criar/Editar -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 bg-black/50 overflow-y-auto">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg" @click.stop>
          <div class="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 class="font-bold text-gray-900 dark:text-white">{{ editingId ? 'Editar Receita' : 'Nova Receita' }}</h2>
            <button @click="showModal = false" class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
              <i class="pi pi-times text-gray-400"></i>
            </button>
          </div>

          <form @submit.prevent="saveRecipe" class="p-5 space-y-4">
            <!-- Nome -->
            <div>
              <label class="label">Nome da Receita *</label>
              <input v-model="form.name" type="text" class="input" placeholder="Ex: Recheio de Brigadeiro" required />
            </div>

            <!-- Descrição -->
            <div>
              <label class="label">Descrição</label>
              <input v-model="form.description" type="text" class="input" placeholder="Opcional" />
            </div>

            <!-- Rendimento -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Rendimento (quantidade) *</label>
                <input v-model.number="form.yield_quantity" type="number" step="0.01" min="0.01" class="input" placeholder="Ex: 12" required />
              </div>
              <div>
                <label class="label">Unidade do rendimento</label>
                <select v-model="form.yield_unit" class="input">
                  <option value="un">un (unidades/cones)</option>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="l">l</option>
                  <option value="pct">pct</option>
                </select>
              </div>
            </div>

            <!-- Ingredientes -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="label mb-0">Ingredientes</label>
                <button type="button" @click="addIngredient" class="text-xs text-narceja-600 hover:text-narceja-700 flex items-center gap-1">
                  <i class="pi pi-plus"></i> Adicionar
                </button>
              </div>

              <div v-if="form.ingredients.length === 0" class="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                Nenhum ingrediente. Clique em "Adicionar".
              </div>

              <div v-else class="space-y-2">
                <div
                  v-for="(ing, idx) in form.ingredients"
                  :key="idx"
                  class="grid grid-cols-12 gap-2 items-center"
                >
                  <!-- Matéria-prima -->
                  <div class="col-span-5">
                    <select v-model="ing.raw_material_id" class="input text-sm py-1.5" @change="onIngredientChange(idx)">
                      <option value="">Selecionar...</option>
                      <option v-for="rm in rawMaterials" :key="rm.id" :value="rm.id">{{ rm.name }}</option>
                    </select>
                  </div>
                  <!-- Quantidade -->
                  <div class="col-span-3">
                    <input v-model.number="ing.quantity" type="number" step="0.001" min="0" class="input text-sm py-1.5" placeholder="Qtd" @input="onIngredientChange(idx)" />
                  </div>
                  <!-- Unidade -->
                  <div class="col-span-2">
                    <select v-model="ing.unit" class="input text-sm py-1.5">
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="un">un</option>
                      <option value="l">l</option>
                      <option value="ml">ml</option>
                    </select>
                  </div>
                  <!-- Remover -->
                  <div class="col-span-2 text-right">
                    <span class="text-xs text-gray-400 block">{{ formatCurrency(ing.cost) }}</span>
                    <button type="button" @click="form.ingredients.splice(idx, 1); recalcCost()" class="text-red-400 hover:text-red-600">
                      <i class="pi pi-times text-xs"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Custo calculado -->
            <div class="bg-narceja-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-1">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600 dark:text-gray-400">Custo total dos ingredientes</span>
                <span class="font-semibold text-gray-900 dark:text-white">{{ formatCurrency(form.cost_total) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600 dark:text-gray-400">Custo por {{ form.yield_unit }} (÷ {{ form.yield_quantity || '?' }})</span>
                <span class="font-semibold text-narceja-700 dark:text-narceja-400">{{ formatCurrency(form.cost_per_unit) }}</span>
              </div>
            </div>

            <!-- Notas -->
            <div>
              <label class="label">Observações</label>
              <textarea v-model="form.notes" class="input" rows="2" placeholder="Modo de preparo, dicas..."></textarea>
            </div>

            <div class="flex gap-3 pt-2">
              <button type="button" @click="showModal = false" class="btn-secondary flex-1">Cancelar</button>
              <button type="submit" :disabled="saving" class="btn-primary flex-1 flex items-center justify-center gap-2">
                <i v-if="saving" class="pi pi-spin pi-spinner"></i>
                {{ saving ? 'Salvando...' : 'Salvar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Modal confirmar exclusão -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <h3 class="font-bold text-gray-900 dark:text-white">Excluir receita?</h3>
          <p class="text-sm text-gray-500">A receita <strong>{{ deleteTarget.name }}</strong> será desativada. Produtos vinculados a ela não serão afetados.</p>
          <div class="flex gap-3">
            <button @click="deleteTarget = null" class="btn-secondary flex-1">Cancelar</button>
            <button @click="doDelete" class="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-lg transition-colors">Excluir</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRecipesStore } from '@/stores/recipes'
import { useRawMaterialsStore } from '@/stores/rawMaterials'
import { useToast } from '@/composables/useToast'
import type { Recipe, RecipeIngredient } from '@/types'

const store = useRecipesStore()
const rmStore = useRawMaterialsStore()
const toast = useToast()

const rawMaterials = computed(() => rmStore.rawMaterials)

const showModal = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const deleteTarget = ref<Recipe | null>(null)

interface FormData {
  name: string
  description: string
  yield_quantity: number
  yield_unit: string
  cost_total: number
  cost_per_unit: number
  ingredients: RecipeIngredient[]
  notes: string
}

const emptyForm = (): FormData => ({
  name: '',
  description: '',
  yield_quantity: 1,
  yield_unit: 'un',
  cost_total: 0,
  cost_per_unit: 0,
  ingredients: [],
  notes: '',
})

const form = ref<FormData>(emptyForm())

function openCreate() {
  editingId.value = null
  form.value = emptyForm()
  showModal.value = true
}

function openEdit(recipe: Recipe) {
  editingId.value = recipe.id
  form.value = {
    name: recipe.name,
    description: recipe.description || '',
    yield_quantity: recipe.yield_quantity,
    yield_unit: recipe.yield_unit,
    cost_total: recipe.cost_total,
    cost_per_unit: recipe.cost_per_unit,
    ingredients: recipe.ingredients.map(i => ({ ...i })),
    notes: recipe.notes || '',
  }
  showModal.value = true
}

function addIngredient() {
  form.value.ingredients.push({ raw_material_id: '', raw_material_name: '', quantity: 0, unit: 'kg', cost: 0 })
}

function onIngredientChange(idx: number) {
  const ing = form.value.ingredients[idx]
  const rm = rawMaterials.value.find(r => r.id === ing.raw_material_id)
  if (rm) {
    ing.raw_material_name = rm.name
    // converter unidade se necessário
    let qty = ing.quantity
    if (ing.unit === 'g' && rm.unit === 'kg') qty = ing.quantity / 1000
    else if (ing.unit === 'kg' && rm.unit === 'g') qty = ing.quantity * 1000
    ing.cost = parseFloat((rm.cost_per_unit * qty).toFixed(4))
  }
  recalcCost()
}

function recalcCost() {
  const total = form.value.ingredients.reduce((s, i) => s + (i.cost || 0), 0)
  form.value.cost_total = parseFloat(total.toFixed(4))
  form.value.cost_per_unit = form.value.yield_quantity > 0
    ? parseFloat((total / form.value.yield_quantity).toFixed(4))
    : 0
}

watch(() => form.value.yield_quantity, recalcCost)

async function saveRecipe() {
  saving.value = true
  try {
    recalcCost()
    const payload = {
      name: form.value.name,
      description: form.value.description || undefined,
      yield_quantity: form.value.yield_quantity,
      yield_unit: form.value.yield_unit,
      cost_total: form.value.cost_total,
      cost_per_unit: form.value.cost_per_unit,
      ingredients: form.value.ingredients,
      notes: form.value.notes || undefined,
      is_active: true,
    }
    if (editingId.value) {
      await store.editRecipe(editingId.value, payload)
      toast.success('Receita atualizada!')
    } else {
      await store.addRecipe(payload)
      toast.success('Receita criada!')
    }
    showModal.value = false
  } catch (e) {
    toast.error('Erro ao salvar receita.')
  } finally {
    saving.value = false
  }
}

function confirmDelete(recipe: Recipe) {
  deleteTarget.value = recipe
}

async function doDelete() {
  if (!deleteTarget.value) return
  await store.removeRecipe(deleteTarget.value.id)
  toast.success('Receita removida.')
  deleteTarget.value = null
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

onMounted(async () => {
  await Promise.all([store.fetchRecipes(), rmStore.fetchRawMaterials()])
})
</script>
