"use client";

import { useState } from "react";
import { focus } from "../../components/Shell/shared";
import { type Pokemon } from "../../lib/pokemon";

type Props = {
  // the four names to choose from, already shuffled, one of them the answer
  options: Pokemon[];
  answer: Pokemon;
  // true once the answer has been found
  revealed: boolean;
  // called when the player picks the right card
  onCorrect: () => void;
};

// Easy mode: four cards, one of them right. A wrong pick turns red and is
// crossed out, and the player can try again; the right one turns green.
// Give it key={answer.id} so the crossed-out cards reset for every new Pokémon.
export default function ChoiceGuess({ options, answer, revealed, onCorrect }: Props) {
  // ids of the wrong cards picked so far
  const [wrong, setWrong] = useState<number[]>([]);

  return (
    <ul className="grid w-full max-w-md grid-cols-2 gap-3">
      {options.map((option) => {
        const isAnswer = option.id === answer.id;
        const isWrong = wrong.includes(option.id);

        let look = "border-foreground/20 bg-background-accent enabled:hover:border-accent";
        if (isWrong) look = "border-destructive text-destructive line-through";
        if (revealed && isAnswer) look = "border-green-600 text-green-600 shadow-[0_0_24px] shadow-green-600/60";

        return (
          <li key={option.id}>
            <button
              type="button"
              disabled={revealed || isWrong}
              onClick={() => (isAnswer ? onCorrect() : setWrong([...wrong, option.id]))}
              className={`min-h-16 w-full cursor-pointer rounded-xl border-2 p-3 text-lg font-semibold transition disabled:cursor-default ${look} ${focus}`}
            >
              {option.displayName}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
