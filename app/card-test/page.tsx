// TEST page for the 3D card: /card-test. Delete this folder and app/components/Card3D.tsx to revert.
import Link from "next/link";
import Card3D from "../components/Card3D";
import { focus } from "../components/Shell/shared";
import { allPokemon } from "../lib/pokemon";

const preview = allPokemon.find((p) => p.id === 6)!;

export default function CardTest() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Link href="/Pokedex" aria-label="Open the Pokédex" className={`rounded-2xl ${focus}`}>
        <Card3D pokemon={preview} />
      </Link>
    </div>
  );
}
