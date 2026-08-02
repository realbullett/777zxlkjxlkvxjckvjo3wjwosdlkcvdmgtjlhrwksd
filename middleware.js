const BOT_AGENTS = ["discordbot", "twitterbot", "facebookexternalhit", "slackbot", "whatsapp", "telegrambot", "googlebot", "bingbot", "slurp", "duckduckbot", "baiduspider", "yandexbot", "linkedinbot", "slack"];

export default async function middleware(req) {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Dynamic sitemap for bots
  if (pathname === "/sitemap.xml") {
    const ua = (req.headers.get("user-agent") || "").toLowerCase();
    const isBot = BOT_AGENTS.some((b) => ua.includes(b));
    if (!isBot) return;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return;

    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/users?select=username,updated_at&order=updated_at.desc&limit=5000`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );
      const rows = await res.json();
      const now = new Date().toISOString().split("T")[0];
      const urls = rows
        .map((r) => {
          const lastmod = r.updated_at ? r.updated_at.split("T")[0] : now;
          return `  <url>
    <loc>https://sire.lol/${esc(r.username)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
        })
        .join("\n");

      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://sire.lol/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://sire.lol/login</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://sire.lol/auth</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://sire.lol/leaderboard</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://sire.lol/privacy</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://sire.lol/terms</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
${urls}
</urlset>`,
        {
          status: 200,
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=0, s-maxage=86400",
          },
        }
      );
    } catch {}
  }

  const segments = pathname.slice(1).split("/");
  if (segments.length !== 1 || !segments[0]) return;

  const ua = (req.headers.get("user-agent") || "").toLowerCase();
  const isBot = BOT_AGENTS.some((b) => ua.includes(b));
  if (!isBot) return;

  const username = segments[0];
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return;

  let title = "sire.lol — free biolink | one link for everything";
  let description = "create your free biolink on sire.lol — drop your links, host your files, tell your story. no templates, no bullshit.";
  let image = "https://sire.lol/logo.png";
  let canonical = `https://sire.lol/${username}`;
  let found = false;

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/users?or=(username.eq.${encodeURIComponent(username)},alias.eq.${encodeURIComponent(username)})&select=username,alias,display_name,description,desc_effect,desc_lines,seo_title,seo_description,seo_image`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );
    const rows = await res.json();
    if (rows && rows.length > 0) {
      found = true;
      const data = rows[0];
      title = data.seo_title || data.alias || `${username} — sire.lol`;
      const twLines = data.desc_effect === "typewriter" && Array.isArray(data.desc_lines) && data.desc_lines.length
        ? data.desc_lines.join(" / ")
        : "";
      const fallbackDesc = twLines || data.description || "";
      description = data.seo_description || (fallbackDesc ? String(fallbackDesc).replace(/\s+/g, " ").trim().slice(0, 160) : `check out ${data.alias || username} on sire.lol`);
      if (data.seo_image)
        image = data.seo_image.startsWith("http") ? data.seo_image : `https://sire.lol${data.seo_image}`;
      else
        image = `https://sire.lol/api/og?username=${data.username}`;
      // Use actual username for canonical URL
      canonical = `https://sire.lol/${data.username}`;
    }
  } catch {}

  if (!found) return;

  return new Response(
    `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="${esc(canonical)}" />
<link rel="icon" type="image/png" href="https://sire.lol/logo.png" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="sire.lol" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:url" content="${esc(canonical)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${esc(image)}" />
</head>
<body>
<p>Redirecting...</p>
</body>
</html>`,
    {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=0, s-maxage=3600",
      },
    }
  );
}

function esc(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export const config = {
  matcher: "/:path",
};
