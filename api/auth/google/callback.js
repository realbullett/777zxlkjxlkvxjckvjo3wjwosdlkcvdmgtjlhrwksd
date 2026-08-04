import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null;
const SECRET = process.env.SESSION_SECRET || "sire-dev-secret-do-not-use-in-prod";

function signUid(uid) {
  const payload = `${uid}:${crypto.createHmac("sha256", SECRET).update(String(uid)).digest("hex")}`;
  return Buffer.from(payload).toString("base64url");
}

async function upsertUser(provider, providerId, username, email, avatarUrl) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("upsert_user_preserve_username", {
    p_provider: provider,
    p_provider_id: providerId,
    p_username: username,
    p_email: email,
    p_avatar_url: avatarUrl,
  });
  if (error) { console.error("Supabase upsert error:", error); return null; }
  return data?.[0]?.id ?? null;
}

export default async function handler(req, res) {
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    res.status(500).json({ error: "Google OAuth not configured" });
    return;
  }

  const { code } = req.query;
  if (!code) {
    res.status(400).json({ error: "Missing authorization code" });
    return;
  }

  const APP_URL = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
  const REDIRECT_URI = `${APP_URL}/api/auth/google/callback`;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Google token error:", err);
      res.status(500).json({ error: "Token exchange failed" });
      return;
    }

    const { access_token } = await tokenRes.json();
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { Authorization: `Bearer ${access_token}` } });
    const user = await userRes.json();
    const uid = await upsertUser("google", user.id, user.name, user.email, user.picture);
    if (!uid) { res.status(500).json({ error: "User creation failed" }); return; }

    const signed = signUid(uid);
    res.setHeader("Set-Cookie", `sl_session=${signed}; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}; Path=/`);
    res.writeHead(302, { Location: `${APP_URL}/auth?google_success=true&uid=${uid}&token=${encodeURIComponent(signed)}` });
    res.end();
  } catch (err) {
    console.error("Google callback error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
