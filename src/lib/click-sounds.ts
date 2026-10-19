export const CLICK_SOUNDS = [
  { id: "click", label: "click" },
  { id: "pop", label: "pop" },
  { id: "tick", label: "tick" },
  { id: "thock", label: "thock" },
  { id: "beep", label: "beep" },
  { id: "blip", label: "blip" },
  { id: "chime", label: "chime" },
  { id: "drop", label: "drop" },
  { id: "snap", label: "snap" },
  { id: "marimba", label: "marimba" },
];

let Ctx: AudioContext | null = null;

const GetCtx = () => {
  if (!Ctx) Ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  if (Ctx.state === "suspended") void Ctx.resume();
  return Ctx;
};

const Tone = (Freq: number, FreqEnd: number, Wave: OscillatorType, Dur: number, Vol: number, Delay = 0) => {
  const C = GetCtx();
  const T = C.currentTime + Delay;
  const O = C.createOscillator();
  const G = C.createGain();
  O.type = Wave;
  O.frequency.setValueAtTime(Freq, T);
  O.frequency.exponentialRampToValueAtTime(Math.max(20, FreqEnd), T + Dur);
  G.gain.setValueAtTime(0.0001, T);
  G.gain.exponentialRampToValueAtTime(Vol, T + 0.004);
  G.gain.exponentialRampToValueAtTime(0.0001, T + Dur);
  O.connect(G);
  G.connect(C.destination);
  O.start(T);
  O.stop(T + Dur + 0.02);
};

const Noise = (Dur: number, Vol: number, Freq: number, Type: BiquadFilterType, Delay = 0) => {
  const C = GetCtx();
  const T = C.currentTime + Delay;
  const Buf = C.createBuffer(1, Math.max(1, Math.floor(C.sampleRate * Dur)), C.sampleRate);
  const Data = Buf.getChannelData(0);
  for (let I = 0; I < Data.length; I++) Data[I] = Math.random() * 2 - 1;
  const Src = C.createBufferSource();
  Src.buffer = Buf;
  const F = C.createBiquadFilter();
  F.type = Type;
  F.frequency.value = Freq;
  const G = C.createGain();
  G.gain.setValueAtTime(Vol, T);
  G.gain.exponentialRampToValueAtTime(0.0001, T + Dur);
  Src.connect(F);
  F.connect(G);
  G.connect(C.destination);
  Src.start(T);
};

export const PlayClickSound = (Sound: string) => {
  if (!Sound) return;
  try {
    if (/^(https?:)?\/\//.test(Sound) || Sound.startsWith("/")) {
      const A = new Audio(Sound);
      A.volume = 0.8;
      void A.play().catch(() => {});
      return;
    }
    switch (Sound) {
      case "click": Noise(0.03, 0.4, 2600, "bandpass"); Noise(0.015, 0.2, 5200, "highpass", 0.008); break;
      case "pop": Tone(720, 160, "sine", 0.09, 0.4); break;
      case "tick": Tone(2400, 2000, "square", 0.02, 0.16); break;
      case "thock": Tone(190, 110, "triangle", 0.08, 0.45); Noise(0.05, 0.18, 380, "lowpass"); break;
      case "beep": Tone(880, 880, "square", 0.07, 0.14); break;
      case "blip": Tone(900, 1700, "sine", 0.05, 0.3); break;
      case "chime": Tone(1046, 1046, "sine", 0.35, 0.16); Tone(1568, 1568, "sine", 0.45, 0.1, 0.06); break;
      case "drop": Tone(1400, 300, "sine", 0.16, 0.35); break;
      case "snap": Noise(0.02, 0.45, 5000, "highpass"); Tone(1500, 900, "square", 0.02, 0.12); break;
      case "marimba": Tone(523, 523, "sine", 0.22, 0.28); Tone(1046, 1046, "sine", 0.18, 0.1, 0.01); break;
    }
  } catch { /* audio unavailable */ }
};
