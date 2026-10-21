import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

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

function SpotifyPlayer({ id }: { id: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<any>(null);
  const playingRef = useRef(false);
  const wasPlayingRef = useRef(false);

  useEffect(() => {
    let dead = false;
    loadSpotifyApi().then((Api) => {
      if (dead || !hostRef.current) return;
      Api.createController(hostRef.current, { uri: `spotify:track:${id}`, width: "100%", height: 80 }, (Controller: any) => {
        controllerRef.current = Controller;
        Controller.addListener("playback_update", (E: any) => {
          const Playing = !!E?.data && !E.data.isPaused;
          playingRef.current = Playing;
          if (Playing && StoredGain() === 0) Controller.pause();
        });
        const Frame = wrapRef.current?.querySelector("iframe");
        if (Frame) {
          Frame.style.width = "100%";
          Frame.style.height = "80px";
          Frame.style.border = "0";
          Frame.style.display = "block";
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

  return (
    <div ref={wrapRef} className="relative w-full overflow-hidden rounded-2xl" style={{ height: 80 }}>
      <div ref={hostRef} />
    </div>
  );
}

export default function SongPlayer({ platform, id, fill }: { platform: "youtube" | "spotify"; id: string; fill?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (platform === "youtube") fetchYTTrack(id).then(setTitle);
    if (platform === "spotify") setTitle("Spotify");
  }, [platform, id]);

  const badgeColor = platform === "youtube" ? "from-red-600 to-red-500" : "from-green-600 to-green-500";

  return (
    <div className={fill ? "w-full mx-auto" : "w-full max-w-xs mx-auto"}>
      {platform === "youtube" && (
        <YTPlayer id={id} playing={playing} onEnded={() => setPlaying(false)} />
      )}

      {platform === "youtube" ? (
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
              <span className={`text-[9px] font-bold uppercase tracking-widest bg-gradient-to-r ${badgeColor} bg-clip-text text-transparent`}>
                YT
              </span>
              <span className="text-[10px] text-white/30">Now Playing</span>
            </div>
            <p className="text-sm text-white/90 truncate font-medium">{title || "YouTube"}</p>
          </div>
        </div>
      ) : (
        <SpotifyPlayer id={id} />
      )}
    </div>
  );
}
