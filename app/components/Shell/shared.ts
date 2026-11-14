// Shared by AppShell.tsx and Sidebar.tsx.

// Raise damping for less bounce, raise stiffness for more speed.
export const spring = { type: "spring", stiffness: 380, damping: 32 } as const;

// Keyboard focus ring in the theme colour.
export const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)";
