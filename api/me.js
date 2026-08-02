import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import React from "react";
import { ImageResponse } from "@vercel/og";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null;
const SECRET = process.env.SESSION_SECRET || "sire-dev-secret-do-not-use-in-prod";

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
  } catch {
    return null;
  }
}

const USER_FIELDS = new Set([
  "username", "alias", "display_name", "description", "accent_color", "text_color", "background_color",
  "icon_color", "bg_effect_color", "primary_color", "secondary_color", "show_username",
  "display_effect", "font", "video_audio", "bg_effect", "song_platform", "song_id",
  "entry_text", "entry_font", "entry_color", "entry_effect", "desc_effect",
  "desc_effect_speed", "desc_lines", "monochrome_icons", "monochrome_badges",
  "banner_enabled", "seo_title", "seo_description", "seo_image", "seo_favicon",
  "panel_mouse_follow", "audio_volume", "audio_autoplay", "audio_loop", "audio_shuffle",
  "cursor_effect", "avatar_shape", "avatar_size", "avatar_offset_x", "avatar_offset_y",
  "name_offset_x", "name_offset_y", "badge_offset_x", "badge_offset_y",
  "desc_offset_x", "desc_offset_y", "song_offset_x", "song_offset_y",
  "discord_rpc_offset_x", "discord_rpc_offset_y",
  "panel_opacity", "panel_hidden", "discord_rpc_enabled",
  "widgets",
]);

const PREMIUM_VALUES = {
  display_effect: new Set(["glitch", "neon", "gradient-flow", "shine-sweep"]),
  bg_effect: new Set(["particles", "galaxy", "matrix", "spotlight"]),
};

const INT_FIELDS = new Set([
  "avatar_size", "avatar_offset_x", "avatar_offset_y",
  "name_offset_x", "name_offset_y", "badge_offset_x", "badge_offset_y",
  "desc_offset_x", "desc_offset_y", "song_offset_x", "song_offset_y",
  "discord_rpc_offset_x", "discord_rpc_offset_y",
  "panel_opacity", "desc_effect_speed", "audio_volume",
]);

const TEMPLATE_FIELDS = new Set([
  "description", "accent_color", "text_color", "background_color", "icon_color",
  "bg_effect_color", "primary_color", "secondary_color", "display_effect", "font",
  "bg_effect", "entry_text", "entry_font", "entry_color", "entry_effect",
  "monochrome_icons", "monochrome_badges", "show_username", "panel_mouse_follow",
  "audio_volume", "audio_autoplay", "audio_loop", "audio_shuffle", "cursor_effect",
  "avatar_shape", "avatar_size", "avatar_offset_x", "avatar_offset_y",
  "name_offset_x", "name_offset_y", "badge_offset_x", "badge_offset_y",
  "tags",
]);

const ASSET_TYPES = new Set(["background", "audio", "audio_1", "audio_2", "profile_avatar", "custom_cursor", "video_background", "banner"]);
const BADGES = new Set(["og", "premium", "verified", "booster", "staff", "bug", "corrupt"]);
const ADMIN_DELETE_TABLES = ["badges", "links", "page_views", "templates", "songs", "template_installs"];

const HOST_MAX_BYTES = 30 * 1024 * 1024;
const HOST_MAX_ITEMS = 10;
const HOST_BUCKET = "hosted";
const HOST_MEDIA_TYPES = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  bmp: "image/bmp",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  mkv: "video/x-matroska",
};
const HOST_FILE_TYPES = {
  txt: "text/plain", md: "text/markdown", json: "application/json", csv: "text/csv",
  pdf: "application/pdf", zip: "application/zip", rar: "application/vnd.rar",
  gz: "application/gzip", tar: "application/x-tar", mp3: "audio/mpeg", wav: "audio/wav",
  ogg: "audio/ogg", flac: "audio/flac",
  doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  html: "text/html", htm: "text/html", css: "text/css", js: "text/javascript", py: "text/x-python", sh: "application/x-sh",
  svg: "image/svg+xml", psd: "image/vnd.adobe.photoshop", ai: "application/postscript", eps: "application/postscript",
  ttf: "font/ttf", otf: "font/otf", woff: "font/woff", woff2: "font/woff2",
  apk: "application/vnd.android.package-archive", iso: "application/x-iso9660-image", dmg: "application/x-apple-diskimage",
  exe: "application/octet-stream", bin: "application/octet-stream", dat: "application/octet-stream",
};

