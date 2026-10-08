import { ListChecks } from "lucide-react";

export function NavigationGlyph({ name = "virds" }: { name?: "virds" }) {
  return <ListChecks className="navigation-glyph is-virds" aria-hidden="true" strokeWidth={1.8} />;
}

