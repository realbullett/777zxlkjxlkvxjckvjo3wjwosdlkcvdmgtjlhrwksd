export default async function handler(req, res) {
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
