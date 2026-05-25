<template>
  <div class="min-h-screen bg-gradient-to-br from-narceja-950 via-narceja-800 to-narceja-600 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
          <span class="text-3xl">🍦</span>
        </div>
        <h1 class="text-2xl font-bold text-white">Narceja Pâtisserie</h1>
        <p class="text-narceja-200 text-sm mt-1">Sistema de Gestão</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
        <slot />
      </div>
    </div>
  </div>
</template>
