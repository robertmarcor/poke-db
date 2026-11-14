// Controls drawn with the games' UI kit (public/assets/whos-that/ui, styled in globals.css).
import { focus } from "../../components/Shell/shared";
import Sprite from "./Sprite";

// A switch with its label. When it is on, its track is in the theme colour.
export function Toggle({ on, onToggle, children }: { on: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`flex cursor-pointer items-center gap-2 rounded-full text-sm font-semibold ${focus}`}
    >
      <Sprite name={on ? "toggle-on" : "toggle-off"} tint={on ? "var(--accent)" : undefined} className="h-6 w-14" />
      {children}
    </button>
  );
}

// Glass artwork for primary, secondary and pressed actions (globals.css).
export function KitButton({ secondary, className = "", ...props }: React.ComponentProps<"button"> & { secondary?: boolean }) {
  return <button type="button" className={`kit-button ${secondary ? "secondary" : ""} ${focus} ${className}`} {...props} />;
}
