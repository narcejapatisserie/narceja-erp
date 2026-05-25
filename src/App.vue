<template>
  <Toast position="top-right" />
  <ConfirmDialog />
  <RouterView v-slot="{ Component, route }">
    <component :is="getLayout(route)">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </component>
  </RouterView>
</template>

<script setup lang="ts">
import { type RouteLocationNormalized } from 'vue-router'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import AuthLayout from '@/layouts/AuthLayout.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'

function getLayout(route: RouteLocationNormalized) {
  if (route.meta.layout === 'auth') return AuthLayout
  return DashboardLayout
}
</script>
