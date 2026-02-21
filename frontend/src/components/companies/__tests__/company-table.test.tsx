import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CompanyTable } from "../company-table";

const mockArchiveMutate = vi.fn();

vi.mock("@/lib/queries/companies", () => ({
  useArchiveCompany: () => ({ mutate: mockArchiveMutate, isPending: false }),
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
];

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

  it("calls onEdit when pencil icon is clicked", async () => {
    render(<CompanyTable data={companies} onEdit={onEdit} />);
    await userEvent.click(screen.getByTitle("Edit company"));
    expect(onEdit).toHaveBeenCalledWith(companies[0]);
  });

  it("calls useArchiveCompany.mutate when archive icon is clicked", async () => {
    render(<CompanyTable data={companies} onEdit={onEdit} />);
    await userEvent.click(screen.getByTitle("Archive company"));
    expect(mockArchiveMutate).toHaveBeenCalledWith("c1");
  });

  it("archive button click does not trigger row click (stops propagation)", async () => {
    render(<CompanyTable data={companies} onEdit={onEdit} />);
    await userEvent.click(screen.getByTitle("Archive company"));
    expect(onEdit).not.toHaveBeenCalled();
  });
});
