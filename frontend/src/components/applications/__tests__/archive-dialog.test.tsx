import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@/test/test-utils";
import { ArchiveDialog } from "../archive-dialog";

// ---------------------------------------------------------------------------
// Mock the applications query module
// ---------------------------------------------------------------------------

const mutateAsyncMock = vi.fn();

vi.mock("@/lib/queries/applications", () => ({
  useArchiveApplication: () => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  }),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ArchiveDialog", () => {
  beforeEach(() => {
    mutateAsyncMock.mockReset();
    mutateAsyncMock.mockResolvedValue({});
  });

  it("renders the archive trigger button", () => {
    render(<ArchiveDialog applicationId="app-1" />);
    expect(
      screen.getByTitle("Archive application")
    ).toBeInTheDocument();
  });

  it("renders three archive reasons when opened", async () => {
    const user = userEvent.setup();
    render(<ArchiveDialog applicationId="app-1" />);

    await user.click(screen.getByTitle("Archive application"));

    expect(screen.getByText("Received rejection")).toBeInTheDocument();
    expect(screen.getByText("No response")).toBeInTheDocument();
    expect(screen.getByText("No longer interested")).toBeInTheDocument();
  });

  it("calls mutateAsync with the correct reason when 'Received rejection' is clicked", async () => {
    const onArchived = vi.fn();
    const user = userEvent.setup();

    render(
      <ArchiveDialog applicationId="app-1" onArchived={onArchived} />
    );

    await user.click(screen.getByTitle("Archive application"));
    await user.click(screen.getByText("Received rejection"));

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        id: "app-1",
        archived_reason: "Received rejection",
      });
    });

    await waitFor(() => {
      expect(onArchived).toHaveBeenCalled();
    });
  });

  it("calls mutateAsync with 'No response' reason", async () => {
    const user = userEvent.setup();

    render(<ArchiveDialog applicationId="app-2" />);

    await user.click(screen.getByTitle("Archive application"));
    await user.click(screen.getByText("No response"));

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        id: "app-2",
        archived_reason: "No response",
      });
    });
  });

  it("calls mutateAsync with 'No longer interested' reason", async () => {
    const user = userEvent.setup();

    render(<ArchiveDialog applicationId="app-3" />);

    await user.click(screen.getByTitle("Archive application"));
    await user.click(screen.getByText("No longer interested"));

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        id: "app-3",
        archived_reason: "No longer interested",
      });
    });
  });
});
