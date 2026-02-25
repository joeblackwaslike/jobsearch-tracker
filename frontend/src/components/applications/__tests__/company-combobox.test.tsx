import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { CompanyCombobox } from "../company-combobox";

// ---------------------------------------------------------------------------
// Mock the companies query module
// ---------------------------------------------------------------------------

const createCompanyMutateAsync = vi.fn();

vi.mock("@/lib/queries/companies", () => ({
  useSearchCompanies: () => ({
    data: [],
    isLoading: false,
  }),
  useCreateCompany: () => ({
    mutateAsync: createCompanyMutateAsync,
    isPending: false,
  }),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CompanyCombobox", () => {
  const onSelect = vi.fn();

  beforeEach(() => {
    onSelect.mockReset();
    createCompanyMutateAsync.mockReset();
  });

  it("renders with placeholder text when no value selected", () => {
    render(<CompanyCombobox value={null} onSelect={onSelect} />);

    expect(screen.getByText("Select company...")).toBeInTheDocument();
  });

  it("renders with selected company name when value is provided", () => {
    render(<CompanyCombobox value={{ id: "c1", name: "Acme Corp" }} onSelect={onSelect} />);

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  it("renders the combobox trigger as a button with combobox role", () => {
    render(<CompanyCombobox value={null} onSelect={onSelect} />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("is disabled when the disabled prop is true", () => {
    render(<CompanyCombobox value={null} onSelect={onSelect} disabled />);

    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("opens the popover and shows search input when clicked", async () => {
    const user = userEvent.setup();
    render(<CompanyCombobox value={null} onSelect={onSelect} />);

    await user.click(screen.getByRole("combobox"));

    expect(screen.getByPlaceholderText("Search companies...")).toBeInTheDocument();
  });
});
