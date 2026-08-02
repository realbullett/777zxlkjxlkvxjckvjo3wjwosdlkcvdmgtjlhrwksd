export default function handler(req, res) {
  const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  if (!CLIENT_ID) {
    res.status(500).json({ error: "DISCORD_CLIENT_ID not configured" });
    return;
  }

  const APP_URL = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
  const REDIRECT_URI = `${APP_URL}/api/auth/discord/callback`;

  const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20email%20guilds.join`;

  res.writeHead(302, { Location: url });
  res.end();
}
