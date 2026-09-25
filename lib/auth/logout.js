export default function handler(req, res) {
  const Host = (req.headers.host || "").split(":")[0] || "";
  const Labels = Host.split(".");
  const Apex = Labels.length > 2 ? Labels.slice(1).join(".") : Host;
  const Cookies = [
    "sl_session=; Max-Age=0; Path=/",
    "sl_session=; Max-Age=0; Path=/; Domain=" + Host,
    "sl_session=; Max-Age=0; Path=/; Domain=." + Host,
    "sl_session=; Max-Age=0; Path=/; Domain=" + Apex,
    "sl_session=; Max-Age=0; Path=/; Domain=." + Apex,
  ];
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Set-Cookie", Cookies);
  res.writeHead(302, { Location: "/" });
  res.end();
}
