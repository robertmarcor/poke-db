"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

// How a Pokémon page is shown. Kept above the pages (app/Pokedex/layout.tsx),
// so the choices stay when you go to the next or previous Pokémon.
const defaults = { hd: true, shiny: false, segment: 0 };
type Options = typeof defaults;

const Context = createContext<[Options, (change: Partial<Options>) => void]>([defaults, () => {}]);

export function ViewOptionsProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState(defaults);
  return (
    <Context value={[options, (change) => setOptions((old) => ({ ...old, ...change }))]}>{children}</Context>
  );
}

// const [{ hd, shiny }, set] = useViewOptions();  set({ shiny: true });
export const useViewOptions = () => useContext(Context);
