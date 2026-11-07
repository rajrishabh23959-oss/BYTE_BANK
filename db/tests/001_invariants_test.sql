
\set ON_ERROR_STOP off
BEGIN;

CREATE TEMP TABLE t_ctx AS
SELECT a.account_id AS s_acc, h.asset_id, h.quantity AS s_qty,
       (SELECT a2.account_id FROM account a2 JOIN customer c2 USING (customer_id)
         WHERE c2.kyc_status = 'verified' AND a2.status = 'active' AND a2.account_id <> a.account_id
         ORDER BY a2.account_id LIMIT 1) AS r_acc
FROM account a
JOIN customer c USING (customer_id)
JOIN holding h ON h.account_id = a.account_id
WHERE c.kyc_status = 'verified' AND a.status = 'active' AND h.quantity > 0
ORDER BY h.quantity DESC LIMIT 1;

DO $$
DECLARE
  c t_ctx%ROWTYPE;
  tx BIGINT;
  before_s NUMERIC;
  before_r NUMERIC;
  qty NUMERIC;
  ok BOOLEAN;
BEGIN
  SELECT * INTO c FROM t_ctx;
  qty := c.s_qty / 4;
  SELECT quantity INTO before_s FROM holding WHERE account_id = c.s_acc AND asset_id = c.asset_id;
  SELECT COALESCE((SELECT quantity FROM holding WHERE account_id = c.r_acc AND asset_id = c.asset_id), 0) INTO before_r;

  tx := transfer_assets(c.s_acc, c.r_acc, c.asset_id, qty);

  ok := (SELECT quantity FROM holding WHERE account_id = c.s_acc AND asset_id = c.asset_id) = before_s - qty
    AND (SELECT quantity FROM holding WHERE account_id = c.r_acc AND asset_id = c.asset_id) = before_r + qty
    AND (SELECT SUM(signed_quantity) FROM ledger_entry WHERE transaction_id = tx) = 0
    AND (SELECT count(*) FROM ledger_entry WHERE transaction_id = tx) = 2;

  RAISE NOTICE '% T01: Normal atomic transfer with paired zero-sum ledger', CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END;
END $$;

DO $$
DECLARE
  c t_ctx%ROWTYPE;
  b NUMERIC;
  ok BOOLEAN := false;
BEGIN
  SELECT * INTO c FROM t_ctx;
  SELECT quantity INTO b FROM holding WHERE account_id = c.s_acc AND asset_id = c.asset_id;
  BEGIN
    PERFORM transfer_assets(c.s_acc, c.r_acc, c.asset_id, b + 100);
  EXCEPTION WHEN OTHERS THEN
    ok := (SQLERRM LIKE 'Insufficient balance%');
  END;
  RAISE NOTICE '% T02: Overspend correctly rejected with Insufficient balance', CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END;
END $$;

DO $$
DECLARE
  c t_ctx%ROWTYPE;
  ok BOOLEAN := false;
BEGIN
  SELECT * INTO c FROM t_ctx;
  BEGIN
    UPDATE holding SET quantity = -5 WHERE account_id = c.s_acc AND asset_id = c.asset_id;
  EXCEPTION WHEN check_violation THEN
    ok := true;
  END;
  RAISE NOTICE '% T03: CHECK constraint prevents negative balance', CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END;
END $$;

DO $$
DECLARE
  p TEXT;
  e TEXT;
  ok1 BOOLEAN := false;
  ok2 BOOLEAN := false;
BEGIN
  SELECT phone, email INTO p, e FROM customer LIMIT 1;
  BEGIN
    INSERT INTO customer(full_name, phone, email, address, date_of_birth, id_proof_hash, id_proof_last4)
    VALUES ('Dup One', p, 'uniq1@example.test', 'addr', '2000-01-01', 'hash', '0000');
  EXCEPTION WHEN unique_violation THEN ok1 := true; END;

  BEGIN
    INSERT INTO customer(full_name, phone, email, address, date_of_birth, id_proof_hash, id_proof_last4)
    VALUES ('Dup Two', '9999999999', e, 'addr', '2000-01-01', 'hash', '0000');
  EXCEPTION WHEN unique_violation THEN ok2 := true; END;

  RAISE NOTICE '% T04: UNIQUE constraints on phone and email enforced', CASE WHEN ok1 AND ok2 THEN 'PASS' ELSE 'FAIL' END;
END $$;

DO $$
DECLARE
  cid INT;
  ok BOOLEAN := false;
BEGIN
  SELECT customer_id INTO cid FROM account WHERE customer_id IS NOT NULL LIMIT 1;
  BEGIN
    INSERT INTO account(account_no, customer_id) VALUES ('BB-DUPLICATE-ACC', cid);
  EXCEPTION WHEN unique_violation THEN ok := true; END;
  RAISE NOTICE '% T05: Strict 1:1 customer account relationship enforced', CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END;
END $$;

DO $$
DECLARE
  k INT;
  f INT;
  r INT;
  ok1 BOOLEAN := false;
  ok2 BOOLEAN := false;
