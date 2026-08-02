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

function unsignToken(token) {
  try {
    const payload = Buffer.from(token, "base64url").toString();
    const colon = payload.indexOf(":");
    if (colon === -1) return null;
    const uid = payload.slice(0, colon);
    const sig = payload.slice(colon + 1);
    const expected = crypto.createHmac("sha256", SECRET).update(uid).digest("hex");
    if (sig !== expected || !uid) return null;
    return Number(uid);
  } catch {
    return null;
  }
}

function getSessionUid(req) {
  const raw = (req.headers.cookie || "").match(/(?:^|;\s*)sl_session=([^;]+)/)?.[1];
  if (!raw) return null;
  try {
    return unsignToken(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

const DEFAULT_COLORS = {
  accent_color: "rgba(255, 255, 255, 0.05)",
  text_color: "#ffffff",
  background_color: "#080808",
  icon_color: "#ffffff",
  bg_effect_color: "rgba(255, 255, 255, 0.08)",
  primary_color: "rgba(255, 255, 255, 0.1)",
  secondary_color: "rgba(255, 255, 255, 0.15)",
};

async function makeUniqueUsername(base) {
  const sanitized = String(base || "user").replace(/[^a-zA-Z0-9_]/g, "").toLowerCase().slice(0, 20) || "user";
  let username = sanitized;
  let i = 1;
  for (;;) {
    const { data } = await supabase.from("users").select("id").eq("username", username).maybeSingle();
    if (!data) return username;
    username = `${sanitized}_${i}`.slice(0, 24);
    i += 1;
  }
}

export default async function handler(req, res) {
  const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    res.status(500).json({ error: "Discord OAuth not configured" });
    return;
  }

  const { code } = req.query;
  if (!code) {
    res.status(400).json({ error: "Missing authorization code" });
    return;
  }

  const APP_URL = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
  const REDIRECT_URI = `${APP_URL}/api/auth/discord/callback`;

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
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
      console.error("Discord token error:", err);
      res.status(500).json({ error: "Token exchange failed" });
      return;
    }

    const { access_token } = await tokenRes.json();
    const userRes = await fetch("https://discord.com/api/users/@me", { headers: { Authorization: `Bearer ${access_token}` } });
    const user = await userRes.json();

    const discordId = String(user.id);
    const discordName = user.global_name || user.username;
    const avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;

    if (!supabase) { res.status(500).json({ error: "Supabase not configured" }); return; }

    const sessionUid = getSessionUid(req);
    let uid;

    if (sessionUid) {
      // Already logged in -> LINK Discord to the existing account, never create a new one.
      const { data: current, error: curErr } = await supabase
        .from("users")
        .select("id, provider, provider_id, discord_id")
        .eq("id", sessionUid)
        .maybeSingle();
      if (curErr || !current) {
        res.status(401).json({ error: "Account not found" });
        return;
      }

      if (current.discord_id === discordId || (current.provider === "discord" && current.provider_id === discordId)) {
        uid = current.id;
      } else {
        const { data: clashById } = await supabase.from("users").select("id").eq("discord_id", discordId).neq("id", current.id).limit(1).maybeSingle();
        const { data: clashByProvider } = await supabase.from("users").select("id").eq("provider", "discord").eq("provider_id", discordId).neq("id", current.id).limit(1).maybeSingle();
        if (clashById || clashByProvider) {
          res.status(409).json({ error: "This Discord account is already linked to a different sire.lol account." });
          return;
        }

        const { error: upErr } = await supabase
          .from("users")
          .update({ discord_id: discordId, avatar_url: avatarUrl })
          .eq("id", current.id);
        if (upErr) {
          console.error("Discord link error:", upErr);
          res.status(500).json({ error: "Failed to link Discord" });
          return;
        }
        uid = current.id;
      }
    } else {
      // Not logged in -> sign in (or sign up) with Discord.
      const { data: byLinked } = await supabase.from("users").select("id").eq("discord_id", discordId).maybeSingle();
      if (byLinked) {
        uid = byLinked.id;
      } else {
        const { data: legacy } = await supabase.from("users").select("id").eq("provider", "discord").eq("provider_id", discordId).maybeSingle();
        if (legacy) {
          uid = legacy.id;
          await supabase.from("users").update({ discord_id: discordId }).eq("id", legacy.id);
        } else {
          const username = await makeUniqueUsername(discordName);
          const { data: created, error: insertError } = await supabase.from("users").insert({
            provider: "discord",
            provider_id: discordId,
            username,
            email: user.email || null,
            avatar_url: avatarUrl,
            discord_id: discordId,
            ...DEFAULT_COLORS,
          }).select("id").single();
          if (insertError || !created) {
            console.error("User creation error:", insertError);
            res.status(500).json({ error: "User creation failed" });
            return;
          }
          uid = created.id;
        }
      }
    }

    const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
    const GUILD_ID = process.env.DISCORD_GUILD_ID;
    if (BOT_TOKEN && GUILD_ID) {
      fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${user.id}`, {
        method: "PUT",
        headers: { "Authorization": `Bot ${BOT_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ access_token }),
      }).catch(() => {});
    }

    const signed = signUid(uid);
    res.setHeader("Set-Cookie", `sl_session=${signed}; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}; Path=/`);
    res.writeHead(302, { Location: `${APP_URL}/auth?discord_success=true&uid=${uid}&token=${encodeURIComponent(signed)}` });
    res.end();
  } catch (err) {
    console.error("Discord callback error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
