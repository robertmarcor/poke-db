// Shared by AppShell.tsx and Sidebar.tsx.

// Raise damping for less bounce, raise stiffness for more speed.
export const spring = { type: "spring", stiffness: 380, damping: 32 } as const;

// Keyboard focus ring in the theme colour.
export const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)";

// Dark frosted glass, for things that lie on top of a picture. Add your own border and text colour.
export const glass =
  "bg-black/40 shadow-[0_8px_32px_rgb(0_0_0/0.35),inset_0_1px_0_rgb(255_255_255/0.2)] backdrop-blur-xl backdrop-saturate-150";
