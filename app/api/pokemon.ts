import { fetchAbility, fetchEvolutionChain, fetchPokemon, fetchSpecies } from "./api";

// One small getter per thing you might want to know about a Pokémon. Each one
// asks api.ts for the Pokémon and picks out its part, so calling several of
// them for the same id still costs at most two requests to PokeAPI
// (plus one per ability, shared by every Pokémon that has it).
// Sprites, artwork and cries need no request at all: see lib/pokemon.ts.

// "pikachu"
export async function getPokemonName(id: number): Promise<string> {
  return (await fetchPokemon(id)).name;
}

// ["electric"]
export async function getPokemonTypes(id: number): Promise<string[]> {
  return (await fetchPokemon(id)).types.map((t) => t.type.name);
}

// [{ name: "hp", value: 35 }, { name: "attack", value: 55 }, ...]
export async function getPokemonStats(id: number): Promise<{ name: string; value: number }[]> {
  return (await fetchPokemon(id)).stats.map((s) => ({ name: s.stat.name, value: s.base_stat }));
}

// { heightM: 0.4, weightKg: 6 }  (the API gives decimetres and hectograms)
export async function getPokemonSize(id: number): Promise<{ heightM: number; weightKg: number }> {
  const { height, weight } = await fetchPokemon(id);
  return { heightM: height / 10, weightKg: weight / 10 };
}

// { color: "yellow", habitat: "forest", baseFriendship: 70 }  (newer Pokémon have no habitat)
export async function getPokemonSpeciesInfo(
  id: number,
): Promise<{ color: string; habitat: string | null; baseFriendship: number }> {
  const species = await fetchSpecies(id);
  return {
    color: species.color.name,
    habitat: species.habitat?.name ?? null,
    baseFriendship: species.base_happiness,
  };
}

// The newest English Pokédex entry, or null if there is none.
export async function getPokemonDescription(id: number): Promise<string | null> {
  const entries = (await fetchSpecies(id)).flavor_text_entries;
  const text: string | undefined = entries.filter((e) => e.language.name === "en").at(-1)?.flavor_text;
  // old entries contain soft hyphens, line breaks and form feeds
  return text?.replace(/\u{ad}\s*/gu, "").replace(/\s+/g, " ") ?? null;
}

// [{ name: "blaze", hidden: false, text: "Strengthens fire moves…" }, { name: "solar-power", hidden: true, text: … }]
export async function getPokemonAbilities(
  id: number,
): Promise<{ name: string; hidden: boolean; text: string | null }[]> {
  const { abilities } = await fetchPokemon(id);
  return Promise.all(
    abilities.map(async (a) => {
      const ability = await fetchAbility(a.ability.name);
      const english = (entries) => entries.filter((e) => e.language.name === "en").at(-1);
      // the newest abilities have no effect written yet, only the in-game text
      const text: string | undefined =
        english(ability.effect_entries)?.short_effect ?? english(ability.flavor_text_entries)?.flavor_text;
      return { name: a.ability.name, hidden: a.is_hidden, text: text?.replace(/\s+/g, " ") ?? null };
    }),
  );
}

// PokeAPI links end in the id: ".../pokemon-species/133/" -> 133
const idFromUrl = (url: string) => Number(url.split("/").at(-2));

export type Evolution = {
  from: number; // Pokémon ids
  to: number;
  trigger: string; // "level-up", "use-item", "trade", ...
  level: number | null;
  item: string | null; // the item used, or held while trading: "fire-stone"
  friendship: boolean;
  time: string | null; // "day" or "night"
};

// Every evolution in the Pokémon's family, first stage first:
// [{ from: 4, to: 5, trigger: "level-up", level: 16, ... }, { from: 5, to: 6, ... }]
// shortcut: only the first way listed for each evolution (some have other ways in later games); list them all if that matters
export async function getPokemonEvolutions(id: number): Promise<Evolution[]> {
  const family = (await fetchSpecies(id)).evolution_chain;
  if (!family) return [];
  const { chain } = await fetchEvolutionChain(idFromUrl(family.url));

  const evolutions: Evolution[] = [];
  const walk = (stage) => {
    for (const next of stage.evolves_to) {
      const how = next.evolution_details[0];
      evolutions.push({
        from: idFromUrl(stage.species.url),
        to: idFromUrl(next.species.url),
        trigger: how?.trigger.name ?? "special",
        level: how?.min_level ?? null,
        item: (how?.item ?? how?.held_item)?.name ?? null,
        friendship: how?.min_happiness != null,
        time: how?.time_of_day || null,
      });
      walk(next);
    }
  };
  walk(chain);
  return evolutions;
}
