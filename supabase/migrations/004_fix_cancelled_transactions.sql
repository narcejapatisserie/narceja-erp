-- Corrige transações financeiras geradas por vendas completadas que ficaram como 'cancelled' incorretamente.
-- Isso ocorreu porque o trigger antigo tinha um bug. Reativa as transações vinculadas a vendas 'completed'.

UPDATE financial_transactions ft
SET status = 'paid'
WHERE ft.reference_type = 'sale'
  AND ft.type = 'income'
  AND ft.status = 'cancelled'
  AND EXISTS (
    SELECT 1 FROM sales s
    WHERE s.id = ft.reference_id
      AND s.status = 'completed'
  );
