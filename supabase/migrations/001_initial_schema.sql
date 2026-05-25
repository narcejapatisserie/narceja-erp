-- ============================================================
-- ERP Narceja Pâtisserie - Schema Inicial
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'employee');
CREATE TYPE movement_type AS ENUM ('in', 'out', 'adjustment', 'waste');
CREATE TYPE movement_reason AS ENUM ('purchase', 'sale', 'return', 'production', 'waste', 'expiration', 'initial', 'adjustment');
CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE transaction_category AS ENUM ('sale', 'purchase', 'salary', 'rent', 'utilities', 'maintenance', 'marketing', 'taxes', 'other');
CREATE TYPE payment_method AS ENUM ('cash', 'credit_card', 'debit_card', 'pix', 'voucher', 'mixed');
CREATE TYPE sale_status AS ENUM ('open', 'completed', 'cancelled', 'refunded');
CREATE TYPE label_size AS ENUM ('40x30', '50x30', '60x40', '100x50');
CREATE TYPE account_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');
CREATE TYPE unit_measure AS ENUM ('kg', 'g', 'l', 'ml', 'un', 'cx', 'pct');

-- ============================================================
-- TABELA: profiles
-- ============================================================

CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'employee',
  avatar_url    TEXT,
  phone         TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABELA: suppliers
-- ============================================================

CREATE TABLE suppliers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  trade_name    TEXT,
  document      TEXT,
  email         TEXT,
  phone         TEXT,
  mobile        TEXT,
  address       JSONB DEFAULT '{}',
  contact_name  TEXT,
  notes         TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABELA: raw_materials
-- ============================================================

