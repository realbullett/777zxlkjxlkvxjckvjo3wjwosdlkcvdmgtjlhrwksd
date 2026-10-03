import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight, Check, Copy, ExternalLink, Lock, Megaphone, Share2, Ellipsis,
  Crown, PartyPopper, MessagesSquare, FileText, ShieldCheck, Loader2, Star, TrendingUp,
} from "lucide-react";

type MeUser = {
  id: number;
  username: string;
  display_name?: string | null;
  description?: string | null;
  onboarding_done?: number | boolean | null;
};

const apiUpdate = async (payload: Record<string, unknown>) => {
  let sessionToken: string | null = null;
  try {
    const saved = localStorage.getItem("sl_auth");
    if (saved) sessionToken = JSON.parse(saved).sessionToken;
  } catch {}
  const r = await fetch("/api/me", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "update", sessionToken, data: payload }),
  });
  return r.json().catch(() => ({}));
};

const apiAction = async (action: string, extra: Record<string, unknown> = {}) => {
  let sessionToken: string | null = null;
  try {
    const saved = localStorage.getItem("sl_auth");
    if (saved) sessionToken = JSON.parse(saved).sessionToken;
  } catch {}
  const r = await fetch("/api/me", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, sessionToken, ...extra }),
  });
  return r.json().catch(() => ({}));
};

const STARTER_FIELDS = [
  "description", "accent_color", "text_color", "background_color", "icon_color",
  "bg_effect_color", "primary_color", "secondary_color", "display_effect", "font",
  "bg_effect", "entry_text", "entry_font", "entry_color", "entry_effect",
  "monochrome_icons", "monochrome_badges", "show_username", "panel_mouse_follow",
  "audio_volume", "audio_autoplay", "audio_loop", "audio_shuffle", "cursor_effect",
  "avatar_shape", "avatar_size",
] as const;

type StarterTemplate = {
  user_id: number;
  username: string;
  alias?: string | null;
  avatar_url?: string | null;
  [k: string]: unknown;
};

const USE_CASES = [
  { id: "personal", label: "Personal Use", icon: Lock },
  { id: "brand", label: "Brand Promotion", icon: Megaphone },
  { id: "content", label: "Content Sharing", icon: Share2 },
  { id: "other", label: "Other", icon: Ellipsis },
];

const PREMIUM_FEATURES = [
  "Exclusive Badge",
  "Media Host",
  "File Host",
  "Custom Fonts",
  "Typewriter Animation",
  "Special Profile Effects",
  "Advanced Customization",
  "Metadata & SEO Customization",
];

