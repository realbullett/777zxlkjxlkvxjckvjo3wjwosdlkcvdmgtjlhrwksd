export const FONTS = [
  { name: "Inter", family: "'Inter', sans-serif" },
  { name: "DM Sans", family: "'DM Sans', sans-serif" },
  { name: "Playfair Display", family: "'Playfair Display', serif" },
  { name: "Cinzel", family: "'Cinzel', serif" },
  { name: "Orbitron", family: "'Orbitron', sans-serif" },
  { name: "Pacifico", family: "'Pacifico', cursive" },
  { name: "Bebas Neue", family: "'Bebas Neue', sans-serif" },
  { name: "Unbounded", family: "'Unbounded', sans-serif" },
  { name: "Space Mono", family: "'Space Mono', monospace" },
  { name: "Bricolage Grotesque", family: "'Bricolage Grotesque', sans-serif" },
  { name: "Instrument Sans", family: "'Instrument Sans', sans-serif" },
  { name: "Plus Jakarta Sans", family: "'Plus Jakarta Sans', sans-serif" },
];
export const CUSTOM_FONT_NAME = "Custom";
export const CUSTOM_FONT_FAMILY = "'SireCustomFont', sans-serif";

export function FontFormatFor(filename: string | undefined | null): string | null {
  const ext = String(filename || "").trim().toLowerCase().split(".").pop() || "";
  if (ext === "ttf") return "truetype";
  if (ext === "otf") return "opentype";
  if (ext === "woff") return "woff";
  if (ext === "woff2") return "woff2";
  return null;
}

export function CustomFontFace(url: string, filename: string | undefined | null): string {
  const fmt = FontFormatFor(filename);
  return `@font-face { font-family: 'SireCustomFont'; src: url('${url}')${fmt ? ` format('${fmt}')` : ""}; font-display: swap; }`;
}
export function ResolveFontFamily(name: string | undefined | null, hasCustom: boolean) {
  if (name === CUSTOM_FONT_NAME && hasCustom) return CUSTOM_FONT_FAMILY;
  return FONTS.find(f => f.name === (name || "Inter"))?.family || "'Inter', sans-serif";
}
