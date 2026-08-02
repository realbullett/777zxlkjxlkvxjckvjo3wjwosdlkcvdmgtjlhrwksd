import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null;
const SECRET = process.env.SESSION_SECRET || "sire-dev-secret-do-not-use-in-prod";

function signUid(uid) {
  const payload = `${uid}:${crypto.createHmac("sha256", SECRET).update(String(uid)).digest("hex")}`;
  return Buffer.from(payload).toString("base64url");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { email, otp } = req.body;
  if (!email || !otp) { res.status(400).json({ error: "Missing fields" }); return; }

  if (!supabaseAdmin) { res.status(500).json({ error: "Supabase not configured" }); return; }

  // Get pending registration
  const { data: pending, error: pendingError } = await supabaseAdmin
    .from("pending_registrations")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (pendingError || !pending) {
    res.status(400).json({ error: "No pending registration for this email" });
    return;
  }

  // Check OTP
  const { data: stored } = await supabaseAdmin.from("otps").select("*").eq("email", email).maybeSingle();
  if (!stored || stored.otp !== otp || new Date(stored.expires_at) < new Date()) {
    res.status(400).json({ error: "Invalid or expired OTP" });
    return;
  }

  // Delete OTP
  await supabaseAdmin.from("otps").delete().eq("email", email);

  // Create user
  const { data: user, error: userError } = await supabaseAdmin.from("users").insert({
    provider: "email",
    provider_id: email,
    username: pending.username,
    email: pending.email,
    password_hash: pending.password_hash,
    email_verified: true,
    accent_color: "rgba(255, 255, 255, 0.05)",
    text_color: "#ffffff",
    background_color: "#080808",
    icon_color: "#ffffff",
    bg_effect_color: "rgba(255, 255, 255, 0.08)",
    primary_color: "rgba(255, 255, 255, 0.1)",
    secondary_color: "rgba(255, 255, 255, 0.15)",
  }).select("id").single();

  if (userError || !user) {
    console.error("User creation error:", userError);
    res.status(500).json({ error: "Failed to create account" });
    return;
  }

  // Log IP registration
  await supabaseAdmin.from("ip_registrations").insert({ ip: pending.ip });

  // Delete pending registration
  await supabaseAdmin.from("pending_registrations").delete().eq("email", email);

  const signed = signUid(user.id);
  res.setHeader("Set-Cookie", `sl_session=${signed}; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}; Path=/`);
  res.status(200).json({ ok: true, uid: user.id, sessionToken: signed });
}