import { GetTurso, HasTurso, PublicProfileCols } from "../lib/turso.js";

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
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      UNIQUE (user_id, voter_key)
    )`);
    await Db.execute(`CREATE INDEX IF NOT EXISTS idx_profile_votes_user ON profile_votes (user_id)`);
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
      if (!Name || !Voter || ![1, -1].includes(Vote)) { res.status(400).json({ error: "Bad vote" }); return; }
      const Ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "?";
      if (!VoteRateOk(Ip)) { res.status(429).json({ error: "Slow down" }); return; }
      const Prof = await Db.execute({
        sql: "SELECT id, suspended, hidden FROM users WHERE username = ? OR alias = ? LIMIT 2",
        args: [Name, Name]
      });
      const Rows = Prof.rows || [];
      const Match = Rows.find((R) => String(R.username || "").toLowerCase() === Name) || Rows[0];
      if (!Match) { res.status(404).json({ error: "Not found" }); return; }
      if (Number(Match.suspended || 0) === 1 || Number(Match.hidden || 0) === 1) { res.status(404).json({ error: "Not found" }); return; }
      const Uid = Match.id;
      const Cur = await Db.execute({ sql: "SELECT vote FROM profile_votes WHERE user_id = ? AND voter_key = ?", args: [Uid, Voter] });
      const Had = Cur.rows?.[0]?.vote;
      let Mine = 0;
      if (Number(Had) === Vote) {
        await Db.execute({ sql: "DELETE FROM profile_votes WHERE user_id = ? AND voter_key = ?", args: [Uid, Voter] });
      } else {
        await Db.execute({ sql: "INSERT INTO profile_votes (user_id, voter_key, vote) VALUES (?, ?, ?) ON CONFLICT (user_id, voter_key) DO UPDATE SET vote = excluded.vote", args: [Uid, Voter, Vote] });
        Mine = Vote;
      }
      const C = await VoteCounts(Db, Uid);
      res.status(200).json({ likes: C.likes, dislikes: C.dislikes, mine: Mine });
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
    for (const K of ["show_username", "video_audio", "monochrome_icons", "monochrome_badges", "banner_enabled", "panel_mouse_follow", "audio_autoplay", "audio_loop", "audio_shuffle", "panel_hidden", "discord_rpc_enabled", "views_blacklisted"]) {
      if (Match[K] !== undefined && Match[K] !== null && typeof Match[K] === "number") Match[K] = !!Match[K];
    }
    const [CountRs, BadgeRs, LinkRs, AssetRs, VoteRs] = await Promise.all([
      Db.execute({ sql: "SELECT COUNT(*) AS c FROM page_views WHERE user_id = ?", args: [Uid] }),
      Db.execute({ sql: "SELECT badge FROM badges WHERE user_id = ?", args: [Uid] }),
      Db.execute({ sql: "SELECT platform, url FROM links WHERE user_id = ?", args: [Uid] }),
      Db.execute({ sql: "SELECT type, url FROM assets WHERE user_id = ?", args: [Uid] }),
      Db.execute({
        sql: "SELECT SUM(CASE WHEN vote = 1 THEN 1 ELSE 0 END) AS likes, SUM(CASE WHEN vote = -1 THEN 1 ELSE 0 END) AS dislikes FROM profile_votes WHERE user_id = ?",
        args: [Uid]
      })
    ]);
    const Voter = CleanVoter(req.query.voter);
    let Mine = 0;
    if (Voter) {
      const MineRs = await Db.execute({ sql: "SELECT vote FROM profile_votes WHERE user_id = ? AND voter_key = ?", args: [Uid, Voter] });
      Mine = Number(MineRs.rows?.[0]?.vote || 0);
    }
    res.setHeader("Cache-Control", "public, max-age=30, s-maxage=60, stale-while-revalidate=300");
    res.status(200).json({
      source: "turso",
      user: Match,
      views: Number(CountRs.rows?.[0]?.c || 0),
      badges: (BadgeRs.rows || []).map((R) => R.badge),
      links: Object.fromEntries((LinkRs.rows || []).map((R) => [R.platform, R.url])),
      assets: AssetRs.rows || [],
      likes: Number(VoteRs.rows?.[0]?.likes || 0),
      dislikes: Number(VoteRs.rows?.[0]?.dislikes || 0),
      mine: Mine
    });
  } catch (Err) {
    console.error("profile turso fail:", Err);
    res.status(500).json({ error: "Failed" });
  }
}
