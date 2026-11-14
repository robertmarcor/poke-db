"use client";

import { useState } from "react";
import { fold, type Pokemon } from "../../lib/pokemon";

// What the player has to type: only the letters and digits of a name,
// lowercase and without accents. "Mr. Mime" -> "mrmime".
const typable = (text: string) => fold(text).replace(/[^a-z0-9]/g, "");

// how each cell in the box looks
const cellStyles = {
  right: "text-green-600",
  // wavy underline as well as red, so it doesn't rely on telling red from green
  wrong: "text-destructive underline decoration-wavy decoration-2 underline-offset-4",
  empty: "opacity-50",
  fixed: "opacity-50", // spaces and punctuation that are part of the name
};

type Props = {
  answer: Pokemon;
  // called when the player presses Enter or Space with the whole name right
  onCorrect: () => void;
};

// The typed input: one blank per letter of the name. Each typed letter turns
// green if it is the right letter in the right place and red if not; the box
// turns green when the whole name is right. Enter or Space submits.
// Give it key={answer.id} so it starts empty for every new Pokémon.
export default function TypedGuess({ answer, onCorrect }: Props) {
  const [typed, setTyped] = useState("");
  const letters = typable(answer.displayName);
  const correct = typed === letters;

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
      className={`relative rounded-2xl border-4 px-6 py-3 transition focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-accent ${
        correct ? "border-green-600 shadow-[0_0_24px] shadow-green-600/60" : "border-foreground"
      }`}
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
        {correct ? "Correct! Press Enter or Space." : ""}
      </p>
    </div>
  );
}