const HOST_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function hostShortcode() {
  let out = "";
  for (let i = 0; i < 6; i++) out += HOST_CHARS[crypto.randomInt(HOST_CHARS.length)];
  return out;
}

function getSessionUid(req) {
  return unsignToken(req.query.sessionToken || req.query.s);
}

async function isPremiumUser(uid) {
  const { data } = await supabase.from("badges").select("badge").eq("user_id", uid).eq("badge", "premium").limit(1);
  return !!(data && data.length > 0);
}

async function ensureHostBucket() {
  try {
    await supabase.storage.createBucket(HOST_BUCKET, { public: false });
  } catch {}
}

async function hostPrepare(req, res) {
  const uid = getSessionUid(req) || unsignToken(req.body?.sessionToken);
  if (!uid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { data: user } = await supabase.from("users").select("id").eq("id", uid).maybeSingle();
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!(await isPremiumUser(uid))) { res.status(403).json({ error: "This is a premium feature." }); return; }

  const kind = req.body.kind === "file" ? "file" : "media";
  const name = String(req.body.filename || "").trim().toLowerCase();
  const ext = name.includes(".") ? name.split(".").pop() : "";
  if (!ext) { res.status(400).json({ error: "Missing file extension" }); return; }

  let contentType;
  if (kind === "media") {
    contentType = HOST_MEDIA_TYPES[ext];
    if (!contentType) { res.status(400).json({ error: "Unsupported media type. Images and videos only." }); return; }
  } else {
    contentType = HOST_FILE_TYPES[ext] || "application/octet-stream";
  }

  const size = Number(req.body.size);
  if (!size || size <= 0) { res.status(400).json({ error: "Invalid file size" }); return; }
  if (size > HOST_MAX_BYTES) { res.status(413).json({ error: "File too large (max 30MB)." }); return; }

  const { count } = await supabase.from("hosted_files").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("kind", kind);
  if ((count || 0) >= HOST_MAX_ITEMS) {
    res.status(403).json({ error: `You can only host up to ${HOST_MAX_ITEMS} ${kind === "media" ? "media items" : "files"}. Delete some to make room.` });
    return;
  }

  await ensureHostBucket();

  let id = null;
  for (let i = 0; i < 5; i++) {
    const candidate = hostShortcode();
    const { data: existing } = await supabase.from("hosted_files").select("id").eq("id", candidate).maybeSingle();
    if (!existing) { id = candidate; break; }
  }
  if (!id) { res.status(500).json({ error: "Could not allocate a unique id" }); return; }

  const path = `${kind}/${uid}/${id}.${ext}`;
  const { data: signed, error: signError } = await supabase.storage.from(HOST_BUCKET).createSignedUploadUrl(path);
  if (signError || !signed) {
    console.error("host prepare sign error:", signError);
    res.status(500).json({ error: "Could not prepare upload" });
    return;
  }

  const { error: insertError } = await supabase.from("hosted_files").insert({
    id, user_id: uid, kind, filename: name, content_type: contentType, size, path,
  });
  if (insertError) {
    console.error("host prepare insert error:", insertError);
    res.status(500).json({ error: "Could not prepare upload" });
    return;
  }

  const appUrl = process.env.APP_URL || "https://sire.lol";
  const slug = kind === "media" ? "i" : "f";
  res.status(200).json({ id, url: `${appUrl}/${slug}/${id}`, signedUrl: signed.signedUrl, path: signed.path, token: signed.token });
}

async function hostList(req, res) {
  const uid = getSessionUid(req);
  if (!uid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { data, error } = await supabase.from("hosted_files")
    .select("id, kind, filename, content_type, size, views, created_at")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("host list error:", error);
    res.status(500).json({ error: "Failed to load" });
    return;
  }
  const appUrl = process.env.APP_URL || "https://sire.lol";
  res.status(200).json({ items: (data || []).map((r) => ({ ...r, url: `${appUrl}/${r.kind === "media" ? "i" : "f"}/${r.id}` })) });
}

