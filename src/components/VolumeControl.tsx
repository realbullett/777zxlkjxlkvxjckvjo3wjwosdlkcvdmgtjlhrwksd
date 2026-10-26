const VolumeUp = "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z";
const VolumeOff = "M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z";

export default function VolumeControl({ Volume, Muted, OnVolume, OnMute }: {
  Volume: number;
  Muted: boolean;
  OnVolume: (V: number) => void;
  OnMute: () => void;
}) {
  const Pct = Muted ? 0 : Volume;
  return (
    <div className="fixed left-4 top-4 z-[90] group">
      <div className="flex items-center gap-2 rounded-full border-2 border-white/25 bg-black/20 px-3 py-2 shadow-[0_0_10px_rgba(255,255,255,0.18),0_0_28px_rgba(255,255,255,0.08),inset_0_1px_2px_rgba(255,255,255,0.25)] backdrop-blur-2xl transition-colors group-hover:border-white/40">
        <button
          onClick={OnMute}
          aria-label={Muted ? "unmute" : "mute"}
          className="flex h-9 w-9 shrink-0 items-center justify-center text-white/85 transition-transform hover:scale-110 hover:text-white cursor-pointer"
        >
          <svg viewBox="0 0 24 24" width={28} height={28} fill="currentColor" className="drop-shadow-[0_0_3px_rgba(255,255,255,0.4)]">
            <path d={Pct === 0 ? VolumeOff : VolumeUp} />
          </svg>
        </button>
        <div className="w-0 overflow-hidden opacity-0 transition-all duration-300 group-hover:w-28 group-hover:opacity-100">
          <input
            type="range"
            min={0}
            max={100}
            value={Pct}
            onChange={(E) => OnVolume(Number(E.target.value))}
            aria-label="volume"
            className="volume-range mx-1 block w-24"
            style={{ background: `linear-gradient(90deg, #ffffff ${Pct}%, rgba(255,255,255,0.3) ${Pct}%)` }}
          />
        </div>
      </div>
    </div>
  );
}
