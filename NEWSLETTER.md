# The Windstorm — weekly newsletter runbook

The weekly dispatch from the eye of the storm (formerly *The Conductor's Brief*,
renamed 2026-07-10 before issue #1 shipped): what happened as AI integrated
deeper with humanity, what it means for leaders and individuals, one concrete
move to make. "The Windstorm" is the master media brand — this list is THE list
for the whole ecosystem (grantwhitmer.com, windstorminstitute.org,
windstormlabs.com, windyword.ai, books' QR codes, future thewindstorm.ai).

## Infrastructure (all live)

- **Signup:** `#windstorm` section on grantwhitmer.com → `POST /api/subscribe`
  (Pages Function, `functions/api/subscribe.js`) → D1 `members` (with `source` +
  `country` stamped from CF-IPCountry) → Resend audience + welcome email.
  Forms on other properties post the same endpoint with a `source` field.
- **Resend audience:** `The Conductors Brief — grantwhitmer.com` (internal label
  kept — Resend audiences can't be renamed), id `2f526951-242f-4c94-841d-b04a7e29ec42`
  (account grantwhitmer3@gmail.com, Pro plan).
- **API key:** `GrantWhitmerSiteV2` (full-access; set as `RESEND_API_KEY` on the
  Pages project `grantwhitmer` — full value in the fleet lockbox / Resend dashboard).
- **Sender:** `The Windstorm <grant@grantwhitmer.com>` — domain verified in Resend
  (`MAIL_FROM` env var on the Pages project).
- **Booking inquiries** use the same plumbing: `POST /api/inquire` → email to
  grant@windstorminstitute.org with reply-to set to the sender.

## Sending an issue

Use the cockpit: grantwhitmer.com/admin → The Windstorm → review the pending
draft → Send. Sending emails the audience via Resend Broadcasts (unsubscribe
link added automatically) AND auto-publishes the issue to /windstorm.

## Drafting cadence (agent-drafted, Grant-approved)

A scheduled cloud routine drafts every Monday and inserts the issue as
status='pending' into D1 (see `db/brief-writer-routine.md` — source of truth
for the routine prompt, incl. "The Eye" signature segment). It never sends;
Grant reviews/edits every issue in the cockpit — the voice is the product.

## Growth hooks

- Windy Word is the lead magnet: join The Windstorm → free download at
  windyword.ai (welcome email carries the link; windyword.ai owns delivery).
- Archive at `/windstorm` (+ RSS `/windstorm/feed.xml`) — old `/brief/*` URLs
  301-redirect via `_redirects`.
- Social copy per issue via the cockpit's "Publish & share" panel.
