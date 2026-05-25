<template>
  <div class="space-y-6 max-w-2xl">
    <h1 class="text-xl font-bold text-gray-900 dark:text-white">Configurações</h1>

    <!-- Perfil -->
    <div class="card p-5 space-y-4">
      <h3 class="font-semibold text-gray-900 dark:text-white">Meu Perfil</h3>
      <div>
        <div class="flex items-center gap-4 mb-4">
          <div class="w-16 h-16 rounded-full bg-narceja-500 flex items-center justify-center text-white text-2xl font-bold">
            {{ authStore.userName?.charAt(0)?.toUpperCase() || 'U' }}
          </div>
          <div>
            <p class="font-semibold text-gray-900 dark:text-white">{{ authStore.userName }}</p>
            <p class="text-sm text-gray-500">{{ authStore.isAdmin ? 'Administrador' : 'Funcionário' }}</p>
          </div>
        </div>
        <div>
          <label class="label">Nome completo</label>
          <input v-model="profileForm.full_name" type="text" class="input" />
        </div>
        <div class="mt-3">
          <label class="label">Telefone</label>
          <input v-model="profileForm.phone" type="tel" class="input" placeholder="(11) 99999-9999" />
        </div>
        <button @click="saveProfile" :disabled="savingProfile" class="btn-primary mt-3 flex items-center gap-2">
          <i v-if="savingProfile" class="pi pi-spin pi-spinner"></i>
          <span>{{ savingProfile ? 'Salvando...' : 'Salvar Perfil' }}</span>
        </button>
      </div>
    </div>

    <!-- Alterar senha -->
    <div class="card p-5 space-y-4">
      <h3 class="font-semibold text-gray-900 dark:text-white">Alterar Senha</h3>
      <div>
        <label class="label">Nova senha</label>
        <input v-model="passwordForm.password" type="password" class="input" placeholder="••••••••" minlength="6" />
      </div>
      <div>
        <label class="label">Confirmar nova senha</label>
        <input v-model="passwordForm.confirm" type="password" class="input" placeholder="••••••••" />
      </div>
      <p v-if="passwordForm.password && passwordForm.confirm && passwordForm.password !== passwordForm.confirm" class="text-sm text-red-600">
        As senhas não conferem.
      </p>
      <button
        @click="changePassword"
        :disabled="savingPassword || !passwordForm.password || passwordForm.password !== passwordForm.confirm"
        class="btn-primary flex items-center gap-2"
      >
        <i v-if="savingPassword" class="pi pi-spin pi-spinner"></i>
        <span>{{ savingPassword ? 'Alterando...' : 'Alterar Senha' }}</span>
      </button>
    </div>

    <!-- Aparência -->
    <div class="card p-5 space-y-4">
      <h3 class="font-semibold text-gray-900 dark:text-white">Aparência</h3>
      <div class="flex items-center justify-between">
        <div>
          <p class="font-medium text-gray-900 dark:text-white">Modo Escuro</p>
          <p class="text-sm text-gray-500">Alterna entre tema claro e escuro</p>
        </div>
        <button
          @click="uiStore.toggleDarkMode()"
          :class="[
            'w-11 h-6 rounded-full transition-colors',
            uiStore.darkMode ? 'bg-narceja-500' : 'bg-gray-200'
          ]"
        >
          <span
            :class="[
              'block w-5 h-5 rounded-full bg-white shadow transition-transform mx-0.5',
              uiStore.darkMode ? 'translate-x-5' : 'translate-x-0'
            ]"
          ></span>
        </button>
      </div>
    </div>

    <!-- Sobre -->
    <div class="card p-5">
      <h3 class="font-semibold text-gray-900 dark:text-white mb-3">Sobre o Sistema</h3>
      <div class="space-y-1 text-sm text-gray-500">
        <p>🍦 Narceja Pâtisserie ERP</p>
        <p>Versão 1.0.0</p>
        <p>Sistema de gestão completo para controle de produtos, estoque, vendas e financeiro.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { updateProfile, updatePassword } from '@/services/authService'
import { useToast } from '@/composables/useToast'

const authStore = useAuthStore()
const uiStore = useUiStore()
const toast = useToast()

const profileForm = ref({
  full_name: authStore.profile?.full_name || '',
  phone: authStore.profile?.phone || '',
})

const passwordForm = ref({ password: '', confirm: '' })
const savingProfile = ref(false)
const savingPassword = ref(false)

async function saveProfile() {
  savingProfile.value = true
  try {
    if (!authStore.profile?.id) return
    await updateProfile(authStore.profile.id, {
      full_name: profileForm.value.full_name,
      phone: profileForm.value.phone,
    })
    if (authStore.profile) {
      authStore.profile.full_name = profileForm.value.full_name
      authStore.profile.phone = profileForm.value.phone
    }
    toast.success('Perfil atualizado!')
  } catch {
    toast.error('Erro ao atualizar perfil.')
  } finally {
    savingProfile.value = false
  }
}

async function changePassword() {
  if (passwordForm.value.password !== passwordForm.value.confirm) return
  savingPassword.value = true
  try {
    await updatePassword(passwordForm.value.password)
    passwordForm.value = { password: '', confirm: '' }
    toast.success('Senha alterada com sucesso!')
  } catch {
    toast.error('Erro ao alterar senha.')
  } finally {
    savingPassword.value = false
  }
}
</script>
