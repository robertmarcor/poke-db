"use client";

import { useState, useSyncExternalStore } from "react";
import Button from "../../components/Button";
import { allPokemon, artworkUrl, pokemonInGens, type Pokemon } from "../../lib/pokemon";
import GenPicker from "../shared/GenPicker";
import ChoiceGuess from "./ChoiceGuess";
import TypedGuess from "./TypedGuess";

// Whether the device is a touch screen. Read straight from the browser (it is
// not state we set); a device doesn't change, so there is nothing to listen for.
const noChange = () => () => {};
const isTouchScreen = () => matchMedia("(pointer: coarse)").matches;

// One round: the Pokémon to guess, and the four names easy mode offers.
type Round = { answer: Pokemon; options: Pokemon[] };

// A copy of the list in random order (the Fisher-Yates shuffle).
function shuffle<T>(list: T[]) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// A new round from the given generations. The previous answer is left out, so
// the same Pokémon never comes twice in a row.
function newRound(gens: number[], previous: Pokemon): Round {
  const pool = shuffle(pokemonInGens(gens).filter((p) => p.id !== previous.id));
  const answer = pool[0];
  // the answer plus the next three from the shuffled pool, shuffled again so the answer isn't always first
  return { answer, options: shuffle(pool.slice(0, 4)) };
}

export default function WhosThat() {
  // false on the server, where there is no browser to ask
  const touch = useSyncExternalStore(noChange, isTouchScreen, () => false);
  // the player's own pick; null until they click the toggle
  const [easyChoice, setEasyChoice] = useState<boolean | null>(null);
  // easy mode: the player's pick if they made one, otherwise on for touch screens
  const easy = easyChoice ?? touch;

  // The first round is fixed (Bulbasaur, with the first four Pokémon as options),
  // because a random pick can't happen while the page first renders: the server
  // and the browser would each pick a different one. Later rounds are random.
  const [round, setRound] = useState<Round>({ answer: allPokemon[0], options: allPokemon.slice(0, 4) });
  const { answer, options } = round;
  // true once the player has found the answer; shows the Pokémon in colour
  const [revealed, setRevealed] = useState(false);
  // the generations the answers are drawn from
  const [gens, setGens] = useState([1]);

  function nextRound(fromGens: number[]) {
    setRound(newRound(fromGens, answer));
    setRevealed(false);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <h1>Who&apos;s That Pokémon?</h1>
      {/* GAME SCREEN: black silhouette on the theme colour, readable in dark and light mode */}
      <div className="rounded-xl bg-accent/80 p-4">
        {/* plain <img>: next/image would need the GitHub host configured and spends Vercel's image quota.
            The URL comes from the id, so it is not stored in state. key = don't show the old image while the new one loads */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={answer.id}
          src={artworkUrl(answer.id)}
          alt={revealed ? answer.displayName : "Guess the Pokémon!"}
          width={300}
          height={300}
          // brightness-0 is the silhouette; it fades to full colour on reveal
          className={`transition duration-500 ${revealed ? "" : "brightness-0"}`}
        />
      </div>

      {/* key: both inputs start fresh for every new Pokémon */}
      {easy ? (
        <ChoiceGuess
          key={answer.id}
          options={options}
          answer={answer}
          revealed={revealed}
          onCorrect={() => setRevealed(true)}
        />
      ) : (
        <TypedGuess
          key={answer.id}
          answer={answer}
          // first Enter/Space on a correct name reveals the Pokémon, the next one moves on
          onCorrect={() => (revealed ? nextRound(gens) : setRevealed(true))}
        />
      )}

      <Button onClick={() => nextRound(gens)}>{revealed ? "Next Pokémon" : "Skip"}</Button>
      <GenPicker
        selected={gens}
        onConfirm={(picked) => {
          setGens(picked);
          nextRound(picked); // the current answer may not be in the new generations
        }}
      />
      <Toggle easy={easy} onToggle={() => setEasyChoice(!easy)} />
    </div>
  );
}

function Toggle({ easy, onToggle }: { easy: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`rounded-full p-2 transition-colors ${easy ? "bg-accent text-background" : "bg-background-accent text-foreground"}`}
    >
      {easy ? "Easy Mode" : "Hard Mode"}
    </button>
  );
}
