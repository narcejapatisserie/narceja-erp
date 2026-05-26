<template>
  <div class="flex h-screen bg-narceja-50 dark:bg-gray-950 overflow-hidden">

    <!-- Overlay mobile (clica fora fecha) -->
    <Transition name="overlay">
      <div
        v-if="sidebarOpen && isMobile"
        class="fixed inset-0 bg-black/40 z-40 lg:hidden"
        @click="closeSidebar"
      />
    </Transition>

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed lg:relative inset-y-0 left-0 flex flex-col border-r border-narceja-200 dark:border-gray-700 transition-all duration-300 z-50 flex-shrink-0',
        sidebarOpen ? 'w-64' : 'w-0 lg:w-16 overflow-hidden',
        uiStore.darkMode ? 'bg-gray-900' : 'bg-[#fdf9f6]'
      ]"
    >
      <!-- Logo -->
      <div
        class="flex items-center justify-center h-16 px-2 border-b border-narceja-200 dark:border-gray-700 flex-shrink-0 overflow-hidden"
        :class="uiStore.darkMode ? 'bg-gray-900' : 'bg-[#f5ede4]'"
      >
        <img src="/logo.jpg" alt="Narceja Pâtisserie" class="h-14 w-auto object-contain rounded-lg" style="background: #f5ede4;" />
      </div>

      <!-- Nav -->
      <nav class="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        <NavItem
          v-for="item in navItems"
          :key="item.to"
          :item="item"
          :collapsed="false"
          @click="onNavClick"
        />
      </nav>

      <!-- User -->
      <div class="border-t border-gray-200 dark:border-gray-700 p-3 flex-shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-narceja-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {{ authStore.userName?.charAt(0)?.toUpperCase() || 'U' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ authStore.userName }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ authStore.isAdmin ? 'Administrador' : 'Funcionário' }}</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

      <!-- Header -->
      <header class="h-16 border-b border-narceja-200 dark:border-gray-700 flex items-center px-3 sm:px-4 gap-3 flex-shrink-0 bg-white dark:bg-gray-900">
        <button
          @click="toggleSidebar"
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors flex-shrink-0"
        >
          <i class="pi pi-bars text-lg"></i>
        </button>

        <div class="flex-1 min-w-0">
          <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{{ currentPageTitle }}</h2>
        </div>

        <div class="flex items-center gap-1 sm:gap-2">
          <button
            @click="uiStore.toggleDarkMode"
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <i :class="['pi', uiStore.darkMode ? 'pi-sun' : 'pi-moon']"></i>
          </button>
          <RouterLink
            to="/pdv"
            class="flex items-center gap-1.5 bg-narceja-500 hover:bg-narceja-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <i class="pi pi-shopping-cart text-sm"></i>
            <span class="hidden sm:inline">PDV</span>
          </RouterLink>
          <button
            @click="handleLogout"
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <i class="pi pi-sign-out"></i>
          </button>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 pb-20 lg:pb-6">
        <slot />
      </main>
    </div>

    <!-- Bottom nav mobile -->
    <nav class="lg:hidden fixed bottom-0 inset-x-0 border-t border-narceja-200 dark:border-gray-700 z-30 flex items-center justify-around px-1 safe-bottom bg-white dark:bg-gray-900">
      <RouterLink
        v-for="item in bottomNavItems"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center gap-0.5 py-2 px-3 text-gray-400 dark:text-gray-500 transition-colors min-w-0"
        :class="isBottomActive(item.to) ? 'text-narceja-600 dark:text-narceja-400' : 'hover:text-gray-600'"
      >
        <i :class="[item.icon, 'text-xl']"></i>
        <span class="text-[10px] font-medium truncate">{{ item.label }}</span>
      </RouterLink>
      <!-- Botão "Mais" abre sidebar -->
      <button
        @click="toggleSidebar"
        class="flex flex-col items-center gap-0.5 py-2 px-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 transition-colors"
      >
        <i class="pi pi-th-large text-xl"></i>
        <span class="text-[10px] font-medium">Mais</span>
      </button>
    </nav>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import NavItem from '@/components/common/NavItem.vue'

