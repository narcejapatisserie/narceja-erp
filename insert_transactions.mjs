import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://qulrpfhpiozzwsmzrqer.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1bHJwZmhwaW96endzbXpycWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NjUwNTMsImV4cCI6MjA5NTI0MTA1M30.hAw26zCj9X2E_R6oOs_uYO3oVvdHr_YMEZRowf9mhnE'
)

const EMAIL = 'brunogomes199866@gmail.com'
const PASSWORD = process.argv[2]

if (!PASSWORD) {
  console.error('Uso: node insert_transactions.mjs <senha>')
  process.exit(1)
}

const { error: authError } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
if (authError) {
  console.error('Erro de autenticação:', authError.message)
  process.exit(1)
}
console.log('Autenticado com sucesso.')

const DATE = '2026-06-02'

const transactions = [
  // RECEITA
  { type: 'income', category: 'sale', description: 'Vendas realizadas', amount: 1800.00, due_date: DATE, payment_date: DATE, status: 'paid', notes: 'Receita de vendas do período' },

  // COMPRAS — BRUNO
  { type: 'expense', category: 'purchase', description: 'Nutella 3kg', amount: 174.00, due_date: DATE, payment_date: DATE, status: 'paid', notes: 'Comprador: Bruno' },
  { type: 'expense', category: 'purchase', description: 'Maracujá (3 unidades)', amount: 12.00, due_date: DATE, payment_date: DATE, status: 'paid', notes: 'Comprador: Bruno' },
  { type: 'expense', category: 'purchase', description: 'Moça Leite Condensado (27 unidades)', amount: 142.00, due_date: DATE, payment_date: DATE, status: 'paid', notes: 'Comprador: Bruno' },
  { type: 'expense', category: 'purchase', description: 'Etiquetadora', amount: 100.00, due_date: DATE, payment_date: DATE, status: 'paid', notes: 'Comprador: Bruno' },
  { type: 'expense', category: 'purchase', description: 'Maracujá (avulso)', amount: 13.00, due_date: DATE, payment_date: DATE, status: 'paid', notes: 'Comprador: Bruno' },
  { type: 'expense', category: 'purchase', description: 'Creme de leite', amount: 25.00, due_date: DATE, payment_date: DATE, status: 'paid', notes: 'Comprador: Bruno' },
  { type: 'expense', category: 'purchase', description: 'Oreo', amount: 30.00, due_date: DATE, payment_date: DATE, status: 'paid', notes: 'Comprador: Bruno' },
  { type: 'expense', category: 'purchase', description: 'Creme de leite Piracanjuba (caixa 27 unidades)', amount: 67.00, due_date: DATE, payment_date: DATE, status: 'paid', notes: 'Comprador: Bruno' },
  { type: 'expense', category: 'purchase', description: 'Derretedeira Elétrica', amount: 200.00, due_date: DATE, payment_date: DATE, status: 'paid', notes: 'Comprador: Bruno' },
  { type: 'expense', category: 'purchase', description: 'Itens anteriores (compras avulsas não listadas)', amount: 365.00, due_date: DATE, payment_date: DATE, status: 'paid', notes: 'Comprador: Bruno' },

  // COMPRAS — FELIPE
  { type: 'expense', category: 'purchase', description: 'Ouro Branco (2 pacotes)', amount: 109.00, due_date: DATE, payment_date: DATE, status: 'paid', notes: 'Comprador: Felipe' },
  { type: 'expense', category: 'purchase', description: 'Caixa de Trento maracujá', amount: 40.00, due_date: DATE, payment_date: DATE, status: 'paid', notes: 'Comprador: Felipe' },
  { type: 'expense', category: 'purchase', description: 'Biscoito de nutella (30 unidades)', amount: 143.47, due_date: DATE, payment_date: DATE, status: 'paid', notes: 'Comprador: Felipe' },
  { type: 'expense', category: 'purchase', description: 'Chocolate branco', amount: 65.00, due_date: DATE, payment_date: DATE, status: 'paid', notes: 'Comprador: Felipe' },
  { type: 'expense', category: 'purchase', description: 'Granulado', amount: 20.00, due_date: DATE, payment_date: DATE, status: 'paid', notes: 'Comprador: Felipe' },
  { type: 'expense', category: 'purchase', description: 'Saquinhos de embalagem (400 unidades)', amount: 88.32, due_date: DATE, payment_date: DATE, status: 'paid', notes: 'Comprador: Felipe' },
  { type: 'expense', category: 'purchase', description: 'Fecho do saquinho (1040 unidades)', amount: 16.32, due_date: DATE, payment_date: DATE, status: 'paid', notes: 'Comprador: Felipe' },
  { type: 'expense', category: 'purchase', description: 'Bobina Etiquetadora', amount: 50.00, due_date: DATE, payment_date: DATE, status: 'paid', notes: 'Comprador: Felipe' },
  { type: 'expense', category: 'purchase', description: 'Leite em pó 2kg', amount: 132.60, due_date: DATE, payment_date: DATE, status: 'paid', notes: 'Comprador: Felipe' },
  { type: 'expense', category: 'purchase', description: 'Adesivos personalizados', amount: 137.86, due_date: DATE, payment_date: DATE, status: 'paid', notes: 'Comprador: Felipe' },
  { type: 'expense', category: 'purchase', description: 'Pinça para banhar (2 unidades)', amount: 69.80, due_date: DATE, payment_date: DATE, status: 'paid', notes: 'Comprador: Felipe' },
  { type: 'expense', category: 'purchase', description: 'Grade de resfriamento', amount: 17.68, due_date: DATE, payment_date: DATE, status: 'paid', notes: 'Comprador: Felipe' },
  { type: 'expense', category: 'purchase', description: 'Papel manteiga (3 rolos)', amount: 49.90, due_date: DATE, payment_date: DATE, status: 'paid', notes: 'Comprador: Felipe' },
  { type: 'expense', category: 'purchase', description: 'Cobertura gotas blend top', amount: 62.00, due_date: DATE, payment_date: DATE, status: 'paid', notes: 'Comprador: Felipe' },
  { type: 'expense', category: 'purchase', description: 'Fecho do saquinho (avulso)', amount: 4.99, due_date: DATE, payment_date: DATE, status: 'paid', notes: 'Comprador: Felipe' },
  { type: 'expense', category: 'purchase', description: 'Fita adesiva transparente', amount: 1.69, due_date: DATE, payment_date: DATE, status: 'paid', notes: 'Comprador: Felipe' },
  { type: 'expense', category: 'purchase', description: 'Cobertura barra branco top', amount: 74.90, due_date: DATE, payment_date: DATE, status: 'paid', notes: 'Comprador: Felipe' },
  { type: 'expense', category: 'purchase', description: 'Nutella B-Ready (12 unidades)', amount: 64.40, due_date: DATE, payment_date: DATE, status: 'paid', notes: 'Comprador: Felipe' },
  { type: 'expense', category: 'purchase', description: 'Papel manteiga (avulso)', amount: 5.99, due_date: DATE, payment_date: DATE, status: 'paid', notes: 'Comprador: Felipe' },

  // CANCELADO (Shopee devolveu)
  { type: 'expense', category: 'purchase', description: 'Forma de chocolate (2 unidades) - Shopee', amount: 33.70, due_date: DATE, status: 'cancelled', notes: 'Shopee devolveu o valor — pedido cancelado' },
]

