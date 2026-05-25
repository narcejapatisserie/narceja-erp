<template>
  <RouterLink
    :to="item.to"
    class="flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all duration-150"
    :class="[
      isActive
        ? 'bg-narceja-50 dark:bg-narceja-900/30 text-narceja-700 dark:text-narceja-400'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
    ]"
  >
    <i :class="[item.icon, 'text-lg flex-shrink-0', isActive ? 'text-narceja-600 dark:text-narceja-400' : '']"></i>
    <span class="truncate">{{ item.label }}</span>
    <span v-if="item.badge" class="ml-auto badge-danger text-xs">{{ item.badge }}</span>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps<{
  item: { to: string; label: string; icon: string; badge?: number }
  collapsed?: boolean
}>()

const route = useRoute()
const isActive = computed(() => route.path === props.item.to || (props.item.to !== '/' && route.path.startsWith(props.item.to)))
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.1s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
