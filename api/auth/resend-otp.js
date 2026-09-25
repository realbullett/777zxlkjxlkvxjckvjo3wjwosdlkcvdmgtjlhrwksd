import { GetTurso } from "../_lib/turso.js";

const EmailJsServiceId = process.env.EMAILJS_SERVICE_ID;
const EmailJsTemplateId = process.env.EMAILJS_TEMPLATE_ID;
const EmailJsUserId = process.env.EMAILJS_USER_ID;
const EmailJsAccessToken = process.env.EMAILJS_ACCESS_TOKEN;

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
  const { email: Email } = req.body || {};
  if (!Email) { res.status(400).json({ error: "Missing email" }); return; }
  const Db = GetTurso();
  if (!Db) { res.status(500).json({ error: "turso not configured" }); return; }
  const PendingRs = await Db.execute({ sql: "SELECT email FROM pending_registrations WHERE email = ? LIMIT 1", args: [String(Email)] });
  if ((PendingRs.rows?.length || 0) === 0) { res.status(404).json({ error: "No pending registration for this email" }); return; }
  const Otp = GenerateOtp();
  const ExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await Db.execute({ sql: "INSERT OR REPLACE INTO otps (email, otp, expires_at) VALUES (?, ?, ?)", args: [String(Email), Otp, ExpiresAt] });
  await SendOtpEmail(String(Email), Otp);
  res.status(200).json({ ok: true });
}
