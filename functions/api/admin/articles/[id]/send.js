// POST /api/admin/articles/:id/send — send an approved issue to the audience
// via a Resend Broadcast (Resend appends the required unsubscribe footer).

import { canApproveSend, audit, json, forbidden, bad, slugify } from "../../_lib.js";

export async function onRequestPost(context) {
  const { env, data, params } = context;
  if (!canApproveSend(data.user)) return forbidden("Only an admin can send an issue.");

  const a = await env.DB.prepare("SELECT * FROM articles WHERE id = ?1").bind(params.id).first();
  if (!a) return json({ ok: false, error: "Not found" }, 404);
  if (a.status === "sent") return bad("This issue was already sent.");
  if (a.status !== "approved") return bad("An issue must be approved before it can be sent.");

  const auth = { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" };

  // 1) create the broadcast against the audience
  const created = await fetch("https://api.resend.com/broadcasts", {
    method: "POST",
    headers: auth,
    body: JSON.stringify({
      audience_id: env.RESEND_AUDIENCE_ID,
      from: env.MAIL_FROM,
      reply_to: env.INQUIRY_TO,
      subject: a.subject,
      name: `The Windstorm #${a.id} — ${a.subject}`.slice(0, 200),
      html: a.body_html,
    }),
  });
  if (!created.ok) {
    console.log("broadcast create failed", created.status, await created.text());
    return json({ ok: false, error: "Couldn't create the broadcast in Resend." }, 500);
  }
  const broadcastId = (await created.json()).id;

  // 2) send it now
  const sent = await fetch(`https://api.resend.com/broadcasts/${broadcastId}/send`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({}),
  });
  if (!sent.ok) {
    console.log("broadcast send failed", sent.status, await sent.text());
    // record the broadcast id so it isn't orphaned/duplicated on retry
    await env.DB.prepare("UPDATE articles SET resend_broadcast_id = ?1 WHERE id = ?2")
      .bind(broadcastId, params.id).run();
    return json({ ok: false, error: "Broadcast created but sending failed — check Resend." }, 500);
  }

  const recip = await env.DB.prepare("SELECT COUNT(*) AS c FROM members WHERE status = 'active'").first();

  // sending also publishes the issue to the public /windstorm archive
  const slug = a.slug || slugify(a.subject, a.id);
  await env.DB.prepare(
    `UPDATE articles SET status = 'sent', sent_at = datetime('now'),
       recipient_count = ?1, resend_broadcast_id = ?2,
       slug = COALESCE(slug, ?3), published_at = COALESCE(published_at, datetime('now')),
       updated_at = datetime('now') WHERE id = ?4`
  ).bind(recip.c || 0, broadcastId, slug, params.id).run();

  await audit(env, data.user.email, "article.send", { id: a.id, broadcastId, recipients: recip.c || 0, slug });
  return json({ ok: true, sent: true, recipients: recip.c || 0, broadcastId, slug });
}
