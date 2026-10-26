import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

const FmtTime = (Ms: number) => `${Math.floor(Ms / 60000)}:${String(Math.floor(Ms / 1000) % 60).padStart(2, "0")}`;

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
    SpotifyIframeApi?: any;
    onSpotifyIframeApiReady?: () => void;
  }
}

function StoredGain() {
  if (localStorage.getItem("sire_muted") === "1") return 0;
  const N = Number(localStorage.getItem("sire_volume") ?? 100);
  return Number.isFinite(N) ? Math.max(0, Math.min(100, N)) / 100 : 1;
}

function loadYTAPI() {
  if (window.YT?.Player) return Promise.resolve();
  return new Promise<void>((resolve) => {
    window.onYouTubeIframeAPIReady = () => resolve();
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  });
}

function YTPlayer({ id, playing, onEnded }: { id: string; playing: boolean; onEnded: () => void }) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gainRef = useRef(StoredGain());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let p: any;
    loadYTAPI().then(() => {
      p = new window.YT.Player(containerRef.current!, {
        height: "0", width: "0",
        videoId: id,
        playerVars: { autoplay: 0, controls: 0, origin: location.origin },
        events: {
          onReady: () => { p.setVolume(Math.round(gainRef.current * 100)); setReady(true); },
          onStateChange: (e: any) => { if (e.data === window.YT.PlayerState.ENDED) onEnded(); },
        },
      });
      playerRef.current = p;
    });
    return () => { p?.destroy(); };
  }, [id]);

  useEffect(() => {
    if (!ready || !playerRef.current) return;
    if (playing) playerRef.current.playVideo();
    else playerRef.current.pauseVideo();
  }, [playing, ready]);

  useEffect(() => {
    const OnVolume = (E: Event) => {
      gainRef.current = (E as CustomEvent).detail.Gain;
      playerRef.current?.setVolume(Math.round(gainRef.current * 100));
    };
    window.addEventListener("sire-volume", OnVolume);
    return () => window.removeEventListener("sire-volume", OnVolume);
  }, []);

  return <div ref={containerRef} className="hidden" />;
}

function fetchYTTrack(id: string): Promise<string> {
  return fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`)
    .then(r => r.json())
    .then(d => d.title || "YouTube")
    .catch(() => "YouTube");
}

let SpotifyApiPromise: Promise<any> | null = null;
function loadSpotifyApi() {
  if (window.SpotifyIframeApi) return Promise.resolve(window.SpotifyIframeApi);
  if (SpotifyApiPromise) return SpotifyApiPromise;
  SpotifyApiPromise = new Promise((Resolve) => {
    window.onSpotifyIframeApiReady = (Api: any) => { window.SpotifyIframeApi = Api; Resolve(Api); };
    const Script = document.createElement("script");
    Script.src = "https://open.spotify.com/embed/iframe-api/v1";
    Script.async = true;
    document.body.appendChild(Script);
  });
  return SpotifyApiPromise;
}

function fetchSpotifyTrack(id: string): Promise<{ title: string; art: string }> {
  return fetch(`https://open.spotify.com/oembed?url=https://open.spotify.com/track/${id}`)
    .then(r => r.json())
    .then(d => ({ title: d.title || "Spotify", art: d.thumbnail_url || "" }))
    .catch(() => ({ title: "Spotify", art: "" }));
}

