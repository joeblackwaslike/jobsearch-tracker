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

const SOURCE_OPTIONS = [
  "blind",
  "builtin",
  "dice",
  "github",
  "glassdoor",
  "google jobs",
  "google search",
  "indeed",
  "levels",
  "linkedin",
  "monster",
  "other",
  "referral",
  "theirstack",
  "welcome to the jungle",
  "wellfound",
  "workatastartup",
  "ziprecruiter",
];

interface SourceComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function SourceCombobox({ value, onChange }: SourceComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = SOURCE_OPTIONS.filter((opt) => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{value || "Select or type source..."}</span>
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search or type source..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>
              <button
                type="button"
                className="px-3 py-2 text-sm w-full text-left hover:bg-accent"
                onClick={() => {
                  onChange(search);
                  setSearch("");
                  setOpen(false);
                }}
              >
                Use &ldquo;{search}&rdquo;
              </button>
            </CommandEmpty>
            <CommandGroup>
              {filtered.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={(val) => {
                    onChange(val);
                    setSearch("");
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn("mr-2 size-4", value === option ? "opacity-100" : "opacity-0")}
                  />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
