<template>
  <div class="space-y-5">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">Etiquetas A4 — Impressão em Massa</h1>
        <p class="text-sm text-gray-500">Gera folhas A4 com múltiplas etiquetas para impressora comum</p>
      </div>
      <button @click="generatePDF" :disabled="generating || rows.length === 0" class="btn-primary flex items-center gap-2">
        <i :class="['pi', generating ? 'pi-spin pi-spinner' : 'pi-file-pdf']"></i>
        {{ generating ? 'Gerando...' : 'Gerar PDF' }}
      </button>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <!-- Configurações -->
      <div class="xl:col-span-1 space-y-4">

        <!-- Modo -->
        <div class="card p-4 space-y-3">
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Modo de Etiqueta</h3>
          <div class="grid grid-cols-3 gap-2">
            <button
              @click="mode = 'barcode-only'"
              :class="['p-3 rounded-lg border text-xs font-medium text-center transition-all', mode === 'barcode-only' ? 'bg-narceja-500 border-narceja-500 text-white' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-narceja-300']"
            >
              <i class="pi pi-barcode block text-lg mb-1"></i>
              Só código
            </button>
            <button
              @click="mode = 'full'"
              :class="['p-3 rounded-lg border text-xs font-medium text-center transition-all', mode === 'full' ? 'bg-narceja-500 border-narceja-500 text-white' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-narceja-300']"
            >
              <i class="pi pi-tag block text-lg mb-1"></i>
              Completa
            </button>
            <button
              @click="mode = 'flavor'"
              :class="['p-3 rounded-lg border text-xs font-medium text-center transition-all', mode === 'flavor' ? 'bg-narceja-500 border-narceja-500 text-white' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-narceja-300']"
            >
              <i class="pi pi-pencil block text-lg mb-1"></i>
              Com Sabor
            </button>
          </div>
        </div>

        <!-- Layout A4 -->
        <div class="card p-4 space-y-3">
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Layout na Folha A4</h3>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">Colunas</label>
              <select v-model.number="cols" class="input">
                <option :value="1">1 coluna</option>
                <option :value="2">2 colunas</option>
                <option :value="3">3 colunas</option>
                <option :value="4">4 colunas</option>
              </select>
            </div>
            <div>
              <label class="label">Linhas por página</label>
              <select v-model.number="rowsPerPage" class="input">
                <option :value="5">5 linhas</option>
                <option :value="6">6 linhas</option>
                <option :value="7">7 linhas</option>
                <option :value="8">8 linhas</option>
                <option :value="10">10 linhas</option>
              </select>
            </div>
          </div>
          <p class="text-xs text-gray-400">
            {{ cols * rowsPerPage }} etiquetas por página
          </p>
        </div>

        <!-- Loja (só no modo full) -->
        <div v-if="mode === 'full'" class="card p-4 space-y-3">
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Dados da Loja</h3>
          <div>
            <label class="label">Nome da loja</label>
            <input v-model="storeName" type="text" class="input text-sm" placeholder="Narceja Pâtisserie" />
          </div>
          <div>
            <label class="label">Logo (URL ou deixe em branco)</label>
            <input v-model="logoUrl" type="text" class="input text-sm" placeholder="https://..." />
          </div>
        </div>

        <!-- Adicionar item -->
        <div class="card p-4 space-y-3">
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Adicionar Etiqueta</h3>

          <!-- Da base de produtos -->
          <div>
            <label class="label">Selecionar produto</label>
            <select v-model="selectedProductId" @change="fillFromProduct" class="input text-sm">
              <option value="">— selecionar —</option>
              <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>

          <div class="text-xs text-gray-400 text-center">— ou preencher manualmente —</div>

          <div>
            <label class="label">Código de barras *</label>
            <input v-model="newItem.barcode" type="text" class="input text-sm" placeholder="Ex: 7891234567890" />
          </div>
          <div v-if="mode === 'full'">
            <label class="label">Sabor / Nome do produto</label>
            <input v-model="newItem.productName" type="text" class="input text-sm" placeholder="Ex: Cone Trufa Belga" />
          </div>
          <div v-if="mode === 'full'">
            <label class="label">Validade</label>
            <input v-model="newItem.expirationDate" type="date" class="input text-sm" />
          </div>
          <div>
            <label class="label">Quantidade de cópias</label>
            <input v-model.number="newItem.copies" type="number" min="1" max="9999" class="input text-sm" />
          </div>

          <button
            @click="addRow"
            :disabled="!newItem.barcode"
            class="w-full btn-primary text-sm flex items-center justify-center gap-2"
          >
            <i class="pi pi-plus"></i> Adicionar à lista
          </button>
        </div>
      </div>

      <!-- Lista de itens + preview -->
      <div class="xl:col-span-2 space-y-4">

        <!-- Lista -->
        <div class="card overflow-hidden">
          <div class="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Lista de Etiquetas</h3>
              <p class="text-xs text-gray-400 mt-0.5">Total: {{ totalLabels }} etiquetas · {{ totalPages }} página(s)</p>
            </div>
            <button v-if="rows.length > 0" @click="rows = []" class="text-xs text-red-500 hover:text-red-700">
              Limpar tudo
            </button>
          </div>

          <div v-if="rows.length === 0" class="flex flex-col items-center justify-center py-12 text-gray-400">
            <i class="pi pi-list text-3xl mb-2"></i>
            <p class="text-sm">Nenhuma etiqueta adicionada</p>
          </div>

          <table v-else class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-800/50">
              <tr class="text-left text-gray-500 dark:text-gray-400 text-xs">
                <th class="px-4 py-2 font-medium">Código</th>
                <th v-if="mode === 'full'" class="px-4 py-2 font-medium">Sabor</th>
                <th v-if="mode === 'full'" class="px-4 py-2 font-medium">Validade</th>
                <th class="px-4 py-2 font-medium text-center">Cópias</th>
                <th class="px-4 py-2 font-medium text-center w-16">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-for="(row, idx) in rows" :key="idx" class="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                <td class="px-4 py-2 font-mono text-xs text-gray-700 dark:text-gray-300">{{ row.barcode }}</td>
                <td v-if="mode === 'full'" class="px-4 py-2 text-gray-700 dark:text-gray-300">{{ row.productName || '—' }}</td>
                <td v-if="mode === 'full'" class="px-4 py-2 text-gray-500 text-xs">{{ row.expirationDate ? formatDate(row.expirationDate) : '—' }}</td>
                <td class="px-4 py-2 text-center">
                  <input
                    v-model.number="row.copies"
                    type="number"
                    min="1"
                    max="9999"
                    class="w-16 text-center border border-gray-200 dark:border-gray-600 rounded px-1 py-0.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </td>
                <td class="px-4 py-2 text-center">
                  <button @click="rows.splice(idx, 1)" class="text-red-400 hover:text-red-600 p-1">
                    <i class="pi pi-times text-xs"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Preview da folha A4 -->
        <div class="card p-4">
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm mb-3">Preview — 1ª página</h3>
          <div
            class="mx-auto bg-white border border-gray-300 shadow-sm overflow-hidden"
            :style="previewPageStyle"
          >
            <div class="grid h-full" :style="previewGridStyle">
              <div
                v-for="(cell, i) in previewCells"
                :key="i"
                class="border border-gray-200 flex flex-col items-center justify-center p-1 overflow-hidden"
              >
                <template v-if="cell">
                  <!-- Modo full -->
                  <template v-if="mode === 'full'">
                    <p class="text-center font-bold leading-tight overflow-hidden" :style="previewStoreStyle">{{ storeName }}</p>
                    <p class="text-center font-semibold leading-tight overflow-hidden mt-0.5" :style="previewNameStyle">{{ cell.productName }}</p>
                    <div class="w-full mt-0.5" :style="previewBarcodeWrapStyle">
                      <svg :ref="el => setBarcodeRef(el as SVGSVGElement | null, i)" class="w-full h-auto"></svg>
                    </div>
                    <p v-if="cell.expirationDate" class="text-gray-500 mt-0.5 overflow-hidden" :style="previewValStyle">Val: {{ formatDate(cell.expirationDate) }}</p>
                  </template>
                  <!-- Modo flavor -->
                  <template v-else-if="mode === 'flavor'">
                    <p class="text-center font-bold leading-tight overflow-hidden" :style="previewStoreStyle">{{ storeName }}</p>
                    <p class="font-bold overflow-hidden" :style="{ ...previewValStyle, alignSelf: 'flex-start', paddingLeft: '2px' }">Sabor:</p>
                    <div class="w-full" style="border-bottom: 0.5px solid #666; margin: 1px 0;"></div>
                    <div class="w-full mt-0.5" :style="previewBarcodeWrapStyle">
                      <svg :ref="el => setBarcodeRef(el as SVGSVGElement | null, i)" class="w-full h-auto"></svg>
                    </div>
                    <p v-if="cell.expirationDate" class="text-gray-500 overflow-hidden" :style="previewValStyle">Val: {{ formatDate(cell.expirationDate) }}</p>
                  </template>
                  <!-- Modo barcode only -->
                  <template v-else>
                    <div class="w-full" :style="previewBarcodeWrapStyle">
                      <svg :ref="el => setBarcodeRef(el as SVGSVGElement | null, i)" class="w-full h-auto"></svg>
                    </div>
                  </template>
                </template>
              </div>
            </div>
          </div>
          <p class="text-xs text-gray-400 text-center mt-2">Preview ilustrativo (escala reduzida)</p>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import JsBarcode from 'jsbarcode'
