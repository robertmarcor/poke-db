"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { focus } from "../components/Shell/shared";
import { TypingPill } from "../components/TypingPills";
import { allPokemon, artworkUrl, fold, generations, pokemonInGens } from "../lib/pokemon";
import { typings } from "../lib/typings";

const PAGE_SIZE = 20;

const pill = `rounded-full border border-foreground/15 bg-background-accent px-3 py-1 text-sm font-semibold hover:bg-foreground/10 aria-[current]:border-accent aria-[current]:text-accent aria-pressed:border-accent aria-pressed:text-accent ${focus}`;

// frosted glass pill for the floating page nav: a faint tint, a strong blur of
// whatever is behind it, a light rim and a highlight along the top edge
const float = `pointer-events-auto rounded-full border border-foreground/20 bg-foreground/10 px-6 py-3 font-semibold shadow-[0_8px_32px_rgb(0_0_0/0.3),inset_0_1px_0_rgb(255_255_255/0.25)] backdrop-blur-xl backdrop-saturate-150 transition [a]:hover:bg-foreground/20 ${focus}`;

// A <select> that looks like the pills. The browser's own arrow is switched off
// (.dropdown in globals.css) and ours is drawn on top, so it sits the same distance from
// the edge in every browser. The opened menu is styled by .dropdown in globals.css.
function Dropdown({ className = "", ...props }: React.ComponentProps<"select">) {
  return (
    <span className="relative">
      <select {...props} className={`dropdown cursor-pointer pr-8 capitalize ${pill} ${className}`} />
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 fill-none stroke-current stroke-2 opacity-60"
      >
        <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

const chevron = (
  <svg aria-hidden viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-2 opacity-60">
    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// The type filter: a button that opens a panel of type pills. The panel is a native
// popover, which brings Escape, click-outside-to-close and focus handling.
// Each pill both picks the type and closes the panel (popoverTargetAction="hide").
function TypeMenu({ selected, onPick }: { selected?: string; onPick: (type: string) => void }) {
  const id = useId();
  const option = (type: string) => (
    <button
      key={type}
      type="button"
      popoverTarget={id}
      popoverTargetAction="hide"
      aria-pressed={type === (selected ?? "")}
      onClick={() => onPick(type)}
      className={`cursor-pointer rounded-full transition hover:scale-105 aria-pressed:outline-2 aria-pressed:outline-offset-2 aria-pressed:outline-(--accent) ${focus}`}
    >
      {type ? <TypingPill type={type} /> : <span className="px-3 text-sm font-semibold">All types</span>}
    </button>
  );

  return (
    <>
      <button type="button" popoverTarget={id} className={`flex cursor-pointer items-center gap-2 ${pill}`}>
        {selected ? <TypingPill type={selected} /> : "All types"}
        {chevron}
      </button>
      {/* .type-menu (globals.css) places the panel under the button */}
      <div
        id={id}
        popover="auto"
        className="type-menu rounded-2xl border border-foreground/15 bg-background-accent p-4 text-foreground shadow-lg"
      >
        {/* 18 types = 3 rows of 6; narrow screens get 6 rows of 3 */}
        <div className="grid grid-cols-3 justify-items-start gap-3 sm:grid-cols-6">
          <div className="col-span-full">{option("")}</div>
          {typings.map(option)}
        </div>
      </div>
    </>
  );
}

export default function PokedexList() {
  const params = useSearchParams();
  // typed text is kept here so the input never waits on the address updating
  const [query, setQuery] = useState(params.get("q") ?? "");

  // anything that isn't a real generation, type or sort order falls back to the default
  const gen = generations.find((g) => g.gen === Number(params.get("gen")))?.gen;
  const type = typings.find((t) => t === params.get("type"));
  // The three rarity toggles are on unless the address switches one off (?legendary=0).
  // Switching all three off would show nothing, so that counts as all on again.
  const off = (rarity: string) => params.get(rarity) === "0";
  const allOff = off("regular") && off("legendary") && off("mythical");
  const regular = allOff || !off("regular"); // neither legendary nor mythical
  const legendary = allOff || !off("legendary");
  const mythical = allOff || !off("mythical");
  const sort = ["name", "power"].find((s) => s === params.get("sort"));
  const q = fold(query.trim());

  const list = (gen ? pokemonInGens([gen]) : allPokemon)
    .filter(
      (p) =>
        fold(p.displayName).includes(q) &&
        (!type || p.types.includes(type)) &&
        ((legendary && p.isLegendary) ||
          (mythical && p.isMythical) ||
          (regular && !p.isLegendary && !p.isMythical)),
    )
    .sort((a, b) => {
      if (sort === "name") return a.displayName.localeCompare(b.displayName);
      if (sort === "power") return b.statTotal - a.statTotal || a.id - b.id; // strongest first
      return a.id - b.id;
    });
  const pages = Math.max(Math.ceil(list.length / PAGE_SIZE), 1);
  const page = Math.min(Math.max(Math.floor(Number(params.get("page"))) || 1, 1), pages);
  const shown = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // The search, filters, sort and page live in the address (/Pokedex?q=char&type=fire&sort=power),
  // so the back button and shared links land on the same cards.
  // link({ type: "fire" }) = the current address with that one thing changed, back on page 1.
  const link = (change: {
    q?: string;
    gen?: number;
    type?: string;
    legendary?: boolean;
    mythical?: boolean;
    regular?: boolean;
    sort?: string;
    page?: number;
  }) => {
    const state = { q: query.trim(), gen, type, legendary, mythical, regular, sort, page: 1, ...change };
    const search = new URLSearchParams();
    if (state.q) search.set("q", state.q);
    if (state.gen) search.set("gen", String(state.gen));
    if (state.type) search.set("type", state.type);
    // all three off means all on (see above), so that leaves nothing to write
    if (state.regular || state.legendary || state.mythical) {
      if (!state.regular) search.set("regular", "0");
      if (!state.legendary) search.set("legendary", "0");
      if (!state.mythical) search.set("mythical", "0");
    }
    if (state.sort) search.set("sort", state.sort);
    if (state.page > 1) search.set("page", String(state.page));
    return `/Pokedex?${search}`;
  };
  // replaceState changes the address without asking the server
  const show = (change: Parameters<typeof link>[0]) => window.history.replaceState(null, "", link(change));

  return (
    <>
      <input
        type="search"
        aria-label="Filter Pokémon by name"
        autoComplete="off"
        placeholder="Search Pokémon"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          show({ q: e.target.value.trim() });
        }}
        className={`h-14 w-full rounded-full border-2 border-foreground/20 bg-background-accent px-6 text-lg ${focus}`}
      />

      <nav aria-label="Generation" className="flex flex-wrap gap-2">
        <Link href={link({ gen: undefined })} aria-current={gen ? undefined : "true"} className={pill}>
          All
        </Link>
        {generations.map((g) => (
          <Link
            key={g.gen}
            href={link({ gen: g.gen })}
            aria-current={g.gen === gen ? "true" : undefined}
            className={pill}
          >
            Gen {g.gen}
          </Link>
        ))}
      </nav>

      <div className="flex flex-wrap gap-2">
        <TypeMenu selected={type} onPick={(type) => show({ type })} />
        <Dropdown aria-label="Sort by" value={sort ?? ""} onChange={(e) => show({ sort: e.target.value })}>
          <option value="">Sort: Number</option>
          <option value="name">Sort: A–Z</option>
          <option value="power">Sort: Power</option>
        </Dropdown>
        <button
          type="button"
          aria-pressed={regular}
          onClick={() => show({ regular: !regular })}
          className={`cursor-pointer ${pill}`}
        >
          Regular
        </button>
        <button
          type="button"
          aria-pressed={legendary}
          onClick={() => show({ legendary: !legendary })}
          className={`cursor-pointer ${pill}`}
        >
          Legendary
        </button>
        <button
          type="button"
          aria-pressed={mythical}
          onClick={() => show({ mythical: !mythical })}
          className={`cursor-pointer ${pill}`}
        >
          Mythical
        </button>
      </div>

      {shown.length === 0 && <p className="opacity-70">No Pokémon match.</p>}
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {shown.map((p) => (
          <li key={p.id}>
            <Link
              href={`/Pokedex/${p.id}`}
              className={`grid justify-items-center gap-1 rounded-2xl bg-background-accent p-4 text-center transition hover:-translate-y-0.5 ${focus}`}
            >
              {/* plain <img>: next/image would spend Vercel's image-optimisation quota */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={artworkUrl(p.id)} alt="" width={140} height={140} loading="lazy" />
              <span className="font-bold">{p.displayName}</span>
              <span className="font-mono text-sm opacity-60">{String(p.id).padStart(4, "0")}</span>
            </Link>
          </li>
        ))}
      </ul>

      {/* floats over the cards at the bottom of the screen; clicks between the buttons fall through to the cards */}
      <nav aria-label="Pages" className="pointer-events-none sticky bottom-3 grid grid-cols-[1fr_auto_1fr] items-center *:first:justify-self-start *:last:justify-self-end">
        {page > 1 ? (
          <Link href={link({ page: page - 1 })} className={float}>
            Previous
          </Link>
        ) : (
          // a link with nowhere to go: shown greyed out so the bar looks the same on every page
          <span role="link" aria-disabled className={`${float} text-foreground/40`}>
            Previous
          </span>
        )}
        <span className={float}>
          Page {page} of {pages}
        </span>
        {page < pages ? (
          <Link href={link({ page: page + 1 })} className={float}>
            Next
          </Link>
        ) : (
          <span role="link" aria-disabled className={`${float} text-foreground/40`}>
            Next
          </span>
        )}
      </nav>
    </>
  );
}
