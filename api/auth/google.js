export default function handler(req, res) {
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  if (!CLIENT_ID) {
    res.status(500).json({ error: "GOOGLE_CLIENT_ID not configured" });
    return;
  }

  const APP_URL = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
  const REDIRECT_URI = `${APP_URL}/api/auth/google/callback`;

  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=openid%20email%20profile`;

  res.writeHead(302, { Location: url });
  res.end();
}
