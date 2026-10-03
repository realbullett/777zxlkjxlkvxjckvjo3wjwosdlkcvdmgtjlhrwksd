// fuhhh flat vector S, no bg block son :broken_heart:
export default function Logo({ ClassName = "h-7 w-7" }: { ClassName?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={ClassName} fill="none" aria-label="sire" role="img">
      <defs>
        <linearGradient id="sire-s-g" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <path
        d="M18 6H8l-2 2v3l2 2h8l2 2v3l-2 2H6"
        stroke="url(#sire-s-g)"
        strokeWidth="3.2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
