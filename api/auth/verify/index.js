import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET || "sire-dev-secret-do-not-use-in-prod";
const consumedTokens = new Set();

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
  } catch { return null; }
}

export default async function handler(req, res) {
  const magicToken = req.query.token;
  const sessionToken = req.query.s;
  const cookie = parseCookies(req.headers.cookie);
  const cookieSession = cookie?.sl_session;

  if (magicToken) {
    if (consumedTokens.has(magicToken)) { res.status(200).json({ authed: false }); return; }
    const uid = unsignToken(magicToken);
    if (!uid) { res.status(200).json({ authed: false }); return; }
    consumedTokens.add(magicToken);
    const newSession = signUid(uid);
    res.setHeader("Set-Cookie", `sl_session=${newSession}; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}; Path=/`);
    res.status(200).json({ authed: true, uid, sessionToken: newSession });
    return;
  }

  if (sessionToken) {
    const uid = unsignToken(sessionToken);
    if (!uid) { res.status(200).json({ authed: false }); return; }
    res.status(200).json({ authed: true, uid });
    return;
  }

  if (cookieSession) {
    const uid = unsignToken(cookieSession);
    if (uid) { res.status(200).json({ authed: true, uid }); return; }
  }

  res.status(200).json({ authed: false });
}

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  const result = {};
  cookieHeader.split(";").forEach((pair) => {
    const [key, ...rest] = pair.trim().split("=");
    if (key) result[key.trim()] = rest.join("=").trim();
  });
  return result;
}
