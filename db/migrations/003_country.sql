-- 003 — stamp each member with signup country (from Cloudflare's CF-IPCountry header)
-- Apply:  npx wrangler d1 execute grantwhitmer-admin --remote --file=db/migrations/003_country.sql
ALTER TABLE members ADD COLUMN country TEXT;
