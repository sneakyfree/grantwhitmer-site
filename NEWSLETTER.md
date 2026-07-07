# The Conductor's Brief — weekly newsletter runbook

Weekly dispatch on the Singularity: what happened as AI integrated deeper with
humanity, what it means for leaders and individuals, one concrete move to make.

## Infrastructure (all live)

- **Signup:** `#brief` section on grantwhitmer.com → `POST /api/subscribe`
  (Pages Function, `functions/api/subscribe.js`) → Resend audience + welcome email.
- **Resend audience:** `The Conductors Brief — grantwhitmer.com`,
  id `2f526951-242f-4c94-841d-b04a7e29ec42` (account grantwhitmer3@gmail.com, Pro plan).
- **API key:** `GrantWhitmerSite` (site backend; set as `RESEND_API_KEY` on the
  Pages project `grantwhitmer` — full value in the fleet lockbox / Resend dashboard).
- **Sender:** `Grant Whitmer <grant@grantwhitmer.com>` — domain verified in Resend.
- **Booking inquiries** use the same plumbing: `POST /api/inquire` → email to
  grant@windstorminstitute.org with reply-to set to the sender.

## Sending an issue (Resend Broadcasts)

1. Draft the issue (see cadence below). Keep it ~5 min read: 3 signal items,
   1 "what it means", 1 "do this with your agent this week".
2. Resend dashboard → Broadcasts → New broadcast → pick audience
   "The Conductors Brief", from `Grant Whitmer <grant@grantwhitmer.com>`.
   Broadcasts add the unsubscribe link automatically (required — keep it).
3. Or via API: `POST https://api.resend.com/broadcasts` with
   `{audience_id, from, subject, html}` then `POST /broadcasts/{id}/send`.

## Drafting cadence (Claude/Opus-assisted)

Weekly, same day each week. Suggested prompt shape for the drafting agent:
"Search the week's AI news; pick the 3 developments that most change how work
gets done for leaders/SMB companies (not model-benchmark noise). Write The
Conductor's Brief in Grant Whitmer's voice (plain-spoken, story-driven,
conducting-intelligence frame, no hype): ~600 words — 3 signals, what-it-means,
one concrete agent move for the week. Subject line < 50 chars."
Grant reviews/edits every issue before send — the voice is the product.

## Growth hooks (not yet built)

- Lead magnet: free chapter of *God Is a Vibe Coder* on signup.
- Archive page (`/brief/`) republishing past issues — SEO surface.
- Auto-cross-post to LinkedIn.
