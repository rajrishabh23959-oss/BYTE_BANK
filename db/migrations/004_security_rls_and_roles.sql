
DO $$
BEGIN
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bytebank_admin') THEN
      CREATE ROLE bytebank_admin NOLOGIN;
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bytebank_auditor') THEN
      CREATE ROLE bytebank_auditor NOLOGIN;
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bytebank_customer') THEN
      CREATE ROLE bytebank_customer NOLOGIN;
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bytebank_app') THEN
      CREATE ROLE bytebank_app WITH LOGIN PASSWORD 'bytebank_secret_pw';
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    GRANT bytebank_admin TO bytebank_app;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    GRANT bytebank_auditor TO bytebank_app;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    GRANT bytebank_customer TO bytebank_app;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    GRANT postgres TO bytebank_app;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    EXECUTE format('GRANT bytebank_admin, bytebank_auditor, bytebank_customer TO %I', CURRENT_USER);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    GRANT USAGE ON SCHEMA public TO bytebank_admin, bytebank_auditor, bytebank_customer, bytebank_app;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

ALTER TABLE customer ENABLE ROW LEVEL SECURITY;
ALTER TABLE account ENABLE ROW LEVEL SECURITY;
ALTER TABLE holding ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_transaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entry ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_authorization ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_reservation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS customer_isolation_policy ON customer;
CREATE POLICY customer_isolation_policy ON customer
  FOR SELECT
  TO bytebank_customer
  USING (customer_id = NULLIF(current_setting('bytebank.current_customer_id', true), '')::INT);

DROP POLICY IF EXISTS account_isolation_policy ON account;
CREATE POLICY account_isolation_policy ON account
  FOR SELECT
  TO bytebank_customer
  USING (
    customer_id = NULLIF(current_setting('bytebank.current_customer_id', true), '')::INT
    OR is_system = true
  );

DROP POLICY IF EXISTS holding_isolation_policy ON holding;
CREATE POLICY holding_isolation_policy ON holding
  FOR SELECT
  TO bytebank_customer
  USING (
    account_id IN (
      SELECT account_id FROM account
      WHERE customer_id = NULLIF(current_setting('bytebank.current_customer_id', true), '')::INT
    )
  );

DROP POLICY IF EXISTS txn_isolation_policy ON asset_transaction;
CREATE POLICY txn_isolation_policy ON asset_transaction
  FOR SELECT
  TO bytebank_customer
  USING (
    sender_account IN (
      SELECT account_id FROM account
      WHERE customer_id = NULLIF(current_setting('bytebank.current_customer_id', true), '')::INT
    )
    OR receiver_account IN (
      SELECT account_id FROM account
      WHERE customer_id = NULLIF(current_setting('bytebank.current_customer_id', true), '')::INT
    )
  );

DROP POLICY IF EXISTS ledger_isolation_policy ON ledger_entry;
CREATE POLICY ledger_isolation_policy ON ledger_entry
  FOR SELECT
  TO bytebank_customer
  USING (
    account_id IN (
      SELECT account_id FROM account
      WHERE customer_id = NULLIF(current_setting('bytebank.current_customer_id', true), '')::INT
    )
  );

DROP POLICY IF EXISTS notif_isolation_policy ON notification;
CREATE POLICY notif_isolation_policy ON notification
  FOR ALL
  TO bytebank_customer
  USING (customer_id = NULLIF(current_setting('bytebank.current_customer_id', true), '')::INT)
  WITH CHECK (customer_id = NULLIF(current_setting('bytebank.current_customer_id', true), '')::INT);

DROP POLICY IF EXISTS transfer_request_policy ON transfer_request;
CREATE POLICY transfer_request_policy ON transfer_request
  FOR ALL
  TO bytebank_customer
  USING (customer_id = NULLIF(current_setting('bytebank.current_customer_id', true), '')::INT)
  WITH CHECK (customer_id = NULLIF(current_setting('bytebank.current_customer_id', true), '')::INT);

DROP POLICY IF EXISTS auth_token_policy ON transfer_authorization;
CREATE POLICY auth_token_policy ON transfer_authorization
  FOR SELECT
  TO bytebank_customer
  USING (customer_id = NULLIF(current_setting('bytebank.current_customer_id', true), '')::INT);

