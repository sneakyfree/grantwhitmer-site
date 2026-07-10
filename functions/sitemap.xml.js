// GET /sitemap.xml — home, /windstorm, and every published post (dynamic, from D1)

export async function onRequestGet(context) {
  const { env } = context;
  const urls = [
    { loc: "https://grantwhitmer.com/", changefreq: "weekly", priority: "1.0" },
    { loc: "https://grantwhitmer.com/windstorm", changefreq: "weekly", priority: "0.8" },
  ];

  if (env.DB) {
    const rows = await env.DB.prepare(
      `SELECT slug, published_at, updated_at FROM articles
       WHERE published_at IS NOT NULL AND slug IS NOT NULL
       ORDER BY published_at DESC`
    ).all();
    for (const r of rows.results) {
      const lastmod = (r.updated_at || r.published_at || "").slice(0, 10);
      urls.push({ loc: `https://grantwhitmer.com/windstorm/${r.slug}`, lastmod, changefreq: "monthly", priority: "0.7" });
    }
  }

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) =>
      `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
    ).join("\n") +
    `\n</urlset>\n`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
