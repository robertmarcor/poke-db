import React from "react";
import { motion } from "motion/react";
import { focus, spring } from "./shared";
import Link from "next/link";

// shortcut: placeholder links, replace with real routes when they exist
const links = [
  { Label: "Home", href: "/" },
  { Label: "Pokedex", href: "/Pokedex" },
  { Label: "Games", href: "/Games" },
];

type Props = {
  // whether the menu is open; AppShell owns this and the lens button toggles it
  open: boolean;
};

// One row of the side menu; rows slide in one after another when it opens.
function MenuItem({
  open,
  i,
  className,
  children,
}: {
  open: boolean;
  i: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={className}
      initial={false}
      animate={{ opacity: open ? 1 : 0, x: open ? 0 : -16 }}
      transition={{ ...spring, delay: open ? 0.06 + i * 0.05 : 0 }}
    >
      {children}
    </motion.div>
  );
}

// The side menu's contents. Where it sits and how wide it is come from AppShell
// and shell.css (--menu-w); everything inside the <nav> is free to change.
// Wrap each row in <MenuItem> (with the next i) to keep the slide-in animation.
function Sidebar({ open }: Props) {
  return (
    <nav
      id="side-nav"
      inert={!open}
      className="absolute top-(--notch-h) bottom-0 left-0 flex w-(--menu-w) flex-col gap-1 pt-2 pr-3"
    >
      <MenuItem open={open} i={0} className="mb-2">
        {/* shortcut: search does nothing yet, wire it up when there is something to search */}
        <form role="search" onSubmit={(e) => e.preventDefault()}>
          <input
            type="search"
            aria-label="Search"
            placeholder="Search"
            className={`h-9 w-full rounded-full border border-current/25 px-4 text-sm ${focus}`}
          />
        </form>
      </MenuItem>
      {links.map((item, i) => (
        <MenuItem key={item.Label} open={open} i={i + 1}>
          <Link
            href={item.href}
            className={`block rounded-md px-3 py-2 hover:bg-foreground/10 ${focus}`}
          >
            {item.Label}
          </Link>
        </MenuItem>
      ))}
    </nav>
  );
}

export default Sidebar;
