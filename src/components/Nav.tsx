import { Link } from "@tanstack/react-router";
import { Waves } from "lucide-react";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/ai-assistant", label: "AI Assistant" },
  { to: "/about", label: "About" },
] as const;

export function Nav() {
  return (
    <header className="sticky top-0 z-40 bg-navy text-navy-foreground border-b border-white/10 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid place-items-center w-8 h-8 rounded-md bg-primary/15 text-primary">
            <Waves className="w-4 h-4" />
          </span>
          <span className="text-lg">AquaSense</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3 py-2 rounded-md text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              activeProps={{ className: "px-3 py-2 rounded-md text-white bg-white/10" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
