export default function handler(req, res) {
  const Host = req.headers.host || "";
  const Cookies = [
    "sl_session=; Max-Age=0; Path=/",
    "sl_session=; Max-Age=0; Path=/; Domain=" + Host,
    "sl_session=; Max-Age=0; Path=/; Domain=." + Host,
  ];
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Set-Cookie", Cookies);
  res.writeHead(302, { Location: "/" });
  res.end();
}
