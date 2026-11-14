import { cacheLife } from "next/cache";

const API = "https://pokeapi.co/api/v2";

// Fetches one PokeAPI address and returns its JSON.
// "use cache" makes Next remember the answer, so asking for the same thing
// again (from another getter, page or visitor) does not hit PokeAPI again.
// shortcut: remembers the whole response (a few hundred KB per Pokémon); return only the needed fields here if memory becomes a problem
async function get(path: string) {
  "use cache";
  cacheLife("max");
  const res = await fetch(`${API}/${path}`);
  // throw, don't return null: an error is not remembered, so the next visit tries again
  if (!res.ok) throw new Error(`PokeAPI responded ${res.status} for ${path}`);
  return res.json();
}

// The only four requests the app makes to PokeAPI.

// pokeapi.co/api/v2/pokemon/25 -> name, types, stats, sprites, height, weight
export const fetchPokemon = (id: number) => get(`pokemon/${id}`);

// pokeapi.co/api/v2/pokemon-species/25 -> colour, habitat, friendship, Pokédex descriptions
export const fetchSpecies = (id: number) => get(`pokemon-species/${id}`);

// pokeapi.co/api/v2/ability/blaze -> what the ability does
export const fetchAbility = (name: string) => get(`ability/${name}`);

// pokeapi.co/api/v2/evolution-chain/2 -> a whole family (Charmander, Charmeleon, Charizard) and how each evolves
export const fetchEvolutionChain = (id: number) => get(`evolution-chain/${id}`);