CREATE TABLE raw_materials (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  description         TEXT,
  unit                unit_measure NOT NULL DEFAULT 'kg',
  cost_per_unit       NUMERIC(12,4) NOT NULL DEFAULT 0,
  stock_quantity      NUMERIC(12,4) NOT NULL DEFAULT 0,
  min_stock           NUMERIC(12,4) NOT NULL DEFAULT 0,
  max_stock           NUMERIC(12,4),
  supplier_id         UUID REFERENCES suppliers(id),
  current_batch       TEXT,
  expiration_date     DATE,
  storage_location    TEXT,
  barcode             TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_by          UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABELA: products
-- ============================================================

CREATE TABLE products (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  description         TEXT,
  category            TEXT,
  sku                 TEXT,
  barcode             TEXT,
  image_url           TEXT,
  sale_price          NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost_price          NUMERIC(12,4) NOT NULL DEFAULT 0,
  margin_percent      NUMERIC(6,2) NOT NULL DEFAULT 0,
  profit_value        NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock_quantity      NUMERIC(12,4) NOT NULL DEFAULT 0,
  min_stock           NUMERIC(12,4) NOT NULL DEFAULT 0,
  unit                unit_measure NOT NULL DEFAULT 'un',
  recipe              JSONB DEFAULT '[]',
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_by          UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABELA: stock_movements
-- ============================================================

CREATE TABLE stock_movements (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type         TEXT NOT NULL CHECK (entity_type IN ('product', 'raw_material')),
  entity_id           UUID NOT NULL,
  movement_type       movement_type NOT NULL,
  reason              movement_reason NOT NULL,
  quantity            NUMERIC(12,4) NOT NULL,
  quantity_before     NUMERIC(12,4) NOT NULL,
  quantity_after      NUMERIC(12,4) NOT NULL,
  unit_cost           NUMERIC(12,4),
  total_cost          NUMERIC(12,2),
  batch               TEXT,
  expiration_date     DATE,
  reference_id        UUID,
  reference_type      TEXT,
  notes               TEXT,
  created_by          UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABELA: sales
-- ============================================================

CREATE TABLE sales (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_number         BIGINT GENERATED ALWAYS AS IDENTITY,
  status              sale_status NOT NULL DEFAULT 'open',
  customer_name       TEXT,
  customer_phone      TEXT,
  subtotal            NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_type       TEXT CHECK (discount_type IN ('percent', 'value')),
  discount_value      NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  total               NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method      payment_method NOT NULL DEFAULT 'cash',
  payment_details     JSONB DEFAULT '{}',
  amount_paid         NUMERIC(12,2) NOT NULL DEFAULT 0,
  change_amount       NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes               TEXT,
  sold_by             UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABELA: sale_items
-- ============================================================

CREATE TABLE sale_items (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id             UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id          UUID NOT NULL REFERENCES products(id),
  product_name        TEXT NOT NULL,
  product_barcode     TEXT,
  quantity            NUMERIC(12,4) NOT NULL,
  unit_price          NUMERIC(12,2) NOT NULL,
  cost_price          NUMERIC(12,4) NOT NULL,
  discount_value      NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_price         NUMERIC(12,2) NOT NULL,
  total_cost          NUMERIC(12,4) NOT NULL,
  profit              NUMERIC(12,2) NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABELA: financial_transactions
-- ============================================================

CREATE TABLE financial_transactions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type                transaction_type NOT NULL,
  category            transaction_category NOT NULL,
  description         TEXT NOT NULL,
  amount              NUMERIC(12,2) NOT NULL,
  due_date            DATE NOT NULL,
  payment_date        DATE,
  status              account_status NOT NULL DEFAULT 'pending',
  payment_method      payment_method,
  supplier_id         UUID REFERENCES suppliers(id),
  reference_id        UUID,
  reference_type      TEXT,
  notes               TEXT,
  created_by          UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABELA: labels
-- ============================================================

CREATE TABLE labels (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id          UUID REFERENCES products(id),
  name                TEXT NOT NULL,
  barcode             TEXT,
  size                label_size NOT NULL DEFAULT '40x30',
  template_data       JSONB DEFAULT '{}',
  print_count         INTEGER NOT NULL DEFAULT 0,
  last_printed_at     TIMESTAMPTZ,
  created_by          UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABELA: audit_logs
-- ============================================================

CREATE TABLE audit_logs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES profiles(id),
  action              TEXT NOT NULL,
  entity_type         TEXT NOT NULL,
  entity_id           UUID,
  old_data            JSONB,
  new_data            JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_raw_materials_expiration ON raw_materials(expiration_date);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_stock_movements_entity ON stock_movements(entity_type, entity_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX idx_financial_transactions_type ON financial_transactions(type);
CREATE INDEX idx_financial_transactions_due_date ON financial_transactions(due_date);
CREATE INDEX idx_financial_transactions_status ON financial_transactions(status);

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_raw_materials_updated_at BEFORE UPDATE ON raw_materials FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_financial_updated_at BEFORE UPDATE ON financial_transactions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TRIGGER: Calcular custo/margem ao salvar produto
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_product_costs()
RETURNS TRIGGER AS $$
DECLARE
  v_cost NUMERIC(12,4) := 0;
  v_item JSONB;
  v_rm_cost NUMERIC(12,4);
BEGIN
  IF NEW.recipe IS NOT NULL AND jsonb_array_length(NEW.recipe) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.recipe)
    LOOP
      SELECT cost_per_unit INTO v_rm_cost
      FROM raw_materials
      WHERE id = (v_item->>'raw_material_id')::UUID;

      IF v_rm_cost IS NOT NULL THEN
        v_cost := v_cost + (v_rm_cost * (v_item->>'quantity')::NUMERIC);
      END IF;
    END LOOP;
  END IF;

  NEW.cost_price := v_cost;

  IF NEW.sale_price > 0 THEN
    NEW.profit_value := NEW.sale_price - v_cost;
    NEW.margin_percent := ((NEW.sale_price - v_cost) / NEW.sale_price) * 100;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_product_costs
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION calculate_product_costs();

-- ============================================================
-- TRIGGER: Atualizar estoque e financeiro ao completar venda
-- ============================================================

CREATE OR REPLACE FUNCTION handle_sale_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_item RECORD;
  v_old_qty NUMERIC;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    FOR v_item IN SELECT * FROM sale_items WHERE sale_id = NEW.id
    LOOP
      SELECT stock_quantity INTO v_old_qty FROM products WHERE id = v_item.product_id FOR UPDATE;

      UPDATE products SET stock_quantity = stock_quantity - v_item.quantity WHERE id = v_item.product_id;

      INSERT INTO stock_movements (entity_type, entity_id, movement_type, reason, quantity, quantity_before, quantity_after, unit_cost, total_cost, reference_id, reference_type)
      VALUES ('product', v_item.product_id, 'out', 'sale', v_item.quantity, v_old_qty, v_old_qty - v_item.quantity, v_item.cost_price, v_item.total_cost, NEW.id, 'sale');
    END LOOP;

    INSERT INTO financial_transactions (type, category, description, amount, due_date, payment_date, status, payment_method, reference_id, reference_type)
    VALUES ('income', 'sale', 'Venda #' || NEW.sale_number, NEW.total, CURRENT_DATE, CURRENT_DATE, 'paid', NEW.payment_method, NEW.id, 'sale');

  ELSIF NEW.status = 'cancelled' AND OLD.status = 'completed' THEN
    FOR v_item IN SELECT * FROM sale_items WHERE sale_id = NEW.id
    LOOP
      SELECT stock_quantity INTO v_old_qty FROM products WHERE id = v_item.product_id FOR UPDATE;
      UPDATE products SET stock_quantity = stock_quantity + v_item.quantity WHERE id = v_item.product_id;

      INSERT INTO stock_movements (entity_type, entity_id, movement_type, reason, quantity, quantity_before, quantity_after, reference_id, reference_type, notes)
      VALUES ('product', v_item.product_id, 'in', 'return', v_item.quantity, v_old_qty, v_old_qty + v_item.quantity, NEW.id, 'sale', 'Cancelamento de venda');
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sale_completed
  AFTER UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION handle_sale_completed();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Perfis
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Demais tabelas: autenticados leem e inserem; admins fazem tudo
CREATE POLICY "suppliers_select" ON suppliers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "suppliers_insert" ON suppliers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "suppliers_update" ON suppliers FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "suppliers_delete" ON suppliers FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "raw_materials_select" ON raw_materials FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "raw_materials_insert" ON raw_materials FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "raw_materials_update" ON raw_materials FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "raw_materials_delete" ON raw_materials FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "products_select" ON products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "products_insert" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "products_update" ON products FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "products_delete" ON products FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "stock_movements_select" ON stock_movements FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "stock_movements_insert" ON stock_movements FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "sales_select" ON sales FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "sales_insert" ON sales FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "sales_update" ON sales FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "sale_items_select" ON sale_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "sale_items_insert" ON sale_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "financial_select" ON financial_transactions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "financial_insert" ON financial_transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "financial_update" ON financial_transactions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "financial_delete" ON financial_transactions FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "labels_select" ON labels FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "labels_insert" ON labels FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "labels_update" ON labels FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "labels_delete" ON labels FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- FUNÇÃO: criar perfil automaticamente no signup
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'employee')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- VIEWS
-- ============================================================

CREATE VIEW vw_low_stock_products AS
SELECT id, name, stock_quantity, min_stock, unit,
  (min_stock - stock_quantity) AS shortage
FROM products
WHERE is_active = true AND stock_quantity <= min_stock
ORDER BY shortage DESC;

CREATE VIEW vw_expiring_materials AS
SELECT id, name, stock_quantity, unit, expiration_date,
  (expiration_date - CURRENT_DATE) AS days_to_expire
FROM raw_materials
WHERE is_active = true
  AND expiration_date IS NOT NULL
  AND expiration_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY expiration_date ASC;
