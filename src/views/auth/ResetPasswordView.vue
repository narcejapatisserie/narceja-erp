<template>
  <div class="space-y-5">
    <div>
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">Nova senha</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Digite sua nova senha</p>
    </div>

    <form @submit.prevent="handleUpdate" class="space-y-4">
      <div>
        <label class="label">Nova senha</label>
        <input v-model="password" type="password" class="input" placeholder="••••••••" required minlength="6" />
      </div>
      <div>
        <label class="label">Confirmar senha</label>
        <input v-model="confirm" type="password" class="input" placeholder="••••••••" required minlength="6" />
      </div>
      <p v-if="mismatch" class="text-sm text-red-600">As senhas não conferem.</p>
      <button type="submit" :disabled="loading" class="w-full btn-primary py-2.5 flex items-center justify-center gap-2">
        <i v-if="loading" class="pi pi-spin pi-spinner"></i>
        <span>{{ loading ? 'Salvando...' : 'Salvar nova senha' }}</span>
      </button>
    </form>

    <RouterLink to="/login" class="block text-center text-sm text-narceja-600 hover:text-narceja-700">
      ← Voltar ao login
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { updatePassword } from '@/services/authService'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const toast = useToast()
const password = ref('')
const confirm = ref('')
const loading = ref(false)
const mismatch = computed(() => confirm.value && password.value !== confirm.value)

async function handleUpdate() {
  if (password.value !== confirm.value) return
  loading.value = true
  try {
    await updatePassword(password.value)
    toast.success('Senha atualizada com sucesso!')
    router.push('/login')
  } catch {
    toast.error('Erro ao atualizar senha.')
  } finally {
    loading.value = false
  }
}
</script>
