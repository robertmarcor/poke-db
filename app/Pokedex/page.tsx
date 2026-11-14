import { Suspense } from "react";
import PokedexList from "./PokedexList";

export default function PokedexPage() {
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6">
      <h1>Pokédex</h1>
      {/* the list reads the address (?q, ?gen, ?page), which is only known per request */}
      <Suspense fallback={<p className="animate-pulse opacity-60">Loading…</p>}>
        <PokedexList />
      </Suspense>
    </div>
  );
}
