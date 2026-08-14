import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { AiDiscoveryBanner } from "../ai-discovery-banner";

const mockMutate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    search,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
    search?: Record<string, string>;
    [key: string]: unknown;
  }) => {
    const params = search ? `?${new URLSearchParams(search).toString()}` : "";
    return (
      <a href={`${to}${params}`} {...props}>
        {children}
      </a>
    );
  },
}));

vi.mock("@/lib/queries/settings", () => ({
  useSettings: vi.fn(() => ({
    data: {
      ai_features_enabled: false,
      ai_setup_banner_dismissed: false,
    },
    isLoading: false,
  })),
  useUpdateSettings: () => ({ mutate: mockMutate, isPending: false }),
}));

describe("AiDiscoveryBanner", () => {
  it("renders when AI is disabled and banner not dismissed", () => {
    render(<AiDiscoveryBanner />);
    expect(screen.getByText(/AI-Powered/i)).toBeInTheDocument();
  });

  it("shows a link to AI settings", () => {
    render(<AiDiscoveryBanner />);
    const link = screen.getByRole("link", { name: /set up/i });
    expect(link).toHaveAttribute("href", "/settings?tab=ai");
  });

  it("returns null when AI is already enabled", async () => {
    const { useSettings } = await import("@/lib/queries/settings");
    vi.mocked(useSettings).mockReturnValue({
      data: { ai_features_enabled: true, ai_setup_banner_dismissed: false },
      isLoading: false,
    } as ReturnType<typeof useSettings>);

    const { container } = render(<AiDiscoveryBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when banner has been dismissed", async () => {
    const { useSettings } = await import("@/lib/queries/settings");
    vi.mocked(useSettings).mockReturnValue({
      data: { ai_features_enabled: false, ai_setup_banner_dismissed: true },
      isLoading: false,
    } as ReturnType<typeof useSettings>);

    const { container } = render(<AiDiscoveryBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null while loading", async () => {
    const { useSettings } = await import("@/lib/queries/settings");
    vi.mocked(useSettings).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useSettings>);

    const { container } = render(<AiDiscoveryBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("calls dismiss mutation when dismiss button clicked", async () => {
    const { useSettings } = await import("@/lib/queries/settings");
    vi.mocked(useSettings).mockReturnValue({
      data: { ai_features_enabled: false, ai_setup_banner_dismissed: false },
      isLoading: false,
    } as ReturnType<typeof useSettings>);

    render(<AiDiscoveryBanner />);
    const dismissButton = screen.getByRole("button", { name: /dismiss/i });
    dismissButton.click();
    expect(mockMutate).toHaveBeenCalledWith({
      ai_setup_banner_dismissed: true,
    });
  });
});
