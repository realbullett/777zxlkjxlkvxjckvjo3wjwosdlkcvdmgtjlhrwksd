import crypto from "crypto";
import { GetTurso, HasTurso } from "./_lib/turso.js";

const Secret = process.env.SESSION_SECRET || "sire-dev-secret-do-not-use-in-prod";

function UnsignToken(Token) {
  try {
    if (!Token) return null;
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

async function EnsureTables(Db) {
  await Db.execute("CREATE TABLE IF NOT EXISTS template_installs (user_id INTEGER, template_user_id INTEGER, created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), PRIMARY KEY (user_id, template_user_id))");
  await Db.execute("CREATE TABLE IF NOT EXISTS template_favorites (user_id INTEGER, template_user_id INTEGER, created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), PRIMARY KEY (user_id, template_user_id))");
}

export default async function handler(req, res) {
  if (!HasTurso()) { res.status(500).json({ error: "No DB configured" }); return; }
  try {
    const Db = GetTurso();
    await EnsureTables(Db);
    const Uid = UnsignToken(req.query.sessionToken || req.query.s);
    const ListRs = await Db.execute({ sql: "SELECT t.*, u.username, u.alias, u.avatar_url FROM templates t JOIN users u ON u.id = t.user_id ORDER BY t.created_at DESC LIMIT 200", args: [] });
    const Templates = (ListRs.rows || []).map((R) => {
      let Tags = [];
      try { Tags = typeof R.tags === "string" ? JSON.parse(R.tags) : (R.tags || []); } catch { Tags = []; }
      return { ...R, tags: Array.isArray(Tags) ? Tags : [] };
    });
    let Stats = {};
    try {
      const [InstallRs, FavRs, RecentRs] = await Promise.all([
        Db.execute({ sql: "SELECT template_user_id, COUNT(*) AS c FROM template_installs GROUP BY template_user_id", args: [] }),
        Db.execute({ sql: "SELECT template_user_id, COUNT(*) AS c FROM template_favorites GROUP BY template_user_id", args: [] }),
        Db.execute({ sql: "SELECT template_user_id, COUNT(*) AS c FROM template_installs WHERE created_at >= strftime('%Y-%m-%dT%H:%M:%fZ','now','-7 days') GROUP BY template_user_id", args: [] })
      ]);
      for (const R of InstallRs.rows || []) Stats[R.template_user_id] = { installs: Number(R.c || 0), stars: 0, recent_installs: 0 };
      for (const R of FavRs.rows || []) Stats[R.template_user_id] = { installs: Stats[R.template_user_id]?.installs || 0, stars: Number(R.c || 0), recent_installs: Stats[R.template_user_id]?.recent_installs || 0 };
      for (const R of RecentRs.rows || []) Stats[R.template_user_id] = { installs: Stats[R.template_user_id]?.installs || 0, stars: Stats[R.template_user_id]?.stars || 0, recent_installs: Number(R.c || 0) };
    } catch { Stats = {}; }
    let Mine = null;
    if (Uid) {
      const MineRs = await Db.execute({ sql: "SELECT user_id, tags FROM templates WHERE user_id = ? LIMIT 1", args: [Uid] });
      Mine = MineRs.rows?.[0] || null;
      if (Mine && typeof Mine.tags === "string") { try { Mine = { ...Mine, tags: JSON.parse(Mine.tags) }; } catch { Mine = { ...Mine, tags: [] }; } }
    }
    res.setHeader("Cache-Control", "public, max-age=30, s-maxage=60, stale-while-revalidate=300");
    res.status(200).json({ templates: Templates, stats: Stats, mine: Mine });
  } catch (Err) {
    res.status(500).json({ error: "Failed" });
  }
}