BEGIN
  SELECT a.account_id INTO k FROM account a JOIN customer c USING (customer_id) WHERE c.kyc_status <> 'verified' AND a.status = 'active' LIMIT 1;
  SELECT a.account_id INTO f FROM account a WHERE a.status = 'frozen' LIMIT 1;
  SELECT a.account_id INTO r FROM account a JOIN customer c USING (customer_id) WHERE c.kyc_status = 'verified' AND a.status = 'active' LIMIT 1;

  INSERT INTO holding(account_id, asset_id, quantity) VALUES (k, 1, 5) ON CONFLICT (account_id, asset_id) DO UPDATE SET quantity = 5;
  INSERT INTO holding(account_id, asset_id, quantity) VALUES (f, 1, 5) ON CONFLICT (account_id, asset_id) DO UPDATE SET quantity = 5;

  BEGIN PERFORM transfer_assets(k, r, 1, 1); EXCEPTION WHEN OTHERS THEN ok1 := (SQLERRM LIKE 'KYC not verified%'); END;
  BEGIN PERFORM transfer_assets(f, r, 1, 1); EXCEPTION WHEN OTHERS THEN ok2 := (SQLERRM LIKE 'Account frozen%'); END;

  RAISE NOTICE '% T06: KYC verification and account unfreezing strictly gated', CASE WHEN ok1 AND ok2 THEN 'PASS' ELSE 'FAIL' END;
END $$;

DO $$
DECLARE
  cid INT;
  ok BOOLEAN := false;
BEGIN
  SELECT customer_id INTO cid FROM customer LIMIT 1;
  INSERT INTO transfer_request(customer_id, idempotency_key, request_fingerprint, request_status)
  VALUES (cid, 'idemp-test-key-1', 'fingerprint-abc', 'in_progress');

  BEGIN
    INSERT INTO transfer_request(customer_id, idempotency_key, request_fingerprint, request_status)
    VALUES (cid, 'idemp-test-key-1', 'fingerprint-abc', 'in_progress');
  EXCEPTION WHEN unique_violation THEN ok := true; END;

  RAISE NOTICE '% T07: Idempotency key uniqueness scoped per customer', CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END;
END $$;

DO $$
DECLARE
  ok1 BOOLEAN := false;
  ok2 BOOLEAN := false;
BEGIN
  BEGIN UPDATE ledger_entry SET signed_quantity = signed_quantity WHERE entry_id = 1;
  EXCEPTION WHEN OTHERS THEN ok1 := true; END;

  BEGIN DELETE FROM ledger_entry WHERE entry_id = 1;
  EXCEPTION WHEN OTHERS THEN ok2 := true; END;

  RAISE NOTICE '% T08: Ledger is append-only (UPDATE and DELETE prohibited)', CASE WHEN ok1 AND ok2 THEN 'PASS' ELSE 'FAIL' END;
END $$;

DO $$
DECLARE
  ok BOOLEAN := false;
BEGIN
  BEGIN
    UPDATE asset_transaction SET quantity = 999 WHERE transaction_id = 1 AND status = 'success';
  EXCEPTION WHEN OTHERS THEN ok := true; END;

  RAISE NOTICE '% T09: Completed transactions cannot be modified', CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END;
END $$;

DO $$
DECLARE
  r1 BIGINT;
  r2 BIGINT;
  c t_ctx%ROWTYPE;
  i1 INT;
  i2 INT;
  led_before BIGINT;
  led_after BIGINT;
BEGIN
  SELECT * INTO c FROM t_ctx;
  SELECT count(*) INTO led_before FROM ledger_entry;
  r1 := run_reconciliation();
  SELECT issues_found INTO i1 FROM reconciliation_run WHERE run_id = r1;

  UPDATE holding SET quantity = quantity + 0.50 WHERE account_id = c.s_acc AND asset_id = c.asset_id;

  r2 := run_reconciliation();
  SELECT issues_found INTO i2 FROM reconciliation_run WHERE run_id = r2;
  SELECT count(*) INTO led_after FROM ledger_entry;

  RAISE NOTICE '% T10: Reconciliation detects drift (issues: % -> %) without altering ledger',
    CASE WHEN i2 = i1 + 1 AND led_before = led_after THEN 'PASS' ELSE 'FAIL' END, i1, i2;
END $$;

DO $$
DECLARE
  n INT;
BEGIN
  SELECT count(*) INTO n FROM information_schema.columns
   WHERE table_name = 'v_auditor_transactions'
     AND column_name IN ('full_name', 'phone', 'email', 'address', 'date_of_birth', 'id_proof_hash', 'id_proof_last4');

  RAISE NOTICE '% T11: Auditor transaction view contains zero customer PII', CASE WHEN n = 0 THEN 'PASS' ELSE 'FAIL' END;
END $$;

DO $$
DECLARE
  v_rec RECORD;
BEGIN
  SELECT * INTO v_rec FROM assess_transfer_risk(3, 5, 1, 0.05);
  RAISE NOTICE '% T12: Rule-based screening generated outcome=% auth_token=%',
    CASE WHEN v_rec.outcome IN ('ALLOW', 'REQUIRE_EXTRA_CONFIRMATION') AND v_rec.auth_token IS NOT NULL THEN 'PASS' ELSE 'FAIL' END,
    v_rec.outcome, v_rec.auth_token;
END $$;

DO $$
DECLARE
  v_res_id BIGINT;
  v_total NUMERIC;
  v_avail1 NUMERIC;
  v_avail2 NUMERIC;
  ok BOOLEAN;
BEGIN
  SELECT total_qty, available_qty INTO v_total, v_avail1 FROM v_available_quantity WHERE account_id = 3 AND asset_id = 1;
  v_res_id := reserve_asset(3, 1, 0.5, NULL, 600);
  SELECT available_qty INTO v_avail2 FROM v_available_quantity WHERE account_id = 3 AND asset_id = 1;

  ok := (v_avail2 = v_avail1 - 0.5);
  PERFORM release_reservation(v_res_id);

  RAISE NOTICE '% T13: Two-phase reservation locks available quantity atomically', CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END;
END $$;

ROLLBACK;
