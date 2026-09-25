import bcrypt from "bcryptjs";
import crypto from "crypto";
import { GetTurso } from "../turso.js";

const Secret = process.env.SESSION_SECRET || "sire-dev-secret-do-not-use-in-prod";
const EmailJsServiceId = process.env.EMAILJS_SERVICE_ID;
const EmailJsTemplateId = process.env.EMAILJS_TEMPLATE_ID;
const EmailJsUserId = process.env.EMAILJS_USER_ID;
const EmailJsAccessToken = process.env.EMAILJS_ACCESS_TOKEN;

function SignUid(Uid) {
  const Payload = `${Uid}:${crypto.createHmac("sha256", Secret).update(String(Uid)).digest("hex")}`;
  return Buffer.from(Payload).toString("base64url");
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
  const { login: Login, password: Password } = req.body || {};
  if (!Login || !Password) { res.status(400).json({ error: "Missing fields" }); return; }
  const Db = GetTurso();
  if (!Db) { res.status(500).json({ error: "turso not configured" }); return; }
  const IsEmail = String(Login).includes("@");
  const UserRs = IsEmail
    ? await Db.execute({ sql: "SELECT * FROM users WHERE email = ? LIMIT 1", args: [String(Login)] })
    : await Db.execute({ sql: "SELECT * FROM users WHERE username = ? LIMIT 1", args: [String(Login)] });
  const User = UserRs.rows?.[0];
  if (!User) { res.status(401).json({ error: "Invalid credentials" }); return; }
  if (User.provider !== "email") { res.status(401).json({ error: "Use OAuth for this account" }); return; }
  const Match = await bcrypt.compare(String(Password), User.password_hash || "");
  if (!Match) { res.status(401).json({ error: "Invalid credentials" }); return; }
  if (Number(User.email_verified) !== 1) {
    const Otp = GenerateOtp();
    const ExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await Db.execute({ sql: "INSERT OR REPLACE INTO otps (email, otp, expires_at) VALUES (?, ?, ?)", args: [User.email, Otp, ExpiresAt] });
    await SendOtpEmail(User.email, Otp);
    res.status(200).json({ needsOtp: true, email: User.email });
    return;
  }
  const Signed = SignUid(User.id);
  res.setHeader("Set-Cookie", `sl_session=${Signed}; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}; Path=/`);
  res.status(200).json({ ok: true, uid: User.id, sessionToken: Signed });
}
