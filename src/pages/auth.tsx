import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import SEO from "../components/SEO";

const EMAIL_REGISTRATIONS_DISABLED_UNTIL = new Date("2026-08-30T00:00:00Z");
const emailRegistrationsDisabled = Date.now() < EMAIL_REGISTRATIONS_DISABLED_UNTIL.getTime();

export default function AuthPage() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const urlUsername = params.get("username") || "";
  const [isSignUp, setIsSignUp] = useState(true);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [username, setUsername] = useState(urlUsername);
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (step !== "otp") { setOtpTimer(0); return; }
    if (otpTimer <= 0) return;
    const id = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
    return () => clearTimeout(id);
  }, [step, otpTimer]);

  const handleResendOtp = async () => {
    setResending(true);
    setError("");
    try {
      const r = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Failed to resend"); setResending(false); return; }
      setOtpTimer(30);
    } catch { setError("Failed to resend"); }
    setResending(false);
  };

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  useEffect(() => {
    const uid = params.get("uid");
    const token = params.get("token");
    if (params.get("discord_success") === "true" || params.get("google_success") === "true") {
      if (uid && token) { navigate(`/dashboard?uid=${uid}&token=${encodeURIComponent(token)}`, { replace: true }); return; }
    }
    const saved = localStorage.getItem("sl_auth");
    if (saved) {
      try {
        const { uid: savedUid } = JSON.parse(saved);
        if (savedUid) { navigate(`/dashboard?uid=${savedUid}`, { replace: true }); return; }
      } catch {}
    }
    fetch("/api/auth/verify").then(r => r.json()).then((data) => {
      if (data.authed) navigate(`/dashboard?uid=${data.uid}`, { replace: true });
    });
  }, [navigate]);

  const getStrength = (p: string) => {
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 14) score++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^a-zA-Z0-9]/.test(p)) score++;
    return score;
  };

  const strength = getStrength(password);
  const strengthLabels = ["", "not acceptable", "weak", "decent", "strong", "very strong"];
  const strengthAdvice = ["", "this password is not acceptable. add another word or two. uncommon words are better.", "it must be strong and hard to guess.", "getting better, but keep going.", "strong. nearly there.", "now that's a password."];
  const strengthLabel = strengthLabels[strength];
  const advice = strengthAdvice[strength];
  const strengthColor = ["", "bg-[#ff0040]", "bg-[#ff6600]", "bg-[#ffdd00]", "bg-[#00ff44]", "bg-[#00ff88]"][strength];
  const strengthGlow = ["", "#ff0040", "#ff6600", "#ffdd00", "#00ff44", "#00ff88"][strength];

  const generatePassword = () => {
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const digits = "0123456789";
    const symbols = "!@#$%^&*()-_=+[]{}|;:,.<>?";
    const all = lower + upper + digits + symbols;
    let p = "";
    p += lower[Math.floor(Math.random() * lower.length)];
    p += upper[Math.floor(Math.random() * upper.length)];
    p += digits[Math.floor(Math.random() * digits.length)];
    p += symbols[Math.floor(Math.random() * symbols.length)];
    for (let i = 0; i < 14; i++) {
      p += all[Math.floor(Math.random() * all.length)];
    }
    p = p.split("").sort(() => Math.random() - 0.5).join("");
    setPassword(p);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 bg-black">
      <SEO title="sire.lol — sign in" description="sign in or create your sire.lol account." path="/auth" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(37,99,235,0.08),transparent_70%)]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-stretch"
      >
        <div className="hidden lg:flex flex-col">
          <div
            style={{ transform: "perspective(1000px) rotateX(4deg) rotateY(6deg)" }}
            className="glass-card border border-white/10 rounded-2xl overflow-hidden flex-1"
          >
            <video autoPlay loop muted playsInline className="h-full w-full object-cover">
              <source src="/video/mobile3.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        <div className="max-w-sm mx-auto w-full lg:mx-0 flex flex-col">
          <div className="glass-card rounded-2xl p-8 flex-1">
            <div className="text-center mb-6">
              <button onClick={() => navigate("/")} className="hover:opacity-70 transition-opacity">
                <img src="/logo.png" alt="sire.lol" className="h-8 w-auto mx-auto" />
              </button>
              <motion.p
                animate={{ backgroundPositionX: ["0%", "100%", "0%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="text-sm font-medium bg-gradient-to-r from-blue-400 via-white to-blue-400 bg-[length:200%_100%] bg-clip-text text-transparent"
              >the leading biolink platform</motion.p>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              if (step === "otp") {
                setLoading(true);
                try {
                  const r = await fetch("/api/auth/verify-otp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: pendingEmail, otp }),
                  });
                  const d = await r.json();
                  if (!r.ok) { setError(d.error || "Verification failed"); setLoading(false); return; }
                  localStorage.setItem("sl_auth", JSON.stringify({ uid: d.uid, sessionToken: d.sessionToken }));
                  navigate(`/dashboard?uid=${d.uid}&token=${encodeURIComponent(d.sessionToken)}`, { replace: true });
                } catch { setError("Something went wrong"); setLoading(false); }
                return;
              }
              if (isSignUp) {
                if (!username.trim()) { setError("Enter a username"); return; }
                if (!/^[a-zA-Z0-9_]{1,20}$/.test(username.trim())) { setError("Username can only contain letters, numbers, and underscores (max 20)"); return; }
                if (!isValidEmail(email)) { setError("Enter a valid email"); return; }
                setLoading(true);
                try {
                  const r = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username: username.trim(), email, password }),
                  });
                  const d = await r.json();
                  if (!r.ok) { setError(d.error || "Registration failed"); setLoading(false); return; }
                  setPendingEmail(email);
                  setStep("otp");
                  setOtpTimer(30);
                  setLoading(false);
                } catch { setError("Something went wrong"); setLoading(false); }
              } else {
                if (!email.trim() && !username.trim()) { setError("Enter email or username"); return; }
                setLoading(true);
                try {
                  const r = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ login: email.includes("@") ? email : username, password }),
                  });
                  const d = await r.json();
                  if (!r.ok) { setError(d.error || "Login failed"); setLoading(false); return; }
                  if (d.needsOtp) {
                    setPendingEmail(d.email);
                    setStep("otp");
                    setOtpTimer(30);
                    setLoading(false);
                    return;
                  }
                  localStorage.setItem("sl_auth", JSON.stringify({ uid: d.uid, sessionToken: d.sessionToken }));
                  navigate(`/dashboard?uid=${d.uid}&token=${encodeURIComponent(d.sessionToken)}`, { replace: true });
                } catch { setError("Something went wrong"); setLoading(false); }
              }
            }} className="space-y-4">
              {step === "otp" ? (
                <>
                <p className="text-xs text-white/40">Enter the 6-digit code sent to <span className="text-white/70">{pendingEmail}</span></p>
                <input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white text-center tracking-[0.5em] font-mono outline-none placeholder:text-white/10 focus:border-white/[0.15] transition-colors"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={otp.length !== 6 || loading}
                  className="shimmer w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? "verifying..." : "continue"}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep("form"); setOtp(""); setError(""); }}
                  className="w-full text-xs text-white/30 hover:text-white/50 transition-colors"
                >
                  back
                </button>
                {otpTimer > 0 ? (
                  <p className="text-[11px] text-white/20 text-center">resend in {otpTimer}s</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resending}
                    className="w-full text-xs text-blue-400/70 hover:text-blue-400 transition-colors disabled:opacity-40"
                  >
                    {resending ? "sending..." : "resend code"}
                  </button>
                )}
                {error && <p className="text-[11px] text-red-400/80 text-center">{error}</p>}
                </>
              ) : (isSignUp && emailRegistrationsDisabled ? (
                <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-4 text-center">
                  <p className="text-xs text-amber-200/90 leading-relaxed">
                    new user registrations using emails have been disabled. use <span className="font-semibold">gmail</span> or <span className="font-semibold">discord</span> to sign up.
                  </p>
                </div>
              ) : (<>
                <div className="relative flex items-center bg-white/[0.04] border border-blue-500/25 rounded-xl focus-within:border-blue-500/50 focus-within:shadow-[0_0_16px_rgba(59,130,246,0.1)] transition-all">
                  <span className="absolute left-4 text-sm font-semibold tracking-tight pointer-events-none select-none"><span className="text-white/70">sire</span><span className="text-blue-500">.</span><span className="text-white/70">lol/</span></span>
                  <input
                    type="text"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-transparent border-0 rounded-xl pl-[4.5rem] pr-4 py-3.5 text-sm text-white font-medium outline-none placeholder:text-white/10 transition-colors"
                  />
                </div>
              {isSignUp && (
              <div>
                <input
                  type="email"
                  placeholder="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  className={`w-full bg-white/[0.03] border rounded-xl px-4 py-3 text-sm text-white outline-none placeholder:text-white/10 focus:border-white/[0.15] transition-colors ${emailTouched && !isValidEmail(email) && email ? "border-red-500/40" : "border-white/[0.06]"}`}
                />
                {emailTouched && !isValidEmail(email) && email && (
                  <p className="text-[10px] text-red-400/60 mt-1">enter a valid email</p>
                )}
              </div>
              )}
              <div>
                <div className="relative">
                  <input
                    type="password"
                    name="new-password"
                    autoComplete="new-password"
                    placeholder="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 pr-20 text-sm text-white outline-none placeholder:text-white/10 focus:border-white/[0.15] transition-colors"
                  />
                  {isSignUp && (
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-wider text-white/30 hover:text-blue-400 transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.04]"
                  >
                    generate
                  </button>
                  )}
                </div>
                {isSignUp && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full bg-white/[0.05] overflow-hidden shadow-[0_0_8px_rgba(59,130,246,0.15)]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(strength / 5) * 100}%` }}
                          className={`h-full rounded-full ${strengthColor} transition-colors`}
                          style={{ boxShadow: strength > 0 ? `0 0 12px ${strengthGlow}` : "0 0 8px rgba(59,130,246,0.15)" }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-white/30 tracking-wider leading-none">{strengthLabel}</span>
                    </div>
                    {password && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[11px] text-white/40 leading-relaxed"
                      >
                        <span className="text-blue-400/60">suggestion: </span>
                        {advice}
                      </motion.p>
                    )}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={isSignUp ? (!isValidEmail(email) || !username.trim()) : (!password || (!email.trim() && !username.trim()))}
                className="shimmer w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? "please wait..." : (isSignUp ? "create account" : "sign in")}
              </button>
              {error && <p className="text-[11px] text-red-400/80 text-center">{error}</p>}
              </>
              ))}
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.06]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#0a0a0a] px-2 text-white/20">or</span>
              </div>
            </div>

            <a
              href="/api/auth/discord"
              className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-semibold text-white hover:scale-[1.02] active:scale-[0.98] transition-all"
              style={{ backgroundColor: "#5865F2" }}
            >
              <svg className="w-4 h-4" viewBox="0 0 127.14 96.36" fill="currentColor">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
              </svg>
              sign in with discord
            </a>

            <a
              href="/api/auth/google"
              className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-semibold text-white hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/[0.06] bg-white/[0.02]"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.87 7.35 2.56 10.56l7.97-5.97z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              continue with google
            </a>

            <p className="text-center text-xs text-white/20 mt-6">
              {isSignUp ? "already have an account? " : "don't have an account? "}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                {isSignUp ? "sign in" : "sign up"}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}