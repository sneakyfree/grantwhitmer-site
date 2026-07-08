// Gate for every /api/admin/* route.
// Cloudflare Access enforces login at the edge for grantwhitmer.com/api/admin,
// but the *.pages.dev host is NOT behind Access — so we independently verify the
// signed Access JWT here. No valid, in-audience, unexpired token from a
// provisioned admin => 403. Never trust the plain Cf-Access-Authenticated-User
// header alone.

function b64urlToBytes(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function b64urlToJSON(s) {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));
}

// module-scoped JWKS cache (persists across requests within an isolate)
let jwksCache = { keys: null, exp: 0 };

async function getKeys(teamDomain) {
  const now = Date.now();
  if (jwksCache.keys && now < jwksCache.exp) return jwksCache.keys;
  const r = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
  if (!r.ok) throw new Error("jwks fetch failed");
  const { keys } = await r.json();
  jwksCache = { keys, exp: now + 3600_000 }; // 1h
  return keys;
}

async function verifyAccessJWT(token, env) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("malformed");
  const header = b64urlToJSON(parts[0]);
  const payload = b64urlToJSON(parts[1]);
  const sig = b64urlToBytes(parts[2]);

  // claims
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && now >= payload.exp) throw new Error("expired");
  if (payload.nbf && now < payload.nbf) throw new Error("not yet valid");
  const iss = `https://${env.ACCESS_TEAM_DOMAIN}`;
  if (payload.iss !== iss) throw new Error("bad issuer");
  const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!auds.includes(env.ACCESS_AUD)) throw new Error("bad audience");

  // signature
  const keys = await getKeys(env.ACCESS_TEAM_DOMAIN);
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error("unknown key");
  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, sig, data);
  if (!ok) throw new Error("bad signature");

  return payload;
}

function forbid(msg) {
  return new Response(JSON.stringify({ ok: false, error: msg || "Forbidden" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequest(context) {
  const { request, env, next, data } = context;

  if (!env.ACCESS_AUD || !env.ACCESS_TEAM_DOMAIN) return forbid("Access not configured");

  const token =
    request.headers.get("Cf-Access-Jwt-Assertion") ||
    (request.headers.get("Cookie") || "").match(/(?:^|;\s*)CF_Authorization=([^;]+)/)?.[1];
  if (!token) return forbid("Not authenticated");

  let payload;
  try {
    payload = await verifyAccessJWT(token, env);
  } catch (e) {
    return forbid("Invalid session");
  }

  const email = (payload.email || "").toLowerCase();
  if (!email) return forbid("No identity");

  // role check — must be a provisioned admin
  let row = null;
  try {
    row = await env.DB.prepare("SELECT role, name FROM admins WHERE email = ?1").bind(email).first();
  } catch (e) {
    return forbid("Directory unavailable");
  }
  if (!row) return forbid("Not an admin");

  data.user = { email, role: row.role, name: row.name || null };
  return next();
}
