import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPokemonAbilities,
  getPokemonDescription,
  getPokemonEvolutions,
  getPokemonSize,
  getPokemonSpeciesInfo,
  getPokemonStats,
  type Evolution,
} from "../../api/pokemon";
import Pokeball from "../../components/Pokeball";
import TypingPills, { TypingCircle, TypingPill } from "../../components/TypingPills";
import { allPokemon, artworkUrl, itemUrl, rareCandyUrl, type Pokemon } from "../../lib/pokemon";
import { strongAgainst, weakTo } from "../../lib/typings";
import Cry from "./Cry";
import Habitat from "./Habitat";
import Segments from "./Segments";

type Props = { params: Promise<{ id: string }> };

const MAX_STAT = 255; // highest base stat any Pokémon has
const MAX_TOTAL = 720; // highest base stat total (Arceus)

// "special-attack" -> "Special Attack"
const label = (apiName: string) =>
  apiName.replaceAll("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());

// params is only known per request, so it is awaited inside <Suspense>. Next
// saves each finished page after its first visit (see "ISR with Cache Components").
export default function PokemonPage({ params }: Props) {
  return (
    <Suspense fallback={<Loading />}>
      <Entry params={params} />
    </Suspense>
  );
}

function Loading() {
  return <Pokeball className="mx-auto my-8 size-12" />;
}

// Name, number and types come from the baked list, so they show at once;
// the rest streams in when PokeAPI answers (instantly once cached).
async function Entry({ params }: Props) {
  const { id } = await params;
  const entry = allPokemon.find((p) => p.id === Number(id));
  if (!entry) notFound();

  return (
    <Habitat
      id={entry.id}
      name={entry.displayName}
      type={entry.types[0] ?? "normal"}
    >
      <header className="grid justify-items-center gap-2 text-center">
        <nav
          aria-label="Previous and next Pokémon"
          className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2"
        >
          <Neighbour id={entry.id - 1} className="justify-self-start" />
          <span className="rounded-md bg-background-accent px-2 py-1 font-mono font-bold">
            #{entry.id}
          </span>
          <Neighbour id={entry.id + 1} className="justify-self-end" />
        </nav>
        <h1>{entry.displayName}</h1>
        <div className="flex items-center gap-2">
          <TypingPills types={entry.types} />
          <Cry id={entry.id} />
        </div>
      </header>
      <Suspense fallback={<Loading />}>
        <Details entry={entry} />
      </Suspense>
    </Habitat>
  );
}

// Link to the Pokémon with this number; nothing before the first or after the last one.
function Neighbour({ id, className }: { id: number; className: string }) {
  const pokemon = allPokemon.find((p) => p.id === id);
  if (!pokemon) return <span />; // keeps the number in the middle column
  const next = className.includes("end");
  return (
    <Link
      href={`/Pokedex/${id}`}
      className={`max-w-full truncate rounded-full bg-background-accent/60 px-3 py-1 text-sm font-semibold backdrop-blur-md hover:bg-foreground/10 ${className}`}
    >
      {!next && "‹ "}
      {pokemon.displayName}
      {next && " ›"}
    </Link>
  );
}

async function Details({ entry }: { entry: Pokemon }) {
  // one after another on purpose: the first call of each kind fetches, the rest reuse its answer
  const size = await getPokemonSize(entry.id);
  const stats = await getPokemonStats(entry.id);
  const species = await getPokemonSpeciesInfo(entry.id);
  const description = await getPokemonDescription(entry.id);
  const abilities = await getPokemonAbilities(entry.id);
  const evolutions = await getPokemonEvolutions(entry.id);

  const total = stats.reduce((sum, stat) => sum + stat.value, 0);
  const info = [
    ["Color", label(species.color)],
    ["Species", entry.genus],
    ["Weight", `${size.weightKg} kg`],
    ["Height", `${size.heightM} m`],
    ["Habitat", species.habitat ? label(species.habitat) : "Unknown"],
    ["Base friendship", species.baseFriendship],
  ];

  return (
    <Segments
      segments={[
        {
          name: "About",
          content: (
            <>
              {description && <p>{description}</p>}
              <dl>
                {info.map(([term, value]) => (
                  <div
                    key={term}
                    className="flex justify-between gap-4 border-b border-foreground/15 py-1.5 last:border-b-0"
                  >
                    <dt className="opacity-70">{term}</dt>
                    <dd className="font-bold">{value}</dd>
                  </div>
                ))}
              </dl>
            </>
          ),
        },
        {
          name: "Stats",
          content: (
            <>
              <ul className="grid gap-4">
                {stats.map((stat) => (
                  <li key={stat.name}>
                    <StatBar
                      name={label(stat.name)}
                      value={stat.value}
                      max={MAX_STAT}
                    />
                  </li>
                ))}
              </ul>
              <div className="border-t border-foreground/15 pt-4 font-bold">
                <StatBar name="Total" value={total} max={MAX_TOTAL} />
              </div>
            </>
          ),
        },
        {
          name: "Battle",
          content: (
            <>
              <h2 className="text-accent">Abilities</h2>
              <dl className="grid gap-3">
                {abilities.map((ability) => (
                  <div key={ability.name}>
                    <dt className="font-bold">
                      {label(ability.name)}
                      {ability.hidden && <span className="font-normal opacity-70"> (hidden)</span>}
                    </dt>
                    {ability.text && <dd className="text-sm opacity-80">{ability.text}</dd>}
                  </div>
                ))}
              </dl>

              <h2 className="text-accent">Type Effectiveness</h2>
              {/* one block per type, as two branches: what beats it, and what it beats */}
              {entry.types.map((type) => (
                <div key={type} className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-foreground/15 pt-4">
                  <div className="col-span-2 justify-self-center">
                    <TypingPill type={type} />
                  </div>
                  <Matchups title="Weak to" types={weakTo(type)} />
                  <Matchups title="Strong against" types={strongAgainst[type]} />
                </div>
              ))}
            </>
          ),
        },
        {
          name: "Evolution",
          content: evolutions.length ? (
            <ul className="grid gap-4">
              {evolutions.map((step) => (
                <EvolutionStep key={step.to} step={step} />
              ))}
            </ul>
          ) : (
            <p>{entry.displayName} does not evolve.</p>
          ),
        },
      ]}
    />
  );
}

// One evolution as a row: Charmander -> rare candy, "Lvl 16" -> Charmeleon
function EvolutionStep({ step }: { step: Evolution }) {
  // "Lvl 16", "Fire Stone", "Trade holding Kings Rock", "Friendship (day)"
  let how = label(step.trigger);
  if (step.trigger === "level-up") how = step.level ? `Lvl ${step.level}` : step.friendship ? "Friendship" : "Level up";
  if (step.trigger === "use-item" && step.item) how = label(step.item);
  if (step.trigger === "trade" && step.item) how = `Trade holding ${label(step.item)}`;
  if (step.time) how += ` (${step.time})`;

  // the item when there is one, a rare candy for levelling up, nothing for the rest (trades and so on)
  const icon = step.item ? itemUrl(step.item) : step.trigger === "level-up" ? rareCandyUrl : null;

  return (
    <li className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-foreground/15 pt-4 first:border-t-0 first:pt-0">
      <Stage id={step.from} />
      <div className="grid justify-items-center gap-1 text-center text-sm font-semibold">
        {/* eslint-disable-next-line @next/next/no-img-element -- same reason as the Pokémon pictures */}
        {icon && <img src={icon} alt="" width={32} height={32} className="[image-rendering:pixelated]" />}
        {how}
        <span aria-hidden className="opacity-60">
          →
        </span>
      </div>
      <Stage id={step.to} />
    </li>
  );
}

// One Pokémon in an evolution row: its picture and name, linking to its page.
function Stage({ id }: { id: number }) {
  const pokemon = allPokemon.find((p) => p.id === id);
  if (!pokemon) return <span />;
  return (
    <Link href={`/Pokedex/${id}`} className="grid justify-items-center gap-1 text-center font-bold hover:text-accent">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={artworkUrl(id)} alt="" width={80} height={80} loading="lazy" />
      {pokemon.displayName}
    </Link>
  );
}

// One branch under a type: a title and the types it is about.
function Matchups({ title, types }: { title: string; types: string[] }) {
  return (
    <div className="grid content-start justify-items-center gap-2 text-center">
      <h3 className="text-sm opacity-70">{title}</h3>
      {types.length ? (
        <ul className="flex flex-wrap justify-center gap-1.5">
          {types.map((type) => (
            <li key={type}>
              <TypingCircle type={type} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm opacity-70">Nothing</p>
      )}
    </div>
  );
}

function StatBar({
  name,
  value,
  max,
}: {
  name: string;
  value: number;
  max: number;
}) {
  return (
    <>
      <div className="flex justify-between">
        <span>{name}</span>
        <span className="font-bold">{value}</span>
      </div>
      <div aria-hidden className="mt-1 h-2 bg-background-accent">
        <div
          className="h-full bg-accent"
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
    </>
  );
}
