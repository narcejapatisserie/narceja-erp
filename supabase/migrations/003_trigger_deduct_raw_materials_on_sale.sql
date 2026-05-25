-- ============================================================
-- Atualiza handle_sale_completed para também baixar matérias-primas
-- com base na receita (recipe JSONB) de cada produto vendido.
-- ============================================================

CREATE OR REPLACE FUNCTION handle_sale_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_item        RECORD;
  v_old_qty     NUMERIC;
  v_recipe_item JSONB;
  v_rm_id       UUID;
  v_rm_qty      NUMERIC;
  v_rm_old_qty  NUMERIC;
BEGIN
  -- ─── VENDA CONCLUÍDA (open → completed) ───────────────────
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    FOR v_item IN SELECT * FROM sale_items WHERE sale_id = NEW.id
    LOOP
      -- Baixar estoque do produto
      SELECT stock_quantity INTO v_old_qty FROM products WHERE id = v_item.product_id FOR UPDATE;
      UPDATE products SET stock_quantity = stock_quantity - v_item.quantity WHERE id = v_item.product_id;

      INSERT INTO stock_movements (
        entity_type, entity_id, movement_type, reason, quantity,
        quantity_before, quantity_after, unit_cost, total_cost, reference_id, reference_type
      ) VALUES (
        'product', v_item.product_id, 'out', 'sale', v_item.quantity,
        v_old_qty, v_old_qty - v_item.quantity, v_item.cost_price, v_item.total_cost, NEW.id, 'sale'
      );

      -- Baixar matérias-primas conforme receita do produto
      FOR v_recipe_item IN
        SELECT * FROM jsonb_array_elements(
          (SELECT recipe FROM products WHERE id = v_item.product_id)
        )
      LOOP
        v_rm_id  := (v_recipe_item->>'raw_material_id')::UUID;
        v_rm_qty := (v_recipe_item->>'quantity')::NUMERIC * v_item.quantity;

        IF v_rm_id IS NOT NULL AND v_rm_qty > 0 THEN
          SELECT stock_quantity INTO v_rm_old_qty FROM raw_materials WHERE id = v_rm_id FOR UPDATE;

          UPDATE raw_materials
          SET stock_quantity = GREATEST(0, stock_quantity - v_rm_qty)
          WHERE id = v_rm_id;

          INSERT INTO stock_movements (
            entity_type, entity_id, movement_type, reason, quantity,
            quantity_before, quantity_after, reference_id, reference_type
          ) VALUES (
            'raw_material', v_rm_id, 'out', 'sale', v_rm_qty,
            v_rm_old_qty, GREATEST(0, v_rm_old_qty - v_rm_qty), NEW.id, 'sale'
          );
        END IF;
      END LOOP;
    END LOOP;

    -- Lançamento financeiro de receita
    INSERT INTO financial_transactions (
      type, category, description, amount, due_date, payment_date,
      status, payment_method, reference_id, reference_type
    ) VALUES (
      'income', 'sale', 'Venda #' || NEW.sale_number, NEW.total,
      CURRENT_DATE, CURRENT_DATE, 'paid', NEW.payment_method, NEW.id, 'sale'
    );

  -- ─── CANCELAMENTO (completed → cancelled) ─────────────────
  ELSIF NEW.status = 'cancelled' AND OLD.status = 'completed' THEN
    FOR v_item IN SELECT * FROM sale_items WHERE sale_id = NEW.id
    LOOP
      -- Devolver estoque do produto
      SELECT stock_quantity INTO v_old_qty FROM products WHERE id = v_item.product_id FOR UPDATE;
      UPDATE products SET stock_quantity = stock_quantity + v_item.quantity WHERE id = v_item.product_id;

      INSERT INTO stock_movements (
        entity_type, entity_id, movement_type, reason, quantity,
        quantity_before, quantity_after, reference_id, reference_type, notes
      ) VALUES (
        'product', v_item.product_id, 'in', 'return', v_item.quantity,
        v_old_qty, v_old_qty + v_item.quantity, NEW.id, 'sale', 'Cancelamento de venda'
      );

      -- Devolver matérias-primas conforme receita
      FOR v_recipe_item IN
        SELECT * FROM jsonb_array_elements(
          (SELECT recipe FROM products WHERE id = v_item.product_id)
        )
      LOOP
        v_rm_id  := (v_recipe_item->>'raw_material_id')::UUID;
        v_rm_qty := (v_recipe_item->>'quantity')::NUMERIC * v_item.quantity;

        IF v_rm_id IS NOT NULL AND v_rm_qty > 0 THEN
          SELECT stock_quantity INTO v_rm_old_qty FROM raw_materials WHERE id = v_rm_id FOR UPDATE;

          UPDATE raw_materials
          SET stock_quantity = stock_quantity + v_rm_qty
          WHERE id = v_rm_id;

          INSERT INTO stock_movements (
            entity_type, entity_id, movement_type, reason, quantity,
            quantity_before, quantity_after, reference_id, reference_type, notes
          ) VALUES (
            'raw_material', v_rm_id, 'in', 'return', v_rm_qty,
            v_rm_old_qty, v_rm_old_qty + v_rm_qty, NEW.id, 'sale', 'Cancelamento de venda'
          );
        END IF;
      END LOOP;
    END LOOP;

    -- Estornar lançamento financeiro da venda
    UPDATE financial_transactions
    SET status = 'cancelled'
    WHERE reference_id = NEW.id AND reference_type = 'sale' AND type = 'income';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
