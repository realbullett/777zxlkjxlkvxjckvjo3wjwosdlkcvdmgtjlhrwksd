export default function handler(req, res) {
  const ClientId = process.env.GOOGLE_CLIENT_ID;
  if (!ClientId) {
    res.status(500).json({ error: "GOOGLE_CLIENT_ID not configured" });
    return;
  }
  const AppUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
  const RedirectUri = `${AppUrl}/api/auth/google/callback`;
  const Url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${ClientId}&redirect_uri=${encodeURIComponent(RedirectUri)}&response_type=code&scope=openid%20email%20profile`;
  res.writeHead(302, { Location: Url });
  res.end();
}
