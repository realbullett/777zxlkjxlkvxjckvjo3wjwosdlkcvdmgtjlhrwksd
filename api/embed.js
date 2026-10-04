import { GetTurso, HasTurso } from "../lib/turso.js";

const APP_HOST = "https://www.sire.lol";

function ParseJson(V, Fallback) {
  if (V === null || V === undefined) return Fallback;
  if (typeof V !== "string") return V;
  const S = V.trim();
  if (!S) return Fallback;
  try {
    const J = JSON.parse(S);
    return J === undefined ? Fallback : J;
  } catch { return Fallback; }
}

function MdEsc(S) {
  return String(S || "").replace(/([\\#*_\-~`>|@$()[\]{}!+.])/g, "\\$1");
}

function AccentInt(Color) {
  const m = String(Color || "").trim().match(/^#([0-9a-f]{6})$/i);
  if (m) return parseInt(m[1], 16);
  return 0x3b82f6;
}

function SendJson(res, obj, sMaxAge) {
  res.status(200);
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", `public, max-age=0, s-maxage=${sMaxAge}, stale-while-revalidate=3600`);
  res.send(JSON.stringify(obj));
}

async function thumbImage(req, res) {
  const [{ default: React }, { ImageResponse }] = await Promise.all([import("react"), import("@vercel/og")]);
  const El = (type, props, ...children) => React.createElement(type, props || null, ...children);
  const tree = El(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
    },
    El(
      "svg",
      { viewBox: "0 0 24 24", width: 160, height: 160, style: { display: "flex" } },
      El("path", {
        d: "M18 6H8l-2 2v3l2 2h8l2 2v3l-2 2H6",
        stroke: "#3b82f6",
        strokeWidth: 3.2,
        strokeLinecap: "square",
        fill: "none",
      })
    )
  );
  const imageResponse = new ImageResponse(tree, { width: 256, height: 256 });
  const buf = Buffer.from(await imageResponse.arrayBuffer());
  res.status(200);
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=86400, stale-while-revalidate=2592000");
  res.send(buf);
}

function siteEmbed(req, res) {
  const components = [
    {
      type: 9,
      components: [{ type: 10, content: "## sire.lol\ncreate your free biolink — drop your links, host your files, tell your story." }],
      accessory: { type: 11, media: { url: `${APP_HOST}/api/embed?mode=thumb` } },
    },
    { type: 12, items: [{ media: { url: `${APP_HOST}/logo.png` } }] },
    { type: 14, spacing: 1 },
    {
      type: 1,
      components: [
        { type: 2, style: 5, label: "Sign Up", url: `${APP_HOST}/auth` },
        { type: 2, style: 5, label: "Leaderboard", url: `${APP_HOST}/leaderboard` },
        { type: 2, style: 5, label: "Terms", url: `${APP_HOST}/terms` },
        { type: 2, style: 5, label: "Privacy", url: `${APP_HOST}/privacy` },
      ],
    },
  ];
  SendJson(res, { component: { type: 17, accent_color: 0x3b82f6, components } }, 86400);
}

export default async function handler(req, res) {
  const Mode = String(req.query.mode || "").trim().toLowerCase();
  if (Mode === "thumb") return thumbImage(req, res);
  if (Mode === "site") return siteEmbed(req, res);
  if (!HasTurso()) { res.status(500).json({ error: "No DB configured" }); return; }
  const Name = String(req.query.username || req.query.u || "").trim().toLowerCase();
  if (!Name) { res.status(400).json({ error: "Missing username" }); return; }
  try {
    const Db = GetTurso();
    const Rs = await Db.execute({
      sql: "SELECT username, display_name, description, accent_color, avatar_url, seo_title, seo_description, seo_image, desc_effect, desc_lines, suspended, hidden, embed_buttons FROM users WHERE username = ? OR alias = ? LIMIT 2",
      args: [Name, Name],
    });
    const Rows = Rs.rows || [];
    const User = Rows.find((R) => String(R.username || "").toLowerCase() === Name) || Rows[0];
    if (!User || Number(User.suspended || 0) === 1 || Number(User.hidden || 0) === 1) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const handle = User.username;
    const displayName = User.display_name || User.username;
    const twLines = User.desc_effect === "typewriter" && Array.isArray(ParseJson(User.desc_lines, null)) && ParseJson(User.desc_lines, []).length
      ? ParseJson(User.desc_lines, []).join(" / ")
      : "";
    const bio = User.seo_description || twLines || User.description || "";
    const title = User.seo_title || `${displayName} (@${handle})`;
    const bigImage = User.seo_image && String(User.seo_image).startsWith("http")
      ? String(User.seo_image)
      : `${APP_HOST}/api/og?username=${encodeURIComponent(handle)}`;
    let buttons = ParseJson(User.embed_buttons, []);
    if (!Array.isArray(buttons)) buttons = [];
    buttons = buttons
      .filter((b) => b && typeof b === "object" && b.url && /^https?:\/\//i.test(String(b.url)))
      .slice(0, 4)
      .map((b) => ({ type: 2, style: 5, label: String(b.label || "open").slice(0, 80), url: String(b.url).slice(0, 2000) }));

    const components = [
      {
        type: 9,
        components: [{ type: 10, content: `## ${MdEsc(title)}\n${MdEsc(String(bio).replace(/\s+/g, " ").trim().slice(0, 300))}` }],
        accessory: { type: 11, media: { url: `${APP_HOST}/api/embed?mode=thumb` } },
      },
      { type: 12, items: [{ media: { url: bigImage } }] },
    ];
    if (buttons.length) {
      components.push({ type: 14, spacing: 1 });
      components.push({ type: 1, components: buttons });
    }

    SendJson(res, { component: { type: 17, accent_color: AccentInt(User.accent_color), components } }, 300);
  } catch (Err) {
    console.error("embed fail:", Err);
    res.status(500).json({ error: "Failed" });
  }
}
