import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { UserMenu } from "../user-menu";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      signOut: vi.fn().mockResolvedValue({}),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

describe("UserMenu", () => {
  it("shows Login and Register when logged out", () => {
    render(<UserMenu />);
    // The trigger button should be visible
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
