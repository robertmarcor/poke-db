import { typingColors } from "../lib/typings";

// One type as a coloured pill: <TypingPill type="fire" />
export function TypingPill({ type }: { type: string }) {
  return (
    <span
      // the see-through white border sits on top of the colour, giving a lighter rim;
      // the text shadow keeps white readable on the pale types (electric, ice)
      className="inline-block rounded-full border-2 border-white/40 px-3 py-0.5 text-xs font-bold text-white uppercase text-shadow-[0_1px_2px_rgb(0_0_0/0.6)]"
      style={{ backgroundColor: typingColors[type] }}
    >
      {type}
    </span>
  );
}

// One type as a round badge, for rows of many types: <TypingCircle type="fire" />
// The icons are public/assets/types/fire.png and so on, one per type.
export function TypingCircle({ type }: { type: string }) {
  return (
    <span
      title={type}
      className="grid size-10 place-items-center rounded-full border-2 border-white/40"
      style={{ backgroundColor: typingColors[type] }}
    >
      {/* the files are coloured glyphs; brightness-0 + invert turns them white, to stand out on the type's colour */}
      {/* eslint-disable-next-line @next/next/no-img-element -- small local files, nothing for next/image to optimise */}
      <img src={`/assets/types/${type}.png`} alt={type} width={24} height={24} className="brightness-0 invert" />
    </span>
  );
}

// A Pokémon's types side by side: <TypingPills types={["grass", "poison"]} />
export default function TypingPills({ types }: { types: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {types.map((type) => (
        <li key={type}>
          <TypingPill type={type} />
        </li>
      ))}
    </ul>
  );
}
