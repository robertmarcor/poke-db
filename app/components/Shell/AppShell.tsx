"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { motion, useScroll, useTransform } from "motion/react";
import Footer from "../footer";
import Sidebar from "./Sidebar";
import { focus, spring } from "./shared";
import Link from "next/link";

// Accent colour per theme, in the order the theme button cycles through them.
// Add a line here to add a theme.
const themes: Record<string, string> = {
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#eab308",
  green: "#22c55e",
  blue: "#0ea5e9",
  purple: "#a855f7",
};
const themeNames = Object.keys(themes);

// The chosen theme is kept in localStorage. "storage" fires when another tab
// changes it; saveTheme fires it by hand so this tab updates too.
function subscribeTheme(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}
function readTheme() {
  const saved = localStorage.getItem("theme");
  return saved && saved in themes ? saved : themeNames[0];
}
function saveTheme(name: string) {
  localStorage.setItem("theme", name);
  window.dispatchEvent(new Event("storage"));
}

// Wide screens start with the menu open.
const wide = "(width >= 64rem)";
function subscribeWide(onChange: () => void) {
  const query = matchMedia(wide);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

// The device. Around the screen: the brand (lens = menu button, lights, logo) in
// the screen's top-left notch, the menu (Sidebar.tsx) on the left. The footer is
// inside the screen, after the page. The page title and theme button float over the top of the
// screen. Sizes and the screen shape live in shell.css and follow two variables set here:
//   --open   0 = menu closed, 1 = open (Motion springs it)
//   --accent the theme colour (the only colour the shell sets)
export default function AppShell({ children }: { children: React.ReactNode }) {
  // Both read browser-only values; on the server (and the first client render)
  // they fall back to the first theme and a narrow screen, so the HTML matches.
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => themeNames[0]);
  const isWide = useSyncExternalStore(
    subscribeWide,
    () => matchMedia(wide).matches,
    () => false,
  );
  // On mount, write the theme to localStorage, so the default is stored even
  // before the theme button is ever clicked (a saved theme is written back as is).
  useEffect(() => localStorage.setItem("theme", readTheme()), []);
  // the menu starts open on wide screens until the lens is clicked
  const [toggled, setToggled] = useState<boolean | null>(null);
  const open = toggled ?? isWide;
  const nextTheme = themeNames[(themeNames.indexOf(theme) + 1) % themeNames.length];
  const page = decodeURIComponent(usePathname().split("/")[1] || "home");
  // how far the screen is scrolled, 0 to 1; drives the indicator on its right edge
  const screen = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: screen });
  // 1.5rem = the pill's own height (h-6), so it stops at the bottom of its track
  const pillTop = useTransform(
    scrollYProgress,
    (v) => `calc(${v} * (100% - 1.5rem))`,
  );

  return (
    <motion.div
      className="shell h-dvh overflow-hidden p-1.5 sm:p-3"
      style={{ "--accent": themes[theme] } as React.CSSProperties}
      initial={false}
      animate={{ "--open": open ? 1 : 0 }}
      transition={spring}
    >
      <div className="relative h-full">
        <div className="absolute top-0 left-0 flex w-(--brand-w) items-center gap-3">
          <motion.button
            type="button"
            onClick={() => setToggled(!open)}
            aria-label="Menu"
            aria-expanded={open}
            aria-controls="side-nav"
            className={`lens size-12 shrink-0 cursor-pointer rounded-full ring-4 ring-slate-100 ring-inset ${focus}`}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            animate={{ "--glow": ["0px", "8px", "0px"] }}
            transition={{ ...spring, "--glow": { duration: 3, repeat: Infinity } }}
          />
          {/* decorative indicator lights, blinking one after another */}
          <span aria-hidden className="flex shrink-0 gap-1.5 max-sm:hidden">
            {["bg-red-500", "bg-yellow-400", "bg-green-500"].map((color, i) => (
              <motion.i
                key={color}
                className={`size-2.5 rounded-full ${color}`}
                animate={{ opacity: [0.35, 1, 0.35] }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.4,
                  repeat: Infinity,
                  repeatDelay: 3.2,
                }}
              />
            ))}
          </span>
          <Link href="/" className="font-bold whitespace-nowrap">
            R5PokèDB
          </Link>
        </div>

        <Sidebar open={open} />

        {/* pointer-events-none: this box is a plain rectangle that also covers the
            brand and menu; only the clipped screen and the controls take clicks */}
        <motion.div
          className="pointer-events-none relative ml-(--push) h-full *:pointer-events-auto"
          initial={{ opacity: 0, scaleY: 0.02 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={spring}
        >
          {/* empty copy of the screen shape that carries the glow, so the
              scrolling page itself never has to be filtered */}
          <div
            aria-hidden
            className="screen-glow pointer-events-none! absolute inset-0"
          >
            <div className="screen-frame h-full bg-(--accent)" />
          </div>

          <div className="screen-frame relative h-full bg-(--accent) p-0.5">
            {/* the footer is the last thing in the scroll: at the bottom of the
                screen on short pages, below the content on long ones */}
            <div
              ref={screen}
              className="screen flex h-full flex-col overflow-y-auto bg-background pt-(--notch-h) *:shrink-0"
            >
              <main className="flex flex-1 flex-col p-4">{children}</main>
              <footer className="mt-auto pb-4">
                <Footer />
              </footer>
            </div>
          </div>

          {/* scroll indicator (the real scrollbar is hidden in shell.css): a small
              pill that travels between the theme button and the chamfer */}
          <div
            aria-hidden
            className="pointer-events-none! absolute top-14 right-1.5 bottom-[calc(var(--cut)+0.5rem)] w-0.5"
          >
            <motion.div
              className="absolute h-6 w-full rounded-full bg-(--accent)/60"
              style={{ top: pillTop }}
            />
          </div>

          {/* current page, centred in the raised top of the screen */}
          <p className="pointer-events-none! absolute top-0 right-14 left-[calc(var(--notch-l)+var(--notch-h))] flex h-(--notch-h) items-center justify-center text-sm font-bold tracking-[0.3em] text-(--accent) uppercase">
            {page}
          </p>

          <motion.button
            type="button"
            aria-label={`Theme: ${theme}. Switch to ${nextTheme}`}
            onClick={() => saveTheme(nextTheme)}
            className={`absolute top-3 right-3 size-8 cursor-pointer rounded-full bg-(--accent) ${focus}`}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.88 }}
            transition={spring}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
