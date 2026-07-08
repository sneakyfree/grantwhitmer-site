-- Migration 002 — web-publishing + social columns on articles (2026-07-08).
-- Applied to the existing prod DB (schema.sql already has these inline for fresh installs).
--   npx wrangler d1 execute grantwhitmer-admin --remote --file=db/migrations/002_web_social.sql
ALTER TABLE articles ADD COLUMN type            TEXT NOT NULL DEFAULT 'brief';
ALTER TABLE articles ADD COLUMN slug            TEXT;
ALTER TABLE articles ADD COLUMN published_at    TEXT;
ALTER TABLE articles ADD COLUMN social_linkedin TEXT;
ALTER TABLE articles ADD COLUMN social_x        TEXT;
ALTER TABLE articles ADD COLUMN social_facebook TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_articles_published   ON articles(published_at);
