import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'
import { signIn, signOut, getProfile } from '@/services/authService'
import type { Profile } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const profile = ref<Profile | null>(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!profile.value)
  const isAdmin = computed(() => profile.value?.role === 'admin')
  const userName = computed(() => profile.value?.full_name || '')

  async function initialize() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      profile.value = await getProfile(session.user.id)
    }
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        profile.value = await getProfile(session.user.id)
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
    await signOut()
    profile.value = null
  }

  return { profile, loading, isAuthenticated, isAdmin, userName, initialize, login, logout }
})
