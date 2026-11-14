import Link from "next/link";
import { focus } from "../components/Shell/shared";

const games = [
  { href: "/Games/whos-that", name: "Who's That Pokémon?", about: "Name the Pokémon from its silhouette." },
  { href: "/Games/fill-the-list", name: "Fill the List", about: "Name as many Pokémon as you can." },
  { href: "/Games/wordle", name: "Pokémon Wordle", about: "Guess the Pokémon in a handful of tries." },
];

// The three games as cards; used on the front page and the Games page.
export default function GameCards() {
  return (
    <ul className="grid gap-3 text-left sm:grid-cols-3">
      {games.map((game) => (
        <li key={game.href}>
          <Link
            href={game.href}
            className={`flex h-full flex-col gap-1 rounded-xl border border-foreground/10 bg-background-accent p-4 transition-colors hover:border-accent ${focus}`}
          >
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
