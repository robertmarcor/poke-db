import GameCards from "./GameCards";

export const metadata = {
  title: "Pokémon games",
  description: "Free Pokémon quiz games: guess the Pokémon from its silhouette, or name as many as you can.",
};

export default function Games() {
  return (
    <div className="grid gap-4">
      <h1>Games</h1>
      <GameCards />
    </div>
  );
}
