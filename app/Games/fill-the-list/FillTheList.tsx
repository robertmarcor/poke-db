"use client";

/* eslint-disable @next/next/no-img-element -- static files on GitHub, nothing for next/image to optimise */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { glass } from "../../components/Shell/shared";
import {
  generations,
  pokemonInGens,
  spriteUrl,
  typable,
  type Pokemon,
} from "../../lib/pokemon";
import GenPicker from "../shared/GenPicker";
import { KitButton, Toggle } from "../shared/Kit";
import { useTouchScreen } from "../shared/useTouchScreen";

// The look of the boxes (public/assets/fill-the-list), one after another and then round again.
const themes = ["grass", "water", "sand", "brick", "flowers"];

// The kit's text field and button at a phone's size: 40px high instead of 52.
// (! because the kit's own sizes in globals.css would otherwise win.)
const small = "max-sm:min-h-10! max-sm:border-8! max-sm:py-0!";

// 83000 -> "1:23"
function clock(ms: number) {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

// Name every Pokémon of the chosen generations against the clock. Each generation
// is a PC box; a Pokémon lights up in its slot as soon as its name has been typed.
export default function FillTheList() {
  const [phase, setPhase] = useState<"ready" | "playing" | "done">("ready");
  const [gens, setGens] = useState([1]);
  // show every Pokémon as a black shape before it is named, or leave its slot empty
  const [silhouettes, setSilhouettes] = useState(true);
  // ids of the named Pokémon, in the order they were named
  const [found, setFound] = useState<number[]>([]);
  const [startedAt, setStartedAt] = useState(0);
  const [time, setTime] = useState(0); // how long the finished game took, in ms

  const pool = pokemonInGens(gens);
  const left = pool.filter((p) => !found.includes(p.id));
  const latest = pool.find((p) => p.id === found.at(-1));

  // On a touch screen the game is a layer over the whole page that fills exactly
  // the part of the screen the keyboard leaves free (the "visual viewport"): the
  // boxes scroll above the keyboard and the text field sits right on top of it.
  const overlay = useTouchScreen() && phase === "playing";
  // The layer is drawn outside the shell (see the end of this component), where
  // the theme colour isn't set, so it is read at the start and handed along.
  const [accent, setAccent] = useState("");
  // the size of the free part of the screen, as CSS variables for the layer
  useEffect(() => {
    const view = window.visualViewport;
    if (!view) return;
    const fit = () => {
      document.documentElement.style.setProperty("--view-height", `${view.height}px`);
      document.documentElement.style.setProperty("--view-top", `${view.offsetTop}px`);
    };
    fit();
    view.addEventListener("resize", fit);
    view.addEventListener("scroll", fit);
    return () => {
      view.removeEventListener("resize", fit);
      view.removeEventListener("scroll", fit);
    };
  }, []);

  // While the layer is up, the page behind it must not move: not by a swipe on
  // the layer, and not by the browser making room for the keyboard.
  useEffect(() => {
    if (!overlay) return;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [overlay]);

  // bring the Pokémon that was just named into view
  const boxes = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const slot = document.getElementById(`slot-${found.at(-1)}`);
    if (!slot) return;
    if (overlay && boxes.current) {
      // In the layer only the boxes may scroll (scrollIntoView would move the page
      // behind as well): put the slot in the middle of them.
      const area = boxes.current.getBoundingClientRect();
      const at = slot.getBoundingClientRect();
      boxes.current.scrollBy({ top: at.top - area.top - (area.height - at.height) / 2, behavior: "smooth" });
    } else {
      slot.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [found, overlay]);

  // Start and Play again open the generation picker; confirming it starts the game.
  function start(picked: number[]) {
    setGens(picked);
    setAccent(getComputedStyle(document.querySelector("main")!).getPropertyValue("--accent"));
    setFound([]);
    setStartedAt(Date.now());
    setPhase("playing");
  }

  function finish() {
    setTime(Date.now() - startedAt);
    setPhase("done");
  }

  function onFound(hits: Pokemon[]) {
    const all = [...found, ...hits.map((p) => p.id)];
    setFound(all);
    if (all.length === pool.length) finish();
  }

  if (phase === "ready")
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <h1>Fill the List</h1>
        <p className="max-w-md">
          Name every Pokémon of the generations you pick, in any order, as fast as
          you can.
        </p>
        <Toggle on={silhouettes} onToggle={() => setSilhouettes(!silhouettes)}>
          Silhouettes
        </Toggle>
        <GenPicker
          selected={gens}
          onConfirm={start}
          label="Start"
          className="kit-button"
        />
      </div>
    );

  const game = (
    <div
      style={overlay ? ({ "--accent": accent } as React.CSSProperties) : undefined}
      className={`flex flex-col gap-3 ${
        overlay
          ? // touch-none: a swipe on the layer itself (the bar, the gaps) moves nothing
            "fixed inset-x-0 top-(--view-top) z-50 h-(--view-height) touch-none bg-background p-2 text-foreground"
          : "w-full"
      }`}
    >
      {phase === "done" && (
        <div className="flex flex-col items-center gap-3 text-center">
          <h1>{left.length === 0 ? "You filled the list!" : "Time's up!"}</h1>
          <p className="text-5xl font-bold text-accent tabular-nums">
            {clock(time)}
          </p>
          <p>
            {found.length} of {pool.length} named
            {left.length > 0 && "; the ones you missed are greyed out"}
          </p>
          <GenPicker
            selected={gens}
            onConfirm={start}
            label="Play again"
            className="kit-button"
          />
        </div>
      )}

      {/* the boxes; in the layer this is the only part that scrolls, and reaching
          its top or bottom doesn't pass the swipe on to the page (overscroll-contain) */}
      <div
        ref={boxes}
        className={`flex flex-col gap-4 ${overlay ? "min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain" : ""}`}
      >
        {generations
          .filter((g) => gens.includes(g.gen))
          .map((g) => {
            const theme = themes[(g.gen - 1) % themes.length];
            const inBox = pool.filter((p) => p.id >= g.first && p.id <= g.last);
            const named = inBox.filter((p) => found.includes(p.id)).length;
            return (
              <section
                key={g.gen}
                // shrink-0: in the layer a box keeps its full height and the list scrolls, instead of the box being squashed to fit
                className="shrink-0 overflow-hidden rounded-xl border-2 border-foreground/30"
              >
                <h2
                  className="pc-art flex aspect-8/1 items-center justify-center gap-3 bg-size-[100%_100%] text-base text-white tabular-nums [text-shadow:0_1px_4px_#000] sm:text-xl"
                  style={
                    {
                      "--art": `url(/assets/fill-the-list/${theme}-header.webp)`,
                    } as React.CSSProperties
                  }
                >
                  Gen {g.gen}
                  <span className="font-normal">
                    {named}/{inBox.length}
                  </span>
                </h2>
                <ul
                  className="pc-art grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1 bg-size-[12rem] p-2"
                  style={
                    {
                      "--art": `url(/assets/fill-the-list/${theme}-wallpaper.webp)`,
                    } as React.CSSProperties
                  }
                >
                  {inBox.map((p) => {
                    const isFound = found.includes(p.id);
                    // without silhouettes an unnamed Pokémon is an empty slot, until the game is over
                    const visible = isFound || silhouettes || phase === "done";
                    let look = "brightness-0 opacity-40"; // the silhouette
                    if (isFound) look = "";
                    else if (phase === "done") look = "opacity-50 grayscale"; // missed
                    return (
                      <li
                        key={p.id}
                        id={`slot-${p.id}`}
                        className="aspect-square rounded-md bg-black/15"
                      >
                        {visible && (
                          <img
                            src={spriteUrl(p.id)}
                            // a silhouette must not give its name away
                            alt={isFound || phase === "done" ? p.displayName : ""}
                            title={
                              isFound || phase === "done" ? p.displayName : undefined
                            }
                            loading="lazy"
                            className={`size-full transition duration-500 [image-rendering:pixelated] ${look}`}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
      </div>

      {phase === "playing" && (
        // The clock, the score and the text field in one bar.
        // sticky: on a computer it stays at the bottom of the window while the boxes scroll
        <div
          className={`${glass} sticky bottom-2 z-10 mx-auto grid w-full max-w-lg gap-3 rounded-2xl border border-white/20 p-3 text-white max-sm:gap-1.5 max-sm:p-2`}
        >
          <div className="flex items-center justify-between gap-3 px-2 font-bold tabular-nums max-sm:text-sm">
            <Clock startedAt={startedAt} />
            {/* role=status: read out as each name lands */}
            <p role="status" className="truncate">
              {latest && `✓ ${latest.displayName}`}
            </p>
            <p>
              {found.length}/{pool.length}
            </p>
          </div>
          <div className="flex items-stretch gap-3 max-sm:gap-2">
            <NameInput left={left} onFound={onFound} />
            <KitButton secondary className={`shrink-0 max-sm:text-sm ${small}`} onClick={finish}>
              Give up
            </KitButton>
          </div>
        </div>
      )}
    </div>
  );

  // The shell's screen is a transformed box, and inside one "fixed" means fixed
  // to that box. So the layer is drawn straight in <body> instead.
  return overlay ? createPortal(game, document.body) : game;
}

// The running clock. Its own component, so the tick every second re-renders nothing else.
function Clock({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(startedAt);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return <time>{clock(now - startedAt)}</time>;
}

type NameInputProps = {
  // the Pokémon not named yet
  left: Pokemon[];
  // called with the Pokémon a typed name stands for (two for "nidoran": ♀ and ♂)
  onFound: (hits: Pokemon[]) => void;
};

// The text field. There is no Enter: a name counts the moment it is complete.
// Its own component, so typing re-renders only the field and not the boxes.
function NameInput({ left, onFound }: NameInputProps) {
  const [typed, setTyped] = useState("");

  // The field always clears on a match. So "mew" counts as Mew the moment it is
  // typed, even on the way to "mewtwo"; with Mew found, "mewtwo" then goes through.
  function onType(value: string) {
    const text = typable(value);
    const hits = left.filter((p) => typable(p.displayName) === text);
    if (hits.length > 0) onFound(hits);
    setTyped(hits.length > 0 ? "" : text);
  }

  return (
    <div className={`kit-input compact min-w-0 flex-1 ${small}`}>
      <input
        autoFocus
        value={typed}
        onChange={(e) => onType(e.target.value)}
        aria-label="Type a Pokémon name"
        placeholder="Pokémon name…"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        // text-base or larger: a smaller font makes iPhones zoom in on the field
        className="min-w-0 w-full bg-transparent text-base font-semibold text-white outline-none placeholder:text-slate-400"
      />
    </div>
  );
}
