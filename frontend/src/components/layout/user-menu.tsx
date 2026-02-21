import type { User } from "@supabase/supabase-js";
import { useNavigate } from "@tanstack/react-router";
import { LogOutIcon, SettingsIcon, UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";

type AuthModal = "login" | "signup" | null;

function getUserInitials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [authModal, setAuthModal] = useState<AuthModal>(null);
  const navigate = useNavigate();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase.auth]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="User menu">
            {user ? (
              <Avatar className="size-7">
                <AvatarFallback className="text-xs">
                  {getUserInitials(user.email ?? "?")}
                </AvatarFallback>
              </Avatar>
            ) : (
              <UserIcon className="size-5" />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          {user ? (
            <>
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium truncate">{user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/settings?tab=general">
                  <SettingsIcon className="mr-2 size-4" />
                  Settings
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOutIcon className="mr-2 size-4" />
                Sign Out
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={() => setAuthModal("login")}>Sign In</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAuthModal("signup")}>Register</DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Login Modal */}
      <Dialog open={authModal === "login"} onOpenChange={(o) => !o && setAuthModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign In</DialogTitle>
            <DialogDescription>Sign in to your THRIVE account.</DialogDescription>
          </DialogHeader>
          <LoginForm onSuccess={() => setAuthModal(null)} />
        </DialogContent>
      </Dialog>

      {/* Signup Modal */}
      <Dialog open={authModal === "signup"} onOpenChange={(o) => !o && setAuthModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Account</DialogTitle>
            <DialogDescription>Start tracking your job search.</DialogDescription>
          </DialogHeader>
          <SignupForm onSuccess={() => setAuthModal(null)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
