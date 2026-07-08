// GET /brief/:slug — a single published post (light "letter" card on the dark site)

import { esc, fmtDate, shell } from "../_web.js";

export async function onRequestGet(context) {
  const { env, params } = context;
  const slug = (params.slug || "").toString();

  let a = null;
  if (env.DB) {
    a = await env.DB.prepare(
      `SELECT subject, preview, body_html, type, published_at
       FROM articles WHERE slug = ?1 AND published_at IS NOT NULL`
    ).bind(slug).first();
  }

  if (!a) {
    const body = `<div class="wrap" style="min-height:60vh;display:grid;place-items:center;text-align:center;">
      <div><p class="eyebrow" style="justify-content:center;">Not found</p>
      <h1 style="font-size:clamp(30px,5vw,46px);">That piece isn't here.</h1>
      <p class="lede" style="margin:16px auto 0;">It may have moved. Here's everything else:</p>
      <p style="margin-top:26px;"><a class="btn btn-primary" href="/brief">← All writing</a></p></div></div>`;
    return new Response(shell({ title: "Not found — Grant Whitmer", description: "Page not found.", path: `/brief/${slug}`, body }),
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  const kind = a.type === "essay" ? "Essay" : "The Conductor's Brief";
  const shareText = a.subject;

  const body = `
  <article class="letter-wrap">
    <div class="wrap">
      <div class="letter-meta">
        <div class="lm-k">${kind}</div>
        <div class="lm-d">${fmtDate(a.published_at)}</div>
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
          <p>The Conductor's Brief — one email a week on the Singularity. Plus Windy Word, free.</p>
          <a class="btn btn-primary" href="/#brief">Subscribe free →</a>
        </div>
        <div style="text-align:center;"><a class="back-link" href="/brief">← All writing</a></div>
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

  return new Response(
    shell({
      title: `${a.subject} — Grant Whitmer`,
      description: a.preview || `${kind} from Grant Whitmer.`,
      path: `/brief/${esc(slug)}`,
      body,
    }),
    { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=0, must-revalidate" } }
  );
}
