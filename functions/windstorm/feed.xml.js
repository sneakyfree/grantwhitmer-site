// GET /windstorm/feed.xml — RSS 2.0 feed of all published writing

const escXml = (s) =>
  (s == null ? "" : String(s)).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]));

function rfc822(s) {
  const d = new Date(String(s).replace(" ", "T") + "Z");
  return isNaN(d) ? new Date().toUTCString() : d.toUTCString();
}

export async function onRequestGet(context) {
  const { env } = context;
  let rows = { results: [] };
  if (env.DB) {
    rows = await env.DB.prepare(
      `SELECT subject, preview, slug, type, published_at FROM articles
       WHERE published_at IS NOT NULL AND slug IS NOT NULL
       ORDER BY published_at DESC LIMIT 50`
    ).all();
  }

  const items = rows.results.map((a) => `    <item>
      <title>${escXml(a.subject)}</title>
      <link>https://grantwhitmer.com/windstorm/${escXml(a.slug)}</link>
      <guid isPermaLink="true">https://grantwhitmer.com/windstorm/${escXml(a.slug)}</guid>
      <pubDate>${rfc822(a.published_at)}</pubDate>
      <category>${a.type === "essay" ? "Essay" : "The Windstorm"}</category>
      ${a.preview ? `<description>${escXml(a.preview)}</description>` : ""}
    </item>`).join("\n");

  const lastBuild = rows.results.length ? rfc822(rows.results[0].published_at) : new Date().toUTCString();

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Windstorm — Grant Whitmer</title>
    <link>https://grantwhitmer.com/windstorm</link>
    <atom:link href="https://grantwhitmer.com/windstorm/feed.xml" rel="self" type="application/rss+xml" />
    <description>The Windstorm — Grant Whitmer's weekly dispatch from the eye of the storm: the signal each week as AI weaves itself deeper into how we work.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=1800" },
  });
}
