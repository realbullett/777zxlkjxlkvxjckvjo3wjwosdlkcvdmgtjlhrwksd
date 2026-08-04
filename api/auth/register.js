import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

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

  if (Date.now() < new Date("2026-08-30T00:00:00Z").getTime()) {
    res.status(403).json({ error: "New registrations using email are temporarily disabled. Sign up with Gmail or Discord instead." });
    return;
  }

  const { username: rawUsername, email, password } = req.body;
  const username = String(rawUsername || "").trim().toLowerCase();
  if (!username || !email || !password) { res.status(400).json({ error: "Missing fields" }); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { res.status(400).json({ error: "Invalid email" }); return; }
  if (!/^[a-zA-Z0-9_]{1,20}$/.test(username)) { res.status(400).json({ error: "Username can only contain letters, numbers, and underscores (max 20)" }); return; }
  if (password.length < 6) { res.status(400).json({ error: "Password too short" }); return; }

  if (!supabaseAdmin) { res.status(500).json({ error: "Supabase not configured" }); return; }

  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabaseAdmin.from("ip_registrations").select("*", { count: "exact", head: true }).eq("ip", ip).gte("created_at", weekAgo);
  if (count !== null && count >= 3) {
    res.status(429).json({ error: "Too many accounts from this IP. Max 3 per week." });
    return;
  }

  const { data: existing } = await supabaseAdmin.from("users").select("id").eq("username", username).maybeSingle();
  const { data: existingAlias } = await supabaseAdmin.from("users").select("id").eq("alias", username).maybeSingle();
  if (existing || existingAlias) { res.status(409).json({ error: "Username taken" }); return; }

  const { data: emailExisting } = await supabaseAdmin.from("users").select("id").eq("email", email).maybeSingle();
  if (emailExisting) { res.status(409).json({ error: "Email already registered" }); return; }

  // Check pending registrations
  const { data: pending } = await supabaseAdmin.from("pending_registrations").select("email").eq("email", email).maybeSingle();
  if (pending) { res.status(409).json({ error: "Verification pending for this email" }); return; }

  const password_hash = await bcrypt.hash(password, 10);
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error: pendingError } = await supabaseAdmin.from("pending_registrations").upsert({
    email,
    username,
    password_hash,
    ip,
    expires_at: expiresAt,
  }, { onConflict: "email" });

  if (pendingError) {
    console.error("Pending registration error:", pendingError);
    res.status(500).json({ error: "Failed to start registration" });
    return;
  }

  const { error: otpError } = await supabaseAdmin.from("otps").upsert(
    { email, otp, expires_at: expiresAt },
    { onConflict: "email" }
  );

  if (otpError) {
    console.error("OTP insert error:", otpError);
    res.status(500).json({ error: "Failed to save OTP" });
    return;
  }

  await sendOtpEmail(email, otp);
  res.status(200).json({ ok: true, message: "OTP sent" });
}