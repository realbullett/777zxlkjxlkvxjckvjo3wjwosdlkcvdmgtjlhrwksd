export default function handler(req, res) {
  const host = req.headers.host || "";
  const cookies = [
    "sl_session=; Max-Age=0; Path=/",
    "sl_session=; Max-Age=0; Path=/; Domain=" + host,
    "sl_session=; Max-Age=0; Path=/; Domain=." + host,
  ];
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Set-Cookie", cookies);
  res.writeHead(302, { Location: "/" });
  res.end();
}
