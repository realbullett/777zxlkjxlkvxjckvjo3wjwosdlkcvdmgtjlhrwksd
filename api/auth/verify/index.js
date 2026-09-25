import crypto from "crypto";

const Secret = process.env.SESSION_SECRET || "sire-dev-secret-do-not-use-in-prod";
const ConsumedTokens = new Set();

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
  } catch { return null; }
}

function ParseCookies(CookieHeader) {
  if (!CookieHeader) return {};
  const Result = {};
  String(CookieHeader).split(";").forEach((Pair) => {
    const [Key, ...Rest] = Pair.trim().split("=");
    if (Key) Result[Key.trim()] = Rest.join("=").trim();
  });
  return Result;
}

export default async function handler(req, res) {
  const MagicToken = req.query.token;
  const SessionToken = req.query.s;
  const Cookie = ParseCookies(req.headers.cookie);
  const CookieSession = Cookie?.sl_session;
  if (MagicToken) {
    if (ConsumedTokens.has(String(MagicToken))) { res.status(200).json({ authed: false }); return; }
    const Uid = UnsignToken(String(MagicToken));
    if (!Uid) { res.status(200).json({ authed: false }); return; }
    ConsumedTokens.add(String(MagicToken));
    const NewSession = SignUid(Uid);
    res.setHeader("Set-Cookie", `sl_session=${NewSession}; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}; Path=/`);
    res.status(200).json({ authed: true, uid: Uid, sessionToken: NewSession });
    return;
  }
  if (SessionToken) {
    const Uid = UnsignToken(String(SessionToken));
    if (!Uid) { res.status(200).json({ authed: false }); return; }
    res.status(200).json({ authed: true, uid: Uid });
    return;
  }
  if (CookieSession) {
    const Uid = UnsignToken(String(CookieSession));
    if (Uid) { res.status(200).json({ authed: true, uid: Uid }); return; }
  }
  res.status(200).json({ authed: false });
}
