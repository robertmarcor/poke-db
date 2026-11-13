// Angled nav backdrop. No viewBox, so 1 unit = 1px and the angles never distort:
// the shape is drawn once as a left half, clipped at the middle, and mirrored
// from the right edge. Tweak the numbers in the two paths:
//   56 = y of the low line, 260 = where the slope starts (logo width),
//   308 = where it ends, 10 = y of the raised top, 64 = header height.
export default function NavOverlay({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      width="100%"
      height="64"
      className={`pointer-events-none absolute inset-0 fill-sky-600 text-sky-400 ${className}`}
    >
      <defs>
        <g id="nav-overlay-half">
          <path d="M0 56H260L308 10H4000V64H0Z" />
          <path d="M0 56H260L308 10H4000" fill="none" stroke="currentColor" strokeWidth="2" />
        </g>
      </defs>
      {/* 51% so the halves overlap instead of leaving a hairline seam */}
      <svg width="51%">
        <use href="#nav-overlay-half" />
      </svg>
      <svg x="50%" width="50%">
        <svg x="100%" overflow="visible">
          <use href="#nav-overlay-half" transform="scale(-1 1)" />
        </svg>
      </svg>
    </svg>
  );
}
