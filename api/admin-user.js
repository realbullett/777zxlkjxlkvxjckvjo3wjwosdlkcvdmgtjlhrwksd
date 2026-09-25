import crypto from "crypto";
import { GetTurso, HasTurso } from "./_lib/turso.js";

const Secret = process.env.SESSION_SECRET || "sire-dev-secret-do-not-use-in-prod";

function UnsignToken(Token) {
  try {
    const Payload = Buffer.from(Token, "base64url").toString();
    const Colon = Payload.indexOf(":");
    if (Colon === -1) return null;
    const Uid = Payload.slice(0, Colon);
    const Sig = Payload.slice(Colon + 1);
    const Expected = crypto.createHmac("sha256", Secret).update(Uid).digest("hex");
    if (Sig !== Expected || !Uid) return null;
    return Number(Uid);
  } catch { return null; }
}

export default async function handler(req, res) {
  const Uid = UnsignToken(req.query.sessionToken || req.query.s);
  if (Uid !== 1) { res.status(403).json({ error: "Forbidden" }); return; }
  const Name = String(req.query.u || req.query.username || "").trim().toLowerCase();
  if (!Name) { res.status(400).json({ error: "Missing username" }); return; }
  if (!HasTurso()) { res.status(500).json({ error: "No DB configured" }); return; }
  try {
    const Db = GetTurso();
    const UserRs = await Db.execute({ sql: "SELECT id, username, alias FROM users WHERE username = ? OR alias = ? LIMIT 1", args: [Name, Name] });
    const Found = UserRs.rows?.[0] || null;
    if (!Found) { res.status(200).json({ user: null, badges: [] }); return; }
    const BadgeRs = await Db.execute({ sql: "SELECT badge FROM badges WHERE user_id = ?", args: [Found.id] });
    res.status(200).json({ user: Found, badges: (BadgeRs.rows || []).map((R) => R.badge) });
  } catch (Err) {
    res.status(500).json({ error: "Failed" });
  }
}
