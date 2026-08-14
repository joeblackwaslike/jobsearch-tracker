import { describe, expect, it, vi } from "vitest";
import type { TaskWithApplication } from "@/lib/queries/tasks";
import { render, screen } from "@/test/test-utils";
import { InboxList } from "../inbox-list";

vi.mock("@tanstack/react-router", () => ({
  // biome-ignore lint/suspicious/noExplicitAny: mock component
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/queries/tasks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/queries/tasks")>();
  return {
    ...actual,
    useApproveTask: () => ({ mutate: vi.fn(), isPending: false }),
    useTerminateTask: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

function makeTask(overrides: Partial<TaskWithApplication> = {}): TaskWithApplication {
  return {
    id: "task-1",
    user_id: "user-1",
    application_id: "app-1",
    event_id: null,
    type: "company_research",
    status: "awaiting_approval",
    payload: {},
    metadata: {},
    termination_reason: null,
    document_id: "doc-1",
    created_at: "2026-08-12T10:00:00Z",
    updated_at: "2026-08-12T10:00:00Z",
    application: {
      id: "app-1",
      position: "Senior Engineer",
      company: { id: "comp-1", name: "Acme Corp" },
    },
    ...overrides,
  };
}

describe("InboxList", () => {
  it("renders empty state when no tasks", () => {
    render(<InboxList tasks={[]} isLoading={false} />);
    expect(screen.getByText(/no pending tasks/i)).toBeInTheDocument();
  });

  it("renders loading state", () => {
    render(<InboxList tasks={[]} isLoading={true} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows tasks needing attention in awaiting_approval status", () => {
    const tasks = [makeTask({ status: "awaiting_approval" })];
    render(<InboxList tasks={tasks} isLoading={false} />);
    expect(screen.getByText(/needs your attention/i)).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText(/Senior Engineer/)).toBeInTheDocument();
  });

  it("shows in-progress tasks in running/pending status", () => {
    const tasks = [makeTask({ id: "task-2", status: "running" })];
    render(<InboxList tasks={tasks} isLoading={false} />);
    expect(screen.getByText(/in progress/i)).toBeInTheDocument();
  });

  it("shows completed/terminated tasks in a separate section", () => {
    const tasks = [makeTask({ id: "task-3", status: "completed" })];
    render(<InboxList tasks={tasks} isLoading={false} />);
    expect(screen.getByText(/recently completed/i)).toBeInTheDocument();
  });

  it("groups tasks into correct sections", () => {
    const tasks = [
      makeTask({ id: "t1", status: "awaiting_approval" }),
      makeTask({ id: "t2", status: "running" }),
      makeTask({ id: "t3", status: "completed" }),
    ];
    render(<InboxList tasks={tasks} isLoading={false} />);
    expect(screen.getByText(/needs your attention/i)).toBeInTheDocument();
    expect(screen.getByText(/in progress/i)).toBeInTheDocument();
    expect(screen.getByText(/recently completed/i)).toBeInTheDocument();
  });

  it("shows task type label", () => {
    const tasks = [makeTask({ type: "company_research" })];
    render(<InboxList tasks={tasks} isLoading={false} />);
    expect(screen.getByText("Company Research")).toBeInTheDocument();
  });
});