console.log(`Inserindo ${transactions.length} lançamentos...`)

const { data, error } = await supabase
  .from('financial_transactions')
  .insert(transactions)
  .select('id, description, amount, status, notes')

if (error) {
  console.error('Erro ao inserir:', error.message)
  process.exit(1)
}

const bruno = data.filter(d => d.notes?.includes('Bruno'))
const felipe = data.filter(d => d.notes?.includes('Felipe'))
const receita = data.filter(d => !d.notes?.includes('Bruno') && !d.notes?.includes('Felipe') && d.notes !== 'Shopee devolveu o valor — pedido cancelado')
const cancelado = data.filter(d => d.notes?.includes('Shopee'))

const totalBruno = bruno.reduce((s, d) => s + Number(d.amount), 0)
const totalFelipe = felipe.reduce((s, d) => s + Number(d.amount), 0)
const totalGeral = [...bruno, ...felipe].reduce((s, d) => s + Number(d.amount), 0)

console.log(`\n✅ ${data.length} lançamentos inseridos com sucesso!\n`)
console.log(`RECEITA: R$ 1.800,00`)
console.log(`\n--- BRUNO (${bruno.length} itens) ---`)
bruno.forEach(d => console.log(`  ${d.description}: R$ ${Number(d.amount).toFixed(2)}`))
console.log(`  TOTAL BRUNO: R$ ${totalBruno.toFixed(2)}`)
console.log(`\n--- FELIPE (${felipe.length} itens) ---`)
felipe.forEach(d => console.log(`  ${d.description}: R$ ${Number(d.amount).toFixed(2)}`))
console.log(`  TOTAL FELIPE: R$ ${totalFelipe.toFixed(2)}`)
console.log(`\n--- CANCELADO ---`)
cancelado.forEach(d => console.log(`  ${d.description}: R$ ${Number(d.amount).toFixed(2)} (cancelado)`))
console.log(`\n=== TOTAL GERAL DE COMPRAS: R$ ${totalGeral.toFixed(2)} ===`)
console.log(`=== SALDO (Receita - Compras): R$ ${(1800 - totalGeral).toFixed(2)} ===`)
