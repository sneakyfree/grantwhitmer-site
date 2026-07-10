// Shared rendering for the public /windstorm writing section (not a route — underscore).

export const esc = (s) =>
  (s == null ? "" : String(s)).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function slugify(subject, id) {
  const base = String(subject || "issue").toLowerCase()
    .replace(/['".,!?:;]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "issue";
  return `${base}-${id}`;
}

export function fmtDate(s) {
  if (!s) return "";
  const d = new Date(String(s).replace(" ", "T") + "Z");
  if (isNaN(d)) return esc(s);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

const BLOG_CSS = `
  .brief-head { padding: clamp(40px,7vw,80px) 0 8px; }
  .brief-head .eyebrow { justify-content:flex-start; }
  .brief-head h1 { font-size: clamp(32px,5vw,52px); }
  .brief-lede { color: var(--text-soft); font-size: clamp(17px,1.7vw,20px); max-width: 60ch; margin-top: 14px; }
  .post-list { margin: 32px 0 0; border-top: 1px solid var(--line-soft); }
  .post-item { display:block; padding: 26px 0; border-bottom: 1px solid var(--line-soft); transition: opacity .2s; }
  .post-item:hover { opacity: .82; }
  .post-item .pi-meta { font-family: var(--mono); font-size: 11.5px; letter-spacing:.08em; text-transform:uppercase; color: var(--brass); }
  .post-item h2 { font-size: clamp(21px,2.4vw,27px); margin: 8px 0 8px; color: var(--text); }
  .post-item p { color: var(--muted); font-size: 15.5px; margin: 0; max-width: 68ch; }
  .post-item .pi-more { color: var(--brass-lt); font-size: 14px; font-weight: 600; margin-top: 12px; display:inline-block; }
  .empty-note { color: var(--faint); font-size: 15px; padding: 30px 0; }

  .letter-wrap { padding: clamp(28px,5vw,56px) 0 clamp(48px,7vw,84px); }
  .letter-meta { text-align:center; margin-bottom: 20px; }
  .letter-meta .lm-k { font-family: var(--mono); font-size: 11.5px; letter-spacing:.14em; text-transform:uppercase; color: var(--brass); }
  .letter-meta .lm-d { color: var(--muted); font-size: 13.5px; margin-top: 6px; }
  .letter { background: #f7f5ef; color:#1a1a1a; max-width: 660px; margin: 0 auto; border-radius: 16px;
    padding: clamp(28px,4vw,54px); box-shadow: 0 40px 90px -50px rgba(0,0,0,.85); border:1px solid #e6e1d4; }
  .letter img { max-width: 100%; }
  .post-foot { max-width: 660px; margin: 28px auto 0; }
  .share-row { display:flex; gap:10px; flex-wrap:wrap; align-items:center; justify-content:center; }
  .share-row .sk { font-family: var(--mono); font-size:11px; letter-spacing:.1em; text-transform:uppercase; color: var(--muted); margin-right:4px; }
  .share-btn { display:inline-flex; align-items:center; gap:7px; border:1px solid var(--line); border-radius:999px; padding:8px 15px; font-size:13.5px; color: var(--text-soft); background:transparent; cursor:pointer; }
  .share-btn:hover { border-color: var(--brass); color: var(--brass-lt); }
  .post-cta { margin-top: 34px; text-align:center; background: var(--card); border:1px solid var(--line); border-radius:16px; padding: 28px 24px; }
  .post-cta h3 { font-family: var(--serif); font-size:22px; margin:0 0 6px; }
  .post-cta p { color: var(--muted); font-size:14.5px; margin:0 0 16px; }
  .back-link { display:inline-block; margin-top: 26px; color: var(--faint); font-size:14px; }
  .back-link:hover { color: var(--brass-lt); }
`;

export function shell({ title, description, path, ogImage, body, jsonld }) {
  const url = `https://grantwhitmer.com${path}`;
  const img = ogImage || "https://grantwhitmer.com/assets/grant-og-wide.jpg";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="theme-color" content="#0A0C10" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${img}" />
<meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="${img}" />
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='%230A0C10'/%3E%3Ctext x='50' y='68' font-family='Georgia,serif' font-size='54' fill='%23E4C578' text-anchor='middle'%3EG%3C/text%3E%3C/svg%3E" />
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
<link rel="alternate" type="application/rss+xml" title="The Windstorm — Grant Whitmer" href="/windstorm/feed.xml" />
<link rel="stylesheet" href="/css/style.css?v=20260710b" />
<style>${BLOG_CSS}</style>
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ""}
</head>
<body>
<header class="nav" id="nav">
  <div class="wrap nav-inner">
    <a class="brand" href="/#top">Grant <b>Whitmer</b></a>
    <nav class="nav-links" id="navLinks">
      <a href="/#work">Services</a>
      <a href="/#story">About</a>
      <a href="/#books">Books</a>
      <a href="/windstorm">Writing</a>
      <a href="/#book" class="btn btn-primary btn-sm nav-cta">Book Grant</a>
    </nav>
    <button class="nav-toggle" id="navToggle" aria-label="Menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>
  </div>
</header>
<main>${body}</main>
<footer class="footer">
  <div class="wrap">
    <div class="footer-bottom" style="border:0;margin:0;padding:0;">
      <span>© <span id="year"></span> Grant Lavell Whitmer III · <a href="/" style="color:var(--brass-lt)">grantwhitmer.com</a></span>
      <span class="quiet">Spoken into existence. Built by voice.</span>
    </div>
  </div>
</footer>
<script src="/js/main.js?v=20260710a"></script>
<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "605e8288417c409d8aab2e1d184ea846"}'></script>
</body>
</html>`;
}