import { jsPDF } from 'jspdf'
import { useProductsStore } from '@/stores/products'
import { formatDate } from '@/utils/formatters'
import { useToast } from '@/composables/useToast'

interface LabelRow {
  barcode: string
  productName: string
  expirationDate: string
  copies: number
}

const productsStore = useProductsStore()
const toast = useToast()

const mode = ref<'barcode-only' | 'full' | 'flavor'>('full')
const cols = ref(3)
const rowsPerPage = ref(8)
const storeName = ref('Narceja Pâtisserie')
const logoUrl = ref('')
const generating = ref(false)

const rows = ref<LabelRow[]>([])
const selectedProductId = ref('')

const FIXED_BARCODE = '7891234567890'
const newItem = ref<LabelRow>({ barcode: FIXED_BARCODE, productName: '', expirationDate: '', copies: 1 })

const products = computed(() => productsStore.products)

const totalLabels = computed(() => rows.value.reduce((s, r) => s + r.copies, 0))
const labelsPerPage = computed(() => cols.value * rowsPerPage.value)
const totalPages = computed(() => Math.ceil(totalLabels.value / labelsPerPage.value))

// ─── Expandir rows em células individuais (cada cópia = 1 célula)
const expandedCells = computed((): LabelRow[] => {
  const out: LabelRow[] = []
  for (const row of rows.value) {
    for (let i = 0; i < row.copies; i++) out.push(row)
  }
  return out
})

