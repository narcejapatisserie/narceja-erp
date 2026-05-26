-- Tabela de receitas (recheios e preparações)
CREATE TABLE recipes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  description   TEXT,
  yield_quantity NUMERIC(12,4) NOT NULL DEFAULT 1,  -- quantas unidades/kg a receita rende
  yield_unit    TEXT NOT NULL DEFAULT 'un',          -- unidade do rendimento
  cost_total    NUMERIC(12,4) NOT NULL DEFAULT 0,    -- custo total calculado
  cost_per_unit NUMERIC(12,4) NOT NULL DEFAULT 0,    -- custo por unidade de rendimento
  ingredients   JSONB NOT NULL DEFAULT '[]',         -- array de {raw_material_id, name, quantity, unit, cost}
  notes         TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Adicionar coluna recipe_id em products para vincular receita
ALTER TABLE products ADD COLUMN IF NOT EXISTS recipe_id UUID REFERENCES recipes(id);

-- RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read recipes" ON recipes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert recipes" ON recipes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update recipes" ON recipes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete recipes" ON recipes FOR DELETE USING (auth.role() = 'authenticated');

-- Trigger updated_at
CREATE TRIGGER recipes_updated_at BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
