import crypto from "crypto";
import { GetTurso, HasTurso } from "../lib/turso.js";

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

function IsoDaysAgo(Days) {
  return new Date(Date.now() - Days * 24 * 60 * 60 * 1000).toISOString();
}

function DayKey(D) {
  return D.getFullYear() + "-" + String(D.getMonth() + 1).padStart(2, "0") + "-" + String(D.getDate()).padStart(2, "0");
}

function ShortDay(D) {
  return D.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function FullDay(D) {
  return D.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default async function handler(req, res) {
  const Uid = UnsignToken(req.query.sessionToken || req.query.s);
  if (!Uid) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!HasTurso()) { res.status(500).json({ error: "No DB configured" }); return; }
  try {
    const Db = GetTurso();
    const SevenAgo = IsoDaysAgo(7);
    const ThirtyAgo = IsoDaysAgo(30);
    const [TotalRs, RecentRs, ViewRs, LikeRs, VisitorRs, UserRs, CountryRs, ReferrerRs, DeviceRs, ClickRs] = await Promise.all([
      Db.execute({ sql: "SELECT COUNT(*) AS c FROM page_views WHERE user_id = ?", args: [Uid] }),
      Db.execute({ sql: "SELECT COUNT(*) AS c FROM page_views WHERE user_id = ? AND viewed_at >= ?", args: [Uid, SevenAgo] }),
      Db.execute({ sql: "SELECT viewed_at FROM page_views WHERE user_id = ? AND viewed_at >= ?", args: [Uid, ThirtyAgo] }),
      Db.execute({ sql: "SELECT created_at FROM profile_votes WHERE user_id = ? AND vote = 1 AND created_at >= ?", args: [Uid, ThirtyAgo] }),
      Db.execute({ sql: "SELECT visitor_id FROM page_views WHERE user_id = ?", args: [Uid] }),
      Db.execute({ sql: "SELECT COUNT(*) AS c FROM users", args: [] }),
      Db.execute({ sql: "SELECT country AS k, COUNT(*) AS c FROM page_views WHERE user_id = ? AND viewed_at >= ? AND country != '' GROUP BY country ORDER BY c DESC LIMIT 8", args: [Uid, ThirtyAgo] }).catch(() => ({ rows: [] })),
      Db.execute({ sql: "SELECT referrer AS k, COUNT(*) AS c FROM page_views WHERE user_id = ? AND viewed_at >= ? AND referrer != '' GROUP BY referrer ORDER BY c DESC LIMIT 6", args: [Uid, ThirtyAgo] }).catch(() => ({ rows: [] })),
      Db.execute({ sql: "SELECT device AS k, COUNT(*) AS c FROM page_views WHERE user_id = ? AND viewed_at >= ? AND device != '' GROUP BY device ORDER BY c DESC LIMIT 4", args: [Uid, ThirtyAgo] }).catch(() => ({ rows: [] })),
      Db.execute({ sql: "SELECT platform AS k, COUNT(*) AS c FROM link_clicks WHERE user_id = ? AND created_at >= ? GROUP BY platform ORDER BY c DESC LIMIT 6", args: [Uid, ThirtyAgo] }).catch(() => ({ rows: [] }))
    ]);
    const Now = new Date();
    const ViewsByDay = {};
    const LikesByDay = {};
    for (const Row of ViewRs.rows || []) {
      const K = DayKey(new Date(Row.viewed_at));
      if (K) ViewsByDay[K] = (ViewsByDay[K] || 0) + 1;
    }
    for (const Row of LikeRs.rows || []) {
      const K = DayKey(new Date(Row.created_at));
      if (K) LikesByDay[K] = (LikesByDay[K] || 0) + 1;
    }
    const ViewsDaily = [];
    const LikesDaily = [];
    for (let i = 29; i >= 0; i--) {
      const D = new Date(Now);
      D.setDate(D.getDate() - i);
      const K = DayKey(D);
      ViewsDaily.push({ date: ShortDay(D), full: FullDay(D), iso: K, count: ViewsByDay[K] || 0 });
      LikesDaily.push({ date: ShortDay(D), full: FullDay(D), iso: K, count: LikesByDay[K] || 0 });
    }
    const ViewsHourly = [];
    const LikesHourly = [];
    const HourStart = new Date(Now);
    HourStart.setMinutes(0, 0, 0);
    for (let i = 23; i >= 0; i--) {
      const H0 = new Date(HourStart.getTime() - i * 3600000);
      const H1 = new Date(H0.getTime() + 3600000);
      let V = 0;
      for (const Row of ViewRs.rows || []) {
        const T = new Date(Row.viewed_at).getTime();
        if (T >= H0.getTime() && T < H1.getTime()) V++;
      }
      let L = 0;
      for (const Row of LikeRs.rows || []) {
        const T = new Date(Row.created_at).getTime();
        if (T >= H0.getTime() && T < H1.getTime()) L++;
      }
      const Label = String(H0.getHours()).padStart(2, "0") + ":00";
      ViewsHourly.push({ date: Label, full: Label, iso: H0.toISOString(), count: V });
      LikesHourly.push({ date: Label, full: Label, iso: H0.toISOString(), count: L });
    }
    const UniqueSet = new Set((VisitorRs.rows || []).map((R) => R.visitor_id).filter(Boolean));
    const Top = (Rs) => (Rs.rows || []).map((R) => ({ k: String(R.k || ""), c: Number(R.c || 0) })).filter((R) => R.k);
    res.status(200).json({
      totalViews: Number(TotalRs.rows?.[0]?.c || 0),
      recentViews: Number(RecentRs.rows?.[0]?.c || 0),
      daily: ViewsDaily.slice(-7).map((d) => ({ date: d.full, count: d.count })),
      viewsHourly: ViewsHourly,
      viewsDaily: ViewsDaily,
      likesHourly: LikesHourly,
      likesDaily: LikesDaily,
      uniqueVisitors: UniqueSet.size,
      totalUsers: Number(UserRs.rows?.[0]?.c || 0),
      countries: Top(CountryRs),
      referrers: Top(ReferrerRs),
      devices: Top(DeviceRs),
      topLinks: Top(ClickRs)
    });
  } catch (Err) {
    res.status(500).json({ error: "Failed" });
  }
}
