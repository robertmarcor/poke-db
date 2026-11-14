import Link from "next/link";
import Card3D from "./components/Card3D";
import PokemonSearch from "./components/PokemonSearch";
import { focus } from "./components/Shell/shared";
import GameCards from "./Games/GameCards";
import { allPokemon } from "./lib/pokemon";

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
      {/* the way into the Pokédex: a 3D collectible card that keeps flipping to another Pokémon */}
      <Link href="/Pokedex" aria-label="Open the Pokédex" className={`rounded-2xl ${focus}`}>
        <Card3D />
      </Link>
      <section className="grid w-full gap-4">
        <h2>Ready to play?</h2>
        <GameCards />
      </section>
    </div>
  );
}
