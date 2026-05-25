import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'
import { signIn, signOut, getProfile } from '@/services/authService'
import type { Profile } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const profile = ref<Profile | null>(null)
  const loading = ref(false)
  const ready = ref(false)

  const isAuthenticated = computed(() => !!profile.value)
  const isAdmin = computed(() => profile.value?.role === 'admin')
  const userName = computed(() => profile.value?.full_name || '')

  async function initialize() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        profile.value = await getProfile(session.user.id)
      }
    } finally {
      ready.value = true
    }
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        if (!profile.value) {
          profile.value = await getProfile(session.user.id)
        }
      } else if (event === 'SIGNED_OUT') {
        profile.value = null
      }
    })
  }

  async function login(email: string, password: string) {
    loading.value = true
    try {
      const { user } = await signIn(email, password)
      if (user) {
        profile.value = await getProfile(user.id)
      }
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    profile.value = null
    try {
      await signOut()
    } catch {
      // ignora erro de rede — sessão local já foi limpa
    }
  }

  return { profile, loading, ready, isAuthenticated, isAdmin, userName, initialize, login, logout }
})
