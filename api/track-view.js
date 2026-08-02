import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null;
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { user_id, visitor_id } = req.body || {};
  if (!Number.isInteger(user_id) || typeof visitor_id !== "string" || !visitor_id.trim()) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }

  if (!supabaseAdmin) { res.status(500).json({ error: "Supabase not configured" }); return; }

  const ipHash = hashIp(getClientIp(req));
  const now = Date.now();
  const since20 = new Date(now - 20 * 1000).toISOString();
  const since60 = new Date(now - 60 * 1000).toISOString();

  // Per-IP + per-user bulk limit: 8+ views from the same IP in 20s = refresh loop/bot, discard.
  const { count: ipCount } = await supabaseAdmin
    .from("page_views")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user_id)
    .eq("ip_hash", ipHash)
    .gte("viewed_at", since20);
  if ((ipCount ?? 0) >= 8) {
    await supabaseAdmin.from("page_views").delete().eq("user_id", user_id).eq("ip_hash", ipHash).gte("viewed_at", since20);
    res.status(429).json({ counted: false });
    return;
  }

  // Per-user bulk limits: 10+ views in 20s or 50+ in 60s = likely botted, discard.
  const [c20, c60] = await Promise.all([
    supabaseAdmin.from("page_views").select("id", { count: "exact", head: true }).eq("user_id", user_id).gte("viewed_at", since20),
    supabaseAdmin.from("page_views").select("id", { count: "exact", head: true }).eq("user_id", user_id).gte("viewed_at", since60),
  ]);
  if ((c20.count ?? 0) >= 10) {
    await supabaseAdmin.from("page_views").delete().eq("user_id", user_id).gte("viewed_at", since20);
    res.status(429).json({ counted: false });
    return;
  }
  if ((c60.count ?? 0) >= 50) {
    await supabaseAdmin.from("page_views").delete().eq("user_id", user_id).gte("viewed_at", since60);
    res.status(429).json({ counted: false });
    return;
  }

  // Dedup: same IP within 7 days (stops refresh bots, incognito abuse, randomized visitor_ids).
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: byIp } = await supabaseAdmin
    .from("page_views")
    .select("id")
    .eq("user_id", user_id)
    .eq("ip_hash", ipHash)
    .gte("viewed_at", sevenDaysAgo)
    .maybeSingle();
  if (byIp) {
    res.status(200).json({ counted: false });
    return;
  }

  // Dedup: same visitor (device) within 7 days, even if their IP changed.
  const { data: existing } = await supabaseAdmin
    .from("page_views")
    .select("id")
    .eq("user_id", user_id)
    .eq("visitor_id", visitor_id.trim())
    .gte("viewed_at", sevenDaysAgo)
    .maybeSingle();
  if (existing) {
    res.status(200).json({ counted: false });
    return;
  }

  const { error } = await supabaseAdmin.from("page_views").insert({ user_id, visitor_id: visitor_id.trim(), ip_hash: ipHash });
  if (error) {
    console.error("track-view error:", error);
    res.status(500).json({ error: "Failed to track view" });
    return;
  }
  res.status(200).json({ counted: true });
}
