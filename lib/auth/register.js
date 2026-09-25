import bcrypt from "bcryptjs";
import { GetTurso } from "../turso.js";

const EmailJsServiceId = process.env.EMAILJS_SERVICE_ID;
const EmailJsTemplateId = process.env.EMAILJS_TEMPLATE_ID;
const EmailJsUserId = process.env.EMAILJS_USER_ID;
const EmailJsAccessToken = process.env.EMAILJS_ACCESS_TOKEN;

const TurnstileSecret = process.env.TURNSTILE_SECRET_KEY;

async function VerifyTurnstile(Token, Ip) {
  if (!TurnstileSecret) return true;
  if (!Token) return false;
  try {
    const Res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: TurnstileSecret, response: String(Token), remoteip: Ip || "" }),
    });
    const Data = await Res.json();
    return Data.success === true;
  } catch (Err) { console.error("Turnstile verify error:", Err); return false; }
}

function GenerateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function SendOtpEmail(Email, Otp) {
  if (!EmailJsServiceId || !EmailJsTemplateId || !EmailJsUserId) {
    console.log("EmailJS not configured, OTP for", Email, "is", Otp);
    return true;
  }
  try {
    const Res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EmailJsServiceId,
        template_id: EmailJsTemplateId,
        user_id: EmailJsUserId,
        accessToken: EmailJsAccessToken,
        template_params: { to_email: Email, otp: Otp },
      }),
    });
    if (!Res.ok) { const Text = await Res.text(); console.error("EmailJS error:", Text); return false; }
    return true;
  } catch (Err) { console.error("EmailJS send error:", Err); return false; }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (Date.now() < new Date("2026-08-30T00:00:00Z").getTime()) {
    res.status(403).json({ error: "New registrations using email are temporarily disabled. Sign up with Gmail or Discord instead." });
    return;
  }
  const { username: RawUsername, email: Email, password: Password } = req.body || {};
  const Username = String(RawUsername || "").trim().toLowerCase();
  if (!Username || !Email || !Password) { res.status(400).json({ error: "Missing fields" }); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(Email))) { res.status(400).json({ error: "Invalid email" }); return; }
  if (!/^[a-zA-Z0-9_]{1,20}$/.test(Username)) { res.status(400).json({ error: "Username can only contain letters, numbers, and underscores (max 20)" }); return; }
  if (String(Password).length < 6) { res.status(400).json({ error: "Password too short" }); return; }
  const Ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  const CaptchaOk = await VerifyTurnstile(req.body?.turnstileToken || "", Ip);
  if (!CaptchaOk) { res.status(400).json({ error: "Captcha check failed. Complete it and try again." }); return; }
  const Db = GetTurso();
  if (!Db) { res.status(500).json({ error: "turso not configured" }); return; }
  const WeekAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const CountRs = await Db.execute({ sql: "SELECT COUNT(*) AS c FROM ip_registrations WHERE ip = ? AND created_at >= ?", args: [Ip, WeekAgoIso] });
  const Count = Number(CountRs.rows?.[0]?.c || 0);
  if (Count >= 3) {
    res.status(429).json({ error: "Too many accounts from this IP. Max 3 per week." });
    return;
  }
  const NameRs = await Db.execute({ sql: "SELECT id FROM users WHERE username = ? LIMIT 1", args: [Username] });
  const AliasRs = await Db.execute({ sql: "SELECT id FROM users WHERE alias = ? LIMIT 1", args: [Username] });
  if ((NameRs.rows?.length || 0) > 0 || (AliasRs.rows?.length || 0) > 0) { res.status(409).json({ error: "Username taken" }); return; }
  const EmailRs = await Db.execute({ sql: "SELECT id FROM users WHERE email = ? LIMIT 1", args: [String(Email)] });
  if ((EmailRs.rows?.length || 0) > 0) { res.status(409).json({ error: "Email already registered" }); return; }
  const PendingRs = await Db.execute({ sql: "SELECT email FROM pending_registrations WHERE email = ? LIMIT 1", args: [String(Email)] });
  if ((PendingRs.rows?.length || 0) > 0) { res.status(409).json({ error: "Verification pending for this email" }); return; }
  const PasswordHash = await bcrypt.hash(String(Password), 10);
  const Otp = GenerateOtp();
  const NowIso = new Date().toISOString();
  const ExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  try {
    await Db.execute({ sql: "INSERT OR REPLACE INTO pending_registrations (email, username, password_hash, ip, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)", args: [String(Email), Username, PasswordHash, Ip, NowIso, ExpiresAt] });
  } catch (Err) {
    console.error("Pending registration error:", Err);
    res.status(500).json({ error: "Failed to start registration" });
    return;
  }
  try {
    await Db.execute({ sql: "INSERT OR REPLACE INTO otps (email, otp, expires_at) VALUES (?, ?, ?)", args: [String(Email), Otp, ExpiresAt] });
  } catch (Err) {
    console.error("OTP insert error:", Err);
    res.status(500).json({ error: "Failed to save OTP" });
    return;
  }
  await SendOtpEmail(String(Email), Otp);
  res.status(200).json({ ok: true, message: "OTP sent" });
}
