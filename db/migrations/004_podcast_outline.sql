-- 004 — per-issue podcast outline (riffable show rundown, drafted by the routine)
-- Apply:  npx wrangler d1 execute grantwhitmer-admin --remote --file=db/migrations/004_podcast_outline.sql
ALTER TABLE articles ADD COLUMN podcast_outline TEXT;