export default function Welcome() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<MeUser | null>(null);
  const [step, setStep] = useState(0);
  const [useCase, setUseCase] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [templates, setTemplates] = useState<StarterTemplate[]>([]);
  const [tplStats, setTplStats] = useState<Record<number, { installs: number; stars: number }>>({});
  const [tplLoading, setTplLoading] = useState(false);
  const [tplLoaded, setTplLoaded] = useState(false);
  const [installing, setInstalling] = useState<number | null>(null);

  useEffect(() => {
    document.title = "welcome — sire.lol";
    const uid = searchParams.get("uid");
    const token = searchParams.get("token");
    if (!uid) { navigate("/", { replace: true }); return; }
    let storedToken: string | null = null;
    try {
      const saved = JSON.parse(localStorage.getItem("sl_auth") || "null");
      storedToken = saved?.sessionToken || null;
    } catch {}
    const qs = token ? `token=${encodeURIComponent(token)}` : (storedToken ? `s=${encodeURIComponent(storedToken)}` : "");
    if (!qs) { navigate("/auth", { replace: true }); return; }
    fetch(`/api/auth/verify?${qs}`).then(r => r.json()).then((session) => {
      if (!session?.authed) { localStorage.clear(); navigate("/auth", { replace: true }); return; }
      if (session.sessionToken) {
        localStorage.setItem("sl_auth", JSON.stringify({ uid: session.uid, sessionToken: session.sessionToken }));
      }
      if (token) navigate(`/welcome?uid=${session.uid}`, { replace: true });
      fetch(`/api/me?sessionToken=${encodeURIComponent(session.sessionToken || storedToken || "")}`)
        .then(r => r.json()).then((d) => {
          if (!d.user) { localStorage.clear(); navigate("/auth", { replace: true }); return; }
          if (d.user.onboarding_done) { navigate(`/dashboard?uid=${d.user.id}`, { replace: true }); return; }
          setUser(d.user);
          setDisplayName(d.user.display_name || "");
          setBio(d.user.description || "");
        }).catch(() => navigate("/auth", { replace: true }));
    }).catch(() => navigate("/auth", { replace: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const next = () => setStep((s) => Math.min(s + 1, 4));

  const saveUseCase = async (skip: boolean) => {
    if (skip || !useCase) { next(); return; }
    setSaving(true);
    try { await apiUpdate({ use_case: useCase }); } catch {}
    setSaving(false);
    next();
  };

  useEffect(() => {
    if (step !== 3 || tplLoaded || tplLoading || !user) return;
    setTplLoading(true);
    let token: string | null = null;
    try {
      const saved = JSON.parse(localStorage.getItem("sl_auth") || "null");
      token = saved?.sessionToken || null;
    } catch {}
    fetch(`/api/templates?sessionToken=${encodeURIComponent(token || "")}`)
      .then((r) => r.json()).then((j) => {
        const stats = (j?.stats || {}) as Record<number, { installs: number; stars: number }>;
        if (Array.isArray(j?.templates)) {
          const list = (j.templates as StarterTemplate[])
            .filter((t) => t.user_id !== user.id)
            .sort((a, b) => (stats[b.user_id]?.installs || 0) - (stats[a.user_id]?.installs || 0));
          setTemplates(list);
          setTplStats(stats);
        }
        setTplLoaded(true);
        setTplLoading(false);
      }).catch(() => { setTplLoaded(true); setTplLoading(false); });
  }, [step, user, tplLoaded, tplLoading]);

  const installStarter = async (t: StarterTemplate) => {
    if (installing !== null) return;
    setInstalling(t.user_id);
    const data: Record<string, unknown> = {};
    for (const k of STARTER_FIELDS) {
      const v = t[k];
      if (v !== undefined && v !== null) data[k] = v;
    }
    try {
      if (Object.keys(data).length) await apiUpdate(data);
      await apiAction("template_install", { targetUserId: t.user_id });
    } catch {}
    setInstalling(null);
    next();
  };
  const saveProfile = async (skip: boolean) => {
    if (!skip) {
      setSaving(true);
      try { await apiUpdate({ display_name: displayName.trim() || null, description: bio.trim() || null }); } catch {}
      setSaving(false);
    }
    next();
  };

  const finish = async (tab?: string) => {
    setSaving(true);
    try { await apiUpdate({ onboarding_done: 1 }); } catch {}
    setSaving(false);
    navigate(tab ? `/dashboard?uid=${user?.id}&tab=${tab}` : `/dashboard?uid=${user?.id}`, { replace: true });
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(`https://sire.lol/${user?.username}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const profileUrl = `sire.lol/${user?.username || ""}`;

  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(37,99,235,0.14),transparent_70%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-xl flex-col px-6 py-6">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/")} className="text-lg font-bold tracking-tight">
            <span className="text-blue-400">sire</span>.lol
          </button>
          <div className="flex items-center gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                  i < step ? "bg-blue-600 text-white" : i === step ? "bg-blue-600/25 border border-blue-500/50 text-blue-200" : "bg-white/[0.06] text-white/40"
                }`}>
                  {i < step ? <Check size={13} /> : i + 1}
                </div>
                {i < 4 && <div className={`h-px w-4 ${i < step ? "bg-blue-500/60" : "bg-white/15"}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center py-10">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">How are you planning to use sire.lol?</h1>
                <p className="mt-2 text-sm leading-relaxed text-white/50">Understanding your intended use of sire.lol enables us to optimize our platform, ensuring it supports your goals.</p>
                <div className="mt-6 flex flex-col gap-3">
                  {USE_CASES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setUseCase(c.id)}
                      className={`flex items-center gap-3 rounded-2xl border px-5 py-4 text-left text-sm font-medium transition-all ${
                        useCase === c.id ? "border-blue-500/60 bg-blue-600/10 text-white" : "border-white/10 bg-white/[0.03] text-white/80 hover:border-white/25"
                      }`}
                    >
                      <c.icon size={17} className={useCase === c.id ? "text-blue-300" : "text-white/50"} />
                      {c.label}
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={() => saveUseCase(false)}
                    disabled={!useCase || saving}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-500/40 bg-blue-600/25 py-3 text-sm font-semibold transition-all hover:bg-blue-600/35 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <>Continue <ArrowRight size={16} /></>}
                  </button>
                  <button onClick={() => saveUseCase(true)} className="rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-medium text-white/70 transition-all hover:border-white/25">
                    Skip
                  </button>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Are you ready to upgrade yet?</h1>
                <p className="mt-2 text-sm text-white/50">Get to a new level of creativity with sire.lol Premium</p>
                <div className="relative mt-6 overflow-hidden rounded-3xl border border-blue-500/25 bg-gradient-to-br from-blue-600/20 via-blue-500/[0.07] to-white/[0.03] p-7">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(255,255,255,0.08),transparent_70%)]" />
                  <Crown size={40} className="relative text-blue-300 drop-shadow-[0_0_15px_rgba(37,99,235,0.6)]" />
                  <p className="relative mt-3 text-2xl font-bold">Premium</p>
                  <p className="relative mt-1 text-sm text-white/55">The perfect plan to discover your creativity & unlock more features.</p>
                  <div className="relative mt-5 flex flex-col gap-2.5">
                    {PREMIUM_FEATURES.map((f) => (
                      <div key={f} className="flex items-center gap-2.5 text-sm text-white/85">
                        <Check size={15} className="shrink-0 text-blue-400" />
                        {f}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => finish("premium")}
                    className="relative mt-6 w-full rounded-xl border border-white/10 bg-black/40 py-3 text-sm font-semibold text-white/85 transition-all hover:border-blue-500/40 hover:text-white"
                  >
                    Learn more
                  </button>
                </div>
                <button
                  onClick={next}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/40 bg-blue-600/25 py-3 text-sm font-semibold transition-all hover:bg-blue-600/35"
                >
                  Continue <ArrowRight size={16} />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Let's set up your profile</h1>
                <p className="mt-2 text-sm text-white/50">Pick a display name and write a short bio. You can change everything later.</p>
                <div className="mt-6 flex flex-col gap-3">
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-white/50">Display name</p>
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value.slice(0, 32))}
                      placeholder={user?.username || "your name"}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-blue-500/50"
                    />
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-white/50">Bio</p>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value.slice(0, 160))}
                      placeholder="tell the world who you are..."
                      rows={3}
                      className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-blue-500/50"
                    />
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={() => saveProfile(false)}
                    disabled={saving}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-500/40 bg-blue-600/25 py-3 text-sm font-semibold transition-all hover:bg-blue-600/35 disabled:opacity-40"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <>Continue <ArrowRight size={16} /></>}
                  </button>
                  <button onClick={() => saveProfile(true)} className="rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-medium text-white/70 transition-all hover:border-white/25">
                    Skip
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Steal a starting look?</h1>
                <p className="mt-2 text-sm text-white/50">Pick one of the community's trending templates and make it yours. Totally optional — you can change everything later.</p>
                <div className="mt-6 flex flex-col gap-3">
                  {tplLoading && (
                    <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-8 text-sm text-white/50">
                      <Loader2 size={16} className="animate-spin" /> loading templates...
                    </div>
                  )}
                  {!tplLoading && templates.length === 0 && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-8 text-center text-sm text-white/50">
                      no community templates yet — you'll start with a fresh page.
                    </div>
                  )}
                  {templates.slice(0, 3).map((t) => {
                    const s = tplStats[t.user_id] || { installs: 0, stars: 0 };
                    const busy = installing === t.user_id;
                    return (
                      <div key={t.user_id} className="flex items-center gap-3 rounded-2xl border border-blue-500/25 bg-blue-600/[0.07] px-4 py-3.5">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/10">
                          {t.avatar_url ? (
                            <img src={String(t.avatar_url)} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white/40">
                              {(String(t.alias || t.username))[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">{String(t.alias || t.username)}</p>
                          <p className="mt-0.5 flex items-center gap-2 text-[11px] text-white/45">
                            <span className="flex items-center gap-1 text-emerald-400"><TrendingUp size={11} /> trending</span>
                            <span>{s.installs} user{s.installs === 1 ? "" : "s"}</span>
                            <span className="flex items-center gap-1"><Star size={11} className="text-yellow-400" />{s.stars}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => installStarter(t)}
                          disabled={installing !== null}
                          className="shrink-0 rounded-xl border border-blue-500/40 bg-blue-600/25 px-4 py-2 text-xs font-semibold transition-all hover:bg-blue-600/35 disabled:opacity-40"
                        >
                          {busy ? <Loader2 size={14} className="animate-spin" /> : "use this"}
                        </button>
                      </div>
                    );
                  })}
                  {templates.length > 3 && (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-white/35">more templates</p>
                  )}
                  {templates.slice(3).map((t) => {
                    const s = tplStats[t.user_id] || { installs: 0, stars: 0 };
                    const busy = installing === t.user_id;
                    return (
                      <div key={t.user_id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/10">
                          {t.avatar_url ? (
                            <img src={String(t.avatar_url)} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white/40">
                              {(String(t.alias || t.username))[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white/85">{String(t.alias || t.username)}</p>
                          <p className="mt-0.5 flex items-center gap-2 text-[11px] text-white/40">
                            <span>{s.installs} user{s.installs === 1 ? "" : "s"}</span>
                            <span className="flex items-center gap-1"><Star size={11} className="text-yellow-400" />{s.stars}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => installStarter(t)}
                          disabled={installing !== null}
                          className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/75 transition-all hover:border-white/25 disabled:opacity-40"
                        >
                          {busy ? <Loader2 size={14} className="animate-spin" /> : "use this"}
                        </button>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={next}
                  disabled={installing !== null}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm font-medium text-white/70 transition-all hover:border-white/25 disabled:opacity-40"
                >
                  Skip for now <ArrowRight size={16} />
                </button>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  <PartyPopper size={24} className="text-blue-300" /> You've reached the end!
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-white/50">You can now start customizing your profile! Don't forget to share your page with your friends as well.</p>
                <div className="mt-6 flex items-center gap-2.5">
                  <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <span className="text-sm font-medium text-white/70">{profileUrl}</span>
                    <button onClick={copyUrl} className="ml-auto text-xs font-semibold text-white/60 transition-colors hover:text-white">
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <a
                    href={`/${user?.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-semibold text-white/80 transition-all hover:border-white/25"
                  >
                    Open Page <ExternalLink size={13} />
                  </a>
                </div>

                <p className="mt-8 text-xl font-bold">Quick Links</p>
                <div className="mt-3 flex flex-col gap-1.5 text-sm">
                  {[
                    { label: "Account overview", tab: "overview", hint: "sire.lol/dashboard" },
                    { label: "Customize your page", tab: "customize", hint: "sire.lol/dashboard" },
                    { label: "Add your socials", tab: "links", hint: "sire.lol/dashboard" },
                    { label: "Explore profile templates", tab: "templates", hint: "sire.lol/dashboard" },
                  ].map((l) => (
                    <button key={l.tab} onClick={() => finish(l.tab)} className="group flex items-center gap-2 text-left">
                      <span className="text-white/75 transition-colors group-hover:text-white">{l.label}</span>
                      <span className="text-white/30">•</span>
                      <span className="text-white/45 transition-colors group-hover:text-blue-300">{l.hint}</span>
                    </button>
                  ))}
                </div>

                <p className="mt-8 text-xl font-bold">Support</p>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  <a href="https://discord.gg/npN6H47KEn" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-xs font-semibold text-white/80 transition-all hover:border-white/25">
                    <MessagesSquare size={14} /> Discord Server
                  </a>
                  <button onClick={() => window.open("/terms", "_blank")} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-xs font-semibold text-white/80 transition-all hover:border-white/25">
                    <FileText size={14} /> Terms
                  </button>
                  <button onClick={() => window.open("/privacy", "_blank")} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-xs font-semibold text-white/80 transition-all hover:border-white/25">
                    <ShieldCheck size={14} /> Privacy
                  </button>
                </div>

                <button
                  onClick={() => finish()}
                  disabled={saving}
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/40 bg-blue-600/25 py-3 text-sm font-semibold transition-all hover:bg-blue-600/35 disabled:opacity-40"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <>Finish <ArrowRight size={16} /></>}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
