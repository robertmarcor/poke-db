type Props = {
  // file name in public/assets/whos-that/ui, without .webp
  name: string;
  // The sprites are gray; this colours them. Leave it out to keep them silver.
  tint?: string;
  // give it a size here, e.g. "size-6"
  className: string;
};

// One picture from the Who's That UI kit: a heart, the shield, a switch...
// Decoration only, so say what it means in text next to it. Styled by .kit-icon in globals.css.
export default function Sprite({ name, tint, className }: Props) {
  const style = { "--sprite": `url(/assets/whos-that/ui/${name}.webp)`, "--tint": tint } as React.CSSProperties;
  return <span aria-hidden className={`kit-icon ${className}`} style={style} />;
}