const authStore = useAuthStore()
const uiStore = useUiStore()
const route = useRoute()
const router = useRouter()

const sidebarOpen = ref(false)
const isMobile = ref(window.innerWidth < 1024)

function onResize() {
  isMobile.value = window.innerWidth < 1024
  if (!isMobile.value) {
    // desktop: sidebar começa aberta
    sidebarOpen.value = true
  }
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebar() {
  if (isMobile.value) sidebarOpen.value = false
}

function onNavClick() {
  if (isMobile.value) sidebarOpen.value = false
}

onMounted(() => {
  sidebarOpen.value = !isMobile.value
  window.addEventListener('resize', onResize)
  uiStore.initDarkMode()
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'pi pi-home' },
  { to: '/pdv', label: 'PDV', icon: 'pi pi-shopping-cart' },
  { to: '/vendas', label: 'Vendas', icon: 'pi pi-receipt' },
  { to: '/produtos', label: 'Produtos', icon: 'pi pi-box' },
  { to: '/materias-primas', label: 'Matérias-Primas', icon: 'pi pi-warehouse' },
  { to: '/receitas', label: 'Receitas', icon: 'pi pi-book' },
  { to: '/estoque', label: 'Estoque', icon: 'pi pi-chart-bar' },
  { to: '/financeiro', label: 'Financeiro', icon: 'pi pi-wallet' },
  { to: '/fornecedores', label: 'Fornecedores', icon: 'pi pi-truck' },
  { to: '/etiquetas', label: 'Etiquetas Térmicas', icon: 'pi pi-tag' },
  { to: '/etiquetas-a4', label: 'Etiquetas A4', icon: 'pi pi-print' },
  { to: '/relatorios', label: 'Relatórios', icon: 'pi pi-file-pdf' },
  { to: '/configuracoes', label: 'Configurações', icon: 'pi pi-cog' },
  { to: '/diagnostico', label: 'Diagnóstico', icon: 'pi pi-wrench' },
]

// Bottom nav: 4 itens mais usados
const bottomNavItems = [
  { to: '/', label: 'Dashboard', icon: 'pi pi-home' },
  { to: '/pdv', label: 'PDV', icon: 'pi pi-shopping-cart' },
  { to: '/vendas', label: 'Vendas', icon: 'pi pi-receipt' },
  { to: '/produtos', label: 'Produtos', icon: 'pi pi-box' },
]

function isBottomActive(to: string) {
  return route.path === to || (to !== '/' && route.path.startsWith(to))
}

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/pdv': 'Ponto de Venda',
  '/vendas': 'Vendas',
  '/produtos': 'Produtos',
  '/materias-primas': 'Matérias-Primas',
  '/receitas': 'Receitas',
  '/estoque': 'Controle de Estoque',
  '/financeiro': 'Financeiro',
  '/fornecedores': 'Fornecedores',
  '/etiquetas': 'Etiquetas Térmicas',
  '/etiquetas-a4': 'Etiquetas A4',
  '/relatorios': 'Relatórios',
  '/configuracoes': 'Configurações',
  '/diagnostico': 'Diagnóstico do Sistema',
}

const currentPageTitle = computed(() => {
  for (const [path, title] of Object.entries(pageTitles)) {
    if (route.path === path) return title
    if (path !== '/' && route.path.startsWith(path)) return title
  }
  return 'Narceja ERP'
})

function handleLogout() {
  authStore.logout()  // zera profile.value sincronamente, signOut vai em background
  router.replace('/login')
}
</script>

<style scoped>
.overlay-enter-active, .overlay-leave-active { transition: opacity 0.2s; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }

.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
</style>
