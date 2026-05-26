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

        <!-- Elementos da etiqueta -->
        <div class="card p-4 space-y-3">
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Elementos da Etiqueta</h3>
          <div class="space-y-2">
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" v-model="showLogo" class="w-4 h-4 accent-narceja-500" />
              <span class="text-sm text-gray-700 dark:text-gray-300">Logo</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" v-model="showStoreName" class="w-4 h-4 accent-narceja-500" />
              <span class="text-sm text-gray-700 dark:text-gray-300">Nome da loja</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" v-model="showProductName" class="w-4 h-4 accent-narceja-500" />
              <span class="text-sm text-gray-700 dark:text-gray-300">Nome do produto</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" v-model="showFlavorLine" class="w-4 h-4 accent-narceja-500" />
              <span class="text-sm text-gray-700 dark:text-gray-300">Linha "Sabor: ___" (manuscrito)</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" v-model="showBarcode" class="w-4 h-4 accent-narceja-500" />
              <span class="text-sm text-gray-700 dark:text-gray-300">Código de barras</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" v-model="showExpiration" class="w-4 h-4 accent-narceja-500" />
              <span class="text-sm text-gray-700 dark:text-gray-300">Validade</span>
            </label>
          </div>

          <!-- Nome da loja (quando ativado) -->
          <div v-if="showStoreName">
            <label class="label">Nome da loja</label>
            <input v-model="storeName" type="text" class="input text-sm" placeholder="Narceja Pâtisserie" />
          </div>
        </div>

        <!-- Layout A4 -->
        <div class="card p-4 space-y-3">
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Layout na Folha A4</h3>

          <!-- Presets -->
          <div class="grid grid-cols-3 gap-2">
            <button
              type="button"
              @click="cols = 3; rowsPerPage = 8; landscape = false"
              :class="['p-2 rounded-lg border text-xs font-medium text-center transition-all', cols === 3 && rowsPerPage === 8 && !landscape ? 'bg-narceja-500 border-narceja-500 text-white' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-narceja-300']"
            >
              <div class="font-bold">24 etiquetas</div>
              <div class="opacity-75">3 × 8 (portrait)</div>
            </button>
            <button
              type="button"
              @click="cols = 6; rowsPerPage = 10; landscape = true"
              :class="['p-2 rounded-lg border text-xs font-medium text-center transition-all', cols === 6 && rowsPerPage === 10 && landscape ? 'bg-narceja-500 border-narceja-500 text-white' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-narceja-300']"
            >
              <div class="font-bold">60 etiquetas</div>
              <div class="opacity-75">6 × 10 (paisagem)</div>
            </button>
            <button
              type="button"
              @click="cols = 8; rowsPerPage = 10; landscape = false"
              :class="['p-2 rounded-lg border text-xs font-medium text-center transition-all', cols === 8 && rowsPerPage === 10 && !landscape ? 'bg-narceja-500 border-narceja-500 text-white' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-narceja-300']"
            >
              <div class="font-bold">80 etiquetas</div>
              <div class="opacity-75">8 × 10 (mini)</div>
            </button>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">Colunas</label>
              <select v-model.number="cols" class="input">
                <option :value="1">1 coluna</option>
                <option :value="2">2 colunas</option>
                <option :value="3">3 colunas</option>
                <option :value="4">4 colunas</option>
                <option :value="5">5 colunas</option>
                <option :value="6">6 colunas</option>
                <option :value="8">8 colunas</option>
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
                <option :value="12">12 linhas</option>
              </select>
            </div>
          </div>
          <p class="text-xs text-gray-400">
            {{ cols * rowsPerPage }} etiquetas por página
          </p>
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
          <div v-if="showProductName">
            <label class="label">Nome do produto</label>
            <input v-model="newItem.productName" type="text" class="input text-sm" placeholder="Ex: Cone Trufa Belga" />
          </div>
          <div v-if="showExpiration">
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
                  <div class="w-full h-full flex flex-col items-center justify-start overflow-hidden p-0.5" style="position:relative">
                    <!-- Logo (canto direito) -->
                    <img v-if="showLogo" src="/logo.jpg" class="absolute top-0.5 right-0.5 object-contain" :style="{ width: `${Math.min(cellH * 0.28, 14)}px`, height: `${Math.min(cellH * 0.28, 14)}px` }" />
                    <!-- Nome da loja -->
                    <p v-if="showStoreName" class="font-bold leading-tight overflow-hidden w-full" :style="{ ...previewStoreStyle, paddingRight: showLogo ? `${Math.min(cellH * 0.28, 14) + 2}px` : '0' }">{{ storeName }}</p>
                    <!-- Nome do produto -->
                    <p v-if="showProductName && cell.productName" class="font-semibold leading-tight overflow-hidden text-center w-full mt-0.5" :style="previewNameStyle">{{ cell.productName }}</p>
                    <!-- Linha sabor -->
                    <template v-if="showFlavorLine">
                      <p class="font-bold overflow-hidden w-full mt-0.5" :style="{ ...previewValStyle, paddingLeft: '2px' }">Sabor:</p>
                      <div class="w-full" style="border-bottom: 0.5px solid #666; margin: 1px 0;"></div>
                    </template>
                    <!-- Barcode -->
                    <div v-if="showBarcode" class="w-full mt-0.5" :style="previewBarcodeWrapStyle">
                      <svg :ref="el => setBarcodeRef(el as SVGSVGElement | null, i)" class="w-full h-auto"></svg>
                    </div>
                    <!-- Validade -->
                    <p v-if="showExpiration && cell.expirationDate" class="text-gray-500 overflow-hidden mt-0.5" :style="previewValStyle">Val: {{ formatDate(cell.expirationDate) }}</p>
                  </div>
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

