import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, LayoutGroup, type Variants } from "motion/react";
import { Eye, Link as LinkIcon } from "lucide-react";
import { supabase } from "../lib/supabase";
import { PLATFORMS } from "../lib/platforms";
import { FONTS } from "../lib/fonts";
import { SparkleText } from "../components/SparkleText";
import { RainEffect, SnowEffect, AuroraEffect, TvStaticEffect, ParticlesEffect, GalaxyEffect, MatrixEffect, SpotlightEffect } from "../components/BackgroundEffect";
import SongPlayer from "../components/SongPlayer";
import DiscordRPC from "../components/DiscordRPC";
import SEO from "../components/SEO";
import { CursorEffect } from "../components/CursorEffect";
import AboutPage from "../components/AboutPage";
import SongPage from "../components/SongPage";
import ProjectsPage from "../components/ProjectsPage";
import { normalizeWidgets } from "../lib/widgets";

const BADGE_FILES: Record<string, string> = {
  verified: "verified.png",
  premium: "premium.png",
  og: "og.png",
  booster: "booster.png",
  staff: "staff.png",
  bug: "bug.png",
  corrupt: "corrupt.png",
};

const BADGE_LABELS: Record<string, string> = {
  bug: "bug hunter",
};

const dropContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
const dropItem: Variants = {
  hidden: { opacity: 0, y: -28 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 22 } },
};

const PREMIUM_DISPLAY_EFFECTS = new Set(["glitch", "neon", "gradient-flow", "shine-sweep"]);
const PREMIUM_BG_EFFECTS = new Set(["particles", "galaxy", "matrix", "spotlight"]);

type User = {
  id: number;
  username: string;
  alias: string | null;
  display_name: string | null;
  email: string;
  avatar_url: string;
  discord_id: string | null;
  discord_rpc_enabled: boolean | null;
  views_blacklisted: boolean;
  description: string | null;
  accent_color: string | null;
  text_color: string | null;
  background_color: string | null;
  icon_color: string | null;
  bg_effect_color: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  show_username: boolean | null;
  display_effect: string | null;
  font: string | null;
  video_audio: boolean | null;
  bg_effect: string | null;
  song_platform: string | null;
  song_id: string | null;
  entry_text: string | null;
  entry_font: string | null;
  entry_color: string | null;
  entry_effect: string | null;
  desc_effect: string | null;
  desc_effect_speed: number | null;
  desc_lines: string[] | null;
  monochrome_icons: boolean;
  monochrome_badges: boolean;
  banner_enabled: boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_image: string | null;
  seo_favicon: string | null;
  panel_mouse_follow: boolean | null;
  audio_volume: number | null;
  audio_autoplay: boolean | null;
  audio_loop: boolean | null;
  audio_shuffle: boolean | null;
  cursor_effect: string | null;
  avatar_shape: string | null;
  avatar_size: number | null;
  avatar_offset_x: number | null;
  avatar_offset_y: number | null;
  name_offset_x: number | null;
  name_offset_y: number | null;
  badge_offset_x: number | null;
  badge_offset_y: number | null;
  desc_offset_x: number | null;
  desc_offset_y: number | null;
  song_offset_x: number | null;
  song_offset_y: number | null;
  discord_rpc_offset_x: number | null;
  discord_rpc_offset_y: number | null;
  panel_opacity: number | null;
  panel_hidden: boolean | null;
  widgets: unknown;
};

type Asset = {
  type: string;
  url: string;
};

