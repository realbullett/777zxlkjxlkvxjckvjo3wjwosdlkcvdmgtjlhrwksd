export default function handler(req, res) {
  const ClientId = process.env.DISCORD_CLIENT_ID;
  if (!ClientId) {
    res.status(500).json({ error: "DISCORD_CLIENT_ID not configured" });
    return;
  }
  const AppUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
  const RedirectUri = `${AppUrl}/api/auth/discord/callback`;
  const Url = `https://discord.com/api/oauth2/authorize?client_id=${ClientId}&redirect_uri=${encodeURIComponent(RedirectUri)}&response_type=code&scope=identify%20email%20guilds.join`;
  res.writeHead(302, { Location: Url });
  res.end();
}
