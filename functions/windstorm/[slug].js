// GET /windstorm/:slug — a single published post (light "letter" card on the dark site)

import { esc, fmtDate, shell } from "../_web.js";

export async function onRequestGet(context) {
  const { env, params } = context;
  const slug = (params.slug || "").toString();

  let a = null;
  if (env.DB) {
    a = await env.DB.prepare(
      `SELECT id, subject, preview, body_html, type, published_at
       FROM articles WHERE slug = ?1 AND published_at IS NOT NULL`
    ).bind(slug).first();
  }

  // neighbors for prev/next navigation (published order; id breaks timestamp ties)
  let prev = null, next = null;
  if (a && env.DB) {
    [prev, next] = await Promise.all([
      env.DB.prepare(
        `SELECT subject, slug FROM articles WHERE published_at IS NOT NULL AND slug IS NOT NULL
         AND (published_at < ?1 OR (published_at = ?1 AND id < ?2))
         ORDER BY published_at DESC, id DESC LIMIT 1`
      ).bind(a.published_at, a.id).first(),
      env.DB.prepare(
        `SELECT subject, slug FROM articles WHERE published_at IS NOT NULL AND slug IS NOT NULL
         AND (published_at > ?1 OR (published_at = ?1 AND id > ?2))
         ORDER BY published_at ASC, id ASC LIMIT 1`
      ).bind(a.published_at, a.id).first(),
    ]);
  }

  if (!a) {
    const body = `<div class="wrap" style="min-height:60vh;display:grid;place-items:center;text-align:center;">
      <div><p class="eyebrow" style="justify-content:center;">Not found</p>
      <h1 style="font-size:clamp(30px,5vw,46px);">That piece isn't here.</h1>
      <p class="lede" style="margin:16px auto 0;">It may have moved. Here's everything else:</p>
      <p style="margin-top:26px;"><a class="btn btn-primary" href="/windstorm">← All writing</a></p></div></div>`;
    return new Response(shell({ title: "Not found — Grant Whitmer", description: "Page not found.", path: `/windstorm/${slug}`, body }),
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  const kind = a.type === "essay" ? "Essay" : "The Windstorm";
  const shareText = a.subject;
  const words = a.body_html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  const readMin = Math.max(1, Math.round(words / 220));

  const body = `
  <article class="letter-wrap">
    <div class="wrap">
      <div class="letter-meta">
        <div class="lm-k">${kind}</div>
        <div class="lm-d">${fmtDate(a.published_at)} · ${readMin} min read</div>
      </div>
      <div class="letter">${a.body_html}</div>

      <div class="post-foot">
        <div class="share-row">
          <span class="sk">Share</span>
          <button class="share-btn" data-share="x">𝕏 / Twitter</button>
          <button class="share-btn" data-share="linkedin">LinkedIn</button>
          <button class="share-btn" data-share="facebook">Facebook</button>
          <button class="share-btn" data-share="copy" id="copyBtn">Copy link</button>
        </div>
        <div class="post-cta">
          <h3>Get the next one in your inbox</h3>
          <p>The Windstorm — one email a week from the eye of the storm. Plus Windy Word, free.</p>
          <a class="btn btn-primary" href="/#windstorm">Subscribe free →</a>
        </div>
        ${prev || next ? `
        <nav class="post-neighbors" aria-label="More writing" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:26px;">
          ${prev ? `<a href="/windstorm/${esc(prev.slug)}" style="border:1px solid var(--line);border-radius:12px;padding:14px 16px;">
            <span style="display:block;font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);margin-bottom:6px;">← Earlier</span>
            <span style="color:var(--text-soft);font-size:14px;">${esc(prev.subject)}</span></a>` : `<span></span>`}
          ${next ? `<a href="/windstorm/${esc(next.slug)}" style="border:1px solid var(--line);border-radius:12px;padding:14px 16px;text-align:right;">
            <span style="display:block;font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);margin-bottom:6px;">Later →</span>
            <span style="color:var(--text-soft);font-size:14px;">${esc(next.subject)}</span></a>` : `<span></span>`}
        </nav>` : ""}
        <div style="text-align:center;"><a class="back-link" href="/windstorm">← All writing</a></div>
      </div>
    </div>
  </article>
  <script>
  (function(){
    var url = location.href.split('#')[0].split('?')[0];
    var text = ${JSON.stringify(shareText)};
    var intents = {
      x: 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url),
      linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url),
      facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url)
    };
    document.querySelectorAll('[data-share]').forEach(function(b){
      b.addEventListener('click', function(){
        var k = b.getAttribute('data-share');
        if (k === 'copy') {
          navigator.clipboard && navigator.clipboard.writeText(url).then(function(){ b.textContent = 'Copied ✓'; setTimeout(function(){ b.textContent = 'Copy link'; }, 1600); });
          return;
        }
        window.open(intents[k], '_blank', 'noopener,width=600,height=600');
      });
    });
  })();
  </script>`;

  const jsonld = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: a.subject,
    description: a.preview || undefined,
    datePublished: (a.published_at || "").replace(" ", "T") + "Z",
    url: `https://grantwhitmer.com/windstorm/${slug}`,
    image: "https://grantwhitmer.com/assets/grant-og-wide.jpg",
    wordCount: words,
    author: { "@type": "Person", name: "Grant Whitmer", url: "https://grantwhitmer.com/" },
    publisher: { "@type": "Person", name: "Grant Whitmer", url: "https://grantwhitmer.com/" },
    mainEntityOfPage: `https://grantwhitmer.com/windstorm/${slug}`,
  };

  return new Response(
    shell({
      title: `${a.subject} — Grant Whitmer`,
      description: a.preview || `${kind} from Grant Whitmer.`,
      path: `/windstorm/${esc(slug)}`,
      body,
      jsonld,
    }),
    { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=0, must-revalidate" } }
  );
}
