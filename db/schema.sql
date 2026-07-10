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

-- The Windstorm — newsletter issues through their review lifecycle
CREATE TABLE IF NOT EXISTS articles (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  subject             TEXT NOT NULL,
  preview             TEXT,                                -- inbox preheader
  body_html           TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'draft',       -- draft | pending | approved | sent
  created_by          TEXT,
  approved_by         TEXT,
  approved_at         TEXT,
  sent_at             TEXT,
  recipient_count     INTEGER,
  resend_broadcast_id TEXT,
  -- web-publishing + social. A row with published_at set is live on /windstorm.
  type                TEXT NOT NULL DEFAULT 'brief',           -- brief | essay
  slug                TEXT,
  published_at        TEXT,
  social_linkedin     TEXT,
  social_x            TEXT,
  social_facebook     TEXT,
  podcast_outline     TEXT,                                 -- riffable show rundown per issue
  episode_url         TEXT,                                 -- YouTube URL -> embed on the public page
  transcript          TEXT,                                 -- episode transcript (public, collapsible)
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_articles_status  ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_created ON articles(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_articles_published   ON articles(published_at);

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
