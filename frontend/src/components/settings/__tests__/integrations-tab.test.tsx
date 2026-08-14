import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { IntegrationsTab } from "../integrations-tab";

vi.mock("@/lib/queries/integrations", () => ({
  useIntegrations: () => ({ data: [], isLoading: false }),
  useUpsertIntegration: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteIntegration: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/lib/queries/settings", () => ({
  useSettings: () => ({
    data: { ai_features_enabled: false },
    isLoading: false,
  }),
}));

describe("IntegrationsTab", () => {
  it("renders the Integrations heading", () => {
    render(<IntegrationsTab />);
    expect(screen.getByText("Integrations")).toBeInTheDocument();
  });

  it("renders all four provider cards", () => {
    render(<IntegrationsTab />);
    expect(screen.getByText("Anthropic")).toBeInTheDocument();
    expect(screen.getByText("Apollo.io")).toBeInTheDocument();
    expect(screen.getByText("Google")).toBeInTheDocument();
    expect(screen.getByText("Inngest")).toBeInTheDocument();
  });

  it("shows coming soon badge for Apollo, Google, and Inngest", () => {
    render(<IntegrationsTab />);
    const badges = screen.getAllByText("Coming Soon");
    expect(badges).toHaveLength(3);
  });

  it("shows Anthropic card as active with description", () => {
    render(<IntegrationsTab />);
    expect(screen.getByText(/AI-powered company research/i)).toBeInTheDocument();
  });

  it("shows configure link pointing to AI settings tab", () => {
    render(<IntegrationsTab />);
    const configureLink = screen.getByRole("link", { name: /configure/i });
    expect(configureLink).toHaveAttribute("href", "/settings?tab=ai");
  });
});
