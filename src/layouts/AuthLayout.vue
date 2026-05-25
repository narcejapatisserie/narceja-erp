<template>
  <!-- Força tema light na tela de login removendo a classe 'dark' do html temporariamente via wrapper sem dark: -->
  <div class="min-h-screen flex items-center justify-center p-4" style="background: linear-gradient(135deg, #4a1f1f 0%, #7a5c28 40%, #b8924a 100%);">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-6">
        <div class="inline-block rounded-2xl overflow-hidden shadow-2xl mb-4" style="background: #f5ede4;">
          <img src="/logo.jpg" alt="Narceja Pâtisserie" class="w-40 h-40 object-contain" />
        </div>
        <p class="text-sm font-medium tracking-widest uppercase opacity-80" style="color: #e8d5c4;">Sistema de Gestão</p>
      </div>
      <!-- Card sempre light — sem dark: classes -->
      <div class="rounded-2xl shadow-2xl p-8" style="background: #ffffff; color: #111827;">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

// Remove a classe 'dark' do <html> enquanto estiver na tela de login
onMounted(() => {
  document.documentElement.classList.remove('dark')
})
onUnmounted(() => {
  // Restaura o modo dark conforme preferência salva
  const saved = localStorage.getItem('darkMode')
  if (saved === 'true') document.documentElement.classList.add('dark')
})
</script>
