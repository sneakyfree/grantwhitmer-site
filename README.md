# grantwhitmer.com

Personal / professional site for Grant Lavell Whitmer III — AI integration consultant,
"conducting intelligence" boot-camp instructor, author, and founder of The Windstorm Institute.

Static site (HTML/CSS/JS, no build step). Public — no access gate.

## Deploy

Push to `main` → GitHub Actions → Cloudflare Pages project `grantwhitmer` → grantwhitmer.com.
Never run `wrangler pages deploy` locally (drifts the live bundle from git).

- CF account: `193b347aedeaafe35de0b5a534b2d9aa`
- Repo secret required: `CF_API_TOKEN`
- Custom domains: `grantwhitmer.com`, `www.grantwhitmer.com`

## Assets to swap in (placeholders live in `/assets`)

- `assets/grant-portrait.jpg` — hero portrait (B&W or duotone works best with the palette)
- Book cover images in `assets/books/` + live Amazon links in `index.html` (search "AMAZON_LINK")
- Boot-camp / talk photos for the galleries when available

## Booking & newsletter backend

- 1:1 coaching → Calendly inline embed (`grantwhitmer/30min`)
- Speaking / corporate / boot camps → inquiry form → `POST /api/inquire`
  (Pages Function → Resend email to grant@grantwhitmer.com)
- The Windstorm signup (newsletter, formerly The Conductor's Brief) →
  `POST /api/subscribe` (Pages Function → D1 members w/ source+country →
  Resend audience + welcome email). See `NEWSLETTER.md` for the full runbook.
- The public archive MOVED to thewindstorm.ai/archive (2026-07-10); /brief/* and
  /windstorm/* here 301 there via `_redirects`. The cockpit at /admin still
  drafts/approves/sends everything — same D1, new public home.
- Pages project env vars (set in CF, both prod + preview): `RESEND_API_KEY`,
  `RESEND_AUDIENCE_ID`, `INQUIRY_TO`, `MAIL_FROM`.
- Analytics: Cloudflare Web Analytics beacon (token in `index.html`).

## Adding a platform to the Shipping Log

`index.html` → search `PLATFORM LEDGER` → copy one `ledger-row` block, edit the
three fields (name, one-liner, domain), newest at top. Bump the `style.css?v=`
stamp only if CSS changed. Commit → push → manual wrangler deploy (Actions is
billing-locked).