export default function Biolink() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [entered, setEntered] = useState(new URLSearchParams(window.location.search).get("entry") === "skip");
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [badges, setBadges] = useState<string[]>([]);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);
  const [hoveredUid, setHoveredUid] = useState(false);
  const [activePage, setActivePage] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const activePageRef = useRef(0);
  const lastWheelRef = useRef(0);
  const lastNavRef = useRef(0);
  const wheelAccumRef = useRef(0);
  const scrollAnimRef = useRef(0);
  const touchRef = useRef<{ y: number; allow: boolean } | null>(null);
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getPageTops = () =>
    Array.from(document.querySelectorAll<HTMLElement>(".snap-page")).map((el) => el.getBoundingClientRect().top + window.scrollY);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    activePageRef.current = 0;
    setActivePage(0);
    if (!username) return;
    supabase.from("users").select("id,username,alias,display_name,avatar_url,description,accent_color,text_color,background_color,icon_color,bg_effect_color,primary_color,secondary_color,show_username,display_effect,font,video_audio,bg_effect,song_platform,song_id,entry_text,entry_font,entry_color,entry_effect,desc_effect,desc_effect_speed,desc_lines,monochrome_icons,monochrome_badges,banner_enabled,seo_title,seo_description,seo_image,seo_favicon,panel_mouse_follow,audio_volume,audio_autoplay,audio_loop,audio_shuffle,cursor_effect,avatar_shape,avatar_size,avatar_offset_x,avatar_offset_y,name_offset_x,name_offset_y,badge_offset_x,badge_offset_y,desc_offset_x,desc_offset_y,song_offset_x,song_offset_y,discord_rpc_offset_x,discord_rpc_offset_y,panel_opacity,panel_hidden,discord_id,discord_rpc_enabled,views_blacklisted,widgets").or(`username.eq.${username},alias.eq.${username}`).then(({ data, error }) => {
      const rows = data || [];
      const match = rows.find((r) => r.username === username) || rows[0];
      if (error || !match) setNotFound(true);
      else {
        setUser(match);
        supabase.from("page_views").select("*", { count: "exact", head: true }).eq("user_id", match.id).then(({ count }) => {
          if (count !== null) setViewCount(count);
        });
        supabase.from("badges").select("badge").eq("user_id", match.id).then(({ data: b }) => {
          if (b) setBadges(b.map((r) => r.badge));
        });
        supabase.from("assets").select("type,url").eq("user_id", match.id).then(({ data: a }) => {
          if (a) setAssets(a);
        });
        supabase.from("links").select("platform,url").eq("user_id", match.id).then(({ data: l }) => {
          if (l) {
            const m: Record<string, string> = {};
            for (const x of l) m[x.platform] = x.url;
            setLinks(m);
          }
        });
      }
    });
  }, [username]);

  const animateScrollTo = (targetY: number, duration = 900) => {
    cancelAnimationFrame(scrollAnimRef.current);
    const startY = window.scrollY;
    const dist = targetY - startY;
    if (Math.abs(dist) < 2) return;
    const t0 = performance.now();
    const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const step = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - t0) / duration));
      window.scrollTo({ top: startY + dist * easeInOutCubic(p), behavior: "instant" });
      if (p < 1) scrollAnimRef.current = requestAnimationFrame(step);
    };
    scrollAnimRef.current = requestAnimationFrame(step);
  };

  const goToPage = (i: number) => {
    const pages = user ? normalizeWidgets(user.widgets).pages : 1;
    const idx = Math.max(0, Math.min(pages - 1, i));
    if (idx === activePageRef.current) return;
    activePageRef.current = idx;
    setActivePage(idx);
    const targetY = getPageTops()[idx] ?? idx * window.innerHeight;
    animateScrollTo(targetY);
  };

  useEffect(() => {
    if (!user) return;
    const pages = normalizeWidgets(user.widgets).pages;
    const onScroll = () => {
      const tops = getPageTops();
      const y = window.scrollY;
      let idx = 0;
      for (let i = 0; i < tops.length; i++) {
        if (tops[i] <= y + window.innerHeight * 0.5) idx = i;
      }
      idx = Math.min(pages - 1, Math.max(0, idx));
      activePageRef.current = idx;
      setActivePage(idx);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [user]);

  useEffect(() => {
    if (!user || !entered) return;
    const pages = normalizeWidgets(user.widgets).pages;
    if (pages <= 1) return;
    const onWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.(".allow-scroll")) return;
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheelRef.current > 400) wheelAccumRef.current = 0;
      lastWheelRef.current = now;
      const factor = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? window.innerHeight : 1;
      wheelAccumRef.current += e.deltaY * factor;
      if (Math.abs(wheelAccumRef.current) < 60) return;
      if (now - lastNavRef.current < 700) return;
      const dir = wheelAccumRef.current > 0 ? 1 : -1;
      wheelAccumRef.current = 0;
      lastNavRef.current = now;
      goToPage(activePageRef.current + dir);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        goToPage(activePageRef.current + 1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        goToPage(activePageRef.current - 1);
      }
    };
    const onTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      touchRef.current = { y: e.touches[0].clientY, allow: !!target?.closest?.(".allow-scroll") };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!touchRef.current || touchRef.current.allow) return;
      e.preventDefault();
    };
    const onTouchEnd = (e: TouchEvent) => {
      const t = touchRef.current;
      touchRef.current = null;
      if (!t || t.allow) return;
      const dy = e.changedTouches[0].clientY - t.y;
      if (Math.abs(dy) > 40) goToPage(activePageRef.current + (dy < 0 ? 1 : -1));
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [user, entered]);

  useEffect(() => {
    if (!user) return;
    const root = document.documentElement;
    const on = normalizeWidgets(user.widgets).pages > 1;
    root.classList.toggle("snap-container", on);
    return () => root.classList.remove("snap-container");
  }, [user]);

  const getAsset = (type: string) => assets.find((a) => a.type === type)?.url;

  const bg = getAsset("background");
  const videoBg = getAsset("video_background");
  const videoAudio = user?.video_audio || false;
  const banner = getAsset("banner");
  const pa = getAsset("profile_avatar");
  const audio1 = getAsset("audio_1");
  const audio2 = getAsset("audio_2");
  const audioTracks = [audio1, audio2].filter(Boolean) as string[];
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);

  useEffect(() => {
    if (audioTracks.length > 0) {
      if (user?.audio_shuffle) {
        const randomIndex = Math.floor(Math.random() * audioTracks.length);
        setSelectedAudio(audioTracks[randomIndex]);
      } else {
        setSelectedAudio(audioTracks[0]);
      }
    } else {
      setSelectedAudio(null);
    }
  }, [assets, user?.audio_shuffle]);

  const audio = selectedAudio || audio1 || null;
  const cursor = getAsset("custom_cursor");

  const [cursorDataUrl, setCursorDataUrl] = useState<string | null>(null);

  // Apply user colors to CSS custom properties
  useEffect(() => {
    if (!user) return;
    const root = document.documentElement;
    if (user.accent_color) root.style.setProperty("--accent-color", user.accent_color);
    if (user.text_color) root.style.setProperty("--text-color", user.text_color);
    if (user.background_color) root.style.setProperty("--background-color", user.background_color);
    if (user.icon_color) root.style.setProperty("--icon-color", user.icon_color);
    if (user.bg_effect_color) root.style.setProperty("--bg-effect-color", user.bg_effect_color);
    if (user.primary_color) root.style.setProperty("--primary-color", user.primary_color);
    if (user.secondary_color) root.style.setProperty("--secondary-color", user.secondary_color);
    return () => {
      const root = document.documentElement;
      root.style.removeProperty("--accent-color");
      root.style.removeProperty("--text-color");
      root.style.removeProperty("--background-color");
      root.style.removeProperty("--icon-color");
      root.style.removeProperty("--bg-effect-color");
      root.style.removeProperty("--primary-color");
      root.style.removeProperty("--secondary-color");
    };
  }, [user]);

  // Keep video muted state in sync with videoAudio
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoAudio;
    }
  }, [videoAudio]);

  useEffect(() => {
    if (!cursor) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = 32; c.height = 32;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0, 32, 32);
      setCursorDataUrl(c.toDataURL());
    };
    img.onerror = () => console.error("Cursor image failed to load:", cursor);
    img.src = cursor;
  }, [cursor]);

  useEffect(() => {
    if (!cursorDataUrl) return;
    const style = document.createElement("style");
    style.id = "custom-cursor-style";
    style.textContent = `* { cursor: url("${cursorDataUrl}"), auto !important; }`;
    document.head.appendChild(style);
    return () => { const s = document.getElementById("custom-cursor-style"); if (s) s.remove(); };
  }, [cursorDataUrl]);

  useEffect(() => {
    if (!user || user.bg_effect !== "rain" || !entered) return;
    let timeout: number;
    const thunder = () => {
      const ctx = new AudioContext();
      const noise = ctx.createBufferSource();
      const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.8));
      noise.buffer = buf;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(150, ctx.currentTime);
      noise.connect(filter).connect(gain).connect(ctx.destination);
      noise.start();
      noise.stop(ctx.currentTime + 2);
      timeout = setTimeout(thunder, 8000 + Math.random() * 17000);
    };
    timeout = setTimeout(thunder, 5000 + Math.random() * 10000);
    return () => clearTimeout(timeout);
  }, [user, entered]);

  useEffect(() => {
    if (!user?.username) return;
    const text = "@" + user.username;
    let i = 0;
    let dir = 1;
    let timer: number;
    const tick = () => {
      document.title = text.slice(0, i) + "|";
      i += dir;
      if (i > text.length) { i = text.length; dir = -1; timer = setTimeout(tick, 1500); return; }
      if (i < 0) { i = 0; dir = 1; timer = setTimeout(tick, 800); return; }
      timer = setTimeout(tick, 100 + Math.random() * 60);
    };
    timer = setTimeout(tick, 500);
    return () => { clearTimeout(timer); document.title = "sire.lol"; };
  }, [user?.username]);

  const getVisitorId = (): string => {
    let vid = localStorage.getItem("sl_visitor");
    if (!vid) {
      vid = crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("sl_visitor", vid);
    }
    return vid;
  };

  useEffect(() => {
    return () => {
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    };
  }, []);

  const handleEnter = async () => {
    window.scrollTo({ top: 0, behavior: "instant" });
    activePageRef.current = 0;
    setActivePage(0);
    setEntered(true);
    const wcfg = user ? normalizeWidgets(user.widgets) : null;
    const hasSongPage = !!wcfg && wcfg.pages >= 3 && !!wcfg.song;
    const enteredAt = Date.now();
    if (user && !user.views_blacklisted) {
      enterTimerRef.current = setTimeout(async () => {
        if (document.visibilityState !== "visible") return;
        const vid = getVisitorId();
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: existing } = await supabase
          .from("page_views")
          .select("id")
          .eq("user_id", user.id)
          .eq("visitor_id", vid)
          .gte("viewed_at", sevenDaysAgo)
          .maybeSingle();
        if (!existing) {
          const r = await fetch("/api/track-view", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user.id, visitor_id: vid, dwell_ms: Date.now() - enteredAt }),
          });
          const res = await r.json().catch(() => ({}));
          if (res.counted) setViewCount((prev) => (prev !== null ? prev + 1 : prev));
        }
      }, 3000);
    }
    if (audioRef.current && !hasSongPage && (user?.audio_autoplay ?? true)) {
      audioRef.current.volume = (user?.audio_volume ?? 30) / 100;
      audioRef.current.loop = user?.audio_loop ?? true;
      audioRef.current.play().catch(() => {});
    }
    if (videoBg && videoRef.current) {
      videoRef.current.muted = !videoAudio;
      videoRef.current.play().catch(() => {});
    }
  };

  if (notFound) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(37,99,235,0.08),transparent_70%)]" />
        <div className="text-center relative">
          <p className="text-white/20 text-sm mb-4">404 — page not found</p>
          <button onClick={() => navigate("/")} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            sire.lol
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isPremium = badges.includes("premium");
  const widgetCfg = normalizeWidgets(user.widgets);
  const pageCount = widgetCfg.pages;
  const hasSongPage = pageCount >= 3 && !!widgetCfg.song;
  const displayEffect =
    isPremium || !PREMIUM_DISPLAY_EFFECTS.has(user.display_effect || "")
      ? user.display_effect
      : "none";
  const bgEffect =
    isPremium || !PREMIUM_BG_EFFECTS.has(user.bg_effect || "")
      ? user.bg_effect
      : "none";

  return (
    <>
      <SEO
        title={user.seo_title || `${user.display_name || user.username} — sire.lol`}
        description={user.seo_description || ((user.desc_effect === "typewriter" && user.desc_lines?.length ? user.desc_lines.join(" / ") : user.description || "") || undefined)}
        image={user.seo_image || `/api/og?username=${user.username}`}
        path={`/${user.username}`}
        favicon={user.seo_favicon || undefined}
      />
      <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: "var(--background-color, #080808)" }}>
      {videoBg ? (
        <video
          key={videoBg}
          ref={videoRef}
          src={videoBg}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
          onLoadedMetadata={() => videoRef.current?.play().catch(() => {})}
        />
      ) : bg ? (
        <img src={bg} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, var(--bg-effect-color, #ffffff) 0%, transparent 70%)" }} />
      )}
      {bgEffect === "rain" && <RainEffect />}
      {bgEffect === "snow" && <SnowEffect />}
      {bgEffect === "aurora" && <AuroraEffect />}
      {bgEffect === "tv" && <TvStaticEffect />}
      {bgEffect === "particles" && <ParticlesEffect />}
      {bgEffect === "galaxy" && <GalaxyEffect />}
      {bgEffect === "matrix" && <MatrixEffect />}
      {bgEffect === "spotlight" && <SpotlightEffect />}
      {user?.cursor_effect && user?.cursor_effect !== "none" && <CursorEffect type={user.cursor_effect} />}
      <div className="absolute inset-0 bg-black/30" />

      {audio && !hasSongPage && <audio ref={audioRef} src={audio} loop />}

      <EntryOverlay
        entered={entered}
        handleEnter={handleEnter}
        text={user.entry_text || "click anywhere to enter"}
        fontFamily={FONTS.find(f => f.name === (user.entry_font || "Inter"))?.family || "'Inter', sans-serif"}
        color={user.entry_color || "rgba(255,255,255,0.5)"}
        effect={user.entry_effect || "none"}
      />

<motion.div
        id="bio-page-1"
        initial={{ opacity: 0, y: 20 }}
        animate={entered ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="relative z-0 flex min-h-screen snap-page"
      >
        <div className="m-auto text-center w-full max-w-2xl px-8">
          <div
            ref={cardRef}
            onMouseMove={(e) => {
              if (!user?.panel_mouse_follow || !cardRef.current) return;
              cardRef.current.style.transition = "none";
              const rect = cardRef.current.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const centerX = rect.width / 2;
              const centerY = rect.height / 2;
              const moveX = ((x - centerX) / centerX) * 15;
              const moveY = ((y - centerY) / centerY) * 15;
              const rotateX = ((y - centerY) / centerY) * -10;
              const rotateY = ((x - centerX) / centerX) * 10;
              cardRef.current.style.transform = `translate(${moveX}px, ${moveY}px) perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            }}
            onMouseLeave={() => {
              if (cardRef.current) {
                cardRef.current.style.transition = "transform 0.5s ease-out";
                cardRef.current.style.transform = "";
              }
            }}
            className={`relative ${user?.panel_hidden ? "" : "glass-card rounded-3xl p-8 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]"}`}
            style={{
              backgroundColor: (() => {
                if (user?.panel_hidden) return "transparent";
                const base = user?.accent_color || "rgba(255, 255, 255, 0.05)";
                const opacity = (user?.panel_opacity ?? 100) / 100;
                if (base.startsWith("rgba")) {
                  return base.replace(/[\d.]+\)$/, `${opacity})`);
                }
                if (base.startsWith("#")) {
                  const r = parseInt(base.slice(1, 3), 16);
                  const g = parseInt(base.slice(3, 5), 16);
                  const b = parseInt(base.slice(5, 7), 16);
                  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
                }
                return base;
              })(),
              borderColor: user?.panel_hidden ? "transparent" : "var(--primary-color, rgba(255, 255, 255, 0.1))",
              borderWidth: "1px",
              borderStyle: "solid",
              willChange: "transform",
            }}>
            <motion.div variants={dropContainer} initial="hidden" animate={entered ? "show" : "hidden"}>
            {user.banner_enabled && banner && (
              <div className="absolute top-0 left-0 right-0 h-32 overflow-hidden">
                <img src={banner} className="w-full h-full object-cover" />
              </div>
            )}
            <motion.div variants={dropItem} className={user.banner_enabled && banner ? "pt-24" : ""}>
              {(() => {
                const shape = user.avatar_shape || "circle";
                const size = user.avatar_size || 96;
                const offX = user.avatar_offset_x || 0;
                const offY = user.avatar_offset_y || 0;
                const roundClass = shape === "rounded" ? "rounded-2xl" : "rounded-full";
                const src = pa || user.avatar_url;
                return src ? (
                  <img src={src} className={`${roundClass} mx-auto mb-4 object-cover`} style={{ width: size, height: size, transform: `translate(${offX}px, ${offY}px)` }} />
                ) : (
                  <div className={`${roundClass} mx-auto mb-4 bg-white/[0.04] border border-white/[0.06]`} style={{ width: size, height: size, transform: `translate(${offX}px, ${offY}px)` }} />
);
                })()}
              </motion.div>
              <div className="relative" style={{ transform: `translate(${user.name_offset_x || 0}px, ${user.name_offset_y || 0}px)` }}>
                <motion.div variants={dropItem}>
                <h1
                  onMouseEnter={() => setHoveredUid(true)}
                  onMouseLeave={() => setHoveredUid(false)}
                  className={`inline-block text-2xl font-black tracking-tight mb-1 ${displayEffect !== "sparkle" && displayEffect !== "none" ? `display-effect-${displayEffect}` : ""}`}
                  style={{ color: "var(--text-color, #ffffff)", fontFamily: FONTS.find(f => f.name === (user.font || "Inter"))?.family || "'Inter', sans-serif" }}
                >
                  {displayEffect === "sparkle" ? (
                    <SparkleText text={user.display_name || user.username} />
                  ) : (
                    user.display_name || user.username
                  )}
                </h1>
                </motion.div>
                <AnimatePresence>
                  {hoveredUid && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#131316]/95 backdrop-blur-md border border-white/10 px-3 py-1.5 text-xs shadow-xl shadow-black/40 pointer-events-none"
                    >
                      <span className="text-white/40 font-semibold">uid</span>{" "}
                      <span className="text-blue-400 font-bold">#{user.id}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {badges.length > 0 && (
                <motion.div variants={dropContainer} style={{ transform: `translate(${user.badge_offset_x || 0}px, ${user.badge_offset_y || 0}px)` }}>
                  <div className="flex items-center justify-center mb-4">
                    <LayoutGroup>
                      <motion.div
                        layout
                        onMouseLeave={() => setHoveredBadge(null)}
                        className="flex items-center justify-center gap-2 h-11 rounded-xl bg-white/[0.06] px-4"
                        style={{ width: `${badges.length * 32 + 20}px` }}
                      >
                        {badges.map((b) => {
                          const src = BADGE_FILES[b] ? `/emojis/${BADGE_FILES[b]}` : null;
                          if (!src) return null;
                          return (
                            <motion.div
                              key={b}
                              layout
                              variants={dropItem}
                              onMouseEnter={() => setHoveredBadge(b)}
                              className="relative flex items-center justify-center"
                            >
                              <motion.img
                                src={src}
                                alt={b}
                                className={`h-7 w-7 object-contain ${b !== "booster" ? "brightness-150" : ""} ${user?.monochrome_badges ? "grayscale brightness-150" : ""}`}
                                whileHover={{ scale: 1.15 }}
                                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                              />
                              {hoveredBadge === b && (
                          <motion.div
                            layoutId="tooltip"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#222] px-2.5 py-1 text-xs font-semibold text-white/90 shadow-lg pointer-events-none capitalize"
                          >
                            {BADGE_LABELS[b] || b}
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                  </motion.div>
                </LayoutGroup>
              </div>
              </motion.div>
            )}
            <motion.div variants={dropItem}>
              {user.show_username !== false && (
                <p className="text-xs mb-3" style={{ color: "var(--text-color, #ffffff)", opacity: 0.4 }}>@{user.username}</p>
              )}
            </motion.div>
            <motion.div variants={dropItem}>
              <div style={{ transform: `translate(${user.desc_offset_x || 0}px, ${user.desc_offset_y || 0}px)` }}>
              {user.desc_effect === "typewriter" ? (
                user.desc_lines?.length || user.description ? (
                  <TypewriterDesc lines={user.desc_lines?.length ? user.desc_lines : [user.description || ""]} speed={user.desc_effect_speed ?? 50} />
                ) : null
              ) : user.description && (
                <p className="text-sm max-w-xs mx-auto mb-6" style={{ color: "var(--text-color, #ffffff)" }}>{user.description}</p>
              )}
              </div>
            </motion.div>
            <motion.div variants={dropItem}>
              {(user.discord_rpc_enabled && user.discord_id) || (user.song_platform && user.song_id) ? (
                <div className="flex items-center justify-center gap-3 mb-6 px-4">
                  {user.discord_rpc_enabled && user.discord_id && (
                    <div className="w-full max-w-xs" style={{ transform: `translate(${user.discord_rpc_offset_x || 0}px, ${user.discord_rpc_offset_y || 0}px)` }}>
                      <DiscordRPC discordId={user.discord_id} />
                    </div>
                  )}
                  {user.song_platform && user.song_id && (
                    <div className="w-full max-w-xs" style={{ transform: `translate(${user.song_offset_x || 0}px, ${user.song_offset_y || 0}px)` }}>
                      <SongPlayer platform={user.song_platform as "youtube" | "spotify"} id={user.song_id} />
                    </div>
                  )}
                </div>
              ) : null}
            </motion.div>
            <motion.div variants={dropItem}>
              {Object.keys(links).length > 0 && (
                <div className={`flex items-center justify-center flex-wrap mb-6 ${Object.keys(links).length > 1 ? "gap-2" : "gap-3"}`}>
                  {Object.keys(links).map((key) => {
                    const p = PLATFORMS.find((x) => x.id === key);
                    return (
                      <a
                        key={key}
                        href={links[key]}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={p ? p.name : key}
                        className="transition-all hover:scale-110"
                      >
                        {p ? (
                          <img src={p.logoUrl} alt={p.name} className={`h-8 w-8 ${user.monochrome_icons ? "grayscale brightness-150" : ""}`} />
                        ) : (
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white">
                            <LinkIcon size={16} />
                          </span>
                        )}
                      </a>
                    );
                  })}
                </div>
              )}
            </motion.div>
            <motion.div variants={dropItem}>
              {(user.views_blacklisted || viewCount !== null) && (
                <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                  <Eye size={16} className="text-white" />
                  <span className="text-sm font-bold text-white">
                    {user.views_blacklisted ? "NULL" : viewCount}
                  </span>
                </div>
              )}
            </motion.div>
            </motion.div>
</div>
          </div>
        </motion.div>
          {isPremium && pageCount >= 2 && widgetCfg.about ? (
            <motion.div
              id="bio-page-2"
              initial={{ opacity: 0 }}
              animate={entered ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative z-0 flex min-h-screen items-center justify-center px-8 snap-page"
            >
              <AboutPage config={widgetCfg.about} discordId={user.discord_id} discordEnabled={user.discord_rpc_enabled} />
            </motion.div>
          ) : null}
          {isPremium && pageCount >= 3 && widgetCfg.song ? (
            <motion.div
              id="bio-page-3"
              initial={{ opacity: 0 }}
              animate={entered ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative z-0 flex min-h-screen items-center justify-center px-8 snap-page"
            >
              <SongPage url={widgetCfg.song.url} autoPlay={entered} />
            </motion.div>
          ) : null}
          {isPremium && pageCount >= 4 && widgetCfg.projects ? (
            <motion.div
              id="bio-page-4"
              initial={{ opacity: 0 }}
              animate={entered ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="relative z-0 flex min-h-screen items-center justify-center px-8 snap-page"
            >
              <ProjectsPage config={widgetCfg.projects} />
            </motion.div>
          ) : null}
          {isPremium && pageCount > 1 ? (
            <div
              className="fixed right-6 top-1/2 z-[5] flex -translate-y-1/2 flex-col items-center gap-2 rounded-full border border-white/10 bg-black/40 px-2 py-3 backdrop-blur-md transition-all hover:border-white/30"
              aria-label="page navigation"
            >
              {Array.from({ length: pageCount }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToPage(i)}
                  className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${activePage === i ? "bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)] scale-125 cursor-default" : "bg-white/25 cursor-pointer hover:bg-white/50"}`}
                  aria-label={`go to page ${i + 1}`}
                />
              ))}
            </div>
          ) : null}
      </div>
      </>
    );
}

