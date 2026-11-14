"use client";

import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import { motion, useScroll, useTransform } from "motion/react";
import Footer from "../footer";
import HudDial from "./HudDial";
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

// Dark or light mode. Until one is picked the site follows the system setting.
// A pick is saved in localStorage and put on <html data-mode>, which globals.css
// reads; the script in layout.tsx puts it back before the first paint on later visits.
// shortcut: other open tabs keep their mode until reloaded
function toggleMode() {
  const current =
    localStorage.getItem("mode") ??
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const next = current === "dark" ? "light" : "dark";
  localStorage.setItem("mode", next);
  applyMode(next);
}

// Puts a picked mode on the page, and makes the browser's own bar (Safari's tab
// bar, Chrome's toolbar on Android) match: the theme-color tags from layout.tsx
// follow the system setting, so point them at the picked mode's background instead.
// shortcut: on a reload the bar shows the system's colour until the app has loaded
function applyMode(mode: string) {
  document.documentElement.dataset.mode = mode;
  const background = getComputedStyle(document.documentElement).getPropertyValue("--background");
  for (const tag of document.querySelectorAll('meta[name="theme-color"]')) {
    tag.removeAttribute("media");
    tag.setAttribute("content", background);
  }
}

// First part of the URL, shown at the top of the screen. On dynamic routes
// (/Pokedex/[id]) the URL is only known per request, so this sits in its own
// component behind <Suspense> and the rest of the shell can still be prerendered.
// On a page inside a section (/Pokedex/6) it is a link back to that section.
// shortcut: goes to the section's front page, not the filters or page you came from (the browser's back button does that); remember the last list address if that gets annoying
function PageTitle() {
  const [section, inside] = usePathname().split("/").slice(1);
  const name = decodeURIComponent(section || "home");
  if (!inside) return name;
  return (
    // drawn as a button (outline, fill, arrow), so it reads as "back" and not as a title
    <Link
      href={`/${section}`}
      aria-label={`Back to ${name}`}
      className={`pointer-events-auto flex items-center gap-2 rounded-full border border-(--accent)/60 bg-(--accent)/15 py-1 pr-4 pl-3 hover:bg-(--accent)/30 ${focus}`}
    >
      <svg aria-hidden viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-3">
        <path d="M20 12H5M11 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {name}
    </Link>
  );
}

