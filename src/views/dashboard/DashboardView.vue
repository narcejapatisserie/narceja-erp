<template>
  <div class="space-y-6">
    <!-- Erro de carregamento -->
    <div v-if="loadError" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
      <i class="pi pi-exclamation-circle text-red-500 text-lg flex-shrink-0 mt-0.5"></i>
      <div class="flex-1">
        <p class="font-medium text-red-800 dark:text-red-300 text-sm">Erro ao carregar dados</p>
        <p class="text-red-600 dark:text-red-400 text-xs mt-1 font-mono">{{ loadError }}</p>
        <button @click="loadError = ''; loadDashboard()" class="mt-2 text-xs bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-800 dark:text-red-200 px-3 py-1 rounded-lg transition-colors">
          Tentar novamente
        </button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        title="Faturamento Hoje"
        :value="formatCurrency(kpis.revenue_today)"
        icon="pi-dollar"
        color="green"
        :loading="loadingKpis"
      />
      <KpiCard
        title="Faturamento Mês"
        :value="formatCurrency(kpis.revenue_month)"
        icon="pi-chart-line"
        color="blue"
        :loading="loadingKpis"
      />
      <KpiCard
        title="Despesas Mês"
        :value="formatCurrency(kpis.expenses_month)"
        icon="pi-credit-card"
        color="red"
        :loading="loadingKpis"
      />
      <KpiCard
        title="Lucro Mês"
        :value="formatCurrency(kpis.profit_month)"
        :icon="kpis.profit_month >= 0 ? 'pi-trending-up' : 'pi-trending-down'"
        :color="kpis.profit_month >= 0 ? 'narceja' : 'red'"
        :loading="loadingKpis"
      />
    </div>

    <!-- Alertas -->
    <div v-if="lowStockProducts.length > 0 || expiringMaterials.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div v-if="lowStockProducts.length > 0" class="card p-4">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-exclamation-triangle text-yellow-500"></i>
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm">
            Estoque Baixo ({{ lowStockProducts.length }})
          </h3>
        </div>
        <div class="space-y-2 max-h-40 overflow-y-auto">
          <div v-for="p in lowStockProducts" :key="p.id" class="flex items-center justify-between text-sm">
            <RouterLink :to="`/produtos/${p.id}`" class="text-gray-700 dark:text-gray-300 hover:text-narceja-600 truncate mr-2">
              {{ p.name }}
            </RouterLink>
            <span class="badge-warning badge flex-shrink-0">{{ p.stock_quantity }} {{ p.unit }}</span>
          </div>
        </div>
      </div>

      <div v-if="expiringMaterials.length > 0" class="card p-4">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-clock text-red-500"></i>
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm">
            Vencendo em 30 dias ({{ expiringMaterials.length }})
          </h3>
        </div>
        <div class="space-y-2 max-h-40 overflow-y-auto">
          <div v-for="m in expiringMaterials" :key="m.id" class="flex items-center justify-between text-sm">
            <span class="text-gray-700 dark:text-gray-300 truncate mr-2">{{ m.name }}</span>
            <span class="badge-danger badge flex-shrink-0">{{ formatDate(m.expiration_date!) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Gráfico de vendas 7 dias -->
      <div class="lg:col-span-2 card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-gray-900 dark:text-white">Vendas — últimos 7 dias</h3>
          <span class="text-xs text-gray-400">{{ formatCurrency(chart7dTotal) }} total</span>
        </div>
        <div v-if="loadingChart" class="h-48 flex items-center justify-center">
          <i class="pi pi-spin pi-spinner text-narceja-500 text-2xl"></i>
        </div>
        <Line
          v-else-if="chartData.labels.length"
          :data="chartData"
          :options="chartOptions"
          class="max-h-48"
        />
        <div v-else class="h-48 flex flex-col items-center justify-center text-gray-400 gap-2">
          <i class="pi pi-chart-line text-3xl"></i>
          <p class="text-sm">Nenhuma venda nos últimos 7 dias</p>
          <RouterLink to="/pdv" class="btn-primary text-sm px-4 py-1.5">Ir para o PDV</RouterLink>
        </div>
      </div>

      <!-- Vendas recentes -->
      <div class="card p-5 flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-gray-900 dark:text-white">Vendas Recentes</h3>
          <span class="text-xs badge-info badge">{{ kpis.sales_count_today }} hoje</span>
        </div>
        <div v-if="loadingKpis" class="flex-1 flex items-center justify-center">
          <i class="pi pi-spin pi-spinner text-narceja-500 text-xl"></i>
        </div>
        <div v-else-if="recentSales.length === 0" class="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
          <i class="pi pi-receipt text-3xl"></i>
          <p class="text-sm">Nenhuma venda ainda</p>
        </div>
        <div v-else class="space-y-2.5 flex-1 overflow-y-auto">
          <RouterLink
            v-for="sale in recentSales"
            :key="sale.id"
            :to="`/vendas/${sale.id}`"
            class="flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg p-1.5 -mx-1.5 transition-colors"
          >
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">#{{ sale.sale_number }}</p>
              <p class="text-xs text-gray-400">{{ formatDateTime(sale.created_at) }}</p>
            </div>
            <span class="text-sm font-semibold text-narceja-700 dark:text-narceja-400">
              {{ formatCurrency(sale.total) }}
            </span>
          </RouterLink>
        </div>
        <RouterLink to="/vendas" class="block text-center text-xs text-narceja-600 hover:text-narceja-700 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          Ver todas as vendas →
        </RouterLink>
      </div>
    </div>

    <!-- Top produtos -->
    <div class="card p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-gray-900 dark:text-white">Produtos Mais Vendidos — 30 dias</h3>
        <RouterLink to="/relatorios" class="text-xs text-narceja-600 hover:text-narceja-700">
          Ver relatório completo →
        </RouterLink>
      </div>
      <div v-if="loadingKpis" class="flex items-center justify-center py-8">
        <i class="pi pi-spin pi-spinner text-narceja-500 text-xl"></i>
      </div>
      <div v-else-if="topProducts.length === 0" class="text-center py-8 text-gray-400">
        <i class="pi pi-box text-3xl mb-2 block"></i>
        <p class="text-sm">Nenhuma venda registrada no período</p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
              <th class="pb-2 font-medium">#</th>
              <th class="pb-2 font-medium">Produto</th>
              <th class="pb-2 font-medium text-right">Qtd</th>
              <th class="pb-2 font-medium text-right">Receita</th>
              <th class="pb-2 font-medium text-right hidden md:table-cell">Lucro</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50 dark:divide-gray-800">
            <tr v-for="(p, idx) in topProducts" :key="p.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/30">
              <td class="py-2.5 text-gray-400 text-xs w-6">{{ idx + 1 }}</td>
              <td class="py-2.5 text-gray-900 dark:text-gray-100 font-medium">{{ p.name }}</td>
              <td class="py-2.5 text-right text-gray-600 dark:text-gray-400">{{ p.total_quantity }}</td>
              <td class="py-2.5 text-right font-semibold text-gray-900 dark:text-white">{{ formatCurrency(p.total_revenue) }}</td>
              <td class="py-2.5 text-right hidden md:table-cell" :class="p.total_profit >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ formatCurrency(p.total_profit) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Filler
} from 'chart.js'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters'
import { getDashboardKpis, getSalesByDayRange } from '@/services/financialService'
import { getProducts } from '@/services/productService'
import { getExpiringMaterials } from '@/services/rawMaterialService'
import { getSales } from '@/services/saleService'
import { supabase } from '@/services/supabase'
import type { DashboardKpis, TopProduct, Sale, Product, RawMaterial } from '@/types'
import KpiCard from '@/components/dashboard/KpiCard.vue'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const kpis = ref<DashboardKpis>({
  revenue_today: 0, revenue_month: 0, expenses_month: 0,
  profit_month: 0, sales_count_today: 0, sales_count_month: 0,
  low_stock_count: 0, expiring_count: 0,
})
const loadingKpis = ref(true)
const loadingChart = ref(true)
const loadError = ref('')
const recentSales = ref<Sale[]>([])
const lowStockProducts = ref<Product[]>([])
const expiringMaterials = ref<RawMaterial[]>([])
const topProducts = ref<TopProduct[]>([])

const chartData = ref<{ labels: string[]; datasets: { label: string; data: number[]; borderColor: string; backgroundColor: string; tension: number; fill: boolean }[] }>({
  labels: [],
  datasets: [{
    label: 'Vendas (R$)',
    data: [],
    borderColor: '#d4781a',
    backgroundColor: 'rgba(212,120,26,0.1)',
    tension: 0.4,
    fill: true,
  }]
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: {
    callbacks: { label: (ctx: { parsed: { y: number } }) => `R$ ${ctx.parsed.y.toFixed(2)}` }
  }},
  scales: {
    y: {
      ticks: { callback: (v: number | string) => `R$ ${Number(v).toFixed(0)}` },
      grid: { color: 'rgba(0,0,0,0.04)' },
      beginAtZero: true,
    },
    x: { grid: { display: false } }
  }
}

const chart7dTotal = computed(() =>
  chartData.value.datasets[0].data.reduce((s, v) => s + v, 0)
)

async function loadDashboard() {
  loadingKpis.value = true
  loadingChart.value = true
  loadError.value = ''

  // Bloco 1: KPIs + dados principais (independentes)
  const [kpiRes, salesRes, productsRes, expiringRes] = await Promise.allSettled([
    getDashboardKpis(),
    getSales(8),
    getProducts(),
    getExpiringMaterials(),
  ])

  if (kpiRes.status === 'fulfilled') kpis.value = { ...kpis.value, ...kpiRes.value }
  else console.error('[Dashboard] KPIs:', kpiRes.reason)

  if (salesRes.status === 'fulfilled')
    recentSales.value = salesRes.value.filter(s => s.status === 'completed').slice(0, 6)
  else console.error('[Dashboard] Vendas recentes:', salesRes.reason)

  if (productsRes.status === 'fulfilled')
    lowStockProducts.value = productsRes.value.filter(p => p.stock_quantity <= p.min_stock).slice(0, 10)
  else console.error('[Dashboard] Produtos:', productsRes.reason)

  if (expiringRes.status === 'fulfilled')
    expiringMaterials.value = expiringRes.value.slice(0, 10)
  else console.error('[Dashboard] Vencimentos:', expiringRes.reason)

  // KPIs já prontos — libera spinner imediatamente
  loadingKpis.value = false

  // Bloco 2: Top produtos e gráfico — em paralelo, cada um com tratamento próprio
  const thirtyAgo = new Date()
  thirtyAgo.setDate(thirtyAgo.getDate() - 30)
  const sevenAgo = new Date()
  sevenAgo.setDate(sevenAgo.getDate() - 6)
  const startStr = sevenAgo.toISOString().split('T')[0]
  const endStr = new Date().toISOString().split('T')[0]

  const [topRes, chartRes] = await Promise.allSettled([
    supabase
      .from('sale_items')
      .select('product_id, product_name, quantity, total_price, profit, sale:sales!inner(status, created_at)')
      .eq('sale.status', 'completed')
      .gte('sale.created_at', thirtyAgo.toISOString()),
    getSalesByDayRange(startStr, endStr),
  ])

  // Top produtos
  if (topRes.status === 'fulfilled' && topRes.value.data) {
    const grouped: Record<string, TopProduct> = {}
    for (const item of topRes.value.data) {
      const id = item.product_id as string
      if (!grouped[id]) {
        grouped[id] = { id, name: item.product_name as string, total_quantity: 0, total_revenue: 0, total_profit: 0 }
      }
      grouped[id].total_quantity += Number(item.quantity)
      grouped[id].total_revenue += Number(item.total_price)
      grouped[id].total_profit += Number(item.profit)
    }
    topProducts.value = Object.values(grouped)
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 6)
  } else if (topRes.status === 'rejected') {
    console.error('[Dashboard] Top produtos:', topRes.reason)
  }

  // Gráfico 7 dias
  const daySalesData = chartRes.status === 'fulfilled' ? chartRes.value : []
  if (chartRes.status === 'rejected') console.error('[Dashboard] Gráfico:', chartRes.reason)

  const dayMap: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dayMap[d.toISOString().split('T')[0]] = 0
  }
  for (const sale of daySalesData) {
    const day = (sale.created_at as string).split('T')[0]
    if (day in dayMap) dayMap[day] += Number(sale.total)
  }
  chartData.value.labels = Object.keys(dayMap).map(d => {
    const [, m, day] = d.split('-')
    return `${day}/${m}`
  })
  chartData.value.datasets[0].data = Object.values(dayMap)

  // Gráfico sempre libera, independente do resultado
  loadingChart.value = false
}

onMounted(loadDashboard)
</script>
