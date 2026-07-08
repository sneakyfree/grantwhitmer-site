-- grantwhitmer.com admin platform — D1 schema (source of truth for the community)
-- Apply:  npx wrangler d1 execute grantwhitmer-admin --remote --file=db/schema.sql

-- Community members (newsletter subscribers today; more sources later)
CREATE TABLE IF NOT EXISTS members (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  email             TEXT NOT NULL UNIQUE,
  status            TEXT NOT NULL DEFAULT 'active',      -- active | unsubscribed
  source            TEXT DEFAULT 'newsletter',           -- signup origin
  tags              TEXT,                                 -- JSON array (optional)
  notes             TEXT,                                 -- admin-only freeform
  resend_contact_id TEXT,
  ww_entitlement    TEXT,                                 -- Phase 3: null | code | 'granted'
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_members_created ON members(created_at);
CREATE INDEX IF NOT EXISTS idx_members_status  ON members(status);

-- Booking-form inquiries (cockpit CRM-lite; also still emailed to Grant)
CREATE TABLE IF NOT EXISTS inquiries (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  organization    TEXT,
  engagement      TEXT,
  message         TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'new',            -- new | replied | archived
  resend_email_id TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(created_at);

-- Who may enter the cockpit, and at what role
CREATE TABLE IF NOT EXISTS admins (
  email      TEXT PRIMARY KEY,
  role       TEXT NOT NULL DEFAULT 'viewer',              -- super_admin | admin | manager | viewer
  name       TEXT,
  granted_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Every sensitive admin action, for accountability
CREATE TABLE IF NOT EXISTS audit_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_email TEXT NOT NULL,
  action      TEXT NOT NULL,
  detail      TEXT,                                        -- JSON
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);

-- Seed: Grant as super admin (both known login emails)
INSERT OR IGNORE INTO admins (email, role, name, granted_by) VALUES
  ('grantwhitmer3@gmail.com',  'super_admin', 'Grant Whitmer', 'system'),
  ('johnsmithkit05@gmail.com', 'super_admin', 'Grant Whitmer', 'system');

-- Backfill the one existing real subscriber (Grant's test signup, kept as #1)
INSERT OR IGNORE INTO members (email, source, status) VALUES
  ('johnsmithkit05@gmail.com', 'newsletter', 'active');
