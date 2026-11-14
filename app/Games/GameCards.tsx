/* eslint-disable @next/next/no-img-element -- static files on GitHub, nothing for next/image to optimise */
import Link from "next/link";
import { focus } from "../components/Shell/shared";
import { artworkUrl, generations, spriteUrl } from "../lib/pokemon";

// Each card plays a tiny version of its game: the pictures start as silhouettes (brightness-0)
// and show themselves while the card is hovered or focused.
const reveal = "brightness-0 transition duration-500 group-hover:brightness-100 group-focus-visible:brightness-100";

const games = [
  {
    href: "/Games/whos-that",
    name: "Who's That Pokémon?",
    about: "Name the Pokémon from its silhouette.",
    // shortcut: always Pikachu; pick at random if that gets dull
    preview: <img src={artworkUrl(25)} alt="" className={`h-24 group-hover:scale-110 ${reveal}`} />,
  },
  {
    href: "/Games/fill-the-list",
    name: "Fill the List",
    about: "Name as many Pokémon as you can.",
    // every generation's starter, filling in one after another
    preview: generations.map((g, i) => (
      <img
        key={g.gen}
        src={spriteUrl(g.starter)}
        alt=""
        className={`-mx-1 size-11 [image-rendering:pixelated] ${reveal}`}
        style={{ transitionDelay: `${i * 80}ms` }}
      />
    )),
  },
];

// The games as cards; used on the front page and the Games page.
export default function GameCards() {
  return (
    <ul className="grid gap-3 text-left sm:grid-cols-2">
      {games.map((game) => (
        <li key={game.href}>
          <Link
            href={game.href}
            className={`group flex h-full flex-col gap-1 rounded-xl border border-foreground/10 bg-background-accent p-4 transition hover:-translate-y-1 hover:border-accent ${focus}`}
          >
            <div className="mb-2 flex h-28 items-center overflow-hidden justify-center rounded-lg bg-linear-to-b from-accent/40 to-accent/10">
              {game.preview}
            </div>
            <h3>{game.name}</h3>
            <p className="opacity-80">{game.about}</p>
            <span className="mt-auto pt-3 font-semibold text-accent">
              Play <span aria-hidden>→</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
