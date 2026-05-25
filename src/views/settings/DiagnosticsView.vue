<template>
  <div class="space-y-5 max-w-3xl">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">Diagnóstico do Sistema</h1>
        <p class="text-sm text-gray-500">Testa todas as conexões e módulos em tempo real</p>
      </div>
      <button @click="runAll" :disabled="running" class="btn-primary flex items-center gap-2">
        <i :class="['pi', running ? 'pi-spin pi-spinner' : 'pi-play']"></i>
        {{ running ? 'Testando...' : 'Rodar Todos os Testes' }}
      </button>
    </div>

    <!-- Resultado geral -->
    <div v-if="results.length > 0" :class="['rounded-xl p-4 flex items-center gap-3', allPassed ? 'bg-green-50 dark:bg-green-900/20 border border-green-200' : 'bg-red-50 dark:bg-red-900/20 border border-red-200']">
      <i :class="['pi text-2xl', allPassed ? 'pi-check-circle text-green-500' : 'pi-times-circle text-red-500']"></i>
      <div>
        <p class="font-semibold" :class="allPassed ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'">
          {{ passed }}/{{ results.length }} testes passaram
        </p>
        <p class="text-xs text-gray-500 mt-0.5">Tempo total: {{ totalMs }}ms</p>
      </div>
    </div>

    <!-- Lista de testes -->
    <div class="card overflow-hidden">
      <div class="p-4 border-b border-gray-100 dark:border-gray-700">
        <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Resultados</h3>
      </div>
      <div class="divide-y divide-gray-100 dark:divide-gray-700">
        <div v-for="r in results" :key="r.name" class="px-4 py-3 flex items-start gap-3">
          <div class="flex-shrink-0 mt-0.5">
            <i v-if="r.status === 'running'" class="pi pi-spin pi-spinner text-blue-500"></i>
            <i v-else-if="r.status === 'pass'" class="pi pi-check-circle text-green-500"></i>
            <i v-else-if="r.status === 'fail'" class="pi pi-times-circle text-red-500"></i>
            <i v-else class="pi pi-circle text-gray-300"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ r.name }}</p>
              <span v-if="r.ms !== undefined" class="text-xs text-gray-400 flex-shrink-0">{{ r.ms }}ms</span>
            </div>
            <p class="text-xs text-gray-500 mt-0.5">{{ r.detail }}</p>
            <p v-if="r.error" class="text-xs text-red-500 mt-1 font-mono bg-red-50 dark:bg-red-900/20 rounded px-2 py-1">{{ r.error }}</p>
          </div>
        </div>
        <div v-if="results.length === 0" class="px-4 py-12 text-center text-gray-400">
          <i class="pi pi-play-circle text-3xl mb-2 block"></i>
          <p class="text-sm">Clique em "Rodar Todos os Testes" para começar</p>
        </div>
      </div>
    </div>

    <!-- Info da sessão -->
    <div class="card p-4 space-y-2 text-sm">
      <h3 class="font-semibold text-gray-900 dark:text-white text-sm mb-3">Informações da Sessão</h3>
      <div class="flex justify-between"><span class="text-gray-500">URL Supabase</span><span class="font-mono text-xs text-gray-700 dark:text-gray-300">{{ supabaseUrl }}</span></div>
      <div class="flex justify-between"><span class="text-gray-500">Usuário</span><span class="text-gray-700 dark:text-gray-300">{{ userEmail }}</span></div>
      <div class="flex justify-between"><span class="text-gray-500">Role</span><span class="text-gray-700 dark:text-gray-300">{{ userRole }}</span></div>
      <div class="flex justify-between"><span class="text-gray-500">Autenticado</span>
        <span :class="isAuth ? 'text-green-600' : 'text-red-500'">{{ isAuth ? '✅ Sim' : '❌ Não' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const userEmail = computed(() => authStore.profile?.id ? '(logado)' : 'não autenticado')
const userRole = computed(() => authStore.profile?.role || '—')
const isAuth = computed(() => authStore.isAuthenticated)

interface TestResult {
  name: string
  detail: string
  status: 'pending' | 'running' | 'pass' | 'fail'
  ms?: number
  error?: string
}

const results = ref<TestResult[]>([])
const running = ref(false)

const passed = computed(() => results.value.filter(r => r.status === 'pass').length)
const allPassed = computed(() => results.value.length > 0 && passed.value === results.value.length)
const totalMs = computed(() => results.value.reduce((s, r) => s + (r.ms || 0), 0))

const TESTS: { name: string; detail: string; run: () => Promise<string> }[] = [
  {
    name: 'Conexão Supabase',
    detail: 'Verifica se a URL e chave anon estão corretas',
    run: async () => {
      const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
      if (error) throw new Error(`${error.message} (code: ${error.code})`)
      return 'Conexão OK'
    }
  },
  {
    name: 'Auth — Sessão ativa',
    detail: 'Verifica se o usuário está autenticado',
    run: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Nenhuma sessão ativa. Faça login.')
      return `Sessão válida até ${new Date(session.expires_at! * 1000).toLocaleString('pt-BR')}`
    }
  },
  {
    name: 'SELECT profiles',
    detail: 'RLS — leitura do próprio perfil',
    run: async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name, role').limit(1)
      if (error) throw new Error(error.message)
      if (!data?.length) throw new Error('Nenhum perfil retornado — verifique RLS policy "profiles_select"')
      return `${data.length} perfil(is) retornado(s)`
    }
  },
  {
    name: 'SELECT products',
    detail: 'RLS — leitura de produtos',
    run: async () => {
      const { data, error, count } = await supabase.from('products').select('id', { count: 'exact' }).limit(1)
      if (error) throw new Error(error.message)
      return `${count ?? 0} produto(s) no banco`
    }
  },
  {
    name: 'SELECT raw_materials',
    detail: 'RLS — leitura de matérias-primas',
    run: async () => {
      const { error, count } = await supabase.from('raw_materials').select('id', { count: 'exact' }).limit(1)
      if (error) throw new Error(error.message)
      return `${count ?? 0} matéria(s)-prima(s) no banco`
    }
  },
  {
    name: 'SELECT sales',
    detail: 'RLS — leitura de vendas',
    run: async () => {
      const { error, count } = await supabase.from('sales').select('id', { count: 'exact' }).limit(1)
      if (error) throw new Error(error.message)
      return `${count ?? 0} venda(s) no banco`
    }
  },
  {
    name: 'SELECT sale_items',
    detail: 'RLS — leitura de itens de venda',
    run: async () => {
      const { error, count } = await supabase.from('sale_items').select('id', { count: 'exact' }).limit(1)
      if (error) throw new Error(error.message)
      return `${count ?? 0} item(ns) de venda no banco`
    }
  },
  {
    name: 'SELECT financial_transactions',
    detail: 'RLS — leitura de transações financeiras',
    run: async () => {
      const { error, count } = await supabase.from('financial_transactions').select('id', { count: 'exact' }).limit(1)
      if (error) throw new Error(error.message)
      return `${count ?? 0} transação(ões) no banco`
    }
  },
  {
    name: 'SELECT stock_movements',
    detail: 'RLS — leitura de movimentações de estoque',
    run: async () => {
      const { error, count } = await supabase.from('stock_movements').select('id', { count: 'exact' }).limit(1)
      if (error) throw new Error(error.message)
      return `${count ?? 0} movimentação(ões) no banco`
    }
  },
  {
    name: 'SELECT suppliers',
    detail: 'RLS — leitura de fornecedores',
    run: async () => {
      const { error, count } = await supabase.from('suppliers').select('id', { count: 'exact' }).limit(1)
      if (error) throw new Error(error.message)
      return `${count ?? 0} fornecedor(es) no banco`
    }
  },
  {
    name: 'INSERT + DELETE products (teste)',
    detail: 'RLS — permissão de escrita em produtos',
    run: async () => {
      const { data, error } = await supabase.from('products').insert({
        name: '__DIAGNOSTICO_TESTE__',
        sale_price: 0, stock_quantity: 0, min_stock: 0, unit: 'un', recipe: [], is_active: false
      }).select('id').single()
      if (error) throw new Error(`INSERT falhou: ${error.message}`)
      const { error: delErr } = await supabase.from('products').delete().eq('id', data.id)
      if (delErr) throw new Error(`DELETE falhou: ${delErr.message}`)
      return 'INSERT e DELETE OK'
    }
  },
  {
    name: 'JOIN sale_items → sales',
    detail: 'Teste de join usado no Dashboard (top produtos)',
    run: async () => {
      const { error } = await supabase
        .from('sale_items')
        .select('id, sale:sales!inner(status)')
        .limit(1)
      if (error) throw new Error(error.message)
      return 'JOIN OK'
    }
  },
]

async function runAll() {
  running.value = true
  results.value = TESTS.map(t => ({ name: t.name, detail: t.detail, status: 'pending' as const }))

  for (let i = 0; i < TESTS.length; i++) {
    results.value[i].status = 'running'
    const start = Date.now()
    try {
      const msg = await TESTS[i].run()
      results.value[i].status = 'pass'
      results.value[i].detail = msg
      results.value[i].ms = Date.now() - start
    } catch (err: unknown) {
      results.value[i].status = 'fail'
      results.value[i].error = String(err instanceof Error ? err.message : err)
      results.value[i].ms = Date.now() - start
    }
  }

  running.value = false
}
</script>
