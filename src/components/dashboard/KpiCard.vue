<template>
  <div class="card p-3 sm:p-5">
    <div class="flex items-start justify-between gap-2">
      <div class="flex-1 min-w-0">
        <p class="text-xs font-medium text-gray-500 dark:text-gray-400 leading-tight">{{ title }}</p>
        <div v-if="loading" class="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
        <p v-else class="text-base sm:text-xl font-bold mt-1 leading-tight" :class="valueColor">{{ value }}</p>
        <p v-if="subtitle" class="text-xs text-gray-400 mt-0.5">{{ subtitle }}</p>
      </div>
      <div :class="['w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0', iconBg]">
        <i :class="['pi', icon, 'text-sm sm:text-lg', iconColor]"></i>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  value: string
  icon: string
  color?: 'green' | 'blue' | 'red' | 'narceja' | 'purple'
  subtitle?: string
  loading?: boolean
}>()

const colorMap = {
  green: { bg: 'bg-green-50 dark:bg-green-900/20', icon: 'text-green-600 dark:text-green-400', value: 'text-green-700 dark:text-green-400' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', icon: 'text-blue-600 dark:text-blue-400', value: 'text-blue-700 dark:text-blue-400' },
  red: { bg: 'bg-red-50 dark:bg-red-900/20', icon: 'text-red-600 dark:text-red-400', value: 'text-red-700 dark:text-red-400' },
  narceja: { bg: 'bg-narceja-50 dark:bg-narceja-900/20', icon: 'text-narceja-600 dark:text-narceja-400', value: 'text-narceja-700 dark:text-narceja-400' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'text-purple-600 dark:text-purple-400', value: 'text-purple-700 dark:text-purple-400' },
}

const c = computed(() => colorMap[props.color || 'narceja'])
const iconBg = computed(() => c.value.bg)
const iconColor = computed(() => c.value.icon)
const valueColor = computed(() => c.value.value)
</script>
