// Regenerates app/data/pokemon.json. Run: node scripts/fetch-pokemon.mjs
import { mkdir, writeFile } from "node:fs/promises";

const get = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} responded ${res.status}`);
  return res;
};

// PokeAPI's own source tables: one static file each instead of one API call per Pokémon.
// shortcut: naive comma split, breaks if an English row ever contains a quoted comma (the check below catches it); switch to a CSV parser then
const csv = async (table) =>
  (await (await get(`https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/${table}.csv`)).text())
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => line.trim().split(","));

const [{ results }, speciesNames, pokemonTypes, typeRows] = await Promise.all([
  // pokemon-species = base Pokémon only (no megas/regional forms)
  get("https://pokeapi.co/api/v2/pokemon-species?limit=100000").then((res) => res.json()),
  csv("pokemon_species_names"), // species id, language id, name, genus
  csv("pokemon_types"), // pokemon id, type id, slot
  csv("types"), // type id, name
]);

const ENGLISH = "9";
const english = new Map(speciesNames.filter((row) => row[1] === ENGLISH).map((row) => [row[0], row]));
const typeName = new Map(typeRows.map(([id, name]) => [id, name]));
const types = new Map();
for (const [id, typeId] of pokemonTypes.sort((a, b) => a[2] - b[2]))
  types.set(id, [...(types.get(id) ?? []), typeName.get(typeId)]);

const pokemon = results
  .map(({ name, url }) => {
    const id = url.split("/").at(-2);
    const [, , displayName, genus] = english.get(id) ?? [];
    return { id: Number(id), name, displayName, genus, types: types.get(id) };
  })
  .sort((a, b) => a.id - b.id);

// don't overwrite a good file with a broken response
const valid = (p) => Number.isInteger(p.id) && p.displayName && p.genus?.endsWith("Pokémon") && p.types?.length >= 1 && p.types.every(Boolean);
const broken = pokemon.filter((p) => !valid(p));
if (pokemon.length < 1000 || pokemon[0].name !== "bulbasaur" || broken.length)
  throw new Error(`Unexpected data, file not written: ${JSON.stringify(broken.slice(0, 5))}`);

await mkdir("app/data", { recursive: true });
await writeFile("app/data/pokemon.json", JSON.stringify(pokemon, null, 2) + "\n");
console.log(`Wrote ${pokemon.length} Pokémon`);
