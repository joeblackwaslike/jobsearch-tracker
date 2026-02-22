import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

const navLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/applications", label: "Applications" },
  { to: "/interviews", label: "Interviews" },
  { to: "/documents", label: "Documents" },
  { to: "/companies", label: "Companies" },
] as const;

export function NavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-4 md:px-6">
        {/* Left: Logo */}
        <Link to="/dashboard" className="mr-8 text-lg font-bold tracking-wider">
          TRACKER
        </Link>

        {/* Center: Navigation links (desktop only) */}
        <nav className="hidden md:flex flex-1 items-center gap-1">
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

        {/* Right: Theme toggle + User menu (desktop only) */}
        <div className="hidden md:flex items-center gap-1">
          <ThemeToggle />
          <UserMenu />
        </div>

        {/* Mobile: hamburger menu button */}
        <div className="ml-auto md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
        </div>

        {/* Mobile: Sheet drawer */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="right" className="w-[280px]">
            <SheetHeader>
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-2">
              {navLinks.map(({ to, label }) => (
                <Button key={to} variant="ghost" size="sm" className="justify-start" asChild>
                  <Link
                    to={to}
                    activeProps={{
                      className: "text-foreground bg-accent",
                    }}
                    inactiveProps={{
                      className: "text-muted-foreground",
                    }}
                    onClick={() => setMobileOpen(false)}
                  >
                    {label}
                  </Link>
                </Button>
              ))}
            </nav>
            <div className="mt-auto border-t px-2 pt-4 pb-2 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
              <UserMenu />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
