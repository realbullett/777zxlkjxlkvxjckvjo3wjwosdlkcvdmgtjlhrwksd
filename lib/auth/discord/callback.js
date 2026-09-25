import crypto from "crypto";
import { GetTurso } from "../../turso.js";

const Secret = process.env.SESSION_SECRET || "sire-dev-secret-do-not-use-in-prod";

function SignUid(Uid) {
  const Payload = `${Uid}:${crypto.createHmac("sha256", Secret).update(String(Uid)).digest("hex")}`;
  return Buffer.from(Payload).toString("base64url");
}

function UnsignToken(Token) {
  try {
    const Payload = Buffer.from(String(Token), "base64url").toString();
    const Colon = Payload.indexOf(":");
    if (Colon === -1) return null;
    const Uid = Payload.slice(0, Colon);
    const Sig = Payload.slice(Colon + 1);
    const Expected = crypto.createHmac("sha256", Secret).update(Uid).digest("hex");
    if (Sig !== Expected || !Uid) return null;
    return Number(Uid);
  } catch {
    return null;
  }
}

function GetSessionUid(Req) {
  const Raw = (Req.headers.cookie || "").match(/(?:^|;\s*)sl_session=([^;]+)/)?.[1];
  if (!Raw) return null;
  try {
    return UnsignToken(decodeURIComponent(Raw));
  } catch {
    return null;
  }
}

const DefaultColors = {
  accent_color: "rgba(255, 255, 255, 0.05)",
  text_color: "#ffffff",
  background_color: "#080808",
  icon_color: "#ffffff",
  bg_effect_color: "rgba(255, 255, 255, 0.08)",
  primary_color: "rgba(255, 255, 255, 0.1)",
  secondary_color: "rgba(255, 255, 255, 0.15)",
};

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

export default async function handler(req, res) {
  const ClientId = process.env.DISCORD_CLIENT_ID;
  const ClientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!ClientId || !ClientSecret) {
    res.status(500).json({ error: "Discord OAuth not configured" });
    return;
  }
  const { code: Code } = req.query || {};
  if (!Code) {
    res.status(400).json({ error: "Missing authorization code" });
    return;
  }
  const AppUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
  const RedirectUri = `${AppUrl}/api/auth/discord/callback`;
  try {
    const TokenRes = await fetch("https://discord.com/api/oauth2/token", {
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
      console.error("Discord token error:", ErrText);
      res.status(500).json({ error: "Token exchange failed" });
      return;
    }
    const { access_token: AccessToken } = await TokenRes.json();
    const UserRes = await fetch("https://discord.com/api/users/@me", { headers: { Authorization: `Bearer ${AccessToken}` } });
    const User = await UserRes.json();
    const DiscordId = String(User.id);
    const DiscordName = User.global_name || User.username;
    const AvatarUrl = `https://cdn.discordapp.com/avatars/${User.id}/${User.avatar}.png`;
    const Db = GetTurso();
    if (!Db) { res.status(500).json({ error: "turso not configured" }); return; }
    const SessionUid = GetSessionUid(req);
    let Uid;
    if (SessionUid) {
      const CurRs = await Db.execute({ sql: "SELECT id, provider, provider_id, discord_id FROM users WHERE id = ? LIMIT 1", args: [SessionUid] });
      const Current = CurRs.rows?.[0];
      if (!Current) {
        res.status(401).json({ error: "Account not found" });
        return;
      }
      if (Current.discord_id === DiscordId || (Current.provider === "discord" && Current.provider_id === DiscordId)) {
        Uid = Current.id;
      } else {
        const ClashIdRs = await Db.execute({ sql: "SELECT id FROM users WHERE discord_id = ? AND id != ? LIMIT 1", args: [DiscordId, Current.id] });
        const ClashProvRs = await Db.execute({ sql: "SELECT id FROM users WHERE provider = 'discord' AND provider_id = ? AND id != ? LIMIT 1", args: [DiscordId, Current.id] });
        if ((ClashIdRs.rows?.length || 0) > 0 || (ClashProvRs.rows?.length || 0) > 0) {
          res.status(409).json({ error: "This Discord account is already linked to a different sire.lol account." });
          return;
        }
        try {
          await Db.execute({ sql: "UPDATE users SET discord_id = ?, avatar_url = ? WHERE id = ?", args: [DiscordId, AvatarUrl, Current.id] });
        } catch (UpErr) {
          console.error("Discord link error:", UpErr);
          res.status(500).json({ error: "Failed to link Discord" });
          return;
        }
        Uid = Current.id;
      }
    } else {
      const ByLinkedRs = await Db.execute({ sql: "SELECT id FROM users WHERE discord_id = ? LIMIT 1", args: [DiscordId] });
      const ByLinked = ByLinkedRs.rows?.[0];
      if (ByLinked) {
        Uid = ByLinked.id;
      } else {
        const LegacyRs = await Db.execute({ sql: "SELECT id FROM users WHERE provider = 'discord' AND provider_id = ? LIMIT 1", args: [DiscordId] });
        const Legacy = LegacyRs.rows?.[0];
        if (Legacy) {
          Uid = Legacy.id;
          await Db.execute({ sql: "UPDATE users SET discord_id = ? WHERE id = ?", args: [DiscordId, Legacy.id] });
        } else {
          const Username = await MakeUniqueUsername(DiscordName, Db);
          try {
            const Ins = await Db.execute({
              sql: "INSERT INTO users (provider, provider_id, username, email, avatar_url, discord_id, accent_color, text_color, background_color, icon_color, bg_effect_color, primary_color, secondary_color, panel_opacity) VALUES ('discord', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)",
              args: [DiscordId, Username, User.email || null, AvatarUrl, DiscordId, DefaultColors.accent_color, DefaultColors.text_color, DefaultColors.background_color, DefaultColors.icon_color, DefaultColors.bg_effect_color, DefaultColors.primary_color, DefaultColors.secondary_color]
            });
            Uid = Number(Ins.lastInsertRowid);
          } catch (InsErr) {
            console.error("User creation error:", InsErr);
            res.status(500).json({ error: "User creation failed" });
            return;
          }
        }
      }
    }
    const BotToken = process.env.DISCORD_BOT_TOKEN;
    const GuildId = process.env.DISCORD_GUILD_ID;
    if (BotToken && GuildId) {
      fetch(`https://discord.com/api/guilds/${GuildId}/members/${User.id}`, {
        method: "PUT",
        headers: { "Authorization": `Bot ${BotToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: AccessToken }),
      }).catch(() => {});
    }
    const Signed = SignUid(Uid);
    res.setHeader("Set-Cookie", `sl_session=${Signed}; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}; Path=/`);
    res.writeHead(302, { Location: `${AppUrl}/auth?discord_success=true&uid=${Uid}&token=${encodeURIComponent(Signed)}` });
    res.end();
  } catch (Err) {
    console.error("Discord callback error:", Err);
    res.status(500).json({ error: "Internal server error" });
  }
}
