-- 005 — show-notes fields: each issue page doubles as its episode's page
-- Apply:  npx wrangler d1 execute grantwhitmer-admin --remote --file=db/migrations/005_show_notes.sql
ALTER TABLE articles ADD COLUMN episode_url TEXT;   -- YouTube URL, pasted after upload
ALTER TABLE articles ADD COLUMN transcript  TEXT;   -- full episode transcript (Windy Word)
