import { VerifyTurnstile } from "../lib/auth/register.js";

function getClientIp(req) {
  const xvf = req.headers["x-vercel-forwarded-for"];
  if (xvf) return String(xvf).split(",")[0].trim();
  const xri = req.headers["x-real-ip"];
  if (xri) return String(xri).split(",")[0].trim();
  const xff = req.headers["x-forwarded-for"];
  if (xff) {
    const parts = String(xff).split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return req.socket?.remoteAddress || "unknown";
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ ok: false, error: "Method not allowed" }); return; }
  const Token = String(req.body?.token || "");
  if (!Token) { res.status(400).json({ ok: false, error: "Missing token" }); return; }
  const Ok = await VerifyTurnstile(Token, getClientIp(req));
  if (!Ok) { res.status(400).json({ ok: false, error: "Verification failed" }); return; }
  res.status(200).json({ ok: true });
}
