"use client";

import type { ReactNode } from "react";
import { focus } from "../../components/Shell/shared";
import { useViewOptions } from "../ViewOptions";

// A picker with one button per segment, and the picked segment's content under it:
// <Segments segments={[{ name: "About", content: <p>…</p> }, { name: "Stats", content: <ul>…</ul> }]} />
export default function Segments({ segments }: { segments: { name: string; content: ReactNode }[] }) {
  const [{ segment: picked }, set] = useViewOptions();

  return (
    <>
      <div
        role="group"
        aria-label="Sections"
        // see-through, so the habitat shows through
        className="grid auto-cols-fr grid-flow-col gap-0.5 rounded-full border border-foreground/15 bg-background-accent/60 p-1 backdrop-blur-md"
      >
        {segments.map(({ name }, i) => (
          <button
            key={name}
            type="button"
            aria-pressed={i === picked}
            onClick={() => set({ segment: i })}
            className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-foreground/10 aria-pressed:bg-foreground aria-pressed:text-background ${focus}`}
          >
            {name}
          </button>
        ))}
      </div>
      <section className="grid gap-4 rounded-2xl border border-foreground/15 bg-background-accent/60 p-4 backdrop-blur-md">
        {segments[picked].content}
      </section>
    </>
  );
}
