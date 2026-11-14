"use client";

import { focus } from "../../components/Shell/shared";
import { playCry } from "../../lib/pokemon";

// A round button that plays the Pokémon's cry.
export default function Cry({ id }: { id: number }) {
  return (
    <button
      type="button"
      aria-label="Play cry"
      title="Play cry"
      onClick={() => playCry(id)}
      className={`cursor-pointer rounded-full bg-background-accent/60 p-2 backdrop-blur-md hover:bg-foreground/10 ${focus}`}
    >
      <svg aria-hidden viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-2">
        <path d="M11 5 6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
