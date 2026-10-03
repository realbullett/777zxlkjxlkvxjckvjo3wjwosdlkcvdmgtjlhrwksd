import crypto from "crypto";
import { GetTurso, HasTurso, PublicProfileCols } from "../lib/turso.js";
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

function ParseJson(V, Fallback) {
  if (V === null || V === undefined) return Fallback;
  if (typeof V !== "string") return V;
  const S = V.trim();
  if (!S) return Fallback;
  try { return JSON.parse(S); } catch { return Fallback; }
}

let VotesEnsured = false;
async function EnsureVotes(Db) {
  if (VotesEnsured) return;
  VotesEnsured = true;
  try {
    await Db.execute(`CREATE TABLE IF NOT EXISTS profile_votes (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      voter_key TEXT NOT NULL,
      vote INTEGER NOT NULL CHECK (vote IN (1, -1)),
      ip_hash TEXT,
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      UNIQUE (user_id, voter_key)
    )`);
    await Db.execute(`CREATE INDEX IF NOT EXISTS idx_profile_votes_user ON profile_votes (user_id)`);
    try { await Db.execute(`ALTER TABLE profile_votes ADD COLUMN ip_hash TEXT`); } catch {}
    try { await Db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_votes_user_ip ON profile_votes (user_id, ip_hash)`); } catch {}
  } catch {}
}

async function VoteCounts(Db, Uid) {
  const Rs = await Db.execute({
    sql: "SELECT SUM(CASE WHEN vote = 1 THEN 1 ELSE 0 END) AS likes, SUM(CASE WHEN vote = -1 THEN 1 ELSE 0 END) AS dislikes FROM profile_votes WHERE user_id = ?",
    args: [Uid]
  });
  return { likes: Number(Rs.rows?.[0]?.likes || 0), dislikes: Number(Rs.rows?.[0]?.dislikes || 0) };
}

function CleanVoter(V) {
  const S = String(V || "").trim().slice(0, 64);
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(S)) return null;
  return S;
}

function IsoAgo(Ms) {
  return new Date(Date.now() - Ms).toISOString();
}

const VoteHits = new Map();
function VoteRateOk(Ip) {
  const Now = Date.now();
  const Arr = (VoteHits.get(Ip) || []).filter((T) => Now - T < 60000);
  if (Arr.length >= 30) return false;
  Arr.push(Now);
  VoteHits.set(Ip, Arr);
  return true;
}

export default async function handler(req, res) {
  if (!HasTurso()) { res.status(500).json({ error: "No DB configured" }); return; }
  try {
    const Db = GetTurso();
    await EnsureVotes(Db);
    if (req.method === "POST") {
      const Body = req.body || {};
      const Name = String(Body.username || "").trim().toLowerCase();
      const Voter = CleanVoter(Body.voter);
      const Vote = Number(Body.vote);
      const Dwell = Number(Body.dwell_ms);
      if (!Name || !Voter || ![1, -1].includes(Vote)) { res.status(400).json({ error: "Bad vote" }); return; }
      const Ip = getClientIp(req);
      if (!VoteRateOk(Ip)) { res.status(429).json({ error: "Slow down" }); return; }
      const IpHash = hashIp(Ip);
      const Since10 = IsoAgo(10 * 1000);
      const Since20 = IsoAgo(20 * 1000);
      const Since60 = IsoAgo(60 * 1000);
      const IpBurst = await Db.execute({ sql: "SELECT COUNT(*) AS c FROM profile_votes WHERE ip_hash = ? AND created_at >= ?", args: [IpHash, Since20] });
      if (Number(IpBurst.rows?.[0]?.c || 0) >= 8) { res.status(429).json({ error: "Slow down" }); return; }
      const UidRs = await Db.batch([
        { sql: "SELECT id, username, suspended, hidden FROM users WHERE username = ? OR alias = ? LIMIT 2", args: [Name, Name] },
        { sql: "SELECT user_id, voter_key, vote FROM profile_votes WHERE ip_hash = ? LIMIT 100", args: [IpHash] }
      ]);
      const Rows = UidRs[0].rows || [];
      const Match = Rows.find((R) => String(R.username || "").toLowerCase() === Name) || Rows[0];
      if (!Match) { res.status(404).json({ error: "Not found" }); return; }
      if (Number(Match.suspended || 0) === 1 || Number(Match.hidden || 0) === 1) { res.status(404).json({ error: "Not found" }); return; }
      const Uid = Match.id;
      const [T10, T20, T60] = await Db.batch([
        { sql: "SELECT COUNT(*) AS c FROM profile_votes WHERE user_id = ? AND created_at >= ?", args: [Uid, Since10] },
        { sql: "SELECT COUNT(*) AS c FROM profile_votes WHERE user_id = ? AND created_at >= ?", args: [Uid, Since20] },
        { sql: "SELECT COUNT(*) AS c FROM profile_votes WHERE user_id = ? AND created_at >= ?", args: [Uid, Since60] }
      ]);
      if (Number(T10.rows?.[0]?.c || 0) > 30) {
        await Db.execute({ sql: "DELETE FROM profile_votes WHERE user_id = ? AND created_at >= ?", args: [Uid, Since10] });
        res.status(429).json({ error: "Slow down", rolledBack: true });
        return;
      }
      if (Number(T20.rows?.[0]?.c || 0) >= 10 || Number(T60.rows?.[0]?.c || 0) >= 50) {
        res.status(429).json({ error: "Slow down" });
        return;
      }
      const Had = (UidRs[1].rows || []).find((R) => Number(R.user_id) === Number(Uid))?.vote;
      if (!Number.isInteger(Dwell) || Dwell < 5000) {
        const C = await VoteCounts(Db, Uid);
        res.status(200).json({ likes: C.likes, dislikes: C.dislikes, mine: Number(Had || 0), counted: false });
        return;
      }
      let Mine = 0;
      if (Number(Had) === Vote) {
        await Db.execute({ sql: "DELETE FROM profile_votes WHERE user_id = ? AND ip_hash = ?", args: [Uid, IpHash] });
      } else {
        await Db.execute({ sql: "INSERT INTO profile_votes (user_id, voter_key, vote, ip_hash) VALUES (?, ?, ?, ?) ON CONFLICT (user_id, ip_hash) DO UPDATE SET vote = excluded.vote, voter_key = excluded.voter_key", args: [Uid, Voter, Vote, IpHash] });
        Mine = Vote;
      }
      const C = await VoteCounts(Db, Uid);
      res.status(200).json({ likes: C.likes, dislikes: C.dislikes, mine: Mine, counted: true });
      return;
    }
  const Name = String(req.query.username || req.query.u || "").trim().toLowerCase();
  if (!Name) { res.status(400).json({ error: "Missing username" }); return; }
  if (!HasTurso()) { res.status(500).json({ error: "No DB configured" }); return; }
    const Prof = await Db.execute({
      sql: `SELECT ${PublicProfileCols} FROM users WHERE username = ? OR alias = ? LIMIT 2`,
      args: [Name, Name]
    });
    const Rows = Prof.rows || [];
    const Match = Rows.find((R) => String(R.username || "").toLowerCase() === Name) || Rows[0];
    if (!Match) { res.status(404).json({ error: "Not found" }); return; }
    const Uid = Match.id;
    const FlagRs = await Db.execute({ sql: "SELECT suspended, hidden FROM users WHERE id = ?", args: [Uid] });
    if (Number(FlagRs.rows?.[0]?.suspended || 0) === 1 || Number(FlagRs.rows?.[0]?.hidden || 0) === 1) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    Match.widgets = ParseJson(Match.widgets, Match.widgets ?? []);
    Match.desc_lines = ParseJson(Match.desc_lines, Match.desc_lines ?? null);
    for (const K of ["show_username", "show_joindate", "video_audio", "monochrome_icons", "monochrome_badges", "banner_enabled", "panel_mouse_follow", "audio_autoplay", "audio_loop", "audio_shuffle", "panel_hidden", "discord_rpc_enabled", "views_blacklisted"]) {
      if (Match[K] !== undefined && Match[K] !== null && typeof Match[K] === "number") Match[K] = !!Match[K];
    }
    const [CountRs, BadgeRs, LinkRs, AssetRs, HostedRs, VoteRs] = await Promise.all([
      Db.execute({ sql: "SELECT COUNT(*) AS c FROM page_views WHERE user_id = ?", args: [Uid] }),
      Db.execute({ sql: "SELECT badge FROM badges WHERE user_id = ?", args: [Uid] }),
      Db.execute({ sql: "SELECT platform, url FROM links WHERE user_id = ?", args: [Uid] }),
      Db.execute({ sql: "SELECT type, url FROM assets WHERE user_id = ?", args: [Uid] }),
      Db.execute({ sql: "SELECT id, filename, size FROM hosted_files WHERE user_id = ? AND kind = 'asset'", args: [Uid] }).catch(() => ({ rows: [] })),
      Db.execute({
        sql: "SELECT SUM(CASE WHEN vote = 1 THEN 1 ELSE 0 END) AS likes, SUM(CASE WHEN vote = -1 THEN 1 ELSE 0 END) AS dislikes FROM profile_votes WHERE user_id = ?",
        args: [Uid]
      })
    ]);
    const Voter = CleanVoter(req.query.voter);
    let Mine = 0;
    if (Voter) {
      const IpHash = hashIp(getClientIp(req));
      const MineRs = await Db.execute({ sql: "SELECT vote FROM profile_votes WHERE user_id = ? AND (ip_hash = ? OR voter_key = ?) LIMIT 1", args: [Uid, IpHash, Voter] });
      Mine = Number(MineRs.rows?.[0]?.vote || 0);
      res.setHeader("Cache-Control", "private, no-store");
    } else {
      res.setHeader("Cache-Control", "public, max-age=30, s-maxage=60, stale-while-revalidate=300");
    }
    let Prefs = {};
    try {
      const PrefRs = await Db.execute({ sql: "SELECT badge, hidden, by_name FROM badge_prefs WHERE user_id = ?", args: [Uid] });
      Prefs = Object.fromEntries((PrefRs.rows || []).map((R) => [R.badge, { hidden: Number(R.hidden || 0) === 1, byName: Number(R.by_name || 0) === 1 }]));
    } catch { /* table may not exist yet on cold start */ }
    res.status(200).json({
      source: "turso",
      user: Match,
      views: Number(CountRs.rows?.[0]?.c || 0),
      badges: (BadgeRs.rows || []).map((R) => R.badge),
      badgePrefs: Prefs,
      links: Object.fromEntries((LinkRs.rows || []).map((R) => [R.platform, R.url])),
      assets: (() => {
        const byType = {};
        for (const R of HostedRs.rows || []) {
          const suffix = String(R.id || "").replace(new RegExp(`^u${Uid}-`), "");
          if (suffix) byType[suffix] = R;
        }
        return (AssetRs.rows || []).map((A) => {
          const H = byType[A.type];
          return H ? { ...A, filename: H.filename, size: H.size } : A;
        });
      })(),
      likes: Number(VoteRs.rows?.[0]?.likes || 0),
      dislikes: Number(VoteRs.rows?.[0]?.dislikes || 0),
      mine: Mine
    });
  } catch (Err) {
    console.error("profile turso fail:", Err);
    res.status(500).json({ error: "Failed" });
  }
}
