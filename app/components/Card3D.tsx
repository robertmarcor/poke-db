"use client";

// A collectible card as a real 3D object (three.js): thick and glossy, it floats and turns
// toward the pointer while hovered. Some decks flip over every few seconds to show a new face.
// Clicking a card opens what it shows.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { allPokemon, artworkUrl, generations, pokemonInGens, spriteUrl } from "../lib/pokemon";
import { typingColors } from "../lib/typings";
import { focus } from "./Shell/shared";

// card size in scene units, and the pixel size of the picture painted on its face
const W = 2.4;
const H = 4;
const PX = 200; // pixels per scene unit

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // the artwork is on GitHub; without this WebGL refuses it
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const random = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

// One side of a card: the artwork behind everything, its texts, and a function that paints
// its picture. A Pokémon card's picture goes in a frame, the square at (30, 100), 420 pixels
// wide. A game card has no frame: its picture is painted straight onto the artwork.
type Face = {
  art: HTMLImageElement;
  title: string;
  corner?: string; // small text right of the title
  pills: [label: string, colour: string][];
  note: string;
  foot: [left: string, right: string];
  // step counts up twice a second while the face shows, for pictures that move
  picture: (c: CanvasRenderingContext2D, step: number) => void;
  // game cards have gray artwork that takes the theme colour, and pictures that move,
  // so they are painted again every step
  game?: boolean;
  // where a click goes while this face shows; left out when the deck's own link is right
  href?: string;
  label?: string;
};

// the artwork that fills a card: public/assets/card-art/<name>.webp
const cardArt = (name: string) => loadImage(`/assets/card-art/${name}.webp`);

// fills the frame with the middle of an image, like bg-cover
function cover(c: CanvasRenderingContext2D, img: HTMLImageElement) {
  const side = Math.min(img.width, img.height);
  c.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 30, 100, 420, 420);
}

// The cards there are. next() loads what the next face needs and describes it;
// flipEvery is how often the card flips to a new face, in milliseconds (0 = never).
const decks = {
  // a random Pokémon, as on its Pokédex page
  pokedex: {
    href: "/Pokedex",
    label: "Open the Pokédex",
    flipEvery: 5000,
    async next(): Promise<Face> {
      const pokemon = random(allPokemon);
      const type = pokemon.types[0];
      const habitat = await loadImage(`/assets/habitats/${type}-hd.webp`);
      const [art, artwork] = await Promise.all([
        cardArt(type).catch(() => habitat), // a type without card art yet uses its habitat there too
        loadImage(artworkUrl(pokemon.id)),
      ]);
      return {
        art,
        title: pokemon.displayName,
        corner: `#${pokemon.id}`,
        pills: pokemon.types.map((type) => [type, typingColors[type]]),
        note: pokemon.genus,
        foot: ["Power", String(pokemon.statTotal)],
        href: `/Pokedex/${pokemon.id}`,
        label: `Open ${pokemon.displayName} in the Pokédex`,
        picture(c) {
          cover(c, habitat);
          c.shadowColor = "rgb(0 0 0 / 0.6)";
          c.shadowBlur = 24;
          c.shadowOffsetY = 12;
          c.drawImage(artwork, 80, 150, 320, 320);
        },
      };
    },
  },
  // Ditto on the stage in the artwork: a silhouette for four seconds, then itself for two
  "whos-that": {
    href: "/Games/whos-that",
    label: "Play Who's That Pokémon?",
    flipEvery: 0,
    async next(): Promise<Face> {
      const [art, ditto] = await Promise.all([cardArt("whos-that"), loadImage(artworkUrl(132))]);
      return {
        art,
        game: true,
        title: "Who's That Pokémon?",
        pills: [],
        note: "Name it from its silhouette.",
        foot: ["Play", "→"],
        picture(c, step) {
          // shortcut: canvas filters are missing in older Safari, where Ditto always shows in colour
          const hidden = step % 12 < 8;
          if (hidden) c.filter = "brightness(0)";
          c.drawImage(ditto, 80, 240, 320, 320);
          if (hidden) {
            c.filter = "none";
            c.fillStyle = "#fff";
            c.font = `bold 150px ${getComputedStyle(document.body).fontFamily}`;
            c.textAlign = "center";
            c.fillText("?", 240, 465);
          }
        },
      };
    },
  },
  // nine silhouettes from one generation, one in each niche of the artwork, that fill in
  // one by one; another generation each flip
  "fill-the-list": {
    href: "/Games/fill-the-list",
    label: "Play Fill the List",
    flipEvery: 7000,
    async next(): Promise<Face> {
      const { gen } = random(generations);
      const inGen = pokemonInGens([gen]);
      const [art, ...sprites] = await Promise.all([
        cardArt("fill-the-list"),
        ...Array.from({ length: 9 }, () => loadImage(spriteUrl(random(inGen).id))),
      ]);
      return {
        art,
        game: true,
        title: "Fill the List",
        corner: `Gen ${gen}`,
        pills: [],
        note: "Name as many as you can.",
        foot: ["Play", "→"],
        picture(c, step) {
          c.imageSmoothingEnabled = false; // pixel art
          sprites.forEach((sprite, i) => {
            // shortcut: canvas filters are missing in older Safari, where every sprite shows in colour
            c.filter = i < step ? "none" : "brightness(0)";
            // the niches are 132 pixels apart sideways and 129 down; each sprite stands on its ledge
            c.drawImage(sprite, 54 + (i % 3) * 132, 150 + Math.floor(i / 3) * 129, 110, 110);
          });
        },
      };
    },
  },
};