function TypewriterDesc({ lines, speed }: { lines: string[]; speed?: number }) {
  const [displayText, setDisplayText] = useState(lines[0] || "");
  const maxLine = lines.reduce((a, b) => a.length >= b.length ? a : b, "");
  useEffect(() => {
    if (lines.length === 0) return;
    let lineIdx = 0, charIdx = 0, dir = 1, pause = 0;
    setDisplayText("");
    const timer = setInterval(() => {
      if (pause > 0) { pause--; return; }
      charIdx += dir;
      const line = lines[lineIdx] || "";
      if (dir === 1) {
        setDisplayText(line.slice(0, charIdx));
        if (charIdx >= line.length) { pause = 4; dir = -1; }
      } else {
        setDisplayText(line.slice(0, charIdx));
        if (charIdx <= 0) { pause = 2; lineIdx = (lineIdx + 1) % lines.length; dir = 1; }
      }
    }, speed ?? 50);
    return () => clearInterval(timer);
  }, [lines, speed]);
  return (
    <p className="text-sm max-w-xs mx-auto mb-6" style={{ color: "var(--text-color, #ffffff)", display: "grid" }}>
      <span className="invisible" style={{ gridArea: "1/1" }}>{maxLine}</span>
      <span style={{ gridArea: "1/1" }}>{displayText}</span>
    </p>
  );
}

function EntryOverlay({ entered, handleEnter, text, fontFamily, color, effect }: {
  entered: boolean;
  handleEnter: () => void;
  text: string;
  fontFamily: string;
  color: string;
  effect: string;
}) {
  const [displayText, setDisplayText] = useState(effect === "typewriter" ? "" : text);

  useEffect(() => {
    if (effect !== "typewriter" || entered) { setDisplayText(text); return; }
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayText(text.slice(0, i));
      if (i >= text.length) clearInterval(timer);
    }, 50);
    return () => clearInterval(timer);
  }, [text, effect, entered]);

  return (
    <AnimatePresence>
      {!entered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-10 flex items-center justify-center cursor-pointer bg-black"
          onClick={handleEnter}
        >
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-center"
          >
            <p className="text-lg lowercase" style={{ fontFamily, color }}>{displayText}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
