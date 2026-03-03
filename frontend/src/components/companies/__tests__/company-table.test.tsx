import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Company } from "@/lib/queries/companies";
import { CompanyTable } from "../company-table";

vi.mock("@/lib/queries/companies", () => ({
  useArchiveCompany: () => ({ mutate: vi.fn(), isPending: false }),
}));

const companies = [
  {
    id: "c1",
    user_id: "u1",
    name: "Acme Corp",
    industry: "Tech",
    location: "Remote",
    size: "50-200",
    researched: true,
    tags: ["startup", "saas"],
    ratings: null,
    website: null,
    notes: null,
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
] as unknown as Company[];

describe("CompanyTable", () => {
  const onEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders company rows", () => {
    render(<CompanyTable data={companies} onEdit={onEdit} />);
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Tech")).toBeInTheDocument();
  });

  it("calls onEdit when row is clicked", async () => {
    render(<CompanyTable data={companies} onEdit={onEdit} />);
    await userEvent.click(screen.getByText("Acme Corp"));
    expect(onEdit).toHaveBeenCalledWith(companies[0]);
  });

  it("does not render edit or archive action buttons", () => {
    render(<CompanyTable data={companies} onEdit={onEdit} />);
    expect(screen.queryByTitle("Edit company")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Archive company")).not.toBeInTheDocument();
  });
});
