import { Montserrat, Geist_Mono } from "next/font/google";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppShell from "./components/Shell/AppShell";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pokedb.r5m4.dev"),
  // pages set their own title, which fills in %s
  title: { default: "R5PokèDB: Pokédex and Pokémon games", template: "%s | R5PokèDB" },
  description: "A Pokédex to look up any Pokémon, with games to test what you know.",
  // "./" is the address of the page being shown, without ?q and the like
  alternates: { canonical: "./" },
  openGraph: { siteName: "R5PokèDB", type: "website" },
};

// Colours the browser's own bar (Safari's tab bar, Chrome's toolbar on Android)
// like the page. These must match --background in globals.css. They follow the
// system setting; applyMode in AppShell.tsx overrides them when a mode is picked.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

// Runs before the first paint: puts a saved dark/light choice (see toggleMode in
// AppShell.tsx) on <html>, so the page never flashes the wrong mode. This is the
// pattern from Next's "Preventing flash before hydration" guide; React logs a
// "script tag" warning for it in development only.
const applySavedMode = `try{const m=localStorage.getItem("mode");if(m)document.documentElement.dataset.mode=m}catch{}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      // the script above changes <html> before React loads; that difference is expected
      suppressHydrationWarning
      className={`${montserrat.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: applySavedMode }} />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
