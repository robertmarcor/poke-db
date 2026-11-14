// A spinning Poké Ball, shown while something loads: <Pokeball className="size-12" />
export default function Pokeball({ className = "" }: { className?: string }) {
  return (
    <svg
      role="status"
      aria-label="Loading"
      viewBox="0 0 48 48"
      className={`animate-spin stroke-[#111] stroke-3 ${className}`}
    >
      <circle cx="24" cy="24" r="22" fill="#fff" />
      <path d="M2 24a22 22 0 0 1 44 0z" fill="#ef4444" />
      <circle cx="24" cy="24" r="6" fill="#fff" />
    </svg>
  );
}
