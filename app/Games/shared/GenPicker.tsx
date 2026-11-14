"use client";

import { useId, useRef, useState } from "react";
import Button from "../../components/Button";
import { focus } from "../../components/Shell/shared";
import { generations, spriteUrl } from "../../lib/pokemon";

const allGens = generations.map((g) => g.gen);

type Props = {
  // the generations in play right now, e.g. [1, 3]
  selected: number[];
  // called with the new list when the player presses Confirm
  onConfirm: (gens: number[]) => void;
  // the text and the look of the button that opens the picker
  label: string;
  className: string;
};

// A button that opens a modal to choose the generations in play. Picks are a draft until Confirm: Escape or a click outside throws them away.
// The modal is a native <dialog>, which brings the backdrop, Escape and focus handling.
export default function GenPicker({ selected, onConfirm, label, className }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [draft, setDraft] = useState(selected);

  const toggle = (gen: number) =>
    setDraft((d) => (d.includes(gen) ? d.filter((g) => g !== gen) : [...d, gen].sort((a, b) => a - b)));
  // how many Pokémon the draft adds up to, shown on the Confirm button
  const count = generations
    .filter((g) => draft.includes(g.gen))
    .reduce((sum, g) => sum + g.last - g.first + 1, 0);

  return (
    <>
      <button
        type="button"
        className={`${className} ${focus}`}
        onClick={() => {
          setDraft(selected); // start from what is in play, not from an abandoned draft
          dialog.current?.showModal();
        }}
      >
        {label}
      </button>

      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        // a click on the dialog itself (not its contents) is a click on the backdrop
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="m-auto w-[min(38rem,calc(100%-2rem))] rounded-3xl border border-foreground/15 bg-background p-0 text-foreground backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        <div className="grid gap-6 p-6">
          <div className="grid gap-1 text-center">
            <h2 id={titleId} className="text-accent">
              Select generations
            </h2>
            <p className="text-sm opacity-70">Pick one or more.</p>
          </div>

          <ul className="grid grid-cols-2 gap-x-5 gap-y-4 px-2 sm:grid-cols-3">
            {generations.map((g) => (
              <li key={g.gen}>
                {/* a slanted card with a hard shadow; the contents are slanted back so they stay upright */}
                <button
                  type="button"
                  aria-pressed={draft.includes(g.gen)}
                  onClick={() => toggle(g.gen)}
                  className={`group w-full -skew-x-12 cursor-pointer rounded-lg border-2 border-foreground bg-background py-1.5 pr-2 pl-4 shadow-[4px_4px_0_var(--foreground)] transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none aria-pressed:border-accent aria-pressed:text-accent aria-pressed:shadow-[4px_4px_0_var(--accent)] ${focus}`}
                >
                  <span className="flex skew-x-12 items-center justify-between gap-1">
                    <span className="text-left">
                      <span className="block font-semibold">Gen {g.gen}</span>
                      <span className="block font-mono text-xs opacity-60">
                        {g.first}–{g.last}
                      </span>
                    </span>
                    {/* decorative, so no alt text; the starter hops when its generation is picked */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={spriteUrl(g.starter)}
                      alt=""
                      width={72}
                      height={72}
                      loading="lazy"
                      // negative margin: the sprite files have empty space around the Pokémon
                      className="-my-3 opacity-60 grayscale transition [image-rendering:pixelated] group-hover:-translate-y-1 group-aria-pressed:scale-110 group-aria-pressed:opacity-100 group-aria-pressed:grayscale-0"
                    />
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="flex justify-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setDraft(allGens)}>
              Select all
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setDraft([])}>
              Clear
            </Button>
          </div>

          <Button
            size="lg"
            className="w-full"
            disabled={draft.length === 0}
            onClick={() => {
              onConfirm(draft);
              dialog.current?.close();
            }}
          >
            {draft.length === 0 ? "Pick at least one" : `Confirm · ${count.toLocaleString("en")} Pokémon`}
          </Button>
        </div>
      </dialog>
    </>
  );
}
