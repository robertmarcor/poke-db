"use client";

import { useState } from "react";
import { focus, glass } from "../../components/Shell/shared";
import { type Pokemon } from "../../lib/pokemon";

type Props = {
  // the four names to choose from, already shuffled, one of them the answer
  options: Pokemon[];
  answer: Pokemon;
  // true once the answer has been found
  revealed: boolean;
  // called when the player picks the right card
  onCorrect: () => void;
  // called when the player picks a wrong card
  onWrong: () => void;
};

// Easy mode: four cards, one of them right. A wrong pick turns red and is
// crossed out, and the player can try again; the right one turns green.
// Give it key={answer.id} so the crossed-out cards reset for every new Pokémon.
export default function ChoiceGuess({ options, answer, revealed, onCorrect, onWrong }: Props) {
  // ids of the wrong cards picked so far
  const [wrong, setWrong] = useState<number[]>([]);

  return (
    <ul className="grid w-full max-w-md grid-cols-2 gap-3">
      {options.map((option) => {
        const isAnswer = option.id === answer.id;
        const isWrong = wrong.includes(option.id);

        let look = "border-white/20 enabled:hover:border-white/70";
        if (isWrong) look = "border-red-400 text-red-400 line-through";
        if (revealed && isAnswer) look = "border-green-400 text-green-400 ring-4 ring-green-400/40";

        return (
          <li key={option.id}>
            <button
              type="button"
              disabled={revealed || isWrong}
              onClick={() => {
                if (isAnswer) return onCorrect();
                setWrong([...wrong, option.id]);
                onWrong();
              }}
              className={`min-h-16 w-full cursor-pointer rounded-xl border-2 p-3 text-lg font-semibold transition disabled:cursor-default ${glass} ${look} ${focus}`}
            >
              {option.displayName}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
