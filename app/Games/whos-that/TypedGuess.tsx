"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { typable, type Pokemon } from "../../lib/pokemon";

// how each cell in the box looks
const cellStyles = {
  right: "text-green-400",
  wrong: "text-red-400",
  empty: "opacity-50",
  fixed: "opacity-50", // spaces and punctuation that are part of the name
};

type Props = {
  answer: Pokemon;
  // called when the player presses Enter or Space with the whole name right
  onCorrect: () => void;
  // submit by itself a moment after the last right letter, without Enter or Space
  autoSubmit: boolean;
};

// The typed input: one blank per letter of the name. Each typed letter turns
// green if it is the right letter in the right place and red if not; the box
// turns green when the whole name is right. Enter or Space submits.
// Give it key={answer.id} so it starts empty for every new Pokémon.
export default function TypedGuess({ answer, onCorrect, autoSubmit }: Props) {
  const [typed, setTyped] = useState("");
  const letters = typable(answer.displayName);
  const correct = typed === letters;

  // the short wait lets the player see the last letter turn green first
  const submit = useEffectEvent(onCorrect);
  useEffect(() => {
    if (!autoSubmit || !correct) return;
    const timer = setTimeout(submit, 100);
    return () => clearTimeout(timer);
  }, [autoSubmit, correct]);

  // Walk through the name as it is displayed. Letters become cells the player
  // fills in; anything else (space, dot, apostrophe, ♀) is shown as it is.
  const cells: { char: string; style: keyof typeof cellStyles }[] = [];
  let position = 0; // which typed letter the next cell belongs to
  for (const char of answer.displayName) {
    if (!typable(char)) {
      cells.push({ char, style: "fixed" });
    } else if (position >= typed.length) {
      cells.push({ char: "_", style: "empty" });
      position++;
    } else {
      cells.push({ char: typed[position], style: typed[position] === letters[position] ? "right" : "wrong" });
      position++;
    }
  }

  return (
    <div
      // kit-input (globals.css) draws the frame, and a brighter one while the field has focus
      className={`kit-input compact relative max-w-full ${correct ? "drop-shadow-[0_0_12px_var(--color-green-400)]" : ""}`}
    >
      {/* what the player sees; the real text field lies invisibly on top of it.
          whitespace-pre keeps the space in names like "Tapu Koko" from collapsing to nothing */}
      <p aria-hidden className="flex flex-wrap justify-center gap-2 font-mono text-xl font-bold whitespace-pre uppercase sm:gap-3 sm:text-2xl">
        {cells.map((cell, i) => (
          <span key={i} className={cellStyles[cell.style]}>
            {cell.char}
          </span>
        ))}
      </p>
      <input
        autoFocus
        value={typed}
        onChange={(e) => setTyped(typable(e.target.value).slice(0, letters.length))}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault(); // Space submits; spaces in a name are never typed
          if (correct) onCorrect();
        }}
        aria-label={`Your guess, ${letters.length} letters`}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        className="absolute inset-0 size-full cursor-text opacity-0"
      />
      {/* for screen readers, which can't see the colours */}
      <p role="status" className="sr-only">
        {correct ? (autoSubmit ? "Correct!" : "Correct! Press Enter or Space.") : ""}
      </p>
    </div>
  );
}
