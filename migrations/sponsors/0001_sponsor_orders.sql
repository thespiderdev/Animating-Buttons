CREATE TABLE sponsor_orders (
  claim_hash TEXT PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('live', 'test')),
  accepted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  payment_id TEXT UNIQUE,
  brand TEXT,
  website TEXT,
  logo TEXT,
  submitted_at TEXT
);