// Paints a face onto a canvas. accent is the theme colour.
function paintFace(canvas: HTMLCanvasElement, face: Face, step: number, accent: string) {
  const font = getComputedStyle(document.body).fontFamily;
  const c = canvas.getContext("2d")!;
  const w = canvas.width;
  c.textAlign = "left"; // the last drawing on this canvas left it on "right"

  const h = canvas.height;

  // the artwork fills the card, cropped around its middle like bg-cover
  const zoom = Math.max(w / face.art.width, h / face.art.height);
  const artW = face.art.width * zoom;
  const artH = face.art.height * zoom;
  c.drawImage(face.art, (w - artW) / 2, (h - artH) / 2, artW, artH);

  if (face.game) {
    // the gray artwork multiplied with a lighter theme colour, as .game-screen does in globals.css
    c.globalCompositeOperation = "multiply";
    c.fillStyle = `color-mix(in srgb, ${accent} 75%, white)`;
    c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = "source-over";
    c.save();
    face.picture(c, step);
    c.restore();
  }

  // darkened towards the top and bottom edge, so the white text stays readable on any artwork;
  // behind a frame the middle is darkened too, to let the frame stand out
  const shade = c.createLinearGradient(0, 0, 0, h);
  shade.addColorStop(0, "rgb(0 0 0 / 0.45)");
  shade.addColorStop(0.2, face.game ? "rgb(0 0 0 / 0)" : "rgb(0 0 0 / 0.25)");
  shade.addColorStop(0.6, face.game ? "rgb(0 0 0 / 0)" : "rgb(0 0 0 / 0.25)");
  shade.addColorStop(0.8, "rgb(0 0 0 / 0.4)");
  shade.addColorStop(1, "rgb(0 0 0 / 0.55)");
  c.fillStyle = shade;
  c.fillRect(0, 0, w, h);

  if (!face.game) {
    // the frame, with a thin light edge to lift it off the artwork
    c.save();
    c.beginPath();
    c.roundRect(30, 100, 420, 420, 16);
    c.clip();
    face.picture(c, step);
    c.restore();
    c.strokeStyle = "rgb(255 255 255 / 0.3)";
    c.lineWidth = 3;
    c.stroke();
  }

  // title and the small text beside it
  c.fillStyle = "#fff";
  c.font = `bold 40px ${font}`;
  c.fillText(face.title, 36, 70, face.corner ? 300 : w - 72);
  c.font = "24px monospace";
  c.textAlign = "right";
  c.globalAlpha = 0.7;
  c.fillText(face.corner ?? "", w - 36, 68);
  c.globalAlpha = 1;
  c.textAlign = "left";

  c.font = `bold 22px ${font}`;
  let x = 36;
  for (const [text, colour] of face.pills) {
    const label = text.toUpperCase();
    const pill = c.measureText(label).width + 48;
    c.fillStyle = colour;
    c.beginPath();
    c.roundRect(x, 545, pill, 44, 22);
    c.fill();
    c.fillStyle = "#fff";
    c.fillText(label, x + 24, 575);
    x += pill + 14;
  }

  c.font = `24px ${font}`;
  c.globalAlpha = 0.85;
  c.fillText(face.note, 36, 645, w - 72);
  c.globalAlpha = 0.3;
  c.fillRect(36, 680, w - 72, 2);
  c.globalAlpha = 1;
  c.font = `bold 26px ${font}`;
  c.fillText(face.foot[0], 36, 735);
  c.textAlign = "right";
  c.fillText(face.foot[1], w - 36, 735);
}

type Props = {
  deck?: keyof typeof decks;
  // how far the card leans while it rests, in radians; positive leans left
  tilt?: number;
  // the size of the area the card floats in
  className?: string;
};