DROP POLICY IF EXISTS admin_customer_policy ON customer;
CREATE POLICY admin_customer_policy ON customer FOR ALL TO bytebank_admin USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_account_policy ON account;
CREATE POLICY admin_account_policy ON account FOR ALL TO bytebank_admin USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_holding_policy ON holding;
CREATE POLICY admin_holding_policy ON holding FOR ALL TO bytebank_admin USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_txn_policy ON asset_transaction;
CREATE POLICY admin_txn_policy ON asset_transaction FOR ALL TO bytebank_admin USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_ledger_policy ON ledger_entry;
CREATE POLICY admin_ledger_policy ON ledger_entry FOR SELECT TO bytebank_admin USING (true);

DROP POLICY IF EXISTS admin_notif_policy ON notification;
CREATE POLICY admin_notif_policy ON notification FOR ALL TO bytebank_admin USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS auditor_txn_policy ON asset_transaction;
CREATE POLICY auditor_txn_policy ON asset_transaction FOR SELECT TO bytebank_auditor USING (true);

DROP POLICY IF EXISTS auditor_ledger_policy ON ledger_entry;
CREATE POLICY auditor_ledger_policy ON ledger_entry FOR SELECT TO bytebank_auditor USING (true);

GRANT SELECT ON asset TO bytebank_customer, bytebank_auditor, bytebank_admin, bytebank_app;
GRANT INSERT, UPDATE ON asset TO bytebank_admin, bytebank_app;

GRANT SELECT ON customer TO bytebank_customer, bytebank_admin, bytebank_app;
GRANT UPDATE (kyc_status) ON customer TO bytebank_admin, bytebank_app;

GRANT SELECT ON account, holding TO bytebank_customer, bytebank_admin, bytebank_app;
GRANT UPDATE (status) ON account TO bytebank_admin, bytebank_app;

GRANT SELECT ON asset_transaction, ledger_entry TO bytebank_customer, bytebank_admin, bytebank_auditor, bytebank_app;

GRANT SELECT ON v_auditor_transactions, v_failed_by_month, v_reconciliation, v_available_quantity, v_portfolio_valuation, v_customer_statement TO bytebank_admin, bytebank_auditor, bytebank_app;
GRANT SELECT ON v_available_quantity, v_portfolio_valuation, v_customer_statement TO bytebank_customer;

GRANT SELECT, INSERT ON audit_log TO bytebank_admin, bytebank_auditor, bytebank_app;
GRANT SELECT, INSERT ON access_log TO bytebank_admin, bytebank_auditor, bytebank_app;

GRANT SELECT, INSERT, UPDATE ON reconciliation_run, reconciliation_issue TO bytebank_admin, bytebank_auditor, bytebank_app;

GRANT SELECT, INSERT, UPDATE ON notification, transfer_request, transfer_authorization, asset_reservation TO bytebank_customer, bytebank_admin, bytebank_app;

GRANT SELECT, INSERT, UPDATE ON app_user TO bytebank_app, bytebank_admin;
GRANT SELECT ON staff TO bytebank_admin, bytebank_auditor, bytebank_app;
GRANT SELECT ON risk_rule, risk_assessment, risk_assessment_reason TO bytebank_customer, bytebank_admin, bytebank_auditor, bytebank_app;

GRANT EXECUTE ON FUNCTION transfer_assets(INT, INT, INT, NUMERIC, UUID) TO bytebank_customer, bytebank_admin, bytebank_app;
GRANT EXECUTE ON FUNCTION simulated_swap(INT, INT, INT, NUMERIC) TO bytebank_customer, bytebank_admin, bytebank_app;
GRANT EXECUTE ON FUNCTION assess_transfer_risk(INT, INT, INT, NUMERIC) TO bytebank_customer, bytebank_admin, bytebank_app;
GRANT EXECUTE ON FUNCTION run_reconciliation() TO bytebank_admin, bytebank_app;
GRANT EXECUTE ON FUNCTION reconcile_fix_issue(BIGINT, INT, TEXT) TO bytebank_admin, bytebank_app;
GRANT EXECUTE ON FUNCTION reserve_asset(INT, INT, NUMERIC, BIGINT, INT) TO bytebank_customer, bytebank_admin, bytebank_app;
GRANT EXECUTE ON FUNCTION release_reservation(BIGINT) TO bytebank_customer, bytebank_admin, bytebank_app;
GRANT EXECUTE ON FUNCTION consume_reservation(BIGINT) TO bytebank_customer, bytebank_admin, bytebank_app;
GRANT EXECUTE ON FUNCTION expire_reservations() TO bytebank_admin, bytebank_app;

DO $$
BEGIN
  BEGIN
    GRANT ALL ON ALL TABLES IN SCHEMA public TO bytebank_app;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO bytebank_app;
    GRANT ALL ON ALL ROUTINES IN SCHEMA public TO bytebank_app;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;