const mode = ref<'barcode-only' | 'full' | 'flavor'>('full') // mantido para compatibilidade interna
const cols = ref(3)
const rowsPerPage = ref(8)
const landscape = ref(false)
const storeName = ref('Narceja Pâtisserie')
const generating = ref(false)

// Checkboxes de elementos
const showLogo = ref(true)
const showStoreName = ref(true)
const showProductName = ref(true)
const showFlavorLine = ref(false)
const showBarcode = ref(true)
const showExpiration = ref(true)

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
const PREVIEW_SCALE = 0.28 // A4 210×297mm → preview em px (×2.83 px/mm)
const A4_W_PX = computed(() => (landscape.value ? 297 : 210) * 2.83 * PREVIEW_SCALE)
const A4_H_PX = computed(() => (landscape.value ? 210 : 297) * 2.83 * PREVIEW_SCALE)

const previewPageStyle = computed(() => ({
  width: `${A4_W_PX.value}px`,
  height: `${A4_H_PX.value}px`,
}))
const previewGridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${cols.value}, 1fr)`,
  gridTemplateRows: `repeat(${rowsPerPage.value}, 1fr)`,
}))

const cellH = computed(() => A4_H_PX.value / rowsPerPage.value)

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
          displayValue: true,
          fontSize: 7,
          margin: 1,
        })
      } catch { /* barcode inválido */ }
    })
  })
}

watch([previewCells, cols, rowsPerPage, showBarcode, landscape], renderPreviewBarcodes, { flush: 'post' })

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

// ─── Carregar logo como base64
async function loadLogo(): Promise<string | null> {
  try {
    const res = await fetch('/logo.jpg')
    const blob = await res.blob()
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch { return null }
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

    const logoBase64 = showLogo.value ? await loadLogo() : null

    // Dimensões em mm
    const PAGE_W = landscape.value ? 297 : 210
    const PAGE_H = landscape.value ? 210 : 297
    const MARGIN_X = 8
    const MARGIN_Y = 8
    const GAP = 2

    const cellW = (PAGE_W - MARGIN_X * 2 - GAP * (cols.value - 1)) / cols.value
    const cellH_mm = (PAGE_H - MARGIN_Y * 2 - GAP * (rowsPerPage.value - 1)) / rowsPerPage.value

    const doc = new jsPDF({ orientation: landscape.value ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' })

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

      {
        // ── Tudo centralizado horizontalmente, sem sobreposição ──
        const PAD = 1.5          // margem interna (mm)
        const cx = x + cellW / 2 // centro horizontal
        const logoSize = Math.min(cellH_mm * 0.30, cellW * 0.30, 8)
        let curY = y + 0.5       // logo bem no topo

        // 1. Logo — centralizada no topo
        if (showLogo.value && logoBase64) {
          doc.addImage(logoBase64, 'JPEG', cx - logoSize / 2, curY, logoSize, logoSize)
          curY += logoSize + 3   // espaço generoso após logo
        }

        // 2. Nome da loja — centralizado
        if (showStoreName.value) {
          doc.setFontSize(5.5)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(120, 60, 10)
          doc.text(storeName.value, cx, curY, { align: 'center', maxWidth: cellW - PAD * 2 })
          curY += 4
        }

        // 3. Nome do produto — centralizado, fonte ajustada para caber em 1-2 linhas
        if (showProductName.value && cell.productName) {
          // Tenta fonte maior, se não couber numa linha reduz
          let fontSize = 6.5
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(fontSize)
          let nameLines = doc.splitTextToSize(cell.productName, cellW - PAD * 2)
          if (nameLines.length > 1) {
            fontSize = 5.5
            doc.setFontSize(fontSize)
            nameLines = doc.splitTextToSize(cell.productName, cellW - PAD * 2)
          }
          doc.setTextColor(20, 20, 20)
          doc.text(nameLines, cx, curY, { align: 'center' })
          curY += nameLines.length * (fontSize * 0.55)
        }

        // 4. Linha "Sabor:" — label + linha preenchível centralizados
        if (showFlavorLine.value) {
          curY += 2              // espaço antes do sabor
          doc.setFontSize(6)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(20, 20, 20)
          doc.text('Sabor:', cx, curY, { align: 'center' })
          curY += 2.5
          doc.setDrawColor(80, 80, 80)
          doc.setLineWidth(0.3)
          doc.line(x + PAD, curY, x + cellW - PAD, curY)
          curY += 1.5            // pouco espaço após linha → barcode sobe
        }

        // 5. Código de barras — centralizado, nunca ultrapassa a validade
        if (showBarcode.value && cell.barcode) {
          try {
            const canvas = document.createElement('canvas')
            JsBarcode(canvas, cell.barcode, {
              format: 'CODE128', width: 2, height: 80,
              displayValue: true, fontSize: 10, margin: 2, background: '#ffffff',
            })
            const img = canvas.toDataURL('image/png')
            // Reserva sempre espaço para validade no fundo
            const valReserve = showExpiration.value ? 5 : PAD
            const available = (y + cellH_mm - valReserve) - curY
            // Limita altura máxima para manter proporção legível (máx 55% da célula)
            const bcH = Math.min(available, cellH_mm * 0.55)
            if (bcH > 2) {
              // Centraliza horizontalmente dentro da célula
              const bcW = cellW - PAD * 2
              const bcX = x + PAD
              doc.addImage(img, 'PNG', bcX, curY, bcW, bcH)
              curY += bcH
            }
          } catch { /* ignora */ }
        }

        // 6. Validade — sempre no fundo, nunca sobreposta
        if (showExpiration.value && cell.expirationDate) {
          doc.setFontSize(5)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(80, 80, 80)
          doc.text(`Val: ${formatDate(cell.expirationDate)}`, cx, y + cellH_mm - PAD, { align: 'center' })
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
