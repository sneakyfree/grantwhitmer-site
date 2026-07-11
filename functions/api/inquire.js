// POST /api/inquire — booking inquiry form → email to Grant via Resend

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
  const to = ok ? "/thanks?s=inquiry" : "/?error=inquiry#book";
  return Response.redirect(new URL(to, request.url), 303);
}

const esc = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export async function onRequestPost(context) {
  const { request, env } = context;
  let form;
  try {
    form = await request.formData();
  } catch {
    return respond(request, false, "Bad request.", 400);
  }

  if ((form.get("company_website") || "").toString().trim() !== "") {
    return respond(request, true, "Sent — Grant will reply personally.");
  }

  const field = (k, max) => (form.get(k) || "").toString().trim().slice(0, max);
  const name = field("name", 120);
  const email = field("email", 254);
  const org = field("organization", 200);
  const engagement = field("engagement", 80);
  const message = field("message", 5000);

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !message) {
    return respond(request, false, "Name, a valid email, and a message are required.");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // bookings speak as the business site, not the newsletter persona
      from: env.INQUIRY_FROM || "grantwhitmer.com booking <grant@grantwhitmer.com>",
      to: [env.INQUIRY_TO],
      reply_to: email,
      subject: `Booking inquiry — ${engagement || "General"} — ${name}`,
      html: [
        "<div style='font-family:Georgia,serif;font-size:16px;line-height:1.6;max-width:640px;'>",
        `<p><b>Name:</b> ${esc(name)}<br>`,
        `<b>Email:</b> ${esc(email)}<br>`,
        `<b>Organization:</b> ${esc(org) || "—"}<br>`,
        `<b>Engagement:</b> ${esc(engagement) || "—"}</p>`,
        `<p style='white-space:pre-wrap;border-left:3px solid #C9A24B;padding-left:14px;'>${esc(message)}</p>`,
        "<p style='color:#888;font-size:13px;'>Sent from the grantwhitmer.com booking form. Reply goes straight to the sender.</p>",
        "</div>",
      ].join(""),
    }),
  });

  if (!res.ok) {
    console.log("inquire failed", res.status, await res.text());
    // 400, not 502 — Cloudflare replaces 52x responses with its own error page
    return respond(request, false, "Something hiccuped sending your note — email grant@windstorminstitute.org directly.", 400);
  }

  // log to the cockpit (best-effort — the email already went out)
  if (env.DB) {
    let emailId = null;
    try { emailId = (await res.json()).id || null; } catch { /* ignore */ }
    context.waitUntil(
      env.DB.prepare(
        `INSERT INTO inquiries (name, email, organization, engagement, message, resend_email_id)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
      ).bind(name, email, org || null, engagement || null, message, emailId).run().catch((e) =>
        console.log("D1 inquiry insert failed", String(e))
      )
    );
  }

  return respond(request, true, "Sent — Grant will reply personally, usually within a day.");
}
