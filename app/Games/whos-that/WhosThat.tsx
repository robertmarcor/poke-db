"use client";

import { motion, useSpring, useTransform } from "motion/react";
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from "react";
import { glass } from "../../components/Shell/shared";
import { allPokemon, artworkUrl, playCry, pokemonInGens, spriteUrl, type Pokemon } from "../../lib/pokemon";
import GenPicker from "../shared/GenPicker";
import { KitButton, Toggle } from "../shared/Kit";
import Sprite from "../shared/Sprite";
import { useTouchScreen } from "../shared/useTouchScreen";
import ChoiceGuess from "./ChoiceGuess";
import TypedGuess from "./TypedGuess";

const LIVES = 3;
const ROUND_SECONDS = 30;
const HOT_STREAK = 3; // this many right in a row earns the shield
const HOT_BONUS = 10; // extra points for every guess that keeps a hot streak going
const NEXT_DELAY = 1500; // ms the answer stays on screen before "auto next" moves on

// for useSyncExternalStore: the stored games only change when this page writes them
const noChange = () => () => {};

// One round: the Pokémon to guess, and the four names easy mode offers.
type Round = { answer: Pokemon; options: Pokemon[] };

// The points of the last correct guess, shown by the popup.
type Gain = { points: number; multiplier: number; bonus: number };

// A copy of the list in random order (the Fisher-Yates shuffle).
function shuffle<T>(list: T[]) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// A new round from the given generations, or null when there is nothing left to
// guess. A Pokémon that was guessed right doesn't come back; a missed one can.
function newRound(gens: number[], guessed: Pokemon[], previous: Pokemon): Round | null {
  const all = pokemonInGens(gens);
  const left = all.filter((p) => !guessed.includes(p));
  if (left.length === 0) return null;
  // not the same one twice in a row, unless it is the only one left
  const pool = left.length > 1 ? left.filter((p) => p.id !== previous.id) : left;
  const answer = shuffle(pool)[0];
  // easy mode's three wrong names can be any Pokémon, guessed or not
  const wrong = shuffle(all.filter((p) => p.id !== answer.id)).slice(0, 3);
  return { answer, options: shuffle([answer, ...wrong]) };
}

// The last games, kept in this browser (localStorage), newest first.
type Attempt = { score: number; named: number; won: boolean };
const ATTEMPTS_KEY = "whos-that-attempts";
const ATTEMPTS_KEPT = 5;

// The stored list as text. Text, because useSyncExternalStore needs a value it
// can compare, and a parsed list would be a new one every time.
function readAttempts() {
  try {
    return localStorage.getItem(ATTEMPTS_KEY) ?? "[]";
  } catch {
    return "[]"; // the browser can block storage
  }
}

function saveAttempt(attempt: Attempt) {
  const attempts = [attempt, ...(JSON.parse(readAttempts()) as Attempt[])].slice(0, ATTEMPTS_KEPT);
  try {
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
  } catch {
    // blocked or full: the game goes on without a history
  }
}

// Faster guesses are worth more.
function timeMultiplier(seconds: number) {
  if (seconds <= 3) return 1.5;
  if (seconds <= 10) return 1.25;
  if (seconds <= 20) return 1;
  return 0.75; // the last 10 seconds
}

// A short low buzz for a lost life.
function buzz() {
  const audio = new AudioContext();
  const tone = audio.createOscillator();
  const volume = audio.createGain();
  tone.type = "sawtooth";
  tone.frequency.value = 110;
  volume.gain.value = 0.1;
  tone.connect(volume).connect(audio.destination);
  tone.start();
  tone.stop(audio.currentTime + 0.25);
  tone.onended = () => audio.close();
}

