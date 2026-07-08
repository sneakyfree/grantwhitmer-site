// /api/admin/admins — team & role management (super_admin only)
//   GET                     list admins
//   POST {email,role,name}  add or change an admin's role
//   DELETE ?email=          remove an admin

import { ROLES, roleRank, canManageTeam, audit, syncAccessPolicy, json, forbidden, bad } from "./_lib.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const GRANTABLE = ["viewer", "manager", "admin"]; // super_admin not grantable via UI

export async function onRequestGet(context) {
  const { env, data } = context;
  if (!canManageTeam(data.user)) return forbidden("Only a super admin can view the team.");
  const rows = await env.DB.prepare(
    "SELECT email, role, name, granted_by, created_at FROM admins ORDER BY created_at ASC"
  ).all();
  return json({ ok: true, admins: rows.results, me: data.user.email });
}

export async function onRequestPost(context) {
  const { request, env, data } = context;
  if (!canManageTeam(data.user)) return forbidden("Only a super admin can manage the team.");

  let body;
  try { body = await request.json(); } catch { return bad("Invalid JSON."); }
  const email = (body.email || "").trim().toLowerCase();
  const role = (body.role || "").trim();
  const name = (body.name || "").trim().slice(0, 120) || null;

  if (!EMAIL_RE.test(email)) return bad("A valid email is required.");
  if (!GRANTABLE.includes(role)) return bad(`Role must be one of: ${GRANTABLE.join(", ")}.`);

  // don't let a super_admin be silently demoted through this path
  const existing = await env.DB.prepare("SELECT role FROM admins WHERE email = ?1").bind(email).first();
  if (existing && existing.role === "super_admin") {
    return bad("That account is a super admin and can't be changed here.");
  }

  await env.DB.prepare(
    `INSERT INTO admins (email, role, name, granted_by)
     VALUES (?1, ?2, ?3, ?4)
     ON CONFLICT(email) DO UPDATE SET role = ?2, name = COALESCE(?3, name)`
  ).bind(email, role, name, data.user.email).run();

  try {
    await syncAccessPolicy(env);
  } catch (e) {
    // roll back the DB change so the login policy and the table stay consistent
    if (!existing) {
      await env.DB.prepare("DELETE FROM admins WHERE email = ?1").bind(email).run();
    } else {
      await env.DB.prepare("UPDATE admins SET role = ?2 WHERE email = ?1").bind(email, existing.role).run();
    }
    return json({ ok: false, error: "Couldn't update the login policy — nothing changed. Try again." }, 500);
  }

  await audit(env, data.user.email, existing ? "role.change" : "admin.add", { email, role });
  return json({ ok: true, email, role });
}

export async function onRequestDelete(context) {
  const { request, env, data } = context;
  if (!canManageTeam(data.user)) return forbidden("Only a super admin can manage the team.");

  const email = (new URL(request.url).searchParams.get("email") || "").trim().toLowerCase();
  if (!email) return bad("email is required.");
  if (email === data.user.email) return bad("You can't remove yourself.");

  const target = await env.DB.prepare("SELECT role FROM admins WHERE email = ?1").bind(email).first();
  if (!target) return bad("No such admin.");
  if (target.role === "super_admin") return bad("You can't remove a super admin here.");

  await env.DB.prepare("DELETE FROM admins WHERE email = ?1").bind(email).run();
  try {
    await syncAccessPolicy(env);
  } catch (e) {
    // restore so DB and policy stay consistent
    await env.DB.prepare(
      "INSERT OR IGNORE INTO admins (email, role, name, granted_by) VALUES (?1, ?2, NULL, ?3)"
    ).bind(email, target.role, data.user.email).run();
    return json({ ok: false, error: "Couldn't update the login policy — nothing changed." }, 500);
  }

  await audit(env, data.user.email, "admin.remove", { email });
  return json({ ok: true, removed: email });
}
