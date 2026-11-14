import { ViewOptionsProvider } from "./ViewOptions";

export default function PokedexLayout({ children }: { children: React.ReactNode }) {
  return <ViewOptionsProvider>{children}</ViewOptionsProvider>;
}
