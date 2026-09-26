import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight, Check, Copy, ExternalLink, Lock, Megaphone, Share2, Ellipsis,
  Crown, PartyPopper, MessagesSquare, FileText, ShieldCheck, Loader2,
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

  const next = () => setStep((s) => Math.min(s + 1, 3));

  const saveUseCase = async (skip: boolean) => {
    if (skip || !useCase) { next(); return; }
    setSaving(true);
    try { await apiUpdate({ use_case: useCase }); } catch {}
    setSaving(false);
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
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                  i < step ? "bg-blue-600 text-white" : i === step ? "bg-blue-600/25 border border-blue-500/50 text-blue-200" : "bg-white/[0.06] text-white/40"
                }`}>
                  {i < step ? <Check size={13} /> : i + 1}
                </div>
                {i < 3 && <div className={`h-px w-4 ${i < step ? "bg-blue-500/60" : "bg-white/15"}`} />}
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