export default function WhosThat() {
  const touch = useTouchScreen();
  // the player's own pick; null until they click the toggle
  const [easyChoice, setEasyChoice] = useState<boolean | null>(null);
  // easy mode: the player's pick if they made one, otherwise on for touch screens
  const easy = easyChoice ?? touch;
  const [sound, setSound] = useState(false);
  const [autoNext, setAutoNext] = useState(true);

  // "over" = out of lives, "won" = every Pokémon of the chosen generations guessed
  const [phase, setPhase] = useState<"ready" | "playing" | "over" | "won">("ready");
  const ended = phase === "over" || phase === "won";
  const attempts: Attempt[] = JSON.parse(useSyncExternalStore(noChange, readAttempts, () => "[]"));
  // Not shown until the player presses Start, which picks a random round. It only
  // holds a fixed value here because a random pick can't happen while the page
  // first renders: the server and the browser would each pick a different one.
  const [round, setRound] = useState<Round>({ answer: allPokemon[0], options: allPokemon.slice(0, 4) });
  const { answer, options } = round;
  // true once the round is over (guessed or out of time); shows the Pokémon in colour
  const [revealed, setRevealed] = useState(false);
  // the generations the answers are drawn from
  const [gens, setGens] = useState([1]);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [streak, setStreak] = useState(0);
  // the shield absorbs one lost life; the player can hold only one
  const [shield, setShield] = useState(false);
  // every Pokémon guessed right this game, for the grid at the end
  const [guessed, setGuessed] = useState<Pokemon[]>([]);
  const [gain, setGain] = useState<Gain | null>(null);

  // The clock only runs once the picture is there, so a slow download costs no time.
  const [loadedId, setLoadedId] = useState(0); // id of the last Pokémon whose picture loaded
  const startedAt = useRef(0); // when the clock of this round started
  const timerRunning = phase === "playing" && !revealed && loadedId === answer.id;

  // done: the Pokémon guessed so far. start() passes none, because its reset of `guessed` hasn't happened yet.
  // fromGens: likewise, start() passes the generations just picked.
  function nextRound(done = guessed, fromGens = gens) {
    const next = newRound(fromGens, done, answer);
    if (!next) return end("won");
    setRound(next);
    setRevealed(false);
  }

  function end(result: "over" | "won") {
    setPhase(result);
    saveAttempt({ score, named: guessed.length, won: result === "won" });
  }

  // Start and Play again open the generation picker; confirming it starts the game.
  function start(picked: number[]) {
    setGens(picked);
    setScore(0);
    setLives(LIVES);
    setStreak(0);
    setShield(false);
    setGuessed([]);
    setGain(null);
    setPhase("playing");
    nextRound([], picked);
  }

  function correct() {
    const multiplier = timeMultiplier((performance.now() - startedAt.current) / 1000);
    const bonus = streak >= HOT_STREAK ? HOT_BONUS : 0;
    const points = Math.round((easy ? 50 : 100) * multiplier) + bonus; // easy mode is worth half
    setScore(score + points);
    setGain({ points, multiplier, bonus });
    setGuessed([...guessed, answer]);
    setStreak(streak + 1);
    if ((streak + 1) % HOT_STREAK === 0) setShield(true);
    setRevealed(true);
    if (sound) playCry(answer.id);
  }

  // Out of time or skipped: costs a life, unless the shield takes the hit.
  // Returns true when that was the last life.
  function miss() {
    if (sound) buzz();
    if (shield) {
      setShield(false);
      return false;
    }
    setStreak(0);
    setLives(lives - 1);
    if (lives === 1) end("over");
    return lives === 1;
  }

  function skip() {
    if (miss()) setRevealed(true); // game over: show what it was
    else nextRound();
  }

  // Auto next: move on by itself a moment after the answer is shown.
  const autoAdvance = useEffectEvent(() => nextRound());
  useEffect(() => {
    if (!autoNext || !revealed || phase !== "playing") return;
    const timer = setTimeout(autoAdvance, NEXT_DELAY);
    return () => clearTimeout(timer);
  }, [autoNext, revealed, phase]);

  return (
    <div className="flex w-full flex-1 flex-col items-center gap-4">
      {/* on a phone the title makes room for the game once it has started (still there for screen readers) */}
      <h1 className={phase === "ready" ? "" : "max-sm:sr-only"}>Who&apos;s That Pokémon?</h1>

      {/* THE STAGE: the whole game plays on the burst artwork (globals.css), which fills the page.
          Everything on it is white on dark glass, so it reads the same in dark and light mode. */}
      <div className="game-screen relative flex min-h-120 w-full flex-1 flex-col items-center gap-4 rounded-3xl border border-foreground/20 p-4 text-white shadow-[0_0_40px] shadow-accent/50 sm:p-6">
        {phase === "ready" ? (
          <div className={`${glass} ${panel} m-auto flex max-w-md flex-col items-center gap-4`}>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                {ROUND_SECONDS} seconds for each Pokémon, {LIVES} lives.
              </li>
              <li>Running out of time or skipping costs a life.</li>
              <li>Fast guesses score more.</li>
              <li>
                {HOT_STREAK} in a row earns a shield <Sprite name="shield" className="size-5" /> that saves one life. Keep the streak going for +{HOT_BONUS} on
                every guess.
              </li>
            </ul>
            <GenPicker selected={gens} onConfirm={start} label="Start" className="kit-button" />
            <Attempts attempts={attempts} />
          </div>
        ) : (
          <>
            <Hud lives={lives} score={score} gain={gain} streak={streak} shield={shield} />

            {ended ? (
              <div className={`${glass} ${panel} my-auto flex w-full max-w-2xl flex-col items-center gap-3`}>
                {phase === "won" ? (
                  <h2>You named them all!</h2>
                ) : (
                  <>
                    <h2>Game over!</h2>
                    <p>That was {answer.displayName}.</p>
                  </>
                )}
                <p className="text-6xl font-bold tabular-nums">{score}</p>
                <p>
                  You named {guessed.length} Pokémon{guessed.length > 0 && ":"}
                </p>
                <Guessed pokemon={guessed} />
                <GenPicker selected={gens} onConfirm={start} label="Play again" className="kit-button" />
                <Attempts attempts={attempts} />
              </div>
            ) : (
              <>
                <div className="relative grid flex-1 place-items-center">
                  {/* plain <img>: next/image would need the GitHub host configured and spends Vercel's image quota.
                      The URL comes from the id, so it is not stored in state. key = don't show the old image while the new one loads */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    key={answer.id}
                    src={artworkUrl(answer.id)}
                    alt={revealed ? answer.displayName : "Guess the Pokémon!"}
                    width={475}
                    height={475}
                    onLoad={() => {
                      setLoadedId(answer.id);
                      startedAt.current = performance.now();
                    }}
                    // brightness-0 is the silhouette; on reveal it fades to full colour and pops out a little.
                    className={`h-[min(36vh,24rem)] w-auto transition duration-500 ${revealed ? "scale-110 drop-shadow-[0_8px_12px_rgb(0_0_0/0.5)]" : "brightness-0"}`}
                  />
                  {/* the question mark on the silhouette; gone once the Pokémon is shown */}
                  <span
                    aria-hidden
                    className={`pointer-events-none absolute inset-0 grid place-items-center text-[clamp(5rem,18vh,12rem)] leading-none font-bold [text-shadow:0_4px_24px_rgb(0_0_0/0.8)] transition-opacity duration-300 ${revealed ? "opacity-0" : "animate-pulse"}`}
                  >
                    ?
                  </span>
                </div>

                {/* always takes up its line, so nothing jumps when the name appears */}
                <p className="h-8 text-2xl font-bold [text-shadow:0_2px_8px_#000]">
                  {revealed && `It's ${answer.displayName}!`}
                </p>

                {/* key: both inputs start fresh for every new Pokémon */}
                {easy ? (
                  <ChoiceGuess
                    key={answer.id}
                    options={options}
                    answer={answer}
                    revealed={revealed}
                    onCorrect={correct}
                    onWrong={() => setStreak(0)}
                  />
                ) : (
                  <TypedGuess
                    key={answer.id}
                    answer={answer}
                    autoSubmit={autoNext}
                    // Enter/Space on a correct name scores it; once the round is over it moves on
                    onCorrect={() => (revealed ? nextRound() : correct())}
                  />
                )}

                {revealed ? (
                  <KitButton onClick={() => nextRound()}>Next Pokémon</KitButton>
                ) : (
                  // the picture says what skipping costs: the shield if there is one, otherwise a life
                  <KitButton secondary onClick={skip} aria-label={shield ? "Skip, uses your shield" : "Skip, costs a life"}>
                    Skip {shield ? <Sprite name="shield" className="size-5" /> : <Sprite name="heart" tint={RED} className="size-5" />}
                  </KitButton>
                )}
              </>
            )}

            {/* The countdown, along the bottom edge: a CSS animation (globals.css), so the clock never
                re-renders anything. key restarts it for every Pokémon; it stops where it was when the round ends */}
            <div
              key={`timer-${answer.id}`}
              className="timer-bar absolute inset-x-0 bottom-0 h-2 bg-white"
              style={{ animationDuration: `${ROUND_SECONDS}s`, animationPlayState: timerRunning ? "running" : "paused" }}
              onAnimationEnd={() => {
                miss();
                setRevealed(true);
              }}
            />
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <Toggle on={easy} onToggle={() => setEasyChoice(!easy)}>
          Easy mode
        </Toggle>
        <Toggle on={sound} onToggle={() => setSound(!sound)}>
          Sound
        </Toggle>
        <Toggle on={autoNext} onToggle={() => setAutoNext(!autoNext)}>
          Auto next
        </Toggle>
      </div>
    </div>
  );
}

// the glass box around the rules and the game over screen
const panel = "rounded-2xl border border-white/20 p-6";

const RED = "#ef4444"; // the colour of a life

type HudProps = { lives: number; score: number; gain: Gain | null; streak: number; shield: boolean };

// Lives on the left, score in the middle, streak and shield on the right.
function Hud({ lives, score, gain, streak, shield }: HudProps) {
  // The number on screen counts up to the real score. It is a motion value, so
  // counting doesn't re-render anything.
  const counter = useSpring(0, { stiffness: 60, damping: 20 });
  const shown = useTransform(counter, Math.round);
  useEffect(() => {
    // start counting when the popup lands on the score
    const timer = setTimeout(() => counter.set(score), 700);
    return () => clearTimeout(timer);
  }, [counter, score]);

  return (
    <div className={`${glass} grid w-full max-w-md grid-cols-3 items-center rounded-full border border-white/20 px-6 py-2 text-lg font-bold`}>
      <p role="img" aria-label={`${lives} of ${LIVES} lives`} className="flex gap-1">
        {Array.from({ length: LIVES }, (_, i) =>
          i < lives ? (
            <Sprite key={i} name="heart" tint={RED} className="size-7" />
          ) : (
            <Sprite key={i} name="heart-empty" className="size-7 opacity-50" />
          ),
        )}
      </p>

      <p className="relative text-center text-2xl tabular-nums">
        <span className="sr-only">Score </span>
        <motion.span>{shown}</motion.span>
        {/* The popup: appears big over the Pokémon (which is right below), then is
            sucked up into the score. vh: the Pokémon is as tall as the window allows.
            key = play again for every new score */}
        {gain && (
          <motion.span
            key={score}
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-10 whitespace-nowrap text-white [text-shadow:0_2px_8px_#000]"
            initial={{ opacity: 0 }}
            animate={{ y: ["25vh", "22vh", "22vh", "0vh"], scale: [0, 2.5, 2.5, 0.4], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1, times: [0, 0.2, 0.6, 1] }}
          >
            <Sprite name="sparkle" className="size-4" /> +{gain.points}
            {gain.multiplier !== 1 && <small> ×{gain.multiplier}</small>}
            {gain.bonus > 0 && (
              <small>
                {" "}
                <Sprite name="flame" tint="#fb923c" className="size-3" />+{gain.bonus}
              </small>
            )}
          </motion.span>
        )}
      </p>

      <p className="text-right">
        {shield && <Sprite name="shield" className="mr-2 size-7" />}
        <span className="sr-only">{shield && "Shield. "}Right in a row: </span>
        <Sprite name="flame" tint="#fb923c" className="size-7" /> {streak}
      </p>
    </div>
  );
}

// The Pokémon guessed right, as a grid of sprites. The more there are, the
// smaller they get, so the grid stays about the same size.
function Guessed({ pokemon }: { pokemon: Pokemon[] }) {
  let size = 80;
  if (pokemon.length > 15) size = 56;
  if (pokemon.length > 40) size = 40;

  return (
    <ul className="flex flex-wrap justify-center">
      {pokemon.map((p, i) => (
        // index key: the list only grows, and the same Pokémon can be in it twice
        <li key={i}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={spriteUrl(p.id)}
            alt={p.displayName}
            title={p.displayName}
            width={size}
            height={size}
            className="[image-rendering:pixelated]"
          />
        </li>
      ))}
    </ul>
  );
}

// The last few games, newest first. The best score of them gets the sparkle.
function Attempts({ attempts }: { attempts: Attempt[] }) {
  if (attempts.length === 0) return null;
  const best = Math.max(...attempts.map((a) => a.score));

  return (
    <div className="w-full max-w-xs border-t border-white/20 pt-3">
      <h3 className="text-center text-base">Last {ATTEMPTS_KEPT} games</h3>
      <ol>
        {attempts.map((attempt, i) => (
          // index key: the list is only ever replaced as a whole
          <li key={i} className="flex justify-between gap-4 tabular-nums">
            <span className="font-bold">
              {attempt.score}
              {attempt.score === best && (
                <>
                  {" "}
                  <Sprite name="sparkle" className="size-4" />
                  <span className="sr-only"> best</span>
                </>
              )}
            </span>
            <span className="opacity-80">
              {attempt.named} named{attempt.won && ", all of them"}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
