export default function Logo({ ClassName = "h-7 w-7 text-lg" }: { ClassName?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-blue-700 font-black text-white ${ClassName}`}
      style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
    >
      S
    </span>
  );
}
