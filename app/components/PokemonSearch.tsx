"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { allPokemon, fold } from "../lib/pokemon";
import { focus } from "./Shell/shared";

const MAX_RESULTS = 8;

// Folded once when the page loads, not on every key press.
const index = allPokemon.map((p) => ({ ...p, folded: fold(p.displayName) }));

// Every Pokémon whose name contains q: an exact match first ("mew" before
// "mewtwo"), then names that start with it, then the rest, each in Pokédex order.
// shortcut: matches the display name only ("mr mime" without the dot finds nothing), also match the slug if that bothers anyone
function search(q: string) {
  if (!q) return [];
  return index
    .flatMap((p) => {
      const at = p.folded.indexOf(q);
      return at < 0 ? [] : [{ ...p, at }];
    })
    .sort(
      (a, b) =>
        Number(b.folded === q) - Number(a.folded === q) ||
        Number(a.at > 0) - Number(b.at > 0) ||
        a.id - b.id,
    )
    .slice(0, MAX_RESULTS);
}

// Search box with a suggestion list (the ARIA "combobox" pattern): arrow keys
// move through the list, Enter or a click opens the Pokémon, Escape closes it.
export default function PokemonSearch() {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0); // which suggestion is highlighted
  const [open, setOpen] = useState(false);

  const q = fold(query.trim());
  const hits = search(q);
  const show = open && hits.length > 0;
  const go = (id: number) => router.push(`/Pokedex/${id}`);

  return (
    <div className="relative w-full text-left">
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 fill-none stroke-current stroke-2 opacity-60"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        role="combobox"
        aria-label="Search Pokémon"
        aria-autocomplete="list"
        aria-expanded={show}
        aria-controls={listId}
        aria-activedescendant={show ? `${listId}-${active}` : undefined}
        autoComplete="off"
        placeholder="Search Pokémon"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          if (!show) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((active + 1) % hits.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((active - 1 + hits.length) % hits.length);
          } else if (e.key === "Enter") {
            go(hits[active].id);
          }
        }}
        className={`h-14 w-full rounded-full border-2 border-foreground/20 bg-background-accent pr-6 pl-13 text-lg ${focus}`}
      />
      {show && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Pokémon"
          className="absolute top-full z-10 mt-2 w-full overflow-hidden rounded-2xl border border-foreground/15 bg-background-accent py-1 shadow-lg"
        >
          {hits.map((hit, i) => (
            <li
              key={hit.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              // keep focus in the input, or its blur would close the list before the click lands
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(hit.id)}
              className="flex cursor-pointer items-center justify-between gap-4 px-5 py-2.5 aria-selected:bg-foreground/10"
            >
              <span>
                {hit.displayName.slice(0, hit.at)}
                <mark className="bg-transparent font-bold text-accent">
                  {hit.displayName.slice(hit.at, hit.at + q.length)}
                </mark>
                {hit.displayName.slice(hit.at + q.length)}
              </span>
              <span className="font-mono text-sm opacity-60">#{String(hit.id).padStart(4, "0")}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
