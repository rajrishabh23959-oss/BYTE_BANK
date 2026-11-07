
BEGIN;

CREATE OR REPLACE FUNCTION trg_ledger_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'ledger_entry is append-only. Corrections must be posted as linked reversal entries.';
END;
$$;

DROP TRIGGER IF EXISTS trg_ledger_no_update_delete ON ledger_entry;
CREATE TRIGGER trg_ledger_no_update_delete
BEFORE UPDATE OR DELETE ON ledger_entry
FOR EACH ROW EXECUTE FUNCTION trg_ledger_immutable();

CREATE OR REPLACE FUNCTION trg_transaction_completed_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'asset_transaction records cannot be deleted. Maintain immutable audit integrity.';
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IN ('success', 'failed', 'rejected') THEN
      RAISE EXCEPTION 'Completed transaction % with status % cannot be modified.', OLD.transaction_id, OLD.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_txn_no_tamper ON asset_transaction;
CREATE TRIGGER trg_txn_no_tamper
BEFORE UPDATE OR DELETE ON asset_transaction
FOR EACH ROW EXECUTE FUNCTION trg_transaction_completed_immutable();

CREATE OR REPLACE FUNCTION trg_audit_account_changes()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status <> NEW.status THEN
    INSERT INTO audit_log (actor, action, resource, old_value, new_value, at)
    VALUES (
      COALESCE(current_setting('bytebank.current_actor', true), 'system'),
      'ACCOUNT_STATUS_CHANGE',
      'account:' || NEW.account_id || ' (' || NEW.account_no || ')',
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      now()
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_account_status_audit ON account;
CREATE TRIGGER trg_account_status_audit
AFTER UPDATE OF status ON account
FOR EACH ROW EXECUTE FUNCTION trg_audit_account_changes();

CREATE OR REPLACE FUNCTION trg_audit_asset_price_changes()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.sim_ref_price <> NEW.sim_ref_price THEN
    INSERT INTO audit_log (actor, action, resource, old_value, new_value, at)
    VALUES (
      COALESCE(current_setting('bytebank.current_actor', true), 'admin'),
      'ASSET_PRICE_UPDATE',
      'asset:' || NEW.symbol,
      jsonb_build_object('sim_ref_price', OLD.sim_ref_price, 'updated_at', OLD.price_updated_at),
      jsonb_build_object('sim_ref_price', NEW.sim_ref_price, 'updated_at', NEW.price_updated_at),
      now()
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_asset_price_audit ON asset;
CREATE TRIGGER trg_asset_price_audit
AFTER UPDATE OF sim_ref_price ON asset
FOR EACH ROW EXECUTE FUNCTION trg_audit_asset_price_changes();

CREATE OR REPLACE FUNCTION trg_audit_customer_kyc_changes()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.kyc_status <> NEW.kyc_status THEN
    INSERT INTO audit_log (actor, action, resource, old_value, new_value, at)
    VALUES (
      COALESCE(current_setting('bytebank.current_actor', true), 'staff'),
      'KYC_STATUS_CHANGE',
      'customer:' || NEW.customer_id,
      jsonb_build_object('kyc_status', OLD.kyc_status),
      jsonb_build_object('kyc_status', NEW.kyc_status, 'id_proof_last4', NEW.id_proof_last4),
      now()
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_customer_kyc_audit ON customer;
CREATE TRIGGER trg_customer_kyc_audit
AFTER UPDATE OF kyc_status ON customer
FOR EACH ROW EXECUTE FUNCTION trg_audit_customer_kyc_changes();

CREATE OR REPLACE FUNCTION transfer_assets(
  p_sender INT,
  p_receiver INT,
  p_asset INT,
  p_qty NUMERIC,
  p_auth_token UUID DEFAULT NULL
)
RETURNS BIGINT LANGUAGE plpgsql AS $$
DECLARE
  v_txn BIGINT;
  v_bal NUMERIC;
  v_reserved NUMERIC;
  v_sender_status acct_status_t;
  v_receiver_status acct_status_t;
  v_sender_kyc kyc_status_t;
  v_sender_acct_no TEXT;
  v_receiver_acct_no TEXT;
  v_asset_sym TEXT;
  v_scale SMALLINT;
  v_auth_record RECORD;
BEGIN

  IF p_qty <= 0 THEN
    RAISE EXCEPTION 'Invalid quantity: % must be strictly positive', p_qty;
  END IF;
  IF p_sender = p_receiver THEN
    RAISE EXCEPTION 'Sender and receiver accounts must differ';
  END IF;

  SELECT symbol, quantity_scale INTO v_asset_sym, v_scale FROM asset WHERE asset_id = p_asset;
  IF v_asset_sym IS NULL THEN
    RAISE EXCEPTION 'Unknown asset ID: %', p_asset;
  END IF;

  PERFORM 1 FROM holding
   WHERE asset_id = p_asset AND account_id IN (p_sender, p_receiver)
   ORDER BY account_id FOR UPDATE;

  SELECT a.status, a.account_no, c.kyc_status INTO v_sender_status, v_sender_acct_no, v_sender_kyc
    FROM account a
    LEFT JOIN customer c USING (customer_id)
   WHERE a.account_id = p_sender;

  SELECT a.status, a.account_no INTO v_receiver_status, v_receiver_acct_no
    FROM account a
   WHERE a.account_id = p_receiver;

  IF v_sender_status IS NULL THEN
    RAISE EXCEPTION 'Unknown sender account: %', p_sender;
  END IF;
  IF v_receiver_status IS NULL THEN
    RAISE EXCEPTION 'Unknown receiver account: %', p_receiver;
  END IF;

  IF v_sender_status = 'frozen' THEN
    RAISE EXCEPTION 'Account frozen: sender account % is frozen', v_sender_acct_no;
  END IF;
  IF v_receiver_status = 'frozen' THEN
    RAISE EXCEPTION 'Account frozen: receiver account % is frozen', v_receiver_acct_no;
  END IF;

  IF v_sender_kyc IS NOT NULL AND v_sender_kyc <> 'verified' THEN
    RAISE EXCEPTION 'KYC not verified: sender status is %', v_sender_kyc;
  END IF;

  IF p_auth_token IS NOT NULL THEN
    SELECT * INTO v_auth_record FROM transfer_authorization
     WHERE auth_token = p_auth_token FOR UPDATE;

    IF v_auth_record.auth_token IS NULL THEN
      RAISE EXCEPTION 'Authorization invalid: token not found';
    END IF;
    IF NOT v_auth_record.is_valid THEN
      RAISE EXCEPTION 'Authorization invalid: token invalidated';
    END IF;
    IF v_auth_record.consumed_at IS NOT NULL THEN
      RAISE EXCEPTION 'Authorization invalid: token already consumed';
    END IF;
    IF v_auth_record.expires_at < now() THEN
      RAISE EXCEPTION 'Authorization expired: token validity elapsed';
    END IF;

    IF v_auth_record.sender_account <> p_sender OR
       v_auth_record.receiver_account <> p_receiver OR
       v_auth_record.asset_id <> p_asset OR
       v_auth_record.quantity <> p_qty THEN
      RAISE EXCEPTION 'Authorization invalid or details altered';
    END IF;

    UPDATE transfer_authorization SET consumed_at = now(), is_valid = false WHERE auth_token = p_auth_token;
  END IF;

  SELECT quantity INTO v_bal FROM holding WHERE account_id = p_sender AND asset_id = p_asset;
  SELECT COALESCE(SUM(quantity), 0) INTO v_reserved
    FROM asset_reservation
   WHERE account_id = p_sender AND asset_id = p_asset AND status = 'active' AND expires_at > now();

  IF COALESCE(v_bal, 0) - v_reserved < p_qty THEN
    RAISE EXCEPTION 'Insufficient balance: available %, requested %', (COALESCE(v_bal, 0) - v_reserved), p_qty;
  END IF;

  INSERT INTO asset_transaction (sender_account, receiver_account, asset_id, quantity, type, status, completed_at)
  VALUES (p_sender, p_receiver, p_asset, p_qty, 'transfer', 'success', now())
  RETURNING transaction_id INTO v_txn;

  UPDATE holding SET quantity = quantity - p_qty
   WHERE account_id = p_sender AND asset_id = p_asset;

  INSERT INTO holding (account_id, asset_id, quantity)
  VALUES (p_receiver, p_asset, p_qty)
  ON CONFLICT (account_id, asset_id)
  DO UPDATE SET quantity = holding.quantity + EXCLUDED.quantity;

  INSERT INTO ledger_entry (transaction_id, account_id, asset_id, signed_quantity)
  VALUES
    (v_txn, p_sender, p_asset, -p_qty),
    (v_txn, p_receiver, p_asset,  p_qty);

  INSERT INTO audit_log (actor, action, resource, new_value, at)
  VALUES (
    COALESCE(current_setting('bytebank.current_actor', true), 'system'),
    'TRANSFER',
    'transaction:' || v_txn,
    jsonb_build_object(
      'txn_id', v_txn,
      'asset', v_asset_sym,
      'quantity', p_qty,
      'from_account', v_sender_acct_no,
      'to_account', v_receiver_acct_no
    ),
    now()
  );

  INSERT INTO notification (customer_id, type, title, body)
  SELECT customer_id, 'TRANSFER_SENT', 'Transfer Confirmed',
         'Sent ' || p_qty || ' ' || v_asset_sym || ' to ' || v_receiver_acct_no
    FROM account WHERE account_id = p_sender AND customer_id IS NOT NULL;

  INSERT INTO notification (customer_id, type, title, body)
  SELECT customer_id, 'TRANSFER_RECEIVED', 'Transfer Received',
         'Received ' || p_qty || ' ' || v_asset_sym || ' from ' || v_sender_acct_no
    FROM account WHERE account_id = p_receiver AND customer_id IS NOT NULL;

  RETURN v_txn;
END;
$$;

CREATE OR REPLACE FUNCTION simulated_swap(
  p_account INT,
  p_from_asset INT,
  p_to_asset INT,
  p_from_qty NUMERIC
)
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
  v_mm_account INT;
  v_from_price NUMERIC;
  v_to_price NUMERIC;
  v_from_scale SMALLINT;
  v_to_scale SMALLINT;
  v_to_qty NUMERIC;
  v_swap_group UUID := gen_random_uuid();
  v_tx_sell BIGINT;
  v_tx_buy BIGINT;
  v_bal NUMERIC;
  v_reserved NUMERIC;
  v_acct_status acct_status_t;
  v_kyc kyc_status_t;
  v_from_sym TEXT;
  v_to_sym TEXT;
BEGIN
  IF p_from_asset = p_to_asset THEN
    RAISE EXCEPTION 'Cannot swap asset to itself';
  END IF;
  IF p_from_qty <= 0 THEN
    RAISE EXCEPTION 'Invalid swap quantity: %', p_from_qty;
  END IF;

  SELECT account_id INTO v_mm_account FROM account WHERE is_system = true AND account_no = 'BB-MARKETMAKER';
  IF v_mm_account IS NULL THEN
    RAISE EXCEPTION 'System Market Maker account not found';
  END IF;

  SELECT a.status, c.kyc_status INTO v_acct_status, v_kyc
    FROM account a LEFT JOIN customer c USING (customer_id)
   WHERE a.account_id = p_account;

  IF v_acct_status <> 'active' THEN
    RAISE EXCEPTION 'Account frozen';
  END IF;
  IF v_kyc IS NOT NULL AND v_kyc <> 'verified' THEN
    RAISE EXCEPTION 'KYC not verified';
  END IF;

  SELECT symbol, sim_ref_price, quantity_scale INTO v_from_sym, v_from_price, v_from_scale FROM asset WHERE asset_id = p_from_asset;
  SELECT symbol, sim_ref_price, quantity_scale INTO v_to_sym, v_to_price, v_to_scale FROM asset WHERE asset_id = p_to_asset;

  v_to_qty := ROUND((p_from_qty * v_from_price) / v_to_price, v_to_scale);
  IF v_to_qty <= 0 THEN
    RAISE EXCEPTION 'Calculated exchange amount is zero; increase swap input quantity';
  END IF;

  PERFORM 1 FROM holding
   WHERE (asset_id = p_from_asset OR asset_id = p_to_asset)
     AND account_id IN (p_account, v_mm_account)
   ORDER BY account_id, asset_id FOR UPDATE;

  SELECT quantity INTO v_bal FROM holding WHERE account_id = p_account AND asset_id = p_from_asset;
  SELECT COALESCE(SUM(quantity), 0) INTO v_reserved
    FROM asset_reservation
   WHERE account_id = p_account AND asset_id = p_from_asset AND status = 'active' AND expires_at > now();

  IF COALESCE(v_bal, 0) - v_reserved < p_from_qty THEN
    RAISE EXCEPTION 'Insufficient balance for swap';
  END IF;

  SELECT quantity INTO v_bal FROM holding WHERE account_id = v_mm_account AND asset_id = p_to_asset;
  IF COALESCE(v_bal, 0) < v_to_qty THEN
    RAISE EXCEPTION 'Market Maker has insufficient liquidity for asset %', v_to_sym;
  END IF;

  INSERT INTO asset_transaction (sender_account, receiver_account, asset_id, quantity, type, status, swap_group, completed_at)
  VALUES (p_account, v_mm_account, p_from_asset, p_from_qty, 'sell', 'success', v_swap_group, now())
  RETURNING transaction_id INTO v_tx_sell;

  UPDATE holding SET quantity = quantity - p_from_qty WHERE account_id = p_account AND asset_id = p_from_asset;
  INSERT INTO holding (account_id, asset_id, quantity) VALUES (v_mm_account, p_from_asset, p_from_qty)
  ON CONFLICT (account_id, asset_id) DO UPDATE SET quantity = holding.quantity + EXCLUDED.quantity;

  INSERT INTO ledger_entry (transaction_id, account_id, asset_id, signed_quantity)
  VALUES (v_tx_sell, p_account, p_from_asset, -p_from_qty),
         (v_tx_sell, v_mm_account, p_from_asset,  p_from_qty);

  INSERT INTO asset_transaction (sender_account, receiver_account, asset_id, quantity, type, status, swap_group, completed_at)
  VALUES (v_mm_account, p_account, p_to_asset, v_to_qty, 'buy', 'success', v_swap_group, now())
  RETURNING transaction_id INTO v_tx_buy;

  UPDATE holding SET quantity = quantity - v_to_qty WHERE account_id = v_mm_account AND asset_id = p_to_asset;
  INSERT INTO holding (account_id, asset_id, quantity) VALUES (p_account, p_to_asset, v_to_qty)
  ON CONFLICT (account_id, asset_id) DO UPDATE SET quantity = holding.quantity + EXCLUDED.quantity;

  INSERT INTO ledger_entry (transaction_id, account_id, asset_id, signed_quantity)
  VALUES (v_tx_buy, v_mm_account, p_to_asset, -v_to_qty),
         (v_tx_buy, p_account, p_to_asset,  v_to_qty);

  INSERT INTO audit_log (actor, action, resource, new_value, at)
  VALUES (
    COALESCE(current_setting('bytebank.current_actor', true), 'system'),
    'SWAP',
    'swap_group:' || v_swap_group,
    jsonb_build_object(
      'account', p_account,
      'sold_asset', v_from_sym,
      'sold_qty', p_from_qty,
      'bought_asset', v_to_sym,
      'bought_qty', v_to_qty
    ),
    now()
  );

  INSERT INTO notification (customer_id, type, title, body)
  SELECT customer_id, 'SWAP_COMPLETED', 'Simulated Swap Complete',
         'Swapped ' || p_from_qty || ' ' || v_from_sym || ' for ' || v_to_qty || ' ' || v_to_sym
    FROM account WHERE account_id = p_account AND customer_id IS NOT NULL;

  RETURN v_swap_group;
END;
$$;

CREATE OR REPLACE FUNCTION assess_transfer_risk(
  p_sender INT,
  p_receiver INT,
  p_asset INT,
  p_qty NUMERIC
)
RETURNS TABLE (
  assessment_id BIGINT,
  outcome outcome_t,
  auth_token UUID,
  reasons TEXT[]
) LANGUAGE plpgsql AS $$
DECLARE
  v_assessment_id BIGINT;
  v_auth_token UUID := NULL;
  v_outcome outcome_t := 'ALLOW';
  v_reasons TEXT[] := ARRAY[]::TEXT[];
  v_sender_kyc kyc_status_t;
  v_sender_status acct_status_t;
  v_receiver_status acct_status_t;
  v_customer_id INT;
  v_bal NUMERIC;
  v_reserved NUMERIC;
  v_asset_sym TEXT;
  v_rule_id INT;
  v_rule_params JSONB;
  v_rule_version INT;
  v_prev_txns INT;
  v_recent_txns INT;
  v_threshold NUMERIC;
BEGIN

  SELECT a.status, a.customer_id, c.kyc_status INTO v_sender_status, v_customer_id, v_sender_kyc
    FROM account a LEFT JOIN customer c USING (customer_id) WHERE a.account_id = p_sender;

  SELECT status INTO v_receiver_status FROM account WHERE account_id = p_receiver;
  SELECT symbol INTO v_asset_sym FROM asset WHERE asset_id = p_asset;

  INSERT INTO risk_assessment (customer_id, sender_account, receiver_account, asset_id, quantity, outcome)
  VALUES (v_customer_id, p_sender, p_receiver, p_asset, p_qty, 'ALLOW')
  RETURNING risk_assessment.assessment_id INTO v_assessment_id;

  SELECT rule_id, params INTO v_rule_id, v_rule_params FROM risk_rule WHERE code = 'KYC_VERIFICATION' AND active = true ORDER BY version DESC LIMIT 1;
  IF v_sender_kyc IS NULL OR v_sender_kyc <> 'verified' THEN
    v_outcome := 'REJECT';
    v_reasons := array_append(v_reasons, 'Sender KYC identity status is unverified or rejected.');
    IF v_rule_id IS NOT NULL THEN
      INSERT INTO risk_assessment_reason (assessment_id, rule_id, reason_text) VALUES (v_assessment_id, v_rule_id, 'Sender KYC identity status is unverified or rejected.') ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  SELECT rule_id, params INTO v_rule_id, v_rule_params FROM risk_rule WHERE code = 'ACCOUNT_STATUS' AND active = true ORDER BY version DESC LIMIT 1;
  IF v_sender_status = 'frozen' OR v_receiver_status = 'frozen' THEN
    v_outcome := 'REJECT';
    v_reasons := array_append(v_reasons, 'One or both transacting accounts are currently frozen by compliance.');
    IF v_rule_id IS NOT NULL THEN
      INSERT INTO risk_assessment_reason (assessment_id, rule_id, reason_text) VALUES (v_assessment_id, v_rule_id, 'One or both transacting accounts are currently frozen by compliance.') ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  SELECT rule_id, params INTO v_rule_id, v_rule_params FROM risk_rule WHERE code = 'INSUFFICIENT_FUNDS' AND active = true ORDER BY version DESC LIMIT 1;
  SELECT quantity INTO v_bal FROM holding WHERE account_id = p_sender AND asset_id = p_asset;
  SELECT COALESCE(SUM(quantity), 0) INTO v_reserved
    FROM asset_reservation
   WHERE account_id = p_sender AND asset_id = p_asset AND status = 'active' AND expires_at > now();

  IF COALESCE(v_bal, 0) - v_reserved < p_qty THEN
    v_outcome := 'REJECT';
    v_reasons := array_append(v_reasons, 'Transfer quantity exceeds available balance (Total: ' || COALESCE(v_bal, 0) || ', Active Reserved: ' || v_reserved || ').');
    IF v_rule_id IS NOT NULL THEN
      INSERT INTO risk_assessment_reason (assessment_id, rule_id, reason_text) VALUES (v_assessment_id, v_rule_id, 'Transfer quantity exceeds available balance.') ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  IF v_outcome <> 'REJECT' THEN

    SELECT rule_id, params INTO v_rule_id, v_rule_params FROM risk_rule WHERE code = 'NEW_COUNTERPARTY' AND active = true ORDER BY version DESC LIMIT 1;
    SELECT count(*) INTO v_prev_txns FROM asset_transaction
     WHERE sender_account = p_sender AND receiver_account = p_receiver AND status = 'success';

    IF v_prev_txns = 0 THEN
      v_outcome := 'REQUIRE_EXTRA_CONFIRMATION';
      v_reasons := array_append(v_reasons, 'First-time transfer to recipient account: secondary review confirmation required.');
      IF v_rule_id IS NOT NULL THEN
        INSERT INTO risk_assessment_reason (assessment_id, rule_id, reason_text) VALUES (v_assessment_id, v_rule_id, 'First-time transfer to recipient account: secondary review confirmation required.') ON CONFLICT DO NOTHING;
      END IF;
    END IF;

    SELECT rule_id, params INTO v_rule_id, v_rule_params FROM risk_rule WHERE code = 'HIGH_VELOCITY' AND active = true ORDER BY version DESC LIMIT 1;
    SELECT count(*) INTO v_recent_txns FROM asset_transaction
     WHERE sender_account = p_sender AND created_at > now() - INTERVAL '1 hour';

    IF v_recent_txns >= 3 THEN
      v_outcome := 'REQUIRE_EXTRA_CONFIRMATION';
      v_reasons := array_append(v_reasons, 'High transaction velocity detected: ' || v_recent_txns || ' transfers dispatched in the past hour.');
      IF v_rule_id IS NOT NULL THEN
        INSERT INTO risk_assessment_reason (assessment_id, rule_id, reason_text) VALUES (v_assessment_id, v_rule_id, 'High transaction velocity detected: 3+ transfers in past hour.') ON CONFLICT DO NOTHING;
      END IF;
    END IF;

    SELECT rule_id, params INTO v_rule_id, v_rule_params FROM risk_rule WHERE code = 'LARGE_VALUE_THRESHOLD' AND active = true ORDER BY version DESC LIMIT 1;
    v_threshold := COALESCE((v_rule_params->>v_asset_sym)::NUMERIC, (v_rule_params->>'DEFAULT')::NUMERIC, 1000);
    IF p_qty >= v_threshold THEN
      v_outcome := 'REQUIRE_EXTRA_CONFIRMATION';
      v_reasons := array_append(v_reasons, 'Single transfer of ' || p_qty || ' ' || v_asset_sym || ' meets or exceeds threshold limit of ' || v_threshold || ' ' || v_asset_sym || '.');
      IF v_rule_id IS NOT NULL THEN
        INSERT INTO risk_assessment_reason (assessment_id, rule_id, reason_text) VALUES (v_assessment_id, v_rule_id, 'Single transfer meets or exceeds threshold limit.') ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;

  UPDATE risk_assessment SET outcome = v_outcome WHERE risk_assessment.assessment_id = v_assessment_id;

  IF v_outcome <> 'REJECT' AND v_customer_id IS NOT NULL THEN
    INSERT INTO transfer_authorization (
      customer_id, sender_account, receiver_account, asset_id, quantity, assessment_id, outcome, expires_at
    ) VALUES (
      v_customer_id, p_sender, p_receiver, p_asset, p_qty, v_assessment_id, v_outcome, now() + INTERVAL '15 minutes'
    )
    RETURNING transfer_authorization.auth_token INTO v_auth_token;
  END IF;

  RETURN QUERY SELECT v_assessment_id, v_outcome, v_auth_token, v_reasons;
END;
$$;

CREATE OR REPLACE FUNCTION run_reconciliation()
RETURNS BIGINT LANGUAGE plpgsql AS $$
DECLARE
  v_run BIGINT;
  v_pairs INT;
  v_issues INT;
BEGIN
  INSERT INTO reconciliation_run (started_at) VALUES (now()) RETURNING run_id INTO v_run;

  SELECT count(*) INTO v_pairs FROM v_reconciliation;

  INSERT INTO reconciliation_issue (run_id, account_id, asset_id, holding_qty, ledger_qty, status)
  SELECT v_run, account_id, asset_id, holding_qty, ledger_qty, 'open'
    FROM v_reconciliation
   WHERE NOT matched;

  GET DIAGNOSTICS v_issues = ROW_COUNT;

  UPDATE reconciliation_run
     SET finished_at = now(),
         pairs_checked = v_pairs,
         issues_found = v_issues
   WHERE run_id = v_run;

  RETURN v_run;
END;
$$;

CREATE OR REPLACE FUNCTION reconcile_fix_issue(
  p_issue_id BIGINT,
  p_staff_id INT,
  p_note TEXT
)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
  v_rec RECORD;
  v_diff NUMERIC;
  v_adj_tx BIGINT;
BEGIN
  SELECT * INTO v_rec FROM reconciliation_issue WHERE issue_id = p_issue_id FOR UPDATE;
  IF v_rec.issue_id IS NULL THEN
    RAISE EXCEPTION 'Reconciliation issue % not found', p_issue_id;
  END IF;
  IF v_rec.status = 'resolved' THEN
    RAISE EXCEPTION 'Reconciliation issue % is already resolved', p_issue_id;
  END IF;

  v_diff := v_rec.holding_qty - v_rec.ledger_qty;

  IF v_diff <> 0 THEN

    INSERT INTO asset_transaction (sender_account, receiver_account, asset_id, quantity, type, status, completed_at, failure_reason)
    VALUES (
      (SELECT account_id FROM account WHERE is_system = true AND account_no = 'BB-TREASURY'),
      v_rec.account_id,
      v_rec.asset_id,
      ABS(v_diff),
      'allocation',
      'success',
      now(),
      NULL
    ) RETURNING transaction_id INTO v_adj_tx;

    INSERT INTO ledger_entry (transaction_id, account_id, asset_id, signed_quantity)
    VALUES (v_adj_tx, v_rec.account_id, v_rec.asset_id, v_diff);
  END IF;

  UPDATE reconciliation_issue
     SET status = 'resolved',
         resolution_note = p_note,
         resolved_at = now()
   WHERE issue_id = p_issue_id;

  INSERT INTO audit_log (actor, action, resource, new_value, at)
  VALUES (
    'staff:' || p_staff_id,
    'RECONCILIATION_CORRECTION',
    'issue:' || p_issue_id,
    jsonb_build_object(
      'account_id', v_rec.account_id,
      'asset_id', v_rec.asset_id,
      'adjustment_amount', v_diff,
      'note', p_note
    ),
    now()
  );

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION reserve_asset(
  p_account INT,
  p_asset INT,
  p_qty NUMERIC,
  p_txn_id BIGINT,
  p_duration_seconds INT DEFAULT 900
)
RETURNS BIGINT LANGUAGE plpgsql AS $$
DECLARE
  v_res_id BIGINT;
  v_bal NUMERIC;
  v_reserved NUMERIC;
BEGIN
  IF p_qty <= 0 THEN RAISE EXCEPTION 'Reservation quantity must be positive'; END IF;

  SELECT quantity INTO v_bal FROM holding WHERE account_id = p_account AND asset_id = p_asset FOR UPDATE;
  SELECT COALESCE(SUM(quantity), 0) INTO v_reserved
    FROM asset_reservation
   WHERE account_id = p_account AND asset_id = p_asset AND status = 'active' AND expires_at > now();

  IF COALESCE(v_bal, 0) - v_reserved < p_qty THEN
    RAISE EXCEPTION 'Insufficient balance to place reservation';
  END IF;

  INSERT INTO asset_reservation (account_id, asset_id, quantity, transaction_id, status, expires_at)
  VALUES (p_account, p_asset, p_qty, p_txn_id, 'active', now() + (p_duration_seconds || ' seconds')::INTERVAL)
  RETURNING reservation_id INTO v_res_id;

  RETURN v_res_id;
END;
$$;

CREATE OR REPLACE FUNCTION release_reservation(p_reservation_id BIGINT)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
BEGIN
  UPDATE asset_reservation
     SET status = 'released'
   WHERE reservation_id = p_reservation_id AND status = 'active';
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION consume_reservation(p_reservation_id BIGINT)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
BEGIN
  UPDATE asset_reservation
     SET status = 'consumed'
   WHERE reservation_id = p_reservation_id AND status = 'active';
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION expire_reservations()
RETURNS INT LANGUAGE plpgsql AS $$
DECLARE v_count INT;
BEGIN
  UPDATE asset_reservation
     SET status = 'expired'
   WHERE status = 'active' AND expires_at <= now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

COMMIT;
