
BEGIN;

CREATE OR REPLACE VIEW v_available_quantity AS
SELECT
  h.account_id,
  h.asset_id,
  h.quantity AS total_qty,
  COALESCE(r.reserved, 0) AS reserved_qty,
  h.quantity - COALESCE(r.reserved, 0) AS available_qty
FROM holding h
LEFT JOIN (
  SELECT account_id, asset_id, SUM(quantity) AS reserved
  FROM asset_reservation
  WHERE status = 'active' AND expires_at > now()
  GROUP BY account_id, asset_id
) r ON h.account_id = r.account_id AND h.asset_id = r.asset_id;

CREATE OR REPLACE VIEW v_reconciliation AS
SELECT
  COALESCE(h.account_id, l.account_id) AS account_id,
  COALESCE(h.asset_id, l.asset_id) AS asset_id,
  COALESCE(h.quantity, 0) AS holding_qty,
  COALESCE(l.q, 0) AS ledger_qty,
  COALESCE(h.quantity, 0) = COALESCE(l.q, 0) AS matched
FROM holding h
FULL JOIN (
  SELECT account_id, asset_id, SUM(signed_quantity) AS q
  FROM ledger_entry
  GROUP BY account_id, asset_id
) l ON h.account_id = l.account_id AND h.asset_id = l.asset_id;

CREATE OR REPLACE VIEW v_auditor_transactions AS
SELECT
  t.transaction_id,
  COALESCE(a1.account_no, 'EXTERNAL_MARKET') AS sender_account_no,
  COALESCE(a2.account_no, 'EXTERNAL_MARKET') AS receiver_account_no,
  s.symbol,
  s.type AS asset_type,
  t.quantity,
  t.type AS txn_type,
  t.status AS txn_status,
  t.failure_reason,
  t.created_at,
  t.completed_at
FROM asset_transaction t
LEFT JOIN account a1 ON a1.account_id = t.sender_account
LEFT JOIN account a2 ON a2.account_id = t.receiver_account
JOIN asset s ON s.asset_id = t.asset_id;

CREATE OR REPLACE VIEW v_failed_by_month AS
SELECT
  date_trunc('month', created_at) AS month,
  status,
  COALESCE(failure_reason, 'Unspecified') AS failure_reason,
  count(*) AS n
FROM asset_transaction
WHERE status IN ('failed', 'rejected')
GROUP BY 1, 2, 3
ORDER BY month DESC;

CREATE OR REPLACE VIEW v_portfolio_valuation AS
SELECT
  h.account_id,
  a.account_no,
  a.customer_id,
  h.asset_id,
  ast.name AS asset_name,
  ast.symbol,
  ast.type AS asset_type,
  ast.quantity_scale,
  h.quantity,
  v.available_qty,
  v.reserved_qty,
  ast.sim_ref_price,
  ROUND(h.quantity * ast.sim_ref_price, 2) AS simulated_value_sru,
  ast.price_updated_at
FROM holding h
JOIN account a ON a.account_id = h.account_id
JOIN asset ast ON ast.asset_id = h.asset_id
JOIN v_available_quantity v ON v.account_id = h.account_id AND v.asset_id = h.asset_id;

CREATE OR REPLACE VIEW v_customer_statement AS
SELECT
  le.entry_id,
  le.posted_at,
  le.account_id,
  a.account_no,
  a.customer_id,
  ast.symbol,
  ast.name AS asset_name,
  le.signed_quantity,
  t.transaction_id,
  t.type AS txn_type,
  t.status AS txn_status,
  CASE
    WHEN t.sender_account = le.account_id THEN COALESCE(ra.account_no, 'EXTERNAL_MARKET')
    ELSE COALESCE(sa.account_no, 'EXTERNAL_MARKET')
  END AS counterparty_account_no,
  le.reversal_of_entry_id
FROM ledger_entry le
JOIN account a ON a.account_id = le.account_id
JOIN asset ast ON ast.asset_id = le.asset_id
JOIN asset_transaction t ON t.transaction_id = le.transaction_id
LEFT JOIN account sa ON sa.account_id = t.sender_account
LEFT JOIN account ra ON ra.account_id = t.receiver_account;

COMMIT;
