<template>
  <div class="space-y-5">
    <h1 class="text-xl font-bold text-gray-900 dark:text-white">Etiquetas Térmicas</h1>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Configuração -->
      <div class="card p-5 space-y-4">
        <h3 class="font-semibold text-gray-900 dark:text-white">Configurar Etiqueta</h3>

        <div>
          <label class="label">Produto</label>
          <select v-model="form.productId" class="input" @change="onProductChange">
            <option value="">Selecionar produto...</option>
            <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>

        <div>
          <label class="label">Tamanho</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="size in sizes"
              :key="size.value"
              type="button"
              @click="form.size = size.value as LabelSize"
              :class="[
                'p-3 rounded-lg border text-sm font-medium text-center transition-all',
                form.size === size.value
                  ? 'bg-narceja-500 border-narceja-500 text-white'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-narceja-300'
              ]"
            >
              <div class="font-bold">{{ size.label }}</div>
              <div class="text-xs opacity-75">{{ size.desc }}</div>
            </button>
          </div>
        </div>

        <div>
          <label class="label">Nome da Loja</label>
          <input v-model="form.storeName" type="text" class="input" />
        </div>

        <div v-if="form.productId">
          <label class="label">Código de Barras</label>
          <input v-model="form.barcode" type="text" class="input" placeholder="Automático do produto" />
        </div>

        <div>
          <label class="label">Validade</label>
          <input v-model="form.expirationDate" type="date" class="input" />
        </div>

        <div>
          <label class="label">Quantidade de cópias</label>
          <input v-model.number="form.copies" type="number" min="1" max="100" class="input" />
        </div>

        <div class="grid grid-cols-2 gap-3 pt-2">
          <button @click="generatePDF" :disabled="!form.productId && !form.storeName" class="btn-primary flex items-center justify-center gap-2">
            <i class="pi pi-file-pdf"></i>
            <span>Baixar PDF</span>
          </button>
          <button @click="generateZPL" :disabled="!form.productId && !form.storeName" class="btn-secondary flex items-center justify-center gap-2">
            <i class="pi pi-download"></i>
            <span>Baixar ZPL</span>
          </button>
        </div>

        <p class="text-xs text-gray-400">
          PDF: impressoras comuns. ZPL: Zebra, Elgin, Brother (impressoras térmicas).
        </p>
      </div>

      <!-- Preview -->
      <div class="card p-5 flex flex-col items-center justify-center">
        <h3 class="font-semibold text-gray-900 dark:text-white mb-4 self-start">Preview</h3>
        <div
          class="bg-white border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-4 text-center"
          :style="previewStyle"
        >
          <p class="text-xs font-bold text-narceja-700" style="font-size: 8px;">{{ form.storeName }}</p>
          <p class="font-bold text-gray-900 leading-tight" style="font-size: 10px; margin-top: 2px;">
            {{ selectedProduct?.name || 'Nome do Produto' }}
          </p>
          <div v-if="form.barcode || selectedProduct?.barcode" class="my-1 w-full">
            <svg ref="barcodeEl" class="w-full h-auto"></svg>
          </div>
          <p v-if="form.expirationDate" class="text-gray-600" style="font-size: 7px;">
            Val: {{ formatDate(form.expirationDate) }}
          </p>
        </div>
        <p class="text-xs text-gray-400 mt-3">Preview ilustrativo (escala não real)</p>
      </div>
    </div>

    <!-- Histórico -->
    <div class="card overflow-hidden">
      <div class="p-4 border-b border-gray-100 dark:border-gray-700">
        <h3 class="font-semibold text-gray-900 dark:text-white">Histórico de Etiquetas</h3>
      </div>
      <div v-if="labels.length === 0" class="flex items-center justify-center py-12 text-gray-400">
        <p class="text-sm">Nenhuma etiqueta gerada ainda</p>
      </div>
      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-800/50">
          <tr class="text-left text-gray-500 dark:text-gray-400">
            <th class="px-4 py-3 font-medium">Nome</th>
            <th class="px-4 py-3 font-medium">Tamanho</th>
            <th class="px-4 py-3 font-medium text-right">Impressões</th>
            <th class="px-4 py-3 font-medium">Última Impressão</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr v-for="label in labels" :key="label.id">
            <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ label.name }}</td>
            <td class="px-4 py-3 text-gray-500">{{ label.size }}</td>
            <td class="px-4 py-3 text-right text-gray-500">{{ label.print_count }}</td>
            <td class="px-4 py-3 text-gray-500 text-xs">{{ label.last_printed_at ? formatDateTime(label.last_printed_at) : '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useProductsStore } from '@/stores/products'
import { getLabels, createLabel } from '@/services/labelService'
import { useAuthStore } from '@/stores/auth'
import { useLabel } from '@/composables/useLabel'
import { useToast } from '@/composables/useToast'
import { formatDate, formatDateTime } from '@/utils/formatters'
import type { Label, LabelSize } from '@/types'
import JsBarcode from 'jsbarcode'

const productsStore = useProductsStore()
const authStore = useAuthStore()
const { generatePDFLabel, downloadZPL } = useLabel()
const toast = useToast()

const products = computed(() => productsStore.products)
const labels = ref<Label[]>([])
const barcodeEl = ref<SVGElement | null>(null)

const sizes = [
  { value: '40x30', label: '40 × 30 mm', desc: 'Pequena (padrão)' },
  { value: '50x30', label: '50 × 30 mm', desc: 'Média' },
  { value: '60x40', label: '60 × 40 mm', desc: 'Grande' },
  { value: '100x50', label: '100 × 50 mm', desc: 'Extra grande' },
]

const form = ref({
  productId: '',
  size: '40x30' as LabelSize,
  storeName: 'Narceja Pâtisserie',
  barcode: '',
  expirationDate: '',
  copies: 1,
})

const selectedProduct = computed(() => products.value.find(p => p.id === form.value.productId))

const previewStyle = computed(() => {
  const [w, h] = form.value.size.split('x').map(Number)
  const scale = 4
  return { width: `${w * scale}px`, height: `${h * scale}px` }
})

function onProductChange() {
  if (selectedProduct.value) {
    form.value.barcode = selectedProduct.value.barcode || ''
  }
}

watch([() => form.value.barcode, () => selectedProduct.value?.barcode], async () => {
  const bc = form.value.barcode || selectedProduct.value?.barcode
  if (!bc || !barcodeEl.value) return
  await nextTick()
  try {
    JsBarcode(barcodeEl.value, bc, { format: 'CODE128', width: 1, height: 25, displayValue: true, fontSize: 8 })
  } catch {
    toast.error('Código de barras inválido para o formato CODE128.')
  }
})

async function generatePDF() {
  generatePDFLabel({
    storeName: form.value.storeName,
    productName: selectedProduct.value?.name || 'Produto',
    barcode: form.value.barcode || selectedProduct.value?.barcode || '',
    expirationDate: form.value.expirationDate ? formatDate(form.value.expirationDate) : undefined,
    size: form.value.size,
    copies: form.value.copies,
  })
  if (selectedProduct.value) {
    await saveLabel()
  }
}

function generateZPL() {
  downloadZPL({
    storeName: form.value.storeName,
    productName: selectedProduct.value?.name || 'Produto',
    barcode: form.value.barcode || selectedProduct.value?.barcode || '',
    expirationDate: form.value.expirationDate ? formatDate(form.value.expirationDate) : undefined,
    size: form.value.size,
    copies: form.value.copies,
  })
}

async function saveLabel() {
  try {
    await createLabel({
      product_id: form.value.productId || undefined,
      name: selectedProduct.value?.name || 'Etiqueta',
      barcode: form.value.barcode || selectedProduct.value?.barcode,
      size: form.value.size,
      template_data: { storeName: form.value.storeName },
      created_by: authStore.profile?.id,
    })
    labels.value = await getLabels()
  } catch { /* não crítico */ }
}

onMounted(async () => {
  await productsStore.fetchProducts()
  labels.value = await getLabels()
})
</script>
