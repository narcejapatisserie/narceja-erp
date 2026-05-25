<template>
  <div class="min-h-screen flex items-center justify-center p-4" style="background: linear-gradient(135deg, #4a1f1f 0%, #7a5c28 40%, #b8924a 100%);">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-6">
        <div class="inline-block rounded-2xl overflow-hidden shadow-2xl mb-4" style="background: #f5ede4;">
          <img src="/logo.jpg" alt="Narceja Pâtisserie" class="w-40 h-40 object-contain" />
        </div>
        <p class="text-narceja-200 text-sm font-medium tracking-widest uppercase opacity-80">Sistema de Gestão</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
        <slot />
      </div>
    </div>
  </div>
</template>
