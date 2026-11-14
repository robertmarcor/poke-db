import Link from "next/link";
import PokemonSearch from "./components/PokemonSearch";
import TypingPills from "./components/TypingPills";
import { focus } from "./components/Shell/shared";
import GameCards from "./Games/GameCards";
import { allPokemon, artworkUrl } from "./lib/pokemon";

// the Pokémon shown on the Pokédex card
// shortcut: always the same one; pick at random per visit if that gets dull
const preview = allPokemon.find((p) => p.id === 6)!;

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-10 py-6 text-center">
      <div className="grid gap-3">
        <h1>Welcome, Trainer!</h1>
        <p className="text-lg opacity-80">
          Look up any of the {allPokemon.length.toLocaleString("en")} Pokémon, or put your knowledge to the test.
        </p>
      </div>
      <PokemonSearch />
      {/* the way into the Pokédex: a collectible card made from a Pokémon page's own pieces,
          lying tilted on the page; it straightens when hovered */}
      <Link
        href="/Pokedex"
        aria-label="Open the Pokédex"
        className={`grid w-48 rotate-6 gap-2 rounded-2xl border-4 border-foreground/25 bg-linear-to-b from-background to-background-accent p-2.5 text-left shadow-[0_12px_32px_rgb(0_0_0/0.45)] transition-transform duration-300 hover:scale-105 hover:rotate-0 motion-reduce:transition-none ${focus}`}
      >
      <div className="flex items-baseline justify-between gap-2 px-1">
          <span className="truncate font-bold">{preview.displayName}</span>
          <span className="font-mono text-xs opacity-70">#{preview.id}</span>
        </div>
        <div
          className="grid aspect-square place-items-center rounded-lg border-2 border-foreground/25 bg-cover bg-center"
          style={{ backgroundImage: `url('/assets/habitats/${preview.types[0]}-hd.webp')` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- same reason as on the Pokémon page */}
          <img
            src={artworkUrl(preview.id)}
            alt=""
            width={140}
            height={140}
            className="drop-shadow-[0_6px_12px_rgb(0_0_0/0.6)]"
          />
        </div>
        <TypingPills types={preview.types} />
        <p className="px-1 text-xs opacity-70">{preview.genus}</p>
        <div className="flex justify-between border-t border-foreground/15 px-1 pt-2 text-xs font-bold">
          <span>Power</span>
          <span>{preview.statTotal}</span>
        </div>
      </Link>
      <section className="grid w-full gap-4">
        <h2>Ready to play?</h2>
        <GameCards />
      </section>
    </div>
  );
}
