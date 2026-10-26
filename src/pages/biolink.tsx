import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, LayoutGroup, type Variants } from "motion/react";
import { Eye, Link as LinkIcon, ThumbsUp, ThumbsDown, Calendar, CheckCircle2, X, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { PLATFORMS } from "../lib/platforms";
import { CUSTOM_FONT_FAMILY, ResolveFontFamily, CustomFontFace, ToSameOriginUrl } from "../lib/fonts";
import { SparkleText } from "../components/SparkleText";
import { RainEffect, SnowEffect, AuroraEffect, TvStaticEffect, ParticlesEffect, GalaxyEffect, MatrixEffect, SpotlightEffect, FireEffect, StarsEffect, BubblesEffect, FogEffect, HeartsEffect, LeavesEffect, LightningEffect, WavesEffect } from "../components/BackgroundEffect";
import SongPlayer from "../components/SongPlayer";
import VolumeControl from "../components/VolumeControl";
import { PanelTracer } from "../components/PanelTracer";
import DiscordRPC from "../components/DiscordRPC";
import DiscordServerCard from "../components/DiscordServerCard";
import RobloxCard from "../components/RobloxCard";
import LastfmCard from "../components/LastfmCard";
import ClockWidget from "../components/ClockWidget";
import SEO from "../components/SEO";
import { CursorEffect } from "../components/CursorEffect";
import AboutPage from "../components/AboutPage";
import SongPage from "../components/SongPage";
import ProjectsPage from "../components/ProjectsPage";
import { normalizeWidgets } from "../lib/widgets";
import { VerifiedIcon } from "../components/VerifiedIcon";
import { PlayClickSound } from "../lib/click-sounds";
import VerificationGate from "../components/VerificationGate";

const BADGE_FILES: Record<string, string> = {
  verified: "verified.png",
  premium: "premium.webp",
  og: "og.gif",
  booster: "booster.png",
  staff: "staff.webp",
  bug: "bug.gif",
  corrupt: "corrupt.gif",
  owner: "owner.gif",
  halloween: "halloween.gif",
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
  created_at: string | null;
  show_joindate: boolean | null;
  show_views: boolean | null;
  country: string | null;
  panel_glow_mode: string | null;
  panel_glow_color: string | null;
  panel_glow_color_2: string | null;
  panel_glow_spread: number | null;
  panel_pulse_enabled: boolean | null;
  panel_pulse_color: string | null;
  panel_pulse_speed: number | null;
  panel_pulse_type: string | null;
  show_votes: boolean | null;
  custom_font_scope: string | null;
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
  sparkle_intensity: number | null;
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
  badge_color: string | null;
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
  click_sound: string | null;
  profile_layout: string | null;
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

const AdultDomains = ["onlyfans.com", "fansly.com", "pornhub.com", "xvideos.com", "xnxx.com", "xhamster.com", "chaturbate.com", "stripchat.com", "bongacams.com", "spankbang.com", "redtube.com", "youporn.com", "eporner.com", "erome.com", "motherless.com", "rule34.xxx", "nhentai.net", "hanime.tv", "cam4.com", "livejasmin.com", "manyvids.com"];

function HostOf(Url: string) {
  try {
    return new URL(Url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function IsAdultLink(Url: string) {
  const Host = HostOf(Url);
  const Raw = Url.toLowerCase();
  return AdultDomains.some((D) => Host === D || Host.endsWith("." + D)) || /onlyfans|fansly|porn|xxx|nsfw|hentai|nhentai/.test(Raw);
}

export default function Biolink() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [Verified, SetVerified] = useState(() => {
    if (localStorage.getItem("sl_verified") !== "1") return false;
    const At = Number(localStorage.getItem("sl_verified_at") || 0);
    return !!At && Date.now() - At < 30 * 24 * 60 * 60 * 1000;
  });
  const [entered, setEntered] = useState(new URLSearchParams(window.location.search).get("entry") === "skip");
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [myVote, setMyVote] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const [badgePrefs, setBadgePrefs] = useState<Record<string, { hidden: boolean; byName: boolean }>>({});
  const visibleBadges = badges.filter((b) => !badgePrefs[b]?.hidden);
  const showVerifiedByName = badges.includes("verified") && !!badgePrefs.verified?.byName;
  const BadgeTint = String(user?.badge_color || "").trim();
  const [links, setLinks] = useState<Record<string, string>>({});
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);
  const [hoveredUid, setHoveredUid] = useState(false);
  const [LinkWarn, SetLinkWarn] = useState<{ Url: string; Adult: boolean } | null>(null);
  const [activePage, setActivePage] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const activePageRef = useRef(0);
  const lastWheelRef = useRef(0);
  const lastNavRef = useRef(0);
  const wheelAccumRef = useRef(0);
  const scrollAnimRef = useRef(0);
  const touchRef = useRef<{ y: number; allow: boolean; scroller: HTMLElement | null } | null>(null);
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enteredAtRef = useRef(0);
  const [Volume, SetVolume] = useState(() => {
    const Stored = localStorage.getItem("sire_volume");
    if (Stored === null) return 100;
    const N = Number(Stored);
    return Number.isFinite(N) ? Math.max(0, Math.min(100, N)) : 100;
  });
  const [Muted, SetMuted] = useState(() => localStorage.getItem("sire_muted") === "1");

  const getPageTops = () =>
    Array.from(document.querySelectorAll<HTMLElement>(".snap-page")).map((el) => el.getBoundingClientRect().top + window.scrollY);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    activePageRef.current = 0;
    setActivePage(0);
    if (!username || !Verified) return;
    // son turso via /api kills cached egress :sob:
    let vid = localStorage.getItem("sl_visitor");
    if (!vid) {
      vid = crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("sl_visitor", vid);
    }
    fetch(`/api/profile?username=${encodeURIComponent(username)}&voter=${encodeURIComponent(vid)}`).then(async (R) => {
      if (!R.ok) { setNotFound(true); return; }
      const J = await R.json().catch(() => null);
      if (!J?.user) { setNotFound(true); return; }
      setUser(J.user);
      if (typeof J.views === "number") setViewCount(J.views);
      if (typeof J.likes === "number") setLikes(J.likes);
      if (typeof J.dislikes === "number") setDislikes(J.dislikes);
      if (typeof J.mine === "number") setMyVote(J.mine);
      if (Array.isArray(J.badges)) setBadges(J.badges);
      if (J.badgePrefs && typeof J.badgePrefs === "object") setBadgePrefs(J.badgePrefs);
      if (J.links) setLinks(J.links);
      if (Array.isArray(J.assets)) setAssets(J.assets);
    }).catch(() => setNotFound(true));
  }, [username, Verified]);

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
      const scroller = target?.closest?.(".allow-scroll") as HTMLElement | null;
      if (scroller) {
        const down = e.deltaY > 0;
        const canDown = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight > 2;
        const canUp = scroller.scrollTop > 2;
        if ((down && canDown) || (!down && canUp)) return;
      }
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
      touchRef.current = { y: e.touches[0].clientY, allow: !!target?.closest?.(".allow-scroll"), scroller: (target?.closest?.(".allow-scroll") as HTMLElement | null) || null };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!touchRef.current || touchRef.current.allow) return;
      e.preventDefault();
    };
    const onTouchEnd = (e: TouchEvent) => {
      const t = touchRef.current;
      touchRef.current = null;
      if (!t) return;
      const dy = e.changedTouches[0].clientY - t.y;
      if (Math.abs(dy) <= 40) return;
      if (t.allow && t.scroller) {
        const next = dy < 0;
        const canDown = t.scroller.scrollHeight - t.scroller.scrollTop - t.scroller.clientHeight > 2;
        const canUp = t.scroller.scrollTop > 2;
        if ((next && canDown) || (!next && canUp)) return;
      } else if (t.allow) return;
      goToPage(activePageRef.current + (dy < 0 ? 1 : -1));
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

  useEffect(() => {
    localStorage.setItem("sire_volume", String(Volume));
    localStorage.setItem("sire_muted", Muted ? "1" : "0");
  }, [Volume, Muted]);

  useEffect(() => {
    const Gain = Muted ? 0 : Volume / 100;
    if (audioRef.current) {
      audioRef.current.volume = ((user?.audio_volume ?? 30) / 100) * Gain;
      audioRef.current.muted = Muted;
    }
    if (videoRef.current) {
      videoRef.current.volume = Gain;
      videoRef.current.muted = !videoAudio || Muted;
    }
    window.dispatchEvent(new CustomEvent("sire-volume", { detail: { Gain } }));
  }, [Volume, Muted, audio, videoBg, videoAudio, user?.audio_volume, entered]);

  const ChangeVolume = (V: number) => {
    SetVolume(V);
    SetMuted(V === 0);
  };
  const ToggleMute = () => SetMuted((M) => !M);

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
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = 32; c.height = 32;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0, 32, 32);
      setCursorDataUrl(c.toDataURL());
    };
    img.onerror = () => console.error("Cursor image failed to load:", cursor);
    img.src = ToSameOriginUrl(cursor);
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

  const relJoin = (iso: string | null | undefined): string => {
    if (!iso) return "";
    const ms = Date.now() - new Date(iso).getTime();
    if (isNaN(ms) || ms < 0) return "";
    const d = Math.floor(ms / 86400000);
    if (d < 1) return "today";
    if (d < 2) return "yesterday";
    if (d < 7) return `${d} days ago`;
    if (d < 14) return "last week";
    if (d < 30) return `${Math.floor(d / 7)} weeks ago`;
    if (d < 60) return "last month";
    if (d < 365) return `${Math.floor(d / 30)} months ago`;
    if (d < 730) return "last year";
    return `${Math.floor(d / 365)} years ago`;
  };

  useEffect(() => {
    return () => {
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const Sound = user?.click_sound;
    if (!Sound) return;
    const OnClick = () => PlayClickSound(Sound);
    window.addEventListener("click", OnClick);
    return () => window.removeEventListener("click", OnClick);
  }, [user?.click_sound]);

  const castVote = async (vote: 1 | -1) => {
    if (!user) return;
    const prevVote = myVote, prevLikes = likes, prevDislikes = dislikes;
    const next = prevVote === vote ? 0 : vote;
    setMyVote(next);
    setLikes(prevLikes + (next === 1 ? 1 : 0) - (prevVote === 1 ? 1 : 0));
    setDislikes(prevDislikes + (next === -1 ? 1 : 0) - (prevVote === -1 ? 1 : 0));
    try {
      const r = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username, voter: getVisitorId(), vote, dwell_ms: Date.now() - enteredAtRef.current }),
      });
      const J = await r.json().catch(() => null);
      if (!r.ok || J?.counted === false) {
        setMyVote(prevVote); setLikes(prevLikes); setDislikes(prevDislikes);
        return;
      }
      if (typeof J?.likes === "number") setLikes(J.likes);
      if (typeof J?.dislikes === "number") setDislikes(J.dislikes);
      const mine = typeof J?.mine === "number" ? J.mine : next;
      setMyVote(mine);
      playVoteSound(mine !== 0);
      if (mine === 1) showVoteToast("Your like got saved.", "The author will see it in their counter.");
      else if (mine === -1) showVoteToast("Your dislike got saved.", "The author will see it in their counter.");
      else showVoteToast(prevVote === 1 ? "Your like was removed." : "Your dislike was removed.", "The author will see it in their counter.");
    } catch {
      setMyVote(prevVote); setLikes(prevLikes); setDislikes(prevDislikes);
    }
  };

  const voteToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [voteToast, setVoteToast] = useState<{ title: string; sub: string } | null>(null);
  const showVoteToast = (title: string, sub: string) => {
    if (voteToastTimer.current) clearTimeout(voteToastTimer.current);
    setVoteToast({ title, sub });
    voteToastTimer.current = setTimeout(() => setVoteToast(null), 3000);
  };

  const voteAudioRef = useRef<AudioContext | null>(null);
  const playVoteSound = (saved: boolean) => {
    try {
      if (!voteAudioRef.current) voteAudioRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const ctx = voteAudioRef.current;
      if (ctx.state === "suspended") void ctx.resume();
      const notes = saved ? [660, 880] : [520, 330];
      notes.forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = f;
        const t = ctx.currentTime + i * 0.09;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
        o.connect(g); g.connect(ctx.destination);
        o.start(t); o.stop(t + 0.14);
      });
    } catch { /* no audio */ }
  };

  const handleEnter = async () => {
    window.scrollTo({ top: 0, behavior: "instant" });
    activePageRef.current = 0;
    setActivePage(0);
    setEntered(true);
    const wcfg = user ? normalizeWidgets(user.widgets) : null;
    const hasSongPage = !!wcfg && wcfg.pages >= 3 && !!wcfg.song;
    const enteredAt = Date.now();
    enteredAtRef.current = enteredAt;
    if (user && !user.views_blacklisted) {
      enterTimerRef.current = setTimeout(async () => {
        if (document.visibilityState !== "visible") return;
        const vid = getVisitorId();
        const r = await fetch("/api/track-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, visitor_id: vid, dwell_ms: Date.now() - enteredAt, referrer: document.referrer }),
        });
        const res = await r.json().catch(() => ({}));
        if (res.counted) setViewCount((prev) => (prev !== null ? prev + 1 : prev));
      }, 3000);
    }
    if (audioRef.current && !hasSongPage && (user?.audio_autoplay ?? true)) {
      audioRef.current.volume = ((user?.audio_volume ?? 30) / 100) * (Muted ? 0 : Volume / 100);
      audioRef.current.muted = Muted;
      audioRef.current.loop = user?.audio_loop ?? true;
      audioRef.current.play().catch(() => {});
    }
    if (videoBg && videoRef.current) {
      videoRef.current.muted = !videoAudio;
      videoRef.current.play().catch(() => {});
    }
  };

  if (!Verified) {
    return <VerificationGate Username={username || undefined} OnVerified={() => SetVerified(true)} />;
  }

  if (notFound) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center bg-black overflow-hidden px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(37,99,235,0.12),transparent_70%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex flex-col items-center"
        >
          {/* 404 animation */}
          <div className="relative select-none">
            {/* glow */}
            <div className="absolute inset-0 rounded-full bg-blue-500/15 blur-3xl" />

            <motion.img
              src="https://assets.dochipo.com/editor/animations/404-error/3acd113a-bcf3-4aae-9785-1dbbe6a2cb7c.gif"
              alt="404"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-56 w-auto max-w-full object-contain select-none"
              draggable={false}
            />

            {/* floating question mark */}
            <motion.div
              animate={{ y: [0, -6, 0], rotate: [-6, 6, -6] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-1 top-1 font-display text-5xl font-black text-blue-500 drop-shadow-[0_0_14px_rgba(59,130,246,0.7)]"
            >
              ?
            </motion.div>
          </div>

          {/* copy */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mt-10 text-center font-display text-2xl md:text-3xl font-black lowercase tracking-tight text-white/85"
          >
            you weren't supposed to be here,
            <br />
            <span className="text-gradient">welcome to the 404 club</span>
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-3 text-sm text-white/30"
          >
            this page doesn't exist, but hey, at least you found the club.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/")}
            className="shimmer mt-8 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-[0_0_30px_rgba(37,99,235,0.4)]"
          >
            take me home
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (!user) return null;

  const isPremium = badges.includes("premium");
  const widgetCfg = normalizeWidgets(user.widgets);
  const pageCount = isPremium ? widgetCfg.pages : Math.min(widgetCfg.pages, 2);
  const hasSongPage = pageCount >= 3 && !!widgetCfg.song;
  const displayEffect =
    isPremium || !PREMIUM_DISPLAY_EFFECTS.has(user.display_effect || "")
      ? user.display_effect
      : "none";
  const bgEffect =
    isPremium || !PREMIUM_BG_EFFECTS.has(user.bg_effect || "")
      ? user.bg_effect
      : "none";
  const customFontAsset = assets.find((a) => a.type === "custom_font");
  const customFontUrl = customFontAsset?.url || "";
  const hasCustomFont = user.font === "Custom" && !!customFontUrl;
  const customFontAll = hasCustomFont && (user.custom_font_scope || "all") === "all";
  const sideKeys = ((widgetCfg.about?.side || []) as string[]).filter((k) => {
    if (k === "rpc") return !!(user.discord_rpc_enabled && user.discord_id);
    if (k === "clock") return !!widgetCfg.about?.clock;
    if (k === "server") return !!widgetCfg.about?.discordServer;
    if (k === "lastfm") return !!widgetCfg.about?.lastfm;
    if (k === "roblox") return !!widgetCfg.about?.roblox;
    return false;
  }).slice(0, 3);
  const hasSide = sideKeys.length > 0;
  const featFm = sideKeys.length === 3 && sideKeys.includes("lastfm");
  const ProfileLayout = user.profile_layout || "classic";
  const IsSplit = ProfileLayout === "split";
  const IsCompact = ProfileLayout === "compact";
  const IsGrid = IsSplit || IsCompact;
  const IsLeft = ProfileLayout === "left" || IsGrid;
  const IsBadgesFirst = ProfileLayout === "badges";
  const FlowMeta = ProfileLayout !== "classic";

  return (
    <>
      {hasCustomFont ? (
        <style>{CustomFontFace(customFontUrl, (customFontAsset as any)?.filename)}</style>
      ) : null}
      <SEO
        title={user.seo_title || `${user.display_name || user.username} — sire.lol`}
        description={user.seo_description || ((user.desc_effect === "typewriter" && user.desc_lines?.length ? user.desc_lines.join(" / ") : user.description || "") || undefined)}
        image={user.seo_image || `/api/og?username=${user.username}`}
        path={`/${user.username}`}
        favicon={user.seo_favicon || undefined}
      />
      <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: "var(--background-color, #080808)", fontFamily: customFontAll ? CUSTOM_FONT_FAMILY : undefined }}>
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
      {bgEffect === "fire" && <FireEffect />}
      {bgEffect === "stars" && <StarsEffect />}
      {bgEffect === "fog" && <FogEffect />}
      {bgEffect === "waves" && <WavesEffect />}
      {bgEffect === "particles" && <ParticlesEffect />}
      {bgEffect === "galaxy" && <GalaxyEffect />}
      {bgEffect === "matrix" && <MatrixEffect />}
      {bgEffect === "spotlight" && <SpotlightEffect />}
      {bgEffect === "bubbles" && <BubblesEffect />}
      {bgEffect === "hearts" && <HeartsEffect />}
      {bgEffect === "leaves" && <LeavesEffect />}
      {bgEffect === "lightning" && <LightningEffect />}
      {user?.cursor_effect && user?.cursor_effect !== "none" && <CursorEffect type={user.cursor_effect} />}
      <div className="absolute inset-0 bg-black/30" />

      <VolumeControl Volume={Volume} Muted={Muted} OnVolume={ChangeVolume} OnMute={ToggleMute} />

      {audio && !hasSongPage && <audio ref={audioRef} src={audio} loop />}

      <EntryOverlay
        entered={entered}
        handleEnter={handleEnter}
        text={user.entry_text || "click anywhere to enter"}
        fontFamily={ResolveFontFamily(user.entry_font, hasCustomFont)}
        color={user.entry_color || "rgba(255,255,255,0.5)"}
        effect={user.entry_effect || "none"}
      />

      <AnimatePresence>
        {voteToast && (
          <motion.div
            initial={{ opacity: 0, y: -24, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -12, x: "-50%" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed top-6 left-1/2 z-[100] flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-[#0a2e1f]/95 px-4 py-3 shadow-xl shadow-black/50 backdrop-blur-md max-w-[calc(100vw-2rem)]"
          >
            <CheckCircle2 size={22} className="text-emerald-400 shrink-0" />
            <div className="min-w-0 text-left">
              <p className="text-sm font-semibold text-white whitespace-nowrap">{voteToast.title}</p>
              <p className="text-xs text-emerald-100/60">{voteToast.sub}</p>
            </div>
            <button onClick={() => setVoteToast(null)} aria-label="dismiss" className="ml-1 text-emerald-100/40 hover:text-white transition-colors cursor-pointer shrink-0">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

<motion.div
        id="bio-page-1"
        initial={{ opacity: 0, y: 20 }}
        animate={entered ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="relative z-0 flex min-h-screen snap-page"
      >
        <div className={`m-auto text-center w-full px-8 ${hasSide ? (featFm ? "max-w-5xl" : "max-w-4xl") : "max-w-2xl"}`}>
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
            className={`relative ${user?.panel_hidden ? "" : "glass-card rounded-3xl p-8 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]"} ${IsLeft ? "text-left" : ""} ${hasSide ? (featFm ? "xl:grid xl:grid-cols-[minmax(0,1fr)_460px] xl:gap-8 xl:text-left items-start" : "xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-8 xl:text-left items-start") : ""}`}
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
              boxShadow: (() => {
                const Mode = user?.panel_glow_mode;
                const Col = user?.panel_glow_color;
                if (user?.panel_hidden || !Mode || Mode === "none" || !Col) return "none";
                const Sp = user?.panel_glow_spread ?? 50;
                const B = 10 + Sp * 0.6;
                const T = Sp * 0.6;
                const Col2 = user?.panel_glow_color_2;
                if (Mode === "gradient" && Col2) return `0 0 ${B}px ${T}px ${Col}, 0 0 ${B * 0.55}px ${T * 0.5}px ${Col2}, 0 0 ${B * 0.28}px ${T * 0.22}px ${Col2}`;
                return `0 0 ${B}px ${T}px ${Col}`;
              })(),
            }}>
            {!user?.panel_hidden && user?.panel_pulse_enabled && (user?.panel_pulse_color || user?.panel_pulse_type) ? (
              <div className="pointer-events-none absolute inset-0 rounded-3xl">
                <PanelTracer Type={user?.panel_pulse_type || null} Color={user?.panel_pulse_color || null} Speed={user?.panel_pulse_speed ?? null} />
              </div>
            ) : null}
            <motion.div variants={dropContainer} initial="hidden" animate={entered ? "show" : "hidden"} className={`min-w-0 ${IsGrid ? "grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 items-start" : `flex flex-col ${IsLeft ? "items-start" : "items-center"}`}`}>
            {user.banner_enabled && banner ? (
              <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-32 overflow-hidden rounded-t-3xl">
                <img
                  src={banner}
                  className="h-full w-full object-cover"
                  style={{
                    maskImage: "linear-gradient(to bottom, #000 0%, #000 42%, transparent 100%)",
                    WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 42%, transparent 100%)",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/45" />
              </div>
            ) : null}
            <motion.div variants={dropItem} className={IsGrid ? "col-start-1 row-start-1 row-span-3 self-start" : IsBadgesFirst ? "order-2" : (user.banner_enabled && banner ? "pt-24" : "")}>
              {(() => {
                const shape = user.avatar_shape || "circle";
                const size = IsCompact ? Math.min(user.avatar_size || 96, 64) : (user.avatar_size || 96);
                const offX = user.avatar_offset_x || 0;
                const offY = user.avatar_offset_y || 0;
                const roundClass = shape === "rounded" ? "rounded-2xl" : "rounded-full";
                const src = pa || user.avatar_url;
                const alignClass = IsLeft ? "" : "mx-auto";
                return src ? (
                  <img src={src} className={`${roundClass} ${alignClass} mb-4 object-cover`} style={{ width: size, height: size, transform: `translate(${offX}px, ${offY}px)` }} />
                ) : (
                  <div className={`${roundClass} ${alignClass} mb-4 bg-white/[0.04] border border-white/[0.06]`} style={{ width: size, height: size, transform: `translate(${offX}px, ${offY}px)` }} />
);
                })()}
              </motion.div>
              <div className={`relative w-fit ${IsGrid ? "col-start-2 row-start-1" : IsLeft ? "" : hasSide ? "mx-auto xl:mx-0" : "mx-auto"} ${IsBadgesFirst ? "order-3" : ""}`} style={{ transform: `translate(${user.name_offset_x || 0}px, ${user.name_offset_y || 0}px)` }}>
                <motion.div variants={dropItem}>
                <h1
                  onMouseEnter={() => setHoveredUid(true)}
                  onMouseLeave={() => setHoveredUid(false)}
                  className={`inline-block text-2xl font-black tracking-tight mb-1 ${displayEffect !== "sparkle" && displayEffect !== "none" ? `display-effect-${displayEffect}` : ""}`}
                  style={{ color: "var(--text-color, #ffffff)", fontFamily: ResolveFontFamily(user.font, hasCustomFont) }}
                >
                  {displayEffect === "sparkle" ? (
                    <SparkleText text={user.display_name || user.username} count={user.sparkle_intensity ?? 14} />
                  ) : (
                    user.display_name || user.username
                  )}
                  {showVerifiedByName && (
                    <VerifiedIcon className={`inline-block h-[1em] w-[1em] ml-2 -mt-1 ${user?.monochrome_icons ? "" : "text-[#1d9bf0]"}`} />
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
              {visibleBadges.length > 0 && (
                <motion.div variants={dropContainer} className={IsGrid ? "col-start-2 row-start-2" : IsBadgesFirst ? "order-first" : ""} style={{ transform: `translate(${user.badge_offset_x || 0}px, ${user.badge_offset_y || 0}px)` }}>
                  <div className={`flex items-center ${IsLeft ? "justify-start" : "justify-center"} ${IsGrid ? "mb-0" : "mb-4"}`}>
                    <LayoutGroup>
                      <motion.div
                        layout
                        onMouseLeave={() => setHoveredBadge(null)}
                        className="flex items-center justify-center gap-2 h-11 rounded-xl bg-white/[0.06] px-4"
                        style={{ width: `${visibleBadges.length * 32 + 20}px` }}
                      >
                        {visibleBadges.map((b) => {
                          if (b === "verified") {
                            return (
                              <motion.div
                                key={b}
                                layout
                                variants={dropItem}
                                onMouseEnter={() => setHoveredBadge(b)}
                                className="relative flex items-center justify-center"
                              >
                                <motion.span
                                  className={`flex h-7 w-7 items-center justify-center ${BadgeTint ? "" : "text-white"} ${user?.monochrome_badges ? "opacity-70" : ""}`}
                                  style={BadgeTint ? { color: BadgeTint, filter: `drop-shadow(0 0 4px ${BadgeTint}) drop-shadow(0 0 9px ${BadgeTint})` } : undefined}
                                  whileHover={{ scale: 1.15 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                >
                                  <VerifiedIcon className="h-7 w-7" />
                                </motion.span>
                                {hoveredBadge === b && (
                                  <motion.div
                                    layoutId="tooltip"
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 4 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                    className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#222] px-2.5 py-1 text-xs font-semibold text-white/90 shadow-lg pointer-events-none capitalize z-20"
                                  >
                                    {BADGE_LABELS[b] || b}
                                  </motion.div>
                                )}
                              </motion.div>
                            );
                          }
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
                              {BadgeTint ? (
                                <motion.div
                                  className="h-7 w-7"
                                  style={{
                                    backgroundColor: BadgeTint,
                                    WebkitMaskImage: `url(${src})`,
                                    maskImage: `url(${src})`,
                                    WebkitMaskSize: "contain",
                                    maskSize: "contain",
                                    WebkitMaskRepeat: "no-repeat",
                                    maskRepeat: "no-repeat",
                                    WebkitMaskPosition: "center",
                                    maskPosition: "center",
                                    filter: `drop-shadow(0 0 4px ${BadgeTint}) drop-shadow(0 0 9px ${BadgeTint})`,
                                  }}
                                  whileHover={{ scale: 1.15 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                />
                              ) : (
                              <motion.img
                                src={src}
                                alt={b}
                                className={`h-7 w-7 object-contain ${b !== "booster" && b !== "halloween" ? "brightness-150" : ""} ${user?.monochrome_badges ? "grayscale brightness-150" : ""}`}
                                whileHover={{ scale: 1.15 }}
                                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                              />
                              )}
                              {hoveredBadge === b && (
                          <motion.div
                            layoutId="tooltip"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#222] px-2.5 py-1 text-xs font-semibold text-white/90 shadow-lg pointer-events-none capitalize z-20"
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
            <motion.div variants={dropItem} className={`${IsGrid ? "col-start-2 row-start-3" : ""} ${IsBadgesFirst ? "order-4" : ""}`}>
              {user.show_username !== false && (
                <p className="text-xs mb-3" style={{ color: "var(--text-color, #ffffff)", opacity: 0.4 }}>@{user.username}</p>
              )}
              {user.country ? (
                <div className={`flex items-center gap-1.5 ${user.show_username !== false ? "" : "mb-3"} ${IsLeft || IsGrid ? "justify-start" : "justify-center"}`}>
                  <MapPin size={13} className="shrink-0" style={{ color: "var(--text-color, #ffffff)", opacity: 0.55 }} />
                  <span className="text-xs font-semibold lowercase" style={{ color: "var(--text-color, #ffffff)", opacity: 0.65 }}>{user.country}</span>
                </div>
              ) : null}
            </motion.div>
            <motion.div variants={dropItem} className={`${IsGrid ? "col-start-1 col-span-2 row-start-4 w-full" : ""} ${IsBadgesFirst ? "order-5" : ""}`}>
              <div style={{ transform: `translate(${user.desc_offset_x || 0}px, ${user.desc_offset_y || 0}px)` }}>
              {user.desc_effect === "typewriter" ? (
                user.desc_lines?.length || user.description ? (
                  <TypewriterDesc lines={user.desc_lines?.length ? user.desc_lines : [user.description || ""]} speed={user.desc_effect_speed ?? 50} Left={IsLeft} />
                ) : null
              ) : user.description && (
                <p className={`text-sm ${IsLeft ? "max-w-md" : "max-w-xs mx-auto"} mb-6`} style={{ color: "var(--text-color, #ffffff)" }}>{user.description}</p>
              )}
              </div>
            </motion.div>
            <motion.div variants={dropItem} className={`${IsGrid ? "col-start-1 col-span-2 row-start-5 w-full" : ""} ${IsBadgesFirst ? "order-6" : ""}`}>
              {(user.discord_rpc_enabled && user.discord_id) || (user.song_platform && user.song_id) ? (
                <div className={`flex flex-col ${IsLeft ? "items-start" : "items-center"} gap-3 mb-6 px-4`}>
                  {user.discord_rpc_enabled && user.discord_id && (
                    <div className="w-full max-w-xs" style={{ transform: `translate(${user.discord_rpc_offset_x || 0}px, ${user.discord_rpc_offset_y || 0}px)` }}>
                      <DiscordRPC discordId={user.discord_id} />
                    </div>
                  )}
                  {user.song_platform && user.song_id && (
                    <div className={user.song_platform === "spotify" ? "w-full" : "w-full max-w-xs"} style={{ transform: `translate(${user.song_offset_x || 0}px, ${user.song_offset_y || 0}px)` }}>
                      <SongPlayer platform={user.song_platform as "youtube" | "spotify"} id={user.song_id} />
                    </div>
                  )}
                </div>
              ) : null}
            </motion.div>
            <motion.div variants={dropItem} className={`${IsGrid ? "col-start-1 col-span-2 row-start-6 w-full" : ""} ${IsBadgesFirst ? "order-7" : ""}`}>
              {Object.keys(links).length > 0 && (
                <div className={`flex items-center ${IsLeft ? "justify-start" : "justify-center"} flex-wrap mb-6 ${Object.keys(links).length > 1 ? "gap-2" : "gap-3"}`}>
                  {Object.keys(links).map((key) => {
                    const p = PLATFORMS.find((x) => x.id === key);
                    const Url = links[key] || "";
                    const Adult = IsAdultLink(Url);
                    const Host = HostOf(Url);
                    return (
                      <a
                        key={key}
                        href={Url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative transition-all hover:scale-110"
                        onClick={(E) => {
                          fetch("/api/track-view", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ type: "click", user_id: user.id, platform: key }),
                          }).catch(() => {});
                          if (Adult || !p) {
                            E.preventDefault();
                            SetLinkWarn({ Url, Adult });
                          }
                        }}
                      >
                        <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[240px] -translate-x-1/2 whitespace-normal rounded-lg border border-white/10 bg-black/90 px-2.5 py-1.5 text-center text-[10px] font-medium leading-tight text-white/75 opacity-0 shadow-xl backdrop-blur-md transition-opacity duration-150 group-hover:opacity-100">
                          {Adult ? (
                            <>
                              <span className="block font-bold text-red-400">18+ only</span>
                              <span className="block text-white/40">age-restricted · {Host || "external"}</span>
                            </>
                          ) : p ? (
                            <>
                              <span className="block">opens {p.name}</span>
                              <span className="block text-white/35">{Host}</span>
                            </>
                          ) : (
                            <>
                              <span className="block font-bold text-amber-300/90">custom link</span>
                              <span className="block max-w-[220px] truncate text-white/40">{Host || Url}</span>
                              <span className="block text-amber-300/70">continue at your own risk</span>
                            </>
                          )}
                        </span>
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
            <motion.div initial={{ opacity: 0 }} animate={entered ? { opacity: 1 } : {}} transition={{ duration: 0.4, delay: 0.5 }} className={`${IsGrid ? "col-start-1 col-span-2" : ""} ${IsBadgesFirst && FlowMeta ? "order-8" : ""} ${FlowMeta ? "flex w-full items-center justify-between mt-2" : ""}`}>
              {user.show_views !== false ? (
              <div className={FlowMeta ? "group relative flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 backdrop-blur-sm" : "group absolute bottom-4 left-4 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 backdrop-blur-sm cursor-default"}>
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/80 px-2 py-1 text-[11px] font-medium text-white/80 opacity-0 transition-opacity group-hover:opacity-100">views</span>
                <Eye size={16} className="text-white shrink-0" />
                <span className="text-sm font-bold text-white tabular-nums min-w-[2ch] text-center">
                  {user.views_blacklisted ? "NULL" : viewCount ?? "–"}
                </span>
                  {!user.views_blacklisted && user.created_at && user.show_joindate !== false ? (
                    <>
                      <span className="h-4 w-px bg-white/20" />
                      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/80 px-2 py-1 text-[11px] font-medium text-white/80 opacity-0 transition-opacity group-hover:opacity-100">joined {relJoin(user.created_at)}</span>
                      <Calendar size={14} className="text-white/70" />
                      <span className="text-sm text-white/70">{relJoin(user.created_at)}</span>
                    </>
                  ) : null}
              </div>
              ) : null}
              {!user.views_blacklisted && user.show_votes !== false && (
                <div className={FlowMeta ? "relative flex items-center gap-1 rounded-xl bg-white/10 px-2 py-1.5 backdrop-blur-sm" : "absolute bottom-4 right-4 flex items-center gap-1 rounded-xl bg-white/10 px-2 py-1.5 backdrop-blur-sm"}>
                  <button onClick={() => castVote(1)} aria-label="like profile" className="flex items-center gap-1 rounded-lg px-1.5 py-0.5 transition-all hover:scale-110">
                    <ThumbsUp size={16} className={myVote === 1 ? "text-green-400" : "text-white"} fill={myVote === 1 ? "currentColor" : "none"} />
                    <span className="text-sm font-bold text-white tabular-nums min-w-[2ch] text-center">{likes}</span>
                  </button>
                  <button onClick={() => castVote(-1)} aria-label="dislike profile" className="flex items-center gap-1 rounded-lg px-1.5 py-0.5 transition-all hover:scale-110">
                    <ThumbsDown size={16} className={myVote === -1 ? "text-red-400" : "text-white"} fill={myVote === -1 ? "currentColor" : "none"} />
                    <span className="text-sm font-bold text-white tabular-nums min-w-[2ch] text-center">{dislikes}</span>
                  </button>
                </div>
              )}
            </motion.div>
            </motion.div>
          {hasSide ? (
            <div className="min-w-0 text-left w-full">
              {featFm ? (
                <div className="grid gap-5 min-w-0 items-start sm:grid-cols-[minmax(0,1fr)_230px]">
                  <div className="min-w-0 overflow-hidden">
                    {widgetCfg.about?.lastfm ? <LastfmCard config={widgetCfg.about.lastfm} instant /> : null}
                  </div>
                  <div className="flex flex-col gap-5 min-w-0">
                    {sideKeys.filter((k) => k !== "lastfm").map((k) => (
                      <div key={k} className="min-w-0 overflow-hidden">
                        {k === "rpc" && user.discord_id ? <DiscordRPC discordId={user.discord_id} wide /> : null}
                        {k === "clock" && widgetCfg.about?.clock ? <ClockWidget widget={widgetCfg.about.clock} /> : null}
                        {k === "server" && widgetCfg.about?.discordServer ? <DiscordServerCard config={widgetCfg.about.discordServer} instant /> : null}
                        {k === "roblox" && widgetCfg.about?.roblox ? <RobloxCard config={widgetCfg.about.roblox} instant /> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-5 min-w-0">
                  {sideKeys.map((k) => (
                    <div key={k} className="min-w-0 overflow-hidden">
                      {k === "rpc" && user.discord_id ? <DiscordRPC discordId={user.discord_id} wide /> : null}
                      {k === "clock" && widgetCfg.about?.clock ? <ClockWidget widget={widgetCfg.about.clock} /> : null}
                      {k === "server" && widgetCfg.about?.discordServer ? <DiscordServerCard config={widgetCfg.about.discordServer} instant /> : null}
                      {k === "lastfm" && widgetCfg.about?.lastfm ? <LastfmCard config={widgetCfg.about.lastfm} instant /> : null}
                      {k === "roblox" && widgetCfg.about?.roblox ? <RobloxCard config={widgetCfg.about.roblox} instant /> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
            </div>
          </div>
        </motion.div>
          {pageCount >= 2 && widgetCfg.about ? (
            <motion.div
              id="bio-page-2"
              initial={{ opacity: 0 }}
              animate={entered ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative z-0 flex min-h-screen overflow-y-auto px-8 pt-20 pb-28 snap-page allow-scroll"
            >
              <AboutPage config={widgetCfg.about} discordId={user.discord_id} discordEnabled={user.discord_rpc_enabled} />
            </motion.div>
          ) : null}
          {pageCount >= 3 && widgetCfg.song ? (
            <motion.div
              id="bio-page-3"
              initial={{ opacity: 0 }}
              animate={entered ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative z-0 flex min-h-screen overflow-y-auto px-8 pt-20 pb-28 snap-page allow-scroll"
            >
              <SongPage url={widgetCfg.song.url} autoPlay={entered} bgImage={bg} />
            </motion.div>
          ) : null}
          {pageCount >= 4 && widgetCfg.projects ? (
            <motion.div
              id="bio-page-4"
              initial={{ opacity: 0 }}
              animate={entered ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="relative z-0 flex min-h-screen overflow-y-auto px-8 pt-20 pb-28 snap-page allow-scroll"
            >
              <ProjectsPage config={widgetCfg.projects} />
            </motion.div>
          ) : null}
          {pageCount > 1 ? (
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
          {pageCount > 1 && entered ? (
            <motion.button
              onClick={() => goToPage(activePage < pageCount - 1 ? activePage + 1 : 0)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="fixed bottom-5 left-1/2 z-[5] flex -translate-x-1/2 cursor-pointer flex-col items-center gap-0.5 text-white/70 transition-colors hover:text-white"
              aria-label={activePage < pageCount - 1 ? "scroll for more" : "back to top"}
            >
              <span className="text-xs font-semibold tracking-wide drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">{activePage < pageCount - 1 ? "Scroll for more" : "Back to top"}</span>
              <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} className="flex">
                {activePage < pageCount - 1 ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
              </motion.span>
            </motion.button>
          ) : null}
          {LinkWarn && (
            <div
              className="fixed inset-0 z-[200] flex items-end justify-center bg-black/80 px-4 pb-5 backdrop-blur-md sm:items-center sm:px-6 sm:pb-0"
              onClick={() => SetLinkWarn(null)}
            >
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                onClick={(E) => E.stopPropagation()}
                className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0c] text-left text-white shadow-[0_30px_80px_rgba(0,0,0,0.85)]"
              >
                <div className={`h-px w-full ${LinkWarn.Adult ? "bg-gradient-to-r from-transparent via-red-500/60 to-transparent" : "bg-gradient-to-r from-transparent via-amber-500/60 to-transparent"}`} />
                <button
                  onClick={() => SetLinkWarn(null)}
                  className="absolute right-3 top-4 text-white/25 transition-colors hover:text-white"
                  aria-label="close"
                >
                  <X size={16} />
                </button>
                <div className="p-6 sm:p-7">
                  <img src="/pumpkin.gif" alt="" draggable={false} className="pointer-events-none mx-auto h-16 w-auto select-none" />
                  <h3 className="mt-3 break-all text-2xl font-black lowercase leading-tight tracking-tight">
                    {HostOf(LinkWarn.Url) || "unknown site"}
                  </h3>
                  <p className="mt-4 break-all font-mono text-[11.5px] leading-relaxed text-white/40">
                    {LinkWarn.Url}
                  </p>
                  <p className="mt-4 text-[13px] leading-relaxed text-white/45">
                    {LinkWarn.Adult
                      ? "this destination hosts adult content. only continue if you're 18 or older and okay with what's behind this door."
                      : "sire doesn't control this site or check what's on it. look over the address above before you go handing out your info."}
                  </p>
                  <div className="mt-6 flex flex-col gap-2">
                    <button
                      onClick={() => {
                        window.open(LinkWarn.Url, "_blank", "noopener,noreferrer");
                        SetLinkWarn(null);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-5 py-3 text-[13px] font-bold text-white transition-colors ${LinkWarn.Adult ? "bg-red-600 hover:bg-red-500" : "bg-blue-600 hover:bg-blue-500"}`}
                    >
                      <span>{LinkWarn.Adult ? "i'm 18+, continue" : "continue to site"}</span>
                      <span className="font-mono text-base leading-none">↗</span>
                    </button>
                    <button
                      onClick={() => SetLinkWarn(null)}
                      className="w-full rounded-xl px-5 py-2.5 text-[12px] font-semibold text-white/35 transition-colors hover:bg-white/[0.04] hover:text-white/70"
                    >
                      stay on sire
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
      </div>
      </>
    );
}

function TypewriterDesc({ lines, speed, Left }: { lines: string[]; speed?: number; Left?: boolean }) {
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
    <p className={`text-sm ${Left ? "max-w-md" : "max-w-xs mx-auto"} mb-6`} style={{ color: "var(--text-color, #ffffff)", display: "grid" }}>
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
