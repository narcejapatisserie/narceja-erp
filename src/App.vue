<template>
  <Toast position="top-right" />
  <ConfirmDialog />

  <!-- Layout de autenticação -->
  <AuthLayout v-if="isAuthRoute">
    <RouterView :key="$route.path" />
  </AuthLayout>

  <!-- Layout principal — mantido vivo para não recriar sidebar/header a cada navegação -->
  <DashboardLayout v-else>
    <RouterView :key="$route.path" />
  </DashboardLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import AuthLayout from '@/layouts/AuthLayout.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'

const route = useRoute()
const isAuthRoute = computed(() => route.meta.layout === 'auth')
</script>
