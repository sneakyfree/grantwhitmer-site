// /api/admin/articles — The Windstorm issues
//   GET   list issues (newest first)
//   POST  create a draft {subject, preview, body_html}

import { canDraft, audit, json, forbidden, bad } from "./_lib.js";

export async function onRequestGet(context) {
  const { env } = context;
  const rows = await env.DB.prepare(
    `SELECT id, subject, preview, status, type, slug, published_at, created_by, approved_by,
            approved_at, sent_at, recipient_count, created_at, updated_at
     FROM articles ORDER BY created_at DESC, id DESC`
  ).all();
  return json({ ok: true, articles: rows.results });
}

export async function onRequestPost(context) {
  const { request, env, data } = context;
  if (!canDraft(data.user)) return forbidden("You don't have permission to draft issues.");

  let body;
  try { body = await request.json(); } catch { return bad("Invalid JSON."); }
  const subject = (body.subject || "").trim().slice(0, 200);
  const preview = (body.preview || "").trim().slice(0, 200) || null;
  const html = (body.body_html || "").trim();
  const type = body.type === "essay" ? "essay" : "brief";
  if (!subject) return bad("A subject line is required.");
  if (!html) return bad("The issue body can't be empty.");

  const res = await env.DB.prepare(
    `INSERT INTO articles (subject, preview, body_html, status, created_by, type)
     VALUES (?1, ?2, ?3, 'draft', ?4, ?5)`
  ).bind(subject, preview, html, data.user.email, type).run();

  const id = res.meta.last_row_id;
  await audit(env, data.user.email, "article.create", { id, subject, type });
  return json({ ok: true, id });
}
