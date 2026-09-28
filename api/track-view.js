import crypto from "crypto";
import { GetTurso, HasTurso } from "../lib/turso.js";
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

let AnalyticsEnsured = false;
async function EnsureAnalytics() {
  if (AnalyticsEnsured) return;
  AnalyticsEnsured = true;
  const Db = GetTurso();
  try {
    await Db.execute(`CREATE TABLE IF NOT EXISTS link_clicks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      platform TEXT NOT NULL DEFAULT '',
      ip_hash TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    )`);
    await Db.execute(`CREATE INDEX IF NOT EXISTS idx_link_clicks_user_time ON link_clicks (user_id, created_at)`);
  } catch {}
  for (const Col of ["country", "referrer", "device"]) {
    try { await Db.execute(`ALTER TABLE page_views ADD COLUMN ${Col} TEXT NOT NULL DEFAULT ''`); } catch {}
  }
}

function ParseDevice(Ua) {
  const s = String(Ua || "");
  if (/tablet|ipad|playbook|silk|kindle/i.test(s)) return "Tablet";
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|phone/i.test(s)) return "Mobile";
  return "Desktop";
}

function ParseReferrer(Ref) {
  const s = String(Ref || "").trim();
  if (!s) return "Direct";
  try {
    const U = new URL(s);
    if (/sire\.lol$/i.test(U.hostname)) return "Direct";
    return U.hostname.replace(/^www\./i, "").slice(0, 80) || "Direct";
  } catch { return "Direct"; }
}

async function TrackClick(UserId, Platform, IpHash) {
  const Db = GetTurso();
  const Target = await Db.execute({ sql: "SELECT id FROM users WHERE id = ?", args: [UserId] });
  if (!Target.rows?.length) return { status: 404 };
  const MinAgo = IsoAgo(60 * 1000);
  const Recent = await Db.execute({ sql: "SELECT COUNT(*) AS c FROM link_clicks WHERE user_id = ? AND ip_hash = ? AND created_at >= ?", args: [UserId, IpHash, MinAgo] });
  if (Number(Recent.rows?.[0]?.c || 0) >= 30) return { status: 429, body: { counted: false } };
  await Db.execute({ sql: "INSERT INTO link_clicks (user_id, platform, ip_hash) VALUES (?, ?, ?)", args: [UserId, Platform, IpHash] });
  return { status: 200, body: { counted: true } };
}

async function TrackTurso(UserId, VisitorId, IpHash, Country, Referrer, Device) {
  const Db = GetTurso();
  const Since10 = IsoAgo(10 * 1000);
  const Since20 = IsoAgo(20 * 1000);
  const Since60 = IsoAgo(60 * 1000);
  const SevenAgo = IsoAgo(7 * 24 * 60 * 60 * 1000);
  const Target = await Db.execute({ sql: "SELECT id, views_blacklisted FROM users WHERE id = ?", args: [UserId] });
  const Row = Target.rows?.[0];
  if (!Row) return { status: 404 };
  if (Number(Row.views_blacklisted) === 1) return { status: 200, body: { counted: false, blacklisted: true } };
  const Burst10 = await Db.execute({ sql: "SELECT COUNT(*) AS c FROM page_views WHERE user_id = ? AND viewed_at >= ?", args: [UserId, Since10] });
  if (Number(Burst10.rows?.[0]?.c || 0) > 30) {
    await Db.execute({ sql: "DELETE FROM page_views WHERE user_id = ? AND viewed_at >= ?", args: [UserId, Since10] });
    return { status: 429, body: { counted: false, rolledBack: true } };
  };
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
  await Db.execute({ sql: "INSERT INTO page_views (user_id, visitor_id, ip_hash, country, referrer, device) VALUES (?, ?, ?, ?, ?, ?)", args: [UserId, VisitorId, IpHash, Country, Referrer, Device] });
  return { status: 200, body: { counted: true, source: "turso" } };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const Body = req.body || {};
  if (!HasTurso()) { res.status(500).json({ error: "No DB configured" }); return; }
  const IpHash = hashIp(getClientIp(req));
  try {
    await EnsureAnalytics();
    if (Body.type === "click") {
      const Platform = String(Body.platform || "").trim().slice(0, 40);
      if (!Number.isInteger(Body.user_id) || !Platform) { res.status(400).json({ error: "Missing fields" }); return; }
      const Out = await TrackClick(Body.user_id, Platform, IpHash);
      if (Out.status === 404) { res.status(404).json({ error: "User not found" }); return; }
      res.status(Out.status).json(Out.body || { counted: false });
      return;
    }
  } catch (Err) {
    console.error("track-view click fail:", Err);
    res.status(500).json({ error: "Failed to track click" });
    return;
  }

  const { user_id, visitor_id, dwell_ms } = Body;
  if (!Number.isInteger(user_id) || typeof visitor_id !== "string" || !visitor_id.trim()) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }
  if (!Number.isInteger(dwell_ms) || dwell_ms < 5000) {
    res.status(200).json({ counted: false });
    return;
  }

  const Visitor = visitor_id.trim();
  const Country = String(req.headers["x-vercel-ip-country"] || "").toUpperCase().slice(0, 2);
  const Referrer = ParseReferrer(Body.referrer);
  const Device = ParseDevice(req.headers["user-agent"]);
  try {
    const Out = await TrackTurso(user_id, Visitor, IpHash, Country, Referrer, Device);
    if (Out.status !== 404) { res.status(Out.status).json(Out.body || { counted: false }); return; }
    res.status(404).json({ error: "User not found" });
  } catch (Err) {
    console.error("track-view turso fail:", Err);
    res.status(500).json({ error: "Failed to track view" });
  }
}
