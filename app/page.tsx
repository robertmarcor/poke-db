import PokemonSearch from "./components/PokemonSearch";
import GameCards from "./Games/GameCards";
import { pokemon } from "./lib/pokemon";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-10 py-6 text-center">
      <div className="grid gap-3">
        <h1>Welcome, Trainer!</h1>
        <p className="text-lg opacity-80">
          Look up any of the {pokemon.length.toLocaleString("en")} Pokémon, or put your knowledge to the test.
        </p>
      </div>
      <PokemonSearch />
      <section className="grid w-full gap-4">
        <h2>Ready to play?</h2>
        <GameCards />
      </section>
    </div>
  );
}
