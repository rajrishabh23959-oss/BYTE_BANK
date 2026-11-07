
BEGIN;

CREATE TYPE kyc_status_t AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE acct_status_t AS ENUM ('active', 'frozen');
CREATE TYPE asset_type_t AS ENUM ('crypto', 'stock');
CREATE TYPE txn_type_t AS ENUM ('allocation', 'buy', 'sell', 'transfer');
CREATE TYPE txn_status_t AS ENUM ('pending', 'success', 'failed', 'rejected');
CREATE TYPE staff_role_t AS ENUM ('ADMIN', 'AUDITOR');
CREATE TYPE outcome_t AS ENUM ('ALLOW', 'REQUIRE_EXTRA_CONFIRMATION', 'REJECT');
CREATE TYPE reservation_status_t AS ENUM ('active', 'consumed', 'released', 'expired');
CREATE TYPE reconciliation_status_t AS ENUM ('open', 'investigating', 'resolved');

CREATE TABLE customer (
  customer_id     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name       TEXT NOT NULL,
  phone           TEXT NOT NULL UNIQUE,
  email           TEXT NOT NULL UNIQUE,
  address         TEXT NOT NULL,
  date_of_birth   DATE NOT NULL,
  id_proof_hash   TEXT NOT NULL,
  id_proof_last4  CHAR(4) NOT NULL,
  kyc_status      kyc_status_t NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE staff (
  staff_id        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  role            staff_role_t NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE app_user (
  user_id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username        TEXT NOT NULL UNIQUE,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('CUSTOMER', 'ADMIN', 'AUDITOR')),
  customer_id     INT UNIQUE REFERENCES customer(customer_id) ON DELETE CASCADE,
  staff_id        INT UNIQUE REFERENCES staff(staff_id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (role = 'CUSTOMER' AND customer_id IS NOT NULL AND staff_id IS NULL) OR
    (role IN ('ADMIN', 'AUDITOR') AND staff_id IS NOT NULL AND customer_id IS NULL)
  )
);

CREATE TABLE account (
  account_id      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_no      TEXT NOT NULL UNIQUE,
  customer_id     INT UNIQUE REFERENCES customer(customer_id),
  is_system       BOOLEAN NOT NULL DEFAULT false,
  account_type    TEXT NOT NULL DEFAULT 'standard',
  status          acct_status_t NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((is_system AND customer_id IS NULL) OR (NOT is_system AND customer_id IS NOT NULL))
);

CREATE TABLE asset (
  asset_id         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name             TEXT NOT NULL,
  symbol           TEXT NOT NULL UNIQUE,
  type             asset_type_t NOT NULL,
  quantity_scale   SMALLINT NOT NULL CHECK (quantity_scale BETWEEN 0 AND 18),
  sim_ref_price    NUMERIC(24,8) NOT NULL CHECK (sim_ref_price > 0),
  price_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE holding (
  account_id       INT NOT NULL REFERENCES account(account_id) ON DELETE RESTRICT,
  asset_id         INT NOT NULL REFERENCES asset(asset_id) ON DELETE RESTRICT,
  quantity         NUMERIC(38,18) NOT NULL CHECK (quantity >= 0),
  PRIMARY KEY (account_id, asset_id)
);

CREATE TABLE asset_transaction (
  transaction_id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sender_account   INT REFERENCES account(account_id) ON DELETE RESTRICT,
  receiver_account INT NOT NULL REFERENCES account(account_id) ON DELETE RESTRICT,
  asset_id         INT NOT NULL REFERENCES asset(asset_id) ON DELETE RESTRICT,
  quantity         NUMERIC(38,18) NOT NULL CHECK (quantity > 0),
  type             txn_type_t NOT NULL,
  status           txn_status_t NOT NULL,
  failure_reason   TEXT,
  swap_group       UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at     TIMESTAMPTZ,
  CHECK (sender_account IS DISTINCT FROM receiver_account),
  CHECK ((status IN ('failed','rejected')) = (failure_reason IS NOT NULL))
);

CREATE TABLE ledger_entry (
  entry_id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  transaction_id       BIGINT NOT NULL REFERENCES asset_transaction(transaction_id) ON DELETE RESTRICT,
  account_id           INT NOT NULL REFERENCES account(account_id) ON DELETE RESTRICT,
  asset_id             INT NOT NULL REFERENCES asset(asset_id) ON DELETE RESTRICT,
  signed_quantity      NUMERIC(38,18) NOT NULL CHECK (signed_quantity <> 0),
  posted_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  reversal_of_entry_id BIGINT REFERENCES ledger_entry(entry_id) ON DELETE RESTRICT
);

CREATE TABLE transfer_request (
  request_id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id         INT NOT NULL REFERENCES customer(customer_id) ON DELETE RESTRICT,
  idempotency_key     TEXT NOT NULL,
  request_fingerprint TEXT NOT NULL,
  transaction_id      BIGINT REFERENCES asset_transaction(transaction_id) ON DELETE SET NULL,
  request_status      TEXT NOT NULL CHECK (request_status IN ('in_progress','completed','failed')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at        TIMESTAMPTZ,
  UNIQUE (customer_id, idempotency_key)
);

CREATE TABLE risk_rule (
  rule_id     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code        TEXT NOT NULL,
  version     INT NOT NULL,
  outcome     outcome_t NOT NULL,
  params      JSONB NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  active      BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (code, version)
);

CREATE TABLE risk_assessment (
  assessment_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id      INT REFERENCES customer(customer_id) ON DELETE SET NULL,
  sender_account   INT REFERENCES account(account_id) ON DELETE SET NULL,
  receiver_account INT REFERENCES account(account_id) ON DELETE SET NULL,
  asset_id         INT REFERENCES asset(asset_id) ON DELETE SET NULL,
  quantity         NUMERIC(38,18) NOT NULL CHECK (quantity > 0),
  outcome          outcome_t NOT NULL,
  assessed_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE risk_assessment_reason (
  assessment_id BIGINT NOT NULL REFERENCES risk_assessment(assessment_id) ON DELETE CASCADE,
  rule_id       INT NOT NULL REFERENCES risk_rule(rule_id) ON DELETE RESTRICT,
  reason_text   TEXT NOT NULL,
  PRIMARY KEY (assessment_id, rule_id)
);

CREATE TABLE transfer_authorization (
  auth_token       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id      INT NOT NULL REFERENCES customer(customer_id) ON DELETE RESTRICT,
  sender_account   INT NOT NULL REFERENCES account(account_id) ON DELETE RESTRICT,
  receiver_account INT NOT NULL REFERENCES account(account_id) ON DELETE RESTRICT,
  asset_id         INT NOT NULL REFERENCES asset(asset_id) ON DELETE RESTRICT,
  quantity         NUMERIC(38,18) NOT NULL CHECK (quantity > 0),
  assessment_id    BIGINT REFERENCES risk_assessment(assessment_id) ON DELETE SET NULL,
  outcome          outcome_t NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at       TIMESTAMPTZ NOT NULL,
  consumed_at      TIMESTAMPTZ,
  is_valid         BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE asset_reservation (
  reservation_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id     INT NOT NULL REFERENCES account(account_id) ON DELETE RESTRICT,
  asset_id       INT NOT NULL REFERENCES asset(asset_id) ON DELETE RESTRICT,
  quantity       NUMERIC(38,18) NOT NULL CHECK (quantity > 0),
  transaction_id BIGINT REFERENCES asset_transaction(transaction_id) ON DELETE SET NULL,
  status         reservation_status_t NOT NULL DEFAULT 'active',
  expires_at     TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
  log_id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor       TEXT NOT NULL,
  action      TEXT NOT NULL,
  resource    TEXT NOT NULL,
  old_value   JSONB,
  new_value   JSONB,
  at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_ref TEXT
);

CREATE TABLE access_log (
  access_id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  staff_id      INT NOT NULL REFERENCES staff(staff_id) ON DELETE RESTRICT,
  resource_id   TEXT NOT NULL,
  data_category TEXT NOT NULL,
  purpose_code  TEXT NOT NULL,
  accessed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_ref   TEXT
);

CREATE TABLE reconciliation_run (
  run_id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at   TIMESTAMPTZ,
  pairs_checked INT,
  issues_found  INT
);

CREATE TABLE reconciliation_issue (
  issue_id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  run_id          BIGINT NOT NULL REFERENCES reconciliation_run(run_id) ON DELETE CASCADE,
  account_id      INT NOT NULL REFERENCES account(account_id) ON DELETE RESTRICT,
  asset_id        INT NOT NULL REFERENCES asset(asset_id) ON DELETE RESTRICT,
  holding_qty     NUMERIC(38,18) NOT NULL,
  ledger_qty      NUMERIC(38,18) NOT NULL,
  status          reconciliation_status_t NOT NULL DEFAULT 'open',
  resolution_note TEXT,
  resolved_at     TIMESTAMPTZ
);

CREATE TABLE notification (
  notification_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id     INT NOT NULL REFERENCES customer(customer_id) ON DELETE CASCADE,
  type            TEXT NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_txn_sender           ON asset_transaction (sender_account, created_at DESC);
CREATE INDEX ix_txn_receiver         ON asset_transaction (receiver_account, created_at DESC);
CREATE INDEX ix_txn_status           ON asset_transaction (status, created_at);
CREATE INDEX ix_txn_swap_group       ON asset_transaction (swap_group) WHERE swap_group IS NOT NULL;
CREATE INDEX ix_ledger_acct_asset    ON ledger_entry (account_id, asset_id);
CREATE INDEX ix_ledger_txn           ON ledger_entry (transaction_id);
CREATE INDEX ix_res_active           ON asset_reservation (account_id, asset_id, status) WHERE status = 'active';
CREATE INDEX ix_idemp_lookup         ON transfer_request (customer_id, idempotency_key);
CREATE INDEX ix_audit_actor_time     ON audit_log (actor, at DESC);
CREATE INDEX ix_audit_resource_time  ON audit_log (resource, at DESC);
CREATE INDEX ix_access_staff_time    ON access_log (staff_id, accessed_at DESC);
CREATE INDEX ix_notif_customer_unread ON notification (customer_id, read_at) WHERE read_at IS NULL;
CREATE INDEX ix_auth_token_active    ON transfer_authorization (auth_token) WHERE is_valid = true;

COMMIT;
