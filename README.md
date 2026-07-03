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

## Booking

- 1:1 coaching → Calendly inline embed (`grantwhitmer/30min`)
- Speaking / corporate / boot camps → inquiry form (see `js/main.js` for the submit target)
