import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { type Company, useCreateCompany, useSearchCompanies } from "@/lib/queries/companies";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CompanyComboboxProps {
  value: Pick<Company, "id" | "name"> | null;
  onSelect: (company: Pick<Company, "id" | "name">) => void;
  initialSearchText?: string;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CompanyCombobox({
  value,
  onSelect,
  initialSearchText = "",
  disabled = false,
}: CompanyComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState(initialSearchText);
  const [debouncedTerm, setDebouncedTerm] = useState(initialSearchText);

  // Debounce search term (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Sync initialSearchText changes
  useEffect(() => {
    if (initialSearchText) {
      setSearchText(initialSearchText);
    }
  }, [initialSearchText]);

  const { data: companies, isLoading } = useSearchCompanies(debouncedTerm);
  const createCompany = useCreateCompany();

  const hasExactMatch =
    companies?.some((c) => c.name.toLowerCase() === searchText.toLowerCase()) ?? false;

  const handleSelect = useCallback(
    (company: Pick<Company, "id" | "name">) => {
      onSelect(company);
      setOpen(false);
    },
    [onSelect],
  );

  const handleCreate = useCallback(async () => {
    const result = await createCompany.mutateAsync({ name: searchText });
    handleSelect({ id: result.id, name: result.name });
  }, [createCompany, searchText, handleSelect]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value ? value.name : "Select company..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search companies..."
            value={searchText}
            onValueChange={setSearchText}
          />
          <CommandList>
            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}

            {!isLoading && debouncedTerm.length >= 2 && !companies?.length && !searchText && (
              <CommandEmpty>No companies found.</CommandEmpty>
            )}

            {companies && companies.length > 0 && (
              <CommandGroup>
                {companies.map((company) => (
                  <CommandItem
                    key={company.id}
                    value={company.id}
                    onSelect={() => handleSelect(company)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value?.id === company.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {company.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {searchText.length >= 1 && !hasExactMatch && (
              <CommandGroup>
                <CommandItem onSelect={handleCreate} disabled={createCompany.isPending}>
                  {createCompany.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Create &quot;{searchText}&quot;
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
