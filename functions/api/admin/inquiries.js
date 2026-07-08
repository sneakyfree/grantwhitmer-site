// GET /api/admin/inquiries — booking-form submissions, newest first

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10) || 100, 500);

  const rows = await env.DB.prepare(
    `SELECT id, name, email, organization, engagement, message, status, created_at
     FROM inquiries ORDER BY created_at DESC, id DESC LIMIT ?`
  ).bind(limit).all();

  return Response.json({ ok: true, inquiries: rows.results });
}
