import type { MetadataRoute } from "next";
import { allPokemon } from "./lib/pokemon";

const site = "https://pokedb.r5m4.dev";

// Every page a search engine should know about: the fixed ones, then one per Pokémon.
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/Pokedex", "/Games", "/Games/whos-that", "/Games/fill-the-list"];
  return [
    ...pages.map((path) => ({ url: site + path })),
    ...allPokemon.map((p) => ({ url: `${site}/Pokedex/${p.id}` })),
  ];
}
