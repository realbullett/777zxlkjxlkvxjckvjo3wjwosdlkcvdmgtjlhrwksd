import crypto from "crypto";
import { GetTurso } from "../../turso.js";

const Secret = process.env.SESSION_SECRET || "sire-dev-secret-do-not-use-in-prod";

function SignUid(Uid) {
  const Payload = `${Uid}:${crypto.createHmac("sha256", Secret).update(String(Uid)).digest("hex")}`;
  return Buffer.from(Payload).toString("base64url");
}

async function MakeUniqueUsername(Base, Db) {
  const Sanitized = String(Base || "user").replace(/[^a-zA-Z0-9_]/g, "").toLowerCase().slice(0, 20) || "user";
  let Username = Sanitized;
  let I = 1;
  for (;;) {
    const Rs = await Db.execute({ sql: "SELECT id FROM users WHERE username = ? LIMIT 1", args: [Username] });
    if ((Rs.rows?.length || 0) === 0) return Username;
    Username = `${Sanitized}_${I}`.slice(0, 24);
    I += 1;
  }
}

async function UpsertUser(Provider, ProviderId, Username, Email, AvatarUrl, Db) {
  const ExistingRs = await Db.execute({ sql: "SELECT id, username FROM users WHERE provider = ? AND provider_id = ? LIMIT 1", args: [Provider, String(ProviderId)] });
  const Existing = ExistingRs.rows?.[0];
  if (Existing) {
    await Db.execute({ sql: "UPDATE users SET email = ?, avatar_url = ? WHERE id = ?", args: [Email || null, AvatarUrl || null, Existing.id] });
    return Number(Existing.id);
  }
  let FinalName = String(Username || "user").replace(/[^a-zA-Z0-9_]/g, "").toLowerCase().slice(0, 20) || "user";
  FinalName = await MakeUniqueUsername(FinalName, Db);
  const Ins = await Db.execute({
    sql: "INSERT INTO users (provider, provider_id, username, email, avatar_url, accent_color, text_color, background_color, icon_color, bg_effect_color, primary_color, secondary_color, panel_opacity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)",
    args: [Provider, String(ProviderId), FinalName, Email || null, AvatarUrl || null, "rgba(255, 255, 255, 0.05)", "#ffffff", "#080808", "#ffffff", "rgba(255, 255, 255, 0.08)", "rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.15)"]
  });
  return Number(Ins.lastInsertRowid);
}

export default async function handler(req, res) {
  const ClientId = process.env.GOOGLE_CLIENT_ID;
  const ClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!ClientId || !ClientSecret) {
    res.status(500).json({ error: "Google OAuth not configured" });
    return;
  }
  const { code: Code } = req.query || {};
  if (!Code) {
    res.status(400).json({ error: "Missing authorization code" });
    return;
  }
  const AppUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
  const RedirectUri = `${AppUrl}/api/auth/google/callback`;
  try {
    const TokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: ClientId,
        client_secret: ClientSecret,
        grant_type: "authorization_code",
        code: String(Code),
        redirect_uri: RedirectUri,
      }),
    });
    if (!TokenRes.ok) {
      const ErrText = await TokenRes.text();
      console.error("Google token error:", ErrText);
      res.status(500).json({ error: "Token exchange failed" });
      return;
    }
    const { access_token: AccessToken } = await TokenRes.json();
    const UserRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { Authorization: `Bearer ${AccessToken}` } });
    const User = await UserRes.json();
    const Db = GetTurso();
    if (!Db) { res.status(500).json({ error: "turso not configured" }); return; }
    let Uid = null;
    try {
      Uid = await UpsertUser("google", String(User.id), User.name, User.email, User.picture, Db);
    } catch (UpErr) {
      console.error("Google upsert error:", UpErr);
    }
    if (!Uid) { res.status(500).json({ error: "User creation failed" }); return; }
    const Signed = SignUid(Uid);
    res.setHeader("Set-Cookie", `sl_session=${Signed}; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}; Path=/`);
    res.writeHead(302, { Location: `${AppUrl}/auth?google_success=true&uid=${Uid}&token=${encodeURIComponent(Signed)}` });
    res.end();
  } catch (Err) {
    console.error("Google callback error:", Err);
    res.status(500).json({ error: "Internal server error" });
  }
}
