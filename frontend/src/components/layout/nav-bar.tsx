import { Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeToggle } from "./theme-toggle";

const navLinks = [
  { to: "/applications", label: "Applications" },
  { to: "/interviews", label: "Interviews" },
  { to: "/documents", label: "Documents" },
  { to: "/companies", label: "Companies" },
] as const;

export function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-6">
        {/* Left: Logo */}
        <Link
          to="/dashboard"
          className="mr-8 text-lg font-bold tracking-wider"
        >
          THRIVE
        </Link>

        {/* Center: Navigation links */}
        <nav className="flex flex-1 items-center gap-1">
          {navLinks.map(({ to, label }) => (
            <Button key={to} variant="ghost" size="sm" asChild>
              <Link
                to={to}
                activeProps={{
                  className: "text-foreground bg-accent",
                }}
                inactiveProps={{
                  className: "text-muted-foreground",
                }}
              >
                {label}
              </Link>
            </Button>
          ))}
        </nav>

        {/* Right: Theme toggle + Settings */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/settings" aria-label="Settings">
                  <Settings className="size-5" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
