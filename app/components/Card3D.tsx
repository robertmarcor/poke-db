"use client";

// The Pokédex card as a real 3D object (three.js): a thick, glossy card that floats,
// turns toward the pointer, and every few seconds flips over to show another Pokémon.
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { allPokemon, artworkUrl, type Pokemon } from "../lib/pokemon";
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
  c.textAlign = "left"; // the last drawing on this canvas left it on "right"

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

export default function Card3D() {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
    card.rotation.z = -0.1; // lies tilted, like the flat card
    scene.add(card);

    const showDraft = () => {
      canvas.getContext("2d")!.drawImage(draft, 0, 0);
      texture.needsUpdate = true;
    };
    // paints a random Pokémon on the draft; a failed image load just skips this one
    const drawNext = () =>
      drawFace(draft, allPokemon[Math.floor(Math.random() * allPokemon.length)]).catch(() => {});

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
      card.rotation.z = ease(card.rotation.z, hover ? 0 : -0.1);
      card.scale.setScalar(ease(card.scale.x, hover ? 1.08 : 1));
      card.position.y = Math.sin(time / 900) * 0.08;
      renderer.render(scene, camera);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    renderer.setAnimationLoop(frame);
    const timer = setInterval(() => drawNext().then(() => (flipAt = performance.now())), 5000);
    drawNext().then(showDraft);

    return () => {
      clearInterval(timer);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      renderer.setAnimationLoop(null);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={box} aria-hidden className="h-104 w-80 max-w-full" />;
}
