import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import Logo from "./Logo";

const TurnstileSiteKey = (import.meta as any).env?.VITE_TURNSTILE_SITE_KEY || "";

type GateStatus = "idle" | "checking" | "failed";

export default function VerificationGate({ Username, OnVerified }: { Username?: string; OnVerified: () => void }) {
  const [Status, SetStatus] = useState<GateStatus>("idle");
  const [Err, SetErr] = useState("");
  const WidgetId = useRef<string | null>(null);
  const RayId = useMemo(() => Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join(""), []);

  useEffect(() => {
    if (!TurnstileSiteKey) { OnVerified(); return; }
    let dead = false;
    const DoVerify = async (Token: string) => {
      if (!Token || dead) return;
      SetStatus("checking");
      SetErr("");
      try {
        const r = await fetch("/api/turnstile-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: Token }),
        });
        const J = await r.json().catch(() => null);
        if (r.ok && J?.ok) {
          localStorage.setItem("sl_verified", "1");
          localStorage.setItem("sl_verified_at", String(Date.now()));
          OnVerified();
        } else {
          SetStatus("failed");
          SetErr(J?.error || "verification failed, try again");
          try { (window as any).turnstile?.reset?.(WidgetId.current || undefined); } catch {}
        }
      } catch {
        SetStatus("failed");
        SetErr("network hiccup, try again");
        try { (window as any).turnstile?.reset?.(WidgetId.current || undefined); } catch {}
      }
    };
    const doRender = () => {
      if (dead) return;
      const w = (window as any).turnstile;
      const slot = document.getElementById("GateTurnstileSlot");
      if (!w || !slot) { setTimeout(doRender, 300); return; }
      try {
        if (!WidgetId.current) WidgetId.current = w.render(slot, {
          sitekey: TurnstileSiteKey,
          theme: "dark",
          size: "normal",
          callback: (t: string) => void DoVerify(t),
          "expired-callback": () => { SetStatus("idle"); SetErr("verification expired, do it again"); },
          "error-callback": () => { SetStatus("failed"); SetErr("something went wrong, try again"); },
        });
      } catch {}
    };
    if (!document.getElementById("TurnstileScript")) {
      const s = document.createElement("script");
      s.id = "TurnstileScript";
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      s.async = true;
      s.defer = true;
      s.onload = doRender;
      document.body.appendChild(s);
    } else doRender();
    return () => { dead = true; };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col flex-1 w-full max-w-xl mx-auto px-6"
      >
        <div className="pt-[18vh]">
          <Logo ClassName="h-8 w-8" />
          <span className="mt-5 block font-display text-2xl font-black tracking-tight">
            sire<span className="text-blue-400">.lol</span>
          </span>
          <h1 className="mt-12 font-display text-xl md:text-2xl font-semibold tracking-tight lowercase">
            quick human check
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-white/40">
            one-time check to keep bots off sire — pass it and{" "}
            {Username ? `@${Username.toLowerCase()}` : "the biolink"} opens right up.
          </p>
          <div className="mt-[9vh]">
            <div
              id="GateTurnstileSlot"
              className={`inline-block transition-opacity ${Status === "checking" ? "pointer-events-none opacity-40" : ""}`}
            />
            <div className="mt-3 flex h-5 items-center">
              {Status === "checking" ? (
                <span className="flex items-center gap-2 text-xs text-white/50">
                  <Loader2 size={12} className="animate-spin text-blue-400" /> verifying — this may take a few seconds
                </span>
              ) : Status === "failed" ? (
                <span className="text-xs text-red-400/90">{Err}</span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between gap-4 border-t border-white/10 py-5 text-[11px] text-white/35">
          <span className="font-mono">ray id: {RayId}</span>
          <span>
            protected by <span className="text-blue-400/90">cloudflare turnstile</span>
          </span>
        </div>
      </motion.div>
    </div>
  );
}
