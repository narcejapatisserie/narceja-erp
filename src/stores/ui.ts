import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const sidebarOpen = ref(true)
  const darkMode = ref(false)

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function toggleDarkMode() {
    darkMode.value = !darkMode.value
    if (darkMode.value) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('darkMode', 'true')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('darkMode', 'false')
    }
  }

  function initDarkMode() {
    const saved = localStorage.getItem('darkMode')
    if (saved === 'true') {
      darkMode.value = true
      document.documentElement.classList.add('dark')
    }
  }

  return { sidebarOpen, darkMode, toggleSidebar, toggleDarkMode, initDarkMode }
})
