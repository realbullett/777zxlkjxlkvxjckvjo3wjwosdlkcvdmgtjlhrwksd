import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null;
const SECRET = process.env.SESSION_SECRET || "sire-dev-secret-do-not-use-in-prod";

const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
const EMAILJS_USER_ID = process.env.EMAILJS_USER_ID;
const EMAILJS_ACCESS_TOKEN = process.env.EMAILJS_ACCESS_TOKEN;

function signUid(uid) {
  const payload = `${uid}:${crypto.createHmac("sha256", SECRET).update(String(uid)).digest("hex")}`;
  return Buffer.from(payload).toString("base64url");
}

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

  const { login, password } = req.body;
  if (!login || !password) { res.status(400).json({ error: "Missing fields" }); return; }

  if (!supabase) { res.status(500).json({ error: "Supabase not configured" }); return; }

  const field = login.includes("@") ? "email" : "username";
  const { data: user } = await supabase.from("users").select("*").eq(field, login).maybeSingle();
  if (!user) { res.status(401).json({ error: "Invalid credentials" }); return; }
  if (user.provider !== "email") { res.status(401).json({ error: "Use OAuth for this account" }); return; }

  const match = await bcrypt.compare(password, user.password_hash || "");
  if (!match) { res.status(401).json({ error: "Invalid credentials" }); return; }

  if (!user.email_verified) {
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await supabase.from("otps").upsert(
      { email: user.email, otp, expires_at: expiresAt },
      { onConflict: "email" }
    );
    await sendOtpEmail(user.email, otp);
    res.status(200).json({ needsOtp: true, email: user.email });
    return;
  }

  const signed = signUid(user.id);
  res.setHeader("Set-Cookie", `sl_session=${signed}; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}; Path=/`);
  res.status(200).json({ ok: true, uid: user.id, sessionToken: signed });
}
