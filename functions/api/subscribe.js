// POST /api/subscribe — join The Conductor's Brief (Resend audience + welcome email)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function wantsJSON(request) {
  return (request.headers.get("accept") || "").includes("application/json");
}

function respond(request, ok, message, status) {
  if (wantsJSON(request)) {
    return new Response(JSON.stringify({ ok, message }), {
      status: status || (ok ? 200 : 400),
      headers: { "Content-Type": "application/json" },
    });
  }
  // no-JS fallback: land on the thanks page (or bounce home on error)
  const to = ok ? "/thanks?s=brief" : "/?error=subscribe#brief";
  return Response.redirect(new URL(to, request.url), 303);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let form;
  try {
    form = await request.formData();
  } catch {
    return respond(request, false, "Bad request.", 400);
  }

  // honeypot: bots fill it, humans never see it
  if ((form.get("company_website") || "").toString().trim() !== "") {
    return respond(request, true, "You're in — welcome aboard.");
  }

  const email = (form.get("email") || "").toString().trim().slice(0, 254);
  if (!EMAIL_RE.test(email)) {
    return respond(request, false, "That email doesn't look right — give it another try.");
  }

  const auth = {
    Authorization: `Bearer ${env.RESEND_API_KEY}`,
    "Content-Type": "application/json",
  };

  const res = await fetch(`https://api.resend.com/audiences/${env.RESEND_AUDIENCE_ID}/contacts`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ email, unsubscribed: false }),
  });

  if (!res.ok && res.status !== 409) {
    const body = await res.text();
    // Resend signals an existing contact with a 4xx; treat "already exists" as success
    if (!/exist/i.test(body)) {
      console.log("subscribe failed", res.status, body);
      // 400, not 502 — Cloudflare replaces 52x responses with its own error page
      return respond(request, false, "Something hiccuped on our end — try again in a minute.", 400);
    }
    return respond(request, true, "You're already on the list — welcome back.");
  }

  // best-effort welcome note; a failure here shouldn't fail the signup
  context.waitUntil(
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: auth,
      body: JSON.stringify({
        from: env.MAIL_FROM,
        to: [email],
        reply_to: env.INQUIRY_TO,
        subject: "Welcome aboard — The Conductor's Brief",
        html: [
          "<div style='font-family:Georgia,serif;font-size:17px;line-height:1.6;color:#1a1a1a;max-width:560px;margin:0 auto;padding:8px 4px;'>",
          "<p>Welcome aboard.</p>",
          "<p>You're on the list for <b>The Conductor's Brief</b> — one email a week on the Singularity: what actually happened as AI wove itself a little deeper into human life, what it means for your work and your company, and one thing worth doing about it.</p>",
          "<p>Short, plain-spoken, and worth your five minutes — that's the deal. Unsubscribe any time with one click; no hard feelings.</p>",
          "<p>While you wait for the first issue, the site has the whole story: <a href='https://grantwhitmer.com'>grantwhitmer.com</a></p>",
          "<p>Set your sails,<br>Grant Whitmer</p>",
          "</div>",
        ].join(""),
      }),
    }).catch(() => {})
  );

  return respond(request, true, "You're in — welcome aboard. Check your inbox.");
}
