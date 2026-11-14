"use client";

// TEST: the Pokédex card as a real 3D object (three.js): a thick, glossy card that
// floats and turns toward the pointer. Only used by app/card-test; delete both to revert.
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { artworkUrl, type Pokemon } from "../lib/pokemon";
import { typingColors } from "../lib/typings";

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

// Paints the card's face (the same pieces as the card on the front page) onto a canvas.
async function drawFace(canvas: HTMLCanvasElement, pokemon: Pokemon) {
  const [habitat, artwork] = await Promise.all([
    loadImage(`/assets/habitats/${pokemon.types[0]}-hd.webp`),
    loadImage(artworkUrl(pokemon.id)),
    document.fonts.ready,
  ]);
  const font = getComputedStyle(document.body).fontFamily;
  const c = canvas.getContext("2d")!;
  const w = canvas.width;

  const paper = c.createLinearGradient(0, 0, 0, canvas.height);
  paper.addColorStop(0, "#161618");
  paper.addColorStop(1, "#27272a");
  c.fillStyle = paper;
  c.fillRect(0, 0, w, canvas.height);

  // name and number
  c.fillStyle = "#fff";
  c.font = `bold 40px ${font}`;
  c.fillText(pokemon.displayName, 36, 70, 300);
  c.font = "24px monospace";
  c.textAlign = "right";
  c.globalAlpha = 0.7;
  c.fillText(`#${pokemon.id}`, w - 36, 68);
  c.globalAlpha = 1;
  c.textAlign = "left";

  // the picture: habitat behind, Pokémon in front
  c.save();
  c.beginPath();
  c.roundRect(30, 100, 420, 420, 16);
  c.clip();
  const side = Math.min(habitat.width, habitat.height); // centre square, like bg-cover
  c.drawImage(habitat, (habitat.width - side) / 2, (habitat.height - side) / 2, side, side, 30, 100, 420, 420);
  c.shadowColor = "rgb(0 0 0 / 0.6)";
  c.shadowBlur = 24;
  c.shadowOffsetY = 12;
  c.drawImage(artwork, 80, 150, 320, 320);
  c.restore();

  // type pills
  c.font = `bold 22px ${font}`;
  let x = 36;
  for (const type of pokemon.types) {
    const label = type.toUpperCase();
    const pill = c.measureText(label).width + 48;
    c.fillStyle = typingColors[type];
    c.beginPath();
    c.roundRect(x, 545, pill, 44, 22);
    c.fill();
    c.fillStyle = "#fff";
    c.fillText(label, x + 24, 575);
    x += pill + 14;
  }

  c.font = `24px ${font}`;
  c.globalAlpha = 0.7;
  c.fillText(pokemon.genus, 36, 645);
  c.globalAlpha = 0.15;
  c.fillRect(36, 680, w - 72, 2);
  c.globalAlpha = 1;
  c.font = `bold 26px ${font}`;
  c.fillText("Power", 36, 735);
  c.textAlign = "right";
  c.fillText(String(pokemon.statTotal), w - 36, 735);
}

export default function Card3D({ pokemon }: { pokemon: Pokemon }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current!;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.append(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, el.clientWidth / el.clientHeight);
    camera.position.z = 9;
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
    const canvas = document.createElement("canvas");
    canvas.width = W * PX;
    canvas.height = H * PX;
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
    card.rotation.z = -0.1; // lies tilted, like the flat card
    scene.add(card);

    // where the card should be turned to: toward the pointer
    let turnX = 0;
    let turnY = 0;
    const onMove = (e: PointerEvent) => {
      turnY = (e.clientX / innerWidth - 0.5) * 1.2;
      turnX = (e.clientY / innerHeight - 0.5) * 0.8;
    };
    const frame = (time: number) => {
      card.rotation.x += (turnX - card.rotation.x) * 0.08;
      card.rotation.y += (turnY - card.rotation.y) * 0.08;
      card.position.y = Math.sin(time / 900) * 0.08;
      renderer.render(scene, camera);
    };

    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!still) {
      addEventListener("pointermove", onMove);
      renderer.setAnimationLoop(frame);
    }
    drawFace(canvas, pokemon).then(() => {
      texture.needsUpdate = true;
      if (still) renderer.render(scene, camera);
    });

    return () => {
      removeEventListener("pointermove", onMove);
      renderer.setAnimationLoop(null);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [pokemon]);

  return <div ref={box} aria-hidden className="h-96 w-72" />;
}
