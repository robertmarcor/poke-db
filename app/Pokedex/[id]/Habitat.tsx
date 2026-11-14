"use client";

import { useState, type ReactNode } from "react";
import Pokeball from "../../components/Pokeball";
import { focus } from "../../components/Shell/shared";
import { useViewOptions } from "../ViewOptions";
import { artworkUrl, shinyArtworkUrl, shinySpriteUrl, spriteUrl } from "../../lib/pokemon";

type Props = {
  id: number;
  name: string;
  type: string;
  children: ReactNode; // the rest of the page, which the habitat fades into
};

const pill = `cursor-pointer rounded-full px-3 py-1 text-xs font-semibold hover:bg-white/20 aria-pressed:bg-white aria-pressed:text-black ${focus}`;

// The whole Pokémon page as one centred portrait column, with the picture on top.
// SD is the game sprite on its own; HD is the newer artwork inside the habitat.
export default function Habitat({ id, name, type, children }: Props) {
  const [{ hd, shiny }, set] = useViewOptions();

  const sprite = shiny ? shinySpriteUrl(id) : spriteUrl(id);
  const artwork = shiny ? shinyArtworkUrl(id) : artworkUrl(id);
  const src = hd ? artwork : sprite;
  const [loaded, setLoaded] = useState(""); // the picture address that has finished loading

  return (
    // the outer box is as wide as the page, so the habitat is too; the column inside stays readable
    <div className="relative isolate">
      {hd && (
        <div
          aria-hidden="true"
          // reaches over <main>'s padding to the screen edge and fades out downwards into the page
          className="absolute -inset-x-4 -top-4 -z-10 h-[28rem] bg-cover bg-center [mask-image:linear-gradient(black_45%,transparent)] sm:h-[36rem]"
          style={{ backgroundImage: `url('/assets/habitats/${type}-hd.webp')` }}
        />
      )}
      <article className="mx-auto grid w-full max-w-xl gap-4">
      <div className="flex justify-between text-white">
        <div className="rounded-full bg-black/75 p-1">
          <button type="button" aria-pressed={shiny} onClick={() => set({ shiny: !shiny })} className={pill}>
            Shiny
          </button>
        </div>
        <div role="group" aria-label="Picture quality" className="flex gap-0.5 rounded-full bg-black/75 p-1">
          <button type="button" aria-pressed={!hd} onClick={() => set({ hd: false })} className={pill}>
            SD
          </button>
          <button type="button" aria-pressed={hd} onClick={() => set({ hd: true })} className={pill}>
            HD
          </button>
        </div>
      </div>
      <div className="relative grid h-64 place-items-center">
        {loaded !== src && <Pokeball className="absolute inset-0 m-auto size-12" />}
        {/* plain <img>: next/image would spend Vercel's image-optimisation quota on 1,025 tiny pictures */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={src} // a new element per picture, so the old one never lingers while the next loads
          src={src}
          onLoad={() => setLoaded(src)}
          // a picture that finished before React attached onLoad (already in the browser's cache) never fires it
          ref={(img) => {
            if (img?.complete) setLoaded(src);
          }}
          alt={shiny ? `Shiny ${name}` : name}
          width={hd ? 256 : 192}
          height={hd ? 256 : 192}
          className={hd ? "drop-shadow-[0_8px_16px_rgb(0_0_0/0.6)]" : "[image-rendering:pixelated]"}
        />
      </div>
      {children}
      </article>
    </div>
  );
}
