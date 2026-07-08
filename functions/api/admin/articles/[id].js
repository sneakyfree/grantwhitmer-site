// /api/admin/articles/:id
//   GET     full issue
//   PATCH   edit content, or transition status (submit / approve / return to draft)
//   DELETE  discard (never a sent issue)

import { canDraft, canApproveSend, audit, json, forbidden, bad, slugify } from "../_lib.js";

async function load(env, id) {
  return env.DB.prepare("SELECT * FROM articles WHERE id = ?1").bind(id).first();
}

export async function onRequestGet(context) {
  const { env, params } = context;
  const a = await load(env, params.id);
  if (!a) return json({ ok: false, error: "Not found" }, 404);
  return json({ ok: true, article: a });
}

export async function onRequestPatch(context) {
  const { request, env, data, params } = context;
  const a = await load(env, params.id);
  if (!a) return json({ ok: false, error: "Not found" }, 404);

  let body;
  try { body = await request.json(); } catch { return bad("Invalid JSON."); }

  // 1) content edits (drafters+). Blocked once a brief has been emailed —
  //    social copy + publish state stay editable below regardless.
  const fields = [];
  const binds = [];
  const wantsContent = ["subject", "preview", "body_html", "type"].some((k) => typeof body[k] === "string");
  if (wantsContent && a.status === "sent")
    return bad("This issue was already emailed; its content can't be changed. (Social copy and publishing still can.)");
  if (typeof body.subject === "string") { fields.push("subject = ?"); binds.push(body.subject.trim().slice(0, 200)); }
  if (typeof body.preview === "string") { fields.push("preview = ?"); binds.push(body.preview.trim().slice(0, 200) || null); }
  if (typeof body.body_html === "string") { fields.push("body_html = ?"); binds.push(body.body_html.trim()); }
  if (typeof body.type === "string" && ["brief", "essay"].includes(body.type)) { fields.push("type = ?"); binds.push(body.type); }
  // social copy (drafters+, editable any time)
  for (const k of ["social_linkedin", "social_x", "social_facebook"]) {
    if (typeof body[k] === "string") { fields.push(`${k} = ?`); binds.push(body[k].trim().slice(0, 4000) || null); }
  }
  if (fields.length) {
    if (!canDraft(data.user)) return forbidden("You don't have permission to edit issues.");
    fields.push("updated_at = datetime('now')");
    await env.DB.prepare(`UPDATE articles SET ${fields.join(", ")} WHERE id = ?`).bind(...binds, params.id).run();
    await audit(env, data.user.email, "article.edit", { id: a.id });
  }

  // publish / unpublish to the /brief archive (admins) — independent of email send
  if (typeof body.publish === "boolean") {
    if (!canApproveSend(data.user)) return forbidden("Only an admin can publish.");
    if (body.publish) {
      const slug = a.slug || slugify(a.subject, a.id);
      await env.DB.prepare(
        "UPDATE articles SET published_at = COALESCE(published_at, datetime('now')), slug = COALESCE(slug, ?1), updated_at = datetime('now') WHERE id = ?2"
      ).bind(slug, params.id).run();
      await audit(env, data.user.email, "article.publish", { id: a.id, slug });
    } else {
      await env.DB.prepare("UPDATE articles SET published_at = NULL, updated_at = datetime('now') WHERE id = ?1").bind(params.id).run();
      await audit(env, data.user.email, "article.unpublish", { id: a.id });
    }
  }

  // 2) status transition
  if (typeof body.status === "string" && body.status !== a.status) {
    if (a.status === "sent") return bad("A sent issue can't change status.");
    const to = body.status;
    if (to === "pending" || to === "draft") {
      if (!canDraft(data.user)) return forbidden("You don't have permission.");
      await env.DB.prepare("UPDATE articles SET status = ?1, updated_at = datetime('now') WHERE id = ?2")
        .bind(to, params.id).run();
      await audit(env, data.user.email, "article.status", { id: a.id, to });
    } else if (to === "approved") {
      if (!canApproveSend(data.user)) return forbidden("Only an admin can approve an issue.");
      await env.DB.prepare(
        "UPDATE articles SET status = 'approved', approved_by = ?1, approved_at = datetime('now'), updated_at = datetime('now') WHERE id = ?2"
      ).bind(data.user.email, params.id).run();
      await audit(env, data.user.email, "article.approve", { id: a.id });
    } else {
      return bad("Unknown status transition.");
    }
  }

  return json({ ok: true, article: await load(env, params.id) });
}

export async function onRequestDelete(context) {
  const { env, data, params } = context;
  const a = await load(env, params.id);
  if (!a) return json({ ok: false, error: "Not found" }, 404);
  if (a.status === "sent") return bad("A sent issue can't be deleted.");
  if (!canApproveSend(data.user)) return forbidden("Only an admin can discard an issue.");
  await env.DB.prepare("DELETE FROM articles WHERE id = ?1").bind(params.id).run();
  await audit(env, data.user.email, "article.delete", { id: a.id, subject: a.subject });
  return json({ ok: true, deleted: a.id });
}
