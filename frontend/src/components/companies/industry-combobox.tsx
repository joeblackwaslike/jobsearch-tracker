import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";
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
import { cn } from "@/lib/utils";

const INDUSTRY_OPTIONS = [
  "Analytics",
  "Engineering, Product and Design",
  "Finance and Accounting",
  "Human Resources",
  "Infrastructure",
  "Legal",
  "Marketing",
  "Office Management",
  "Operations",
  "Productivity",
  "Recruiting and Talent",
  "Retail",
  "Sales",
  "Security",
  "Supply Chain and Logistics",
  "Asset Management",
  "Banking and Exchange",
  "Consumer Finance",
  "Credit and Lending",
  "Insurance",
  "Payments",
  "Apparel and Cosmetics",
  "Consumer Electronics",
  "Content",
  "Food and Beverage",
  "Gaming",
  "Home and Personal",
  "Job and Career Services",
  "Social",
  "Transportation Services",
  "Travel, Leisure and Tourism",
  "Virtual and Augmented Reality",
  "Consumer Health and Wellness",
  "Diagnostics",
  "Drug Discovery and Delivery",
  "Healthcare IT",
  "Healthcare Services",
  "Industrial Bio",
  "Medical Devices",
  "Therapeutics",
  "Education",
  "Agriculture",
  "Automotive",
  "Aviation and Space",
  "Climate",
  "Defense",
  "Drones",
  "Energy",
  "Manufacturing and Robotics",
  "Construction",
  "Housing and Real Estate",
  "Government",
] as const;

interface IndustryComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function IndustryCombobox({ value, onChange }: IndustryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = INDUSTRY_OPTIONS.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-label="Industry"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{value || "Select industry"}</span>
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search industry..." value={search} onValueChange={setSearch} />
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>No industry found.</CommandEmpty>
            <CommandGroup>
              {filtered.map((opt) => (
                <CommandItem
                  key={opt}
                  value={opt}
                  onSelect={(val) => {
                    onChange(val);
                    setSearch("");
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn("mr-2 size-4", value === opt ? "opacity-100" : "opacity-0")}
                  />
                  {opt}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