// The screen's background, behind the scrolling page (which is see-through). The
// home page gets the HUD dial on it; every other page gets it plain, so its
// content has a clean screen. Reads the URL, so like PageTitle it sits behind
// <Suspense>, with the plain version as fallback.
const backdrop = "screen-inner absolute inset-0.5 bg-background";
function ScreenBackdrop({ color }: { color: string }) {
  const home = usePathname() === "/";
  return <div className={backdrop}>{home && <HudDial color={color} className="size-full" />}</div>;
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
  // Re-apply a saved mode once the app has loaded: this colours the browser's bar,
  // and in development puts back the data-mode that React's Strict Mode remount wipes.
  useLayoutEffect(() => {
    const mode = localStorage.getItem("mode");
    if (mode) applyMode(mode);
  }, []);
  // the menu starts open on wide screens until the lens is clicked
  const [toggled, setToggled] = useState<boolean | null>(null);
  const open = toggled ?? isWide;
  // The "click the lens" hint (bounce + bubble) shows until the lens is clicked;
  // "Don't show again" saves lensHint=off in localStorage and it stays away.
  // Off on the server, so it never flashes for people who dismissed it.
  const hintOff = useSyncExternalStore(
    subscribeTheme,
    () => localStorage.getItem("lensHint") === "off",
    () => true,
  );
  const showHint = toggled === null && !hintOff;
  // whether the theme picker (right-click on the theme button) is showing
  const [picking, setPicking] = useState(false);
  // false while the screen is still opening on page load
  const [opened, setOpened] = useState(false);
  // the theme being hovered (or focused) in the picker, shown as a live preview
  const [preview, setPreview] = useState<string | null>(null);
  const shownTheme = (picking && preview) || theme;
  const nextTheme = themeNames[(themeNames.indexOf(theme) + 1) % themeNames.length];
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
      className="shell relative h-dvh overflow-hidden p-1.5 sm:p-3"
      style={{ "--accent": themes[shownTheme] } as React.CSSProperties}
      initial={false}
      animate={{ "--open": open ? 1 : 0 }}
      transition={spring}
    >
      {/* the bezel's dial, on every page: at the bottom of the menu column, so it
          shows while the menu is open and the screen covers it when it is closed */}
      <HudDial
        color={themes[shownTheme]}
        className="absolute bottom-1.5 left-1.5 size-[calc(var(--menu-w)-0.75rem)] sm:bottom-3 sm:left-3"
      />
      <div className="relative h-full">
        <div className="absolute top-0 left-0 flex w-(--brand-w) items-center gap-3">
          <motion.button
            type="button"
            onClick={() => setToggled(!open)}
            aria-label="Menu"
            aria-expanded={open}
            aria-controls="side-nav"
            // lens-hint: a "press me" bounce (shell.css)
            className={`lens ${showHint ? "lens-hint" : ""} size-12 shrink-0 cursor-pointer rounded-full ring-4 ring-slate-100 ring-inset ${focus}`}
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
          className={`pointer-events-none relative ml-(--push) h-full *:pointer-events-auto ${opened ? "" : "lid-reveal"}`}
          // Page-load opening. Everything in here (the screen, its outline and
          // glow, the title and controls) starts hidden; .lid-reveal in shell.css
          // uncovers it from the middle outward. --lid is how far each edge of the
          // uncovered band is from its side: 50% = closed, 0% = fully open.
          initial={{ "--lid": "50%" }}
          animate={{ "--lid": "0%" }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.6, 0, 0.2, 1] }}
          onAnimationComplete={() => setOpened(true)}
        >
          {/* the two edges of the opening, drawn as accent lines: one line across
              the middle while closed, then they part. Removed once open. */}
          {!opened && (
            <>
              <div className="pointer-events-none! absolute inset-x-0 top-(--lid) z-10 h-0.5 bg-(--accent)" />
              <div className="pointer-events-none! absolute inset-x-0 bottom-(--lid) z-10 h-0.5 bg-(--accent)" />
            </>
          )}
          {/* empty copy of the screen shape that carries the glow, so the
              scrolling page itself never has to be filtered */}
          <div
            aria-hidden
            className="screen-glow pointer-events-none! absolute inset-0"
          >
            <div className="screen-frame h-full bg-(--accent)" />
          </div>

          <div className="screen-frame relative h-full bg-(--accent) p-0.5">
            <Suspense fallback={<div className={backdrop} />}>
              <ScreenBackdrop color={themes[shownTheme]} />
            </Suspense>
            {/* the footer is the last thing in the scroll: at the bottom of the
                screen on short pages, below the content on long ones */}
            <div
              ref={screen}
              className="screen relative flex h-full flex-col overflow-y-auto pt-(--notch-h) *:shrink-0"
            >
              <main className="flex flex-1 flex-col p-4">{children}</main>
              <footer className="mt-auto pb-4">
                <Footer />
              </footer>
            </div>
          </div>

          {/* glass: a see-through sheen over the screen, cut to the same shape;
              clicks and scrolling pass straight through it */}
          <div aria-hidden className="screen-frame glass pointer-events-none! absolute inset-0" />

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
          <p className="pointer-events-none! absolute top-0 right-22 left-[calc(var(--notch-l)+var(--notch-h))] flex h-(--notch-h) items-center justify-center text-sm font-bold tracking-[0.3em] text-(--accent) uppercase">
            <Suspense>
              <PageTitle />
            </Suspense>
          </p>

          {/* display controls, in one pill: dark/light switch, then the theme button */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 rounded-full border border-(--accent)/40 bg-background/70 p-1">
            <motion.button
              type="button"
              aria-label="Switch between dark and light mode"
              title="Dark / light mode"
              onClick={toggleMode}
              className={`grid size-7 cursor-pointer place-items-center rounded-full hover:bg-foreground/10 ${focus}`}
              whileTap={{ scale: 0.88 }}
              transition={spring}
            >
              {/* half-filled circle: the usual "contrast" icon, the same in both modes */}
              <svg aria-hidden viewBox="0 0 24 24" className="size-5">
                <circle cx="12" cy="12" r="9" className="fill-none stroke-current stroke-2" />
                <path d="M12 3a9 9 0 0 0 0 18z" className="fill-current" />
              </svg>
            </motion.button>
            <motion.button
              type="button"
              aria-label={`Theme: ${theme}. Switch to ${nextTheme}`}
              title="Click for the next theme, right-click to pick one"
              aria-expanded={picking}
              onClick={() => saveTheme(nextTheme)}
              onContextMenu={(e) => {
                e.preventDefault();
                setPreview(null);
                setPicking(!picking);
              }}
              className={`gem size-7 cursor-pointer rounded-full border-2 border-white/60 ${focus}`}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.88 }}
              transition={spring}
            />
          </div>

          {/* theme picker: opens on right-click; closes on a pick, Escape, or when
              focus leaves it (a click anywhere else) */}
          {picking && (
            <div
              role="group"
              aria-label="Pick a theme"
              onPointerLeave={() => setPreview(null)}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setPicking(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setPicking(false);
              }}
              className="absolute top-13 right-3 flex gap-2 rounded-full border border-current/25 bg-background p-2"
            >
              {themeNames.map((name) => (
                <button
                  key={name}
                  type="button"
                  autoFocus={name === theme}
                  onPointerEnter={() => setPreview(name)}
                  onFocus={() => setPreview(name)}
                  aria-label={`${name} theme`}
                  aria-pressed={name === theme}
                  onClick={() => {
                    saveTheme(name);
                    setPicking(false);
                  }}
                  style={{ background: themes[name] }}
                  className="size-6 cursor-pointer rounded-full ring-offset-2 ring-offset-background focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current aria-pressed:ring-2 aria-pressed:ring-current"
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* hint bubble under the lens, with a small arrow pointing up at it */}
        {showHint && (
          <motion.div
            className="absolute top-15 left-0 rounded-lg bg-(--primary) px-3 py-2 text-white shadow-lg before:absolute before:-top-1 before:left-4.5 before:size-3 before:rotate-45 before:bg-(--primary)"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
          >
            <p className="text-sm font-bold">Click Lens for menu</p>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem("lensHint", "off");
                window.dispatchEvent(new Event("storage"));
              }}
              className="cursor-pointer text-xs underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Don&apos;t show again ✕
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