async function hostDelete(req, res) {
  const uid = getSessionUid(req);
  if (!uid) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = String(req.query.id || "");
  if (!id) { res.status(400).json({ error: "Missing id" }); return; }
  const { data: row } = await supabase.from("hosted_files").select("path").eq("id", id).eq("user_id", uid).maybeSingle();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  await supabase.storage.from(HOST_BUCKET).remove([row.path]);
  await supabase.from("hosted_files").delete().eq("id", id).eq("user_id", uid);
  res.status(200).json({ ok: true });
}

async function hostServe(req, res) {
  const code = String(req.params?.code || req.query?.code || "").trim();
  const viaPath = String(req.path || "").startsWith("/f/");
  const kind = req.query.k === "file" || viaPath ? "file" : "media";
  if (!code) { res.status(404).json({ error: "Not found" }); return; }

  const { data: row } = await supabase.from("hosted_files").select("*").eq("id", code).eq("kind", kind).maybeSingle();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }

  const { data: blob, error } = await supabase.storage.from(HOST_BUCKET).download(row.path);
  if (error || !blob) { res.status(404).json({ error: "Not found" }); return; }

  const buffer = Buffer.from(await blob.arrayBuffer());
  res.status(200)
    .setHeader("Content-Type", row.content_type)
    .setHeader("Content-Length", buffer.byteLength)
    .setHeader("Cache-Control", "public, max-age=31536000, immutable");
  if (kind === "file") {
    res.setHeader("Content-Disposition", `inline; filename="${String(row.filename || "file")}"`);
  }
  res.send(buffer);

  supabase.from("hosted_files").update({ views: (row.views || 0) + 1 }).eq("id", code)
    .then(() => {}).catch(() => {});
}

const OG_FONT_URL = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,800&display=swap";

const ogEl = (type, props, ...children) => React.createElement(type, props || null, ...children);

async function ogLoadFont() {
  try {
    const css = await (await fetch(OG_FONT_URL)).text();
    const match = css.match(/https:\/\/[^)]+\.woff2/);
    if (!match) return null;
    const buf = await (await fetch(match[0])).arrayBuffer();
    return Buffer.from(buf);
  } catch {
    return null;
  }
}

async function ogAvatarDataUrl(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const type = (res.headers.get("content-type") || "image/png").split(";")[0];
    return `data:${type};base64,${Buffer.from(buf).toString("base64")}`;
  } catch {
    return null;
  }
}

async function ogImage(req, res) {
  const username = String(req.query.username || "").trim().toLowerCase();
  if (!username) {
    res.status(400).json({ error: "missing username" });
    return;
  }

  const { data: user } = await supabase
    .from("users")
    .select("username,display_name,avatar_url")
    .or(`username.eq.${username},alias.eq.${username}`)
    .maybeSingle();
  if (!user) {
    res.status(404).json({ error: "not found" });
    return;
  }

  const displayName = user.display_name || user.username;
  const handle = user.username;
  const [font, avatar] = await Promise.all([
    ogLoadFont(),
    user.avatar_url ? ogAvatarDataUrl(user.avatar_url) : null,
  ]);
  const initials = (displayName || "?").trim().charAt(0).toUpperCase();
  const textStyle = { fontFamily: "Bricolage Grotesque", fontWeight: 800, color: "#ffffff" };

  const tree = ogEl(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#080808",
      },
    },
    avatar
      ? ogEl("img", {
          src: avatar,
          width: 200,
          height: 200,
          style: { borderRadius: 9999, objectFit: "cover", border: "2px solid rgba(255,255,255,0.1)" },
        })
      : ogEl(
          "div",
          {
            style: {
              width: 200,
              height: 200,
              borderRadius: 9999,
              backgroundColor: "rgba(255,255,255,0.08)",
              border: "2px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            },
          },
          ogEl("span", { style: { ...textStyle, fontSize: 80 } }, initials)
        ),
    ogEl("div", { style: { ...textStyle, marginTop: 36, fontSize: 60, textAlign: "center" } }, displayName),
    ogEl("div", { style: { ...textStyle, fontWeight: 400, marginTop: 14, fontSize: 28, color: "rgba(255,255,255,0.4)", textAlign: "center" } }, `sire.lol/${handle}`)
  );

  const imageResponse = new ImageResponse(tree, {
    width: 1200,
    height: 630,
    fonts: font
      ? [
          { name: "Bricolage Grotesque", data: font, style: "normal", weight: 400 },
          { name: "Bricolage Grotesque", data: font, style: "normal", weight: 800 },
        ]
      : undefined,
  });

  const buf = Buffer.from(await imageResponse.arrayBuffer());
  res.status(200);
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=86400, stale-while-revalidate=2592000");
  res.send(buf);
}

