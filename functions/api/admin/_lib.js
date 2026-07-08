// Shared helpers for the admin API (not a route — underscore-prefixed).

export const ROLES = ["viewer", "manager", "admin", "super_admin"];
export const roleRank = (r) => ROLES.indexOf(r);

// Capability gates by minimum role
export const canDraft = (u) => roleRank(u?.role) >= roleRank("manager");
export const canApproveSend = (u) => roleRank(u?.role) >= roleRank("admin");
export const canManageTeam = (u) => roleRank(u?.role) >= roleRank("super_admin");

export const json = (obj, status = 200) => Response.json(obj, { status });
export const forbidden = (m) => json({ ok: false, error: m || "Forbidden" }, 403);
export const bad = (m) => json({ ok: false, error: m || "Bad request" }, 400);

export async function audit(env, actor, action, detail) {
  try {
    await env.DB.prepare(
      "INSERT INTO audit_log (actor_email, action, detail) VALUES (?1, ?2, ?3)"
    ).bind(actor, action, detail ? JSON.stringify(detail) : null).run();
  } catch (e) {
    console.log("audit failed", action, String(e));
  }
}

// Rebuild the Cloudflare Access login policy from the admins table, so the set
// of people who can log in always equals the set of provisioned admins.
export async function syncAccessPolicy(env) {
  if (!env.CF_ACCESS_TOKEN || !env.ACCESS_APP_ID || !env.ACCESS_POLICY_ID) {
    throw new Error("Access sync not configured");
  }
  const rows = await env.DB.prepare("SELECT email FROM admins").all();
  const include = rows.results.map((r) => ({ email: { email: r.email } }));
  if (include.length === 0) throw new Error("refusing to write an empty policy");

  const url = `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/access/apps/${env.ACCESS_APP_ID}/policies/${env.ACCESS_POLICY_ID}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${env.CF_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Grant + delegated admins", decision: "allow", include }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.log("access policy sync failed", res.status, body);
    throw new Error("Access policy update failed");
  }
}
