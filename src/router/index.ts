import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { public: true, layout: 'auth' }
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/auth/ForgotPasswordView.vue'),
      meta: { public: true, layout: 'auth' }
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('@/views/auth/ResetPasswordView.vue'),
      meta: { public: true, layout: 'auth' }
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/dashboard/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/produtos',
      name: 'products',
      component: () => import('@/views/products/ProductsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/produtos/:id',
      name: 'product-detail',
      component: () => import('@/views/products/ProductDetailView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/materias-primas',
      name: 'raw-materials',
      component: () => import('@/views/rawmaterials/RawMaterialsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/estoque',
      name: 'stock',
      component: () => import('@/views/stock/StockView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/pdv',
      name: 'pdv',
      component: () => import('@/views/sales/PDVView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/vendas',
      name: 'sales',
      component: () => import('@/views/sales/SalesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/vendas/:id',
      name: 'sale-detail',
      component: () => import('@/views/sales/SaleDetailView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/financeiro',
      name: 'financial',
      component: () => import('@/views/financial/FinancialView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/fornecedores',
      name: 'suppliers',
      component: () => import('@/views/suppliers/SuppliersView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/etiquetas',
      name: 'labels',
      component: () => import('@/views/labels/LabelsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/etiquetas-a4',
      name: 'labels-a4',
      component: () => import('@/views/labels/LabelsA4View.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/relatorios',
      name: 'reports',
      component: () => import('@/views/reports/ReportsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/configuracoes',
      name: 'settings',
      component: () => import('@/views/settings/SettingsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/diagnostico',
      name: 'diagnostics',
      component: () => import('@/views/settings/DiagnosticsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  if (!to.meta.public && !authStore.isAuthenticated) {
    return '/login'
  }
  if (to.path === '/login' && authStore.isAuthenticated) {
    return '/'
  }
})

export default router
