import { cacheLife } from "next/cache";

const API = "https://pokeapi.co/api/v2";

// The Pokédex details that aren't in the baked list (app/data/pokemon.json).
// Fetched from PokeAPI the first time a Pokémon is viewed, then cached: two
// requests per Pokémon, ever, however many people visit.
export async function getPokemonDetails(id: number) {
  "use cache";
  cacheLife("max");

  const [pokemonRes, speciesRes] = await Promise.all([
    fetch(`${API}/pokemon/${id}`),
    fetch(`${API}/pokemon-species/${id}`),
  ]);
  // throw, don't return null: an error is not cached, so the next visit retries
  if (!pokemonRes.ok || !speciesRes.ok)
    throw new Error(`PokeAPI responded ${pokemonRes.status}/${speciesRes.status} for Pokémon ${id}`);
  const [p, species] = await Promise.all([pokemonRes.json(), speciesRes.json()]);

  // the newest English Pokédex entry
  const description: string | undefined = species.flavor_text_entries
    .filter((entry) => entry.language.name === "en")
    .at(-1)?.flavor_text;

  // Only what the page shows: the raw responses are huge (every move, every game).
  return {
    sprite: p.sprites.front_default as string | null,
    shinySprite: p.sprites.front_shiny as string | null,
    weightKg: p.weight / 10, // the API gives hectograms
    heightM: p.height / 10, // the API gives decimetres
    color: species.color.name as string,
    habitat: (species.habitat?.name ?? null) as string | null, // newer Pokémon have none
    baseFriendship: species.base_happiness as number,
    // old entries contain soft hyphens, line breaks and form feeds
    description: description?.replace(/\u{ad}\s*/gu, "").replace(/\s+/g, " ") ?? null,
    stats: p.stats.map((s) => ({ name: s.stat.name as string, value: s.base_stat as number })) as {
      name: string;
      value: number;
    }[],
  };
}
