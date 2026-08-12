import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UrlImportDialog } from "../url-import-dialog";

// Mock the utility so we control fetch behavior
vi.mock("@/lib/url-import", () => ({
  fetchJobFromUrl: vi.fn(),
  isLikelyJobUrl: vi.fn(() => true),
}));

import { fetchJobFromUrl } from "@/lib/url-import";

describe("UrlImportDialog", () => {
  it("renders with URL input", () => {
    render(<UrlImportDialog open={true} onOpenChange={vi.fn()} onImport={vi.fn()} />);
    expect(screen.getByText("Import from URL")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("https://...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /import/i })).toBeInTheDocument();
  });

  it("shows loading state while fetching", async () => {
    // Use a promise that never resolves during the test so the dialog stays open
    let resolvePromise!: (value: { jobUrl: string }) => void;
    const pendingPromise = new Promise<{ jobUrl: string }>((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(fetchJobFromUrl).mockImplementation(() => pendingPromise);

    render(<UrlImportDialog open={true} onOpenChange={vi.fn()} onImport={vi.fn()} />);
    const input = screen.getByPlaceholderText("https://...");
    await userEvent.type(input, "https://jobs.example.com/swe");
    await userEvent.click(screen.getByRole("button", { name: /import/i }));
    expect(screen.getByText(/fetching/i)).toBeInTheDocument();

    // Resolve to allow cleanup
    resolvePromise({ jobUrl: "https://example.com" });
  });

  it("calls onImport with extracted data on success", async () => {
    const extracted = {
      jobUrl: "https://jobs.example.com/swe",
      position: "Software Engineer",
      companyName: "Acme Corp",
    };
    vi.mocked(fetchJobFromUrl).mockResolvedValue(extracted);
    const onImport = vi.fn();
    render(<UrlImportDialog open={true} onOpenChange={vi.fn()} onImport={onImport} />);
    const input = screen.getByPlaceholderText("https://...");
    await userEvent.type(input, "https://jobs.example.com/swe");
    await userEvent.click(screen.getByRole("button", { name: /import/i }));
    await waitFor(() => expect(onImport).toHaveBeenCalledWith(extracted));
  });

  it("calls onImport with just the url on fetch error", async () => {
    vi.mocked(fetchJobFromUrl).mockRejectedValue(new Error("network error"));
    const onImport = vi.fn();
    render(<UrlImportDialog open={true} onOpenChange={vi.fn()} onImport={onImport} />);
    const input = screen.getByPlaceholderText("https://...");
    await userEvent.type(input, "https://jobs.example.com/swe");
    await userEvent.click(screen.getByRole("button", { name: /import/i }));
    await waitFor(() =>
      expect(onImport).toHaveBeenCalledWith({
        jobUrl: "https://jobs.example.com/swe",
      }),
    );
  });
});
