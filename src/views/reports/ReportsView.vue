<template>
  <div class="space-y-5">
    <h1 class="text-xl font-bold text-gray-900 dark:text-white">Relatórios</h1>

    <!-- Filtros -->
    <div class="card p-5 space-y-4">
      <h3 class="font-semibold text-gray-900 dark:text-white">Período</h3>
      <div class="flex flex-wrap gap-3 items-end">
        <div>
          <label class="label">Data inicial</label>
          <input v-model="filterStart" type="date" class="input" />
        </div>
        <div>
          <label class="label">Data final</label>
          <input v-model="filterEnd" type="date" class="input" />
        </div>
        <div class="flex gap-2">
          <button v-for="preset in presets" :key="preset.label" @click="applyPreset(preset)" class="btn-secondary text-sm px-3">
            {{ preset.label }}
          </button>
        </div>
        <button @click="loadReport" :disabled="loading" class="btn-primary px-6 flex items-center gap-2">
          <i v-if="loading" class="pi pi-spin pi-spinner"></i>
          <span>Gerar</span>
        </button>
      </div>
    </div>

    <!-- KPIs -->
    <div v-if="reportData" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card p-4 text-center">
        <p class="text-xs text-gray-500 mb-1">Faturamento</p>
        <p class="text-xl font-bold text-narceja-700 dark:text-narceja-400">{{ formatCurrency(reportData.revenue) }}</p>
      </div>
      <div class="card p-4 text-center">
        <p class="text-xs text-gray-500 mb-1">Lucro Bruto</p>
        <p class="text-xl font-bold text-green-600">{{ formatCurrency(reportData.profit) }}</p>
      </div>
      <div class="card p-4 text-center">
        <p class="text-xs text-gray-500 mb-1">Margem</p>
        <p class="text-xl font-bold" :class="reportData.margin >= 30 ? 'text-green-600' : 'text-yellow-600'">
          {{ formatPercent(reportData.margin) }}
        </p>
      </div>
      <div class="card p-4 text-center">
        <p class="text-xs text-gray-500 mb-1">Vendas</p>
        <p class="text-xl font-bold text-gray-900 dark:text-white">{{ reportData.salesCount }}</p>
      </div>
    </div>

    <!-- Gráfico + Top Produtos -->
    <div v-if="reportData" class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <!-- Gráfico de vendas -->
      <div class="card p-5">
        <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Vendas por dia</h3>
        <Bar :data="barChartData" :options="barChartOptions" class="max-h-56" />
      </div>

      <!-- Top produtos -->
      <div class="card p-5">
        <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Produtos mais vendidos</h3>
        <div class="space-y-2">
          <div v-for="(p, idx) in reportData.topProducts" :key="p.id" class="flex items-center gap-3">
            <span class="w-5 text-xs font-bold text-gray-400">{{ idx + 1 }}.</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ p.name }}</p>
              <div class="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-1">
                <div class="h-1.5 bg-narceja-500 rounded-full" :style="`width: ${p.total_revenue / maxRevenue * 100}%`"></div>
              </div>
            </div>
            <span class="text-sm font-semibold text-narceja-700 dark:text-narceja-400 flex-shrink-0">{{ formatCurrency(p.total_revenue) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Exportar -->
    <div v-if="reportData" class="flex justify-end gap-3">
      <button @click="exportCSV" class="btn-secondary flex items-center gap-2">
        <i class="pi pi-file-excel"></i> Exportar CSV
      </button>
      <button @click="exportPDF" class="btn-primary flex items-center gap-2">
        <i class="pi pi-file-pdf"></i> Exportar PDF
      </button>
    </div>

    <!-- Placeholder inicial -->
    <div v-if="!reportData && !loading" class="card p-16 flex flex-col items-center text-gray-400">
      <i class="pi pi-file-pdf text-5xl mb-4"></i>
      <p>Selecione um período e clique em "Gerar" para ver o relatório</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { getSalesByPeriod } from '@/services/saleService'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatPercent, formatDate } from '@/utils/formatters'
import type { TopProduct, SaleItem } from '@/types'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const today = new Date().toISOString().split('T')[0]
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
const filterStart = ref(monthStart)
const filterEnd = ref(today)
const loading = ref(false)

interface ReportData {
  revenue: number
  profit: number
  margin: number
  salesCount: number
  topProducts: TopProduct[]
  dailySales: { date: string; total: number }[]
}

const reportData = ref<ReportData | null>(null)

const presets = [
  { label: 'Hoje', start: today, end: today },
  { label: '7 dias', start: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0], end: today },
  { label: 'Mês', start: monthStart, end: today },
]

