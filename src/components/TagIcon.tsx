import { Braces, Database } from "lucide-react";
import {
  SiC,
  SiCplusplus,
  SiCss,
  SiDart,
  SiDotnet,
  SiGo,
  SiHtml5,
  SiJavascript,
  SiKotlin,
  SiMysql,
  SiOpenjdk,
  SiPhp,
  SiPostgresql,
  SiPython,
  SiRuby,
  SiRust,
  SiSwift,
  SiTypescript,
} from "react-icons/si";

const ICON_MAP: Record<string, { Icon: typeof SiJavascript; color: string }> = {
  javascript: { Icon: SiJavascript, color: "#F7DF1E" },
  js: { Icon: SiJavascript, color: "#F7DF1E" },
  typescript: { Icon: SiTypescript, color: "#3178C6" },
  ts: { Icon: SiTypescript, color: "#3178C6" },
  python: { Icon: SiPython, color: "#3776AB" },
  py: { Icon: SiPython, color: "#3776AB" },
  java: { Icon: SiOpenjdk, color: "#EA2D2E" },
  "c": { Icon: SiC, color: "#A8B9CC" },
  "c++": { Icon: SiCplusplus, color: "#00599C" },
  cpp: { Icon: SiCplusplus, color: "#00599C" },
  "c#": { Icon: SiDotnet, color: "#512BD4" },
  csharp: { Icon: SiDotnet, color: "#512BD4" },
  dotnet: { Icon: SiDotnet, color: "#512BD4" },
  go: { Icon: SiGo, color: "#00ADD8" },
  golang: { Icon: SiGo, color: "#00ADD8" },
  rust: { Icon: SiRust, color: "#dedede" },
  ruby: { Icon: SiRuby, color: "#CC342D" },
  rb: { Icon: SiRuby, color: "#CC342D" },
  php: { Icon: SiPhp, color: "#777BB4" },
  swift: { Icon: SiSwift, color: "#F05138" },
  kotlin: { Icon: SiKotlin, color: "#7F52FF" },
  kt: { Icon: SiKotlin, color: "#7F52FF" },
  html: { Icon: SiHtml5, color: "#E34F26" },
  html5: { Icon: SiHtml5, color: "#E34F26" },
  css: { Icon: SiCss, color: "#663399" },
  css3: { Icon: SiCss, color: "#663399" },
  sql: { Icon: Database, color: "#4287f5" },
  postgresql: { Icon: SiPostgresql, color: "#4169E1" },
  postgres: { Icon: SiPostgresql, color: "#4169E1" },
  mysql: { Icon: SiMysql, color: "#4479A1" },
  dart: { Icon: SiDart, color: "#0175C2" },
  flutter: { Icon: SiDart, color: "#0175C2" },
};

export default function TagIcon({ tag, size = 14 }: { tag: string; size?: number }) {
  const key = tag.trim().toLowerCase();
  const { Icon, color } = ICON_MAP[key] || ICON_MAP[key.replace(/[^a-z0-9+#]/g, "")] || { Icon: Braces, color: "#ffffff66" };
  return <Icon size={size} color={color} />;
}