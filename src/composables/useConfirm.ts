import { useConfirm as usePrimeConfirm } from 'primevue/useconfirm'

export function useConfirm() {
  const confirm = usePrimeConfirm()

  function confirmDelete(message = 'Deseja realmente excluir este item?'): Promise<boolean> {
    return new Promise((resolve) => {
      confirm.require({
        message,
        header: 'Confirmar exclusão',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Excluir',
        rejectLabel: 'Cancelar',
        accept: () => resolve(true),
        reject: () => resolve(false),
      })
    })
  }

  function confirmAction(message: string, header = 'Confirmar'): Promise<boolean> {
    return new Promise((resolve) => {
      confirm.require({
        message,
        header,
        icon: 'pi pi-question-circle',
        acceptLabel: 'Confirmar',
        rejectLabel: 'Cancelar',
        accept: () => resolve(true),
        reject: () => resolve(false),
      })
    })
  }

  return { confirmDelete, confirmAction }
}
