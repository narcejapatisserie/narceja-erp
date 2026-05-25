import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function formatDate(date: string | Date, pattern = 'dd/MM/yyyy'): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, pattern, { locale: ptBR })
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm')
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value)
}

export function formatPercent(value: number): string {
  return `${formatNumber(value, 1)}%`
}

export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0
}

export const UNIT_LABELS: Record<string, string> = {
  kg: 'Quilograma (kg)',
  g: 'Grama (g)',
  l: 'Litro (l)',
  ml: 'Mililitro (ml)',
  un: 'Unidade (un)',
  cx: 'Caixa (cx)',
  pct: 'Pacote (pct)',
}

export const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Dinheiro',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  pix: 'PIX',
  voucher: 'Vale/Voucher',
  mixed: 'Misto',
}

export const CATEGORY_LABELS: Record<string, string> = {
  sale: 'Venda',
  purchase: 'Compra',
  salary: 'Salário',
  rent: 'Aluguel',
  utilities: 'Utilidades',
  maintenance: 'Manutenção',
  marketing: 'Marketing',
  taxes: 'Impostos',
  other: 'Outros',
}

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
  open: 'Aberto',
  completed: 'Concluído',
  refunded: 'Estornado',
}
