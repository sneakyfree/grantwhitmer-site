// GET /api/admin/stats — cockpit summary (counts, growth series, recent activity)

export async function onRequestGet(context) {
  const { env, data } = context;
  const db = env.DB;

  const [counts, recentMembers, recentInquiries, growth, inqCounts, adminCount, articleCounts] = await Promise.all([
    db.prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active,
         SUM(CASE WHEN status='unsubscribed' THEN 1 ELSE 0 END) AS unsubscribed,
         SUM(CASE WHEN created_at >= datetime('now','-7 days')  THEN 1 ELSE 0 END) AS last7,
         SUM(CASE WHEN created_at >= datetime('now','-30 days') THEN 1 ELSE 0 END) AS last30
       FROM members`
    ).first(),
    db.prepare(
      `SELECT email, source, status, created_at FROM members ORDER BY created_at DESC, id DESC LIMIT 8`
    ).all(),
    db.prepare(
      `SELECT id, name, email, organization, engagement, status, created_at
       FROM inquiries ORDER BY created_at DESC, id DESC LIMIT 8`
    ).all(),
    db.prepare(
      `SELECT date(created_at) AS d, COUNT(*) AS c
       FROM members WHERE created_at >= datetime('now','-13 days')
       GROUP BY date(created_at)`
    ).all(),
    db.prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status='new' THEN 1 ELSE 0 END) AS unread
       FROM inquiries`
    ).first(),
    db.prepare(`SELECT COUNT(*) AS c FROM admins`).first(),
    db.prepare(
      `SELECT
         SUM(CASE WHEN status IN ('draft','pending','approved') THEN 1 ELSE 0 END) AS open,
         SUM(CASE WHEN status='pending'  THEN 1 ELSE 0 END) AS pending,
         SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) AS approved,
         SUM(CASE WHEN status='sent'     THEN 1 ELSE 0 END) AS sent
       FROM articles`
    ).first(),
  ]);

  // build a dense 14-day growth series (fill zero days)
  const byDay = {};
  for (const r of growth.results) byDay[r.d] = r.c;
  const series = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const dt = new Date(today.getTime() - i * 86400000);
    const key = dt.toISOString().slice(0, 10);
    series.push({ date: key, count: byDay[key] || 0 });
  }

  return Response.json({
    ok: true,
    user: data.user,
    members: {
      total: counts.total || 0,
      active: counts.active || 0,
      unsubscribed: counts.unsubscribed || 0,
      last7: counts.last7 || 0,
      last30: counts.last30 || 0,
    },
    inquiries: { total: inqCounts.total || 0, unread: inqCounts.unread || 0 },
    articles: {
      open: articleCounts.open || 0,
      pending: articleCounts.pending || 0,
      approved: articleCounts.approved || 0,
      sent: articleCounts.sent || 0,
    },
    admins: adminCount.c || 0,
    growth: series,
    recentMembers: recentMembers.results,
    recentInquiries: recentInquiries.results,
  });
}
