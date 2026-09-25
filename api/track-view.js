import crypto from "crypto";
import { GetTurso, HasTurso } from "./_lib/turso.js";
const IP_PEPPER = process.env.VIEW_IP_PEPPER || process.env.SESSION_SECRET || "sire-view-ip-secret";

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

function hashIp(ip) {
  return crypto.createHmac("sha256", IP_PEPPER).update(String(ip)).digest("hex");
}

function IsoAgo(Ms) {
  return new Date(Date.now() - Ms).toISOString();
}

async function TrackTurso(UserId, VisitorId, IpHash) {
  const Db = GetTurso();
  const Since20 = IsoAgo(20 * 1000);
  const Since60 = IsoAgo(60 * 1000);
  const SevenAgo = IsoAgo(7 * 24 * 60 * 60 * 1000);
  const Target = await Db.execute({ sql: "SELECT id, views_blacklisted FROM users WHERE id = ?", args: [UserId] });
  const Row = Target.rows?.[0];
  if (!Row) return { status: 404 };
  if (Number(Row.views_blacklisted) === 1) return { status: 200, body: { counted: false, blacklisted: true } };
  const IpCount = await Db.execute({ sql: "SELECT COUNT(*) AS c FROM page_views WHERE user_id = ? AND ip_hash = ? AND viewed_at >= ?", args: [UserId, IpHash, Since20] });
  if (Number(IpCount.rows?.[0]?.c || 0) >= 8) {
    await Db.execute({ sql: "DELETE FROM page_views WHERE user_id = ? AND ip_hash = ? AND viewed_at >= ?", args: [UserId, IpHash, Since20] });
    return { status: 429, body: { counted: false } };
  }
  const [C20, C60] = await Promise.all([
    Db.execute({ sql: "SELECT COUNT(*) AS c FROM page_views WHERE user_id = ? AND viewed_at >= ?", args: [UserId, Since20] }),
    Db.execute({ sql: "SELECT COUNT(*) AS c FROM page_views WHERE user_id = ? AND viewed_at >= ?", args: [UserId, Since60] })
  ]);
  if (Number(C20.rows?.[0]?.c || 0) >= 10) {
    await Db.execute({ sql: "DELETE FROM page_views WHERE user_id = ? AND viewed_at >= ?", args: [UserId, Since20] });
    return { status: 429, body: { counted: false } };
  }
  if (Number(C60.rows?.[0]?.c || 0) >= 50) {
    await Db.execute({ sql: "DELETE FROM page_views WHERE user_id = ? AND viewed_at >= ?", args: [UserId, Since60] });
    return { status: 429, body: { counted: false } };
  }
  const ByIp = await Db.execute({ sql: "SELECT id FROM page_views WHERE user_id = ? AND ip_hash = ? AND viewed_at >= ? LIMIT 1", args: [UserId, IpHash, SevenAgo] });
  if (ByIp.rows?.length) return { status: 200, body: { counted: false } };
  const ByVis = await Db.execute({ sql: "SELECT id FROM page_views WHERE user_id = ? AND visitor_id = ? AND viewed_at >= ? LIMIT 1", args: [UserId, VisitorId, SevenAgo] });
  if (ByVis.rows?.length) return { status: 200, body: { counted: false } };
  await Db.execute({ sql: "INSERT INTO page_views (user_id, visitor_id, ip_hash) VALUES (?, ?, ?)", args: [UserId, VisitorId, IpHash] });
  return { status: 200, body: { counted: true, source: "turso" } };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { user_id, visitor_id, dwell_ms } = req.body || {};
  if (!Number.isInteger(user_id) || typeof visitor_id !== "string" || !visitor_id.trim()) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }
  if (!Number.isInteger(dwell_ms) || dwell_ms < 3000) {
    res.status(200).json({ counted: false });
    return;
  }

  const IpHash = hashIp(getClientIp(req));
  const Visitor = visitor_id.trim();
  if (!HasTurso()) { res.status(500).json({ error: "No DB configured" }); return; }
  try {
    const Out = await TrackTurso(user_id, Visitor, IpHash);
    if (Out.status !== 404) { res.status(Out.status).json(Out.body || { counted: false }); return; }
    res.status(404).json({ error: "User not found" });
  } catch (Err) {
    console.error("track-view turso fail:", Err);
    res.status(500).json({ error: "Failed to track view" });
  }
}
