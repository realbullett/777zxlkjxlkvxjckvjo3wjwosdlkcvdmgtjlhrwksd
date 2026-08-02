import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null;

const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
const EMAILJS_USER_ID = process.env.EMAILJS_USER_ID;
const EMAILJS_ACCESS_TOKEN = process.env.EMAILJS_ACCESS_TOKEN;

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtpEmail(email, otp) {
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_USER_ID) {
    console.log("EmailJS not configured, OTP for", email, "is", otp);
    return true;
  }
  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_USER_ID,
        accessToken: EMAILJS_ACCESS_TOKEN,
        template_params: { to_email: email, otp },
      }),
    });
    if (!res.ok) { const t = await res.text(); console.error("EmailJS error:", t); return false; }
    return true;
  } catch (e) { console.error("EmailJS send error:", e); return false; }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { email } = req.body;
  if (!email) { res.status(400).json({ error: "Missing email" }); return; }

  if (!supabaseAdmin) { res.status(500).json({ error: "Supabase not configured" }); return; }

  const { data: pending } = await supabaseAdmin.from("pending_registrations").select("email").eq("email", email).maybeSingle();
  if (!pending) { res.status(404).json({ error: "No pending registration for this email" }); return; }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await supabaseAdmin.from("otps").upsert(
    { email, otp, expires_at: expiresAt },
    { onConflict: "email" }
  );
  await sendOtpEmail(email, otp);
  res.status(200).json({ ok: true });
}