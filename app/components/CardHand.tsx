"use client";

// The front page's hand of 3D cards: the two games, and between them a Pokédex card.
// On a wide screen they lie side by side like a fanned hand. On a phone they stand on a ring
// in 3D space (.card-ring in globals.css): swiping turns the ring, sending the front card to
// the back, and tapping a card at the back brings it to the front.
import { useRef, useState } from "react";
import Card3D from "./Card3D";

const STEP = 120; // degrees between two cards on the ring

// in the order they lie on a wide screen; `place` is the spot on the ring, 0 being the front
const cards = [
  { place: 2, deck: "whos-that", tilt: 0.12, className: "h-80 w-60 sm:-mx-6" },
  { place: 0, deck: "pokedex", tilt: -0.1, className: "h-84 w-64 sm:h-104 sm:w-80" },
  { place: 1, deck: "fill-the-list", tilt: -0.12, className: "h-80 w-60 sm:-mx-6" },
] as const;

// true while the cards are a ring; the same width as the media query in globals.css
const isRing = () => matchMedia("(width < 40rem)").matches;

export default function CardHand() {
  const [turn, setTurn] = useState(0); // how far the ring is turned, in degrees
  const [dragging, setDragging] = useState(false);
  // where the finger went down and how the ring was turned then; null when no finger is down
  const start = useRef<{ x: number; turn: number } | null>(null);
  const swiped = useRef(false); // the last touch was a swipe, not a tap

  const release = () => {
    start.current = null;
    setDragging(false);
    setTurn((t) => Math.round(t / STEP) * STEP); // snap so a card is at the front
  };

  return (
    <div
      className={`card-ring sm:flex sm:items-center sm:justify-center ${dragging ? "dragging" : ""}`}
      style={{ "--turn": `${turn}deg` } as React.CSSProperties}
      onPointerDown={(e) => {
        if (!isRing()) return;
        start.current = { x: e.clientX, turn };
        swiped.current = false;
      }}
      onPointerMove={(e) => {
        if (!start.current) return;
        const moved = e.clientX - start.current.x;
        if (Math.abs(moved) < 5) return; // a shaky tap is still a tap
        swiped.current = true;
        setDragging(true);
        setTurn(start.current.turn + moved * 0.6);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
      // before the card's own link sees the click: only a tap on the front card opens it
      onClickCapture={(e) => {
        if (!isRing()) return;
        const place = Number((e.target as HTMLElement).closest<HTMLElement>("[data-place]")?.dataset.place);
        if (Number.isNaN(place)) return;
        // how far the ring must turn to bring this card to the front, the short way round
        let away = -(place * STEP + turn) % 360;
        if (away > 180) away -= 360;
        if (away < -180) away += 360;
        if (!swiped.current && away === 0) return;
        e.preventDefault();
        e.stopPropagation();
        if (!swiped.current) setTurn(turn + away);
      }}
    >
      {cards.map((card) => (
        <div key={card.deck} data-place={card.place} style={{ "--i": card.place } as React.CSSProperties}>
          <Card3D deck={card.deck} tilt={card.tilt} className={card.className} />
        </div>
      ))}
    </div>
  );
}
