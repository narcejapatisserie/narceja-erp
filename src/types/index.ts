export type UserRole = 'admin' | 'employee'
export type UnitMeasure = 'kg' | 'g' | 'l' | 'ml' | 'un' | 'cx' | 'pct'
export type MovementType = 'in' | 'out' | 'adjustment' | 'waste'
export type MovementReason = 'purchase' | 'sale' | 'return' | 'production' | 'waste' | 'expiration' | 'initial' | 'adjustment'
export type TransactionType = 'income' | 'expense'
export type TransactionCategory = 'sale' | 'purchase' | 'salary' | 'rent' | 'utilities' | 'maintenance' | 'marketing' | 'taxes' | 'other'
export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'voucher' | 'mixed'
export type SaleStatus = 'open' | 'completed' | 'cancelled' | 'refunded'
export type LabelSize = '40x30' | '50x30' | '60x40' | '100x50'
export type AccountStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  avatar_url?: string
  phone?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  name: string
  trade_name?: string
  document?: string
  email?: string
  phone?: string
  mobile?: string
  address?: {
    street?: string
    number?: string
    complement?: string
    district?: string
    city?: string
    state?: string
    zip?: string
  }
  contact_name?: string
  notes?: string
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface RecipeItem {
  raw_material_id: string
  raw_material_name?: string
  quantity: number
  unit: UnitMeasure
  cost: number
}

export interface Product {
  id: string
  name: string
  description?: string
  category?: string
  sku?: string
  barcode?: string
  image_url?: string
  sale_price: number
  cost_price: number
  margin_percent: number
  profit_value: number
  stock_quantity: number
  min_stock: number
  unit: UnitMeasure
  recipe: RecipeItem[]
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface RawMaterial {
  id: string
  name: string
  description?: string
  unit: UnitMeasure
  cost_per_unit: number
  stock_quantity: number
  min_stock: number
  max_stock?: number
  supplier_id?: string
  supplier?: Supplier
  current_batch?: string
  expiration_date?: string
  storage_location?: string
  barcode?: string
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface StockMovement {
  id: string
  entity_type: 'product' | 'raw_material'
  entity_id: string
  movement_type: MovementType
  reason: MovementReason
  quantity: number
  quantity_before: number
  quantity_after: number
  unit_cost?: number
  total_cost?: number
  batch?: string
  expiration_date?: string
  reference_id?: string
  reference_type?: string
  notes?: string
  created_by?: string
  created_at: string
}

export interface CartItem {
  product_id: string
  product_name: string
  product_barcode?: string
  unit_price: number
  cost_price: number
  quantity: number
  discount_value: number
  total_price: number
  profit: number
  image_url?: string
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  product_name: string
  product_barcode?: string
  quantity: number
  unit_price: number
  cost_price: number
  discount_value: number
  total_price: number
  total_cost: number
  profit: number
  created_at: string
}

export interface Sale {
  id: string
  sale_number: number
  status: SaleStatus
  customer_name?: string
  customer_phone?: string
  subtotal: number
  discount_type?: 'percent' | 'value'
  discount_value: number
  discount_amount: number
  total: number
  payment_method: PaymentMethod
  payment_details?: Record<string, unknown>
  amount_paid: number
  change_amount: number
  notes?: string
  sold_by?: string
  items?: SaleItem[]
  created_at: string
  updated_at: string
}

export interface FinancialTransaction {
  id: string
  type: TransactionType
  category: TransactionCategory
  description: string
  amount: number
  due_date: string
  payment_date?: string
  status: AccountStatus
  payment_method?: PaymentMethod
  supplier_id?: string
  supplier?: Supplier
  reference_id?: string
  reference_type?: string
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Label {
  id: string
  product_id?: string
  product?: Product
  name: string
  barcode?: string
  size: LabelSize
  template_data: Record<string, unknown>
  print_count: number
  last_printed_at?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface RecipeIngredient {
  raw_material_id: string
  raw_material_name?: string
  quantity: number
  unit: UnitMeasure
  cost: number
}

export interface Recipe {
  id: string
  name: string
  description?: string
  yield_quantity: number
  yield_unit: string
  cost_total: number
  cost_per_unit: number
  ingredients: RecipeIngredient[]
  notes?: string
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface DashboardKpis {
  revenue_today: number
  revenue_month: number
  expenses_month: number
  profit_month: number
  sales_count_today: number
  sales_count_month: number
  low_stock_count: number
  expiring_count: number
}

export interface TopProduct {
  id: string
  name: string
  total_quantity: number
  total_revenue: number
  total_profit: number
}
