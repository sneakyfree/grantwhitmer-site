// GET /windstorm — the public writing archive (published issues + essays)

import { esc, fmtDate, shell } from "../_web.js";

export async function onRequestGet(context) {
  const { env } = context;
  let rows = { results: [] };
  if (env.DB) {
    rows = await env.DB.prepare(
      `SELECT subject, preview, slug, type, published_at, episode_url
       FROM articles WHERE published_at IS NOT NULL AND slug IS NOT NULL
       ORDER BY published_at DESC, id DESC`
    ).all();
  }

  const items = rows.results.map((a) => `
    <a class="post-item" href="/windstorm/${esc(a.slug)}">
      <div class="pi-meta">${a.type === "essay" ? "Essay" : "The Windstorm"} · ${fmtDate(a.published_at)}${a.episode_url ? " · 🎙 watch the episode" : ""}</div>
      <h2>${esc(a.subject)}</h2>
      ${a.preview ? `<p>${esc(a.preview)}</p>` : ""}
      <span class="pi-more">Read →</span>
    </a>`).join("");

  const body = `
  <div class="wrap">
    <div class="brief-head">
      <p class="eyebrow">Writing</p>
      <h1>The Windstorm &amp; field notes</h1>
      <p class="brief-lede">Essays on conducting intelligence, plus every issue of The Windstorm — the weekly dispatch from the eye of the storm: the signal each week as AI weaves itself deeper into how we work, and what to do about it.</p>
    </div>
    <div class="post-list">
      ${items || `<p class="empty-note">The first pieces are on their way. <a href="/#windstorm" style="color:var(--brass-lt)">Subscribe</a> to get them in your inbox.</p>`}
    </div>
    <div style="padding:40px 0 80px;">
      <a class="btn btn-primary" href="/#windstorm">Join The Windstorm →</a>
    </div>
  </div>`;

  return new Response(
    shell({
      title: "Writing — Grant Whitmer",
      description: "The Windstorm — Grant Whitmer's weekly dispatch from the eye of the storm, plus essays on conducting intelligence.",
      path: "/windstorm",
      body,
    }),
    { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=0, must-revalidate" } }
  );
}
