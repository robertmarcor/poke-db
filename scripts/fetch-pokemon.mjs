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

const [{ results }, speciesNames, pokemonTypes, typeRows, statRows, speciesRows] = await Promise.all([
  // pokemon-species = base Pokémon only (no megas/regional forms)
  get("https://pokeapi.co/api/v2/pokemon-species?limit=100000").then((res) => res.json()),
  csv("pokemon_species_names"), // species id, language id, name, genus
  csv("pokemon_types"), // pokemon id, type id, slot
  csv("types"), // type id, name
  csv("pokemon_stats"), // pokemon id, stat id, base stat, effort
  csv("pokemon_species"), // species id, ..., is_legendary (column 16), is_mythical (column 17), ...
]);

const ENGLISH = "9";
const english = new Map(speciesNames.filter((row) => row[1] === ENGLISH).map((row) => [row[0], row]));
const typeName = new Map(typeRows.map(([id, name]) => [id, name]));
const types = new Map();
for (const [id, typeId] of pokemonTypes.sort((a, b) => a[2] - b[2]))
  types.set(id, [...(types.get(id) ?? []), typeName.get(typeId)]);
// the six base stats added up, e.g. Bulbasaur 318, Arceus 720
const statTotal = new Map();
for (const [id, , base] of statRows) statTotal.set(id, (statTotal.get(id) ?? 0) + Number(base));
const species = new Map(speciesRows.map((row) => [row[0], row]));

const pokemon = results
  .map(({ name, url }) => {
    const id = url.split("/").at(-2);
    const [, , displayName, genus] = english.get(id) ?? [];
    return { id: Number(id), name, displayName, genus, types: types.get(id), statTotal: statTotal.get(id),
      // PokeAPI keeps these apart: Mewtwo is legendary, Mew is mythical
      isLegendary: species.get(id)?.[16] === "1",
      isMythical: species.get(id)?.[17] === "1",
    };
  })
  .sort((a, b) => a.id - b.id);

// don't overwrite a good file with a broken response
const valid = (p) => Number.isInteger(p.id) && p.displayName && p.genus?.endsWith("Pokémon") && p.types?.length >= 1 && p.types.every(Boolean) && p.statTotal >= 175 && p.statTotal <= 720;
const broken = pokemon.filter((p) => !valid(p));
const flagged = (id) => pokemon.find((p) => p.id === id);
if (pokemon.length < 1000 || pokemon[0].name !== "bulbasaur" || broken.length || !flagged(150).isLegendary || !flagged(151).isMythical)
  throw new Error(`Unexpected data, file not written: ${JSON.stringify(broken.slice(0, 5))}`);

await mkdir("app/data", { recursive: true });
await writeFile("app/data/pokemon.json", JSON.stringify(pokemon, null, 2) + "\n");
console.log(`Wrote ${pokemon.length} Pokémon`);
