<template>
  <div class="space-y-5">
    <div>
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">Recuperar senha</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Enviaremos um link para seu e-mail</p>
    </div>

    <div v-if="!sent">
      <form @submit.prevent="handleReset" class="space-y-4">
        <div>
          <label class="label">E-mail</label>
          <input v-model="email" type="email" class="input" placeholder="seu@email.com" required />
        </div>
        <button type="submit" :disabled="loading" class="w-full btn-primary py-2.5 flex items-center justify-center gap-2">
          <i v-if="loading" class="pi pi-spin pi-spinner"></i>
          <span>{{ loading ? 'Enviando...' : 'Enviar link' }}</span>
        </button>
      </form>
    </div>

    <div v-else class="text-center space-y-3">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <i class="pi pi-check text-green-600 text-2xl"></i>
      </div>
      <p class="text-sm text-gray-700 dark:text-gray-300">
        Link enviado para <strong>{{ email }}</strong>. Verifique sua caixa de entrada.
      </p>
    </div>

    <RouterLink to="/login" class="block text-center text-sm text-narceja-600 hover:text-narceja-700">
      ← Voltar ao login
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { resetPassword } from '@/services/authService'

const email = ref('')
const loading = ref(false)
const sent = ref(false)

async function handleReset() {
  loading.value = true
  try {
    await resetPassword(email.value)
    sent.value = true
  } finally {
    loading.value = false
  }
}
</script>
