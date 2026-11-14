import CardHand from "./components/CardHand";
import PokemonSearch from "./components/PokemonSearch";
import { allPokemon } from "./lib/pokemon";

// Tells search engines the site's name (schema.org "WebSite", read from the page as JSON-LD).
const siteInfo = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "R5PokèDB",
  url: "https://pokedb.r5m4.dev",
});

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-10 py-6 text-center">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: siteInfo }} />
      <div className="grid gap-3">
        <h1>Welcome, Trainer!</h1>
        <p className="text-lg opacity-80">
          Look up any of the {allPokemon.length.toLocaleString("en")} Pokémon, or put your knowledge to the test.
        </p>
      </div>
      <PokemonSearch />
      <CardHand />
    </div>
  );
}
