import { useToast as usePrimeToast } from 'primevue/usetoast'

export function useToast() {
  const toast = usePrimeToast()

  function success(message: string, title = 'Sucesso') {
    toast.add({ severity: 'success', summary: title, detail: message, life: 3000 })
  }

  function error(message: string, title = 'Erro') {
    toast.add({ severity: 'error', summary: title, detail: message, life: 5000 })
  }

  function warn(message: string, title = 'Atenção') {
    toast.add({ severity: 'warn', summary: title, detail: message, life: 4000 })
  }

  function info(message: string, title = 'Info') {
    toast.add({ severity: 'info', summary: title, detail: message, life: 3000 })
  }

  return { success, error, warn, info }
}
