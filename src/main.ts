import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'

import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Tooltip from 'primevue/tooltip'

import 'primeicons/primeicons.css'
import './assets/main.css'

import App from './App.vue'
import { useAuthStore } from './stores/auth'

const app = createApp(App)

app.use(createPinia())
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      prefix: 'p',
      darkModeSelector: '.dark',
      cssLayer: false
    }
  }
})
app.use(ToastService)
app.use(ConfirmationService)
app.directive('tooltip', Tooltip)

const authStore = useAuthStore()

// Diagnóstico de conexão — aparece no console F12
import { supabase } from './services/supabase'
supabase.from('profiles').select('count', { count: 'exact', head: true }).then(({ error, status }) => {
  if (error) {
    console.error(`[Supabase] ERRO DE CONEXÃO (status ${status}):`, error.message, error.code)
    console.error('[Supabase] Verifique: 1) URL e chave no .env  2) RLS policies  3) Rede')
  } else {
    console.info('[Supabase] ✅ Conexão OK')
  }
})

authStore.initialize().then(() => {
  app.use(router)
  app.mount('#app')
})
