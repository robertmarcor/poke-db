import { focus } from "./Shell/shared";

const variants = {
  primary: "bg-primary text-white enabled:hover:bg-primary/85",
  secondary:
    "border border-foreground/15 bg-background-accent text-foreground enabled:hover:bg-foreground/10",
  destructive: "bg-destructive text-white enabled:hover:bg-destructive/85",
};

const sizes = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4",
  lg: "h-12 px-6 text-lg",
};

type Props = React.ComponentProps<"button"> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

// <Button variant="destructive" size="sm" onClick={...}>Give up</Button>
// Takes every normal <button> prop; defaults to primary, md.
export default function Button({
  variant = "primary",
  size = "md",
  type = "button",
  className = "",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${focus} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