function SpotifyPlayer({ id }: { id: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<any>(null);
  const wasPlayingRef = useRef(false);
  const syncRef = useRef({ pos: 0, ts: 0 });
  const playingRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);
  const [meta, setMeta] = useState({ title: "", art: "" });

  useEffect(() => { fetchSpotifyTrack(id).then(setMeta); }, [id]);

  useEffect(() => {
    let dead = false;
    loadSpotifyApi().then((Api) => {
      if (dead || !hostRef.current) return;
      Api.createController(hostRef.current, { uri: `spotify:track:${id}`, width: "100%", height: 80 }, (Controller: any) => {
        controllerRef.current = Controller;
        Controller.addListener("playback_update", (E: any) => {
          const D = E?.data;
          if (!D) return;
          const P = Number(D.position) || 0;
          const L = Number(D.duration) || 0;
          syncRef.current = { pos: P, ts: Date.now() };
          playingRef.current = !D.isPaused;
          setPlaying(!D.isPaused);
          setPos(P);
          if (L) setDur(L);
          if (!D.isPaused && StoredGain() === 0) controllerRef.current?.pause();
        });
        const Frame = hostRef.current?.querySelector("iframe");
        if (Frame) {
          Frame.style.width = "1px";
          Frame.style.height = "1px";
          Frame.style.border = "0";
          Frame.style.opacity = "0";
          Frame.style.pointerEvents = "none";
          Frame.style.position = "absolute";
          Frame.style.left = "0";
          Frame.style.top = "0";
        }
      });
    });
    return () => {
      dead = true;
      try { controllerRef.current?.destroy(); } catch { /* not ready */ }
      controllerRef.current = null;
    };
  }, [id]);

  useEffect(() => {
    const T = setInterval(() => {
      if (!playingRef.current) return;
      const S = syncRef.current;
      setPos(Math.min(S.pos + (Date.now() - S.ts), dur));
    }, 500);
    return () => clearInterval(T);
  }, [dur]);

  useEffect(() => {
    const OnVolume = (E: Event) => {
      const Gain = (E as CustomEvent).detail.Gain;
      const C = controllerRef.current;
      if (!C) return;
      if (Gain === 0) {
        wasPlayingRef.current = true;
        C.pause();
      } else if (wasPlayingRef.current) {
        wasPlayingRef.current = false;
        C.resume();
      }
    };
    window.addEventListener("sire-volume", OnVolume);
    return () => window.removeEventListener("sire-volume", OnVolume);
  }, []);

  const Toggle = () => {
    const C = controllerRef.current;
    if (!C) return;
    try { C.togglePlay(); } catch {
      try { playingRef.current ? C.pause() : C.play(); } catch { /* no-op */ }
    }
  };
  const Skip = (Dir: "prev" | "next") => {
    const C = controllerRef.current;
    if (!C) return;
    try { Dir === "prev" ? C.previousTrack() : C.nextTrack(); } catch {
      try { C.seek(0); } catch { /* no-op */ }
    }
  };
  const SeekTo = (E: { clientX: number }) => {
    const C = controllerRef.current;
    if (!C || !dur || !barRef.current) return;
    const R = barRef.current.getBoundingClientRect();
    const Ratio = Math.max(0, Math.min(1, (E.clientX - R.left) / R.width));
    try { C.seek((Ratio * dur) / 1000); } catch { /* no-op */ }
  };

  const Pct = dur ? Math.min(100, (pos / dur) * 100) : 0;

  return (
    <div className="relative w-full mx-auto select-none overflow-hidden rounded-2xl border border-white/10 bg-black/50 [&_iframe]:!absolute [&_iframe]:!left-0 [&_iframe]:!top-0 [&_iframe]:!h-1 [&_iframe]:!w-1 [&_iframe]:!border-0 [&_iframe]:!opacity-0 [&_iframe]:!pointer-events-none">
      {meta.art && (
        <img src={meta.art} aria-hidden className="absolute inset-0 h-full w-full scale-150 object-cover opacity-60 blur-2xl" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70" />
      <div className="relative flex items-center gap-3 bg-white/[0.06] px-3 py-2.5 backdrop-blur-md">
        <img
          src={meta.art}
          alt=""
          className="h-11 w-11 flex-shrink-0 rounded-lg object-cover shadow-lg shadow-black/40"
          onError={(E) => { (E.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="truncate text-[13px] font-medium text-white/90">{meta.title || "Spotify"}</span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => Skip("prev")} aria-label="previous" className="cursor-pointer p-1 text-white/60 transition-colors hover:text-white">
              <SkipBack size={13} className="fill-current" />
            </button>
            <button
              onClick={Toggle}
              aria-label={playing ? "pause" : "play"}
              className="flex h-7 w-7 flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105 active:scale-95"
            >
              {playing ? <Pause size={13} className="fill-current" /> : <Play size={13} className="ml-0.5 fill-current" />}
            </button>
            <button onClick={() => Skip("next")} aria-label="next" className="cursor-pointer p-1 text-white/60 transition-colors hover:text-white">
              <SkipForward size={13} className="fill-current" />
            </button>
            <span className="w-8 text-right text-[10px] tabular-nums text-white/60">{FmtTime(pos)}</span>
            <div ref={barRef} onClick={SeekTo} className="group relative h-3 flex-1 cursor-pointer">
              <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white/20">
                <div className="absolute inset-y-0 left-0 rounded-full bg-white" style={{ width: `${Pct}%` }} />
                <div
                  className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow transition-transform group-hover:scale-110"
                  style={{ left: `${Pct}%` }}
                />
              </div>
            </div>
            <span className="w-8 text-[10px] tabular-nums text-white/60">{FmtTime(dur)}</span>
          </div>
        </div>
      </div>
      <div ref={hostRef} className="absolute h-px w-px overflow-hidden opacity-0" />
    </div>
  );
}

export default function SongPlayer({ platform, id, fill }: { platform: "youtube" | "spotify"; id: string; fill?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (platform === "youtube") fetchYTTrack(id).then(setTitle);
  }, [platform, id]);

  if (platform === "spotify") return <SpotifyPlayer id={id} />;

  return (
    <div className={fill ? "w-full mx-auto" : "w-full max-w-xs mx-auto"}>
      <YTPlayer id={id} playing={playing} onEnded={() => setPlaying(false)} />
      <div className="flex items-center gap-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] px-5 py-4 backdrop-blur-sm">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="relative w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/[0.12] flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          {playing ? (
            <Pause size={20} className="text-white fill-white" />
          ) : (
            <Play size={20} className="text-white fill-white ml-0.5" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[9px] font-bold uppercase tracking-widest bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
              YT
            </span>
            <span className="text-[10px] text-white/30">Now Playing</span>
          </div>
          <p className="text-sm text-white/90 truncate font-medium">{title || "YouTube"}</p>
        </div>
      </div>
    </div>
  );
}
