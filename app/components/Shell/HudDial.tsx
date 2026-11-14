"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const TURN = Math.PI * 2; // one full circle, in radians

// One arc of a ring: [radius, thickness, start, length]. Start and length are
// fractions of a full circle (0 to 1).
type Arc = [number, number, number, number];

// The rings of the HUD dial, from the centre out. Each ring is a list of arcs
// and turns at its own speed (negative = the other way). Edit freely.
const RINGS: { speed: number; arcs: Arc[] }[] = [
  { speed: 0.2, arcs: [[0.7, 0.01, 0, 1]] },
  { speed: -0.35, arcs: [[0.95, 0.09, 0, 0.22], [0.95, 0.09, 0.33, 0.22], [0.95, 0.09, 0.66, 0.22]] },
  { speed: 0.15, arcs: [[1.25, 0.02, 0.05, 0.4], [1.25, 0.02, 0.55, 0.4]] },
  { speed: -0.1, arcs: [[1.5, 0.05, 0.1, 0.12], [1.5, 0.05, 0.6, 0.3]] },
  // 60 short tick marks, like the edge of a dial
  { speed: 0.05, arcs: Array.from({ length: 60 }, (_, i): Arc => [1.8, 0.08, i / 60, 0.003]) },
];

// A slowly turning HUD dial in the theme colour, drawn with three.js. It is tilted
// back a little and sways, so it reads as 3D and not a flat picture. It fills
// whatever box `className` gives it; AppShell uses it in the bezel and, on the
// home page, behind the screen.
export default function HudDial({ color, className }: { color: string; className: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);

  useEffect(() => {
    const el = canvas.current!;
    const renderer = new THREE.WebGLRenderer({ canvas: el, alpha: true, antialias: true });
    // sharper on high-density screens, capped so phones don't overwork
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 20);
    camera.position.z = 5;

    // one faint material for every arc, so the theme sets a single colour
    const ink = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.22, side: THREE.DoubleSide });
    material.current = ink;
    const dial = new THREE.Group();
    const shapes: THREE.RingGeometry[] = [];
    const rings = RINGS.map(({ arcs }) => {
      const ring = new THREE.Group();
      for (const [radius, width, start, length] of arcs) {
        const shape = new THREE.RingGeometry(radius, radius + width, 64, 1, start * TURN, length * TURN);
        shapes.push(shape);
        ring.add(new THREE.Mesh(shape, ink));
      }
      dial.add(ring);
      return ring;
    });
    scene.add(dial);

    // keep the drawing size and camera in step with the canvas (also runs once at start)
    const observer = new ResizeObserver(() => {
      renderer.setSize(el.clientWidth, el.clientHeight, false);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    });
    observer.observe(el);

    // The browser pauses this loop by itself while the tab is hidden.
    renderer.setAnimationLoop((time) => {
      const seconds = time / 1000;
      rings.forEach((ring, i) => (ring.rotation.z = seconds * RINGS[i].speed));
      dial.rotation.x = -0.45 + Math.sin(seconds * 0.4) * 0.08; // tilted back, swaying
      dial.rotation.y = Math.sin(seconds * 0.3) * 0.15;
      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      observer.disconnect();
      for (const shape of shapes) shape.dispose();
      ink.dispose();
      renderer.dispose();
    };
  }, []);

  // follow the theme colour (runs after the effect above has made the material)
  useEffect(() => {
    material.current?.color.set(color);
  }, [color]);

  return <canvas ref={canvas} aria-hidden className={`pointer-events-none ${className}`} />;
}