function applyPreset(preset: { label: string; start: string; end: string }) {
  filterStart.value = preset.start
  filterEnd.value = preset.end
}

async function loadReport() {
  loading.value = true
  try {
    const start = new Date(`${filterStart.value}T00:00:00`)
    const end = new Date(`${filterEnd.value}T23:59:59.999`)
    const allSales = await getSalesByPeriod(start.toISOString(), end.toISOString(), 'completed')
    const sales = allSales

    const revenue = sales.reduce((s, sale) => s + sale.total, 0)
    const allItems: SaleItem[] = sales.flatMap(s => s.items || [])
    const profit = allItems.reduce((s, item) => s + item.profit, 0)
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0

    const productMap: Record<string, TopProduct> = {}
    for (const item of allItems) {
      if (!productMap[item.product_id]) {
        productMap[item.product_id] = { id: item.product_id, name: item.product_name, total_quantity: 0, total_revenue: 0, total_profit: 0 }
      }
      productMap[item.product_id].total_quantity += Number(item.quantity)
      productMap[item.product_id].total_revenue += Number(item.total_price)
      productMap[item.product_id].total_profit += Number(item.profit)
    }
    const topProducts = Object.values(productMap).sort((a, b) => b.total_revenue - a.total_revenue).slice(0, 8)

    // Daily sales
    const dailyMap: Record<string, number> = {}
    for (const sale of sales) {
      const day = sale.created_at.split('T')[0]
      dailyMap[day] = (dailyMap[day] || 0) + sale.total
    }
    const dailySales = Object.entries(dailyMap).sort().map(([date, total]) => ({ date, total }))

    reportData.value = { revenue, profit, margin, salesCount: sales.length, topProducts, dailySales }
  } finally {
    loading.value = false
  }
}

const maxRevenue = computed(() => Math.max(...(reportData.value?.topProducts.map(p => p.total_revenue) || [1])))

const barChartData = computed(() => ({
  labels: reportData.value?.dailySales.map(d => formatDate(d.date)) || [],
  datasets: [{
    label: 'Vendas (R$)',
    data: reportData.value?.dailySales.map(d => d.total) || [],
    backgroundColor: 'rgba(212,120,26,0.7)',
    borderColor: '#d4781a',
    borderRadius: 4,
  }]
}))

const barChartOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { ticks: { callback: (v: number) => `R$ ${v.toFixed(0)}` } },
    x: { grid: { display: false } }
  }
}

function exportCSV() {
  if (!reportData.value) return
  const rows = [
    ['Produto', 'Qtd', 'Receita', 'Lucro'],
    ...reportData.value.topProducts.map(p => [p.name, p.total_quantity, p.total_revenue.toFixed(2), p.total_profit.toFixed(2)])
  ]
  const csv = rows.map(r => r.join(';')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url
  a.download = `relatorio-${filterStart.value}-${filterEnd.value}.csv`
  a.click(); URL.revokeObjectURL(url)
}

function exportPDF() {
  if (!reportData.value) return
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text('Narceja Pâtisserie - Relatório de Vendas', 14, 20)
  doc.setFontSize(10)
  doc.text(`Período: ${formatDate(filterStart.value)} a ${formatDate(filterEnd.value)}`, 14, 30)
  doc.text(`Faturamento: ${formatCurrency(reportData.value.revenue)}`, 14, 38)
  doc.text(`Lucro: ${formatCurrency(reportData.value.profit)}`, 14, 46)
  doc.text(`Margem: ${formatPercent(reportData.value.margin)}`, 14, 54)

  autoTable(doc, {
    startY: 65,
    head: [['Produto', 'Qtd', 'Receita', 'Lucro']],
    body: reportData.value.topProducts.map(p => [
      p.name, p.total_quantity, formatCurrency(p.total_revenue), formatCurrency(p.total_profit)
    ]),
  })

  doc.save(`relatorio-${filterStart.value}-${filterEnd.value}.pdf`)
}
</script>
