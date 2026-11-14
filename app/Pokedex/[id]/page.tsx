import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getPokemonDetails } from "../../api/pokemon";
import { pokemon, type Pokemon } from "../../lib/pokemon";

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
  return <p className="animate-pulse opacity-60">Loading…</p>;
}

// Name, number and types come from the baked list, so they show at once;
// the rest streams in when PokeAPI answers (instantly once cached).
async function Entry({ params }: Props) {
  const { id } = await params;
  const entry = pokemon.find((p) => p.id === Number(id));
  if (!entry) notFound();

  return (
    <article className="grid gap-8">
      <header className="flex flex-wrap items-center gap-3 border-b border-foreground/15 pb-4">
        <span className="rounded-md bg-background-accent px-2 py-1 font-mono font-bold">
          #{entry.id}
        </span>
        <h1>{entry.displayName}</h1>
        <ul className="flex gap-2">
          {entry.types.map((type) => (
            <li
              key={type}
              className="rounded-md border border-foreground/15 bg-background-accent px-2 py-0.5 text-sm font-bold uppercase"
            >
              {type}
            </li>
          ))}
        </ul>
      </header>
      <Suspense fallback={<Loading />}>
        <Details entry={entry} />
      </Suspense>
    </article>
  );
}

async function Details({ entry }: { entry: Pokemon }) {
  const details = await getPokemonDetails(entry.id);
  const total = details.stats.reduce((sum, stat) => sum + stat.value, 0);
  const info = [
    ["Color", label(details.color)],
    ["Species", entry.genus],
    ["Weight", `${details.weightKg} kg`],
    ["Height", `${details.heightM} m`],
    ["Habitat", details.habitat ? label(details.habitat) : "Unknown"],
    ["Base friendship", details.baseFriendship],
  ];

  return (
    <>
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="relative isolate flex flex-wrap items-center justify-center gap-4 sm:flex-col">
          {/* accent backdrop: a rectangle whose edges fade out. It is its own layer so the
              mask doesn't fade the sprites too. from-N% = how much stays solid; lower = wider feather */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-accent/80 mask-x-from-97% mask-y-from-97%"
          />
          <Sprite src={details.sprite} alt={entry.displayName} />
          <Sprite src={details.shinySprite} alt={`Shiny ${entry.displayName}`} />
        </div>

        <div className="grid content-start gap-6">
          <section className="grid gap-3">
            <h2 className="text-accent">Species Info</h2>
            <dl>
              {info.map(([term, value]) => (
                <div
                  key={term}
                  className="grid grid-cols-2 gap-4 border-b border-foreground/15 px-2 py-1.5 odd:bg-background-accent"
                >
                  <dt>{term}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          {details.description && (
            <section className="grid gap-3">
              <h2 className="text-accent">Description</h2>
              <p>{details.description}</p>
            </section>
          )}
        </div>
      </div>

      <section className="grid gap-4 border-t border-foreground/15 pt-6">
        <h2 className="text-accent">Base Stats</h2>
        <ul className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
          {details.stats.map((stat) => (
            <li key={stat.name}>
              <StatBar name={label(stat.name)} value={stat.value} max={MAX_STAT} />
            </li>
          ))}
        </ul>
        <div className="border-t border-foreground/15 pt-4 font-bold">
          <StatBar name="Total" value={total} max={MAX_TOTAL} />
        </div>
      </section>
    </>
  );
}

// A pixel sprite on a soft glow, scaled up without blurring.
function Sprite({ src, alt }: { src: string | null; alt: string }) {
  if (!src) return null;
  return (
    // closest-side: the glow is fully faded out where it meets the box edge, so the box never shows
    <div className="bg-radial-[closest-side] from-white/25 to-transparent p-4">
      {/* plain <img>: next/image would spend Vercel's image-optimisation quota on 1,025 tiny sprites */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={160}
        height={160}
        className="[image-rendering:pixelated]"
      />
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
