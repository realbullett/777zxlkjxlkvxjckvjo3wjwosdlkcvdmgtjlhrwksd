import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

declare global {
  interface Window { YT?: any; onYouTubeIframeAPIReady?: () => void; }
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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let p: any;
    loadYTAPI().then(() => {
      p = new window.YT.Player(containerRef.current!, {
        height: "0", width: "0",
        videoId: id,
        playerVars: { autoplay: 0, controls: 0, origin: location.origin },
        events: {
          onReady: () => setReady(true),
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

  return <div ref={containerRef} className="hidden" />;
}

function fetchYTTrack(id: string): Promise<string> {
  return fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`)
    .then(r => r.json())
    .then(d => d.title || "YouTube")
    .catch(() => "YouTube");
}

export default function SongPlayer({ platform, id, fill }: { platform: "youtube" | "spotify"; id: string; fill?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [title, setTitle] = useState("");
  const spotifyRef = useRef<HTMLDivElement>(null);
  const [spotifyScale, setSpotifyScale] = useState(1);

  useEffect(() => {
    if (platform !== "spotify") return;
    const el = spotifyRef.current;
    if (!el) return;
    const update = () => setSpotifyScale(fill
      ? Math.min(1.75, Math.max(0.6, el.clientWidth / 300))
      : Math.min(1, el.clientWidth / 300));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [platform, id, fill]);

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
        <div ref={spotifyRef} className="relative w-full overflow-hidden rounded-2xl" style={{ height: Math.round(80 * spotifyScale) }}>
          <iframe
            src={`https://open.spotify.com/embed/track/${id}`}
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              width: 300,
              height: 80,
              border: "none",
              transform: `translateX(-50%) scale(${spotifyScale})`,
              transformOrigin: "center top",
            }}
            allow="autoplay; encrypted-media"
          />
        </div>
      )}
    </div>
  );
}
