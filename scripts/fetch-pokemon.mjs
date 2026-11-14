// Regenerates app/data/pokemon.json. Run: node scripts/fetch-pokemon.mjs
import { mkdir, writeFile } from "node:fs/promises";

// pokemon-species = base Pokémon only (no megas/regional forms)
const res = await fetch("https://pokeapi.co/api/v2/pokemon-species?limit=100000");
if (!res.ok) throw new Error(`PokeAPI responded ${res.status}`);

const { results } = await res.json();
const pokemon = results
  .map(({ name, url }) => ({ id: Number(url.split("/").at(-2)), name }))
  .sort((a, b) => a.id - b.id);

// don't overwrite a good file with a broken response
if (pokemon.length < 1000 || pokemon[0].name !== "bulbasaur" || pokemon.some((p) => !Number.isInteger(p.id)))
  throw new Error("Unexpected PokeAPI response, file not written");

await mkdir("app/data", { recursive: true });
await writeFile("app/data/pokemon.json", JSON.stringify(pokemon, null, 2) + "\n");
console.log(`Wrote ${pokemon.length} Pokémon`);
