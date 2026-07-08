// GET /api/admin/members — list members (JSON) or export (?format=csv)
//   ?q=<search>  ?status=active|unsubscribed  ?limit=  ?offset=

function csvCell(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const status = url.searchParams.get("status");
  const format = url.searchParams.get("format");

  const where = [];
  const binds = [];
  if (q) { where.push("LOWER(email) LIKE ?"); binds.push(`%${q}%`); }
  if (status === "active" || status === "unsubscribed") { where.push("status = ?"); binds.push(status); }
  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

  if (format === "csv") {
    const rows = await env.DB.prepare(
      `SELECT email, status, source, ww_entitlement, created_at
       FROM members ${whereSQL} ORDER BY created_at ASC, id ASC`
    ).bind(...binds).all();
    const header = ["email", "status", "source", "windy_word", "joined"];
    const lines = [header.join(",")];
    for (const r of rows.results) {
      lines.push([r.email, r.status, r.source, r.ww_entitlement || "", r.created_at].map(csvCell).join(","));
    }
    return new Response(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="conductors-brief-members.csv"`,
      },
    });
  }

  const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10) || 100, 500);
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10) || 0, 0);

  const [rows, total] = await Promise.all([
    env.DB.prepare(
      `SELECT id, email, status, source, tags, ww_entitlement, created_at
       FROM members ${whereSQL} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`
    ).bind(...binds, limit, offset).all(),
    env.DB.prepare(`SELECT COUNT(*) AS c FROM members ${whereSQL}`).bind(...binds).first(),
  ]);

  return Response.json({ ok: true, total: total.c || 0, limit, offset, members: rows.results });
}