export default async function handler(req, res) {
  if (!supabase) {
    res.status(500).json({ error: "Supabase not configured" });
    return;
  }

  if (req.method === "GET") {
    const action = req.query.action;
    if (action === "og") return ogImage(req, res);
    if (action === "hostList") return hostList(req, res);
    if (action === "serveMedia" || action === "serveFile" || req.params?.code) return hostServe(req, res);
    if (action === "track") return trackInfo(req, res);
    const sessionToken = req.query.sessionToken || req.query.s;
    const uid = unsignToken(sessionToken);
    if (!uid) { res.status(401).json({ error: "Unauthorized" }); return; }
    const { data } = await supabase.from("users").select("*").eq("id", uid).single();
    if (!data) { res.status(404).json({ error: "User not found" }); return; }
    res.status(200).json({ user: data });
    return;
  }

  if (req.method === "DELETE") {
    return hostDelete(req, res);
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (req.query.action === "hostPrepare") {
    return hostPrepare(req, res);
  }

  const { action, sessionToken } = req.body;
  const uid = unsignToken(sessionToken);
  if (!uid) { res.status(401).json({ error: "Unauthorized" }); return; }

  switch (action) {
    case "update": {
      const data = sanitizeObject(req.body.data, USER_FIELDS);
      if (!data || Object.keys(data).length === 0) {
        res.status(400).json({ error: "No valid fields" });
        return;
      }
      for (const k of INT_FIELDS) {
        if (data[k] !== undefined && data[k] !== null && !Number.isNaN(Number(data[k]))) {
          data[k] = Math.round(Number(data[k]));
        }
      }
      if (data.widgets !== undefined) {
        if (!(await isPremiumUser(uid))) {
          res.status(403).json({ error: "This is a premium feature." });
          return;
        }
        const w = data.widgets;
        if (!w || typeof w !== "object" || Array.isArray(w)) {
          res.status(400).json({ error: "Invalid widgets" });
          return;
        }
        const pages = Math.max(1, Math.min(4, Math.round(Number(w.pages) || 1)));
        const a = w.about && typeof w.about === "object" && !Array.isArray(w.about) ? w.about : {};
        const clock = a.clock && typeof a.clock === "object" && !Array.isArray(a.clock) ? a.clock : null;
        const s = w.song && typeof w.song === "object" && !Array.isArray(w.song) ? w.song : {};
        const p = w.projects && typeof w.projects === "object" && !Array.isArray(w.projects) ? w.projects : {};
        const tags = Array.isArray(a.tags)
          ? a.tags.map((t) => String(t || "").trim().slice(0, 32)).filter(Boolean).slice(0, 6)
          : [];
        const projectList = Array.isArray(p.projects)
          ? p.projects
              .filter((x) => x && typeof x === "object" && !Array.isArray(x))
              .slice(0, 4)
              .map((x) => ({
                banner: String(x.banner || "").slice(0, 500),
                name: String(x.name || "").slice(0, 80),
                description: String(x.description || "").slice(0, 200),
              }))
          : [{
              banner: String(p.banner || "").slice(0, 500),
              name: String(p.name || "").slice(0, 80),
              description: String(p.description || "").slice(0, 200),
            }];
        data.widgets = {
          pages,
          about: {
            title: String(a.title || "About me").slice(0, 80),
            description: String(a.description || "").slice(0, 600),
            clock: clock ? {
              id: typeof clock.id === "string" && clock.id ? String(clock.id).slice(0, 32) : `w${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
              type: "clock",
              label: String(clock.label || "").slice(0, 64),
              timeZone: String(clock.timeZone || "UTC").slice(0, 64),
              mouseFollow: !!clock.mouseFollow,
            } : null,
            tags,
          },
          song: { url: String(s.url || "").slice(0, 500) },
          projects: { projects: projectList },
        };
      }
      const premiumField = Object.keys(data).find((k) => PREMIUM_VALUES[k] && PREMIUM_VALUES[k].has(String(data[k])));
      if (premiumField && !(await isPremiumUser(uid))) {
        res.status(403).json({ error: "This is a premium feature." });
        return;
      }
      if (data.username !== undefined) {
        data.username = String(data.username).trim().toLowerCase();
        if (!/^[a-zA-Z0-9_]{1,20}$/.test(data.username)) {
          res.status(400).json({ error: "Username can only contain letters, numbers, and underscores (max 20)" });
          return;
        }
        const { data: clashU } = await supabase.from("users").select("id").eq("username", data.username).neq("id", uid).maybeSingle();
        const { data: clashA } = await supabase.from("users").select("id").eq("alias", data.username).neq("id", uid).maybeSingle();
        if (clashU || clashA) { res.status(409).json({ error: "Username taken" }); return; }
      }
      if (data.alias !== undefined && data.alias !== null) {
        data.alias = String(data.alias).trim().toLowerCase();
        if (data.alias === "") {
          data.alias = null;
        } else {
          if (!/^[a-zA-Z0-9_]{1,20}$/.test(data.alias)) {
            res.status(400).json({ error: "Alias can only contain letters, numbers, and underscores (max 20)" });
            return;
          }
          const { data: clashU } = await supabase.from("users").select("id").eq("username", data.alias).neq("id", uid).maybeSingle();
          const { data: clashA } = await supabase.from("users").select("id").eq("alias", data.alias).neq("id", uid).maybeSingle();
          if (clashU || clashA) { res.status(409).json({ error: "Alias taken" }); return; }
        }
      }
      const { error } = await supabase.from("users").update(data).eq("id", uid);
      if (error) {
        console.error("me update error:", error);
        res.status(500).json({ error: "Failed to save" });
        return;
      }
      const { data: fresh } = await supabase.from("users").select("*").eq("id", uid).single();
      res.status(200).json({ ok: true, user: fresh });
      return;
    }

    case "asset_upsert": {
      const type = String(req.body.type || "");
      const url = String(req.body.url || "");
      if (!ASSET_TYPES.has(type) || !url.startsWith("http") || url.length > 500) {
        res.status(400).json({ error: "Invalid asset" });
        return;
      }
      const { error } = await supabase.from("assets").upsert(
        { user_id: uid, type, url },
        { onConflict: "user_id,type" }
      );
      if (error) {
        console.error("me asset_upsert error:", error);
        res.status(500).json({ error: "Failed to save asset" });
        return;
      }
      res.status(200).json({ ok: true });
      return;
    }

    case "asset_delete": {
      const type = String(req.body.type || "");
      if (!ASSET_TYPES.has(type)) {
        res.status(400).json({ error: "Invalid asset" });
        return;
      }
      await supabase.from("assets").delete().eq("user_id", uid).eq("type", type);
      res.status(200).json({ ok: true });
      return;
    }

    case "link_upsert": {
      const platform = String(req.body.platform || "");
      let url = String(req.body.url || "").trim();
      if (!platform || platform.length > 40 || !url) {
        res.status(400).json({ error: "Invalid link" });
        return;
      }
      if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
      if (url.length > 2000) {
        res.status(400).json({ error: "URL too long" });
        return;
      }
      const { error } = await supabase.from("links").upsert(
        { user_id: uid, platform, url },
        { onConflict: "user_id,platform" }
      );
      if (error) {
        console.error("me link_upsert error:", error);
        res.status(500).json({ error: "Failed to save link" });
        return;
      }
      res.status(200).json({ ok: true });
      return;
    }

    case "link_delete": {
      await supabase.from("links").delete().eq("user_id", uid).eq("platform", String(req.body.platform || ""));
      res.status(200).json({ ok: true });
      return;
    }

    case "badge_set":
    case "badge_remove": {
      const badge = String(req.body.badge || "");
      if (!BADGES.has(badge)) {
        res.status(400).json({ error: "Invalid badge" });
        return;
      }
      if (action === "badge_set") {
        await supabase.from("badges").upsert({ user_id: uid, badge }, { onConflict: "user_id,badge" });
      } else {
        await supabase.from("badges").delete().eq("user_id", uid).eq("badge", badge);
      }
      res.status(200).json({ ok: true });
      return;
    }

    case "template_toggle": {
      if (req.body.on !== true) {
        await supabase.from("templates").delete().eq("user_id", uid);
        res.status(200).json({ ok: true });
        return;
      }
      const { data: user } = await supabase.from("users").select("*").eq("id", uid).single();
      if (!user) { res.status(404).json({ error: "User not found" }); return; }
      const t = {};
      for (const f of TEMPLATE_FIELDS) {
        if (user[f] !== undefined) t[f] = user[f];
      }
      if (Array.isArray(req.body.tags)) {
        t.tags = req.body.tags.slice(0, 10).map((x) => String(x).toLowerCase().trim()).filter(Boolean);
      } else {
        t.tags = [];
      }
      const { error } = await supabase.from("templates").upsert({ user_id: uid, ...t }, { onConflict: "user_id" });
      if (error) {
        console.error("me template_toggle error:", error);
        res.status(500).json({ error: "Failed to save template" });
        return;
      }
      res.status(200).json({ ok: true, tags: t.tags });
      return;
    }

    case "template_install": {
      const targetUserId = Number(req.body.targetUserId);
      if (!targetUserId || targetUserId === uid) { res.status(400).json({ error: "Invalid target" }); return; }
      const { data: exists } = await supabase.from("templates").select("user_id").eq("user_id", targetUserId).maybeSingle();
      if (!exists) { res.status(404).json({ error: "Template not found" }); return; }
      await supabase.from("template_installs").upsert(
        { user_id: uid, template_user_id: targetUserId },
        { onConflict: "user_id,template_user_id", ignoreDuplicates: true }
      );
      res.status(200).json({ ok: true });
      return;
    }

    case "template_favorite": {
      const targetUserId = Number(req.body.targetUserId);
      if (!targetUserId || targetUserId === uid) { res.status(400).json({ error: "Invalid target" }); return; }
      const { data: exists } = await supabase.from("templates").select("user_id").eq("user_id", targetUserId).maybeSingle();
      if (!exists) { res.status(404).json({ error: "Template not found" }); return; }
      await supabase.from("template_favorites").upsert(
        { user_id: uid, template_user_id: targetUserId },
        { onConflict: "user_id,template_user_id", ignoreDuplicates: true }
      );
      res.status(200).json({ ok: true });
      return;
    }

    case "template_unfavorite": {
      const targetUserId = Number(req.body.targetUserId);
      if (!targetUserId) { res.status(400).json({ error: "Invalid target" }); return; }
      await supabase.from("template_favorites").delete().eq("user_id", uid).eq("template_user_id", targetUserId);
      res.status(200).json({ ok: true });
      return;
    }

    case "template_favorites": {
      const { data: rows } = await supabase.from("template_favorites").select("template_user_id").eq("user_id", uid);
      res.status(200).json({ favorites: (rows || []).map((r) => r.template_user_id) });
      return;
    }

    case "delete_account": {
      const { error } = await supabase.from("users").delete().eq("id", uid);
      if (error) {
        console.error("me delete_account error:", error);
        res.status(500).json({ error: "Failed to delete account" });
        return;
      }
      res.setHeader("Set-Cookie", "sl_session=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/");
      res.status(200).json({ ok: true });
      return;
    }

    case "admin_delete_user": {
      if (uid !== 1) { res.status(403).json({ error: "Forbidden" }); return; }
      const targetUid = Number(req.body.targetUid);
      if (!targetUid) { res.status(400).json({ error: "Missing targetUid" }); return; }
      for (const table of ADMIN_DELETE_TABLES) {
        await supabase.from(table).delete().eq("user_id", targetUid);
      }
      const { error } = await supabase.from("users").delete().eq("id", targetUid);
      if (error) {
        console.error("me admin_delete_user error:", error);
        res.status(500).json({ error: "Failed to delete user" });
        return;
      }
      res.status(200).json({ ok: true });
      return;
    }

    case "admin_badge_set":
    case "admin_badge_remove": {
      if (uid !== 1) { res.status(403).json({ error: "Forbidden" }); return; }
      const targetUid = Number(req.body.targetUid);
      const badge = String(req.body.badge || "");
      if (!targetUid || !BADGES.has(badge)) {
        res.status(400).json({ error: "Invalid input" });
        return;
      }
      if (action === "admin_badge_set") {
        await supabase.from("badges").upsert({ user_id: targetUid, badge }, { onConflict: "user_id,badge" });
      } else {
        await supabase.from("badges").delete().eq("user_id", targetUid).eq("badge", badge);
      }
      res.status(200).json({ ok: true });
      return;
    }

    default:
      res.status(400).json({ error: "Unknown action" });
  }
}

async function trackInfo(req, res) {
  const url = String(req.query.url || "");
  const m = url.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/);
  const id = m ? m[1] : null;
  if (!id) {
    res.status(400).json({ error: "Invalid Spotify URL" });
    return;
  }
  let title = "", artist = "", previewUrl = "", duration = 0, image = "", color = "", ytId = "";
  try {
    const r = await fetch(`https://open.spotify.com/embed/track/${id}`, {
      headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" },
    });
    const html = await r.text();
    const m2 = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (m2) {
      try {
        const json = JSON.parse(m2[1]);
        const entity = json?.props?.pageProps?.state?.data?.entity;
        if (entity) {
          title = String(entity.name || "");
          artist = Array.isArray(entity.artists) && entity.artists[0]?.name ? String(entity.artists[0].name) : "";
          previewUrl = String(entity.audioPreview?.url || entity.previewUrl || "");
          duration = Math.round(Number(entity.duration || 0) / 1000);
          const vi = entity.visualIdentity || {};
          if (Array.isArray(vi.image) && vi.image[0]?.url) image = String(vi.image[0].url);
          const bg = vi.backgroundBase;
          if (bg && typeof bg.red === "number" && typeof bg.green === "number" && typeof bg.blue === "number") {
            color = `rgb(${Math.round(bg.red)},${Math.round(bg.green)},${Math.round(bg.blue)})`;
          }
        }
      } catch {}
    }
  } catch (e) {
    console.error("spotify embed error:", e);
  }
  let synced = null;
  if (title && artist) {
    synced = await fetchSyncedLyrics(artist, title);
    try {
      const q = encodeURIComponent(`${artist} ${title} official audio`);
      const yt = await fetch(`https://www.youtube.com/results?search_query=${q}`, {
        headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" },
      });
      ytId = pickYoutubeId(await yt.text());
    } catch {}
  }
  res.status(200).json({ title, artist, previewUrl, duration, synced, image, color, ytId });
}

async function fetchSyncedLyrics(artist, title) {
  try {
    const r = await fetch(`https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`);
    if (r.ok) {
      const j = await r.json();
      if (j && typeof j.syncedLyrics === "string" && j.syncedLyrics.trim()) return j.syncedLyrics;
    }
  } catch {}
  try {
    const r = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(`${title} ${artist}`.trim())}`);
    if (!r.ok) return null;
    const arr = await r.json();
    if (!Array.isArray(arr)) return null;
    const syncedRes = arr.filter((x) => x && typeof x.syncedLyrics === "string" && x.syncedLyrics.trim());
    if (syncedRes.length === 0) return null;
    const t = title.toLowerCase().replace(/[\(\[].*?[\)\]]/g, "").trim();
    const a = artist.toLowerCase();
    const score = (x) => {
      const tn = String(x.trackName || "").toLowerCase().replace(/[\(\[].*?[\)\]]/g, "").trim();
      const an = String(x.artistName || "").toLowerCase();
      return (tn === t ? 3 : tn.includes(t) || t.includes(tn) ? 2 : 0) + (an === a ? 2 : an.includes(a) || a.includes(an) ? 1 : 0);
    };
    syncedRes.sort((x, y) => score(y) - score(x));
    return syncedRes[0].syncedLyrics;
  } catch {}
  return null;
}

function pickYoutubeId(html) {
  try {
    const m = html.match(/var ytInitialData = (\{.*?\});<\/script>/s);
    if (!m) return "";
    const data = JSON.parse(m[1]);
    const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
    let first = "";
    let topic = "";
    for (const sec of contents) {
      const items = sec?.itemSectionRenderer?.contents || [];
      for (const item of items) {
        const v = item?.videoRenderer;
        if (!v || !v.videoId) continue;
        if (!first) first = v.videoId;
        const owner = v?.ownerText?.runs?.[0]?.text || "";
        if (owner.includes("Topic")) { topic = v.videoId; break; }
      }
      if (topic) break;
    }
    return topic || first;
  } catch {
    return "";
  }
}

function sanitizeObject(obj, allowed) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;
  const out = {};
  for (const key of Object.keys(obj)) {
    if (allowed.has(key)) out[key] = obj[key];
  }
  return out;
}

export const config = { supportsResponseStreaming: true };
