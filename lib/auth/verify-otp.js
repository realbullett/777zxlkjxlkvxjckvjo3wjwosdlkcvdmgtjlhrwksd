import crypto from "crypto";
import { GetTurso } from "../turso.js";

const Secret = process.env.SESSION_SECRET || "sire-dev-secret-do-not-use-in-prod";

function SignUid(Uid) {
  const Payload = `${Uid}:${crypto.createHmac("sha256", Secret).update(String(Uid)).digest("hex")}`;
  return Buffer.from(Payload).toString("base64url");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const { email: Email, otp: Otp } = req.body || {};
  if (!Email || !Otp) { res.status(400).json({ error: "Missing fields" }); return; }
  const Db = GetTurso();
  if (!Db) { res.status(500).json({ error: "turso not configured" }); return; }
  const PendingRs = await Db.execute({ sql: "SELECT * FROM pending_registrations WHERE email = ? LIMIT 1", args: [String(Email)] });
  const Pending = PendingRs.rows?.[0];
  if (!Pending) {
    res.status(400).json({ error: "No pending registration for this email" });
    return;
  }
  const OtpRs = await Db.execute({ sql: "SELECT * FROM otps WHERE email = ? LIMIT 1", args: [String(Email)] });
  const Stored = OtpRs.rows?.[0];
  const NowIso = new Date().toISOString();
  if (!Stored || String(Stored.otp) !== String(Otp) || String(Stored.expires_at) <= NowIso) {
    res.status(400).json({ error: "Invalid or expired OTP" });
    return;
  }
  await Db.execute({ sql: "DELETE FROM otps WHERE email = ?", args: [String(Email)] });
  let Uid = null;
  try {
    const Ins = await Db.execute({
      sql: "INSERT INTO users (provider, provider_id, username, email, password_hash, email_verified, accent_color, text_color, background_color, icon_color, bg_effect_color, primary_color, secondary_color, panel_opacity) VALUES ('email', ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, 0)",
      args: [String(Pending.email), String(Pending.username), String(Pending.email), String(Pending.password_hash), "rgba(255, 255, 255, 0.05)", "#ffffff", "#080808", "#ffffff", "rgba(255, 255, 255, 0.08)", "rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.15)"]
    });
    Uid = Number(Ins.lastInsertRowid);
  } catch (Err) {
    console.error("User creation error:", Err);
    res.status(500).json({ error: "Failed to create account" });
    return;
  }
  if (!Uid) { res.status(500).json({ error: "Failed to create account" }); return; }
  await Db.execute({ sql: "INSERT OR IGNORE INTO ip_registrations (ip, created_at) VALUES (?, ?)", args: [String(Pending.ip), NowIso] });
  await Db.execute({ sql: "DELETE FROM pending_registrations WHERE email = ?", args: [String(Email)] });
  const Signed = SignUid(Uid);
  res.setHeader("Set-Cookie", `sl_session=${Signed}; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}; Path=/`);
  res.status(200).json({ ok: true, uid: Uid, sessionToken: Signed });
}