export default function Card3D({ deck = "pokedex", tilt = -0.1, className = "h-104 w-80" }: Props) {
  const box = useRef<HTMLDivElement>(null);
  // the face on the card right now, which decides where a click goes; null until the first one is painted
  const [shown, setShown] = useState<Face | null>(null);

  useEffect(() => {
    const { next, flipEvery } = decks[deck];
    const el = box.current!;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.append(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, el.clientWidth / el.clientHeight);
    camera.position.z = 7.5;
    scene.add(new THREE.AmbientLight(0xffffff, 2));
    const sun = new THREE.DirectionalLight(0xffffff, 2);
    sun.position.set(-2, 3, 4);
    scene.add(sun);

    // a rounded rectangle, centred on the origin
    const r = 0.18;
    const outline = new THREE.Shape()
      .moveTo(-W / 2 + r, -H / 2)
      .lineTo(W / 2 - r, -H / 2)
      .quadraticCurveTo(W / 2, -H / 2, W / 2, -H / 2 + r)
      .lineTo(W / 2, H / 2 - r)
      .quadraticCurveTo(W / 2, H / 2, W / 2 - r, H / 2)
      .lineTo(-W / 2 + r, H / 2)
      .quadraticCurveTo(-W / 2, H / 2, -W / 2, H / 2 - r)
      .lineTo(-W / 2, -H / 2 + r)
      .quadraticCurveTo(-W / 2, -H / 2, -W / 2 + r, -H / 2);

    // the body: the outline given thickness; its bevel sticks out past the face as the card's rim
    const body = new THREE.Mesh(
      new THREE.ExtrudeGeometry(outline, { depth: 0.06, bevelSize: 0.06, bevelThickness: 0.03, bevelSegments: 4 }),
      new THREE.MeshStandardMaterial({ color: 0x6b6b70, metalness: 0.7, roughness: 0.3 }),
    );
    body.geometry.center();

    // the face: the painted canvas, laid just in front of the body
    // each new face is painted on `draft` first and copied over while the card is edge-on
    const canvas = document.createElement("canvas");
    const draft = document.createElement("canvas");
    canvas.width = draft.width = W * PX;
    canvas.height = draft.height = H * PX;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); // stays sharp when tilted
    // a shape's texture coordinates are its own x/y, so stretch the picture over -W/2..W/2
    texture.repeat.set(1 / W, 1 / H);
    texture.offset.set(0.5, 0.5);
    const face = new THREE.Mesh(
      new THREE.ShapeGeometry(outline),
      new THREE.MeshPhysicalMaterial({ map: texture, roughness: 0.4, clearcoat: 1, clearcoatRoughness: 0.1 }),
    );
    face.position.z = 0.061;

    const card = new THREE.Group().add(body, face);
    card.rotation.z = tilt;
    scene.add(card);

    // the theme colour, which AppShell sets around the page
    const accent = () => getComputedStyle(el).getPropertyValue("--accent");
    let drafted: Face | null = null; // the face painted on the draft
    let step = 0; // half seconds the face has been showing
    const showDraft = () => {
      canvas.getContext("2d")!.drawImage(draft, 0, 0);
      texture.needsUpdate = true;
      step = 0;
      setShown(drafted);
    };
    // paints the deck's next face on the draft; a failed image load just skips this one
    const drawNext = () =>
      Promise.all([next(), document.fonts.ready])
        .then(([face]) => paintFace(draft, (drafted = face), 0, accent()))
        .catch(() => {});
    // game cards move: twice a second their face is painted again, one step further
    const stepper = setInterval(() => {
      if (!drafted?.game || flipAt) return;
      paintFace(canvas, drafted, ++step, accent());
      texture.needsUpdate = true;
    }, 500);

    // where the card should be turned to: toward the pointer while it is over the card, else straight
    let turnX = 0;
    let turnY = 0;
    let y = 0; // the turn toward the pointer so far, without the flip
    let hover = false;
    let flipAt = 0; // when the current flip started; 0 when not flipping
    const onMove = (e: PointerEvent) => {
      const area = el.getBoundingClientRect();
      turnY = ((e.clientX - area.left) / area.width - 0.5) * 1.4;
      turnX = ((e.clientY - area.top) / area.height - 0.5) * 1;
      sun.position.set(-turnY * 6, turnX * 6 + 2, 4); // the glare slides across the card
    };
    const onEnter = () => (hover = true);
    const onLeave = () => {
      hover = false;
      turnX = turnY = 0;
      sun.position.set(-2, 3, 4);
    };
    const ease = (from: number, to: number) => from + (to - from) * 0.08;

    const frame = (time: number) => {
      // a flip turns the card edge-on, swaps the face there, and comes back from the
      // other side, so the blank back never shows
      let flip = 0;
      if (flipAt) {
        const t = (time - flipAt) / 700;
        if (t >= 1) flipAt = 0;
        else if (t < 0.5) flip = t * Math.PI;
        else {
          showDraft();
          flip = (t - 1) * Math.PI;
        }
      }
      y = ease(y, turnY);
      card.rotation.x = ease(card.rotation.x, turnX);
      card.rotation.y = y + flip;
      // hovered: straightens and comes closer, like the flat card did
      card.rotation.z = ease(card.rotation.z, hover ? 0 : tilt);
      card.scale.setScalar(ease(card.scale.x, hover ? 1.08 : 1));
      card.position.y = Math.sin(time / 900) * 0.08;
      renderer.render(scene, camera);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    renderer.setAnimationLoop(frame);
    const timer = flipEvery
      ? setInterval(() => drawNext().then(() => (flipAt = performance.now())), flipEvery)
      : undefined;
    drawNext().then(showDraft);

    return () => {
      clearInterval(timer);
      clearInterval(stepper);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      renderer.setAnimationLoop(null);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [deck, tilt]);

  return (
    <Link
      href={shown?.href ?? decks[deck].href}
      aria-label={shown?.label ?? decks[deck].label}
      className={`block max-w-full rounded-2xl ${className} ${focus}`}
    >
      <div ref={box} aria-hidden className="size-full" />
    </Link>
  );
}
