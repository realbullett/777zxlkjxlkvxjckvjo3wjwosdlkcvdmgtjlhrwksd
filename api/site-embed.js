const APP_HOST = "https://www.sire.lol";

const BUTTONS = [
  { type: 2, style: 5, label: "Sign Up", url: `${APP_HOST}/auth` },
  { type: 2, style: 5, label: "Leaderboard", url: `${APP_HOST}/leaderboard` },
  { type: 2, style: 5, label: "Terms", url: `${APP_HOST}/terms` },
  { type: 2, style: 5, label: "Privacy", url: `${APP_HOST}/privacy` },
];

export default async function handler(req, res) {
  try {
    const components = [
      {
        type: 9,
        components: [{ type: 10, content: "## sire.lol\ncreate your free biolink — drop your links, host your files, tell your story." }],
        accessory: { type: 11, media: { url: `${APP_HOST}/api/embed-thumb` } },
      },
      { type: 12, items: [{ media: { url: `${APP_HOST}/logo.png` } }] },
      { type: 14, spacing: 1 },
      { type: 1, components: BUTTONS },
    ];
    res.status(200);
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800");
    res.send(JSON.stringify({ component: { type: 17, accent_color: 0x3b82f6, components } }));
  } catch (Err) {
    console.error("site-embed fail:", Err);
    res.status(500).json({ error: "Failed" });
  }
}
