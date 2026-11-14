import { notFound } from "next/navigation";
import Button from "../components/Button";

// Every design token and shared component on one page. Add new ones here as they are created.
// Dev only: the deployed site answers /Theme with the 404 page.
const colors = [
  { name: "background", swatch: "bg-background" },
  { name: "background-accent", swatch: "bg-background-accent" },
  { name: "foreground", swatch: "bg-foreground" },
  { name: "primary", swatch: "bg-primary" },
  { name: "accent", swatch: "bg-accent" },
  { name: "destructive", swatch: "bg-destructive" },
];

export default function ThemePage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <div className="grid gap-8">
      <section className="grid gap-3">
        <h2>Colours</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {colors.map((color) => (
            <li key={color.name} className="grid gap-1">
              <div className={`h-16 rounded-md border border-foreground/15 ${color.swatch}`} />
              <code className="text-sm">{color.name}</code>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-3">
        <h2>Typography</h2>
        <h1>Heading one</h1>
        <h2>Heading two</h2>
        <h3>Heading three</h3>
        <h4>Heading four</h4>
        <p className="max-w-prose">
          Body text. Bulbasaur can be seen napping in bright sunlight. There is a seed on its back.{" "}
          <span className="text-accent">Accent text</span> and <code>monospace text</code>.
        </p>
      </section>

      <section className="grid gap-3">
        <h2>Buttons</h2>
        {(["sm", "md", "lg"] as const).map((size) => (
          <div key={size} className="flex flex-wrap items-center gap-2">
            <code className="w-8 text-sm">{size}</code>
            <Button size={size}>Primary</Button>
            <Button size={size} variant="secondary">
              Secondary
            </Button>
            <Button size={size} variant="destructive">
              Destructive
            </Button>
            <Button size={size} disabled>
              Disabled
            </Button>
          </div>
        ))}
      </section>
    </div>
  );
}
