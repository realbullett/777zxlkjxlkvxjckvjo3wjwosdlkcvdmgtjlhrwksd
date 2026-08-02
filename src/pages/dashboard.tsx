import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams, Link as RouterLink, Link } from "react-router-dom";
import { motion, AnimatePresence, LayoutGroup, useMotionValue } from "motion/react";
import { User, Paintbrush, Link as LucideLink, Image, Crown, Layout, Shield, Home, AtSign, Hash, Eye, User as UserIcon, Volume2, X, Music, Play, Pause, Trash2, Upload, LogOut, Check, Database, Award, Copy, Lock, HardDrive, Layers, Type, Star, Clock, Search, TrendingUp } from "lucide-react";
import { supabase } from "../lib/supabase";
import { PLATFORMS } from "../lib/platforms";
import { FONTS } from "../lib/fonts";
import { SparkleText } from "../components/SparkleText";
import { RainEffect, SnowEffect, AuroraEffect, TvStaticEffect, ParticlesEffect, GalaxyEffect, MatrixEffect, SpotlightEffect } from "../components/BackgroundEffect";
import { parseSongUrl } from "../lib/song";
import SongPlayer from "../components/SongPlayer";
import DiscordRPC from "../components/DiscordRPC";
import { CursorEffect } from "../components/CursorEffect";
import AboutPage from "../components/AboutPage";
import SongPage from "../components/SongPage";
import ProjectsPage from "../components/ProjectsPage";
import { TIMEZONE_PRESETS, MAX_PROJECTS, MAX_TAGS, LANGUAGE_TAGS, defaultLabel, defaultAboutPage, defaultProjectsPage, defaultSongPage, emptyProject, emptyWidgets, findMyTimeZone, normalizeWidgets, tzOffsetHours, type AboutPageConfig, type ClockWidgetConfig, type ProjectItem, type SongPageConfig, type WidgetsConfig } from "../lib/widgets";
import TagIcon from "../components/TagIcon";

type User = {
  id: number;
  username: string;
  alias: string | null;
  display_name: string | null;
  email: string;
  avatar_url: string;
  provider: string;
  provider_id: string | null;
  discord_id: string | null;
  discord_rpc_enabled: boolean | null;
  description: string | null;
  accent_color: string | null;
  text_color: string | null;
  background_color: string | null;
  icon_color: string | null;
  bg_effect_color: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  display_effect: string | null;
  font: string | null;
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
  show_username: boolean;
  video_audio: boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_image: string | null;
  seo_favicon: string | null;
  panel_mouse_follow: boolean;
  audio_volume: number;
  audio_autoplay: boolean;
  audio_loop: boolean;
  audio_shuffle: boolean;
  cursor_effect: string;
  avatar_shape: string;
  avatar_size: number;
  avatar_offset_x: number;
  avatar_offset_y: number;
  name_offset_x: number;
  name_offset_y: number;
  badge_offset_x: number;
  badge_offset_y: number;
  desc_offset_x: number;
  desc_offset_y: number;
  song_offset_x: number;
  song_offset_y: number;
  discord_rpc_offset_x: number;
  discord_rpc_offset_y: number;
  panel_opacity: number | null;
  panel_hidden: boolean | null;
  widgets: unknown;
};

const tabs = [
  { id: "overview", label: "account overview", icon: User },
  { id: "customize", label: "customize", icon: Paintbrush },
  { id: "visibility", label: "visibility", icon: Eye },
  { id: "links", label: "links", icon: LucideLink },
  { id: "templates", label: "templates", icon: Layout },
  { id: "data", label: "data", icon: Database },
  { id: "badges", label: "badges", icon: Award },
  { id: "premium", label: "premium", icon: Crown },
  { id: "imagehost", label: "media host", icon: Image },
  { id: "filehost", label: "file host", icon: HardDrive },
  { id: "widgets", label: "widgets", icon: Clock },
  { id: "admin", label: "admin", icon: Shield },
] as const;

type TabId = (typeof tabs)[number]["id"];

const apiCall = async (action: string, payload: Record<string, unknown> = {}) => {
  let sessionToken: string | null = null;
  try {
    const saved = localStorage.getItem("sl_auth");
    if (saved) sessionToken = JSON.parse(saved).sessionToken;
  } catch {}
  const r = await fetch("/api/me", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, sessionToken, ...payload }),
  });
  return r.json();
};

const getSessionToken = () => {
  try {
    const saved = localStorage.getItem("sl_auth");
    if (saved) return JSON.parse(saved).sessionToken || null;
  } catch {}
  return null;
};