// ─── Células da 1ª página para o preview (máx labelsPerPage)
const previewCells = computed((): (LabelRow | null)[] => {
  const page1 = expandedCells.value.slice(0, labelsPerPage.value)
  // Preenche células vazias para completar a grade
  const total = labelsPerPage.value
  const result: (LabelRow | null)[] = [...page1]
  while (result.length < total) result.push(null)
  return result
})

// ─── Estilos do preview
const PREVIEW_SCALE = 0.28 // A4 210×297mm → preview ~59×83mm em px (×2.83 px/mm)
const A4_W_PX = 210 * 2.83 * PREVIEW_SCALE
const A4_H_PX = 297 * 2.83 * PREVIEW_SCALE

const previewPageStyle = computed(() => ({
  width: `${A4_W_PX}px`,
  height: `${A4_H_PX}px`,
}))
const previewGridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${cols.value}, 1fr)`,
  gridTemplateRows: `repeat(${rowsPerPage.value}, 1fr)`,
}))

const cellH = computed(() => A4_H_PX / rowsPerPage.value)

const previewStoreStyle = computed(() => ({ fontSize: `${Math.max(5, cellH.value * 0.13)}px` }))
const previewNameStyle = computed(() => ({ fontSize: `${Math.max(6, cellH.value * 0.16)}px` }))
const previewValStyle = computed(() => ({ fontSize: `${Math.max(4.5, cellH.value * 0.11)}px` }))
const previewBarcodeWrapStyle = computed(() => ({ height: `${Math.max(12, cellH.value * 0.42)}px` }))

// ─── Refs dos SVG de barcode no preview
const barcodeRefs: (SVGSVGElement | null)[] = []
function setBarcodeRef(el: SVGSVGElement | null, i: number) {
  barcodeRefs[i] = el
}

function renderPreviewBarcodes() {
  nextTick(() => {
    previewCells.value.forEach((cell, i) => {
      const el = barcodeRefs[i]
      if (!el || !cell?.barcode) return
      try {
        JsBarcode(el, cell.barcode, {
          format: 'CODE128',
          width: 1,
          height: 20,
          displayValue: mode.value === 'barcode-only',
          fontSize: 7,
          margin: 1,
        })
      } catch { /* barcode inválido */ }
    })
  })
}

watch([previewCells, mode, cols, rowsPerPage], renderPreviewBarcodes, { flush: 'post' })

// ─── Preencher a partir do produto selecionado
function fillFromProduct() {
  const p = products.value.find(x => x.id === selectedProductId.value)
  if (!p) return
  newItem.value.barcode = FIXED_BARCODE
  newItem.value.productName = p.name
}

// ─── Adicionar linha à lista
function addRow() {
  if (!newItem.value.barcode) return
  rows.value.push({ ...newItem.value })
  newItem.value = { barcode: FIXED_BARCODE, productName: '', expirationDate: '', copies: 1 }
  selectedProductId.value = ''
}

// ─── Gerar PDF A4
async function generatePDF() {
  if (rows.value.length === 0) return
  if (totalLabels.value === 0) return

  const barcodeError = rows.value.find(r => {
    try { JsBarcode(document.createElement('canvas'), r.barcode, { format: 'CODE128' }); return false }
    catch { return true }
  })
  if (barcodeError) {
    toast.error(`Código de barras inválido: "${barcodeError.barcode}"`)
    return
  }

  generating.value = true
  try {
    await nextTick()

    // Dimensões em mm
    const PAGE_W = 210
    const PAGE_H = 297
    const MARGIN_X = 8
    const MARGIN_Y = 8
    const GAP = 2

    const cellW = (PAGE_W - MARGIN_X * 2 - GAP * (cols.value - 1)) / cols.value
    const cellH_mm = (PAGE_H - MARGIN_Y * 2 - GAP * (rowsPerPage.value - 1)) / rowsPerPage.value

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const cells = expandedCells.value
    let page = 0

    for (let idx = 0; idx < cells.length; idx++) {
      const posInPage = idx % labelsPerPage.value
      const newPage = Math.floor(idx / labelsPerPage.value)

      if (newPage > page) {
        doc.addPage()
        page = newPage
      }

      const col = posInPage % cols.value
      const row = Math.floor(posInPage / cols.value)

      const x = MARGIN_X + col * (cellW + GAP)
      const y = MARGIN_Y + row * (cellH_mm + GAP)

      const cell = cells[idx]

      // Borda da célula
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.2)
      doc.rect(x, y, cellW, cellH_mm)

      if (mode.value === 'barcode-only') {
        // Apenas código de barras
        try {
          const canvas = document.createElement('canvas')
          JsBarcode(canvas, cell.barcode, {
            format: 'CODE128', width: 2, height: 60,
            displayValue: true, fontSize: 10, margin: 4, background: '#ffffff',
          })
          const img = canvas.toDataURL('image/png')
          const bcH = cellH_mm * 0.85
          doc.addImage(img, 'PNG', x + 1, y + (cellH_mm - bcH) / 2, cellW - 2, bcH)
        } catch { /* ignora */ }

      } else if (mode.value === 'flavor') {
        // Etiqueta com linha de sabor para escrita manual
        let curY = y + 2.5

        // Nome da loja
        doc.setFontSize(5.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(120, 60, 10)
        doc.text(storeName.value, x + cellW / 2, curY, { align: 'center', maxWidth: cellW - 2 })
        curY += 3.5

        // "Sabor:" + linha
        doc.setFontSize(6)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(20, 20, 20)
        doc.text('Sabor:', x + 2, curY)
        curY += 4
        doc.setDrawColor(80, 80, 80)
        doc.setLineWidth(0.3)
        doc.line(x + 2, curY, x + cellW - 2, curY)
        curY += 2

        // Código de barras
        if (cell.barcode) {
          try {
            const canvas = document.createElement('canvas')
            JsBarcode(canvas, cell.barcode, {
              format: 'CODE128', width: 2, height: 50,
              displayValue: true, fontSize: 9, margin: 2, background: '#ffffff',
            })
            const img = canvas.toDataURL('image/png')
            const bcH = Math.min(cellH_mm * 0.42, y + cellH_mm - curY - 4)
            doc.addImage(img, 'PNG', x + 2, curY, cellW - 4, bcH)
            curY += bcH + 1
          } catch { /* ignora */ }
        }

        // Validade
        if (cell.expirationDate) {
          doc.setFontSize(5)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(80, 80, 80)
          doc.text(`Val: ${formatDate(cell.expirationDate)}`, x + cellW / 2, y + cellH_mm - 1.5, { align: 'center' })
        }

      } else {
        // Etiqueta completa
        let curY = y + 2.5

        // Nome da loja
        doc.setFontSize(5.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(120, 60, 10)
        doc.text(storeName.value, x + cellW / 2, curY, { align: 'center', maxWidth: cellW - 2 })
        curY += 3

        // Nome do produto
        if (cell.productName) {
          doc.setFontSize(6.5)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(20, 20, 20)
          const nameLines = doc.splitTextToSize(cell.productName, cellW - 2)
          doc.text(nameLines, x + cellW / 2, curY, { align: 'center' })
          curY += nameLines.length * 3.2
        }

        // Código de barras
        if (cell.barcode) {
          try {
            const canvas = document.createElement('canvas')
            JsBarcode(canvas, cell.barcode, {
              format: 'CODE128', width: 2, height: 50,
              displayValue: true, fontSize: 9, margin: 2, background: '#ffffff',
            })
            const img = canvas.toDataURL('image/png')
            const bcH = Math.min(cellH_mm * 0.45, cellH_mm - curY + y - 4)
            doc.addImage(img, 'PNG', x + 2, curY, cellW - 4, bcH)
            curY += bcH + 1
          } catch { /* ignora */ }
        }

        // Validade
        if (cell.expirationDate) {
          doc.setFontSize(5)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(80, 80, 80)
          doc.text(`Val: ${formatDate(cell.expirationDate)}`, x + cellW / 2, y + cellH_mm - 1.5, { align: 'center' })
        }
      }
    }

    doc.save(`etiquetas-a4-${new Date().toISOString().split('T')[0]}.pdf`)
    toast.success(`PDF gerado com ${totalLabels.value} etiquetas em ${totalPages.value} página(s)!`)
  } catch (err) {
    toast.error('Erro ao gerar PDF.')
    console.error(err)
  } finally {
    generating.value = false
  }
}

onMounted(() => productsStore.fetchProducts())
</script>
