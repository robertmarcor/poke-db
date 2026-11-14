import type { Metadata } from "next";
import Link from "next/link";
import { focus } from "./components/Shell/shared";

export const metadata: Metadata = { title: "Not found" };

// Shown inside the device screen (AppShell) for any URL that matches no page.
export default function NotFound() {
  return (
    <div className="grid flex-1 place-items-center text-center">
      <div className="flex flex-col items-center gap-4">
        <p className="font-mono text-xs tracking-[0.3em] uppercase opacity-60">
          Entry No. ???
        </p>
        <p
          aria-hidden
          className="font-mono text-8xl leading-none font-bold text-(--accent) sm:text-9xl"
          style={{
            textShadow: "0 0 24px color-mix(in srgb, var(--accent) 50%, transparent)",
          }}
        >
          404
        </p>
        <h1 className="text-xl font-bold">No data found</h1>
        <p className="max-w-xs opacity-70">
          This page hasn&apos;t been discovered yet. It may have fled, or never
          existed.
          <span aria-hidden className="ml-1 animate-pulse font-mono">
            _
          </span>
        </p>
        <Link
          href="/"
          className={`mt-2 rounded-full bg-(--accent) px-5 py-2 font-bold text-black transition-transform hover:scale-105 active:scale-95 ${focus}`}
        >
          Return home
        </Link>
      </div>
    </div>
  );
}