const uploadFile = async (file: File, kind: "media" | "file") => {
  const token = getSessionToken();
  const r = await fetch(`/api/me?action=hostPrepare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionToken: token, filename: file.name, size: file.size, kind }),
  });
  const d = await r.json();
  if (!r.ok || d.error) throw new Error(d.error || "Upload failed");
  const { data, error } = await supabase.storage.from("hosted").uploadToSignedUrl(d.path, d.token, file);
  if (error || !data) throw new Error(error?.message || "Upload failed");
  return d;
};

const fetchMe = async () => {
  let sessionToken: string | null = null;
  try {
    const saved = localStorage.getItem("sl_auth");
    if (saved) sessionToken = JSON.parse(saved).sessionToken;
  } catch {}
  const r = await fetch(`/api/me?sessionToken=${encodeURIComponent(sessionToken || "")}`);
  const d = await r.json();
  return d.user || null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [unauth, setUnauth] = useState(false);

  useEffect(() => {
    const uid = searchParams.get("uid");
    const token = searchParams.get("token");
    if (!uid) { navigate("/"); return; }
    const saved = localStorage.getItem("sl_auth");
    const sessionToken = token || (saved ? (() => { try { const p = JSON.parse(saved); return p.sessionToken; } catch { return null; } })() : null);
    const qs = token ? `token=${encodeURIComponent(token)}` : (sessionToken ? `s=${encodeURIComponent(sessionToken)}` : "");
    fetch(`/api/auth/verify?${qs}`).then(r => r.json()).then((session) => {
      if (!session.authed || session.uid !== Number(uid)) { setUnauth(true); return; }
      if (session.sessionToken) {
        localStorage.setItem("sl_auth", JSON.stringify({ uid: Number(uid), sessionToken: session.sessionToken }));
      }
      fetchMe().then((data) => {
        if (data) setUser(data);
        else setUnauth(true);
      });
    }).catch(() => setUnauth(true));
  }, [searchParams]);

  if (unauth) return (
    <div className="relative min-h-screen flex items-center justify-center bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(37,99,235,0.08),transparent_70%)]" />
      <div className="text-center relative">
        <p className="text-6xl font-black text-white/10 mb-4">404</p>
        <p className="text-white/20 text-sm mb-6">You're viewing a 404 page</p>
        <Link to="/dashboard" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
          head back to dashboard
        </Link>
      </div>
    </div>
  );

return (
    <div className="relative min-h-screen bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(37,99,235,0.08),transparent_70%)]" />

      <div className="relative flex flex-col min-h-[calc(100vh-1px)]">
        <header className="flex items-center justify-end h-10 px-6 border-b border-white/[0.04] bg-black/50 backdrop-blur-sm">
          <nav className="flex items-center gap-6 text-sm">
            <RouterLink to="/privacy" className="text-white/40 hover:text-white/70 transition-colors">Privacy</RouterLink>
            <RouterLink to="/terms" className="text-white/40 hover:text-white/70 transition-colors">Terms</RouterLink>
            <a
              href="https://discord.gg/npN6H47KEn"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors"
            >
              <svg className="w-4 h-4 text-[#5865F2]" viewBox="0 0 127.14 96.36" fill="currentColor">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
              </svg>
              Discord
            </a>
          </nav>
        </header>

        <div className="relative flex flex-1 min-h-0">
          <nav className="w-56 shrink-0 border-r border-white/[0.04] flex flex-col pt-2 sticky top-0 h-screen self-start">
            <button onClick={() => navigate("/")} className="font-display text-xl font-black tracking-tighter text-white hover:text-blue-500 transition-colors px-6 mb-4 text-left">
              sire<span className="text-blue-500">.</span>lol
            </button>
            <div className="px-3 mb-4">
              <input
                type="text"
                placeholder="search..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/60 placeholder-white/20 outline-none focus:border-blue-500/40 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-0.5 px-3">
              {tabs.filter((t) => t.id !== "admin" || user?.id === 1).map((t) => {
                const Icon = t.icon;
                const isPremiumTab = t.id === "imagehost" || t.id === "filehost" || t.id === "widgets" || t.id === "premium";
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isPremiumTab
                        ? "shimmer text-blue-300 border border-blue-500/30 bg-blue-600/15 shadow-[0_0_25px_rgba(37,99,235,0.35)]"
                        : activeTab === t.id
                          ? "bg-blue-600/20 text-blue-300"
                          : "text-white/30 hover:text-white/60 hover:bg-white/[0.03]"
                    }`}
                  >
                    <Icon size={16} className={isPremiumTab ? "text-blue-400" : undefined} />
                    <span className={isPremiumTab ? "text-gradient-blue font-bold" : undefined}>{t.label}</span>
                    {isPremiumTab && (
                      <Crown size={12} className="text-blue-300 absolute right-3 top-1/2 -translate-y-1/2 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-auto px-3 pb-6">
              {user && (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03]">
                  <div className="h-8 w-8 rounded-lg bg-white/[0.06] overflow-hidden shrink-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-white/30">
                        <UserIcon size={14} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white/70 truncate">{user.username || user.email}</p>
                    <p className="text-[10px] text-white/30 capitalize">{user.provider}</p>
                  </div>
                  <button
                    onClick={async () => {
                      localStorage.removeItem("sl_auth");
                      window.location.href = "/api/auth/logout";
                    }}
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                    title="Sign out"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              )}
            </div>
          </nav>

          <main className="flex-1 px-8 py-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === "overview" && <AccountOverview user={user} onTab={setActiveTab} onUpdateUser={setUser} />}
                {activeTab === "customize" && <Customize user={user} onUpdateUser={setUser} />}
                {activeTab === "visibility" && <Visibility user={user} />}
                {activeTab === "links" && <Links user={user} />}
                {activeTab === "imagehost" && <MediaHost user={user} />}
                {activeTab === "filehost" && <FileHost user={user} />}
                {activeTab === "widgets" && <Widgets user={user} onUpdateUser={setUser} />}
                {activeTab === "premium" && <Premium user={user} />}
                {activeTab === "templates" && <Templates user={user} onTab={setActiveTab} onUpdateUser={setUser} />}
                {activeTab === "data" && <DataSettings user={user} />}
                {activeTab === "badges" && <UserBadges user={user} />}
                {activeTab === "admin" && <> <AdminBadges /> <AdminBanUser /> </>}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

function AccountOverview({ user, onTab, onUpdateUser }: { user: User | null; onTab: (tab: TabId) => void; onUpdateUser?: (u: User) => void }) {
  const [newUsername, setNewUsername] = useState(user?.username || "");
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [newAlias, setNewAlias] = useState(user?.alias || "");
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [aliasError, setAliasError] = useState("");
  const [isSavingAlias, setIsSavingAlias] = useState(false);
  const [totalUsers, setTotalUsers] = useState<number>(100);
  const [totalViews, setTotalViews] = useState<number>(0);
  const [recentViews, setRecentViews] = useState<number>(0);
  const [dailyViews, setDailyViews] = useState<{ date: string; count: number }[]>([]);
  const [uniqueVisitors, setUniqueVisitors] = useState<number>(0);

  useEffect(() => {
    if (user) {
      supabase.from("page_views").select("id", { count: "exact", head: true }).eq("user_id", user.id).then(({ count }) => {
        if (count !== null) setTotalViews(count);
      });
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      supabase.from("page_views").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("viewed_at", sevenDaysAgo.toISOString()).then(({ count }) => {
        if (count !== null) setRecentViews(count);
      });
      supabase.from("page_views").select("viewed_at").eq("user_id", user.id).gte("viewed_at", sevenDaysAgo.toISOString()).then(({ data }) => {
        if (data) {
          const byDay: Record<string, number> = {};
          for (const row of data) {
            const d = new Date(row.viewed_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
            byDay[d] = (byDay[d] || 0) + 1;
          }
          const labels: string[] = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            labels.push(d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }));
          }
          setDailyViews(labels.map((l) => ({ date: l, count: byDay[l] || 0 })));
        }
      });
      supabase.from("page_views").select("visitor_id").eq("user_id", user.id).then(({ data }) => {
        if (data) {
          const unique = new Set(data.map((r) => r.visitor_id).filter(Boolean));
          setUniqueVisitors(unique.size);
        }
      });
    }
  }, [user]);
  useEffect(() => {
    supabase.from("users").select("id", { count: "exact", head: true }).then(({ count }) => {
      if (count) setTotalUsers(count);
    });
  }, []);

  useEffect(() => {
    if (user?.username) setNewUsername(user.username);
    setNewAlias(user?.alias || "");
  }, [user]);

  const hasAvatar = (user?.avatar_url && user?.avatar_url !== "") || false;
  const hasDescription = (user?.description && user?.description.trim() !== "") || false;
  const hasDiscord = user?.provider === "discord" || !!user?.discord_id || false;
  const completion = [hasAvatar, hasDescription, hasDiscord].filter(Boolean).length * 33 + (user ? 1 : 0);

  const handleSaveAlias = async () => {
    if (!user) return;
    const target = newAlias.trim().toLowerCase();
    if (target === (user.alias || "")) {
      setIsEditingAlias(false);
      return;
    }
    if (target && !/^[a-zA-Z0-9_]{1,20}$/.test(target)) {
      setAliasError("alias can only contain letters, numbers, and underscores");
      return;
    }
    setIsSavingAlias(true);
    setAliasError("");
    const { error } = await apiCall("update", { data: { alias: target || null } });
    if (error) {
      setAliasError("failed to update alias");
      setIsSavingAlias(false);
      return;
    }
    if (onUpdateUser) {
      onUpdateUser({ ...user, alias: target || null });
    }
    setIsSavingAlias(false);
    setIsEditingAlias(false);
  };

  const getRecentChanges = () => {
    if (!user) return [];
    try {
      const raw = localStorage.getItem(`sire_uname_changes_${user.id}`);
      if (!raw) return [];
      const timestamps: number[] = JSON.parse(raw);
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return timestamps.filter((t) => t > oneWeekAgo);
    } catch {
      return [];
    }
  };

  const handleSaveUsername = async () => {
    if (!user) return;
    const target = newUsername.trim().toLowerCase();
    if (!target) {
      setErrorMsg("username cannot be empty");
      return;
    }
    if (!/^[a-zA-Z0-9_]{1,20}$/.test(target)) {
      setErrorMsg("username can only contain letters, numbers, and underscores");
      return;
    }
    if (target === user.username) {
      setIsEditing(false);
      return;
    }
    const recent = getRecentChanges();
    if (recent.length >= 2) {
      setErrorMsg("you can only change your username 2 times per week");
      return;
    }
    setIsSaving(true);
    setErrorMsg("");

    const { data: existing } = await supabase.from("users").select("id").eq("username", target).single();
    if (existing) {
      setErrorMsg("username is already taken");
      setIsSaving(false);
      return;
    }

    const { error } = await apiCall("update", { data: { username: target } });
    if (error) {
      setErrorMsg("failed to update username");
      setIsSaving(false);
      return;
    }

    const updatedTimestamps = [...recent, Date.now()];
    localStorage.setItem(`sire_uname_changes_${user.id}`, JSON.stringify(updatedTimestamps));

    if (onUpdateUser) {
      onUpdateUser({ ...user, username: target });
    }
    setIsSaving(false);
    setIsEditing(false);
  };



  return (
    <div>
      <div className="relative rounded-2xl p-6 overflow-hidden mb-8 border border-blue-300/20 bg-gradient-to-br from-white via-blue-200 to-blue-500 shadow-[0_4px_24px_rgba(37,99,235,0.15)] animate-gradient-shift">
        <div className="absolute -top-20 -right-20 w-52 h-52 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-white/30 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <div className="z-10">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Welcome back, {user?.display_name || user?.username || "User"}
            </h2>
            <p className="text-[13px] text-slate-600/80 mt-1.5 font-medium">
              Here's what's happening with your profile today.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <Link
              to={`/${user?.username}`}
              className="h-8 px-3 rounded-lg bg-white/20 hover:bg-white/30 transition-colors flex items-center text-xs font-semibold text-slate-800 gap-1.5"
            >
              view profile
            </Link>
            <div className="h-9 w-9 rounded-full bg-blue-600/15 border border-blue-400/25 flex items-center justify-center text-sm font-bold text-blue-700">
              {(user?.display_name || user?.username || "S")[0].toUpperCase()}
          </div>
        </div>
      </div>
    </div>

      <h1 className="text-lg font-semibold text-white/40 mb-6 lowercase">account overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Username Card */}
        <div className="relative rounded-2xl p-6 bg-white/[0.02] border border-white/10 backdrop-blur-xl overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent animate-glow-sweep pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <AtSign className="w-4 h-4 text-white" />
                <p className="text-[10px] font-semibold tracking-wider text-white">Username</p>
              </div>
              {!isEditing ? (
                <button
                  onClick={() => { setIsEditing(true); setErrorMsg(""); }}
                  className="text-[10px] font-semibold text-white/70 hover:text-white transition-colors cursor-pointer"
                >
                  change
                </button>
              ) : (
                <button
                  onClick={() => { setIsEditing(false); setErrorMsg(""); setNewUsername(user?.username || ""); }}
                  className="text-[10px] font-semibold text-white/40 hover:text-white/70 transition-colors cursor-pointer"
                >
                  cancel
                </button>
              )}
            </div>
            {!isEditing ? (
              <>
                <p className="text-lg font-bold text-white">{user?.username || "—"}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-white/70 font-mono">sire.lol/{user?.username || "?"}</p>
                  <Link
                    to={`/${user?.username}`}
                    className="text-[9px] font-semibold uppercase tracking-wider text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    visit →
                  </Link>
                </div>
                <p className="text-[10px] text-white/50 mt-2">
                  {2 - getRecentChanges().length} of 2 changes left this week
                </p>
              </>
            ) : (
              <div className="mt-1 space-y-2">
                <div className="flex items-center bg-white/[0.04] border border-white/[0.1] rounded-lg px-2.5 py-1.5 focus-within:border-white/40 transition-colors">
                  <span className="text-xs text-white/40 select-none">sire.lol/</span>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="new username"
                    className="w-full bg-transparent border-0 text-xs text-white outline-none font-mono"
                  />
                </div>
                {errorMsg && <p className="text-[10px] text-red-400">{errorMsg}</p>}
                <button
                  disabled={isSaving}
                  onClick={handleSaveUsername}
                  className="w-full text-xs bg-white/20 hover:bg-white/30 border border-white/20 disabled:opacity-40 py-1.5 rounded-lg text-white font-medium transition-colors cursor-pointer"
                >
                  {isSaving ? "saving..." : "save username"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Alias Card */}
        <div className="relative rounded-2xl p-6 bg-white/[0.02] border border-white/10 backdrop-blur-xl overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent animate-glow-sweep pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <UserIcon className="w-4 h-4 text-white" />
                <p className="text-[10px] font-semibold tracking-wider text-white">Alias</p>
              </div>
              {!isEditingAlias ? (
                <button
                  onClick={() => { setIsEditingAlias(true); setAliasError(""); }}
                  className="text-[10px] font-semibold text-white/70 hover:text-white transition-colors cursor-pointer"
                >
                  change
                </button>
              ) : (
                <button
                  onClick={() => { setIsEditingAlias(false); setAliasError(""); setNewAlias(user?.alias || ""); }}
                  className="text-[10px] font-semibold text-white/40 hover:text-white/70 transition-colors cursor-pointer"
                >
                  cancel
                </button>
              )}
            </div>
            {!isEditingAlias ? (
              <>
                <p className="text-lg font-bold text-white">{user?.alias || "—"}</p>
                <p className="text-xs text-white/70 mt-1">custom link alias</p>
              </>
            ) : (
              <div className="mt-1 space-y-2">
                <input
                  type="text"
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                  placeholder="alias"
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/40 transition-colors"
                />
                {aliasError && <p className="text-[10px] text-red-400">{aliasError}</p>}
                <button
                  disabled={isSavingAlias}
                  onClick={handleSaveAlias}
                  className="w-full text-xs bg-white/20 hover:bg-white/30 border border-white/20 disabled:opacity-40 py-1.5 rounded-lg text-white font-medium transition-colors cursor-pointer"
                >
                  {isSavingAlias ? "saving..." : "save alias"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* UID Card */}
        <div className="relative rounded-2xl p-6 bg-white/[0.02] border border-white/10 backdrop-blur-xl overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent animate-glow-sweep pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-white" />
              <p className="text-[10px] font-semibold tracking-wider text-white">UID</p>
            </div>
            <p className="text-lg font-mono font-bold text-white">{user?.id ? `#${user.id}` : "—"}</p>
            <p className="text-xs text-white/70 mt-1">
              {user?.id ? (
                (() => {
                  const pct = Math.max(1, Math.ceil((user.id / Math.max(totalUsers, user.id, 1)) * 100));
                  return `Among the first ${pct}%`;
                })()
              ) : (
                "internal user id"
              )}
            </p>
          </div>
        </div>

        {/* Profile Views Card */}
        <div className="relative rounded-2xl p-6 bg-white/[0.02] border border-white/10 backdrop-blur-xl overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent animate-glow-sweep pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-white" />
              <p className="text-[10px] font-semibold tracking-wider text-white">Profile views</p>
            </div>
            <p className="text-lg font-bold text-white">{totalViews}</p>
            <p className="text-xs text-emerald-400 mt-1">+{recentViews} in the last 7 days</p>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-white/40 mb-6 mt-12 lowercase">account statistics</h2>

      <div className="glass-card rounded-2xl p-8 bg-blue-500/[0.04] border-blue-500/10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-white/80">Profile completion</p>
          <span className="text-sm font-semibold text-blue-400">{completion}%</span>
        </div>

        <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden mb-4">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400" style={{ width: `${completion}%` }} />
        </div>

        <p className="text-sm font-medium text-white/90 mb-1">{completion === 100 ? "Your profile is complete!" : "Your profile isn't complete yet!"}</p>
        <p className="text-xs text-white/40 mb-6">
          Complete your profile to make it more discoverable and appealing.
        </p>

        <div className="space-y-3">
          <button onClick={() => onTab("customize")} className="flex items-center gap-3 cursor-pointer group w-full text-left">
            <div className="h-4 w-4 rounded border border-white/20 group-hover:border-blue-400/50 transition-colors flex items-center justify-center">
              {hasAvatar ? (
                <svg className="w-3 h-3 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <div className="h-2 w-2 rounded-sm bg-blue-500 opacity-0 group-hover:opacity-30 transition-opacity" />
              )}
            </div>
            <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">Upload an avatar</span>
          </button>
          <button onClick={() => onTab("customize")} className="flex items-center gap-3 cursor-pointer group w-full text-left">
            <div className="h-4 w-4 rounded border border-white/20 group-hover:border-blue-400/50 transition-colors flex items-center justify-center">
              {hasDescription ? (
                <svg className="w-3 h-3 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <div className="h-2 w-2 rounded-sm bg-blue-500 opacity-0 group-hover:opacity-30 transition-opacity" />
              )}
            </div>
            <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">Add a description</span>
          </button>
          <a href="/api/auth/discord" className="flex items-center gap-3 cursor-pointer group w-full text-left">
            <div className="h-4 w-4 rounded border border-white/20 group-hover:border-blue-400/50 transition-colors flex items-center justify-center">
              {hasDiscord ? (
                <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <div className="h-2 w-2 rounded-sm bg-blue-500 opacity-0 group-hover:opacity-30 transition-opacity" />
              )}
            </div>
            <span className="text-sm text-white/80">Link Discord account</span>
          </a>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-white/40 mb-6 mt-12 lowercase">analytics</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="glass-card rounded-xl p-4">
          <p className="text-[10px] font-semibold tracking-wider text-white/40 mb-1">total views</p>
          <p className="text-xl font-bold text-white">{totalViews}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-[10px] font-semibold tracking-wider text-white/40 mb-1">unique visitors</p>
          <p className="text-xl font-bold text-white">{uniqueVisitors}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-[10px] font-semibold tracking-wider text-white/40 mb-1">last 7 days</p>
          <p className="text-xl font-bold text-emerald-400">+{recentViews}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-[10px] font-semibold tracking-wider text-white/40 mb-1">registered users</p>
          <p className="text-xl font-bold text-white">{totalUsers}</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <p className="text-sm font-semibold text-white/80 mb-4">Views per day (last 7 days)</p>
        {dailyViews.length > 0 ? (
          <div className="relative h-40">
            <svg viewBox="0 0 700 200" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              {(() => {
                const max = Math.max(...dailyViews.map((d) => d.count), 1);
                const w = 700 / dailyViews.length;
                return dailyViews.map((d, i) => {
                  const h = (d.count / max) * 170;
                  const x = i * w + w * 0.1;
                  const bw = w * 0.8;
                  return (
                    <g key={d.date}>
                      <rect x={x} y={200 - h} width={bw} height={h} rx="4" fill="url(#barGrad)" />
                      <text x={x + bw / 2} y={190} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="10">{d.count}</text>
                    </g>
                  );
                });
              })()}
            </svg>
            <div className="flex justify-between mt-2">
              {dailyViews.map((d) => (
                <span key={d.date} className="text-[9px] text-white/20 text-center truncate" style={{ width: `${100 / dailyViews.length}%` }}>
                  {d.date.split(",")[0]}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-white/20 italic py-8 text-center">no data yet</p>
        )}
      </div>
    </div>
  );
}

function Customize({ user, onUpdateUser }: { user: User | null; onUpdateUser?: (u: User) => void }) {
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [savingDisplayName, setSavingDisplayName] = useState(false);
  const [desc, setDesc] = useState(user?.description || "");
  const [savingDesc, setSavingDesc] = useState(false);
  const [background, setBackground] = useState<string | null>(null);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [customCursor, setCustomCursor] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [audio1, setAudio1] = useState<string | null>(null);
  const [audio2, setAudio2] = useState<string | null>(null);
  const [shuffleAudio, setShuffleAudio] = useState(user?.audio_shuffle || false);
  const [audio1Duration, setAudio1Duration] = useState<string | null>(null);
  const [audio2Duration, setAudio2Duration] = useState<string | null>(null);
  const [videoBg, setVideoBg] = useState<string | null>(null);
  const [videoAudio, setVideoAudio] = useState(user?.video_audio || false);
  const [banner, setBanner] = useState<string | null>(null);
  const [bannerEnabled, setBannerEnabled] = useState(user?.banner_enabled || false);

  useEffect(() => {
    if (!audio1) { setAudio1Duration(null); return; }
    const a = new Audio(audio1);
    a.onloadedmetadata = () => {
      if (a.duration && !isNaN(a.duration)) {
        const m = Math.floor(a.duration / 60); const s = Math.floor(a.duration % 60);
        setAudio1Duration(`${m}:${s < 10 ? "0" : ""}${s}`);
      }
    };
  }, [audio1]);

  useEffect(() => {
    if (!audio2) { setAudio2Duration(null); return; }
    const a = new Audio(audio2);
    a.onloadedmetadata = () => {
      if (a.duration && !isNaN(a.duration)) {
        const m = Math.floor(a.duration / 60); const s = Math.floor(a.duration % 60);
        setAudio2Duration(`${m}:${s < 10 ? "0" : ""}${s}`);
      }
    };
  }, [audio2]);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);
  const [audioVolume, setAudioVolume] = useState(user?.audio_volume ?? 30);
  const [audioAutoplay, setAudioAutoplay] = useState(user?.audio_autoplay ?? true);
  const [audioLoop, setAudioLoop] = useState(user?.audio_loop ?? true);

  const [accentColor, setAccentColor] = useState(user?.accent_color || "rgba(255, 255, 255, 0.05)");
  const [textColor, setTextColor] = useState(user?.text_color || "#ffffff");
  const [backgroundColor, setBackgroundColor] = useState(user?.background_color || "#080808");
  const [iconColor, setIconColor] = useState(user?.icon_color || "#ffffff");
  const [bgEffectColor, setBgEffectColor] = useState(user?.bg_effect_color || "rgba(255, 255, 255, 0.08)");
  const [primaryColor, setPrimaryColor] = useState(user?.primary_color || "rgba(255, 255, 255, 0.1)");
  const [secondaryColor, setSecondaryColor] = useState(user?.secondary_color || "rgba(255, 255, 255, 0.15)");
  const [savingColors, setSavingColors] = useState(false);
  const [displayEffect, setDisplayEffect] = useState(user?.display_effect || "none");
  const [font, setFont] = useState(user?.font || "Inter");
  const [bgEffect, setBgEffect] = useState(user?.bg_effect || "none");
  const [entryText, setEntryText] = useState(user?.entry_text || "click anywhere to enter");
  const [entryFont, setEntryFont] = useState(user?.entry_font || "Inter");
  const [entryColor, setEntryColor] = useState(user?.entry_color || "rgba(255,255,255,0.5)");
  const [entryEffect, setEntryEffect] = useState(user?.entry_effect || "none");
  const [descEffect, setDescEffect] = useState(user?.desc_effect || "none");
  const [descSpeed, setDescSpeed] = useState(user?.desc_effect_speed ?? 50);
  const [descLines, setDescLines] = useState<string[]>(user?.desc_lines?.length ? user.desc_lines : (desc ? [desc] : []));
  const [descPreview, setDescPreview] = useState(descLines[0] || "");
  useEffect(() => {
    if (descEffect === "typewriter" && descLines.length === 0 && desc.trim()) {
      setDescLines([desc]);
    }
  }, [descEffect]);
  const [savingEntry, setSavingEntry] = useState(false);
  const [monochromeIcons, setMonochromeIcons] = useState(user?.monochrome_icons || false);
  const [monochromeBadges, setMonochromeBadges] = useState(user?.monochrome_badges || false);
  const [panelMouseFollow, setPanelMouseFollow] = useState(user?.panel_mouse_follow || false);
  const [cursorEffect, setCursorEffect] = useState(user?.cursor_effect || "none");
  const [avatarShape, setAvatarShape] = useState(user?.avatar_shape || "circle");
  const [avatarSize, setAvatarSize] = useState(user?.avatar_size || 96);
  const [avatarOffsetX, setAvatarOffsetX] = useState(user?.avatar_offset_x || 0);
  const [avatarOffsetY, setAvatarOffsetY] = useState(user?.avatar_offset_y || 0);
  const [nameOffsetX, setNameOffsetX] = useState(user?.name_offset_x || 0);
  const [nameOffsetY, setNameOffsetY] = useState(user?.name_offset_y || 0);
  const [badgeOffsetX, setBadgeOffsetX] = useState(user?.badge_offset_x || 0);
  const [badgeOffsetY, setBadgeOffsetY] = useState(user?.badge_offset_y || 0);
  const [descOffsetX, setDescOffsetX] = useState(user?.desc_offset_x || 0);
  const [descOffsetY, setDescOffsetY] = useState(user?.desc_offset_y || 0);
  const [songOffsetX, setSongOffsetX] = useState(user?.song_offset_x || 0);
  const [songOffsetY, setSongOffsetY] = useState(user?.song_offset_y || 0);
  const [rpcOffsetX, setRpcOffsetX] = useState(user?.discord_rpc_offset_x || 0);
  const [rpcOffsetY, setRpcOffsetY] = useState(user?.discord_rpc_offset_y || 0);
  const [panelOpacity, setPanelOpacity] = useState(user?.panel_opacity ?? 100);
  const [panelHidden, setPanelHidden] = useState(user?.panel_hidden || false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingPositions, setSavingPositions] = useState(false);
  const [myBadges, setMyBadges] = useState<string[]>([]);
  const [entryPreview, setEntryPreview] = useState(entryText);
  const [songPlatform, setSongPlatform] = useState(user?.song_platform || "");
  const [songId, setSongId] = useState(user?.song_id || "");
  const [songLink, setSongLink] = useState("");
  const [songError, setSongError] = useState("");
  const songTouched = useRef(false);
  const [discordRpcEnabled, setDiscordRpcEnabled] = useState(user?.discord_rpc_enabled || false);
  const [showUsername, setShowUsername] = useState(user?.show_username !== false);
  const linkedDiscordId = user?.discord_id || (user?.provider === "discord" ? user?.provider_id : null) || null;
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const showSaved = (msg: string) => {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(null), 2000);
  };

  useEffect(() => {
    if (entryEffect !== "typewriter") { setEntryPreview(entryText); return; }
    let i = 0;
    setEntryPreview("");
    const timer = setInterval(() => {
      i++;
      setEntryPreview(entryText.slice(0, i));
      if (i >= entryText.length) clearInterval(timer);
    }, 50);
    return () => clearInterval(timer);
  }, [entryText, entryEffect]);

  useEffect(() => {
    const lines = descLines.length > 0 ? descLines : (desc ? [desc] : []);
    if (descEffect !== "typewriter" || lines.length === 0) { setDescPreview(lines[0] || ""); return; }
    let lineIdx = 0, charIdx = 0, dir = 1, pause = 0;
    setDescPreview("");
    const timer = setInterval(() => {
      if (pause > 0) { pause--; return; }
      charIdx += dir;
      const line = lines[lineIdx] || "";
      if (dir === 1) {
        setDescPreview(line.slice(0, charIdx));
        if (charIdx >= line.length) { pause = 4; dir = -1; }
      } else {
        setDescPreview(line.slice(0, charIdx));
        if (charIdx <= 0) { pause = 2; lineIdx = (lineIdx + 1) % lines.length; dir = 1; }
      }
    }, descSpeed);
    return () => clearInterval(timer);
  }, [desc, descEffect, descSpeed, descLines]);

  const bgRef = useRef<HTMLInputElement>(null);
  const audio1Ref = useRef<HTMLInputElement>(null);
  const audio2Ref = useRef<HTMLInputElement>(null);
  const paRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<HTMLInputElement>(null);
  const videoBgRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const hydrated = useRef(false);
  useEffect(() => {
    if (!user || hydrated.current) return;
    hydrated.current = true;
    setDisplayName(user.display_name || "");
    setDesc(user.description || "");
    setShuffleAudio(!!user.audio_shuffle);
    setVideoAudio(!!user.video_audio);
    setBannerEnabled(!!user.banner_enabled);
    setAudioVolume(user.audio_volume ?? 30);
    setAudioAutoplay(user.audio_autoplay ?? true);
    setAudioLoop(user.audio_loop ?? true);
    setAccentColor(user.accent_color || "rgba(255, 255, 255, 0.05)");
    setTextColor(user.text_color || "#ffffff");
    setBackgroundColor(user.background_color || "#080808");
    setIconColor(user.icon_color || "#ffffff");
    setBgEffectColor(user.bg_effect_color || "rgba(255, 255, 255, 0.08)");
    setPrimaryColor(user.primary_color || "rgba(255, 255, 255, 0.1)");
    setSecondaryColor(user.secondary_color || "rgba(255, 255, 255, 0.15)");
    setDisplayEffect(user.display_effect || "none");
    setFont(user.font || "Inter");
    setBgEffect(user.bg_effect || "none");
    setEntryText(user.entry_text || "click anywhere to enter");
    setEntryFont(user.entry_font || "Inter");
    setEntryColor(user.entry_color || "rgba(255,255,255,0.5)");
    setEntryEffect(user.entry_effect || "none");
    setDescEffect(user.desc_effect || "none");
    setDescSpeed(user.desc_effect_speed ?? 50);
    setDescLines(user.desc_lines?.length ? user.desc_lines : (user.description ? [user.description] : []));
    setMonochromeIcons(!!user.monochrome_icons);
    setMonochromeBadges(!!user.monochrome_badges);
    setPanelMouseFollow(!!user.panel_mouse_follow);
    setCursorEffect(user.cursor_effect || "none");
    setAvatarShape(user.avatar_shape || "circle");
    setAvatarSize(user.avatar_size || 96);
    setAvatarOffsetX(user.avatar_offset_x || 0);
    setAvatarOffsetY(user.avatar_offset_y || 0);
    setNameOffsetX(user.name_offset_x || 0);
    setNameOffsetY(user.name_offset_y || 0);
    setBadgeOffsetX(user.badge_offset_x || 0);
    setBadgeOffsetY(user.badge_offset_y || 0);
    setDescOffsetX(user.desc_offset_x || 0);
    setDescOffsetY(user.desc_offset_y || 0);
    setSongOffsetX(user.song_offset_x || 0);
    setSongOffsetY(user.song_offset_y || 0);
    setRpcOffsetX(user.discord_rpc_offset_x || 0);
    setRpcOffsetY(user.discord_rpc_offset_y || 0);
    setPanelOpacity(user.panel_opacity ?? 100);
    setPanelHidden(!!user.panel_hidden);
    setShowUsername(user.show_username !== false);
    setDiscordRpcEnabled(!!user.discord_rpc_enabled);
    if (user.song_platform) setSongPlatform(user.song_platform);
    if (user.song_id) setSongId(user.song_id);
  }, [user]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!songLink.trim()) {
        if (songTouched.current) { setSongPlatform(""); setSongId(""); setSongError(""); }
        return;
      }
      const info = parseSongUrl(songLink);
      if (info) { setSongPlatform(info.platform); setSongId(info.id); setSongError(""); }
      else setSongError("Invalid YouTube or Spotify link");
    }, 400);
    return () => clearTimeout(t);
  }, [songLink]);

  useEffect(() => {
    if (!user) return;
    supabase.from("assets").select("type,url").eq("user_id", user.id).then(({ data }) => {
      if (!data) return;
      for (const a of data) {
        if (a.type === "background") setBackground(a.url);
        if (a.type === "audio" || a.type === "audio_1") setAudio1(a.url);
        if (a.type === "audio_2") setAudio2(a.url);
        if (a.type === "profile_avatar") setProfileAvatar(a.url);
        if (a.type === "custom_cursor") setCustomCursor(a.url);
        if (a.type === "video_background") setVideoBg(a.url);
        if (a.type === "banner") setBanner(a.url);
      }
    });
    supabase.from("badges").select("badge").eq("user_id", user.id).then(({ data }) => {
      if (data) setMyBadges(data.map((r) => r.badge));
    });
  }, [user]);

  const saveDesc = async () => {
    if (!user) return;
    setSavingDesc(true);
    const { error } = await apiCall("update", { data: { description: descEffect === "typewriter" ? null : desc, desc_effect: descEffect, desc_effect_speed: descSpeed, desc_lines: descEffect === "typewriter" ? descLines.filter(l => l.trim()) : null } });
    if (error) console.error("saveDesc error:", error);
    setSavingDesc(false);
  };

  const saveDisplayName = async () => {
    if (!user) return;
    setSavingDisplayName(true);
    const target = displayName.trim() || null;
    const { error } = await apiCall("update", { data: { display_name: target } });
    if (error) console.error("saveDisplayName error:", error);
    setSavingDisplayName(false);
    if (onUpdateUser) onUpdateUser({ ...user, display_name: target });
  };

  const saveColors = async () => {
    if (!user) return;
    setSavingColors(true);
    const { error } = await apiCall("update", {
      data: {
        accent_color: accentColor,
        text_color: textColor,
        background_color: backgroundColor,
        icon_color: iconColor,
        bg_effect_color: bgEffectColor,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
      },
    });
    if (error) console.error("saveColors error:", error);
    else showSaved("colors saved!");
    setSavingColors(false);
  };

  const resetToGlassy = async () => {
    setAccentColor("rgba(255, 255, 255, 0.05)");
    setTextColor("#ffffff");
    setBackgroundColor("#080808");
    setIconColor("#ffffff");
    setBgEffectColor("rgba(255, 255, 255, 0.08)");
    setPrimaryColor("rgba(255, 255, 255, 0.1)");
    setSecondaryColor("rgba(255, 255, 255, 0.15)");
    if (!user) return;
    setSavingColors(true);
    const { error } = await apiCall("update", {
      data: {
        accent_color: "rgba(255, 255, 255, 0.05)",
        text_color: "#ffffff",
        background_color: "#080808",
        icon_color: "#ffffff",
        bg_effect_color: "rgba(255, 255, 255, 0.08)",
        primary_color: "rgba(255, 255, 255, 0.1)",
        secondary_color: "rgba(255, 255, 255, 0.15)",
      },
    });
    if (error) console.error("reset error:", error);
    setSavingColors(false);
  };

  const uploadAsset = async (type: string, file: File) => {
    if (!user) return;
    setSaving(type);
    const ext = file.name.split(".").pop();
    const nonce = Math.random().toString(36).slice(2, 8);
    const path = `${type}s/${user.id}/${nonce}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("assets").upload(path, file, { upsert: true });
    if (uploadError) { console.error("Upload error:", uploadError); setSaving(null); return; }
    const { data: { publicUrl } } = supabase.storage.from("assets").getPublicUrl(path);
    const busted = `${publicUrl}?t=${Date.now()}`;
    const { error: upsertError } = await apiCall("asset_upsert", { type, url: busted });
    if (upsertError) console.error("upsert error:", upsertError);
    if (type === "background") setBackground(busted);
    if (type === "audio" || type === "audio_1") setAudio1(busted);
    if (type === "audio_2") setAudio2(busted);
    if (type === "profile_avatar") setProfileAvatar(busted);
    if (type === "custom_cursor") setCustomCursor(busted);
    if (type === "video_background") setVideoBg(busted);
    if (type === "banner") setBanner(busted);
    setSaving(null);
  };

  const handleAsset = (name: string) => {
    const ref = assetRef(name);
    const file = ref.current?.files?.[0];
    if (file) uploadAsset(assetType(name), file);
  };

  const assetType = (name: string) => {
    if (name === "Background") return "background";
    if (name === "Video Background") return "video_background";
    if (name === "Audio") return "audio";
    if (name === "Profile Avatar") return "profile_avatar";
    if (name === "Banner") return "banner";
    return "custom_cursor";
  };

  const assetIcon = (name: string) => {
    if (name === "Background") return <Image size={16} className="text-white/30" />;
    if (name === "Video Background") return <span className="text-white/30 text-sm">▶</span>;
    if (name === "Audio") return <span className="text-white/30 text-sm">♪</span>;
    if (name === "Profile Avatar") return <User size={16} className="text-white/30" />;
    if (name === "Banner") return <Image size={16} className="text-white/30" />;
    return <span className="text-white/30 text-sm">↖</span>;
  };

  const assetPreview = (name: string) => {
    const v = assetState(name);
    if (name === "Background" && v) return <img src={v} className="h-8 w-12 rounded object-cover" />;
    if (name === "Video Background" && v) return <video src={v} className="h-8 w-12 rounded object-cover" muted />;
    if (name === "Audio" && v) return <audio src={v} controls className="h-8 w-32" />;
    if (name === "Profile Avatar" && v) return <img src={v} className="h-8 w-8 rounded-full object-cover" />;
    if (name === "Banner" && v) return <img src={v} className="h-8 w-12 rounded object-cover" />;
    if (name === "Custom Cursor" && v) return <img src={v} className="h-6 w-6 object-contain" />;
    return null;
  };

  const assetRef = (name: string) => {
    if (name === "Background") return bgRef;
    if (name === "Video Background") return videoBgRef;
    if (name === "Audio") return audio1Ref;
    if (name === "Profile Avatar") return paRef;
    if (name === "Banner") return bannerRef;
    return cursorRef;
  };

  const assetState = (name: string) => {
    if (name === "Background") return background;
    if (name === "Video Background") return videoBg;
    if (name === "Audio") return audio1;
    if (name === "Profile Avatar") return profileAvatar;
    if (name === "Banner") return banner;
    return customCursor;
  };

  const removeAsset = async (name: string) => {
    if (!user) return;
    const type = assetType(name);
    await apiCall("asset_delete", { type });
    if (name === "Background") setBackground(null);
    else if (name === "Video Background") setVideoBg(null);
    else if (name === "Audio") setAudio1(null);
    else if (name === "Profile Avatar") setProfileAvatar(null);
    else if (name === "Banner") setBanner(null);
    else setCustomCursor(null);
    showSaved(`${name} removed`);
  };

  const isSaving = (name: string) => saving === assetType(name);

  return (
    <div className="flex flex-col lg:flex-row lg:gap-8 min-h-[calc(100vh-100px)]">
      <div className="lg:w-1/2 flex-1">
        <h1 className="text-lg font-semibold text-white/40 mb-8 lowercase">customize</h1>

        <div className="relative rounded-2xl p-6 bg-gradient-to-r from-blue-500/40 via-blue-600/50 to-blue-500/40 border border-blue-500/60 backdrop-blur-xl overflow-hidden shine-effect mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shine2" />
          <div className="relative flex items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Let's customize</h3>
              <p className="text-sm text-blue-100 mt-1">Use the below features to customize your bio link</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-8 bg-blue-500/[0.04] border-blue-500/10 space-y-8">
          <div>
          <p className="text-sm font-semibold text-white/80 mb-4">Display Name</p>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={user?.username || "Your name"}
            maxLength={40}
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white outline-none placeholder:text-white/10 focus:border-blue-500/30 transition-colors"
          />
          <div className="flex justify-between items-center mt-3">
            <p className="text-xs text-white/20">shown as the name on your biolink — leave empty to use your username</p>
            <button onClick={saveDisplayName} disabled={savingDisplayName} className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-40 px-3 py-1 rounded-lg text-white transition-colors">
              {savingDisplayName ? "saving..." : "save"}
            </button>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
            <div>
              <p className="text-xs text-white/50 font-semibold uppercase tracking-wider">Show @username</p>
              <p className="text-[10px] text-white/30">Hide the @user handle under your display name</p>
            </div>
            <Toggle
              checked={showUsername}
              onChange={async (v) => {
                setShowUsername(v);
                const { error } = await apiCall("update", { data: { show_username: v } });
                if (error) console.error("saveShowUsername error:", error);
                else showSaved(v ? "showing @username!" : "@username hidden!");
              }}
            />
          </div>
          </div>

          <div>
          <p className="text-sm font-semibold text-white/80 mb-4">Description</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {["none", "typewriter"].map((e) => (
              <button
                key={e}
                onClick={() => setDescEffect(e)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  descEffect === e
                    ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                    : "bg-white/[0.03] border-white/10 text-white/40 hover:text-white/60"
                }`}
              >
                {e === "none" ? "None" : "Typewriter (loop)"}
              </button>
            ))}
          </div>
          {descEffect !== "typewriter" ? (
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Write something about yourself..."
              rows={3}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white outline-none placeholder:text-white/10 focus:border-blue-500/30 transition-colors resize-none"
            />
          ) : (
            <div className="space-y-2 mb-3">
              {descLines.map((line, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    value={line}
                    onChange={(e) => {
                      const next = [...descLines];
                      next[idx] = e.target.value;
                      setDescLines(next);
                    }}
                    placeholder={`Line ${idx + 1}`}
                    className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2 text-sm text-white outline-none placeholder:text-white/10 focus:border-blue-500/30 transition-colors"
                  />
                  <button
                    onClick={() => setDescLines(descLines.filter((_, i) => i !== idx))}
                    className="text-xs text-red-400 hover:text-red-300 px-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() => setDescLines([...descLines, ""])}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                + add line
              </button>
            </div>
          )}
          {descEffect === "typewriter" && descLines.length > 0 && (
            <div className="mb-3 p-4 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center min-h-[48px]">
              <p className="text-sm text-white/80">
                {descPreview || ""}<span className="animate-pulse">|</span>
              </p>
            </div>
          )}
          {descEffect === "typewriter" && (
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs text-white/60">Speed</span>
              <input
                type="range"
                min="10"
                max="200"
                value={descSpeed}
                onChange={(e) => setDescSpeed(Number(e.target.value))}
                className="flex-1 h-1 accent-blue-500 cursor-pointer"
              />
              <span className="text-xs text-white/40 w-8 text-right">{descSpeed}ms</span>
            </div>
          )}
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-white/20">displayed on your profile</p>
            <button onClick={saveDesc} disabled={savingDesc} className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-40 px-3 py-1 rounded-lg text-white transition-colors">
              {savingDesc ? "saving..." : "save"}
            </button>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-white/80 mb-4">Assets uploader</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                {videoBg ? (
                  <video src={videoBg} className="h-8 w-12 rounded object-cover" muted />
                ) : background ? (
                  <img src={background} className="h-8 w-12 rounded object-cover" />
                ) : (
                  <Image size={16} className="text-white/30" />
                )}
                <span className="text-sm text-white/60">Background</span>
              </div>
              <button onClick={() => setIsBgModalOpen(true)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer ml-4">
                manage
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <span className="text-white/30 text-sm">♪</span>
                <span className="text-sm text-white/60">Audio</span>
              </div>
              <button onClick={() => setIsAudioModalOpen(true)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">
                manage
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                {assetPreview("Profile Avatar") || assetIcon("Profile Avatar")}
                <span className="text-sm text-white/60">Profile Avatar</span>
              </div>
              <div className="flex items-center gap-3">
                <input ref={paRef} type="file" accept="image/*" className="hidden" onChange={() => handleAsset("Profile Avatar")} />
                <button onClick={() => paRef.current?.click()} disabled={isSaving("Profile Avatar")} className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-40 transition-colors cursor-pointer">
                  {isSaving("Profile Avatar") ? "saving..." : profileAvatar ? "change" : "upload"}
                </button>
                {profileAvatar && (
                  <button onClick={() => removeAsset("Profile Avatar")} disabled={isSaving("Profile Avatar")} className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40 transition-colors cursor-pointer">
                    remove
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                {assetPreview("Banner") || assetIcon("Banner")}
                <span className="text-sm text-white/60">Banner</span>
              </div>
              <div className="flex items-center gap-3">
                <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={() => handleAsset("Banner")} />
                <button onClick={() => bannerRef.current?.click()} disabled={isSaving("Banner")} className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-40 transition-colors cursor-pointer">
                  {isSaving("Banner") ? "saving..." : banner ? "change" : "upload"}
                </button>
                {banner && (
                  <button onClick={() => removeAsset("Banner")} disabled={isSaving("Banner")} className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40 transition-colors cursor-pointer">
                    remove
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                {assetPreview("Custom Cursor") || assetIcon("Custom Cursor")}
                <span className="text-sm text-white/60">Custom Cursor</span>
              </div>
              <div className="flex items-center gap-3">
                <input ref={cursorRef} type="file" accept="image/*" className="hidden" onChange={() => handleAsset("Custom Cursor")} />
                <button onClick={() => cursorRef.current?.click()} disabled={isSaving("Custom Cursor")} className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-40 transition-colors cursor-pointer">
                  {isSaving("Custom Cursor") ? "saving..." : customCursor ? "change" : "upload"}
                </button>
                {customCursor && (
                  <button onClick={() => removeAsset("Custom Cursor")} disabled={isSaving("Custom Cursor")} className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40 transition-colors cursor-pointer">
                    remove
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <Image size={16} className="text-white/30" />
                <span className="text-sm text-white/60">Banner Enabled</span>
              </div>
              <button
                onClick={async () => {
                  if (!user) return;
                  const next = !bannerEnabled;
                  setBannerEnabled(next);
                  await apiCall("update", { data: { banner_enabled: next } });
                  showSaved(next ? "banner on" : "banner off");
                }}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  bannerEnabled
                    ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                    : "bg-white/[0.03] border-white/10 text-white/40"
                }`}
              >
                {bannerEnabled ? "on" : "off"}
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white/80 mb-4">Audio</h3>
          <p className="text-[11px] text-white/40 mb-3">Paste a YouTube or Spotify link to add a song to your biolink.</p>
          <input
            value={songLink}
            onChange={(e) => { setSongLink(e.target.value); if (e.target.value.trim()) songTouched.current = true; setSongError(""); }}
            placeholder="https://youtu.be/... or https://open.spotify.com/track/..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 outline-none focus:border-blue-500/40 transition-colors placeholder:text-white/20 mb-3"
          />
          {songError && <p className="text-[11px] text-red-400 mb-2">{songError}</p>}
          {songPlatform && songId && (
            <div className="mb-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Preview</p>
              {songPlatform === "spotify" ? (
                <iframe
                  src={`https://open.spotify.com/embed/track/${songId}`}
                  className="w-full h-[80px] rounded-lg"
                  allow="autoplay; encrypted-media"
                />
              ) : (
                <iframe
                  src={`https://www.youtube.com/embed/${songId}?controls=1`}
                  className="w-full aspect-video rounded-lg"
                  allow="autoplay; encrypted-media"
                />
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            {songPlatform && songId && (
              <button
                onClick={async () => {
                  if (!user) return;
                  await apiCall("update", { data: { song_platform: null, song_id: null } });
                  setSongLink("");
                  setSongPlatform("");
                  setSongId("");
                  setSongError("");
                  songTouched.current = false;
                  showSaved("song removed");
                }}
                className="text-xs bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 text-white/60 hover:text-red-300 px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer"
              >
                remove song
              </button>
            )}
            <button
              onClick={async () => {
                if (!user) return;
                if (!songPlatform || !songId) { setSongError("No song set"); return; }
                await apiCall("update", { data: { song_platform: songPlatform, song_id: songId } });
                showSaved("song saved!");
              }}
              className="text-xs bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-white font-semibold transition-all cursor-pointer"
            >
              save song
            </button>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-white/80 mb-4">Discord</p>
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#5865F2]" viewBox="0 0 127.14 96.36" fill="currentColor">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
              </svg>
              <span className="text-sm text-white/70">Discord</span>
            </div>
            {user?.provider === "discord" || !!user?.discord_id ? (
              <span className="flex items-center gap-1.5 text-xs text-green-400">linked</span>
            ) : (
              <a href="/api/auth/discord" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">link account</a>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-white/80 mb-4">Discord RPC</p>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            {linkedDiscordId ? (
              <>
                <label className="flex items-center gap-2 text-xs text-white/50 cursor-pointer">
                  <Toggle checked={discordRpcEnabled} onChange={setDiscordRpcEnabled} />
                  Show Discord presence on my biolink
                </label>
                <p className="text-[10px] text-white/30">Shows your Discord profile picture, username, badges and online status next to your song.</p>
                <div className="flex justify-end">
                  <button
                    onClick={async () => {
                      if (!user) return;
                      const { error } = await apiCall("update", { data: { discord_rpc_enabled: discordRpcEnabled } });
                      if (error) console.error("saveDiscordRpc error:", error);
                      else showSaved("discord rpc saved!");
                    }}
                    className="text-xs bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-white font-semibold transition-all cursor-pointer"
                  >
                    save discord rpc
                  </button>
                </div>
              </>
            ) : (
              <p className="text-[11px] text-white/40">Link a Discord account to enable Discord RPC.</p>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-white/80 mb-4">Color Customization</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Accent Color", value: accentColor, onChange: setAccentColor },
              { label: "Text Color", value: textColor, onChange: setTextColor },
              { label: "Background Color", value: backgroundColor, onChange: setBackgroundColor },
              { label: "Icon Color", value: iconColor, onChange: setIconColor },
              { label: "Bg Effect Color", value: bgEffectColor, onChange: setBgEffectColor },
              { label: "Primary Color", value: primaryColor, onChange: setPrimaryColor },
              { label: "Secondary Color", value: secondaryColor, onChange: setSecondaryColor },
            ].map((c) => (
              <div key={c.label} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
                <span className="text-xs text-white/60 truncate mr-1 font-medium">{c.label}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="color"
                    value={c.value.startsWith("#") ? c.value : "#ffffff"}
                    onChange={(e) => c.onChange(e.target.value)}
                    className="h-6 w-8 rounded border border-white/[0.1] bg-white/[0.03] cursor-pointer p-0 overflow-hidden"
                  />
                  <input
                    type="text"
                    value={c.value}
                    onChange={(e) => c.onChange(e.target.value)}
                    className="w-20 bg-white/[0.03] border border-white/[0.06] rounded px-1.5 py-1 text-white outline-none focus:border-blue-500/30 transition-colors font-mono text-[10px] text-center truncate"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={resetToGlassy} disabled={savingColors} className="text-xs bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] disabled:opacity-40 px-4 py-2 rounded-lg text-white transition-colors cursor-pointer">
              reset to glassy
            </button>
            <button onClick={saveColors} disabled={savingColors} className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-40 px-4 py-2 rounded-lg text-white transition-colors cursor-pointer">
              {savingColors ? "saving..." : "save colors"}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div className="lg:w-[55%] flex-1 space-y-6">
      <Preview user={user} desc={desc} descEffect={descEffect} descSpeed={descSpeed} descLines={descLines} background={background} audio={audio1 || audio2} profileAvatar={profileAvatar} customCursor={customCursor} displayEffect={displayEffect} font={font} videoBg={videoBg} videoAudio={videoAudio} bgEffect={bgEffect} avatarShape={avatarShape} avatarSize={avatarSize} avatarOffsetX={avatarOffsetX} avatarOffsetY={avatarOffsetY} onAvatarOffsetChange={(x, y) => { setAvatarOffsetX(Math.round(x)); setAvatarOffsetY(Math.round(y)); }} banner={banner} bannerEnabled={bannerEnabled} entryText={entryText} entryFont={entryFont} entryColor={entryColor} entryEffect={entryEffect} songPlatform={songPlatform} songId={songId} showUsername={showUsername} primaryColor={primaryColor} secondaryColor={secondaryColor} accentColor={accentColor} textColor={textColor} backgroundColor={backgroundColor} iconColor={iconColor} bgEffectColor={bgEffectColor} panelMouseFollow={panelMouseFollow} cursorEffect={cursorEffect} nameOffsetX={nameOffsetX} nameOffsetY={nameOffsetY} onNameOffsetChange={(x, y) => { setNameOffsetX(Math.round(x)); setNameOffsetY(Math.round(y)); }} badgeOffsetX={badgeOffsetX} badgeOffsetY={badgeOffsetY} onBadgeOffsetChange={(x, y) => { setBadgeOffsetX(Math.round(x)); setBadgeOffsetY(Math.round(y)); }} descOffsetX={descOffsetX} descOffsetY={descOffsetY} onDescOffsetChange={(x, y) => { setDescOffsetX(Math.round(x)); setDescOffsetY(Math.round(y)); }} songOffsetX={songOffsetX} songOffsetY={songOffsetY} onSongOffsetChange={(x, y) => { setSongOffsetX(Math.round(x)); setSongOffsetY(Math.round(y)); }} rpcOffsetX={rpcOffsetX} rpcOffsetY={rpcOffsetY} onRpcOffsetChange={(x, y) => { setRpcOffsetX(Math.round(x)); setRpcOffsetY(Math.round(y)); }} badges={myBadges} panelOpacity={panelOpacity} panelHidden={panelHidden} discordId={linkedDiscordId} discordRpcEnabled={discordRpcEnabled} />

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/50 font-semibold uppercase tracking-wider">Shape</span>
          <div className="flex gap-2">
            {["circle", "rounded"].map((s) => (
              <button key={s} onClick={() => setAvatarShape(s)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  avatarShape === s
                    ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                    : "bg-white/[0.03] border-white/10 text-white/40 hover:text-white/60"
                }`}
              >
                {s === "circle" ? "Circle" : "Rounded Box"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/50 font-semibold uppercase tracking-wider">Size</span>
          <div className="flex items-center gap-3">
            <input type="range" min="48" max="200" value={avatarSize} onChange={(e) => setAvatarSize(Number(e.target.value))} className="w-24 h-1 accent-blue-500 cursor-pointer" />
            <span className="text-xs text-white/40 w-10 text-right">{avatarSize}px</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/50 font-semibold uppercase tracking-wider">Panel Opacity</span>
          <div className="flex items-center gap-3">
            <input type="range" min="0" max="100" value={panelOpacity} onChange={(e) => setPanelOpacity(Number(e.target.value))} className="w-24 h-1 accent-blue-500 cursor-pointer" />
            <span className="text-xs text-white/40 w-10 text-right">{panelOpacity}%</span>
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2 border-t border-white/[0.04]">
          <p className="text-[10px] text-white/30">0% = fully transparent, 100% = opaque</p>
          <label className="flex items-center gap-2 text-xs text-white/50 cursor-pointer">
            <Toggle checked={panelHidden} onChange={setPanelHidden} />
            Hide panel completely
          </label>
        </div>
            <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
            <div>
              <p className="text-xs text-white/50 font-semibold uppercase tracking-wider">Position</p>
              <p className="text-sm text-white/80 font-mono mt-0.5">{avatarOffsetX}px / {avatarOffsetY}px</p>
            </div>
            <div className="ml-auto flex gap-2">
              <button onClick={async () => {
                if (!user) return;
                setAvatarOffsetX(0);
                setAvatarOffsetY(0);
                setNameOffsetX(0);
                setNameOffsetY(0);
                setBadgeOffsetX(0);
                setBadgeOffsetY(0);
                setDescOffsetX(0);
                setDescOffsetY(0);
                setSongOffsetX(0);
                setSongOffsetY(0);
                setRpcOffsetX(0);
                setRpcOffsetY(0);
                setPanelOpacity(100);
                setPanelHidden(false);
                const { error } = await apiCall("update", {
                  data: {
                    avatar_shape: avatarShape,
                    avatar_size: avatarSize,
                    avatar_offset_x: 0,
                    avatar_offset_y: 0,
                    name_offset_x: 0,
                    name_offset_y: 0,
                    badge_offset_x: 0,
                    badge_offset_y: 0,
                    desc_offset_x: 0,
                    desc_offset_y: 0,
                    song_offset_x: 0,
                    song_offset_y: 0,
                    discord_rpc_offset_x: 0,
                    discord_rpc_offset_y: 0,
                    panel_opacity: 100,
                    panel_hidden: false,
                  },
                });
                if (!error) showSaved("positions reset");
              }} className="text-xs bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] disabled:opacity-40 px-4 py-2 rounded-lg text-white/70 transition-colors cursor-pointer">
                reset
              </button>
<button onClick={async () => {
                if (!user) return;
                setSavingAvatar(true);
                const { error } = await apiCall("update", {
                  data: {
                    avatar_shape: avatarShape,
                    avatar_size: avatarSize,
                    avatar_offset_x: avatarOffsetX,
                    avatar_offset_y: avatarOffsetY,
                    name_offset_x: nameOffsetX,
                    name_offset_y: nameOffsetY,
                    badge_offset_x: badgeOffsetX,
                    badge_offset_y: badgeOffsetY,
                    desc_offset_x: descOffsetX,
                    desc_offset_y: descOffsetY,
                    song_offset_x: songOffsetX,
                    song_offset_y: songOffsetY,
                    discord_rpc_offset_x: rpcOffsetX,
                    discord_rpc_offset_y: rpcOffsetY,
                    panel_opacity: panelOpacity,
                    panel_hidden: panelHidden,
                  },
                });
                if (!error) showSaved("frame saved!");
                setSavingAvatar(false);
              }} disabled={savingAvatar} className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-40 px-4 py-2 rounded-lg text-white font-semibold transition-colors cursor-pointer">
                {savingAvatar ? "saving..." : "save frame"}
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white/80 mb-4">Element Positions</h3>
        <div className="grid gap-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/50 font-semibold uppercase tracking-wider">Description</span>
            <span className="text-white/80 font-mono">{descOffsetX}px / {descOffsetY}px</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/50 font-semibold uppercase tracking-wider">Song Player</span>
            <span className="text-white/80 font-mono">{songOffsetX}px / {songOffsetY}px</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/50 font-semibold uppercase tracking-wider">Discord RPC</span>
            <span className="text-white/80 font-mono">{rpcOffsetX}px / {rpcOffsetY}px</span>
          </div>
        </div>
        <p className="text-[10px] text-white/30 mt-3 mb-3">Drag the description, song player, and discord rpc directly in the live preview to position them.</p>
        <div className="flex justify-end gap-2">
          <button onClick={async () => {
            if (!user) return;
            setDescOffsetX(0);
            setDescOffsetY(0);
            setSongOffsetX(0);
            setSongOffsetY(0);
            setRpcOffsetX(0);
            setRpcOffsetY(0);
            const { error } = await apiCall("update", {
              data: {
                desc_offset_x: 0,
                desc_offset_y: 0,
                song_offset_x: 0,
                song_offset_y: 0,
                discord_rpc_offset_x: 0,
                discord_rpc_offset_y: 0,
              },
            });
            if (!error) showSaved("positions reset");
          }} className="text-xs bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] px-4 py-2 rounded-lg text-white/70 transition-colors cursor-pointer">
            reset
          </button>
          <button onClick={async () => {
            if (!user) return;
            setSavingPositions(true);
            const { error } = await apiCall("update", {
              data: {
                desc_offset_x: descOffsetX,
                desc_offset_y: descOffsetY,
                song_offset_x: songOffsetX,
                song_offset_y: songOffsetY,
                discord_rpc_offset_x: rpcOffsetX,
                discord_rpc_offset_y: rpcOffsetY,
              },
            });
            if (!error) showSaved("positions saved!");
            setSavingPositions(false);
          }} disabled={savingPositions} className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-40 px-4 py-2 rounded-lg text-white font-semibold transition-colors cursor-pointer">
            {savingPositions ? "saving..." : "save positions"}
          </button>
        </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white/80 mb-4">Display Name Effects</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { id: "none", label: "None" },
            { id: "sparkle", label: "Sparkle" },
            { id: "glow", label: "Glow" },
            { id: "rainbow", label: "Rainbow" },
            { id: "glitch", label: "Glitch", premium: true },
            { id: "neon", label: "Neon", premium: true },
            { id: "gradient-flow", label: "Gradient Flow", premium: true },
            { id: "shine-sweep", label: "Shine Sweep", premium: true },
          ].map((e) => {
            const locked = !!e.premium && !myBadges.includes("premium");
            return (
              <button
                key={e.id}
                onClick={() => {
                  if (locked) { showSaved("that's a premium effect"); return; }
                  setDisplayEffect(e.id);
                }}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  displayEffect === e.id
                    ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                    : locked
                      ? "bg-white/[0.03] border-white/10 text-white/25"
                      : "bg-white/[0.03] border-white/10 text-white/40 hover:text-white/60"
                }`}
              >
                {e.label}
                {e.premium && <Crown size={10} className={locked ? "text-white/20" : "text-blue-300"} />}
              </button>
            );
          })}
        </div>
        <div className="mb-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center min-h-[48px]">
          <span className={`text-lg font-black tracking-tight ${displayEffect !== "sparkle" && displayEffect !== "none" ? `display-effect-${displayEffect}` : ""}`}>
            {displayEffect === "sparkle" ? (
              <SparkleText text={user?.display_name || user?.username || "preview"} />
            ) : (
              user?.display_name || user?.username || "preview"
            )}
          </span>
        </div>
        <div className="flex justify-end">
          <button
            onClick={async () => {
              if (!user) return;
              await apiCall("update", { data: { display_effect: displayEffect } });
              showSaved("effect saved!");
            }}
            className="text-xs bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-white font-semibold transition-all cursor-pointer"
          >
            save effect
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white/80 mb-4">Font</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {FONTS.map((f) => (
            <button
              key={f.name}
              onClick={() => setFont(f.name)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                font === f.name
                  ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                  : "bg-white/[0.03] border-white/10 text-white/40 hover:text-white/60"
              }`}
              style={{ fontFamily: f.family }}
            >
              {f.name}
            </button>
          ))}
        </div>
        <div className="mb-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center min-h-[48px]">
          <span className="text-lg font-black tracking-tight" style={{ fontFamily: FONTS.find(f => f.name === font)?.family || "'Inter', sans-serif" }}>
            {user?.display_name || user?.username || "preview"}
          </span>
        </div>
        <div className="flex justify-end">
          <button
            onClick={async () => {
              if (!user) return;
              await apiCall("update", { data: { font } });
              showSaved("font saved!");
            }}
            className="text-xs bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-white font-semibold transition-all cursor-pointer"
          >
            save font
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white/80 mb-4">Entry Overlay</h3>
        <p className="text-[11px] text-white/40 mb-3">Customize the "click anywhere to enter" overlay text.</p>
        <input
          value={entryText}
          onChange={(e) => setEntryText(e.target.value)}
          placeholder="click anywhere to enter"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 outline-none focus:border-blue-500/40 transition-colors placeholder:text-white/20 mb-3"
        />
        <div className="flex flex-wrap gap-2 mb-3">
          {FONTS.map((f) => (
            <button
              key={f.name}
              onClick={() => setEntryFont(f.name)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                entryFont === f.name
                  ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                  : "bg-white/[0.03] border-white/10 text-white/40 hover:text-white/60"
              }`}
              style={{ fontFamily: f.family }}
            >
              {f.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-white/60">Color</span>
          <input
            type="color"
            value={entryColor.startsWith("#") ? entryColor : "#ffffff"}
            onChange={(e) => setEntryColor(e.target.value)}
            className="h-7 w-10 rounded border border-white/10 bg-white/5 cursor-pointer"
          />
          <input
            type="text"
            value={entryColor}
            onChange={(e) => setEntryColor(e.target.value)}
            className="w-24 bg-white/[0.03] border border-white/[0.06] rounded px-1.5 py-1 text-white outline-none focus:border-blue-500/30 transition-colors font-mono text-[10px] text-center"
          />
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {["none", "typewriter"].map((e) => (
            <button
              key={e}
              onClick={() => setEntryEffect(e)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                entryEffect === e
                  ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                  : "bg-white/[0.03] border-white/10 text-white/40 hover:text-white/60"
              }`}
            >
              {e === "none" ? "None" : "Typewriter"}
            </button>
          ))}
        </div>
        <div className="mb-4 p-4 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center min-h-[48px]">
          <p className="text-lg lowercase" style={{ fontFamily: FONTS.find(f => f.name === entryFont)?.family || "'Inter', sans-serif", color: entryColor }}>
            {entryPreview || ""}<span className="animate-pulse">|</span>
          </p>
        </div>
        <div className="flex justify-end">
          <button
            onClick={async () => {
              if (!user) return;
              setSavingEntry(true);
              await apiCall("update", {
                data: {
                  entry_text: entryText,
                  entry_font: entryFont,
                  entry_color: entryColor,
                  entry_effect: entryEffect,
                },
              });
              setSavingEntry(false);
              showSaved("entry settings saved!");
            }}
            className="text-xs bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-white font-semibold transition-all cursor-pointer"
          >
            {savingEntry ? "saving..." : "save entry"}
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white/80 mb-4">Background Effects</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { id: "none", label: "None" },
            { id: "rain", label: "Rain" },
            { id: "snow", label: "Snow" },
            { id: "aurora", label: "Aurora" },
            { id: "tv", label: "TV Static" },
            { id: "particles", label: "Particles", premium: true },
            { id: "galaxy", label: "Galaxy", premium: true },
            { id: "matrix", label: "Matrix", premium: true },
            { id: "spotlight", label: "Spotlight", premium: true },
          ].map((e) => {
            const locked = !!e.premium && !myBadges.includes("premium");
            return (
              <button
                key={e.id}
                onClick={() => {
                  if (locked) { showSaved("that's a premium effect"); return; }
                  setBgEffect(e.id);
                }}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  bgEffect === e.id
                    ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                    : locked
                      ? "bg-white/[0.03] border-white/10 text-white/25"
                      : "bg-white/[0.03] border-white/10 text-white/40 hover:text-white/60"
                }`}
              >
                {e.label}
                {e.premium && <Crown size={10} className={locked ? "text-white/20" : "text-blue-300"} />}
              </button>
            );
          })}
        </div>
        <div className="mb-4 relative p-4 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-center min-h-[120px] overflow-hidden">
          {bgEffect === "rain" && <RainEffect />}
          {bgEffect === "snow" && <SnowEffect />}
          {bgEffect === "aurora" && <AuroraEffect />}
          {bgEffect === "tv" && <TvStaticEffect />}
          {bgEffect === "particles" && <ParticlesEffect />}
          {bgEffect === "galaxy" && <GalaxyEffect />}
          {bgEffect === "matrix" && <MatrixEffect />}
          {bgEffect === "spotlight" && <SpotlightEffect />}
          <span className="text-sm text-white/30 italic relative z-[2]">preview</span>
        </div>
        <div className="flex justify-end">
          <button
            onClick={async () => {
              if (!user) return;
              await apiCall("update", { data: { bg_effect: bgEffect } });
              showSaved("effect saved!");
            }}
            className="text-xs bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-white font-semibold transition-all cursor-pointer"
          >
            save effect
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white/80 mb-4">Other Customization</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/80">Monochrome Icons</p>
            <p className="text-[11px] text-white/40">Show all company logos in monochrome on your biolink</p>
          </div>
          <button
            onClick={async () => {
              if (!user) return;
              const next = !monochromeIcons;
              setMonochromeIcons(next);
              await apiCall("update", { data: { monochrome_icons: next } });
              showSaved(next ? "monochrome on" : "monochrome off");
            }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              monochromeIcons
                ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                : "bg-white/[0.03] border-white/10 text-white/40"
            }`}
          >
            {monochromeIcons ? "on" : "off"}
          </button>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div>
            <p className="text-sm text-white/80">Monochrome Badges</p>
            <p className="text-[11px] text-white/40">Show badges in monochrome on your biolink</p>
          </div>
          <button
            onClick={async () => {
              if (!user) return;
              const next = !monochromeBadges;
              setMonochromeBadges(next);
              await apiCall("update", { data: { monochrome_badges: next } });
              showSaved(next ? "monochrome badges on" : "monochrome badges off");
            }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              monochromeBadges
                ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                : "bg-white/[0.03] border-white/10 text-white/40"
            }`}
          >
            {monochromeBadges ? "on" : "off"}
          </button>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div>
            <p className="text-sm text-white/80">Panel Mouse Follow</p>
            <p className="text-[11px] text-white/40">Glass panel tilts to follow your cursor</p>
          </div>
          <button
            onClick={async () => {
              if (!user) return;
              const next = !panelMouseFollow;
              setPanelMouseFollow(next);
              await apiCall("update", { data: { panel_mouse_follow: next } });
              showSaved(next ? "mouse follow on" : "mouse follow off");
            }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              panelMouseFollow
                ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                : "bg-white/[0.03] border-white/10 text-white/40"
            }`}
          >
            {panelMouseFollow ? "on" : "off"}
          </button>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div>
            <p className="text-sm text-white/80">Cursor Effect</p>
            <p className="text-[11px] text-white/40">Particles that follow your cursor (spark / star)</p>
          </div>
          <div className="flex gap-1">
            {["none", "spark", "star"].map((e) => (
              <button
                key={e}
                onClick={async () => {
                  if (!user) return;
                  setCursorEffect(e);
                  await apiCall("update", { data: { cursor_effect: e } });
                  showSaved(`cursor: ${e}`);
                }}
                className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  cursorEffect === e
                    ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                    : "bg-white/[0.03] border-white/10 text-white/40"
                }`}
              >
                {e === "none" ? "off" : e}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>

    {savedMsg && (
      <div className="fixed bottom-6 right-6 z-[100] bg-emerald-600/90 backdrop-blur-md text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-2xl border border-white/10 pointer-events-none animate-in fade-in slide-in-from-bottom-2" style={{ animation: "saved-toast 2s ease-in-out" }}>
        {savedMsg}
      </div>
    )}

    <AnimatePresence>
      {isAudioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="w-full max-w-sm rounded-2xl bg-[#09090b] border border-white/10 p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/50 lowercase tracking-wider">audio settings</span>
              <button
                onClick={() => setIsAudioModalOpen(false)}
                className="text-white/30 hover:text-white transition-colors cursor-pointer text-xs"
              >
                close
              </button>
            </div>

            <div className="space-y-2">
              {/* Audio 1 */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                  <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Music size={12} className="text-white ml-0.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-white truncate">
                      {audio1 ? (audio1.split('/').pop()?.split('?')[0] || "audio track 1") : "audio 1 (none)"}
                    </p>
                    <p className="text-[10px] text-white/40 font-mono">
                      {audio1Duration || "0:00"}
                    </p>
                  </div>
                </div>

                <input ref={audio1Ref} type="file" accept="audio/*" className="hidden" onChange={() => {
                  const file = audio1Ref.current?.files?.[0];
                  if (file) uploadAsset("audio_1", file);
                }} />
                <div className="flex items-center gap-3">
                <button
                  onClick={() => audio1Ref.current?.click()}
                  disabled={saving === "audio_1"}
                  className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-40 transition-colors cursor-pointer shrink-0"
                >
                  {saving === "audio_1" ? "saving..." : audio1 ? "change" : "upload"}
                </button>
                {audio1 && (
                  <button
                    onClick={async () => {
                      await apiCall("asset_delete", { type: "audio_1" });
                      setAudio1(null);
                      showSaved("audio 1 removed");
                    }}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer shrink-0"
                  >
                    remove
                  </button>
                )}
                </div>
              </div>

              {/* Audio 2 */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                  <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Music size={12} className="text-white ml-0.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-white truncate">
                      {audio2 ? (audio2.split('/').pop()?.split('?')[0] || "audio track 2") : "audio 2 (none)"}
                    </p>
                    <p className="text-[10px] text-white/40 font-mono">
                      {audio2Duration || "0:00"}
                    </p>
                  </div>
                </div>

                <input ref={audio2Ref} type="file" accept="audio/*" className="hidden" onChange={() => {
                  const file = audio2Ref.current?.files?.[0];
                  if (file) uploadAsset("audio_2", file);
                }} />
                <div className="flex items-center gap-3">
                <button
                  onClick={() => audio2Ref.current?.click()}
                  disabled={saving === "audio_2"}
                  className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-40 transition-colors cursor-pointer shrink-0"
                >
                  {saving === "audio_2" ? "saving..." : audio2 ? "change" : "upload"}
                </button>
                {audio2 && (
                  <button
                    onClick={async () => {
                      await apiCall("asset_delete", { type: "audio_2" });
                      setAudio2(null);
                      showSaved("audio 2 removed");
                    }}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer shrink-0"
                  >
                    remove
                  </button>
                )}
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">shuffle audio</span>
                <button
                  onClick={() => setShuffleAudio(!shuffleAudio)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    shuffleAudio
                      ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                      : "bg-white/[0.03] border-white/10 text-white/40"
                  }`}
                >
                  {shuffleAudio ? "on" : "off"}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">volume</span>
                <div className="flex items-center gap-2 w-32">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={audioVolume}
                    onChange={(e) => setAudioVolume(Number(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <span className="text-[10px] text-white/40 font-mono w-6 text-right">{audioVolume}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">autoplay</span>
                <button
                  onClick={() => setAudioAutoplay(!audioAutoplay)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    audioAutoplay
                      ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                      : "bg-white/[0.03] border-white/10 text-white/40"
                  }`}
                >
                  {audioAutoplay ? "on" : "off"}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">loop</span>
                <button
                  onClick={() => setAudioLoop(!audioLoop)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    audioLoop
                      ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                      : "bg-white/[0.03] border-white/10 text-white/40"
                  }`}
                >
                  {audioLoop ? "on" : "off"}
                </button>
              </div>
            </div>

            <button
              onClick={async () => {
                if (!user) return;
                await apiCall("update", {
                  data: {
                    audio_volume: audioVolume,
                    audio_autoplay: audioAutoplay,
                    audio_loop: audioLoop,
                    audio_shuffle: shuffleAudio,
                  },
                });
                showSaved("audio settings saved");
                setIsAudioModalOpen(false);
              }}
              className="w-full text-xs bg-blue-600 hover:bg-blue-500 py-2 rounded-lg text-white font-semibold transition-all cursor-pointer"
            >
              save settings
            </button>
          </motion.div>
        </div>
      )}

      {isBgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="w-full max-w-sm rounded-2xl bg-[#09090b] border border-white/10 p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/50 lowercase tracking-wider">background</span>
              <button onClick={() => setIsBgModalOpen(false)} className="text-white/30 hover:text-white/60 transition-colors cursor-pointer">
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-xs text-white/60">Image / GIF</span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-white/20">max 10MB</span>
                  <input ref={bgRef} type="file" accept="image/*" className="hidden" onChange={async () => {
                    const file = bgRef.current?.files?.[0];
                    if (!file) return;
                    if (file.size > 10 * 1024 * 1024) { showSaved("file too large (max 10MB)"); return; }
                    await uploadAsset("background", file);
                    setIsBgModalOpen(false);
                  }} />
                  <button onClick={() => bgRef.current?.click()} disabled={saving === "background"} className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-40 transition-colors cursor-pointer">
                    {saving === "background" ? "uploading..." : background ? "change" : "upload"}
                  </button>
                </div>
              </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-xs text-white/60">Video</span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-white/20">max 50MB</span>
                  <input ref={videoBgRef} type="file" accept="video/mp4,video/webm,video/ogg" className="hidden" onChange={async () => {
                    const file = videoBgRef.current?.files?.[0];
                    if (!file) return;
                    if (file.size > 50 * 1024 * 1024) { showSaved("file too large (max 50MB)"); return; }
                    await uploadAsset("video_background", file);
                    setIsBgModalOpen(false);
                  }} />
                  <button onClick={() => videoBgRef.current?.click()} disabled={saving === "video_background"} className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-40 transition-colors cursor-pointer">
                    {saving === "video_background" ? "uploading..." : videoBg ? "change" : "upload"}
                  </button>
                </div>
              </div>
            </div>

            {(background || videoBg) && (
              <div className="pt-2 border-t border-white/[0.06] space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  {videoBg ? (
                    <video src={videoBg} className="h-12 w-20 rounded object-cover" muted />
                  ) : background ? (
                    <img src={background} className="h-12 w-20 rounded object-cover" />
                  ) : null}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/80 truncate">{videoBg ? "video background" : "image background"}</p>
                    <button
                      onClick={async () => {
                        const type = videoBg ? "video_background" : "background";
                        await apiCall("asset_delete", { type });
                        if (type === "video_background") setVideoBg(null);
                        else setBackground(null);
                        showSaved("background removed");
                      }}
                      className="text-[10px] text-red-400 hover:text-red-300 transition-colors mt-1 cursor-pointer"
                    >
                      remove
                    </button>
                  </div>
                </div>

                {videoBg && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-xs text-white/60">Video Audio</span>
                    <button
                      onClick={async () => {
                        const next = !videoAudio;
                        setVideoAudio(next);
                        if (user) await apiCall("update", { data: { video_audio: next } });
                        showSaved("video audio " + (next ? "on" : "off"));
                      }}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                        videoAudio
                          ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-300"
                          : "bg-white/[0.03] border-white/10 text-white/40"
                      }`}
                    >
                      {videoAudio ? "on" : "off"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
}

function Toggle({ checked, onChange, className = "" }: { checked: boolean; onChange: (v: boolean) => void; className?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer ${checked ? "bg-blue-600" : "bg-white/15"} ${className}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-[20px]" : "translate-x-1"}`}
      />
    </button>
  );
}

function Preview({ user, desc, background, audio, profileAvatar, customCursor, displayEffect, font, videoBg, videoAudio, bgEffect, descEffect, descSpeed, descLines, avatarShape, avatarSize, avatarOffsetX, avatarOffsetY, onAvatarOffsetChange, banner, bannerEnabled, entryText, entryFont, entryColor, entryEffect, songPlatform, songId, showUsername, primaryColor, secondaryColor, accentColor, textColor, backgroundColor, iconColor, bgEffectColor, panelMouseFollow, cursorEffect: cursorEffectType, nameOffsetX, nameOffsetY, onNameOffsetChange, badgeOffsetX, badgeOffsetY, onBadgeOffsetChange, descOffsetX, descOffsetY, onDescOffsetChange, songOffsetX, songOffsetY, onSongOffsetChange, rpcOffsetX, rpcOffsetY, onRpcOffsetChange, badges, panelOpacity, panelHidden, discordId, discordRpcEnabled }: { 
  user: User | null; 
  desc?: string;
  background: string | null; 
  audio: string | null; 
  profileAvatar: string | null; 
  customCursor: string | null; 
  displayEffect?: string;
  font?: string;
  videoBg?: string | null;
  videoAudio?: boolean;
  bgEffect?: string;
  descEffect?: string;
  descSpeed?: number;
  descLines?: string[];
  avatarShape?: string;
  avatarSize?: number;
  avatarOffsetX?: number;
  avatarOffsetY?: number;
  onAvatarOffsetChange?: (x: number, y: number) => void;
  banner?: string | null;
  bannerEnabled?: boolean;
  entryText?: string;
  entryFont?: string;
  entryColor?: string;
  entryEffect?: string;
  songPlatform?: string;
  songId?: string;
  showUsername?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  textColor?: string;
  backgroundColor?: string;
  iconColor?: string;
  bgEffectColor?: string;
  panelMouseFollow?: boolean;
  cursorEffect?: string;
  nameOffsetX?: number;
  nameOffsetY?: number;
  onNameOffsetChange?: (x: number, y: number) => void;
  badgeOffsetX?: number;
  badgeOffsetY?: number;
  onBadgeOffsetChange?: (x: number, y: number) => void;
  descOffsetX?: number;
  descOffsetY?: number;
  onDescOffsetChange?: (x: number, y: number) => void;
  songOffsetX?: number;
  songOffsetY?: number;
  onSongOffsetChange?: (x: number, y: number) => void;
  rpcOffsetX?: number;
  rpcOffsetY?: number;
  onRpcOffsetChange?: (x: number, y: number) => void;
  badges?: string[];
  panelOpacity?: number;
  panelHidden?: boolean;
  discordId?: string | null;
  discordRpcEnabled?: boolean;
}) {
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
  const effectClass = displayEffect && displayEffect !== "none" ? `display-effect-${displayEffect}` : "";
  const previewLines = descLines && descLines.length > 0 ? descLines : (desc ? [desc] : user?.description ? [user.description] : []);
  const [descPreview, setDescPreview] = useState(previewLines[0] || "");
  const [entered, setEntered] = useState(true);
  const [entryDisplay, setEntryDisplay] = useState(entryText || "");
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const lines = previewLines;
    if (descEffect !== "typewriter" || lines.length === 0) { setDescPreview(lines[0] || ""); return; }
    let lineIdx = 0, charIdx = 0, dir = 1, pause = 0;
    setDescPreview("");
    const timer = setInterval(() => {
      if (pause > 0) { pause--; return; }
      charIdx += dir;
      const line = lines[lineIdx] || "";
      if (dir === 1) {
        setDescPreview(line.slice(0, charIdx));
        if (charIdx >= line.length) { pause = 4; dir = -1; }
      } else {
        setDescPreview(line.slice(0, charIdx));
        if (charIdx <= 0) { pause = 2; lineIdx = (lineIdx + 1) % lines.length; dir = 1; }
      }
    }, descSpeed ?? 50);
    return () => clearInterval(timer);
  }, [descEffect, descSpeed, previewLines]);
  useEffect(() => {
    if (entryEffect !== "typewriter" || entered) { setEntryDisplay(entryText || ""); return; }
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setEntryDisplay((entryText || "").slice(0, i));
      if (i >= (entryText || "").length) clearInterval(timer);
    }, 50);
    return () => clearInterval(timer);
  }, [entryText, entryEffect, entered]);
  const avSize = avatarSize || 96;
  const avOffX = avatarOffsetX || 0;
  const avOffY = avatarOffsetY || 0;
  const avSrc = profileAvatar || user?.avatar_url;
  const avMX = useMotionValue(avOffX);
  const avMY = useMotionValue(avOffY);
  const nameMX = useMotionValue(nameOffsetX || 0);
  const nameMY = useMotionValue(nameOffsetY || 0);
  const badgeMX = useMotionValue(badgeOffsetX || 0);
  const badgeMY = useMotionValue(badgeOffsetY || 0);
  const descMX = useMotionValue(descOffsetX || 0);
  const descMY = useMotionValue(descOffsetY || 0);
  const songMX = useMotionValue(songOffsetX || 0);
  const songMY = useMotionValue(songOffsetY || 0);
  const rpcMX = useMotionValue(rpcOffsetX || 0);
  const rpcMY = useMotionValue(rpcOffsetY || 0);
  useEffect(() => { avMX.set(avOffX); avMY.set(avOffY); }, [avOffX, avOffY, avMX, avMY]);
  useEffect(() => { nameMX.set(nameOffsetX || 0); nameMY.set(nameOffsetY || 0); }, [nameOffsetX, nameOffsetY, nameMX, nameMY]);
  useEffect(() => { badgeMX.set(badgeOffsetX || 0); badgeMY.set(badgeOffsetY || 0); }, [badgeOffsetX, badgeOffsetY, badgeMX, badgeMY]);
  useEffect(() => { descMX.set(descOffsetX || 0); descMY.set(descOffsetY || 0); }, [descOffsetX, descOffsetY, descMX, descMY]);
  useEffect(() => { songMX.set(songOffsetX || 0); songMY.set(songOffsetY || 0); }, [songOffsetX, songOffsetY, songMX, songMY]);
  useEffect(() => { rpcMX.set(rpcOffsetX || 0); rpcMY.set(rpcOffsetY || 0); }, [rpcOffsetX, rpcOffsetY, rpcMX, rpcMY]);
  const avStart = useRef({ x: 0, y: 0 });
  const nameStart = useRef({ x: 0, y: 0 });
  const badgeStart = useRef({ x: 0, y: 0 });
  const descStart = useRef({ x: 0, y: 0 });
  const songStart = useRef({ x: 0, y: 0 });
  const rpcStart = useRef({ x: 0, y: 0 });
  return (
      <div className="glass-card rounded-3xl p-3 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col max-h-[calc(100vh-140px)]">
      <h3 className="text-sm font-semibold text-white/80 mb-4">Live Preview (depends on screen resolution)</h3>
      <div className="glass-card rounded-3xl backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex-1 flex flex-col min-h-0 relative" style={{ backgroundColor: backgroundColor || "#080808", cursor: customCursor ? `url("${customCursor}"), auto` : undefined }}>
        {videoBg ? (
          <video src={videoBg} autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover" />
        ) : background ? (
          <img src={background} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 0%, ${bgEffectColor || "#ffffff"} 0%, transparent 70%)` }} />
        )}
        {bgEffect === "rain" && <RainEffect />}
        {bgEffect === "snow" && <SnowEffect />}
        {bgEffect === "aurora" && <AuroraEffect />}
        {bgEffect === "tv" && <TvStaticEffect />}
        {bgEffect === "particles" && <ParticlesEffect />}
        {bgEffect === "galaxy" && <GalaxyEffect />}
        {bgEffect === "matrix" && <MatrixEffect />}
        {bgEffect === "spotlight" && <SpotlightEffect />}
        {cursorEffectType && cursorEffectType !== "none" && <CursorEffect type={cursorEffectType} />}
        <div className="absolute inset-0 bg-black/30" />

        <AnimatePresence>
          {!entered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer bg-black"
              onClick={() => setEntered(true)}
            >
              <motion.p
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="text-lg lowercase" style={{ fontFamily: FONTS.find(f => f.name === (entryFont || "Inter"))?.family || "'Inter', sans-serif", color: entryColor || "rgba(255,255,255,0.5)" }}
              >
                {entryDisplay}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

<motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={entered ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="relative z-0 flex items-start justify-center flex-1 p-3"
        >
          <div className="text-center w-full max-w-4xl px-2 mx-auto my-auto">
            <div
              ref={cardRef}
              onMouseMove={(e) => {
                if (panelHidden || !panelMouseFollow || !cardRef.current) return;
                cardRef.current.style.transition = "none";
                const rect = cardRef.current.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const cx = rect.width / 2;
                const cy = rect.height / 2;
                const moveX = ((x - cx) / cx) * 15;
                const moveY = ((y - cy) / cy) * 15;
                const rotateX = ((y - cy) / cy) * -10;
                const rotateY = ((x - cx) / cx) * 10;
                cardRef.current.style.transform = `translate(${moveX}px, ${moveY}px) perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
              }}
              onMouseLeave={() => {
                if (cardRef.current) {
                  cardRef.current.style.transition = "transform 0.5s ease-out";
                  cardRef.current.style.transform = "";
                }
              }}
              className={`relative ${panelHidden ? "" : "glass-card rounded-3xl p-8 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]"}`} style={{
                backgroundColor: (() => {
                  const base = accentColor || "rgba(255, 255, 255, 0.05)";
                  const opacity = panelHidden ? 0 : (panelOpacity ?? 100) / 100;
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
                borderColor: panelHidden ? "transparent" : (primaryColor || "rgba(255, 255, 255, 0.1)"),
                borderWidth: "1px",
                borderStyle: "solid",
                willChange: "transform",
              }}
            >
                {bannerEnabled && banner && (
                  <div className="absolute top-0 left-0 right-0 h-32 overflow-hidden">
                    <img src={banner} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className={bannerEnabled && banner ? "pt-24" : ""}>
                <motion.div
                  drag
                  dragMomentum={false}
                  dragElastic={0}
                  onDragStart={() => { avStart.current = { x: avMX.get(), y: avMY.get() }; }}
                  onDrag={(_, info) => onAvatarOffsetChange?.(Math.round(avStart.current.x + info.offset.x), Math.round(avStart.current.y + info.offset.y))}
                  className={avatarShape === "rounded"
                    ? "rounded-2xl mx-auto mb-4 overflow-hidden bg-white/[0.04] cursor-grab active:cursor-grabbing"
                    : "rounded-full mx-auto mb-4 overflow-hidden bg-white/[0.04] cursor-grab active:cursor-grabbing"}
                  style={{ width: avSize, height: avSize, x: avMX, y: avMY }}
                >
                  {avSrc ? (
                    <img src={avSrc} alt="" className="w-full h-full object-cover pointer-events-none" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/[0.04]">
                      <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </motion.div>
                <motion.div
                  drag
                  dragMomentum={false}
                  dragElastic={0}
                  onDragStart={() => { nameStart.current = { x: nameMX.get(), y: nameMY.get() }; }}
                  onDrag={(_, info) => onNameOffsetChange?.(Math.round(nameStart.current.x + info.offset.x), Math.round(nameStart.current.y + info.offset.y))}
                  style={{ x: nameMX, y: nameMY }}
                >
                  <h1
                    className={`inline-block text-2xl font-black tracking-tight mb-1 ${displayEffect !== "sparkle" && displayEffect !== "none" ? `display-effect-${displayEffect}` : ""}`}
                    style={{ color: textColor || "#ffffff", fontFamily: FONTS.find(f => f.name === (font || "Inter"))?.family || "'Inter', sans-serif" }}
                  >
                    {displayEffect === "sparkle" ? (
                      <SparkleText text={user?.display_name || user?.username || "Your Name"} />
                    ) : (
                      user?.display_name || user?.username || "Your Name"
                    )}
                  </h1>
                  {showUsername !== false && (
                    <p className="text-xs mb-3" style={{ color: textColor || "#ffffff", opacity: 0.4 }}>@{user?.username || "username"}</p>
                  )}
                </motion.div>
                {(badges?.length || 0) > 0 && (
                  <motion.div
                    drag
                    dragMomentum={false}
                    dragElastic={0}
                    onDragStart={() => { badgeStart.current = { x: badgeMX.get(), y: badgeMY.get() }; }}
                    onDrag={(_, info) => onBadgeOffsetChange?.(Math.round(badgeStart.current.x + info.offset.x), Math.round(badgeStart.current.y + info.offset.y))}
                    style={{ x: badgeMX, y: badgeMY }}
                  >
                    <div className="flex items-center justify-center mb-4">
                    <LayoutGroup>
                      <motion.div layout className="flex items-center justify-center gap-2 h-11 rounded-xl bg-white/[0.06] px-4" style={{ width: `${(badges?.length || 0) * 32 + 20}px` }}>
                      {(badges || []).map((b) => {
                        const src = BADGE_FILES[b] ? `/emojis/${BADGE_FILES[b]}` : null;
                        if (!src) return null;
                        return (
                          <motion.img key={b} layout src={src} alt={b} className="h-7 w-7 object-contain" whileHover={{ scale: 1.15 }} transition={{ type: "spring", stiffness: 300, damping: 15 }} />
                        );
                      })}
                    </motion.div>
                  </LayoutGroup>
                  </div>
                  </motion.div>
                )}
                {(previewLines[0]) && (
                  <motion.div
                    drag
                    dragMomentum={false}
                    dragElastic={0}
                    onDragStart={() => { descStart.current = { x: descMX.get(), y: descMY.get() }; }}
                    onDrag={(_, info) => onDescOffsetChange?.(Math.round(descStart.current.x + info.offset.x), Math.round(descStart.current.y + info.offset.y))}
                    style={{ x: descMX, y: descMY }}
                  >
                  <p className="text-sm max-w-xs mx-auto mb-6" style={{ color: textColor || "#ffffff", display: descEffect === "typewriter" ? "grid" : undefined }}>
                    {descEffect === "typewriter" && (
                      <span className="invisible" style={{ gridArea: "1/1" }}>{previewLines.reduce((a, b) => a.length >= b.length ? a : b, "")}</span>
                    )}
                    <span style={descEffect === "typewriter" ? { gridArea: "1/1" } : undefined}>
                      {descEffect === "typewriter" ? descPreview + (descPreview ? "|" : "") : previewLines[0]}
                    </span>
                  </p>
                  </motion.div>
                )}
                {(discordRpcEnabled && discordId) || (songPlatform && songId) ? (
                  <div className="flex items-center justify-center gap-3 mb-6 px-4">
                    {discordRpcEnabled && discordId && (
                      <motion.div
                        drag
                        dragMomentum={false}
                        dragElastic={0}
                        onDragStart={() => { rpcStart.current = { x: rpcMX.get(), y: rpcMY.get() }; }}
                        onDrag={(_, info) => onRpcOffsetChange?.(Math.round(rpcStart.current.x + info.offset.x), Math.round(rpcStart.current.y + info.offset.y))}
                        className="w-full max-w-xs [&_iframe]:pointer-events-none"
                        style={{ x: rpcMX, y: rpcMY }}
                      >
                        <DiscordRPC discordId={discordId} />
                      </motion.div>
                    )}
                    {songPlatform && songId && (
                      <motion.div
                        drag
                        dragMomentum={false}
                        dragElastic={0}
                        onDragStart={() => { songStart.current = { x: songMX.get(), y: songMY.get() }; }}
                        onDrag={(_, info) => onSongOffsetChange?.(Math.round(songStart.current.x + info.offset.x), Math.round(songStart.current.y + info.offset.y))}
                        className="w-full max-w-md [&_iframe]:pointer-events-none"
                        style={{ x: songMX, y: songMY }}
                      >
                        <SongPlayer platform={songPlatform as "youtube" | "spotify"} id={songId} fill />
                      </motion.div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const BADGE_LIST = [
  { id: "verified", file: "verified.png" },
  { id: "premium", file: "premium.png" },
  { id: "og", file: "og.png" },
  { id: "booster", file: "booster.png" },
  { id: "staff", file: "staff.png" },
  { id: "bug", file: "bug.png", label: "bug hunter" },
  { id: "corrupt", file: "corrupt.png" },
];

const SELF_BADGE_LIST = [
  { id: "og", file: "og.png", claimable: true, desc: "secured this badge in the early days of sire.lol" },
  { id: "premium", file: "premium.png", claimable: false, desc: "exclusive badge for premium supporters" },
];

function UserBadges({ user }: { user: User | null }) {
  const [myBadges, setMyBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("badges").select("badge").eq("user_id", user.id).then(({ data }) => {
      setMyBadges(data ? data.map((r) => r.badge) : []);
      setLoading(false);
    });
  }, [user]);

  const toggleBadge = async (badge: string) => {
    if (!user) return;
    const has = myBadges.includes(badge);
    if (has) {
      await apiCall("badge_remove", { badge });
      setMyBadges(myBadges.filter((b) => b !== badge));
    } else {
      await apiCall("badge_set", { badge });
      setMyBadges([...myBadges, badge]);
    }
  };

  if (loading) return <div className="glass-card rounded-2xl p-6"><p className="text-sm text-white/40">loading...</p></div>;

  return (
    <div>
      <h1 className="text-lg font-semibold text-white/40 mb-8 lowercase">badges</h1>

      <div className="grid gap-6">
        <div className="relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-white/10 via-blue-500/10 to-white/5 border border-blue-400/40 shadow-[0_0_30px_rgba(59,130,246,0.12)] backdrop-blur-xl group">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-glow-sweep pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(59,130,246,0.2),transparent_70%)]" />
          <div className="absolute -top-6 -right-6 h-32 w-32 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-6 -left-6 h-24 w-24 bg-white/10 rounded-full blur-3xl" />
          <div className="relative">
            <p className="text-xl font-bold text-white mb-2">What are badges?</p>
            <p className="text-sm text-blue-200/80 leading-relaxed max-w-xl">These are badges that are claimable to the public as of now, they could become unclaimable any day in the near future, claim it now!</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SELF_BADGE_LIST.map((b) => {
            const active = myBadges.includes(b.id);
            const locked = b.claimable === false;
            return (
              <motion.div
                key={b.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className={`relative overflow-hidden rounded-2xl border min-h-[220px] ${
                  locked
                    ? "bg-white/[0.01] border-white/[0.04]"
                    : active
                      ? "bg-gradient-to-br from-emerald-500/10 via-white/[0.04] to-emerald-500/10 border-emerald-400/30"
                      : "bg-white/[0.02] border-white/[0.06] hover:border-white/20"
                }`}
              >
                {/* Holographic border shine */}
                <motion.div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{ background: "linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)", backgroundSize: "200% 200%" }}
                  animate={{ backgroundPosition: ["200% 200%", "-100% -100%"] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                />

                {/* Glow spots */}
                {active && !locked && (
                  <>
                    <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-emerald-400/10 rounded-full blur-3xl" animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.35, 0.15] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
                    <motion.div className="absolute -top-6 -right-6 w-20 h-20 bg-emerald-300/20 rounded-full blur-2xl" animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} />
                  </>
                )}

                <div className="relative h-full flex flex-col p-5">
                  {/* Top section: icon + title + desc */}
                  <div className="flex items-start gap-4">
                    <motion.div
                      animate={!locked ? { y: [0, -3, 0] } : {}}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className={`relative h-14 w-14 shrink-0 flex items-center justify-center overflow-hidden ${
                        locked || !active
                          ? "opacity-50"
                          : ""
                      }`}
                    >
                      <div className={`absolute inset-0 rounded-2xl ${active && !locked ? "bg-gradient-to-br from-emerald-400/20 to-emerald-600/10 shadow-[0_0_20px_rgba(16,185,129,0.12)]" : "bg-white/[0.04] rounded-2xl"}`} />
                      <motion.img
                        src={`/emojis/${b.file}`}
                        alt={b.id}
                        className="h-9 w-9 object-contain relative z-[1]"
                        animate={active && !locked ? { scale: [1, 1.1, 1] } : { filter: "grayscale(100%)", opacity: 0.5 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      />
                      {(locked || !active) && <div className="absolute inset-0 flex items-center justify-center"><div className="h-8 w-0.5 bg-white/10 rotate-45" /></div>}
                    </motion.div>

                    <div className="flex-1 min-w-0 pt-1">
                      <motion.p className={`text-lg font-black tracking-tight ${locked ? "text-white/20" : active ? "text-white" : "text-white/50"}`}
                        animate={active && !locked ? { letterSpacing: ["-0.02em", "0.02em", "-0.02em"] } : {}}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      >
                        {b.id === "og" ? "OG" : b.id.charAt(0).toUpperCase() + b.id.slice(1)}
                      </motion.p>
                      <p className="text-[11px] text-white/30 mt-1 leading-relaxed">{b.desc}</p>
        </div>
      </div>

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Bottom bar: status + action */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                    <motion.span
                      className={`text-[10px] font-semibold uppercase tracking-widest ${locked ? "text-white/8" : active ? "text-emerald-300/60" : "text-white/20"}`}
                      animate={locked ? { opacity: [0.2, 0.5, 0.2] } : {}}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      {locked ? "unclaimable" : active ? "equipped" : "available"}
                    </motion.span>

                    {locked ? (
                      <div className="px-4 py-1.5 rounded-lg text-[9px] font-bold tracking-widest uppercase bg-white/[0.02] text-white/10 border border-white/[0.04] select-none">locked</div>
                    ) : (
                      <motion.button
                        onClick={() => toggleBadge(b.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-4 py-1.5 rounded-lg text-[9px] font-bold tracking-widest uppercase transition-colors duration-300 cursor-pointer ${
                          active
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/30"
                            : "bg-white/[0.04] text-white/30 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white/60"
                        }`}
                      >
                        {active ? "unequip" : "claim"}
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.06] p-8 text-center">
          <p className="text-sm font-semibold text-white/20 mb-1">more badges coming soon</p>
          <p className="text-xs text-white/10">stay tuned for exclusive collectibles</p>
        </div>
      </div>
    </div>
  );
}

function AdminBadges() {
  const [search, setSearch] = useState("");
  const [targetUser, setTargetUser] = useState<{ id: number; username: string; alias: string | null } | null>(null);
  const [userBadges, setUserBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [deletingUser, setDeletingUser] = useState(false);

  const searchUser = async () => {
    if (!search.trim()) return;
    setLoading(true);
    setMsg("");
    const { data } = await supabase.from("users").select("id,username,alias").eq("username", search.trim()).single();
    if (data) {
      setTargetUser(data);
      const { data: b } = await supabase.from("badges").select("badge").eq("user_id", data.id);
      setUserBadges(b ? b.map((r) => r.badge) : []);
    } else {
      setTargetUser(null);
      setUserBadges([]);
      setMsg("user not found");
    }
    setLoading(false);
  };

  const toggleBadge = async (badge: string) => {
    if (!targetUser) return;
    const has = userBadges.includes(badge);
    if (has) {
      await apiCall("admin_badge_remove", { badge, targetUid: targetUser.id });
      setUserBadges(userBadges.filter((b) => b !== badge));
    } else {
      await apiCall("admin_badge_set", { badge, targetUid: targetUser.id });
      setUserBadges([...userBadges, badge]);
    }
  };

  const handleDeleteUser = async () => {
    if (!targetUser) return;
    if (!confirm(`Are you sure you want to permanently delete @${targetUser.username} (uid #${targetUser.id})? This cannot be undone.`)) return;
    setDeletingUser(true);
    try {
      const r = await apiCall("admin_delete_user", { targetUid: targetUser.id });
      if (r.error) { alert(r.error || "Failed to delete user"); setDeletingUser(false); return; }
      alert(`User @${targetUser.username} deleted permanently.`);
      setTargetUser(null);
      setUserBadges([]);
      setSearch("");
    } catch { alert("Something went wrong"); }
    setDeletingUser(false);
  };

  return (
    <div>
      <h1 className="text-lg font-semibold text-white/40 mb-8 lowercase">admin — badge management</h1>

      <div className="glass-card rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="search username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchUser()}
            className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/10 focus:border-blue-500/30 transition-colors"
          />
          <button onClick={searchUser} disabled={loading} className="shimmer rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
            {loading ? "..." : "search"}
          </button>
        </div>

        {msg && <p className="text-sm text-red-400/80">{msg}</p>}

        {targetUser && (
          <>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="h-8 w-8 rounded-full bg-blue-600/20 flex items-center justify-center text-sm font-bold text-blue-300">
                {(targetUser.alias || targetUser.username)[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{targetUser.alias || targetUser.username}</p>
                <p className="text-xs text-white/40">@{targetUser.username} — uid #{targetUser.id}</p>
              </div>
            </div>

            <p className="text-sm font-semibold text-white/80">Available badges</p>
            <div className="grid grid-cols-2 gap-2">
              {BADGE_LIST.map((b) => {
                const active = userBadges.includes(b.id);
                return (
                  <button
                    key={b.id}
                    onClick={() => toggleBadge(b.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      active ? "bg-blue-600/20 border-blue-500/40" : "bg-white/[0.02] border-white/[0.06] hover:border-white/20"
                    }`}
                  >
                    <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                      <img src={`/emojis/${b.file}`} alt={b.id} className="h-4 w-4 object-contain" />
                    </div>
                    <span className={`text-sm font-medium ${active ? "text-blue-300" : "text-white/60"}`}>{b.label || b.id}</span>
                    <span className={`ml-auto text-xs ${active ? "text-blue-400" : "text-white/20"}`}>{active ? "active" : "off"}</span>
                  </button>
                );
              })}
            </div>
            <div className="pt-4 border-t border-white/[0.06]">
              <button
                onClick={handleDeleteUser}
                disabled={deletingUser}
                className="text-sm text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-40"
              >
                {deletingUser ? "deleting..." : "delete this user"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AdminBanUser() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);
  const [msg, setMsg] = useState("");
  const [targetUser, setTargetUser] = useState<{ id: number; username: string; alias: string | null } | null>(null);

  const searchUser = async () => {
    if (!search.trim()) { setMsg("enter a username"); return; }
    setLoading(true);
    setMsg("");
    try {
      const { data } = await supabase.from("users").select("id,username,alias").eq("username", search.trim().toLowerCase()).single();
      if (data) {
        setTargetUser({ id: data.id, username: data.username, alias: data.alias });
      } else {
        setMsg("user not found");
        setTargetUser(null);
      }
    } catch {
      setMsg("user not found");
      setTargetUser(null);
    }
    setLoading(false);
  };

  const handleBanUser = async () => {
    if (!targetUser) return;
    if (!confirm(`PERMANENTLY ban @${targetUser.username} (uid #${targetUser.id})? All data will be deleted.`)) return;
    setDeletingUser(true);
    try {
      const res = await apiCall("admin_delete_user", { targetUid: targetUser.id });
      if (!res.ok) throw new Error(res.error || "Failed");
      setMsg("user banned");
      setTargetUser(null);
      setSearch("");
    } catch (e) {
      setMsg("ban failed: " + (e as Error).message);
    }
    setDeletingUser(false);
  };

  return (
    <div>
      <h1 className="text-lg font-semibold text-white/40 mb-8 lowercase">admin — ban user</h1>
      <div className="glass-card rounded-2xl p-6 space-y-6 max-w-md">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="username to ban..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchUser()}
            className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/10 focus:border-blue-500/30 transition-colors"
          />
          <button onClick={searchUser} disabled={loading} className="shimmer rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
            {loading ? "..." : "search"}
          </button>
        </div>

        {msg && <p className="text-sm text-red-400/80">{msg}</p>}

        {targetUser && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-600/20 flex items-center justify-center text-lg font-bold text-red-300">
                {(targetUser.alias || targetUser.username)[0].toUpperCase()}
              </div>
              <div>
                <p className="text-base font-semibold text-white">{targetUser.alias || targetUser.username}</p>
                <p className="text-xs text-white/40">@{targetUser.username} — uid #{targetUser.id}</p>
              </div>
            </div>
            <p className="text-sm text-white/60 mb-4">
              This will permanently delete the user and ALL associated data:
            </p>
            <ul className="text-xs text-white/40 space-y-1 mb-4">
              <li>• Profile (alias, bio, avatar, banner, settings)</li>
              <li>• All links</li>
              <li>• All badges</li>
              <li>• Page views & analytics</li>
              <li>• Saved templates</li>
              <li>• Song settings</li>
              <li>• Username becomes available</li>
            </ul>
            <button
              onClick={handleBanUser}
              disabled={deletingUser}
              className="w-full text-sm bg-red-600 hover:bg-red-700 disabled:opacity-40 py-2.5 rounded-lg text-white font-semibold transition-colors cursor-pointer"
            >
              {deletingUser ? "banning..." : "ban this user permanently"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Links({ user }: { user: User | null }) {
  const [links, setLinks] = useState<Record<string, string>>({});
  const [modal, setModal] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [customUrl, setCustomUrl] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("links").select("platform,url").eq("user_id", user.id).then(({ data }) => {
      if (!data) return;
      const m: Record<string, string> = {};
      for (const l of data) m[l.platform] = l.url;
      setLinks(m);
    });
  }, [user]);

  const saveLink = async (platform: string, url: string) => {
    if (!user) return;
    const trimmed = url.trim();
    if (!trimmed) return;
    const full = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    await apiCall("link_upsert", { platform, url: full });
    setLinks((prev) => ({ ...prev, [platform]: full }));
    setModal(null);
    setUrlInput("");
  };

  const removeLink = async (platform: string) => {
    if (!user) return;
    await apiCall("link_delete", { platform });
    setLinks((prev) => { const n = { ...prev }; delete n[platform]; return n; });
  };

  const openModal = (platform: string) => {
    setUrlInput(links[platform] || "");
    setModal(platform);
  };

  const customLinks = Object.keys(links).filter((k) => !PLATFORMS.some((p) => p.id === k));

  const addCustomLink = async () => {
    const label = customLabel.trim();
    if (!label || !customUrl.trim()) return;
    await saveLink(label, customUrl);
    setCustomLabel("");
    setCustomUrl("");
  };

  return (
    <div>
      <h1 className="text-lg font-semibold text-white/40 mb-2 lowercase">Link your social media platforms</h1>
      <p className="text-sm text-white/20 mb-8">Pick your favorite social medias to add them to your profile</p>
      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-wrap justify-center gap-x-0.5 gap-y-3">
          {PLATFORMS.map((p) => {
            const connected = !!links[p.id];
            return (
              <button
                key={p.id}
                onClick={() => connected ? removeLink(p.id) : openModal(p.id)}
                className="relative flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-white/[0.02] transition-all group cursor-pointer"
              >
                <div className="h-11 w-11 rounded-xl bg-white/[0.06] flex items-center justify-center transition-all group-hover:bg-white/[0.1] group-hover:scale-105">
                  <img src={p.logoUrl} alt={p.name} className="h-6 w-6" />
                </div>
                <span className="text-[10px] text-white/40 font-medium">{p.name}</span>
                {connected && (
                  <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 border-t border-white/[0.06] pt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-white/80">Custom links</p>
            <span className="text-xs text-white/20">appears with a link icon on your profile</span>
          </div>
          <div className="flex gap-2 mb-4">
            <input
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="Label (e.g. My Shop)"
              maxLength={40}
              className="w-1/3 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/10 focus:border-blue-500/30 transition-colors"
            />
            <input
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/10 focus:border-blue-500/30 transition-colors"
            />
            <button
              onClick={addCustomLink}
              disabled={!customLabel.trim() || !customUrl.trim()}
              className="text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed px-4 rounded-lg text-white font-semibold transition-all"
            >
              add
            </button>
          </div>
          {customLinks.length > 0 ? (
            <div className="space-y-2">
              {customLinks.map((label) => (
                <div key={label} className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white shrink-0">
                    <LucideLink size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white/80 truncate">{label}</p>
                    <p className="text-xs text-white/30 truncate">{links[label]}</p>
                  </div>
                  <button
                    onClick={() => { setCustomLabel(label); setCustomUrl(links[label]); }}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    edit
                  </button>
                  <button onClick={() => removeLink(label)} className="text-white/30 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/20">No custom links yet — add your own site, shop, or anything else.</p>
          )}
        </div>
      </div>

      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => { setModal(null); setUrlInput(""); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card rounded-2xl p-6 w-full max-w-sm relative"
            >
              <button
                onClick={() => { setModal(null); setUrlInput(""); }}
                className="absolute top-4 right-4 text-white/20 hover:text-white/60 transition-colors"
              >
                <X size={18} />
              </button>

              {(() => {
                const p = PLATFORMS.find((x) => x.id === modal);
                if (!p) return null;
                return (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <img src={p.logoUrl} alt={p.name} className="h-7 w-7" />
                      <p className="text-lg font-semibold text-white">{p.name}</p>
                    </div>
                    <input
                      type="url"
                      placeholder="Enter your link"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      autoFocus
                      className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/10 focus:border-blue-500/30 transition-colors mb-4"
                    />
                    <button
                      onClick={() => saveLink(modal, urlInput)}
                      disabled={!urlInput.trim()}
                      className="w-full text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed py-2.5 rounded-lg text-white font-semibold transition-all"
                    >
                      add
                    </button>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type Template = {
  user_id: number;
  username: string;
  alias: string | null;
  avatar_url: string;
  description: string | null;
  accent_color: string | null;
  text_color: string | null;
  background_color: string | null;
  icon_color: string | null;
  bg_effect_color: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  display_effect: string | null;
  font: string | null;
  bg_effect: string | null;
  entry_text: string | null;
  entry_font: string | null;
  entry_color: string | null;
  entry_effect: string | null;
  monochrome_icons: boolean;
  monochrome_badges: boolean;
  show_username: boolean;
  panel_mouse_follow: boolean;
  audio_volume: number;
  audio_autoplay: boolean;
  audio_loop: boolean;
  audio_shuffle: boolean;
  cursor_effect: string;
  avatar_shape: string | null;
  avatar_size: number | null;
  avatar_offset_x: number | null;
  avatar_offset_y: number | null;
  name_offset_x: number | null;
  name_offset_y: number | null;
  badge_offset_x: number | null;
  badge_offset_y: number | null;
  tags?: string[];
};

function Templates({ user, onTab, onUpdateUser }: { user: User | null; onTab: (tab: TabId) => void; onUpdateUser?: (u: User) => void }) {
  const [enabled, setEnabled] = useState(false);
  const [templates, setTemplates] = useState<(Template & { views?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<number, { installs: number; stars: number; recent_installs: number }>>({});
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [tab, setTab] = useState<"community" | "favorites" | "mine">("community");
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [shareError, setShareError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase.from("templates").select("user_id, tags").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setEnabled(!!data);
      if (data?.tags?.length) setTags(data.tags);
    });
    supabase.from("templates").select(`
      user_id,
      description,
      accent_color,
      text_color,
      background_color,
      icon_color,
      bg_effect_color,
      primary_color,
      secondary_color,
      display_effect,
      font,
      bg_effect,
      entry_text,
      entry_font,
      entry_color,
      entry_effect,
      monochrome_icons,
      show_username,
      panel_mouse_follow,
      audio_volume,
      audio_autoplay,
      audio_loop,
      audio_shuffle,
      cursor_effect,
      avatar_shape,
      avatar_size,
      avatar_offset_x,
      avatar_offset_y,
      name_offset_x,
      name_offset_y,
      badge_offset_x,
      badge_offset_y,
      tags,
      users!templates_user_id_fkey ( username, alias, avatar_url )
    `).then(({ data }) => {
      if (data) {
        const mapped = data.map((t: any) => ({
          ...t,
          username: (t.users as any).username,
          alias: (t.users as any).alias,
          avatar_url: (t.users as any).avatar_url,
        }));
        setTemplates(mapped);
      }
      setLoading(false);
    });
    supabase.rpc("get_template_stats").then(({ data }) => {
      if (data) {
        const map: Record<number, { installs: number; stars: number; recent_installs: number }> = {};
        (data as any[]).forEach((s) => {
          map[s.template_user_id] = { installs: s.installs, stars: s.stars, recent_installs: s.recent_installs };
        });
        setStats(map);
      }
    });
    apiCall("template_favorites", {}).then((d) => setFavorites(new Set(d.favorites || [])));
  }, [user]);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 20);
    if (t && !tags.includes(t) && tags.length < 10) setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const toggleTemplate = () => {
    if (!user) return;
    if (enabled) {
      setConfirming(false);
      apiCall("template_toggle", { on: false });
      setEnabled(false);
      setTemplates((prev) => prev.filter((t) => t.user_id !== user.id));
    } else {
      setConfirming(true);
    }
  };

  const confirmShare = async () => {
    if (!user) return;
    setShareError(null);
    const res = await apiCall("template_toggle", { on: true, tags });
    if (res.error) { setShareError(res.error); return; }
    setEnabled(true);
    setConfirming(false);
    const saved = res.tags || tags;
    setTags(saved);
    const mine: Template & { views?: number } = {
      user_id: user.id,
      username: user.username,
      alias: user.alias,
      avatar_url: user.avatar_url,
      description: user.description,
      accent_color: user.accent_color,
      text_color: user.text_color,
      background_color: user.background_color,
      icon_color: user.icon_color,
      bg_effect_color: user.bg_effect_color,
      primary_color: user.primary_color,
      secondary_color: user.secondary_color,
      display_effect: user.display_effect,
      font: user.font,
      bg_effect: user.bg_effect,
      entry_text: user.entry_text,
      entry_font: user.entry_font,
      entry_color: user.entry_color,
      entry_effect: user.entry_effect,
      monochrome_icons: user.monochrome_icons,
      monochrome_badges: user.monochrome_badges,
      show_username: user.show_username,
      panel_mouse_follow: user.panel_mouse_follow,
      audio_volume: user.audio_volume,
      audio_autoplay: user.audio_autoplay,
      audio_loop: user.audio_loop,
      audio_shuffle: user.audio_shuffle,
      cursor_effect: user.cursor_effect,
      avatar_shape: user.avatar_shape,
      avatar_size: user.avatar_size,
      avatar_offset_x: user.avatar_offset_x,
      avatar_offset_y: user.avatar_offset_y,
      name_offset_x: user.name_offset_x,
      name_offset_y: user.name_offset_y,
      badge_offset_x: user.badge_offset_x,
      badge_offset_y: user.badge_offset_y,
      tags: saved,
    };
    setTemplates((prev) => [mine, ...prev.filter((t) => t.user_id !== user.id)]);
  };

  const saveTags = async () => {
    if (!user || !enabled) return;
    const res = await apiCall("template_toggle", { on: true, tags });
    const saved = res.tags || tags;
    setTags(saved);
    setTemplates((prev) => prev.map((t) => (t.user_id === user.id ? { ...t, tags: saved } : t)));
  };

  const installTemplate = async (t: Template) => {
    if (!user) return;
    const { error: updateErr } = await apiCall("update", {
      data: {
        description: t.description,
        accent_color: t.accent_color,
        text_color: t.text_color,
        background_color: t.background_color,
        icon_color: t.icon_color,
        bg_effect_color: t.bg_effect_color,
        primary_color: t.primary_color,
        secondary_color: t.secondary_color,
        display_effect: t.display_effect,
        font: t.font,
        bg_effect: t.bg_effect,
        entry_text: t.entry_text,
        entry_font: t.entry_font,
        entry_color: t.entry_color,
        entry_effect: t.entry_effect,
        monochrome_icons: t.monochrome_icons,
        monochrome_badges: t.monochrome_badges,
        show_username: t.show_username,
        panel_mouse_follow: t.panel_mouse_follow,
        audio_volume: t.audio_volume,
        audio_autoplay: t.audio_autoplay,
        audio_loop: t.audio_loop,
        audio_shuffle: t.audio_shuffle,
        cursor_effect: t.cursor_effect,
        avatar_shape: t.avatar_shape,
        avatar_size: t.avatar_size,
        avatar_offset_x: t.avatar_offset_x,
        avatar_offset_y: t.avatar_offset_y,
        name_offset_x: t.name_offset_x,
        name_offset_y: t.name_offset_y,
        badge_offset_x: t.badge_offset_x,
        badge_offset_y: t.badge_offset_y,
      },
    });
    if (updateErr) { console.error("install error:", updateErr); return; }
    await apiCall("template_install", { targetUserId: t.user_id });
    setStats((prev) => ({
      ...prev,
      [t.user_id]: {
        installs: (prev[t.user_id]?.installs || 0) + 1,
        stars: prev[t.user_id]?.stars || 0,
        recent_installs: (prev[t.user_id]?.recent_installs || 0) + 1,
      },
    }));
    const data = await fetchMe();
    if (data) onUpdateUser?.(data);
    onTab("customize");
  };

  const toggleFavorite = async (t: Template) => {
    if (!user || t.user_id === user.id) return;
    const faved = favorites.has(t.user_id);
    if (faved) {
      await apiCall("template_unfavorite", { targetUserId: t.user_id });
      setFavorites((prev) => { const s = new Set(prev); s.delete(t.user_id); return s; });
      setStats((prev) => ({ ...prev, [t.user_id]: { ...(prev[t.user_id] || { installs: 0, stars: 0, recent_installs: 0 }), stars: Math.max(0, (prev[t.user_id]?.stars || 0) - 1) } }));
    } else {
      await apiCall("template_favorite", { targetUserId: t.user_id });
      setFavorites((prev) => new Set(prev).add(t.user_id));
      setStats((prev) => ({ ...prev, [t.user_id]: { ...(prev[t.user_id] || { installs: 0, stars: 0, recent_installs: 0 }), stars: (prev[t.user_id]?.stars || 0) + 1 } }));
    }
  };

  const allTags = Array.from(new Set(templates.flatMap((t) => t.tags || []))).sort();
  const filtered = templates
    .filter((t) => {
      if (tab === "favorites" && !favorites.has(t.user_id)) return false;
      if (tab === "mine" && t.user_id !== user?.id) return false;
      if (tagFilter && !(t.tags || []).includes(tagFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!(t.alias || t.username).toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => (stats[b.user_id]?.installs || 0) - (stats[a.user_id]?.installs || 0));

  return (
    <div>
      <h1 className="text-lg font-semibold text-white/40 mb-8 lowercase">templates</h1>

      <div className="relative rounded-2xl p-6 overflow-hidden mb-8 border border-blue-300/20 bg-gradient-to-br from-white via-blue-200 to-blue-500 shadow-[0_4px_24px_rgba(37,99,235,0.15)]">
        <div className="absolute -top-20 -right-20 w-52 h-52 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-white/30 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Share Your Template
            </h2>
            <p className="text-[13px] text-slate-600/80 mt-1.5 font-medium">
              {confirming
                ? "pick some tags so people can find your template."
                : "Do you want your biolink template to be available online?"}
            </p>
          </div>
          <button
            onClick={toggleTemplate}
            className={`relative h-7 w-12 rounded-full transition-colors shrink-0 ${
              enabled || confirming ? "bg-blue-600" : "bg-white/30"
            }`}
          >
            <div className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
              enabled || confirming ? "translate-x-5.5" : "translate-x-0.5"
            }`} />
          </button>
        </div>

        {(confirming || enabled) && (
          <div className="relative mt-6 border-t border-slate-900/10 pt-5">
            <p className="text-xs font-bold text-slate-700 mb-3">
              {confirming ? "add tags (optional, up to 10)" : "your template tags"}
            </p>
            {shareError && (
              <p className="text-xs font-bold text-red-600 mb-3">couldn't share: {shareError}</p>
            )}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tags.length === 0 && (
                <span className="text-xs text-slate-500/70 italic">no tags yet</span>
              )}
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-900/10 text-slate-800 rounded-lg px-2.5 py-1">
                  #{tag}
                  <button onClick={() => setTags((prev) => prev.filter((t) => t !== tag))} className="hover:text-red-500 transition-colors cursor-pointer">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="add a tag..."
                className="flex-1 min-w-[140px] bg-white/70 border border-slate-900/10 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500/50 transition-colors"
              />
              <button onClick={addTag} className="text-xs font-bold bg-slate-900/10 text-slate-800 px-3 py-2 rounded-lg hover:bg-slate-900/20 transition-colors cursor-pointer">
                add
              </button>
              {confirming && (
                <>
                  <button
                    onClick={() => setConfirming(false)}
                    className="text-xs font-bold text-slate-500 px-3 py-2 rounded-lg hover:bg-slate-900/10 transition-colors cursor-pointer"
                  >
                    cancel
                  </button>
                  <button
                    onClick={confirmShare}
                    className="shimmer text-xs font-bold bg-blue-600 text-white px-4 py-2 rounded-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                  >
                    share template
                  </button>
                </>
              )}
              {enabled && !confirming && (
                <button onClick={saveTags} className="text-xs font-bold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors cursor-pointer">
                  save tags
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {(["community", "favorites", "mine"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs px-4 py-2 rounded-xl border font-bold transition-all cursor-pointer ${
              tab === t
                ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                : "bg-white/[0.03] border-white/10 text-white/40 hover:text-white/60"
            }`}
          >
            {t === "community" ? "community templates" : t === "favorites" ? `favorite templates${favorites.size ? ` (${favorites.size})` : ""}` : "my template"}
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search by display name..."
          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none placeholder:text-white/15 focus:border-blue-500/30 transition-colors"
        />
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          <button
            onClick={() => setTagFilter(null)}
            className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-all cursor-pointer ${
              tagFilter === null
                ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                : "bg-white/[0.03] border-white/10 text-white/40 hover:text-white/60"
            }`}
          >
            all
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-all cursor-pointer ${
                tagFilter === tag
                  ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                  : "bg-white/[0.03] border-white/10 text-white/40 hover:text-white/60"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="glass-card rounded-2xl p-12 flex items-center justify-center">
          <p className="text-sm text-white/20 italic">loading templates...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 flex items-center justify-center">
          <p className="text-sm text-white/10 italic">
            {tab === "mine" ? "you haven't shared a template yet" : tab === "favorites" ? "no favorite templates yet" : "no community templates yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((t) => {
            const s = stats[t.user_id] || { installs: 0, stars: 0, recent_installs: 0 };
            const isMine = t.user_id === user?.id;
            const isFav = favorites.has(t.user_id);
            const trending = !isMine && s.recent_installs >= 3;
            return (
              <div key={t.user_id} className={`glass-card rounded-2xl border overflow-hidden relative ${isMine ? "border-blue-500/30" : "border-white/10"}`}>
                <div className="relative overflow-hidden border-b border-white/10" style={{ height: 160 }}>
                  <iframe
                    src={`/${t.username}?entry=skip`}
                    className="w-full h-full border-0"
                    title={`${t.username}'s biolink`}
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin"
                  />
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/50 to-transparent" />
                  {isMine && (
                    <span className="absolute top-2 left-2 z-[1] text-[9px] font-semibold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md backdrop-blur-sm">
                      your template
                    </span>
                  )}
                  <button
                    onClick={() => toggleFavorite(t)}
                    disabled={isMine}
                    className={`absolute top-2 right-2 z-[1] h-8 w-8 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors cursor-pointer ${
                      isMine ? "bg-black/20 opacity-40 cursor-not-allowed" : "bg-black/40 hover:bg-black/60"
                    }`}
                    title={isMine ? "your own template" : isFav ? "unfavorite" : "favorite"}
                  >
                    <Star size={15} className={isFav ? "text-yellow-400" : "text-white/70"} fill={isFav ? "currentColor" : "none"} />
                  </button>
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-9 w-9 rounded-full bg-white/10 overflow-hidden shrink-0 border border-white/[0.06]">
                      {t.avatar_url ? (
                        <img src={t.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-white/30 text-xs font-bold">
                          {(t.alias || t.username)[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{t.alias || t.username}</p>
                      <p className="text-[10px] text-white/40">@{t.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="flex items-center gap-1 text-white/50 tabular-nums">
                      <Clock size={12} /> {s.installs.toLocaleString()} user{s.installs === 1 ? "" : "s"}
                    </span>
                    <span className="flex items-center gap-2.5">
                      {trending && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <TrendingUp size={12} /> trending
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-white/50 tabular-nums">
                        <Star size={12} className="text-yellow-400" fill="currentColor" /> {s.stars.toLocaleString()}
                      </span>
                    </span>
                  </div>

                  {t.tags && t.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {t.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-semibold text-blue-300/80 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => window.open(`/${t.username}`, "_blank")}
                      className="flex-1 text-xs bg-white/10 hover:bg-white/20 border border-white/20 py-2 rounded-lg text-white font-medium transition-all cursor-pointer"
                    >
                      preview
                    </button>
                    <button
                      onClick={() => installTemplate(t)}
                      disabled={isMine}
                      className={`flex-1 text-xs py-2 rounded-lg text-white font-medium transition-all cursor-pointer ${
                        isMine
                          ? "bg-white/5 text-white/20 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-500"
                      }`}
                    >
                      {isMine ? "installed" : "install template"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Visibility({ user }: { user: User | null }) {
  const [seoTitle, setSeoTitle] = useState(user?.seo_title || "");
  const [seoDescription, setSeoDescription] = useState(user?.seo_description || "");
  const [seoImage, setSeoImage] = useState(user?.seo_image || "");
  const [seoFavicon, setSeoFavicon] = useState(user?.seo_favicon || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await apiCall("update", {
      data: {
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        seo_image: seoImage || null,
        seo_favicon: seoFavicon || null,
      },
    });
    if (error) console.error("seo save error:", error);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h1 className="text-lg font-semibold text-white/40 mb-8 lowercase">visibility</h1>

      <div className="glass-card rounded-2xl p-8 bg-blue-500/[0.04] border-blue-500/10 space-y-6">
        <div>
          <p className="text-sm font-semibold text-white/80 mb-1">SEO Title</p>
          <p className="text-[11px] text-white/30 mb-3">Shown as the blue clickable link title when your profile is shared on Discord, Twitter, etc.</p>
          <input
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            placeholder={user?.display_name || user?.username || "Your profile"}
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white outline-none placeholder:text-white/10 focus:border-blue-500/30 transition-colors"
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-white/80 mb-1">SEO Description</p>
          <p className="text-[11px] text-white/30 mb-3">The description text shown below the title in link embeds.</p>
          <textarea
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            placeholder={user?.description || "Write something about yourself..."}
            rows={3}
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white outline-none placeholder:text-white/10 focus:border-blue-500/30 transition-colors resize-none"
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-white/80 mb-1">SEO Image URL</p>
          <p className="text-[11px] text-white/30 mb-3">The large image shown below the link embed. Paste any image URL.</p>
          <input
            value={seoImage}
            onChange={(e) => setSeoImage(e.target.value)}
            placeholder="https://example.com/image.png"
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white outline-none placeholder:text-white/10 focus:border-blue-500/30 transition-colors"
          />
          {seoImage && (
            <div className="mt-3 rounded-xl overflow-hidden border border-white/[0.06]">
              <img src={seoImage} alt="" className="w-full max-h-48 object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-white/80 mb-1">Tab Icon (Favicon)</p>
          <p className="text-[11px] text-white/30 mb-3">The icon shown in the browser tab for your biolink page.</p>
          <input
            value={seoFavicon}
            onChange={(e) => setSeoFavicon(e.target.value)}
            placeholder="https://example.com/favicon.png"
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white outline-none placeholder:text-white/10 focus:border-blue-500/30 transition-colors"
          />
          {seoFavicon && (
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/[0.06] px-4 py-3">
              <img src={seoFavicon} alt="" className="h-8 w-8 rounded object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
              <span className="text-xs text-white/40">preview</span>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={save}
            disabled={saving}
            className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-40 px-4 py-2 rounded-lg text-white font-semibold transition-all cursor-pointer"
          >
            {saving ? "saving..." : saved ? "saved!" : "save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-lg font-semibold text-white/40 mb-8 lowercase">{title}</h1>
      <div className="glass-card rounded-2xl p-12 flex items-center justify-center">
        <p className="text-sm text-white/10 italic">nothing here yet</p>
      </div>
    </div>
  );
}

type HostedFile = {
  id: string;
  kind: "media" | "file";
  filename: string;
  content_type: string;
  size: number;
  views: number;
  created_at: string;
  url: string;
};

function Premium({ user }: { user: User | null }) {
  const [premium, setPremium] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("badges").select("badge").eq("user_id", user.id).then(({ data }) => {
      setPremium(!!data?.some((r) => r.badge === "premium"));
      setLoaded(true);
    });
  }, [user]);

  return (
    <div className="relative">
      <div className="absolute inset-0 pointer-events-none -z-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(37,99,235,0.12),transparent_70%)]" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-lg font-semibold text-gradient-blue lowercase">premium</h1>
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-300 bg-blue-600/15 border border-blue-500/30 rounded-full px-2.5 py-1 shadow-[0_0_15px_rgba(37,99,235,0.25)]">
            <Crown size={10} /> premium
          </span>
        </div>

        <div className="relative shine-effect rounded-2xl p-10 border border-blue-500/30 bg-gradient-to-br from-blue-600/15 via-blue-500/5 to-white/5 flex flex-col items-center justify-center gap-3 text-center glow-blue">
          <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(255,255,255,0.1),transparent_70%)] pointer-events-none" />
          {loaded && premium ? (
            <>
              <img src="/emojis/premium.png" alt="premium" className="relative h-14 w-14 object-contain drop-shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
              <p className="relative text-gradient-blue font-bold text-lg">you have premium</p>
              <p className="relative text-sm text-white/50">thanks for supporting sire.lol.</p>
            </>
          ) : (
            <>
              <div className="relative h-14 w-14 rounded-2xl bg-blue-600/20 border border-blue-400/40 flex items-center justify-center shadow-[0_0_25px_rgba(37,99,235,0.4)]">
                <Crown size={22} className="text-blue-300" />
              </div>
              <p className="relative text-gradient-blue font-bold text-lg">you're on the free plan</p>
              <p className="relative text-sm text-white/50 max-w-sm">premium unlocks exclusive features like the media host, file host, and more.</p>
            </>
          )}
        </div>

        <div className="mt-8">
          <p className="text-sm font-semibold text-white/80 mb-4">included features</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="group relative rounded-2xl overflow-hidden border border-blue-500/20 bg-white/[0.03] p-4 transition-all hover:border-blue-400/50 hover:shadow-[0_0_30px_rgba(37,99,235,0.25)]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
              <div className="flex items-center gap-2">
                <Image size={15} className="text-blue-300" />
                <span className="text-sm font-semibold text-white/80">media host</span>
                {loaded && (
                  <span className={`ml-auto text-[10px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5 ${
                    premium
                      ? "text-green-300 bg-green-600/15 border border-green-500/30"
                      : "text-blue-300 bg-blue-600/15 border border-blue-500/30"
                  }`}>
                    {premium ? "unlocked" : "premium"}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/40 mt-1">upload images and videos up to 30mb, get a sire.lol link for each one.</p>
            </div>
            <div className="group relative rounded-2xl overflow-hidden border border-blue-500/20 bg-white/[0.03] p-4 transition-all hover:border-blue-400/50 hover:shadow-[0_0_30px_rgba(37,99,235,0.25)]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
              <div className="flex items-center gap-2">
                <HardDrive size={15} className="text-blue-300" />
                <span className="text-sm font-semibold text-white/80">file host</span>
                {loaded && (
                  <span className={`ml-auto text-[10px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5 ${
                    premium
                      ? "text-green-300 bg-green-600/15 border border-green-500/30"
                      : "text-blue-300 bg-blue-600/15 border border-blue-500/30"
                  }`}>
                    {premium ? "unlocked" : "premium"}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/40 mt-1">share any file up to 30mb from sire.lol/f links.</p>
            </div>
            <div className="group relative rounded-2xl overflow-hidden border border-blue-500/20 bg-white/[0.03] p-4 transition-all hover:border-blue-400/50 hover:shadow-[0_0_30px_rgba(37,99,235,0.25)]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
              <div className="flex items-center gap-2">
                <Award size={15} className="text-blue-300" />
                <span className="text-sm font-semibold text-white/80">profile badge</span>
                {loaded && (
                  <span className={`ml-auto text-[10px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5 ${
                    premium
                      ? "text-green-300 bg-green-600/15 border border-green-500/30"
                      : "text-blue-300 bg-blue-600/15 border border-blue-500/30"
                  }`}>
                    {premium ? "unlocked" : "premium"}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/40 mt-1">show the exclusive premium badge on your biolink.</p>
            </div>
            <div className="group relative rounded-2xl overflow-hidden border border-blue-500/20 bg-white/[0.03] p-4 transition-all hover:border-blue-400/50 hover:shadow-[0_0_30px_rgba(37,99,235,0.25)]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
              <div className="flex items-center gap-2">
                <Layers size={15} className="text-blue-300" />
                <span className="text-sm font-semibold text-white/80">background effects</span>
                {loaded && (
                  <span className={`ml-auto text-[10px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5 ${
                    premium
                      ? "text-green-300 bg-green-600/15 border border-green-500/30"
                      : "text-blue-300 bg-blue-600/15 border border-blue-500/30"
                  }`}>
                    {premium ? "unlocked" : "premium"}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/40 mt-1">premium bg effects: particles, galaxy, matrix, spotlight.</p>
            </div>
            <div className="group relative rounded-2xl overflow-hidden border border-blue-500/20 bg-white/[0.03] p-4 transition-all hover:border-blue-400/50 hover:shadow-[0_0_30px_rgba(37,99,235,0.25)]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
              <div className="flex items-center gap-2">
                <Type size={15} className="text-blue-300" />
                <span className="text-sm font-semibold text-white/80">profile effects</span>
                {loaded && (
                  <span className={`ml-auto text-[10px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5 ${
                    premium
                      ? "text-green-300 bg-green-600/15 border border-green-500/30"
                      : "text-blue-300 bg-blue-600/15 border border-blue-500/30"
                  }`}>
                    {premium ? "unlocked" : "premium"}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/40 mt-1">premium name effects: glitch, neon, gradient flow, shine sweep.</p>
            </div>
            <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2">
                <Crown size={15} className="text-white/30" />
                <span className="text-sm font-semibold text-white/40">more coming soon</span>
              </div>
              <p className="text-[11px] text-white/20 mt-1">new premium perks are on the way.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HostManager({
  user,
  kind,
  title,
  accept,
  hint,
  emptyText,
  lockedDesc,
}: {
  user: User | null;
  kind: "media" | "file";
  title: string;
  accept: string;
  hint: string;
  emptyText: string;
  lockedDesc: string;
}) {
  const [premium, setPremium] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [items, setItems] = useState<HostedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("badges").select("badge").eq("user_id", user.id).then(({ data }) => {
      setPremium(!!data?.some((r) => r.badge === "premium"));
      setLoaded(true);
    });
  }, [user]);

  const loadItems = async () => {
    const token = getSessionToken();
    if (!token) return;
    try {
      const r = await fetch(`/api/me?action=hostList&sessionToken=${encodeURIComponent(token)}`);
      if (!r.ok) { setError("Couldn't load your files (server returned " + r.status + ")."); return; }
      const d = await r.json();
      if (d.items) setItems(d.items);
    } catch {
      setError("Couldn't load your files. Try again later.");
    }
  };

  useEffect(() => {
    if (premium) loadItems();
  }, [premium]);

  const upload = async (file: File) => {
    if (!premium) return;
    setError("");
    setUploading(true);
    try {
      await uploadFile(file, kind);
      await loadItems();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id: string) => {
    const token = getSessionToken();
    await fetch(`/api/me?action=hostDelete&id=${encodeURIComponent(id)}&sessionToken=${encodeURIComponent(token)}`, { method: "DELETE" });
    setItems(items.filter((i) => i.id !== id));
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(""), 1500);
    } catch {}
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}mb`;
    if (bytes >= 1024) return `${Math.round(bytes / 1024)}kb`;
    return `${bytes}b`;
  };

  if (loaded && !premium) {
    return (
      <div className="relative">
        <div className="absolute inset-0 pointer-events-none -z-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(37,99,235,0.12),transparent_70%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <h1 className="text-lg font-semibold text-gradient-blue lowercase">{title}</h1>
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-300 bg-blue-600/15 border border-blue-500/30 rounded-full px-2.5 py-1 shadow-[0_0_15px_rgba(37,99,235,0.25)]">
              <Crown size={10} /> premium
            </span>
          </div>
          <div className="relative shine-effect rounded-2xl p-12 flex flex-col items-center justify-center gap-4 text-center border border-blue-500/30 bg-gradient-to-br from-blue-600/15 via-blue-500/5 to-white/5 glow-blue">
            <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(255,255,255,0.1),transparent_70%)] pointer-events-none" />
            <div className="relative h-14 w-14 rounded-2xl bg-blue-600/20 border border-blue-400/40 flex items-center justify-center shadow-[0_0_25px_rgba(37,99,235,0.4)]">
              <Lock size={22} className="text-blue-300" />
            </div>
            <div className="relative">
              <p className="text-gradient-blue font-bold text-lg">premium feature</p>
              <p className="text-sm text-white/50 mt-1 max-w-sm">{lockedDesc}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 pointer-events-none -z-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(37,99,235,0.12),transparent_70%)]" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-lg font-semibold text-gradient-blue lowercase">{title}</h1>
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-300 bg-blue-600/15 border border-blue-500/30 rounded-full px-2.5 py-1 shadow-[0_0_15px_rgba(37,99,235,0.25)]">
            <Crown size={10} /> premium
          </span>
        </div>

        <div
          className="relative shine-effect rounded-2xl p-10 border border-blue-500/30 bg-gradient-to-br from-blue-600/15 via-blue-500/5 to-white/5 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all hover:border-blue-400/60 hover:shadow-[0_0_45px_rgba(37,99,235,0.35)] glow-blue"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) upload(file);
          }}
        >
          <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(255,255,255,0.12),transparent_70%)] pointer-events-none" />
          <div className="relative h-12 w-12 rounded-xl bg-blue-600/20 border border-blue-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            {uploading ? (
              <span className="h-5 w-5 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload size={20} className="text-blue-300" />
            )}
          </div>
          <p className="relative text-sm text-white/80">
            {uploading
              ? "uploading..."
              : kind === "media"
                ? "drop an image or video here, or click to browse"
                : "drop a file here, or click to browse"}
          </p>
          <p className="relative text-[11px] text-blue-200/50">{hint}</p>
          {error && <p className="relative text-xs text-red-400">{error}</p>}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
              e.target.value = "";
            }}
          />
        </div>

        <div className="mt-8">
          <p className="text-sm font-semibold text-white/80 mb-4">your files ({items.length})</p>
          {items.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 flex items-center justify-center border-blue-500/10">
              <p className="text-sm text-white/15 italic">{emptyText}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map((item) => (
                <div key={item.id} className="group relative rounded-2xl overflow-hidden border border-blue-500/20 bg-white/[0.03] transition-all hover:border-blue-400/50 hover:shadow-[0_0_30px_rgba(37,99,235,0.25)]">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
                  <div className="h-32 bg-[radial-gradient(circle_at_50%_30%,rgba(37,99,235,0.15),transparent_70%)] bg-black/40 flex items-center justify-center overflow-hidden">
                    {kind === "media" ? (
                      item.content_type.startsWith("video/") ? (
                        <video src={item.url} controls className="max-h-full max-w-full object-contain" />
                      ) : (
                        <img src={item.url} alt={item.filename} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      )
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-center px-4">
                        <HardDrive size={26} className="text-blue-300" />
                        <span className="text-[10px] uppercase tracking-wider text-white/30 break-all line-clamp-2">{item.content_type}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-white/70 truncate">{item.filename}</p>
                    <p className="text-[10px] text-white/30 mt-1">
                      {formatSize(item.size)} · {item.views} view{item.views === 1 ? "" : "s"} · {new Date(item.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => copy(item.url)}
                        className="flex-1 text-[11px] bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-sky-400 transition-all rounded-lg py-1.5 text-white font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                      >
                        {copied === item.url ? <Check size={12} /> : <Copy size={12} />}
                        {copied === item.url ? "copied!" : "copy link"}
                      </button>
                      <button
                        onClick={() => remove(item.id)}
                        className="text-[11px] bg-white/[0.04] hover:bg-red-500/10 hover:text-red-400 transition-colors rounded-lg px-3 py-1.5 text-white/50 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 size={12} />
                        delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MediaHost({ user }: { user: User | null }) {
  return (
    <HostManager
      user={user}
      kind="media"
      title="media host"
      accept="image/png,image/jpeg,image/gif,image/webp,image/avif,image/bmp,video/mp4,video/webm,video/quicktime,video/x-matroska"
      hint="png, jpg, gif, webp, avif, bmp, mp4, webm, mov, mkv — max 30mb"
      emptyText="no media hosted yet"
      lockedDesc="media host lets you upload images and videos and get a sire.lol link for each one. only premium users can use it."
    />
  );
}

function FileHost({ user }: { user: User | null }) {
  return (
    <HostManager
      user={user}
      kind="file"
      title="file host"
      accept="*/*"
      hint="any type of file — max 30mb"
      emptyText="no files hosted yet"
      lockedDesc="file host lets you upload any file up to 30mb and share it with a sire.lol link. only premium users can use it."
    />
  );
}

function Widgets({ user, onUpdateUser }: { user: User | null; onUpdateUser?: (u: User) => void }) {
  const [premium, setPremium] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [widgets, setWidgets] = useState<WidgetsConfig>(emptyWidgets);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const hydrated = useRef(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("badges").select("badge").eq("user_id", user.id).then(({ data }) => {
      setPremium(!!data?.some((r) => r.badge === "premium"));
      setLoaded(true);
    });
  }, [user]);

  useEffect(() => {
    if (!user || hydrated.current) return;
    hydrated.current = true;
    setWidgets(normalizeWidgets(user.widgets));
  }, [user]);

  const save = async () => {
    setSaving(true);
    const d = await apiCall("update", { data: { widgets } });
    setSaving(false);
    if (d.error) { alert(d.error); return; }
    if (d.user) onUpdateUser?.(d.user);
    setSavedMsg("widgets saved");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  const setPages = (n: number) =>
    setWidgets((prev) => {
      const next = { ...prev, pages: n };
      if (n >= 2 && !next.about) next.about = defaultAboutPage();
      if (n >= 3 && !next.song) next.song = defaultSongPage();
      if (n >= 4 && !next.projects) next.projects = defaultProjectsPage();
      return next;
    });

  const patchAbout = (patch: Partial<AboutPageConfig>) =>
    setWidgets((prev) => ({ ...prev, about: prev.about ? { ...prev.about, ...patch } : prev.about }));

  const patchClock = (patch: Partial<ClockWidgetConfig>) =>
    setWidgets((prev) => ({ ...prev, about: prev.about?.clock ? { ...prev.about, clock: { ...prev.about.clock, ...patch } } : prev.about }));

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/[#@]/g, "");
    if (!tag) return;
    setWidgets((prev) => {
      const cur = prev.about?.tags || [];
      if (cur.length >= MAX_TAGS || cur.some((x) => x.toLowerCase() === tag.toLowerCase())) return prev;
      return { ...prev, about: prev.about ? { ...prev.about, tags: [...cur, tag] } : prev.about };
    });
  };

  const removeTag = (idx: number) =>
    setWidgets((prev) =>
      prev.about ? { ...prev, about: { ...prev.about, tags: (prev.about.tags || []).filter((_, i) => i !== idx) } } : prev
    );

  const patchSong = (patch: Partial<SongPageConfig>) =>
    setWidgets((prev) => ({ ...prev, song: prev.song ? { ...prev.song, ...patch } : prev.song }));

  const patchProject = (idx: number, patch: Partial<ProjectItem>) =>
    setWidgets((prev) => {
      if (!prev.projects) return prev;
      return {
        ...prev,
        projects: {
          ...prev.projects,
          projects: prev.projects.projects.map((pr, i) => (i === idx ? { ...pr, ...patch } : pr)),
        },
      };
    });

  const addProject = () =>
    setWidgets((prev) => {
      if (!prev.projects || prev.projects.projects.length >= MAX_PROJECTS) return prev;
      return { ...prev, projects: { ...prev.projects, projects: [...prev.projects.projects, emptyProject()] } };
    });

  const removeProject = (idx: number) =>
    setWidgets((prev) => {
      if (!prev.projects || prev.projects.projects.length <= 1) return prev;
      return {
        ...prev,
        projects: { ...prev.projects, projects: prev.projects.projects.filter((_, i) => i !== idx) },
      };
    });

  const findLocation = async () => {
    setLocating(true);
    try {
      const tz = await findMyTimeZone();
      patchClock({ timeZone: tz, label: defaultLabel(tz) });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Couldn't detect your location.");
    } finally {
      setLocating(false);
    }
  };

  const tzOptions = (currentTz: string) => {
    const list = TIMEZONE_PRESETS.some((p) => p.tz === currentTz)
      ? TIMEZONE_PRESETS
      : [{ tz: currentTz, label: defaultLabel(currentTz), offset: tzOffsetHours(currentTz) }, ...TIMEZONE_PRESETS];
    return [...list].sort((a, b) => a.offset - b.offset || a.tz.localeCompare(b.tz));
  };

  const clock = widgets.about?.clock ?? null;

  if (loaded && !premium) {
    return (
      <div className="relative">
        <div className="absolute inset-0 pointer-events-none -z-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(37,99,235,0.12),transparent_70%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <h1 className="text-lg font-semibold text-gradient-blue lowercase">widgets</h1>
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-300 bg-blue-600/15 border border-blue-500/30 rounded-full px-2.5 py-1 shadow-[0_0_15px_rgba(37,99,235,0.25)]">
              <Crown size={10} /> premium
            </span>
          </div>
          <div className="relative shine-effect rounded-2xl p-12 flex flex-col items-center justify-center gap-4 text-center border border-blue-500/30 bg-gradient-to-br from-blue-600/15 via-blue-500/5 to-white/5 glow-blue">
            <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(255,255,255,0.1),transparent_70%)] pointer-events-none" />
            <div className="relative h-14 w-14 rounded-2xl bg-blue-600/20 border border-blue-400/40 flex items-center justify-center shadow-[0_0_25px_rgba(37,99,235,0.4)]">
              <Lock size={22} className="text-blue-300" />
            </div>
            <div className="relative">
              <p className="text-gradient-blue font-bold text-lg">premium feature</p>
              <p className="text-sm text-white/50 mt-1 max-w-sm">widgets let you embed live widgets like a clock on your biolink. only premium users can use it.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 pointer-events-none -z-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(37,99,235,0.12),transparent_70%)]" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-lg font-semibold text-gradient-blue lowercase">widgets</h1>
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-300 bg-blue-600/15 border border-blue-500/30 rounded-full px-2.5 py-1 shadow-[0_0_15px_rgba(37,99,235,0.25)]">
            <Crown size={10} /> premium
          </span>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={save}
            disabled={saving}
            className="text-sm shimmer rounded-xl bg-white/[0.06] border border-white/10 px-4 py-2.5 text-white/80 font-semibold disabled:opacity-40 cursor-pointer"
          >
            {saving ? "saving..." : "save widgets"}
          </button>
          {savedMsg && <span className="text-xs text-blue-300 font-semibold">{savedMsg}</span>}
        </div>

        <div className="glass-card rounded-2xl p-6 mb-6 border-blue-500/10">
          <p className="text-[11px] text-white/40 mb-3">number of pages on your biolink</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setPages(n)}
                className={`h-10 w-10 rounded-xl text-sm font-bold transition-all cursor-pointer border ${widgets.pages === n ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-white/[0.03] text-white/50 border-white/10 hover:border-blue-500/40 hover:text-white/80"}`}
                title={`${n} page${n > 1 ? "s" : ""}`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-white/30 mt-3">
            {widgets.pages === 1
              ? "page 1 · glasscard"
              : `pages 1–${widgets.pages} · glasscard, about, ${widgets.pages >= 3 ? "song, " : ""}${widgets.pages >= 4 ? "projects" : ""}`}
          </p>
        </div>

        {widgets.pages >= 2 && widgets.about && (
          <div className="glass-card rounded-2xl p-6 mb-6 border-blue-500/10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300/80 mb-4">page 2 · about me</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-white/40 block mb-1">title</label>
                  <input
                    type="text"
                    value={widgets.about.title}
                    onChange={(e) => patchAbout({ title: e.target.value })}
                    placeholder="About me"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none placeholder:text-white/10 focus:border-blue-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-white/40 block mb-1">description</label>
                  <textarea
                    value={widgets.about.description}
                    onChange={(e) => patchAbout({ description: e.target.value })}
                    rows={4}
                    placeholder="a short description about yourself"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none placeholder:text-white/10 focus:border-blue-500/50 transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-white/40 block mb-2">
                    skill tags ({widgets.about.tags.length}/{MAX_TAGS})
                  </label>
                  {widgets.about.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {widgets.about.tags.map((t, i) => (
                        <span key={i} className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] py-1 pl-3 pr-1.5 text-xs font-semibold text-white/90">
                          <TagIcon tag={t} size={11} />
                          {t}
                          <button
                            onClick={() => removeTag(i)}
                            className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-red-500/60 cursor-pointer"
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag(tagInput);
                          setTagInput("");
                        }
                      }}
                      placeholder="add your own tag..."
                      disabled={widgets.about.tags.length >= MAX_TAGS}
                      className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none placeholder:text-white/10 focus:border-blue-500/50 transition-colors disabled:opacity-40"
                    />
                    <button
                      onClick={() => { addTag(tagInput); setTagInput(""); }}
                      disabled={widgets.about.tags.length >= MAX_TAGS || !tagInput.trim()}
                      className="text-xs font-semibold text-blue-300 hover:text-blue-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      add
                    </button>
                  </div>
                  {widgets.about.tags.length < MAX_TAGS && (
                    <div className="flex flex-wrap gap-1.5">
                      {LANGUAGE_TAGS
                        .filter((l) => !(widgets.about.tags || []).some((t) => t.toLowerCase() === l.toLowerCase()))
                        .slice(0, MAX_TAGS - widgets.about.tags.length)
                        .map((l) => (
                          <button
                            key={l}
                            onClick={() => addTag(l)}
                            className="flex items-center gap-1.5 text-[11px] rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-white/40 transition-colors hover:border-blue-500/40 hover:bg-blue-600/20 hover:text-blue-300 cursor-pointer"
                          >
                            <TagIcon tag={l} size={11} />
                            {l}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
                {clock && (
                  <>
                    <div>
                      <label className="text-[11px] text-white/40 block mb-1">clock location label</label>
                      <input
                        type="text"
                        value={clock.label}
                        onChange={(e) => patchClock({ label: e.target.value })}
                        placeholder="e.g. Istanbul"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none placeholder:text-white/10 focus:border-blue-500/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-white/40 block mb-1">timezone</label>
                      <select
                        value={clock.timeZone}
                        onChange={(e) => {
                          const tz = e.target.value;
                          patchClock({ timeZone: tz, label: defaultLabel(tz) });
                        }}
                        className="w-full bg-[#131316] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
                      >
                        {tzOptions(clock.timeZone).map((o) => (
                          <option key={o.tz} value={o.tz}>
                            {o.label} (GMT{o.offset >= 0 ? "+" : ""}{o.offset})
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={findLocation}
                      disabled={locating}
                      className="text-[11px] bg-white/[0.04] hover:bg-blue-600/20 hover:text-blue-300 border border-white/10 hover:border-blue-500/40 transition-colors rounded-lg px-3 py-2 text-white/50 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 w-full"
                    >
                      <Search size={12} />
                      {locating ? "detecting..." : "find my location"}
                    </button>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-white/40">mouse follow clock</span>
                      <Toggle checked={!!clock.mouseFollow} onChange={(v) => patchClock({ mouseFollow: v })} />
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center justify-center rounded-2xl border border-white/[0.06] bg-black/20 p-6">
                <AboutPage config={widgets.about} discordId={user?.discord_id} discordEnabled={user?.discord_rpc_enabled} />
              </div>
            </div>
          </div>
        )}

        {widgets.pages >= 3 && widgets.song && (
          <div className="glass-card rounded-2xl p-6 mb-6 border-blue-500/10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300/80 mb-4">page 3 · song + live lyrics</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-white/40 block mb-1">spotify track link</label>
                  <input
                    type="text"
                    value={widgets.song.url}
                    onChange={(e) => patchSong({ url: e.target.value })}
                    placeholder="https://open.spotify.com/track/..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none placeholder:text-white/10 focus:border-blue-500/50 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-white/30 leading-relaxed">
                  paste a spotify track link — the page will show the track embed plus live synced lyrics below it.
                </p>
              </div>
              <div className="flex items-center justify-center rounded-2xl border border-white/[0.06] bg-black/20 p-6">
                <SongPage url={widgets.song.url} />
              </div>
            </div>
          </div>
        )}

        {widgets.pages >= 4 && widgets.projects && (
          <div className="glass-card rounded-2xl p-6 mb-6 border-blue-500/10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300/80">
                page 4 · my projects ({widgets.projects.projects.length}/{MAX_PROJECTS})
              </p>
              <button
                onClick={addProject}
                disabled={widgets.projects.projects.length >= MAX_PROJECTS}
                className="text-xs font-semibold text-blue-300 hover:text-blue-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                + add project
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                {widgets.projects.projects.map((pr, i) => (
                  <div key={i} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white/50">project {i + 1}</span>
                      {widgets.projects!.projects.length > 1 && (
                        <button onClick={() => removeProject(i)} className="text-xs text-red-400/70 hover:text-red-300 transition-colors">
                          remove
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="text-[11px] text-white/40 block mb-1">banner image link</label>
                      <input
                        type="text"
                        value={pr.banner}
                        onChange={(e) => patchProject(i, { banner: e.target.value })}
                        placeholder="https://example.com/banner.png"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none placeholder:text-white/10 focus:border-blue-500/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-white/40 block mb-1">project name</label>
                      <input
                        type="text"
                        value={pr.name}
                        onChange={(e) => patchProject(i, { name: e.target.value })}
                        placeholder="e.g. My Python Project"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none placeholder:text-white/10 focus:border-blue-500/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-white/40 block mb-1">description</label>
                      <textarea
                        value={pr.description}
                        onChange={(e) => patchProject(i, { description: e.target.value })}
                        rows={2}
                        placeholder="what does it do?"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none placeholder:text-white/10 focus:border-blue-500/50 transition-colors resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center overflow-hidden rounded-2xl border border-white/[0.06] bg-black/20 p-6">
                <ProjectsPage config={widgets.projects} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DataSettings({ user }: { user: User | null }) {
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user?.username) return;
    setDeleting(true);
    try {
      const r = await apiCall("delete_account");
      if (r.error) { alert(r.error || "Failed to delete account"); setDeleting(false); return; }
      localStorage.removeItem("sl_auth");
      window.location.href = "/";
    } catch { alert("Something went wrong"); setDeleting(false); }
  };

  return (
    <div>
      <h1 className="text-lg font-semibold text-white/40 mb-6 lowercase">data management</h1>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-red-400/80 mb-1">delete account</h3>
        <p className="text-xs text-white/30 mb-4">This permanently deletes your account and all associated data. This cannot be undone.</p>
        {deleting ? (
          <p className="text-sm text-white/40">deleting...</p>
        ) : showConfirm ? (
          <div className="space-y-3">
            <p className="text-xs text-white/50">Type <span className="text-white font-semibold">{user?.username}</span> to confirm deletion:</p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={user?.username || ""}
              className="w-full bg-white/[0.03] border border-red-500/30 rounded-xl px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/10 focus:border-red-500/50 transition-colors"
            />
            <div className="flex gap-2">
              <button onClick={() => { setDeleteConfirm(""); setShowConfirm(false); setDeleting(false); }} className="flex-1 rounded-xl bg-white/[0.05] py-2.5 text-sm text-white/50 hover:text-white/80 transition-colors">
                cancel
              </button>
              <button onClick={handleDeleteAccount} disabled={deleteConfirm !== user?.username} className="flex-1 shimmer rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed">
                permanently delete
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => { setDeleteConfirm(""); setShowConfirm(true); }} className="text-sm text-red-400/70 hover:text-red-400 transition-colors">
            delete my account
          </button>
        )}
      </div>
    </div>
  );
}