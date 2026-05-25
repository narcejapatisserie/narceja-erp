<template>
  <form @submit.prevent="handleLogin" class="space-y-5">
    <div>
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">Entrar</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Acesse sua conta para continuar</p>
    </div>

    <div>
      <label class="label">E-mail</label>
      <input
        v-model="form.email"
        type="email"
        class="input"
        placeholder="seu@email.com"
        required
        autocomplete="email"
      />
    </div>

    <div>
      <label class="label">Senha</label>
      <div class="relative">
        <input
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          class="input pr-10"
          placeholder="••••••••"
          required
          autocomplete="current-password"
        />
        <button
          type="button"
          @click="showPassword = !showPassword"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <i :class="['pi', showPassword ? 'pi-eye-slash' : 'pi-eye']"></i>
        </button>
      </div>
    </div>

    <div class="flex justify-end">
      <RouterLink to="/forgot-password" class="text-sm text-narceja-600 hover:text-narceja-700">
        Esqueceu a senha?
      </RouterLink>
    </div>

    <button
      type="submit"
      :disabled="loading"
      class="w-full btn-primary py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
    >
      <i v-if="loading" class="pi pi-spin pi-spinner"></i>
      <span>{{ loading ? 'Entrando...' : 'Entrar' }}</span>
    </button>

    <p v-if="errorMsg" class="text-sm text-red-600 text-center bg-red-50 rounded-lg p-3">{{ errorMsg }}</p>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({ email: '', password: '' })
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  loading.value = true
  errorMsg.value = ''
  try {
    await authStore.login(form.value.email, form.value.password)
    router.push('/')
  } catch (err: unknown) {
    const e = err as { message?: string }
    if (e?.message?.includes('Invalid login')) {
      errorMsg.value = 'E-mail ou senha incorretos.'
    } else {
      errorMsg.value = e?.message || 'Erro ao fazer login.'
    }
  } finally {
    loading.value = false
  }
}
</script>
